import type { Run } from "./model";
export function stats(runs: Run[]) {
  return {
    count: runs.length,
    meters: runs.reduce((sum, run) => sum + run.distanceMeters, 0),
  };
}
