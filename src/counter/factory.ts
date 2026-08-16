import { LegacyManuscriptCounter } from "src/counter/legacy-manuscript-counter";
import { LineLayoutCounter } from "src/counter/line-layout-counter";
import type { Counter, CounterOptions } from "src/counter/types";
import type { ManuscriptPreset } from "src/presets/presets";

export function createCounter(preset: ManuscriptPreset, options: CounterOptions): Counter {
  if (preset.engine === "line-layout") {
    return new LineLayoutCounter(preset, options);
  }

  return new LegacyManuscriptCounter(options);
}
