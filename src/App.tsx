import React, { useState, useEffect } from 'react';
import { CalculatorTab, CalculationHistoryItem } from './types';
import { Header } from './components/Header';
import { KeypadCalculator } from './components/KeypadCalculator';
import { ScriptEditor } from './components/ScriptEditor';
import { FunctionPlotter } from './components/FunctionPlotter';
import { SpecializedTools } from './components/SpecializedTools';
import { PythonCodeModal } from './components/PythonCodeModal';
import { Terminal, Check, BookOpen, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<CalculatorTab>('keypad');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  // Calculation history
  const [history, setHistory] = useState<CalculationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('calc_py_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal for Python code inspection
  const [codeModal, setCodeModal] = useState<{
    isOpen: boolean;
    title: string;
    code: string;
    explanation?: string;
  }>({
    isOpen: false,
    title: '',
    code: '',
  });

  // Modal for Python environment details
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Persist history in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('calc_py_history', JSON.stringify(history.slice(0, 50)));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  const handleAddHistory = (item: CalculationHistoryItem) => {
    setHistory((prev) => [item, ...prev].slice(0, 50));
  };

  const handleClearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('calc_py_history');
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewCode = (title: string, code: string, explanation?: string) => {
    setCodeModal({
      isOpen: true,
      title,
      code,
      explanation,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onOpenPythonDocs={() => setIsDocsOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 py-4 sm:py-6">
        {activeTab === 'keypad' && (
          <KeypadCalculator
            history={history}
            onAddHistory={handleAddHistory}
            onClearHistory={handleClearHistory}
            onViewCode={handleViewCode}
          />
        )}

        {activeTab === 'script' && <ScriptEditor />}

        {activeTab === 'plot' && <FunctionPlotter onViewCode={handleViewCode} />}

        {activeTab === 'tools' && <SpecializedTools onViewCode={handleViewCode} />}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-4 px-6 bg-white dark:bg-slate-950 text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>Calculadora Python</span>
            <span aria-hidden="true">·</span>
            <span>Motor CPython 3.10 nativo</span>
            <span aria-hidden="true">·</span>
            <span>Precisão arbitrária & matemática simbólica</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="hover:text-slate-900 dark:hover:text-slate-300 transition-colors"
            >
              Módulos e Recursos
            </button>
            <button
              onClick={() => {
                handleViewCode(
                  'Ambiente Python Padrão',
                  `# Módulos carregados na Calculadora Python:\nimport math\nimport cmath\nimport statistics\nimport fractions\nimport decimal\nimport random\n\n# Exemplo de cálculo:\nvalor = math.sqrt(2) * math.pi\nprint(f"Resultado: {valor:.10f}")`,
                  'Estes módulos estão pré-carregados e prontos para uso em qualquer fórmula ou script.'
                );
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver Módulos Python
            </button>
          </div>
        </div>
      </footer>

      {/* Python Code Viewer Modal */}
      <PythonCodeModal
        isOpen={codeModal.isOpen}
        onClose={() => setCodeModal((prev) => ({ ...prev, isOpen: false }))}
        title={codeModal.title}
        code={codeModal.code}
        explanation={codeModal.explanation}
      />

      {/* Python Environment Documentation Modal */}
      {isDocsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Recursos do Motor Python 3
                </h3>
              </div>
              <button
                onClick={() => setIsDocsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                Esta calculadora executa o código diretamente no interpretador oficial <strong>CPython 3.10</strong>. Todos os cálculos matemáticos têm precisão de ponto flutuante IEEE 754 de 64 bits, suporte a inteiros de precisão arbitrária (sem limite de dígitos) e números complexos.
              </p>

              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                  Módulos Pré-Importados no Escopo:
                </h4>
                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800">
                    <span className="text-blue-500 font-bold">math</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">sqrt, sin, cos, tan, log, exp, pi, e</p>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800">
                    <span className="text-blue-500 font-bold">cmath</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Matemática para números complexos (1j)</p>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800">
                    <span className="text-blue-500 font-bold">statistics</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">mean, median, mode, stdev, variance</p>
                  </div>
                  <div className="p-2 rounded bg-slate-100 dark:bg-slate-800">
                    <span className="text-blue-500 font-bold">fractions & decimal</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">Fraction(a,b), Decimal("0.1")</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-xs">
                  Operadores Nativos de Python:
                </h4>
                <ul className="space-y-1.5 list-disc pl-4 font-mono text-xs">
                  <li><code className="text-blue-600 dark:text-blue-400">**</code>: Potência / Exponenciação (ex: <code className="text-slate-800 dark:text-slate-200">2**10 = 1024</code>)</li>
                  <li><code className="text-blue-600 dark:text-blue-400">//</code>: Divisão inteira (ex: <code className="text-slate-800 dark:text-slate-200">17 // 5 = 3</code>)</li>
                  <li><code className="text-blue-600 dark:text-blue-400">%</code>: Módulo / Resto da divisão (ex: <code className="text-slate-800 dark:text-slate-200">17 % 5 = 2</code>)</li>
                  <li><code className="text-blue-600 dark:text-blue-400">1j</code>: Unidade imaginária (ex: <code className="text-slate-800 dark:text-slate-200">(2 + 3j) * 2 = 4 + 6j</code>)</li>
                </ul>
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex justify-end">
              <button
                onClick={() => setIsDocsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
