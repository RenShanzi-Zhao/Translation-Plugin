# Edge 翻译插件 MVP 技术设计

## 1. 设计目标

本设计面向第一版沉浸式翻译 MVP，实现以下目标：

- 在 Edge 浏览器中以扩展方式运行
- 用户通过页面内悬浮按钮或快捷键手动触发整页正文翻译
- 原文保持不变，译文插入原文下方
- 使用 OpenAI 兼容的大模型 API 完成翻译
- 配置从“纯构建期环境变量”演进到“运行时可配置”
- 支持在 options 页进行连接测试
- 控制实现复杂度，优先保证稳定性和可落地性

## 2. 技术选型

### 2.1 编程语言

- TypeScript

### 2.2 UI 技术

- 原生 CSS
- 原生 TypeScript

说明：

- 页面内交互通过 content script 注入的悬浮按钮、设置面板和进度条完成
- 扩展级配置通过 `options_page` 提供

### 2.3 扩展规范

- Manifest V3

### 2.4 构建工具

- Vite

### 2.5 本地存储

- `localStorage`
- `chrome.storage.local`

说明：

- 悬浮按钮位置、透明度、图标、快捷键等保存在页面侧 `localStorage`
- 运行时翻译 API 配置保存在扩展侧 `chrome.storage.local`
- 开发环境在未配置运行时存储时，可回退到 `.env`

## 3. 系统架构

插件当前分为四个模块：

### 3.1 Content UI

职责：

- 注入悬浮按钮
- 提供悬停设置面板
- 提供顶部进度条
- 提供快捷键触发入口

### 3.2 Content Script

职责：

- 识别正文主容器
- 提取可翻译段落
- 维护段落节点与段落 ID 映射
- 调度首轮整页翻译、懒加载翻译、SPA 新内容翻译
- 接收翻译结果并插入译文
- 标记已翻译节点

### 3.3 Background Service Worker

职责：

- 接收来自 content script 和 options 页的消息
- 优先从扩展运行时配置读取 API 信息
- 调用 OpenAI 兼容大模型 API
- 处理超时、重试、错误封装
- 提供连接测试能力
- 返回标准化结果

### 3.4 Options Page

职责：

- 展示运行时 API 配置表单
- 保存或清空 Base URL、API Key、Model
- 对当前表单配置执行连接测试
- 让发布后的扩展不依赖重新打包即可调整配置

## 4. 当前目录结构

```text
src/
  background/
    index.ts
    translate.ts
  content/
    index.ts
    batching.ts
    orchestrator.ts
    lazyTranslation.ts
    spaMonitoring.ts
    extract.ts
    floating.ts
    floatingSettings.ts
    floatingProgress.ts
    floatingShortcut.ts
    floating.css
    inject.ts
    selectors.ts
  options/
    index.html
    main.ts
    style.css
  shared/
    config.ts
    constants.ts
    messaging.ts
    types.ts
```

## 5. 正文主容器识别

采用两阶段策略：

### 5.1 显式语义容器优先

优先匹配以下选择器：

- `article`
- `main`
- `[role="main"]`
- `.article`
- `.post`
- `.content`
- `.entry-content`
- `.markdown-body`
- `.doc-content`

如果匹配到多个候选容器，则选择评分更高的候选项。

### 5.2 启发式评分回退

若未命中理想容器，则对 `main/article/section/div` 等候选区块评分。

评分因素如下：

- 包含较多 `p/li/blockquote/h1-h6` 节点则加分
- 文本总长度较大则加分
- 链接密度过高则减分
- 按钮和交互控件密度过高则减分
- 类名或 ID 包含 `nav/sidebar/footer/menu/comments/share/recommend` 等字样则减分

## 6. 段落提取策略

### 6.1 纳入翻译的节点

- `p`
- `li`
- `blockquote`
- `h1`
- `h2`
- `h3`
- `h4`
- `h5`
- `h6`

### 6.2 明确跳过的标签

- `code`
- `pre`
- `textarea`
- `input`
- `button`
- `label`
- `select`
- `option`
- `script`
- `style`
- `noscript`

### 6.3 明确跳过的区域

- `nav`
- `footer`
- `aside`
- `[role="navigation"]`
- `.sidebar`
- `.comments`
- `.comment`
- `.menu`
- `.toolbar`
- `.breadcrumb`
- `.recommend`
- `.related`

## 7. 段落过滤规则

一个节点即使命中标签，也需通过以下过滤：

- 文本长度不少于 15 个字符
- 非空白、非纯符号内容
- 节点可见
- 链接密度不过高
- 不在排除区域内
- 不包含已标记为译文的扩展节点

## 8. 翻译任务分批策略

### 8.1 任务模型

content script 将段落提取为结构化数组：

```ts
type TranslateItem = {
  id: string;
  text: string;
};
```

同时维护：

```ts
Map<string, HTMLElement>
```

用于将返回结果稳定回填到原节点。

### 8.2 分批规则

当前实现采用以下双阈值：

- 最多 15 段
- 最多 2500 个字符

### 8.3 并发规则

- 最多 5 个批次并发请求

### 8.4 失败处理

- 单批失败后自动重试 1 次
- 二次失败则保留失败标记，不影响其他批次继续

## 9. 翻译协议

### 9.1 内部消息协议

content/background 间主要消息：

```ts
{ type: "TRANSLATE_BATCH", items, sourceLang, targetLang }
{ type: "TEST_CONNECTION", config }
{ type: "TRANSLATE_RESULT", translations }
{ type: "TEST_CONNECTION_RESULT", ok, message }
```

### 9.2 background 与模型 API 的协议

- 当前通过 OpenAI 兼容 `chat/completions` 接口调用模型
- API 配置优先来自 options 页保存的 `chrome.storage.local`
- 若运行时存储为空，则回退到开发环境 `.env`
- Prompt 中要求模型输出带 `id` 的 JSON
- 返回内容在 background 层解析为结构化翻译结果
- content script 按 `id` 而不是顺序回填

## 10. 运行时配置

Options Page 提供以下字段和动作：

- `API Base URL`
- `API Key`
- `Model`
- `保存配置`
- `连接测试`
- `清空配置`

配置特性：

- 保存后立即写入 `chrome.storage.local`
- 可对当前表单中的配置执行一次最小连接验证
- 清空后回退到开发环境 `.env`
- 不需要重新打包即可切换后端配置

### 10.1 连接测试设计

- options 页发送 `TEST_CONNECTION`
- background 使用当前表单里的 `Base URL / Key / Model`
- 调用同一 OpenAI 兼容 `/chat/completions` 接口
- 发起一个最小请求来验证认证、地址和模型是否可用
- 返回 `TEST_CONNECTION_RESULT`

## 11. 翻译结果回填

在每个原文节点后插入一个兄弟节点作为译文块：

```html
<p>Original text...</p>
<div class="imm-translation-block">翻译内容...</div>
```

节点标记如下：

- 原文节点：`data-imm-translated="1"`
- 译文节点：`data-imm-translation-for="<id>"`

再次执行整页翻译时，默认跳过已翻译节点。

## 12. 页面内交互

当前 UI 由悬浮按钮和设置面板提供：

- 可拖拽悬浮按钮
- 半隐藏贴边行为
- 悬停后显示设置入口
- 设置面板中的语言、透明度、图标、快捷键
- 顶部进度条

## 13. 权限设计

Manifest V3 当前使用以下权限：

- `storage`
- `activeTab`
- `scripting`

同时通过：

- `options_page: "options/index.html"`

提供运行时配置入口。

content script 通过：

- `matches: ["<all_urls>"]`
- `js: ["content/index.js"]`
- `css: ["content/floating.css"]`

注入所有页面。

## 14. 当前风险与控制

主要风险：

- 正文识别在复杂页面上不稳定
- 特定网站 DOM 结构异常导致误选内容
- 悬浮按钮和翻译调度逻辑仍有一定耦合
- 长页面请求量增加影响速度
- API Key 目前仍保存在本地扩展存储，后续可评估更严格的受限 token 方案

控制措施：

- 采用主容器优先策略，减少全页误扫
- 使用结构化 JSON 输出和 `id` 回填
- 对批次采用有限并发和最小重试
- 继续拆分 content UI 与翻译调度逻辑

### 15. 后续功能：划词翻译

- content script 监听 Selection 和 Ctrl 状态
- selection translation 通过独立消息链路走 background
