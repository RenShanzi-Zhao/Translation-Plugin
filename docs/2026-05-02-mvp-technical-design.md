# Edge 翻译插件 MVP 技术设计

## 1. 设计目标

本设计面向第一版沉浸式翻译 MVP，实现以下目标：

- 在 Edge 浏览器中以扩展方式运行
- 用户手动触发整页正文翻译
- 原文保持不变，译文插入原文下方
- 使用自有大模型 API 完成翻译
- 控制实现复杂度，优先保证稳定性和可落地性

## 2. 技术选型

### 2.1 编程语言

- TypeScript

选用原因：

- 适合扩展消息通信和模块拆分
- 有助于约束请求响应结构
- 降低 DOM 注入和状态同步的出错率

### 2.2 UI 技术

- 原生 HTML
- 原生 CSS
- 原生 TypeScript

选用原因：

- Popup 交互简单
- 不依赖前端框架即可满足 MVP
- 降低打包复杂度和运行体积

### 2.3 扩展规范

- Manifest V3

### 2.4 构建工具

- Vite

### 2.5 存储

- Chrome Storage API

## 3. 系统架构

插件分为四个模块：

### 3.1 Popup

职责：

- 提供用户手动触发入口
- 展示简单运行状态
- 提供目标语言选择和移除译文操作

### 3.2 Content Script

职责：

- 注入到当前页面
- 识别正文主容器
- 提取可翻译段落
- 维护段落节点与段落 ID 映射
- 接收翻译结果并插入译文
- 标记已翻译节点

### 3.3 Background Service Worker

职责：

- 接收来自 Content Script 的翻译请求
- 构造翻译任务批次
- 调用自有大模型 API
- 处理超时、重试、错误封装
- 返回标准化结果

### 3.4 Storage

职责：

- 保存目标语言
- 保存页面翻译状态相关配置
- 保存本地基础设置

## 4. 建议目录结构

```text
src/
  manifest.ts
  background/
    index.ts
    translate.ts
  content/
    index.ts
    extract.ts
    inject.ts
    selectors.ts
  popup/
    index.html
    main.ts
    style.css
  shared/
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

如果匹配到多个候选容器，则选择正文文本总量更大的容器。

### 5.2 启发式评分回退

若未命中理想容器，则对候选区块评分，候选范围可包括：

- `main`
- `article`
- `section`
- `div`

评分因素如下：

- 包含较多 `p/li/blockquote/h1-h6` 节点则加分
- 文本总长度较大则加分
- 链接密度过高则减分
- 按钮和交互控件密度过高则减分
- 类名或 ID 包含 `nav/sidebar/footer/menu/comments/share/recommend` 等字样则减分

最终选取得分最高的容器作为正文主区域。

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

Content Script 将段落提取为结构化数组：

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

每批满足以下双阈值限制：

- 最多 8 段
- 最多 2500 个字符

### 8.3 并发规则

- 最多 2 个批次并发请求

### 8.4 失败处理

- 单批失败后自动重试 1 次
- 二次失败则保留失败标记，不影响其他批次继续

## 9. 翻译结果回填

### 9.1 插入方式

在每个原文节点后插入一个兄弟节点作为译文块：

```html
<p>Original text...</p>
<div class="imm-translation-block">翻译内容...</div>
```

### 9.2 节点标记

原文节点标记：

- `data-imm-translated="1"`

译文节点标记：

- `data-imm-translation-for="<id>"`

### 9.3 幂等处理

- 再次执行整页翻译时，默认跳过已翻译节点
- 移除译文操作时，仅删除扩展插入的译文节点和对应标记

## 10. 消息通信设计

建议在 `shared/messaging.ts` 中定义统一消息结构：

- Popup -> Content Script：开始翻译、移除译文
- Content Script -> Background：请求翻译批次
- Background -> Content Script：返回结构化翻译结果

## 11. 权限设计

Manifest V3 第一版建议权限如下：

- `storage`
- `activeTab`
- `scripting`

若采用向当前页面注入 Content Script 的方式，还需要配置匹配规则或动态注入策略。

若翻译服务部署在固定域名，还需配置允许访问对应接口的主机权限。

## 12. 样式策略

译文块样式要求如下：

- 与原文有清晰区分
- 不覆盖原文
- 不破坏原有排版流
- 字号可略小于原文
- 颜色略弱于原文
- 保持良好可读性

## 13. MVP 风险与控制

主要风险：

- 正文识别在复杂页面上不稳定
- 特定网站 DOM 结构异常导致误选内容
- 模型返回格式不稳定导致结果对齐失败
- 长页面请求量增加影响速度

控制措施：

- 采用主容器优先策略，减少全页误扫
- 使用结构化请求和结构化返回
- 使用段落 ID 而非顺序做回填
- 对批次采用小规模并发和最小重试
