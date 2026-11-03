import React, { useState, useEffect, useRef } from 'react';
import { CalculationHistoryItem } from '../types';
import { evaluatePython } from '../lib/pythonClient';
import {
  Delete,
  RotateCcw,
  Clock,
  Code2,
  Copy,
  Check,
  Trash2,
  CornerDownLeft,
  ChevronRight,
  Info,
} from 'lucide-react';

interface KeypadCalculatorProps {
  history: CalculationHistoryItem[];
  onAddHistory: (item: CalculationHistoryItem) => void;
  onClearHistory: () => void;
  onViewCode: (title: string, code: string, explanation?: string) => void;
}

export const KeypadCalculator: React.FC<KeypadCalculatorProps> = ({
  history,
  onAddHistory,
  onClearHistory,
  onViewCode,
}) => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState<number>(0);
  const [lastAns, setLastAns] = useState<string>('0');
  const [activeFuncCategory, setActiveFuncCategory] = useState<'trig' | 'algebra' | 'log' | 'constants'>('trig');
  const [copiedResult, setCopiedResult] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid capturing when user is typing in other inputs
      if (e.target !== inputRef.current && (e.target as HTMLElement)?.tagName === 'INPUT') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expression, lastAns]);

  const handleCalculate = async () => {
    if (!expression.trim()) return;

    setLoading(true);
    setError(null);

    // Replace Ans token with actual previous answer
    const parsedExpr = expression.replace(/\bAns\b/g, lastAns);

    const res = await evaluatePython(parsedExpr);
    setLoading(false);

    if (res.success && res.result !== undefined && res.result !== null) {
      setResult(res.result);
      setResultType(res.result_type || 'number');
      setExecTime(res.execution_time_ms || 0.5);
      setLastAns(res.result);

      onAddHistory({
        id: Math.random().toString(36).substring(2, 9),
        expression,
        result: res.result,
        resultType: res.result_type,
        timestamp: Date.now(),
        executionTimeMs: res.execution_time_ms,
        stdout: res.stdout,
      });
    } else {
      setError(res.error || res.stderr || 'Erro ao avaliar expressão');
      setResult(null);
    }
  };

  const handleInsert = (value: string) => {
    setError(null);
    if (result && !['+', '-', '*', '/', '**', '//', '%'].includes(value)) {
      // New calculation starts fresh
      setResult(null);
    }

    setExpression((prev) => {
      // If starts with operator and we have an Ans
      if (prev === '' && ['+', '-', '*', '/', '**', '//', '%'].includes(value) && lastAns !== '0') {
        return lastAns + value;
      }
      return prev + value;
    });

    inputRef.current?.focus();
  };

  const handleClear = () => {
    setExpression('');
    setResult(null);
    setResultType(null);
    setError(null);
    setExecTime(null);
    inputRef.current?.focus();
  };

  const handleDelete = () => {
    setExpression((prev) => prev.slice(0, -1));
    setError(null);
    inputRef.current?.focus();
  };

  // Memory functions
  const handleMemoryAdd = () => {
    const val = parseFloat(result || expression);
    if (!isNaN(val)) setMemory((m) => m + val);
  };

  const handleMemorySub = () => {
    const val = parseFloat(result || expression);
    if (!isNaN(val)) setMemory((m) => m - val);
  };

  const handleMemoryRecall = () => {
    handleInsert(String(memory));
  };

  const handleMemoryClear = () => {
    setMemory(0);
  };

  const copyToClipboard = async (text: string, isMain = false, id?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isMain) {
        setCopiedResult(true);
        setTimeout(() => setCopiedResult(false), 1800);
      } else if (id) {
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 1800);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openCodeModal = () => {
    const currentCode = expression.trim() || 'sqrt(144) + 2**5';
    const pySnippet = `# Calculadora Python 3.10
import math
from fractions import Fraction
from decimal import Decimal

# Expressão avaliada:
expressao = "${currentCode.replace(/"/g, '\\"')}"
resultado = ${currentCode}

print(f"Expressão: {expressao}")
print(f"Resultado: {resultado}")
print(f"Tipo: {type(resultado).__name__}")`;

    onViewCode(
      'Código Python do Cálculo',
      pySnippet,
      'Este cálculo é processado nativamente pelo interpretador CPython 3 usando a biblioteca padrão de matemática.'
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Main Calculator Console (Left Column) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Screen / Display Console */}
        <div className="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-xl p-5 shadow-lg text-white">
          {/* Top telemetry & status bar */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <div className="flex items-center gap-3">
              <span className="text-blue-400">CPython 3.10</span>
              <span aria-hidden="true">·</span>
              <span>Modo: Radianos</span>
              {memory !== 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-400 font-semibold">M = {memory}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {execTime !== null && (
                <span className="text-slate-400 tabular-nums">
                  {execTime} ms
                </span>
              )}
              {resultType && (
                <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] uppercase font-mono border border-blue-800">
                  {resultType}
                </span>
              )}
            </div>
          </div>

          {/* Input field */}
          <div className="relative my-2">
            <input
              ref={inputRef}
              type="text"
              value={expression}
              onChange={(e) => {
                setExpression(e.target.value);
                setError(null);
              }}
              placeholder="Digite uma expressão (ex: 2**8, sqrt(144), sin(pi/4))..."
              className="w-full bg-transparent font-mono text-xl sm:text-2xl text-slate-100 placeholder:text-slate-600 focus:outline-hidden py-1 tracking-wide"
              spellCheck={false}
            />
          </div>

          {/* Result or Error View */}
          <div className="min-h-12 flex items-center justify-between border-t border-slate-800/80 pt-3">
            {error ? (
              <div className="text-rose-400 font-mono text-xs sm:text-sm flex items-center gap-2">
                <span className="font-bold">✖</span>
                <span>{error}</span>
              </div>
            ) : result !== null ? (
              <div className="flex items-center justify-between w-full">
                <span className="text-slate-500 font-mono text-lg">=</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400 tabular-nums tracking-tight">
                    {result}
                  </span>
                  <button
                    onClick={() => copyToClipboard(result, true)}
                    className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copiar resultado"
                  >
                    {copiedResult ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 font-mono">
                Pressione <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Enter</kbd> para calcular
              </div>
            )}
          </div>
        </div>

        {/* Action Controls & Memory Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
          {/* Memory buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleMemoryClear}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              MC
            </button>
            <button
              onClick={handleMemoryRecall}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              MR
            </button>
            <button
              onClick={handleMemoryAdd}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              M+
            </button>
            <button
              onClick={handleMemorySub}
              className="px-2.5 py-1 text-xs font-mono font-medium rounded hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              M-
            </button>
          </div>

          {/* Quick function category switcher */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md">
            {(['trig', 'algebra', 'log', 'constants'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFuncCategory(cat)}
                className={`px-2.5 py-1 text-xs font-medium rounded capitalize transition-all ${
                  activeFuncCategory === cat
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat === 'trig'
                  ? 'Trig'
                  : cat === 'algebra'
                  ? 'Álgebra'
                  : cat === 'log'
                  ? 'Log & Exp'
                  : 'Constantes'}
              </button>
            ))}
          </div>

          {/* Code Inspector Trigger */}
          <button
            onClick={openCodeModal}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded transition-colors"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Ver Python</span>
          </button>
        </div>

        {/* Function Drawer Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
          {activeFuncCategory === 'trig' && (
            <>
              <button onClick={() => handleInsert('sin(')} className="func-btn">sin(x)</button>
              <button onClick={() => handleInsert('cos(')} className="func-btn">cos(x)</button>
              <button onClick={() => handleInsert('tan(')} className="func-btn">tan(x)</button>
              <button onClick={() => handleInsert('asin(')} className="func-btn">asin(x)</button>
              <button onClick={() => handleInsert('acos(')} className="func-btn">acos(x)</button>
              <button onClick={() => handleInsert('atan(')} className="func-btn">atan(x)</button>
              <button onClick={() => handleInsert('degrees(')} className="func-btn">degrees()</button>
              <button onClick={() => handleInsert('radians(')} className="func-btn">radians()</button>
              <button onClick={() => handleInsert('sinh(')} className="func-btn">sinh(x)</button>
              <button onClick={() => handleInsert('cosh(')} className="func-btn">cosh(x)</button>
              <button onClick={() => handleInsert('tanh(')} className="func-btn">tanh(x)</button>
              <button onClick={() => handleInsert('atan2(')} className="func-btn">atan2(y,x)</button>
            </>
          )}

          {activeFuncCategory === 'algebra' && (
            <>
              <button onClick={() => handleInsert('sqrt(')} className="func-btn">sqrt(x)</button>
              <button onClick={() => handleInsert('cbrt(')} className="func-btn">cbrt(x)</button>
              <button onClick={() => handleInsert('abs(')} className="func-btn">abs(x)</button>
              <button onClick={() => handleInsert('round(')} className="func-btn">round()</button>
              <button onClick={() => handleInsert('floor(')} className="func-btn">floor()</button>
              <button onClick={() => handleInsert('ceil(')} className="func-btn">ceil()</button>
              <button onClick={() => handleInsert('factorial(')} className="func-btn">n!</button>
              <button onClick={() => handleInsert('gcd(')} className="func-btn">gcd(a,b)</button>
              <button onClick={() => handleInsert('lcm(')} className="func-btn">lcm(a,b)</button>
              <button onClick={() => handleInsert('comb(')} className="func-btn">comb(n,k)</button>
              <button onClick={() => handleInsert('Fraction(')} className="func-btn">Fraction</button>
              <button onClick={() => handleInsert('1j')} className="func-btn">j (imaginário)</button>
            </>
          )}

          {activeFuncCategory === 'log' && (
            <>
              <button onClick={() => handleInsert('log(')} className="func-btn">ln(x)</button>
              <button onClick={() => handleInsert('log10(')} className="func-btn">log₁₀(x)</button>
              <button onClick={() => handleInsert('log2(')} className="func-btn">log₂(x)</button>
              <button onClick={() => handleInsert('exp(')} className="func-btn">eˣ</button>
              <button onClick={() => handleInsert('**')} className="func-btn">xʸ (**)</button>
              <button onClick={() => handleInsert('**2')} className="func-btn">x²</button>
              <button onClick={() => handleInsert('**3')} className="func-btn">x³</button>
              <button onClick={() => handleInsert('pow(')} className="func-btn">pow(x,y)</button>
              <button onClick={() => handleInsert('//')} className="func-btn">// (div int)</button>
              <button onClick={() => handleInsert('%')} className="func-btn">% (resto)</button>
              <button onClick={() => handleInsert('mean([')} className="func-btn">mean()</button>
              <button onClick={() => handleInsert('stdev([')} className="func-btn">stdev()</button>
            </>
          )}

          {activeFuncCategory === 'constants' && (
            <>
              <button onClick={() => handleInsert('pi')} className="func-btn">π (pi)</button>
              <button onClick={() => handleInsert('e')} className="func-btn">e (Euler)</button>
              <button onClick={() => handleInsert('tau')} className="func-btn">τ (2π)</button>
              <button onClick={() => handleInsert('inf')} className="func-btn">∞ (inf)</button>
              <button onClick={() => handleInsert('Decimal("')} className="func-btn">Decimal</button>
              <button onClick={() => handleInsert('Ans')} className="func-btn font-semibold text-blue-500">Ans</button>
            </>
          )}
        </div>

        {/* Main Numeric & Operator Keypad */}
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="calc-key bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100"
          >
            AC
          </button>
          <button
            onClick={handleDelete}
            className="calc-key bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 flex items-center justify-center"
            title="Apagar caractere"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleInsert('(')}
            className="calc-key bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          >
            (
          </button>
          <button
            onClick={() => handleInsert(')')}
            className="calc-key bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          >
            )
          </button>
          <button
            onClick={() => handleInsert('/')}
            className="calc-key bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button onClick={() => handleInsert('**')} className="calc-key-op hidden sm:flex">
            xʸ (**)
          </button>
          <button onClick={() => handleInsert('7')} className="calc-key-num">
            7
          </button>
          <button onClick={() => handleInsert('8')} className="calc-key-num">
            8
          </button>
          <button onClick={() => handleInsert('9')} className="calc-key-num">
            9
          </button>
          <button
            onClick={() => handleInsert('*')}
            className="calc-key bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100"
          >
            ×
          </button>

          {/* Row 3 */}
          <button onClick={() => handleInsert('sqrt(')} className="calc-key-op hidden sm:flex">
            √
          </button>
          <button onClick={() => handleInsert('4')} className="calc-key-num">
            4
          </button>
          <button onClick={() => handleInsert('5')} className="calc-key-num">
            5
          </button>
          <button onClick={() => handleInsert('6')} className="calc-key-num">
            6
          </button>
          <button
            onClick={() => handleInsert('-')}
            className="calc-key bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100"
          >
            −
          </button>

          {/* Row 4 */}
          <button onClick={() => handleInsert('%')} className="calc-key-op hidden sm:flex">
            % (mod)
          </button>
          <button onClick={() => handleInsert('1')} className="calc-key-num">
            1
          </button>
          <button onClick={() => handleInsert('2')} className="calc-key-num">
            2
          </button>
          <button onClick={() => handleInsert('3')} className="calc-key-num">
            3
          </button>
          <button
            onClick={() => handleInsert('+')}
            className="calc-key bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100"
          >
            +
          </button>

          {/* Row 5 */}
          <button onClick={() => handleInsert('//')} className="calc-key-op hidden sm:flex">
            // (int)
          </button>
          <button onClick={() => handleInsert('0')} className="calc-key-num">
            0
          </button>
          <button onClick={() => handleInsert('.')} className="calc-key-num">
            .
          </button>
          <button
            onClick={() => handleInsert('Ans')}
            className="calc-key bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-mono font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-200"
          >
            Ans
          </button>
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="calc-key bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 text-white font-bold border-0 shadow-md shadow-blue-500/20 active:scale-95 transition-transform flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span className="text-xl">=</span>
            )}
          </button>
        </div>

        {/* Quick Tips */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-2">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            Dica: Digite livremente no teclado. Operadores Python como <code className="font-mono text-slate-700 dark:text-slate-300">**</code> (potência), <code className="font-mono text-slate-700 dark:text-slate-300">//</code> (divisão inteira) e funções são suportados diretamente.
          </span>
        </div>
      </div>

      {/* History & Python Sessions Sidebar (Right Column) */}
      <div className="lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden h-[580px]">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Histórico de Cálculos
            </h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              title="Limpar histórico"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-100 dark:divide-slate-800/60">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400 space-y-2">
              <RotateCcw className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Nenhum cálculo recente
              </p>
              <p className="text-xs text-slate-400 max-w-[200px]">
                Seus cálculos em Python aparecerão aqui para fácil consulta e reutilização.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="pt-2.5 first:pt-0 group hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 rounded-lg transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => setExpression(item.expression)}
                    className="text-left font-mono text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 truncate max-w-[190px]"
                    title="Carregar expressão"
                  >
                    {item.expression}
                  </button>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">=</span>
                    <button
                      onClick={() => handleInsert(item.result)}
                      className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 tabular-nums"
                      title="Inserir resultado"
                    >
                      {item.result}
                    </button>
                    {item.resultType && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({item.resultType})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyToClipboard(item.result, false, item.id)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Copiar resultado"
                    >
                      {copiedItem === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const py = `# Executado via Python 3\nexpressao = "${item.expression}"\nresultado = ${item.expression}\nprint(resultado)`;
                        onViewCode('Cálculo Histórico', py);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      title="Ver código Python"
                    >
                      <Code2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Python Specs Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 flex items-center justify-between">
          <span>Precisão: CPython 64-bit</span>
          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-medium">
            math · statistics · cmath
          </span>
        </div>
      </div>
    </div>
  );
};
