import type { TrackerData } from "../domain/model";
export type StorageErrorCode =
  | "UNAVAILABLE"
  | "INVALID_DATA"
  | "UNSUPPORTED_VERSION"
  | "QUOTA_EXCEEDED"
  | "WRITE_FAILED"
  | "CONFLICT";
export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: StorageErrorCode; message: string } };
export type SnapshotToken = string & { readonly snapshotToken: unique symbol };
export type LoadValue =
  | { state: "missing"; token: SnapshotToken }
  | { state: "ready"; data: TrackerData; token: SnapshotToken };
export interface LocalStore {
  load(): StorageResult<LoadValue>;
  save(input: {
    data: TrackerData;
    expectedToken: SnapshotToken;
  }): StorageResult<{ data: TrackerData; token: SnapshotToken }>;
  /** Destructive recovery; the UI must ask for explicit confirmation first. */
  reset(): StorageResult<void>;
}
