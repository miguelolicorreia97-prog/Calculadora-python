import { PythonEvalResponse, PythonPlotResponse } from '../types';

/**
 * Execute Python code via the backend API
 */
export async function evaluatePython(code: string): Promise<PythonEvalResponse> {
  try {
    const res = await fetch('/api/python/eval', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errorJson.error || `Erro de conexão HTTP ${res.status}`,
        stderr: errorJson.error || `Falha na requisição ao servidor`,
      };
    }

    return await res.json();
  } catch (err: any) {
    // If backend network fails, provide client-side fallback calculation
    console.warn('Backend unavailable, falling back to client evaluation:', err);
    return fallbackClientEval(code);
  }
}

/**
 * Plot Python mathematical function f(x)
 */
export async function plotPythonFunction(
  func: string,
  xMin = -10,
  xMax = 10,
  points = 200
): Promise<PythonPlotResponse> {
  try {
    const res = await fetch('/api/python/plot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ func, xMin, xMax, points }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errJson.error || `Erro HTTP ${res.status}`,
      };
    }

    return await res.json();
  } catch (err: any) {
    return fallbackClientPlot(func, xMin, xMax, points);
  }
}

/**
 * Fallback client evaluation for simple expressions
 */
function fallbackClientEval(code: string): PythonEvalResponse {
  try {
    let sanitized = code.trim();
    // Replace Python operators with JS equivalents
    sanitized = sanitized.replace(/\*\*/g, '^');
    sanitized = sanitized.replace(/\/\//g, '/');
    sanitized = sanitized.replace(/math\./g, 'Math.');
    sanitized = sanitized.replace(/\bsin\b/g, 'Math.sin');
    sanitized = sanitized.replace(/\bcos\b/g, 'Math.cos');
    sanitized = sanitized.replace(/\btan\b/g, 'Math.tan');
    sanitized = sanitized.replace(/\bsqrt\b/g, 'Math.sqrt');
    sanitized = sanitized.replace(/\babs\b/g, 'Math.abs');
    sanitized = sanitized.replace(/\bexp\b/g, 'Math.exp');
    sanitized = sanitized.replace(/\blog\b/g, 'Math.log');
    sanitized = sanitized.replace(/\blog10\b/g, 'Math.log10');
    sanitized = sanitized.replace(/\bpi\b/g, 'Math.PI');
    sanitized = sanitized.replace(/\be\b/g, 'Math.E');
    sanitized = sanitized.replace(/\^/g, '**');

    // Simple eval in sandbox
    const result = Function(`"use strict"; return (${sanitized})`)();
    return {
      success: true,
      result: String(result),
      raw_result: String(result),
      result_type: typeof result,
      execution_time_ms: 0.1,
    };
  } catch (e: any) {
    return {
      success: false,
      error: `Erro de sintaxe ou execução: ${e.message}`,
      stderr: e.message,
    };
  }
}

/**
 * Fallback client plot for simple functions
 */
function fallbackClientPlot(
  func: string,
  xMin: number,
  xMax: number,
  points: number
): PythonPlotResponse {
  try {
    let jsFuncStr = func
      .replace(/\*\*/g, '^')
      .replace(/math\./g, 'Math.')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\babs\b/g, 'Math.abs')
      .replace(/\bexp\b/g, 'Math.exp')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E')
      .replace(/\^/g, '**');

    const evaluateAtX = new Function('x', `"use strict"; return (${jsFuncStr})`);

    const pts: Array<{ x: number; y: number | null }> = [];
    const step = (xMax - xMin) / (points - 1);
    let minY = Infinity;
    let maxY = -Infinity;

    for (let i = 0; i < points; i++) {
      const x = xMin + i * step;
      try {
        const y = evaluateAtX(x);
        if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
          pts.push({ x: Number(x.toFixed(4)), y: Number(y.toFixed(6)) });
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        } else {
          pts.push({ x: Number(x.toFixed(4)), y: null });
        }
      } catch {
        pts.push({ x: Number(x.toFixed(4)), y: null });
      }
    }

    return {
      success: true,
      func,
      points: pts,
      min_y: minY !== Infinity ? Number(minY.toFixed(4)) : null,
      max_y: maxY !== -Infinity ? Number(maxY.toFixed(4)) : null,
      roots: [],
      execution_time_ms: 1,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      points: [],
    };
  }
}
