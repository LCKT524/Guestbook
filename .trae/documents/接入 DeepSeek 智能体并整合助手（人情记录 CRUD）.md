## 目标概述
- 接入 DeepSeek 大模型，支持“人情记录”的增删改查与检索。
- 通过函数调用（Tool/Function Calling）将模型决策安全地落地到数据库。
- 与现有助手页面整合，延续“先解析播报→用户确认→执行”的交互体验。

## 现有架构要点
- 数据与 CRUD 中心：`src/contexts/AppContext.tsx`（增: 57、改: 75、删: 91），前端通过 `recordsAPI`/`contactsAPI` 调 Supabase。
- 记录模型与 API：`src/lib/supabase-client.ts`（记录 CRUD 在 206–245；筛选在 175–205）。
- 助手入口与确认流程：`src/pages/Assistant.tsx`（解析: 86、确认后保存: 48–57）。
- 意图解析桥：`src/lib/agent/agentBridge.ts`（远程函数 `/functions/v1/gift-sprite` 优先，失败本地兜底）。

## 方案设计
- 交互闭环：自然语言 → DeepSeek Chat → 工具调用（add/update/delete/list）→ Supabase 操作 → 返回结构化结果 → 助手展示/确认 → 刷新列表。
- 安全策略：仅在 Supabase Edge Function 内使用 `DEEPSEEK_API_KEY` 与服务角色密钥，前端不暴露任何敏感信息；所有操作按 `user_id` 进行行级隔离。
- 兼容性：保留现有 `gift-sprite` 本地兜底解析；DeepSeek 失败时继续 fallback。

## 服务端实现（Supabase Edge Function：`deepseek-agent`）
- 环境与密钥
  - 在 Supabase 项目函数密钥中配置 `DEEPSEEK_API_KEY`；使用服务角色访问数据库（仅函数侧持有）。
- DeepSeek 调用
  - 使用 OpenAI 兼容 Chat Completions（`model: deepseek-chat`）；启用 `tool_choice: "auto"`。
  - 工具定义（JSON Schema）
    - `add_record`：`type`、`event_name`、`record_date`、`amount`、`payment_method?`、`note?`、`contact_name?`、`category_name?`。
    - `update_record`：`record_id`、可修改字段同上（均为可选）。
    - `delete_record`：`record_id`（要求模型给出高置信度且附带理由）。
    - `list_records`：`type?`、`startDate?`、`endDate?`、`contact_name?`、`category_name?`。
- 工具处理器
  - 规范化联系人/分类：按名称查找 ID；若不存在联系人，可选择“自动创建或要求确认”，默认先提示确认再创建。
  - 字段校验：`type` 仅限 `gift_given`/`gift_received`/`expense`/`income`（参见 `src/lib/supabase-client.ts:39`）；金额与日期格式校验与归一化。
  - 执行 CRUD：调用 Supabase JS（服务角色）对 `records`/`contacts`/`categories` 表进行增改删查。
  - 统一响应：`{ ok, actions: [...], data: {...}, display: '播报文案', error? }`，便于前端直接渲染卡片与确认组件。

## 前端整合
- 桥接层：`src/lib/agent/agentBridge.ts`
  - 新增调用路径：`${VITE_SUPABASE_URL}/functions/v1/deepseek-agent`；失败时回落到 `gift-sprite` 的本地解析。
  - 扩展返回类型：支持除新增外的更新/删除/列表结果，包含可执行 `record_id` 与变更摘要。
- 助手页面：`src/pages/Assistant.tsx`
  - 保持“卡片播报+确认按钮”模式；当返回为删除/更新时，展示二次确认提示与摘要变更。
  - 确认后调用 `useApp()` 中的 `addRecord`/`updateRecord`/`deleteRecord` 或直接根据函数返回的最新数据进行状态刷新。
  - 文本快捷指令保留：`确认/拒绝`；新增“撤销上一操作”的占位入口（可后续扩展）。
- 记录列表/详情：`src/pages/Records.tsx`、`src/pages/RecordDetail.tsx`
  - 无需大改；完成后端操作返回后调用 `refreshData()` 或基于返回数据进行局部更新。

## 提示词与意图对齐
- System 指令（示例）
  - “你是‘人情记录’助手。理解中文口语，严格使用提供的工具进行增删改查。删除与批量修改需明确用户确认。所有操作均需带 `user_id` 约束到当前用户。”
- 用户意图覆盖
  - 新增：金额、时间、事由、支付方式、联系人、分类。
  - 更新：支持修改金额/时间/事由/支付方式/备注等，需定位具体记录（通过用户提供的线索或最近记录匹配）。
  - 删除：要求模型返回唯一 `record_id` 与理由，前端弹窗确认。
  - 列表/统计：按类型/日期/联系人/分类过滤；结果以卡片/摘要返回。

## 安全与合规
- 密钥仅在服务端函数保存与使用；前端不读 `DEEPSEEK_API_KEY`。
- 所有数据库操作都校验 `user_id` 与 RLS；避免越权。
- 输入校验与防注入：日期与金额解析、枚举约束、最大数量限制；对批量操作加确认阈值。

## 配置项
- `.env.local`（前端）
  - 复用现有 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`。
  - 可新增 `VITE_DEEPSEEK_MODEL`（非必需，仅用于显示/切换），不包含密钥。
- Supabase 函数密钥
  - `DEEPSEEK_API_KEY`、服务角色密钥（仅函数侧）。

## 验证与测试
- 用例
  - 新增：“给王芳随礼300元，今天，微信”；期望生成一条 `gift_given` 记录并播报卡片。
  - 更新：“把刚才那条改成 500 元”；期望模型选择最近记录并调用 `update_record`。
  - 删除：“删除上周给李雷的那条随礼”；返回删除摘要并二次确认。
  - 列表：“看一下 10 月所有随礼”；按日期+类型过滤返回摘要。
- 前端验证
  - 助手卡片渲染、确认按钮可用性、出错提示。
  - 刷新后 `Records` 页与 `RecordDetail` 数据一致。

## 迭代与回退
- 首次上线仅覆盖新增/删除/列表；更新在次迭代完善“记录定位歧义”的提示链与确认。
- 提供故障回退：DeepSeek 失败即走本地 `gift-sprite` 解析与仅新增路径。

## 交付项
- 新增 Edge Function：`deepseek-agent`（带工具定义与安全封装）。
- 前端桥接与助手改造：`agentBridge.ts`/`Assistant.tsx` 的调用与展示扩展。
- 配置与文档：环境变量说明与测试清单。

请确认以上方案，确认后我将按此方案执行并完成集成与验证。