# BananaAnything API 调用文档（JavaScript 版）

> 本文档基于 Python 项目 `BananaAnything` 的 API 调用逻辑整理，供新 Webapp 项目使用。

---

## 一、API 概览

| 功能       | 方法   | Endpoint                                                      |
| ---------- | ------ | ------------------------------------------------------------- |
| 提交渲染任务 | `POST` | `https://api.wuyinkeji.com/api/async/image_nanoBanana_pro`    |
| 查询任务状态 | `GET`  | `https://api.wuyinkeji.com/api/async/detail`                  |
| 下载结果图像 | `GET`  | 从查询响应的 `data.result[]` 中获取 URL 直接请求              |

---

## 二、认证方式

使用 **API Key** 认证，支持两种传递方式：

### 方式一：请求头传递（推荐）

```js
headers: {
  'Authorization': '<YOUR_API_KEY>',
  'Content-Type': 'application/json'
}
```

### 方式二：URL 参数传递

```
?key=<YOUR_API_KEY>
```

> **安全提示**：Webapp 中请勿在前端硬编码 API Key，建议通过后端代理转发请求。

---

## 三、图像 Base64 编码

API 的 `urls` 参数接收 **Data URI** 格式的图像数据。前端需要将用户上传或截取的图像转换为此格式。

### 3.1 支持的图像格式

| 格式 | MIME Type      |
| ---- | -------------- |
| JPEG | `image/jpeg`   |
| PNG  | `image/png`    |
| WebP | `image/webp`   |
| GIF  | `image/gif`    |

### 3.2 Data URI 格式

```
data:image/<mime>;base64,<base64_string>
```

### 3.3 JS 编码实现

```js
/**
 * 将 File 对象转换为 Data URI
 * @param {File} file - 用户上传的图像文件
 * @returns {Promise<string>} Data URI 字符串
 */
function fileToDataURI(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### 3.4 图像预处理（压缩 & 缩放）

为保证 API 兼容性，建议将图像压缩后再编码：

- **最长边限制**：1024px（超过时等比缩放）
- **JPEG 压缩质量**：60（目标 Base64 体积 < 63KB）

```js
/**
 * 压缩图像并返回 Data URI
 * @param {File} file - 原始图像文件
 * @param {number} maxSide - 最长边像素限制，默认 1024
 * @param {number} quality - JPEG 压缩质量 0~1，默认 0.6
 * @returns {Promise<string>} 压缩后的 Data URI
 */
function compressImage(file, maxSide = 1024, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;

      // 等比缩放
      if (Math.max(width, height) > maxSide) {
        const scale = maxSide / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // 输出为 JPEG Data URI
      const dataURI = canvas.toDataURL('image/jpeg', quality);
      resolve(dataURI);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
```

---

## 四、API 详细说明

### 4.1 提交渲染任务

```
POST https://api.wuyinkeji.com/api/async/image_nanoBanana_pro
```

#### 请求头

| Header           | 值                       |
| ---------------- | ------------------------ |
| `Authorization`  | `<YOUR_API_KEY>`         |
| `Content-Type`   | `application/json`       |

#### 请求体参数

| 参数          | 必需 | 类型     | 默认值                     | 说明                                       |
| ------------- | ---- | -------- | -------------------------- | ------------------------------------------ |
| `key`         | 是   | `string` | -                          | API 密钥                                   |
| `prompt`      | 是   | `string` | -                          | 渲染提示词，描述期望的图像效果             |
| `size`        | 否   | `string` | `"1K"`                     | 输出尺寸：`1K` / `2K` / `4K`              |
| `aspectRatio` | 否   | `string` | `"auto"`                   | 宽高比（见下方枚举值）                     |
| `urls`        | 是   | `array`  | -                          | Data URI 数组（Base64 编码的图像）         |

#### aspectRatio 可选值

```
auto | 1:1 | 16:9 | 4:3 | 3:2 | 9:16 | 2:3 | 5:4 | 4:5 | 21:9
```

#### 请求示例

```js
const response = await fetch('https://api.wuyinkeji.com/api/async/image_nanoBanana_pro', {
  method: 'POST',
  headers: {
    'Authorization': API_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    key: API_KEY,
    prompt: 'realistic render scene',
    size: '1K',
    aspectRatio: 'auto',
    urls: [dataURI],  // compressImage() 的返回值
  }),
});

const result = await response.json();
```

#### 成功响应

```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "id": "image_77580bc8-65ec-4c1b-971a-78073c6219f8",
    "count": "1"
  },
  "exec_time": 1.06288,
  "ip": "167.253.98.27"
}
```

#### 关键字段

| 字段        | 类型     | 说明                     |
| ----------- | -------- | ------------------------ |
| `code`      | `number` | `200` 表示提交成功       |
| `data.id`   | `string` | 任务 ID，用于后续轮询    |
| `data.count`| `string` | 处理数量                 |

---

### 4.2 查询任务状态（轮询）

```
GET https://api.wuyinkeji.com/api/async/detail
```

#### 请求参数（Query String）

| 参数  | 必需 | 类型     | 说明                         |
| ----- | ---- | -------- | ---------------------------- |
| `key` | 是   | `string` | API 密钥                     |
| `id`  | 是   | `string` | 任务 ID（提交响应中获得）    |

#### 请求示例

```js
const response = await fetch(
  `https://api.wuyinkeji.com/api/async/detail?key=${API_KEY}&id=${taskId}`
);

const result = await response.json();
```

#### 成功响应

```json
{
  "code": 200,
  "msg": "成功",
  "data": {
    "task_id": "image_77580bc8-65ec-4c1b-971a-78073c6219f8",
    "status": 2,
    "request": {
      "prompt": "realistic render scene",
      "urls": ["data:image/jpeg;base64,..."],
      "aspectRatio": "auto",
      "size": "1K"
    },
    "result": [
      "https://openpt.wuyinkeji.com/08732de1f2fc452f97eb81454a99bdf1.png"
    ],
    "created_at": "2026-03-18 14:43:47",
    "updated_at": "2026-03-18 14:45:57",
    "count": "1",
    "unit": null,
    "message": ""
  },
  "exec_time": 0.468652,
  "ip": "167.253.98.27"
}
```

#### 任务状态码

| status 值 | 含义   | 处理方式                           |
| --------- | ------ | ---------------------------------- |
| `2`       | 完成   | 从 `data.result[]` 获取图像 URL    |
| `3`       | 失败   | 终止轮询，提示用户                 |
| `4`       | 失败   | 终止轮询，提示用户                 |
| `-1`      | 被拒绝 | 终止轮询，提示用户                 |
| 其他      | 进行中 | 继续轮询（建议间隔 3 秒）         |

---

### 4.3 下载结果图像

当任务状态为 `2`（完成）时，`data.result` 数组中包含结果图像的 CDN URL。

```js
// result URL 示例：https://openpt.wuyinkeji.com/08732de1f2fc452f97eb81454a99bdf1.png
// 在 <img> 标签中直接使用即可，也可用 fetch 下载
const imageUrl = result.data.result[0];
```

> CDN 域名：`https://openpt.wuyinkeji.com/`

---

## 五、完整调用流程封装

以下是一份可直接在 Webapp 中使用的完整 API 封装模块：

```js
// api.js - BananaAnything API 封装模块

const API_KEY = '<YOUR_API_KEY>'; // 建议从环境变量读取

const ENDPOINTS = {
  submit: 'https://api.wuyinkeji.com/api/async/image_nanoBanana_pro',
  detail: 'https://api.wuyinkeji.com/api/async/detail',
};

const TASK_STATUS = {
  COMPLETED: 2,
  FAILED: [3, 4, -1],
};

/**
 * 提交渲染任务
 * @param {string} imageDataURI - Base64 编码的图像 Data URI
 * @param {object} options - 可选参数
 * @param {string} options.prompt - 渲染提示词，默认 "realistic render scene"
 * @param {string} options.size - 输出尺寸，默认 "1K"（可选 1K/2K/4K）
 * @param {string} options.aspectRatio - 宽高比，默认 "auto"
 * @returns {Promise<string>} 任务 ID
 * @throws {Error} 提交失败时抛出
 */
export async function submitTask(imageDataURI, options = {}) {
  const {
    prompt = 'realistic render scene',
    size = '1K',
    aspectRatio = 'auto',
  } = options;

  const response = await fetch(ENDPOINTS.submit, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key: API_KEY,
      prompt,
      size,
      aspectRatio,
      urls: [imageDataURI],
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = await response.json();

  if (body.code !== 200 || !body.data?.id) {
    throw new Error(`API error: ${body.msg || JSON.stringify(body)}`);
  }

  return body.data.id;
}

/**
 * 查询任务状态
 * @param {string} taskId - 任务 ID
 * @returns {Promise<{ status: number, resultUrls: string[], message: string }>}
 * @throws {Error} 查询失败时抛出
 */
export async function queryTask(taskId) {
  const url = `${ENDPOINTS.detail}?key=${encodeURIComponent(API_KEY)}&id=${encodeURIComponent(taskId)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const body = await response.json();
  const data = body.data || {};

  return {
    status: data.status,
    resultUrls: data.result || [],
    message: data.message || '',
  };
}

/**
 * 轮询任务直到完成或失败
 * @param {string} taskId - 任务 ID
 * @param {object} options - 轮询选项
 * @param {number} options.interval - 轮询间隔（毫秒），默认 3000
 * @param {number} options.timeout - 超时时间（毫秒），默认 300000（5分钟）
 * @param {function} options.onProgress - 进度回调，每次轮询触发
 * @returns {Promise<string[]>} 结果图像 URL 数组
 * @throws {Error} 超时或任务失败时抛出
 */
export async function pollUntilDone(taskId, options = {}) {
  const {
    interval = 3000,
    timeout = 300000,
    onProgress = null,
  } = options;

  const startTime = Date.now();

  while (true) {
    const { status, resultUrls, message } = await queryTask(taskId);

    // 通知进度
    if (onProgress) {
      onProgress({ status, resultUrls, message, elapsed: Date.now() - startTime });
    }

    // 完成
    if (status === TASK_STATUS.COMPLETED) {
      if (resultUrls.length === 0) {
        throw new Error('任务完成但未返回结果图像');
      }
      return resultUrls;
    }

    // 失败
    if (TASK_STATUS.FAILED.includes(status)) {
      throw new Error(`任务失败 (status=${status}): ${message || '未知错误'}`);
    }

    // 超时检查
    if (Date.now() - startTime > timeout) {
      throw new Error(`轮询超时（已等待 ${Math.round(timeout / 1000)} 秒）`);
    }

    // 等待下次轮询
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * 一键渲染：提交 + 轮询 + 返回结果
 * @param {string} imageDataURI - Base64 编码的图像 Data URI
 * @param {object} options - 渲染参数
 * @param {string} options.prompt - 渲染提示词
 * @param {string} options.size - 输出尺寸
 * @param {string} options.aspectRatio - 宽高比
 * @param {number} options.pollInterval - 轮询间隔（毫秒）
 * @param {number} options.pollTimeout - 轮询超时（毫秒）
 * @param {function} options.onProgress - 进度回调
 * @returns {Promise<{ taskId: string, resultUrls: string[] }>}
 */
export async function render(imageDataURI, options = {}) {
  const {
    prompt,
    size,
    aspectRatio,
    pollInterval,
    pollTimeout,
    onProgress,
  } = options;

  // 1. 提交任务
  const taskId = await submitTask(imageDataURI, { prompt, size, aspectRatio });

  // 2. 轮询直到完成
  const resultUrls = await pollUntilDone(taskId, {
    interval: pollInterval,
    timeout: pollTimeout,
    onProgress,
  });

  return { taskId, resultUrls };
}
```

---

## 六、Webapp 调用示例

### 6.1 基础用法

```js
import { render, compressImage } from './api.js';

// 用户上传图片后触发
async function handleImageUpload(file) {
  try {
    // 1. 压缩图像
    const dataURI = await compressImage(file);

    // 2. 一键渲染
    const { taskId, resultUrls } = await render(dataURI, {
      prompt: 'realistic render scene',
      size: '1K',
      aspectRatio: 'auto',
      onProgress: ({ status, elapsed }) => {
        console.log(`轮询中... status=${status}, 已用时 ${elapsed}ms`);
      },
    });

    // 3. 显示结果
    console.log('渲染完成:', resultUrls);
    document.getElementById('result').src = resultUrls[0];

  } catch (error) {
    console.error('渲染失败:', error.message);
    alert(`渲染失败: ${error.message}`);
  }
}
```

### 6.2 分步调用（精细控制）

```js
import { submitTask, pollUntilDone, compressImage } from './api.js';

async function handleRender(file, prompt) {
  // Step 1: 压缩图像
  const dataURI = await compressImage(file, 1024, 0.6);

  // Step 2: 提交任务
  const taskId = await submitTask(dataURI, {
    prompt: prompt,
    size: '2K',
    aspectRatio: '16:9',
  });
  console.log('任务已提交, ID:', taskId);

  // Step 3: 轮询等待结果
  const resultUrls = await pollUntilDone(taskId, {
    interval: 3000,     // 每 3 秒查一次
    timeout: 300000,    // 最多等 5 分钟
    onProgress: ({ status, elapsed }) => {
      updateUI(`处理中... (${Math.round(elapsed / 1000)}s)`);
    },
  });

  // Step 4: 使用结果
  return resultUrls[0];
}
```

---

## 七、错误处理建议

| 错误场景          | 建议处理方式                                          |
| ----------------- | ----------------------------------------------------- |
| 网络不可用         | 捕获 `TypeError: Failed to fetch`，提示检查网络       |
| HTTP 非 200       | 检查 `response.ok`，展示 HTTP 状态码                  |
| API 返回非 200 code | 检查 `body.code`，展示 `body.msg`                    |
| 任务失败 (status 3/4/-1) | 终止轮询，提示用户重试                          |
| 轮询超时           | 超过 5 分钟未完成，提示可能任务排队中                 |
| Base64 过大        | 压缩图像至 1024px 以内，JPEG quality 0.6             |

---

## 八、配置参数参考

| 参数               | 默认值                     | 说明                              |
| ------------------ | -------------------------- | --------------------------------- |
| `default_prompt`   | `"realistic render scene"` | 默认渲染提示词                    |
| `default_size`     | `"1K"`                     | 默认输出尺寸                      |
| `default_aspect_ratio` | `"auto"`               | 默认宽高比                        |
| 图像最长边          | `1024px`                  | 超过则等比缩放                    |
| JPEG 压缩质量      | `0.6`                      | 对应 canvas.toDataURL 的 quality |
| 轮询间隔           | `3000ms`                   | 推荐 3 秒                        |
| 轮询超时           | `300000ms`                 | 推荐 5 分钟                       |

---

## 九、安全注意事项

1. **API Key 不要暴露在前端代码中**，建议搭建后端代理（如 Next.js API Routes / Express 中间层）
2. 后端代理负责携带 API Key 转发请求，前端只与自己的后端通信
3. 建议后端增加**请求频率限制**，防止滥用
4. 图像上传建议增加**文件类型和大小校验**（前端 + 后端双重验证）
