<p align="center">
  <img src="output/北辰标志_极简漩涡聚焦版_v10.png" alt="北辰 Pi / Beichen Pi" width="128" />
</p>

<h1 align="center">北辰 Pi / Beichen Pi</h1>

<p align="center">
  <strong>为本地部署模型而生的极简 Agent 平台</strong><br />
  <strong>A minimalist agent platform built for locally deployed models.</strong>
</p>

<p align="center">
  让本地模型安静地把活做完，也让每一枚 Token 都有去处可查。<br />
  Let local models finish the work without noise—and make every token accountable.
</p>

<p align="center">
  <a href="https://github.com/opopile/beichen-pi-desktop/actions/workflows/ci.yml"><img src="https://github.com/opopile/beichen-pi-desktop/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE">MIT License</a> ·
  <a href="https://github.com/opopile/beichen-pi-desktop/releases/latest">Download</a> ·
  <a href="docs/北辰Pi使用说明.md">中文说明</a> ·
  <a href="docs/USER_GUIDE_EN.md">English Guide</a>
</p>

> [!IMPORTANT]
> 北辰 Pi 是独立、非官方的第三方开源项目，不是 OpenAI、ChatGPT、Codex、Anthropic、Google、DeepSeek、GitHub 或其他模型服务商的官方客户端或复刻品。相关名称和商标归各自权利人所有。<br />
> Beichen Pi is an independent, unofficial open-source project. It is not an official client or replica of OpenAI, ChatGPT, Codex, Anthropic, Google, DeepSeek, GitHub, or any other model provider. All names and trademarks belong to their respective owners.

## 先说它为什么存在 / Why this exists

本地模型已经能写代码、调用工具、处理长任务。它不该继续被塞进一个臃肿的聊天壳，也不该让用户靠猜测判断上下文还剩多少、推理是否被保留、Token 到底花在了哪里。

*Local models can already write code, call tools, and finish long-running tasks. They should not be trapped inside a bloated chat shell, and users should not have to guess how much context remains, whether reasoning survives the next turn, or where the tokens went.*

北辰 Pi 把 Pi 的模型、会话、工具、技能、扩展、认证与原生自动压缩装进一个 Windows 桌面 Agent：界面尽量少，控制必须明确，数据必须能测，边界必须说清。

*Beichen Pi brings Pi models, sessions, tools, skills, extensions, authentication, and native compaction into a Windows desktop agent. The interface stays small; controls stay explicit; measurable data stays visible; limitations stay honest.*

我们喜欢把模型推到极限，但更在意结果能不能复现。**不拿少思考冒充快，也不拿隐藏日志冒充省上下文。**

*We like pushing models hard. We care even more that the result can be reproduced. **We do not call reduced reasoning “speed,” and we do not call hidden logs “context savings.”***

## 突出的能力，先摆在前面 / What stands out, up front

| 能力 / Capability | 北辰 Pi 做了什么 / What Beichen Pi does | 工程边界 / Engineering boundary |
| --- | --- | --- |
| **本地优先 / Local first** | 原生接入 Ollama、LM Studio、vLLM 和 OpenAI-compatible 本地端点，也支持 OpenAI Responses、Anthropic Messages、Google Generative AI。<br />Connects to Ollama, LM Studio, vLLM, OpenAI-compatible local endpoints, OpenAI Responses, Anthropic Messages, and Google Generative AI. | 应用不替你下载、启动或量化模型；服务端能力必须真实实现所选协议。<br />The app does not download, start, or quantize models; the server must implement the selected protocol correctly. |
| **回合后思考上下文治理 / Post-turn reasoning-context control** | Quantum Collapse 在回合结束后把已完成 thinking 压成本地短摘要；Ghost Payload 在后续请求中剔除已完成 thinking。Pi 原生压缩继续工作。<br />Quantum Collapse turns completed thinking into a local digest after the turn; Ghost Payload removes completed thinking from later requests. Pi native compaction remains enabled. | 当前回合仍按所选强度完整思考和执行；已生成 reasoning token 仍按服务商规则计费。<br />The current turn still reasons and executes at the selected level; already generated reasoning tokens remain billable under provider rules. |
| **安静但完整的执行 / Quiet, complete execution** | Ultra Max、Quantum、Ghost 隐藏进度闲聊与工具时间线，任务完成后只交付最终结果；服务商实际返回的 thinking 仍可实时查看。<br />Ultra Max, Quantum, and Ghost suppress progress chatter and tool timelines, then deliver the final result; provider-returned thinking remains visible in real time. | 静默不等于跳过验证，也不保证服务商返回隐藏的内部思维链。<br />Silence does not skip validation and cannot make a provider expose hidden chain-of-thought. |
| **完整 Token 可观测性 / Full token observability** | 上下文占用、上限、剩余、输入、输出、推理、缓存读写、命中率、费用、token/s、消息和工具统计集中在可展开仪表中。<br />Context used/limit/remaining, input, output, reasoning, cache reads/writes, hit rate, cost, token/s, messages, and tool counts live in one expandable dashboard. | 服务商未返回的数据明确显示为 `—`，不会拿估算值冒充真实 usage。<br />Provider-missing fields are shown as `—`; estimates are never presented as authoritative usage. |
| **窗口级独立运行 / Per-window independence** | 每个窗口拥有独立 Pi RPC、工作目录、会话、模型、推理强度和上下文模式；支持新窗口与软件多开。<br />Each window owns its Pi RPC, workspace, session, model, reasoning level, and context mode; multiple windows and app instances are supported. | 多窗口会增加本地内存和进程开销。<br />Additional windows consume additional local memory and processes. |
| **Pi 生态不缩水 / Full Pi ecosystem** | 保留会话树、工具、技能、扩展、提示模板、OAuth/API 认证和 Pi 原生自动压缩。<br />Keeps session trees, tools, skills, extensions, prompt templates, OAuth/API authentication, and Pi native compaction. | Agent 继承当前 Windows 用户权限，不是安全沙箱。<br />The agent inherits the current Windows user’s permissions; it is not a security sandbox. |

## 上下文不是黑箱 / Context is not a black box

Quantum Collapse 与 Ghost Payload 处理的是**已经完成回合的 thinking**，不是削弱当前回合的推理。

*Quantum Collapse and Ghost Payload operate on **thinking from completed turns**. They do not weaken reasoning in the current turn.*

```text
完整推理与工具执行 → 最终结果 → 回合结束 → Quantum 摘要 / Ghost 剔除 → 下一次请求
Full reasoning and tool use → Final result → Turn ends → Quantum digest / Ghost removal → Next request
```

- 当前回合按用户选择的 `Off / Minimal / Low / Medium / High / Extra High / Max` 完整运行。<br />
  *The current turn runs at the user-selected `Off / Minimal / Low / Medium / High / Extra High / Max` level.*
- 当前工具循环、签名、用户消息、最终回复与工具证据保持原样。<br />
  *The active tool loop, signatures, user messages, final response, and tool evidence remain intact.*
- Quantum 生成最多约 480 字符的本地 `<reasoning_digest>`，不额外调用模型。<br />
  *Quantum creates a local `<reasoning_digest>` of up to roughly 480 characters without another model call.*
- Ghost 只从后续临时模型上下文移除已完成 thinking；本地会话中的可视原文仍保留。<br />
  *Ghost removes completed thinking only from future temporary model context; the locally visible session record remains available.*
- Pi 原生自动压缩在所有模式中继续启用；Quantum/Ghost 是叠加层，不替换 Pi `compact`。<br />
  *Pi native automatic compaction stays enabled in every mode; Quantum/Ghost are additive layers and do not replace Pi `compact`.*
- 这些模式不能突破模型上下文上限，也不会免除已经产生的 Token 费用。<br />
  *These modes cannot bypass model context limits or erase token charges already incurred.*

## 五档 Agent 模式 / Five agent modes

| 模式 / Mode | 运行行为 / Runtime behavior | 后续上下文 / Context carried forward | 适合 / Best for |
| --- | --- | --- | --- |
| **CODEX** | 精简 Pi 核心提示词、完整工具能力、只显示有效进度。<br />Lean Pi core prompt, full tools, sparse useful progress. | Pi 默认自动压缩。<br />Pi native compaction. | 日常项目开发。<br />Daily development. |
| **BENCHMARK** | 围绕真实指标、可复现基线、瓶颈和证据推进；跑分建议使用模型支持的最高推理档。<br />Optimizes around real metrics, reproducible baselines, bottlenecks, and evidence; the highest supported reasoning level is recommended for benchmarks. | 不牺牲证据换取表面速度。<br />Does not trade evidence for superficial speed. | 跑分、评测、极限优化。<br />Benchmarks, evals, extreme optimization. |
| **ULTRA MAX** | 精简提示词，完整思考和工具执行；运行中埋头工作，结束后只显示最终回答。<br />Lean prompt, full reasoning and tools; works silently and returns only the final answer. | Pi 默认自动压缩。<br />Pi native compaction. | 无人值守复杂任务。<br />Unattended complex work. |
| **QUANTUM COLLAPSE** | Ultra Max + 回合完成后生成本地 reasoning digest。<br />Ultra Max plus a local reasoning digest after the turn. | 摘要保留根因、结论、验证与下一步。<br />Digest keeps root cause, conclusion, verification, and next steps. | 长会话且仍需推理线索。<br />Long sessions that still need reasoning breadcrumbs. |
| **GHOST PAYLOAD** | Ultra Max + 回合完成后从后续模型上下文剔除 thinking。<br />Ultra Max plus removal of completed thinking from future model context. | 保留用户消息、最终回复和工具证据。<br />Keeps user messages, final responses, and tool evidence. | 最小化后续上下文载荷。<br />Minimizing future context payload. |

`EXTREME EFFICIENCY` 的实现暂时保留，但入口已隐藏；旧配置会安全回落到 CODEX。性能模式与思考强度完全解耦，切换模式不会覆盖用户手动选择。

*The `EXTREME EFFICIENCY` implementation remains in the codebase, but its entry point is hidden; legacy settings safely fall back to CODEX. Performance mode and reasoning level are independent controls, so switching modes never overwrites the user’s selection.*

## 面向本地部署的模型接入 / Model access built for local deployment

| 服务 / Service | 常见地址 / Typical endpoint | 推荐协议 / Suggested protocol |
| --- | --- | --- |
| Ollama | `http://127.0.0.1:11434/v1` | OpenAI Chat Completions |
| LM Studio | `http://127.0.0.1:1234/v1` | OpenAI Chat Completions |
| vLLM | `http://127.0.0.1:8000/v1` | OpenAI Chat Completions |
| 自建网关 / Custom gateway | 由部署决定 / Deployment-defined | OpenAI Chat/Responses, Anthropic, or Google |

自定义接入可声明上下文上限、最大输出、reasoning、图片、`developer` role、`Extra High / Max` 和思考参数格式。无密钥本地服务可以显式关闭鉴权。需要密钥时，Electron `safeStorage` 使用 Windows 系统加密；Pi `models.json` 只保存环境变量引用，不保存明文 API Key。

*Custom endpoints can declare context limits, maximum output, reasoning, image input, the `developer` role, `Extra High / Max`, and reasoning-parameter formats. Authentication can be disabled explicitly for keyless local services. When a key is required, Electron `safeStorage` uses Windows-backed encryption; Pi `models.json` stores only an environment-variable reference, never the plaintext API key.*

保存配置不会发送测试聊天或消耗模型 Token；第一次真实对话才验证网络、协议和密钥。

*Saving an endpoint does not send a test chat or consume model tokens. Network, protocol, and credentials are validated by the first real request.*

## Token 与上下文仪表 / Token and context dashboard

底部常驻状态行使用 Codex 式圆环显示当前上下文占用。点击后从软件底部展开完整仪表，而不是依赖容易失效的悬停弹窗。

*A persistent bottom status row uses a Codex-style ring for current context usage. Clicking it expands the complete dashboard from the bottom of the app instead of relying on a fragile hover popover.*

- 上下文：实际使用、模型上限、剩余、占用百分比、最大输出。<br />
  *Context: actual usage, model limit, remaining capacity, percentage, and maximum output.*
- 会话累计：输入、输出、缓存读取、缓存写入、总 Token、命中率与费用。<br />
  *Session totals: input, output, cache reads, cache writes, total tokens, hit rate, and cost.*
- 最近回复：推理 Token、缓存与费用拆分；推理 Token 作为输出子集，不重复相加。<br />
  *Latest response: reasoning tokens, cache, and cost breakdown; reasoning tokens are treated as a subset of output, not added twice.*
- 当前运行：实时 token/s、输出量、耗时、约 40 个速率样本、压缩状态与推理等级。<br />
  *Current run: live token/s, output count, elapsed time, roughly 40 speed samples, compaction state, and reasoning level.*
- 精度原则：最终 usage 与 Pi `SessionStats` 优先；流式估算会在结束后被真实 usage 校正。<br />
  *Accuracy rule: final usage and Pi `SessionStats` take priority; streaming estimates are corrected when authoritative usage arrives.*

## 桌面体验 / Desktop experience

- **Chat / Agent 双界面**：Chat 适合问答，不加载文件修改工具；Agent 可读取项目、编辑代码、运行 PowerShell 与验证。<br />
  ***Chat / Agent workspaces**: Chat is for conversation and does not load file-editing tools; Agent can read projects, edit code, run PowerShell, and verify results.*
- **独立模型与思考强度**：输入框下方的自绘菜单只显示当前模型真实支持的推理档。<br />
  ***Independent model and reasoning controls**: the custom menu under the composer only shows levels actually supported by the current model.*
- **保守自动路由**：只有严格的纯问候才进入一次轻量请求；附件、命令、历史、任务文字或运行中的工作都会保留完整 Agent。<br />
  ***Conservative auto-routing**: only an exact greeting uses a one-shot lightweight request; attachments, commands, history, task text, or active work always retain the full agent.*
- **完整 Pi 资源**：会话、技能、扩展与提示模板通过 Pi RPC 实时加载。<br />
  ***Full Pi resources**: sessions, skills, extensions, and prompt templates are loaded through Pi RPC.*
- **七套主题**：极简 Codex、水墨、武林剑客、温柔猫娘、奶油治愈、星夜玻璃、赛博科技。<br />
  ***Seven themes**: Minimal Codex, Ink Wash, Wuxia Swordsman, Gentle Nekomimi, Cream Comfort, Midnight Glass, and Cyber Tech.*
- **中英文界面**：导航、设置、按钮、错误与指标可即时切换；用户消息和模型回复不被自动翻译。<br />
  ***Chinese/English UI**: navigation, settings, controls, errors, and metrics switch instantly; user messages and model responses are never auto-translated.*

## 下载与开始 / Download and start

1. 从 [GitHub Releases](https://github.com/opopile/beichen-pi-desktop/releases/latest) 下载安装版或便携版。<br />
   *Download the installer or portable build from [GitHub Releases](https://github.com/opopile/beichen-pi-desktop/releases/latest).*
2. 在 Release 页面核对 SHA-256。当前 EXE 没有商业代码签名，Windows 可能显示 SmartScreen；不要因此关闭杀毒软件。<br />
   *Verify SHA-256 on the Release page. The current EXEs do not have a commercial code-signing certificate, so Windows may show SmartScreen; do not disable antivirus software to bypass it.*
3. 启动 Ollama、LM Studio、vLLM 或准备云服务凭据，然后进入“设置 → 模型与接入”。<br />
   *Start Ollama, LM Studio, or vLLM—or prepare cloud credentials—then open **Settings → Models & Access**.*
4. 选择可信工作目录、模型、推理强度和上下文模式，再开始任务。<br />
   *Choose a trusted workspace, model, reasoning level, and context mode, then start the task.*

系统要求：Windows 10/11 x64，建议至少 8 GB 内存和 500 MB 可用空间。安装包内置 Node 24 运行时，目标电脑不需要预装 Node.js。

*Requirements: Windows 10/11 x64, with at least 8 GB RAM and 500 MB free space recommended. The package includes a Node 24 runtime; the target machine does not need a separate Node.js installation.*

### 完整文档 / Complete documentation

- [完整使用说明（中文）](docs/北辰Pi使用说明.md)
- [Complete User Guide (English)](docs/USER_GUIDE_EN.md)
- [安全策略 / Security Policy](SECURITY.md)
- [隐私与数据流 / Privacy and Data Flow](PRIVACY.md)
- [第三方许可 / Third-Party Notices](THIRD_PARTY_NOTICES.md)
- [商标与非官方声明 / Trademarks and Unofficial Status](TRADEMARKS.md)

## 开发与验证 / Development and verification

```powershell
npm ci
npm run prepare:runtime
npm run check
npm run dev
npm run dist
```

开发环境使用 Node 24.19.0。`prepare:runtime` 从 Node.js 官方下载 Windows x64 运行时，校验固定 SHA-256 与 OpenJS Authenticode 签名；`node.exe` 不保存在 Git 仓库中。

*Development uses Node 24.19.0. `prepare:runtime` downloads the Windows x64 runtime from the official Node.js distribution, verifies a pinned SHA-256 and the OpenJS Authenticode signature, and keeps `node.exe` out of Git.*

`npm run check` 执行 TypeScript 检查、51 项 Node 测试与 Vite 生产构建。CI 在 `main` 和 Pull Request 上执行同一套验证。

*`npm run check` runs TypeScript validation, 51 Node tests, and a Vite production build. CI runs the same validation on `main` and pull requests.*

## 安全、凭据与开源 / Security, credentials, and open source

> [!WARNING]
> Agent 模式不是安全沙箱。它能以当前 Windows 用户权限读取和修改文件、执行 PowerShell，并加载 Pi 技能与扩展。只对可信工作目录使用；重要项目先启用 Git 并备份。<br />
> Agent mode is not a security sandbox. It can read and modify files, execute PowerShell, and load Pi skills and extensions with the current Windows user’s permissions. Use it only with trusted workspaces; enable Git and back up important projects first.

模型凭据由 Pi 或 Windows 系统加密存储管理。不要提交 `%USERPROFILE%\.pi\agent\auth.json`，不要在 Issue、日志或截图中粘贴完整 API Key。

*Model credentials are managed by Pi or Windows-backed encrypted storage. Never commit `%USERPROFILE%\.pi\agent\auth.json`, and never paste complete API keys into issues, logs, or screenshots.*

源码采用 [MIT License](LICENSE)。提交问题或 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 与 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全漏洞请按 [SECURITY.md](SECURITY.md) 私下报告。

*Source code is released under the [MIT License](LICENSE). Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before opening an issue or pull request. Report vulnerabilities privately according to [SECURITY.md](SECURITY.md).*

---

**当前版本 / Current version:** `1.8.1` · Electron `44.0.0` · Pi `0.84.4` · Node `24.19.0`
