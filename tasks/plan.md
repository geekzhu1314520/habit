# Implementation Plan：跑步习惯追踪器

状态：计划待审阅，未开始实现。依据：[SPEC.md](../SPEC.md)。任务状态统一记录在 [todo.md](todo.md)；本文件保留完整任务定义。

## 范围与术语

用户本次列出的能力按已确认规格映射如下；若要改为通用多习惯或连续打卡产品，需要先修改规格。

| 请求中的能力 | 本项目实施内容 | 任务 |
|---|---|---|
| Add a habit | 首次启用唯一的跑步计划并选择开始日期 | T04 |
| Mark a day done | 每次跑步单独记录，当天累计达到门槛后自动完成 | T05–T06 |
| Compute streaks | 按规格不计算 streak 数值，实现隔天日程及漏跑推导 | T07–T08 |
| Show stats | 跑步次数、累计公里及每日历史 | T09 |
| Persist to localStorage | 从首个用户路径开始持久化，后续补齐异常与冲突 | T04–T12 |

## 架构决策

- 使用规格建议的 TypeScript、Vite、原生 HTML/CSS；测试采用 Vitest、DOM 测试环境和 Playwright。实施时锁定兼容版本；本轮不安装依赖。
- 单一 localStorage v1 文档；独立记录使用稳定 id，整数米存距离，本地日期存 YYYY-MM-DD。
- 所有写操作先校验候选完整文档，写入成功后再提交到界面状态。日汇总、日程、漏跑和统计用纯函数推导，不存派生值。
- 除最小工程和日期校验基础外，以可运行的用户路径交付：启用并保存 → 记录 → 达标 → 日程 → 统计 → 修正 → 故障恢复。

## 依赖顺序

T01 → T02 → T03 → T04 → T05 → T06 → T07 → T08 → T09 → T10 → T11 → T12 → T13 → T14。

保守采用顺序交付，因大多数切片共享入口和状态。T07 的纯函数和 T09 的统计纯函数在 T06 完成后可独立开发，但界面接入仍按上述顺序；本计划不启动并行代理。

## 验证约定

每项均执行下列列出的针对性命令以及 `npm run build`；有人工检查说明。命令是待建立的契约，当前没有应用代码或依赖，不能声称已经通过。T02 中在对应脚本建立后运行 `npx playwright install chromium`；T02 仅用空测试集检查测试运行器是否就绪，不计为业务测试通过；T03 起必须存在真实测试，禁止继续使用 passWithNoTests。T13/T14 提供正式端到端测试文件。

首次创建依赖使用包管理器生成锁文件；锁文件就绪后，用 `npm ci` 验证可复现安装。每个任务控制在约 3–5 个文件，测试随功能交付；如实际超过五个文件，实施前进一步拆小，不省略验收项。

## 任务定义

### T01：建立可运行的应用入口

**描述：**建立最小 TypeScript/Vite 页面，作为后续可运行切片的基础。

**验收标准：**
- 依赖版本与锁文件固定，dev、build、typecheck 脚本可用。
- 严格 TypeScript 模式，页面可在本机启动，无业务后端。

**验证：**`npm run build && npm run typecheck`；`npm run build`。人工检查：打开本地页面确认入口可见。

**依赖：**无。

**预计文件：**`package.json`, `package-lock.json`, `tsconfig.json`, `index.html`, `src/main.ts`。

**范围：**M（3–5 个文件）。

### T02：建立自动验证入口

**描述：**提供规格要求的测试与静态检查命令。

**验收标准：**
- lint、test、test:e2e 脚本可用，Chromium 项目自动启动本地服务。
- Vitest 支持 DOM 测试及覆盖率；配置日程与校验分支覆盖率门槛 90%。
- Playwright 能识别 Chromium 项目与自动启动配置；lint 不默认改写文件。

**验证：**`npm run lint && npm run typecheck && npm run test -- --run --passWithNoTests`；`npm run build`。人工检查：确认检查命令失败时返回非零状态。

**依赖：**T01。

**预计文件：**`package.json`, `package-lock.json`, `eslint.config.js`, `vite.config.ts`, `playwright.config.ts`。

**范围：**M（3–5 个文件）。

### T03：实现本地日期与记录校验

**描述：**先验证日期和米制距离等高风险基础规则。

**验收标准：**
- 定义 SPEC 第 3 节模型；验证版本、唯一非空 id、真实日期、日期范围及距离与求和的安全整数范围。
- 公里最多三位小数；拒绝空值、零、负数、非有限值；同日同距离不同 id 合法。
- 日历日加减覆盖跨月、跨年、闰日与夏令时；保存的日期不随时区改变。

**验证：**`npm run test -- --run tests/unit/model.test.ts tests/unit/date.test.ts`；`npm run build`。人工检查：审阅无 UTC 日期截断或固定 48 小时替代日历运算。

**依赖：**T02。

**预计文件：**`src/domain/model.ts`, `src/domain/date.ts`, `src/domain/validation.ts`, `tests/unit/model.test.ts`, `tests/unit/date.test.ts`。

**范围：**M（3–5 个文件）。

### T04：启用跑步计划并保存到本机

**描述：**交付“添加习惯”的首个完整路径：首次选择日期并持久化固定跑步计划。

**验收标准：**
- 首次日期默认今天，允许过去或未来；固定跑步规则和本地保存范围可见。
- 保存完整 v1 文档到 running-tracker:v1，成功后进入应用；刷新保留开始日期。
- 读取先校验；读写失败显示错误，不显示假成功，不覆盖损坏或未知版本数据。

**验证：**`npm run test -- --run tests/integration/setup.test.ts`；`npm run build`。人工检查：设置过去和未来日期并刷新，检查存储键。

**依赖：**T03。

**预计文件：**`src/storage/local-store.ts`, `src/ui/setup.ts`, `src/main.ts`, `tests/integration/setup.test.ts`。

**范围：**M（3–5 个文件）。

### T05：独立记录每次跑步

**描述：**打通表单到 localStorage 的新增路径。

**验收标准：**
- 日期默认今天，每次新增独立 id；同日可记录多次，包括相同距离。
- 校验日期与距离，失败保留输入；取消不写入，提交期间防重复提交。
- 成功后显示本次记录；只有持久化成功才更新已保存状态，刷新保留所有记录。

**验证：**`npm run test -- --run tests/integration/run-form.test.ts`；`npm run build`。人工检查：同一天保存两次 3 公里，刷新后确认保留两条。

**依赖：**T04。

**预计文件：**`src/domain/runs.ts`, `src/ui/run-form.ts`, `src/main.ts`, `tests/integration/run-form.test.ts`。

**范围：**M（3–5 个文件）。

### T06：按每日累计显示完成状态

**描述：**实现“完成一天”：通过真实跑量自动达标，不增加手动完成开关。

**验收标准：**
- 工作日 3+2 公里达标，周末 6+4 公里达标；4.999 公里工作日未达标。
- 不同日不合并；达标状态属于当天；已达标后仍能新增记录。
- 首页显示今日累计、目标及已达标或未达标文本，刷新结果不变。

**验证：**`npm run test -- --run tests/unit/daily.test.ts tests/integration/today.test.ts`；`npm run build`。人工检查：记录工作日两次跑步，确认从未达标切换为已完成。

**依赖：**T05。

**预计文件：**`src/domain/daily.ts`, `src/ui/today.ts`, `src/main.ts`, `tests/unit/daily.test.ts`, `tests/integration/today.test.ts`。

**范围：**M（3–5 个文件）。

### T07：计算隔天日程与漏跑

**描述：**落实本项目的 streak 规则：没有 streak 数值，仅推导日程。

**验收标准：**
- 按每日汇总升序处理；达标后加两个日历日，休息日达标也更新，同日追加不重复顺延。
- 未达标不移动日期；过期计划只标一次漏跑，不滚动积累欠账，补跑目标按实际当天确定。
- 覆盖 SPEC 第 4 节全部日程示例及乱序记录；无 streak 字段或归零逻辑。

**验证：**`npm run test -- --run tests/unit/schedule.test.ts`；`npm run build`。人工检查：逐项对照规格验收表的预期日期。

**依赖：**T06。

**预计文件：**`src/domain/schedule.ts`, `tests/unit/schedule.test.ts`。

**范围：**S（1–2 个文件）。

### T08：展示今天安排与跨日状态

**描述：**把日程结果接入用户首页。

**验收标准：**
- 显示尚未开始、休息、今天该跑、逾期与下次日期；优先显示今日达标，未达标时仍揭示逾期。
- 今天结束前不标漏跑；跨午夜和恢复前台自动重算，保存日期不迁移。
- 首页不显示任何连续天数或归零惩罚。

**验证：**`npm run test -- --run tests/integration/today.test.ts tests/integration/clock.test.ts`；`npm run build`。人工检查：模拟周三漏跑、周四达标，检查下次周六及周末 10 公里目标。

**依赖：**T07。

**预计文件：**`src/ui/today.ts`, `src/ui/clock.ts`, `src/main.ts`, `tests/integration/today.test.ts`, `tests/integration/clock.test.ts`。

**范围：**M（3–5 个文件）。

### T09：展示历史与累计统计

**描述：**提供按日期分组的独立跑步明细和总体成果。

**验收标准：**
- 历史倒序分组，显示每次距离、日合计、目标与日状态，漏跑标记不冒充记录。
- 总次数等于记录条数，总公里含未达标日；空状态显示 0 次、0 公里并提供记录入口。
- 新增后首页统计与历史立即一致，刷新一致，不持久化派生统计。

**验证：**`npm run test -- --run tests/unit/stats.test.ts tests/integration/history.test.ts`；`npm run build`。人工检查：同日两次合计 5 公里显示 2 次；再加入未达标记录确认累计增加。

**依赖：**T08。

**预计文件：**`src/domain/stats.ts`, `src/ui/history.ts`, `src/main.ts`, `tests/unit/stats.test.ts`, `tests/integration/history.test.ts`。

**范围：**M（3–5 个文件）。

### T10：编辑与补录历史跑步

**描述：**修正误填并验证日程可从事实记录重算。

**验收标准：**
- 可新增过去记录但不得早于开始日期或晚于今天；编辑保留原 id，仅修改选中记录。
- 跨日期编辑重算两天累计和整个日程，全部界面同步。
- 取消不修改数据，保存失败保留输入与旧数据。

**验证：**`npm run test -- --run tests/integration/edit-run.test.ts`；`npm run build`。人工检查：将同日 3+2 公里中的 2 公里移到次日，确认原日不再达标。

**依赖：**T09。

**预计文件：**`src/domain/runs.ts`, `src/ui/run-form.ts`, `src/ui/history.ts`, `src/main.ts`, `tests/integration/edit-run.test.ts`。

**范围：**M（3–5 个文件）。

### T11：删除指定跑步记录

**描述：**安全纠正多记记录。

**验收标准：**
- 删除前明确确认，取消不变；确认只删除选中 id。
- 删除当天达标所需的一条记录后，重算状态、统计和日程，保留其他记录。
- 写入失败不从已保存状态移除记录，显示错误；成功后刷新一致。

**验证：**`npm run test -- --run tests/integration/delete-run.test.ts`；`npm run build`。人工检查：删除同日 3+2 公里中的 2 公里，验证剩余 1 次、3 公里及重算日程。

**依赖：**T10。

**预计文件：**`src/domain/runs.ts`, `src/ui/history.ts`, `src/main.ts`, `tests/integration/delete-run.test.ts`。

**范围：**M（3–5 个文件）。

### T12：完善存储恢复与标签页冲突提示

**描述：**补齐异常路径，保护已有记录。

**验收标准：**
- 损坏 JSON、未知版本和读取禁用均明确提示并保留原值；清除需确认且只删应用键。
- 模拟写入拒绝或容量不足，保留输入且无假成功。
- storage 变化触发刷新提示；编辑中保留草稿，重新加载后需重新应用编辑，不静默覆盖已发现的外部变化。

**验证：**`npm run test -- --run tests/integration/storage.test.ts`；`npm run build`。人工检查：打开两个标签页修改数据，确认另一页提示；取消恢复操作不丢数据。

**依赖：**T11。

**预计文件：**`src/storage/local-store.ts`, `src/ui/storage-status.ts`, `src/main.ts`, `tests/integration/storage.test.ts`。

**范围：**M（3–5 个文件）。

### T13：检查响应式与可访问交互

**描述：**统一核心页面的可用性。

**验收标准：**
- 窄屏和桌面无横向溢出，首页以今天安排优先，统计次之。
- 表单有标签、键盘焦点与字段错误文本；状态不只依靠颜色。
- 中文文案中性，本地保存限制清楚，无未授权功能入口。

**验证：**`npm run test:e2e -- --project=chromium e2e/accessibility.spec.ts`；`npm run build`。人工检查：在手机宽度与桌面宽度走一遍键盘记录和编辑流程。

**依赖：**T12。

**预计文件：**`src/styles/app.css`, `src/main.ts`, `src/ui/run-form.ts`, `src/ui/history.ts`, `e2e/accessibility.spec.ts`。

**范围：**M（3–5 个文件）。

### T14：端到端验收与本地数据边界验证

**描述：**用真实浏览器验证完整规格并记录结果。

**验收标准：**
- 覆盖首次设置、同日多次、达标、漏跑补跑、编辑删除、刷新及重新打开后的持久化。
- 固定本地时钟验证完整日期路径；独立浏览器上下文不共享记录，业务操作无外部请求。
- 类型检查、lint、构建、单元集成测试及 Chromium E2E 通过，日程与校验分支覆盖率至少 90%。

**验证：**`npm run typecheck && npm run lint && npm run test -- --run --coverage && npm run build && npm run test:e2e -- --project=chromium`；`npm run build`。人工检查：对照 SPEC 第 12 节逐条签核；只记录实际执行结果。

**依赖：**T13。

**预计文件：**`e2e/running-flow.spec.ts`, `e2e/local-data.spec.ts`, `docs/verification.md`。

**范围：**M（3–5 个文件）。

## 检查点

每两项任务后检查：T01–T02 工程入口；T03–T04 首次设置持久化；T05–T06 同日多次达标；T07–T08 日程；T09–T10 历史与修正；T11–T12 删除与异常；T13–T14 最终验收。

各检查点执行当时已有的相关测试、类型检查与构建，演示对应完整路径，并供用户审阅。T02 尚无业务测试时，仅验证工具配置，不宣称业务通过。最终检查点覆盖 SPEC 全部成功标准。进度勾选见 todo.md。

## 风险与处理

| 风险 | 影响 | 处理 |
|---|---|---|
| 本次通用措辞与规格不一致 | 高 | 显式映射到跑步与无 streak 的既定范围，不静默增功能 |
| 时区或 UTC 转换造成错日 | 高 | 本地日期纯函数，日期边界测试提前至 T03 |
| 同日多次重复顺延日程 | 高 | 先汇总每日距离再处理一次，T06–T07 验证 |
| 修改历史只更新局部导致日程错误 | 高 | 每次写入后从所有记录完整重算 |
| localStorage 不可用或内容损坏 | 高 | T04 起禁止假成功，T12 补齐恢复与冲突路径 |
| 多标签页同时写入 | 中 | 发现变更时阻止静默覆盖并提示重载；不承诺事务一致性 |
| 脚手架任务变大 | 中 | 限制文件范围，必要时继续拆分，保留验证要求 |

## 待审阅与非目标

产品审核项已经解决。计划沿用规格中的技术建议，等待本计划审阅后再实施。没有新增账号、云端同步、多习惯管理、手动绕过跑量的完成按钮、streak 计数、GPS 或提醒功能。当前仅写规划文件，不修改 SPEC、不生成应用代码。
