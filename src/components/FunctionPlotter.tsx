import React, { useState, useEffect, useRef } from 'react';
import { PlotPoint, PythonPlotResponse } from '../types';
import { plotPythonFunction } from '../lib/pythonClient';
import {
  LineChart,
  Play,
  RotateCcw,
  Sparkles,
  Code2,
  Crosshair,
  TrendingUp,
  Info,
} from 'lucide-react';

interface FunctionPlotterProps {
  onViewCode: (title: string, code: string, explanation?: string) => void;
}

const PRESET_FUNCTIONS = [
  {
    name: 'Seno Amortecido',
    expr: 'exp(-0.15*x) * sin(2*x)',
    xMin: -5,
    xMax: 15,
    desc: 'Decaimento exponencial oscilatório (física/mecânica)',
  },
  {
    name: 'Gaussiana (Normal)',
    expr: 'exp(-(x**2)/2) / sqrt(2*pi)',
    xMin: -5,
    xMax: 5,
    desc: 'Distribuição normal padrão estatística',
  },
  {
    name: 'Polinômio Cúbico',
    expr: '0.1 * x**3 - x',
    xMin: -5,
    xMax: 5,
    desc: 'Função cúbica com 3 raízes reais',
  },
  {
    name: 'Sigmoide (Logística)',
    expr: '1 / (1 + exp(-x))',
    xMin: -6,
    xMax: 6,
    desc: 'Função de ativação para Machine Learning',
  },
  {
    name: 'Oscilador Harmônico',
    expr: 'cos(x) + 0.5 * cos(3*x)',
    xMin: -10,
    xMax: 10,
    desc: 'Superposição de duas frequências harmônicas',
  },
  {
    name: 'Parábola com Raízes',
    expr: 'x**2 - 4*x + 3',
    xMin: -2,
    xMax: 6,
    desc: 'Parábola quadrática com raízes em x=1 e x=3',
  },
];

export const FunctionPlotter: React.FC<FunctionPlotterProps> = ({ onViewCode }) => {
  const [funcExpr, setFuncExpr] = useState('exp(-0.15*x) * sin(2*x)');
  const [xMin, setXMin] = useState<number>(-5);
  const [xMax, setXMax] = useState<number>(15);
  const [points, setPoints] = useState<PlotPoint[]>([]);
  const [roots, setRoots] = useState<number[]>([]);
  const [minY, setMinY] = useState<number | null>(null);
  const [maxY, setMaxY] = useState<number | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Crosshair probe
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  const handlePlot = async (exprToRun = funcExpr, minX = xMin, maxX = xMax) => {
    if (!exprToRun.trim()) return;

    setLoading(true);
    setError(null);

    const res: PythonPlotResponse = await plotPythonFunction(exprToRun, minX, maxX, 250);
    setLoading(false);

    if (res.success && res.points) {
      setPoints(res.points);
      setRoots(res.roots || []);
      setMinY(res.min_y !== undefined ? res.min_y : null);
      setMaxY(res.max_y !== undefined ? res.max_y : null);
      setExecTime(res.execution_time_ms || 1.0);
    } else {
      setError(res.error || 'Erro ao avaliar função matemática em Python');
    }
  };

  useEffect(() => {
    handlePlot();
  }, []);

  const handleApplyPreset = (preset: (typeof PRESET_FUNCTIONS)[0]) => {
    setFuncExpr(preset.expr);
    setXMin(preset.xMin);
    setXMax(preset.xMax);
    handlePlot(preset.expr, preset.xMin, preset.xMax);
  };

  // Convert math coords (x, y) to SVG viewBox coords (width 700, height 400)
  const svgWidth = 700;
  const svgHeight = 400;
  const padding = 50;

  const validPoints = points.filter((p) => p.y !== null);
  const computedMinY = minY !== null && isFinite(minY) ? minY : -2;
  const computedMaxY = maxY !== null && isFinite(maxY) ? maxY : 2;

  // Add margin around Y domain
  const ySpan = Math.max(computedMaxY - computedMinY, 0.5);
  const plotMinY = computedMinY - ySpan * 0.12;
  const plotMaxY = computedMaxY + ySpan * 0.12;

  const toSvgX = (x: number) => {
    return padding + ((x - xMin) / (xMax - xMin)) * (svgWidth - 2 * padding);
  };

  const toSvgY = (y: number) => {
    return (
      svgHeight -
      padding -
      ((y - plotMinY) / (plotMaxY - plotMinY)) * (svgHeight - 2 * padding)
    );
  };

  // Build SVG path
  let pathD = '';
  let isMoving = true;
  for (const pt of points) {
    if (pt.y === null) {
      isMoving = true;
    } else {
      const px = toSvgX(pt.x);
      const py = toSvgY(pt.y);
      if (isMoving) {
        pathD += `M ${px.toFixed(2)} ${py.toFixed(2)} `;
        isMoving = false;
      } else {
        pathD += `L ${px.toFixed(2)} ${py.toFixed(2)} `;
      }
    }
  }

  // Handle SVG Mouse hover for crosshair
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgRelX = (clientX / rect.width) * svgWidth;

    if (svgRelX < padding || svgRelX > svgWidth - padding) {
      setHoverCoord(null);
      return;
    }

    // Map svgRelX to x
    const currX = xMin + ((svgRelX - padding) / (svgWidth - 2 * padding)) * (xMax - xMin);

    // Find closest point in array
    let closestPt = points[0];
    let minDiff = Infinity;
    for (const pt of points) {
      if (pt.y !== null) {
        const diff = Math.abs(pt.x - currX);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = pt;
        }
      }
    }

    if (closestPt && closestPt.y !== null) {
      setHoverCoord({ x: closestPt.x, y: closestPt.y });
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  const openCodeModal = () => {
    const code = `# Plotando f(x) = ${funcExpr} em Python
import numpy as np
import matplotlib.pyplot as plt
import math

# Definir domínio [${xMin}, ${xMax}]
x = np.linspace(${xMin}, ${xMax}, 500)

# Função f(x)
def f(x_val):
    return [(${funcExpr}) for x in x_val]

y = f(x)

# Criar gráfico estilizado com matplotlib
plt.figure(figsize=(10, 6))
plt.plot(x, y, label='f(x) = ${funcExpr}', color='#2563EB', linewidth=2)
plt.axhline(0, color='gray', linestyle='--', linewidth=0.8)
plt.axvline(0, color='gray', linestyle='--', linewidth=0.8)
plt.grid(True, linestyle=':', alpha=0.6)
plt.title('Gráfico de f(x) em Python', fontsize=14, fontweight='bold')
plt.xlabel('x', fontsize=12)
plt.ylabel('f(x)', fontsize=12)
plt.legend()
plt.tight_layout()
plt.show()`;

    onViewCode(
      'Código Python de Plotagem (Matplotlib)',
      code,
      'Este script Python usa numpy e matplotlib para gerar o gráfico vetorial idêntico no terminal ou notebook Jupyter.'
    );
  };

  // Generate nice tick marks for axes
  const xTicks = [
    xMin,
    xMin + (xMax - xMin) * 0.25,
    xMin + (xMax - xMin) * 0.5,
    xMin + (xMax - xMin) * 0.75,
    xMax,
  ];

  const yTicks = [
    plotMinY,
    plotMinY + (plotMaxY - plotMinY) * 0.5,
    plotMaxY,
  ];

  const originX = toSvgX(0);
  const originY = toSvgY(0);
  const showXAxis = originY >= padding && originY <= svgHeight - padding;
  const showYAxis = originX >= padding && originX <= svgWidth - padding;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Control Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Function expression input */}
          <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-sm">
              f(x) =
            </span>
            <input
              type="text"
              value={funcExpr}
              onChange={(e) => setFuncExpr(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlot()}
              placeholder="ex: sin(x) * exp(-0.1*x)"
              className="w-full bg-transparent font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 focus:outline-hidden"
            />
          </div>

          {/* Range Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-500">x min:</span>
              <input
                type="number"
                value={xMin}
                onChange={(e) => setXMin(Number(e.target.value))}
                className="w-14 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <span className="text-slate-500">x max:</span>
              <input
                type="number"
                value={xMax}
                onChange={(e) => setXMax(Number(e.target.value))}
                className="w-14 bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Plot Button & View Code */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePlot()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors shrink-0"
            >
              {loading ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Plotar f(x)</span>
            </button>
            <button
              onClick={openCodeModal}
              className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
              title="Ver código Python (Matplotlib)"
            >
              <Code2 className="w-4 h-4 text-blue-500" />
            </button>
          </div>
        </div>

        {/* Presets Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-medium mr-1">
            Funções Prontas:
          </span>
          {PRESET_FUNCTIONS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handleApplyPreset(preset)}
              className="px-2.5 py-1 text-xs rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas / Chart Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs relative overflow-hidden">
        {/* HUD Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">
              f(x) = {funcExpr}
            </span>
            <span aria-hidden="true">·</span>
            <span>Domínio: [{xMin}, {xMax}]</span>
            {execTime !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{execTime} ms</span>
              </>
            )}
          </div>

          {hoverCoord ? (
            <div className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-mono">
              x: {hoverCoord.x} · y: {hoverCoord.y}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Crosshair className="w-3.5 h-3.5" />
              <span>Passe o cursor sobre a curva para inspecionar (x, y)</span>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 my-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-mono">
            ✖ {error}
          </div>
        )}

        {/* SVG Graph Viewport */}
        <div className="relative w-full aspect-16/9 sm:aspect-21/9 my-2">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-full cursor-crosshair select-none"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Background gridlines */}
            {xTicks.map((xt, i) => {
              const px = toSvgX(xt);
              return (
                <g key={`x-grid-${i}`}>
                  <line
                    x1={px}
                    y1={padding}
                    x2={px}
                    y2={svgHeight - padding}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800/80 stroke-1 stroke-dasharray-2-2"
                  />
                  <text
                    x={px}
                    y={svgHeight - padding + 16}
                    textAnchor="middle"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {xt.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {yTicks.map((yt, i) => {
              const py = toSvgY(yt);
              return (
                <g key={`y-grid-${i}`}>
                  <line
                    x1={padding}
                    y1={py}
                    x2={svgWidth - padding}
                    y2={py}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-slate-800/80 stroke-1 stroke-dasharray-2-2"
                  />
                  <text
                    x={padding - 8}
                    y={py + 3}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-400"
                  >
                    {yt.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {/* Axes: X Axis */}
            {showXAxis && (
              <line
                x1={padding}
                y1={originY}
                x2={svgWidth - padding}
                y2={originY}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700 stroke-1.5"
              />
            )}

            {/* Axes: Y Axis */}
            {showYAxis && (
              <line
                x1={originX}
                y1={padding}
                x2={originX}
                y2={svgHeight - padding}
                stroke="currentColor"
                className="text-slate-300 dark:text-slate-700 stroke-1.5"
              />
            )}

            {/* Main function plot line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="url(#curve-gradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Linear Gradient for curve */}
            <defs>
              <linearGradient id="curve-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
            </defs>

            {/* Roots indicators (where f(x)=0) */}
            {roots.map((r, idx) => {
              const rx = toSvgX(r);
              const ry = toSvgY(0);
              if (rx >= padding && rx <= svgWidth - padding) {
                return (
                  <g key={`root-${idx}`}>
                    <circle cx={rx} cy={ry} r="4.5" fill="#EF4444" />
                    <circle cx={rx} cy={ry} r="7" fill="none" stroke="#EF4444" strokeWidth="1" opacity="0.6" />
                  </g>
                );
              }
              return null;
            })}

            {/* Hover Crosshair Probe Indicator */}
            {hoverCoord && (
              <g>
                <circle
                  cx={toSvgX(hoverCoord.x)}
                  cy={toSvgY(hoverCoord.y)}
                  r="5"
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <line
                  x1={toSvgX(hoverCoord.x)}
                  y1={padding}
                  x2={toSvgX(hoverCoord.x)}
                  y2={svgHeight - padding}
                  stroke="#2563EB"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <line
                  x1={padding}
                  y1={toSvgY(hoverCoord.y)}
                  x2={svgWidth - padding}
                  y2={toSvgY(hoverCoord.y)}
                  stroke="#2563EB"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Telemetry Tray / Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Mínimo f(x)
            </span>
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {minY !== null ? minY : '--'}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Máximo f(x)
            </span>
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {maxY !== null ? maxY : '--'}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Raízes Detectadas (f(x)=0)
            </span>
            <span className="text-sm font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
              {roots.length > 0 ? roots.join(', ') : 'Nenhuma no intervalo'}
            </span>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400 block">
              Pontos Amostrados
            </span>
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200 tabular-nums">
              {points.length} pontos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
