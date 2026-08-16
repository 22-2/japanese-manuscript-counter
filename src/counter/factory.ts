import { LegacyManuscriptCounter } from "./legacy-manuscript-counter";
import { LineLayoutCounter } from "./line-layout-counter";
import type { Counter, CounterOptions } from "./types";
import type { ManuscriptPreset } from "../presets/presets";

export function createCounter(preset: ManuscriptPreset, options: CounterOptions): Counter {
  if (preset.engine === "line-layout") {
    return new LineLayoutCounter(preset, options);
  }

  return new LegacyManuscriptCounter(options);
}
