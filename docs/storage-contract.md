# localStorage 模块契约

状态：已实现。用户确认保留跑步专用规则；不增加通用习惯、手动完成或 streak。当前唯一已知持久化格式为 `running-tracker:v1`，无需变更已有数据。

## 边界

存储模块负责解析、版本识别、输入校验、保存和错误分类。界面不直接解析 JSON、不访问 localStorage、不通过错误消息字符串判断失败类型。日期、达标和 streak 等产品规则由领域模块计算，不由存储模块计算或保存派生结果。

## 输入与输出

```ts
type StorageErrorCode =
  | 'UNAVAILABLE'
  | 'INVALID_DATA'
  | 'UNSUPPORTED_VERSION'
  | 'QUOTA_EXCEEDED'
  | 'WRITE_FAILED'
  | 'CONFLICT';

type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: StorageErrorCode; message: string } };

type SnapshotToken = string & { readonly snapshotToken: unique symbol };

type LoadValue<T> =
  | { state: 'missing'; token: SnapshotToken }
  | { state: 'ready'; data: T; token: SnapshotToken };

interface LocalStore<T> {
  load(): StorageResult<LoadValue<T>>;
  save(input: { data: T; expectedToken: SnapshotToken }):
    StorageResult<{ data: T; token: SnapshotToken }>;
  reset(): StorageResult<void>; // 仅在用户明确确认清除后调用
}
```

接口同步返回，所有预期存储错误采用同一 result 形式，不混用抛异常、null 和错误对象。token 是调用者不可解释的快照标识；每次保存使用最近一次成功 load/save 的 token。

实际入口为 `createLocalStore({ storage?, today? })`，默认使用浏览器 localStorage 与设备本地日期；可注入存储与时钟进行确定性测试。具体 TypeScript 类型见 `src/storage/contract.ts`，T 固定为 TrackerData。当前没有已知旧格式迁移器，也不暴露尚未实现的迁移字段。

## 当前已知数据 schema

```ts
interface RunningDataV1 {
  schemaVersion: 1;
  startDate: string; // 真实有效的本地日期 YYYY-MM-DD
  runs: Array<{
    id: string; // 非空、唯一、创建后稳定
    date: string;
    distanceMeters: number; // 正安全整数
  }>;
}
```

距离使用整数米，同日可以有多个独立 id。校验包含日期范围、重复 id 和总距离的安全整数范围。load 和 save 都校验边界数据；界面收到的是独立副本，不能靠修改返回对象隐式修改存储。

## load 行为

| 存储内容 | 返回 | 副作用 |
|---|---|---|
| 键不存在 | 成功，state=missing，附快照 token | 不创建记录、不自动保存默认值 |
| 当前版本且校验成功 | 成功，state=ready，附数据与 token | 不写入 |
| 已发布旧版本且未来有明确迁移器 | 未来扩展点，需先定义映射与测试；当前未实现 | 禁止未定义的自动迁移 |
| 未知旧版本或更新版本 | UNSUPPORTED_VERSION | 保留原始值，禁止猜测 schema 或覆盖 |
| JSON 损坏、缺少版本或 schema 不合法 | INVALID_DATA | 保留原始值 |
| 浏览器拒绝访问存储 | UNAVAILABLE | 不以空数据代替失败 |

目前没有发布过 v0 格式，因此不编造 v0 迁移规则。若本轮建立新版 schema，必须明确写出从现有 v1 到新版本的映射，并用旧数据样例测试。迁移不得伪造用户完成记录或丢弃真实跑步明细。

## save 行为

1. 校验完整候选文档，失败返回 INVALID_DATA，不写入。
2. 读取当前快照并与 expectedToken 比较；不同返回 CONFLICT，不覆盖。未成功 load 的界面不能盲写默认值。
3. 一次 setItem 保存完整 JSON；成功后才返回新的数据副本和 token，界面此时才显示已保存。
4. 区分容量不足、权限拒绝和其他写入错误；失败保留当前输入与最近一次成功状态，不自动清空或删除原数据。

全量替换在内容相同的情况下不会重复追加记录；新增记录 id 应在一个用户意图开始时生成，重试复用。检查快照再写入并不是原子比较交换：localStorage 无法保证多标签页同时提交的强一致性，此限制必须保留在文档中，不宣称有事务锁。

## 界面约束

- missing：显示空状态或首次创建入口。
- ready：正常显示现有 v1 跑步数据。
- load 错误：显示可访问的错误提示和重试入口，不显示虚假的空列表。
- save 错误：保留草稿，焦点留在可修正位置；不显示完成成功状态。
- conflict：提示重新加载；重载时保留草稿，由用户重新应用，不自动覆盖新数据。
- 任何清除数据的恢复入口均独立于 load/save，并需要明确确认。

## 契约测试

缺失键不写入；当前版本往返；未知旧版本（包括 v0）与新版本原样保留；损坏数据原样保留；容量与权限异常；过期 token 拒绝；成功返回副本；同一记录意图重试不重复；失败不改变界面保存状态。
