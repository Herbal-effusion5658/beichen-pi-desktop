# Privacy and Data Flow

北辰 Pi runs locally, but model requests are sent to the provider or custom endpoint selected by the user.

Depending on the task and mode, transmitted data can include prompts, conversation history, provider-returned reasoning, image attachments, selected project file contents, tool results, command output, and compacted context summaries.

The project does not operate its own telemetry or analytics service. Provider-side logging, retention, training, billing, and privacy rules are controlled by the selected provider and account.

Custom API keys are encrypted at rest with Windows `safeStorage` when available. Pi-managed OAuth and API credentials are stored under the user's Pi configuration directory. Encryption at rest does not protect against malware or another process running as the same Windows user.

Never attach credentials, private keys, personal documents, or proprietary source code unless the selected provider and endpoint are authorized to receive them.

Local data normally includes `%USERPROFILE%\.pi\agent\sessions`, `%USERPROFILE%\.pi\agent\auth.json`, and Electron application settings. Uninstalling the application does not automatically erase all Pi sessions or credentials.
