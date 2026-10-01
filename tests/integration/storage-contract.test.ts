import { expect, it } from "vitest";
import {
  createLocalStore,
  KEY,
  type StoragePort,
} from "../../src/storage/local-store";
const data = {
  schemaVersion: 1 as const,
  startDate: "2026-10-01",
  runs: [{ id: "a", date: "2026-10-01", distanceMeters: 3000 }],
};
function fixture(raw: string | null = null) {
  let value = raw;
  const port: StoragePort = {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    removeItem: () => {
      value = null;
    },
  };
  return {
    store: createLocalStore({ storage: () => port, today: () => "2026-10-08" }),
    port,
    raw: () => value,
  };
}
it("缺失数据返回 missing，不写入默认值", () => {
  const f = fixture();
  const result = f.store.load();
  expect(result).toMatchObject({ ok: true, value: { state: "missing" } });
  expect(f.raw()).toBeNull();
});
it("保存当前 schema 并返回独立快照", () => {
  const f = fixture();
  const loaded = f.store.load();
  if (!loaded.ok) throw Error();
  const saved = f.store.save({ data, expectedToken: loaded.value.token });
  expect(saved.ok).toBe(true);
  if (!saved.ok) throw Error();
  saved.value.data.runs[0].distanceMeters = 9999;
  expect(JSON.parse(f.raw()!).runs[0].distanceMeters).toBe(3000);
  expect(f.store.load()).toMatchObject({
    ok: true,
    value: { state: "ready", data },
  });
});
it.each([0, 2, 99])("未知版本 %i 原样保留", (version) => {
  const raw = JSON.stringify({ ...data, schemaVersion: version });
  const f = fixture(raw);
  expect(f.store.load()).toMatchObject({
    ok: false,
    error: { code: "UNSUPPORTED_VERSION" },
  });
  expect(f.raw()).toBe(raw);
});
it.each([
  "bad",
  "{}",
  "null",
  JSON.stringify({ ...data, runs: [{ id: "a" }] }),
])("损坏内容不伪装为空 %#", (raw) => {
  const f = fixture(raw);
  expect(f.store.load()).toMatchObject({
    ok: false,
    error: { code: "INVALID_DATA" },
  });
  expect(f.raw()).toBe(raw);
});
it("读权限错误返回 UNAVAILABLE", () => {
  const store = createLocalStore({
    storage: () => {
      throw new DOMException("denied", "SecurityError");
    },
  });
  expect(store.load()).toMatchObject({
    ok: false,
    error: { code: "UNAVAILABLE" },
  });
});
it("旧快照拒绝覆盖外部修改", () => {
  const f = fixture();
  const first = f.store.load();
  if (!first.ok) throw Error();
  f.port.setItem(KEY, JSON.stringify(data));
  expect(
    f.store.save({ data, expectedToken: first.value.token }),
  ).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
  expect(f.raw()).toBe(JSON.stringify(data));
});
it.each([
  ["QuotaExceededError", "QUOTA_EXCEEDED"],
  ["SecurityError", "UNAVAILABLE"],
  ["Error", "WRITE_FAILED"],
])("分类写入错误 %s", (name, code) => {
  const f = fixture();
  const first = f.store.load();
  if (!first.ok) throw Error();
  f.port.setItem = () => {
    throw new DOMException("private detail", name);
  };
  const result = f.store.save({ data, expectedToken: first.value.token });
  expect(result).toMatchObject({ ok: false, error: { code } });
  expect(JSON.stringify(result)).not.toContain("private detail");
  expect(f.raw()).toBeNull();
});
it("输入不合法不写入", () => {
  const f = fixture();
  const first = f.store.load();
  if (!first.ok) throw Error();
  expect(
    f.store.save({
      data: { ...data, startDate: "bad" },
      expectedToken: first.value.token,
    }),
  ).toMatchObject({ ok: false, error: { code: "INVALID_DATA" } });
  expect(f.raw()).toBeNull();
});
it("相同完整记录再次保存不追加", () => {
  const f = fixture(JSON.stringify(data));
  const first = f.store.load();
  if (!first.ok) throw Error();
  const saved = f.store.save({ data, expectedToken: first.value.token });
  if (!saved.ok) throw Error();
  expect(f.store.save({ data, expectedToken: saved.value.token }).ok).toBe(
    true,
  );
  expect(JSON.parse(f.raw()!).runs).toHaveLength(1);
});
it("旧版本未加载成功不能获得写入 token", () => {
  const f = fixture(JSON.stringify({ ...data, schemaVersion: 0 }));
  expect(f.store.load()).not.toHaveProperty("value");
});
it("reset 只删除本应用键", () => {
  const keys: string[] = [];
  const f = fixture();
  f.port.removeItem = (key) => {
    keys.push(key);
  };
  expect(f.store.reset().ok).toBe(true);
  expect(keys).toEqual([KEY]);
});
