import React, { useState } from 'react';
import { ScriptTemplate } from '../types';
import { evaluatePython } from '../lib/pythonClient';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'bhaskara',
    title: 'Fórmula de Bhaskara & Raízes',
    category: 'Álgebra',
    description: 'Calcula delta e raízes reais ou complexas para ax² + bx + c = 0',
    code: `# Equação do 2º Grau (ax² + bx + c = 0)
import math, cmath

a = 1
b = -5
c = 6

delta = b**2 - 4*a*c
print(f"Equação: {a}x² + ({b})x + ({c}) = 0")
print(f"Delta (Δ): {delta}")

if delta >= 0:
    x1 = (-b + math.sqrt(delta)) / (2*a)
    x2 = (-b - math.sqrt(delta)) / (2*a)
    print(f"Duas raízes reais:")
    print(f"  x1 = {x1}")
    print(f"  x2 = {x2}")
else:
    x1 = (-b + cmath.sqrt(delta)) / (2*a)
    x2 = (-b - cmath.sqrt(delta)) / (2*a)
    print(f"Raízes complexas:")
    print(f"  x1 = {x1}")
    print(f"  x2 = {x2}")

xv = -b / (2*a)
yv = -delta / (4*a)
print(f"Vértice da Parábola: ({xv}, {yv})")`,
  },
  {
    id: 'fibonacci',
    title: 'Sequência de Fibonacci & Razão Áurea',
    category: 'Algoritmos',
    description: 'Gera a sequência e calcula a convergência para Phi (1.618033...)',
    code: `# Sequência de Fibonacci e Proporção Áurea
def gerar_fibonacci(n):
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq

n_termos = 15
fib = gerar_fibonacci(n_termos)
razao_aurea = fib[-1] / fib[-2]

print(f"Fibonacci ({n_termos} termos):")
print(fib)
print("-" * 35)
print(f"Aproximação da Razão Áurea (φ): {razao_aurea:.8f}")
print(f"Valor exato de (1 + √5) / 2:   {(1 + 5**0.5)/2:.8f}")`,
  },
  {
    id: 'calculo',
    title: 'Derivada & Integral Numérica',
    category: 'Física',
    description: 'Diferenciação finita e integração pelo método dos trapézios',
    code: `# Cálculo Numérico: Derivada e Integral
import math

def f(x):
    # Função sob análise: f(x) = x³ - 4x + 1
    return x**3 - 4*x + 1

# Derivada numérica (Diferenças Centrais)
def derivada(func, x, h=1e-5):
    return (func(x + h) - func(x - h)) / (2 * h)

# Integral definida (Método dos Trapézios)
def integral(func, a, b, n=1000):
    h = (b - a) / n
    area = 0.5 * (func(a) + func(b))
    for i in range(1, n):
        area += func(a + i * h)
    return area * h

x0 = 2.0
print(f"Para f(x) = x³ - 4x + 1:")
print(f"  Valor em x = {x0}: f({x0}) = {f(x0)}")
print(f"  Derivada f'({x0}) ≈ {derivada(f, x0):.6f} (Exata: {3*x0**2 - 4})")
print(f"  Integral de 0 a 3 ≈ {integral(f, 0, 3):.6f}")`,
  },
  {
    id: 'estatistica',
    title: 'Estatística e Análise de Amostra',
    category: 'Estatística',
    description: 'Média, mediana, desvio padrão e variância usando módulo statistics',
    code: `# Análise Estatística com Módulo Nativo
import statistics

dados = [23, 45, 67, 34, 89, 56, 45, 90, 78, 65, 45, 88]

print(f"Amostra com {len(dados)} observações:")
print(dados)
print("-" * 40)
print(f"Média:           {statistics.mean(dados):.2f}")
print(f"Mediana:         {statistics.median(dados):.2f}")
print(f"Moda:            {statistics.mode(dados)}")
print(f"Desvio Padrão:   {statistics.stdev(dados):.4f}")
print(f"Variância:       {statistics.variance(dados):.4f}")
print(f"Amplitude Total: {max(dados) - min(dados)} (Min: {min(dados)}, Max: {max(dados)})")`,
  },
  {
    id: 'monte_carlo',
    title: 'Simulação Monte Carlo (Estimar Pi)',
    category: 'Algoritmos',
    description: 'Aproximação estocástica de π jogando pontos aleatórios no círculo',
    code: `# Simulação de Monte Carlo para Estimar Pi (π)
import random, math

total_pontos = 50000
dentro_circulo = 0

for _ in range(total_pontos):
    x = random.uniform(-1, 1)
    y = random.uniform(-1, 1)
    if x**2 + y**2 <= 1.0:
        dentro_circulo += 1

pi_aproximado = 4 * (dentro_circulo / total_pontos)
erro = abs(pi_aproximado - math.pi)

print(f"Total de iterações: {total_pontos:,}")
print(f"Pontos no círculo:  {dentro_circulo:,}")
print("-" * 40)
print(f"Pi Estimado:   {pi_aproximado:.6f}")
print(f"Pi Teórico:    {math.pi:.6f}")
print(f"Erro Absoluto: {erro:.6f} ({erro/math.pi*100:.3f}%)")`,
  },
];

export const ScriptEditor: React.FC = () => {
  const [code, setCode] = useState(SCRIPT_TEMPLATES[0].code);
  const [stdout, setStdout] = useState<string>('');
  const [stderr, setStderr] = useState<string>('');
  const [resultVal, setResultVal] = useState<string | null>(null);
  const [variables, setVariables] = useState<Record<string, { value: string; type: string }>>({});
  const [execTime, setExecTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeOutputTab, setActiveOutputTab] = useState<'console' | 'variables'>('console');
  const [copied, setCopied] = useState(false);

  const handleRun = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setStdout('');
    setStderr('');
    setResultVal(null);

    const res = await evaluatePython(code);
    setLoading(false);

    setStdout(res.stdout || '');
    setStderr(res.stderr || res.error || '');
    setResultVal(res.result || null);
    setVariables(res.variables || {});
    setExecTime(res.execution_time_ms || 1.0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Run on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }

    // Tab key inserts 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      setCode(code.substring(0, start) + '    ' + code.substring(end));
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 4;
      }, 0);
    }
  };

  const handleLoadTemplate = (template: ScriptTemplate) => {
    setCode(template.code);
    setStdout('');
    setStderr('');
    setResultVal(null);
    setVariables({});
    setExecTime(null);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPy = () => {
    const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calculadora_script.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Templates Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Modelos de Scripts:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {SCRIPT_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              onClick={() => handleLoadTemplate(tmpl)}
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              {tmpl.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Grid: Editor (Left) & Output / Variables (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Code Editor Panel */}
        <div className="lg:col-span-7 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                main.py
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-[11px] text-slate-500 font-mono">Python 3.10</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyCode}
                className="p-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                title="Copiar script"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Copiar</span>
              </button>
              <button
                onClick={handleDownloadPy}
                className="p-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-1"
                title="Baixar arquivo .py"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar .py</span>
              </button>
            </div>
          </div>

          {/* Textarea Code Editor */}
          <div className="relative flex-1 min-h-[380px] bg-slate-950">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full min-h-[400px] p-4 bg-transparent font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 leading-relaxed focus:outline-hidden resize-none selection:bg-blue-600 selection:text-white"
              placeholder="# Escreva seu código Python aqui...&#10;import math&#10;x = 10&#10;print(math.sqrt(x))"
            />
          </div>

          {/* Editor Action Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <span className="text-xs text-slate-500">
              Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[10px]">Ctrl+Enter</kbd> para executar
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCode('')}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Limpar
              </button>
              <button
                onClick={handleRun}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
              >
                {loading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Executar Script</span>
              </button>
            </div>
          </div>
        </div>

        {/* Console Output & Variables Inspector Panel */}
        <div className="lg:col-span-5 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden h-[510px]">
          {/* Header tabs */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveOutputTab('console')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeOutputTab === 'console'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Console (stdout)</span>
              </button>
              <button
                onClick={() => setActiveOutputTab('variables')}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  activeOutputTab === 'variables'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Variáveis ({Object.keys(variables).length})</span>
              </button>
            </div>

            {execTime !== null && (
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {execTime} ms
              </span>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-slate-100">
            {activeOutputTab === 'console' ? (
              <div className="space-y-3">
                {/* Standard Output */}
                {stdout ? (
                  <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                    {stdout}
                  </pre>
                ) : !stderr && !resultVal && !loading ? (
                  <div className="text-slate-500 text-center py-12">
                    Console aguardando execução...
                  </div>
                ) : null}

                {/* Final Evaluated Result (if any) */}
                {resultVal && (
                  <div className="pt-2 border-t border-slate-800 text-cyan-400">
                    <span className="text-slate-500">Saída da expressão: </span>
                    <span className="font-bold">{resultVal}</span>
                  </div>
                )}

                {/* Error Output */}
                {stderr && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <pre className="whitespace-pre-wrap leading-relaxed font-mono">
                      {stderr}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              /* Variables Tab */
              <div>
                {Object.keys(variables).length === 0 ? (
                  <div className="text-slate-500 text-center py-12">
                    Nenhuma variável definida nesta sessão.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1.5 font-sans font-semibold">
                      <span>Nome</span>
                      <span>Tipo</span>
                      <span>Valor</span>
                    </div>
                    {Object.entries(variables).map(([name, info]) => (
                      <div
                        key={name}
                        className="grid grid-cols-3 py-1.5 border-b border-slate-900 text-xs items-center"
                      >
                        <span className="text-blue-400 font-semibold truncate">{name}</span>
                        <span className="text-slate-400 text-[11px]">{info.type}</span>
                        <span className="text-emerald-400 truncate" title={info.value}>
                          {info.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Output Footer */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Ambiente: CPython 3.10 sandbox</span>
            <span>Timeout: 6.0s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
