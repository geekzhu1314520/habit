import { localToday } from "../domain/date";
import { validate } from "../domain/model";
import type {
  LocalStore,
  SnapshotToken,
  StorageErrorCode,
  StorageResult,
} from "./contract";
export type { SnapshotToken } from "./contract";
export const KEY = "running-tracker:v1";
export type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const messages: Record<StorageErrorCode, string> = {
  UNAVAILABLE: "无法访问本地存储，请检查浏览器权限。",
  INVALID_DATA: "数据格式无效，原始记录已保留。",
  UNSUPPORTED_VERSION:
    "此数据版本暂不支持，原始记录已保留。请使用支持该版本的应用。",
  QUOTA_EXCEEDED: "无法保存：本地存储空间不足，当前输入已保留。",
  WRITE_FAILED: "无法保存，当前输入与原始记录已保留，请重试。",
  CONFLICT: "其他标签页已更改记录，请重新加载后再保存。",
};
function failure(code: StorageErrorCode): StorageResult<never> {
  return { ok: false, error: { code, message: messages[code] } };
}
function writeFailure(error: unknown): StorageResult<never> {
  const name =
    error && typeof error === "object" && "name" in error ? error.name : "";
  return failure(
    name === "QuotaExceededError"
      ? "QUOTA_EXCEEDED"
      : name === "SecurityError"
        ? "UNAVAILABLE"
        : "WRITE_FAILED",
  );
}
const token = (raw: string | null) => JSON.stringify([raw]) as SnapshotToken;
export function createLocalStore(
  options: { storage?: () => StoragePort; today?: () => string } = {},
): LocalStore {
  const storage = options.storage ?? (() => localStorage);
  const today = options.today ?? localToday;
  return {
    load() {
      let raw: string | null;
      try {
        raw = storage().getItem(KEY);
      } catch {
        return failure("UNAVAILABLE");
      }
      if (raw === null)
        return { ok: true, value: { state: "missing", token: token(raw) } };
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        return failure("INVALID_DATA");
      }
      if (
        parsed &&
        typeof parsed === "object" &&
        "schemaVersion" in parsed &&
        typeof parsed.schemaVersion === "number" &&
        parsed.schemaVersion !== 1
      )
        return failure("UNSUPPORTED_VERSION");
      try {
        return {
          ok: true,
          value: {
            state: "ready",
            data: validate(parsed, today()),
            token: token(raw),
          },
        };
      } catch {
        return failure("INVALID_DATA");
      }
    },
    save({ data, expectedToken }) {
      let checked;
      try {
        checked = validate(data, today());
      } catch {
        return failure("INVALID_DATA");
      }
      let port: StoragePort;
      try {
        port = storage();
        if (token(port.getItem(KEY)) !== expectedToken)
          return failure("CONFLICT");
      } catch {
        return failure("UNAVAILABLE");
      }
      try {
        const raw = JSON.stringify(checked);
        port.setItem(KEY, raw);
        return { ok: true, value: { data: checked, token: token(raw) } };
      } catch (error) {
        return writeFailure(error);
      }
    },
    reset() {
      try {
        storage().removeItem(KEY);
        return { ok: true, value: undefined };
      } catch (error) {
        return writeFailure(error);
      }
    },
  };
}
