/**
 * FA → investment adapter lives only in advisor-crm (uses analyses module).
 * Stub keeps the package self-contained for the marketing site.
 */

import type { ProjectionInputs, ProjectionResult } from "./investment.engine";
import type { GrowthChartData } from "./investment.charts";

export interface FaStrategySlice {
  investments: unknown[];
  strategy: { profile?: string; conservativeMode?: boolean };
  client?: { birthDate?: string } | null;
}

export function getProjectionFromFaStrategy(_slice: FaStrategySlice): {
  projectionResult: ProjectionResult;
  growthChartData: GrowthChartData;
  hasInputs: boolean;
} {
  throw new Error(
    "getProjectionFromFaStrategy is only available in advisor-crm (financial analysis module)."
  );
}

export type { ProjectionInputs };
