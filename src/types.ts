export type CalculatorTab = 'keypad' | 'script' | 'plot' | 'tools';

export interface CalculationHistoryItem {
  id: string;
  expression: string;
  result: string;
  resultType?: string;
  timestamp: number;
  executionTimeMs?: number;
  stdout?: string;
}

export interface PythonVariableInfo {
  value: string;
  type: string;
}

export interface PythonEvalResponse {
  success: boolean;
  result?: string;
  raw_result?: string;
  result_type?: string;
  stdout?: string;
  stderr?: string;
  error?: string | null;
  variables?: Record<string, PythonVariableInfo>;
  execution_time_ms?: number;
}

export interface PlotPoint {
  x: number;
  y: number | null;
}

export interface PythonPlotResponse {
  success: boolean;
  func?: string;
  points?: PlotPoint[];
  roots?: number[];
  min_y?: number | null;
  max_y?: number | null;
  execution_time_ms?: number;
  error?: string;
}

export interface ScriptTemplate {
  id: string;
  title: string;
  description: string;
  code: string;
  category: 'Álgebra' | 'Estatística' | 'Física' | 'Algoritmos';
}

export interface FinanceResult {
  totalInvested: number;
  totalInterest: number;
  futureValue: number;
  timeline: Array<{
    month: number;
    year: number;
    invested: number;
    interest: number;
    total: number;
  }>;
}

export interface StatsResult {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode?: string;
  stdev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
}
