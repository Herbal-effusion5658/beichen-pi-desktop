# 北辰 Pi Desktop 1.8.1

> [!IMPORTANT]
> 北辰 Pi 是独立、非官方的第三方开源项目，与 OpenAI、ChatGPT、Codex、Anthropic、Google、DeepSeek、GitHub 或其他模型服务商不存在隶属、合作或官方背书关系。相关名称和商标归各自权利人所有。

> [!WARNING]
> Agent 模式不是安全沙箱。它可以按当前 Windows 用户权限读取和修改文件、执行 PowerShell，并加载 Pi 技能与扩展。只对受信任的工作目录使用；重要项目先启用 Git 并备份，不要安装来源不明的扩展或技能。

北辰 Pi 是一个基于 Electron 44 和 Pi 0.84.4 RPC 的 Windows 桌面客户端，提供 ChatGPT/Codex 双模式、独立多窗口、模型/API/会员订阅切换、会话、技能与扩展 UI。

模型接入同时支持 Pi 内置服务商和自定义 API：OpenAI Chat Completions、OpenAI Responses、Anthropic Messages、Google Generative AI，以及 Ollama、LM Studio、vLLM 等兼容本地服务。自定义 API Key 使用 Windows 系统加密，Pi `models.json` 中只保存环境变量引用。

## 直接使用

- 从 [GitHub Releases](https://github.com/opopile/beichen-pi-desktop/releases/latest) 下载安装版或便携版；不要从第三方网盘下载。
- 发布产物目前没有商业代码签名，Windows 可能显示 SmartScreen 提示。请核对 Release 页面公布的 SHA-256，不要因此关闭杀毒软件。

完整操作、接入、主题、性能、上下文、插件、隐私、排错、备份和构建说明请阅读：

- [北辰 Pi 1.8.1 完整使用说明](docs/北辰Pi使用说明.md)
- [安全策略](SECURITY.md)
- [隐私与数据流](PRIVACY.md)
- [第三方许可](THIRD_PARTY_NOTICES.md)
- [商标与非官方声明](TRADEMARKS.md)

应用使用 `output/北辰标志_极简漩涡聚焦版_v10.png` 作为程序和界面图标。顶部紫色北辰流星的推广动画每个版本只展示一次。

### 保守自动路由

新 Codex 会话的第一句如果严格等于“你好、您好、嗨、哈喽、Hi、Hello、Hey”等纯问候，会使用不带工具、技能、扩展和项目上下文的轻量请求。回复完成后应用立即恢复同一会话的完整 Codex 后端。

任何附加文字、附件、斜杠命令、已有会话历史或正在执行的任务都会直接保留完整 Codex，不进行语义猜测或模型分类，因此不会改变真实编程任务的提示词、工具、技能和推理强度。

## 界面主题与指标

- **极简 Codex**：默认深色扁平主题。
- **水墨**：宣纸与墨晕。
- **武林剑客**：暗夜江湖与剑客水墨。
- **温柔猫娘**：柔粉暖光与成年猫耳角色。
- **奶油治愈**：奶油暖色与自然植物。
- **星夜玻璃**：深蓝夜色与轻玻璃质感。
- **赛博科技**：保留 1.0 版本的紫色发光视觉。
- 顶栏可即时切换中文/英文；输入框下方可像 Codex 一样即时切换模型与思考强度，底部显示实时 token/s 与 Codex 式上下文圆环。
- 聊天栏使用单一“模型 + 推理强度”胶囊，展开后只负责模型与推理两项。Token 仪表继续使用原来的小圆环入口；五点上下文模式滑块独立放在左上角模式按钮中，普通档为蓝色，Ultra/Quantum/Ghost 使用紫色星点渐变。
- 1.8.1 不再使用浏览器原生下拉框：模型和推理行会在右侧展开应用自绘圆角子菜单，当前项显示勾选；长模型列表在子菜单内部滚动。
- 收起左侧边栏后，工作区会扩展到整个窗口宽度，聊天内容与输入框一起向左重排，不保留不可见的侧栏占位。
- 水墨、温柔猫娘和奶油治愈等浅色主题会完整覆盖任务搜索框、输入文字、占位文字、焦点和自动填充状态，不再混入浏览器原生深色输入样式。
- 软件底部提供独立 Token 状态行；点击后向上展开完整仪表，显示实际使用量、上限、剩余、输入/输出/推理/缓存、费用、命中率、速率图、消息与工具统计。
- 设置最后一档内置“使用说明”，可查看 ChatGPT/Codex 与五个可见性能模式的完整行为、适用范围、权衡和切换建议。

## 性能模式

| 模式 | 真实运行策略 |
| --- | --- |
| CODEX | 用精简 Pi 核心提示词和完整 Pi 能力包装成 Codex；稀疏显示有效进度 |
| BENCHMARK | 专门跑分：围绕真实评分目标、可复现基线、测量瓶颈、边界和证据追求极致结果 |
| ULTRA MAX | 使用精简 Pi 提示词并完整思考、完整执行，但埋头工作；结束后只显示最终结果 |
| QUANTUM COLLAPSE | Ultra Max + 回合完成后把该回合 thinking 本地压缩成短摘要，供后续上下文使用 |
| GHOST PAYLOAD | Ultra Max + 回合完成后从后续模型上下文彻底剔除该回合 thinking |

`EXTREME EFFICIENCY` 实现暂时保留，但入口已隐藏；从旧版本遗留的该档配置会安全回落到 CODEX。

统一规则：Quantum/Ghost 都是在模型按所选档位完整思考、使用工具并产出结果以后，才处理已完成回合的 thinking。它们不会禁止、降低或缩短当前思考，也不会替换 Pi 默认压缩。Pi 原生自动压缩在全部模式中继续启用；Quantum 的本地短摘要与 Ghost 的上下文剔除是叠加层，不产生额外模型调用。`Ghost Payload` 也不会让服务商已经生成的推理 token 免费或突破计费规则。

## 完整实时思考视图

- 所有模式都会按 Pi `thinking_delta` 实时组装并默认展开服务商返回的完整 thinking。
- Ultra Max、Quantum 和 Ghost 仍隐藏进度文字与工具时间线，但 thinking 对用户保持实时可见。
- Quantum 完成后用右侧大括号连接原始完整 thinking 与“已压缩”卡片，卡片内容就是下一轮实际发送给模型的 digest。
- Ghost 完成后用右侧大括号标记“已删除”；用户仍能查看本地保存的完整 thinking，但模型后续上下文不再携带它。
- 当前工具循环结束前不会提前标记压缩或删除，避免误导用户。未返回 thinking 的模型不会由客户端伪造思考过程。

性能模式与思考强度完全解耦。ChatGPT 和全部 Codex 性能档都可在输入框下方选择当前模型实际支持的 `Off / Minimal / Low / Medium / High / Extra High / Max` 档位；切换模式、轻量问候路由或工作目录不会覆盖手动选择。切换模型时 Pi 会按模型能力回落并立即显示实际生效值。

## 1.7 安全与稳定性

- Markdown 外链统一交给系统浏览器，并只放行 `http`、`https`、`mailto`；禁止创建 Electron 子窗口及打开 `file`、`javascript`、`data` 等协议。
- 多工具 Agent 回合会累计全部 assistant 输出 Token；零值分类不再显示假色块。
- 中文输入法组合阶段的 Enter 不会误发，移除附件后可以重新选择同一文件。
- 同一 Windows 工作目录不区分盘符和路径大小写，重启后保留当前持久化会话。
- 新任务会先从 Light 或中断状态恢复完整后端；OAuth/API 认证提示可取消，关闭窗口会清理悬挂认证。
- Ghost thinking-only 历史不会生成空 assistant 消息；流式输出不再抢夺用户手动上翻位置。
- Quantum/Ghost 的内部 reasoning 上下文标记禁止模型复述，并在 `message_end` 写入会话前执行完整、多个及未闭合标记清洗。

## 开发与验证

```powershell
npm ci
npm run prepare:runtime
npm run check
npm run dev
npm run dist
```

开发环境使用 Node 24.19.0。`prepare:runtime` 从 Node.js 官方下载 Windows x64 运行时，并校验固定 SHA-256 与 OpenJS Authenticode 签名；`node.exe` 不保存在 Git 仓库中。

`npm run check` 包含 TypeScript、测试和 Vite 生产构建。打包版内置 Node 24 运行时，不要求目标电脑预装 Node。

## 开源许可与贡献

源码采用 [MIT License](LICENSE)。提交问题或 PR 前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 和 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。安全漏洞请按 [SECURITY.md](SECURITY.md) 私下报告，不要在公开 Issue 中粘贴密钥、会话或私有代码。

## 凭据

模型凭据由 Pi 或 Windows 系统加密存储管理。打开“设置 → 模型与接入”，可选择内置 API、会员订阅或自定义 API；不同窗口可以使用不同模型和性能模式。
