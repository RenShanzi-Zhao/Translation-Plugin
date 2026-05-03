# 翻译 API 协议文档

## 1. 目标

该接口用于为 Edge 翻译插件提供批量段落翻译能力。

设计目标：

- 接收插件发送的结构化段落数组
- 返回与输入段落 ID 对齐的翻译结果
- 支持自动识别源语言
- 支持失败可定位到批次级别

## 2. 接口概览

### 2.1 请求方法

- `POST`

### 2.2 接口路径

- `/v1/translate`

### 2.3 Content-Type

- `application/json`

## 3. 请求头

建议请求头如下：

```http
Content-Type: application/json
Authorization: Bearer <token>
```

如果你的服务采用自定义鉴权，也可以改为：

```http
X-API-Key: <api-key>
Content-Type: application/json
```

MVP 阶段建议固定一种鉴权方案，避免前后端分叉。

## 4. 请求体

```json
{
  "sourceLang": "auto",
  "targetLang": "zh-CN",
  "items": [
    {
      "id": "p_1",
      "text": "First paragraph..."
    },
    {
      "id": "p_2",
      "text": "Second paragraph..."
    }
  ]
}
```

### 4.1 字段说明

- `sourceLang`
  - 类型：`string`
  - 说明：源语言，MVP 默认支持 `auto`

- `targetLang`
  - 类型：`string`
  - 说明：目标语言，例如 `zh-CN`

- `items`
  - 类型：`array`
  - 说明：待翻译段落数组

- `items[].id`
  - 类型：`string`
  - 说明：前端生成的稳定段落 ID

- `items[].text`
  - 类型：`string`
  - 说明：原文段落文本

## 5. 成功响应

```json
{
  "translations": [
    {
      "id": "p_1",
      "translatedText": "第一段译文..."
    },
    {
      "id": "p_2",
      "translatedText": "第二段译文..."
    }
  ]
}
```

### 5.1 字段说明

- `translations`
  - 类型：`array`
  - 说明：翻译结果数组

- `translations[].id`
  - 类型：`string`
  - 说明：与请求中的 `items[].id` 对应

- `translations[].translatedText`
  - 类型：`string`
  - 说明：该段原文对应的译文

## 6. 失败响应

建议失败时返回统一结构：

```json
{
  "error": {
    "code": "TRANSLATE_UPSTREAM_ERROR",
    "message": "translate service unavailable"
  }
}
```

### 6.1 推荐错误码

- `INVALID_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `RATE_LIMITED`
- `TRANSLATE_TIMEOUT`
- `TRANSLATE_UPSTREAM_ERROR`
- `INTERNAL_ERROR`

## 7. 服务端处理建议

### 7.1 输入校验

服务端应校验：

- `targetLang` 是否存在
- `items` 是否为非空数组
- 每个 `id` 是否存在且唯一
- 每个 `text` 是否为有效字符串

### 7.2 输出约束

服务端应尽量保证：

- 返回结果中的每条翻译都保留原始 `id`
- 不额外增加说明性文本
- 不返回与输入无关的数据结构

### 7.3 模型调用适配

如果底层是通用大模型聊天接口，建议服务端完成以下适配：

- 将结构化 `items` 转成模型提示词
- 强约束模型只返回 JSON
- 解析模型结果并标准化
- 对异常输出进行兜底修正或报错

## 8. 超时与重试约定

建议约定如下：

- 单次请求服务端超时控制在 20 秒内
- 客户端对失败批次最多自动重试 1 次
- 超时和 5xx 错误可重试
- 4xx 参数错误不应重试

## 9. MVP 支持的语言策略

MVP 建议如下：

- 源语言固定 `auto`
- 目标语言默认 `zh-CN`
- 后续可扩展更多目标语言

## 10. 安全建议

如果 API 由扩展直接调用，需要注意：

- 不要把高权限主密钥直接硬编码进代码仓库
- 如果必须由前端直连，建议使用受限 Token
- 更稳妥的方式是由受控网关代发请求

## 11. 版本演进建议

后续如果需要扩展能力，可增加：

- `model` 字段，用于指定模型
- `glossaryId` 字段，用于术语表
- `tone` 字段，用于翻译风格控制
- `context` 字段，用于整页上下文增强
- `failedItems` 字段，用于部分失败返回
