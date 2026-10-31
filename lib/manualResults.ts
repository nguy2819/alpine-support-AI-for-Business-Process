import fs from "node:fs";
import path from "node:path";
import type { RunResult } from "./manualEval";

const RESULTS_DIR = path.join(process.cwd(), "results");

export const resultPath = (label: string) => path.join(RESULTS_DIR, `${label}.json`);

export function readRunResults(): RunResult[] {
  if (!fs.existsSync(RESULTS_DIR)) return [];
  return fs
    .readdirSync(RESULTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), "utf-8")) as RunResult);
}
