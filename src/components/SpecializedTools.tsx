import React, { useState } from 'react';
import { evaluatePython } from '../lib/pythonClient';
import {
  Coins,
  BarChart2,
  Binary,
  Shapes,
  Code2,
  Calculator,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface SpecializedToolsProps {
  onViewCode: (title: string, code: string, explanation?: string) => void;
}

export const SpecializedTools: React.FC<SpecializedToolsProps> = ({ onViewCode }) => {
  const [activeTool, setActiveTool] = useState<'finance' | 'stats' | 'bhaskara' | 'bases'>('finance');

  // --- 1. Juros Compostos States ---
  const [initialAmount, setInitialAmount] = useState<number>(5000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [interestRate, setInterestRate] = useState<number>(12); // % ao ano
  const [years, setYears] = useState<number>(5);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeResult, setFinanceResult] = useState<{
    totalInvested: number;
    totalInterest: number;
    finalAmount: number;
  }>({
    totalInvested: 5000 + 300 * 60,
    totalInterest: 9482.16,
    finalAmount: 32482.16,
  });

  const calculateFinance = async () => {
    setFinanceLoading(true);
    const code = `
PV = ${initialAmount}
PMT = ${monthlyContribution}
taxa_anual = ${interestRate} / 100
anos = ${years}

meses = anos * 12
taxa_mensal = (1 + taxa_anual)**(1/12) - 1

# Montante acumulado com juros compostos e aportes mensais
montante_pv = PV * ((1 + taxa_mensal)**meses)
if taxa_mensal > 0:
    montante_pmt = PMT * (((1 + taxa_mensal)**meses - 1) / taxa_mensal)
else:
    montante_pmt = PMT * meses

montante_final = montante_pv + montante_pmt
total_investido = PV + (PMT * meses)
total_juros = montante_final - total_investido

print(f"{total_investido:.2f}|{total_juros:.2f}|{montante_final:.2f}")
`;
    const res = await evaluatePython(code);
    setFinanceLoading(false);
    if (res.stdout) {
      const [inv, jur, fin] = res.stdout.trim().split('|').map(Number);
      if (!isNaN(inv) && !isNaN(jur) && !isNaN(fin)) {
        setFinanceResult({
          totalInvested: inv,
          totalInterest: jur,
          finalAmount: fin,
        });
      }
    }
  };

  const openFinanceCode = () => {
    const code = `# Cálculo de Juros Compostos com Aportes Mensais em Python
PV = ${initialAmount}             # Capital inicial (R$)
PMT = ${monthlyContribution}            # Aporte mensal (R$)
taxa_anual = ${interestRate} / 100       # Taxa anual (ex: 12% = 0.12)
anos = ${years}                   # Prazo em anos

meses = anos * 12
# Taxa equivalente mensal por juros compostos:
i_m = (1 + taxa_anual)**(1/12) - 1

# Fórmula matemática:
# FV = PV*(1+i)^n + PMT*[((1+i)^n - 1)/i]
montante_pv = PV * ((1 + i_m)**meses)
montante_pmt = PMT * (((1 + i_m)**meses - 1) / i_m) if i_m > 0 else PMT * meses

montante_final = montante_pv + montante_pmt
total_investido = PV + (PMT * meses)
total_juros = montante_final - total_investido

print(f"Total Investido: R$ {total_investido:,.2f}")
print(f"Juros Acumulados: R$ {total_juros:,.2f}")
print(f"Patrimônio Final: R$ {montante_final:,.2f}")`;

    onViewCode(
      'Juros Compostos em Python',
      code,
      'Cálculo preciso de valor futuro considerando capitalização composta e aportes periódicos.'
    );
  };

  // --- 2. Estatística States ---
  const [statsInput, setStatsInput] = useState('18, 22, 25, 29, 30, 30, 32, 45, 50, 65');
  const [statsResult, setStatsResult] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const calculateStats = async () => {
    setStatsLoading(true);
    const code = `
import statistics, json

raw_input = "${statsInput}"
dados = [float(x.strip()) for x in raw_input.replace(';', ',').split(',') if x.strip()]

res = {
    'count': len(dados),
    'sum': round(sum(dados), 4),
    'mean': round(statistics.mean(dados), 4),
    'median': round(statistics.median(dados), 4),
    'stdev': round(statistics.stdev(dados), 4) if len(dados) > 1 else 0,
    'variance': round(statistics.variance(dados), 4) if len(dados) > 1 else 0,
    'min': min(dados),
    'max': max(dados),
    'range': round(max(dados) - min(dados), 4)
}
try:
    res['mode'] = statistics.mode(dados)
except Exception:
    res['mode'] = "Sem moda única"

print(json.dumps(res))
`;
    const res = await evaluatePython(code);
    setStatsLoading(false);
    if (res.stdout) {
      try {
        setStatsResult(JSON.parse(res.stdout));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openStatsCode = () => {
    const code = `# Estatística Descritiva em Python usando o módulo nativo statistics
import statistics

dados = [${statsInput}]

print(f"Amostra (n = {len(statsInput.split(','))}): {dados}")
print(f"Soma Total:       {sum(dados)}")
print(f"Média:            {statistics.mean(dados):.4f}")
print(f"Mediana:          {statistics.median(dados):.4f}")
print(f"Desvio Padrão:    {statistics.stdev(dados):.4f}")
print(f"Variância:        {statistics.variance(dados):.4f}")
print(f"Valor Mínimo:     {min(dados)}")
print(f"Valor Máximo:     {max(dados)}")
print(f"Amplitude Total:  {max(dados) - min(dados)}")`;

    onViewCode(
      'Análise Estatística em Python',
      code,
      'Utiliza as funções nativas de alta precisão do módulo statistics da biblioteca padrão do Python.'
    );
  };

  // --- 3. Bhaskara States ---
  const [aCoef, setACoef] = useState<number>(1);
  const [bCoef, setBCoef] = useState<number>(-5);
  const [cCoef, setCCoef] = useState<number>(6);
  const [bhaskaraRes, setBhaskaraRes] = useState<any>(null);

  const calculateBhaskara = async () => {
    const code = `
import cmath, json

a = ${aCoef}
b = ${bCoef}
c = ${cCoef}

delta = b**2 - 4*a*c
sqrt_delta = cmath.sqrt(delta)

x1 = (-b + sqrt_delta) / (2*a)
x2 = (-b - sqrt_delta) / (2*a)

xv = -b / (2*a)
yv = -delta / (4*a)

res = {
    'delta': delta,
    'x1': round(x1.real, 4) if delta >= 0 else f"{x1.real:.4f} + {x1.imag:.4f}j",
    'x2': round(x2.real, 4) if delta >= 0 else f"{x2.real:.4f} - {abs(x2.imag):.4f}j",
    'xv': round(xv, 4),
    'yv': round(yv, 4),
    'is_real': delta >= 0
}
print(json.dumps(res))
`;
    const res = await evaluatePython(code);
    if (res.stdout) {
      try {
        setBhaskaraRes(JSON.parse(res.stdout));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openBhaskaraCode = () => {
    const code = `# Resolução de Equações do 2º Grau (ax² + bx + c = 0)
import cmath, math

a = ${aCoef}
b = ${bCoef}
c = ${cCoef}

# 1. Cálculo do discriminante (Delta)
delta = b**2 - 4*a*c

# 2. Raízes pelo método de Bhaskara
if delta >= 0:
    x1 = (-b + math.sqrt(delta)) / (2*a)
    x2 = (-b - math.sqrt(delta)) / (2*a)
    print(f"Raízes reais: x1 = {x1}, x2 = {x2}")
else:
    x1 = (-b + cmath.sqrt(delta)) / (2*a)
    x2 = (-b - cmath.sqrt(delta)) / (2*a)
    print(f"Raízes complexas: x1 = {x1}, x2 = {x2}")

# 3. Coordenadas do vértice da parábola
xv = -b / (2*a)
yv = -delta / (4*a)
print(f"Vértice: ({xv}, {yv})")`;

    onViewCode('Fórmula de Bhaskara em Python', code);
  };

  // --- 4. Bases States ---
  const [baseNumber, setBaseNumber] = useState<number>(255);
  const [basesRes, setBasesRes] = useState<{
    dec: string;
    bin: string;
    hex: string;
    oct: string;
    sci: string;
    fraction: string;
  }>({
    dec: '255',
    bin: '0b11111111',
    hex: '0xff',
    oct: '0o377',
    sci: '2.550000e+02',
    fraction: '255/1',
  });

  const convertBases = async (num: number) => {
    setBaseNumber(num);
    const code = `
import json
from fractions import Fraction

n = int(${num})
res = {
    'dec': str(n),
    'bin': bin(n),
    'hex': hex(n),
    'oct': oct(n),
    'sci': f"{float(n):e}",
    'fraction': str(Fraction(n, 1))
}
print(json.dumps(res))
`;
    const res = await evaluatePython(code);
    if (res.stdout) {
      try {
        setBasesRes(JSON.parse(res.stdout));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Category selector */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTool('finance')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTool === 'finance'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Juros Compostos</span>
        </button>
        <button
          onClick={() => {
            setActiveTool('stats');
            if (!statsResult) calculateStats();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTool === 'stats'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Estatística Descritiva</span>
        </button>
        <button
          onClick={() => {
            setActiveTool('bhaskara');
            if (!bhaskaraRes) calculateBhaskara();
          }}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTool === 'bhaskara'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Shapes className="w-4 h-4" />
          <span>Equação de 2º Grau</span>
        </button>
        <button
          onClick={() => setActiveTool('bases')}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
            activeTool === 'bases'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Binary className="w-4 h-4" />
          <span>Conversor de Bases</span>
        </button>
      </div>

      {/* Tool 1: Juros Compostos */}
      {activeTool === 'finance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-blue-500" />
                <span>Simulador de Investimentos</span>
              </h3>
              <button
                onClick={openFinanceCode}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Python</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Capital Inicial (R$)
                </label>
                <input
                  type="number"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-600 dark:text-slate-400 block mb-1">
                  Aporte Mensal (R$)
                </label>
                <input
                  type="number"
                  value={monthlyContribution}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">
                    Taxa Anual (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400 block mb-1">
                    Período (Anos)
                  </label>
                  <input
                    type="number"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                onClick={calculateFinance}
                disabled={financeLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {financeLoading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Calculator className="w-4 h-4" />
                )}
                <span>Calcular com Python</span>
              </button>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                Resultado da Projeção Financeira
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Total Investido</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                    R$ {financeResult.totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block mb-1">Total em Juros</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                    R$ {financeResult.totalInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <span className="text-xs text-blue-600 dark:text-blue-400 block mb-1">Montante Final</span>
                  <span className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                    R$ {financeResult.finalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Composição do Patrimônio</span>
                <span>
                  {((financeResult.totalInterest / Math.max(1, financeResult.finalAmount)) * 100).toFixed(1)}% vindo de juros
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                <div
                  style={{
                    width: `${(financeResult.totalInvested / Math.max(1, financeResult.finalAmount)) * 100}%`,
                  }}
                  className="bg-slate-400 dark:bg-slate-600 transition-all duration-500"
                  title="Capital Próprio"
                />
                <div
                  style={{
                    width: `${(financeResult.totalInterest / Math.max(1, financeResult.finalAmount)) * 100}%`,
                  }}
                  className="bg-emerald-500 transition-all duration-500"
                  title="Rendimentos"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool 2: Estatística */}
      {activeTool === 'stats' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-500" />
                <span>Estatística Descritiva & Módulo statistics</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Insira os valores numéricos separados por vírgula ou espaço
              </p>
            </div>
            <button
              onClick={openStatsCode}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ver Código Python</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={statsInput}
              onChange={(e) => setStatsInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && calculateStats()}
              className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden"
              placeholder="ex: 10, 20, 30, 40, 50, 60"
            />
            <button
              onClick={calculateStats}
              disabled={statsLoading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              {statsLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Calculator className="w-4 h-4" />
              )}
              <span>Calcular Estatísticas</span>
            </button>
          </div>

          {statsResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Média</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.mean}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Mediana</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.median}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Desvio Padrão</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.stdev}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Variância</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.variance}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Mínimo / Máximo</span>
                <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.min} / {statsResult.max}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Amplitude</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.range}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Soma</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.sum}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Amostra (N)</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 tabular-nums">
                  {statsResult.count} itens
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 3: Bhaskara */}
      {activeTool === 'bhaskara' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Shapes className="w-4 h-4 text-blue-500" />
                <span>Resolução de Equação do 2º Grau (Bhaskara)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Formato geral: ax² + bx + c = 0
              </p>
            </div>
            <button
              onClick={openBhaskaraCode}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ver Código Python</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Coeficiente a</label>
              <input
                type="number"
                value={aCoef}
                onChange={(e) => setACoef(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Coeficiente b</label>
              <input
                type="number"
                value={bCoef}
                onChange={(e) => setBCoef(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Coeficiente c</label>
              <input
                type="number"
                value={cCoef}
                onChange={(e) => setCCoef(Number(e.target.value))}
                className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            onClick={calculateBhaskara}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Calcular Raízes & Vértice</span>
          </button>

          {bhaskaraRes && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Delta (Δ)</span>
                <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                  {bhaskaraRes.delta}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Raiz x₁</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {bhaskaraRes.x1}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Raiz x₂</span>
                <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {bhaskaraRes.x2}
                </span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-500 block uppercase font-mono">Vértice (Xv, Yv)</span>
                <span className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                  ({bhaskaraRes.xv}, {bhaskaraRes.yv})
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 4: Conversor de Bases */}
      {activeTool === 'bases' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Binary className="w-4 h-4 text-blue-500" />
                <span>Conversor de Bases & Representações Numéricas</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Funções nativas bin(), hex(), oct() e fractions.Fraction do Python
              </p>
            </div>
            <button
              onClick={() => {
                const code = `# Conversão de Bases em Python
numero = ${baseNumber}

print(f"Decimal:     {numero}")
print(f"Binário:     {bin(numero)}")
print(f"Hexadecimal: {hex(numero)}")
print(f"Octal:       {oct(numero)}")
print(f"Científica:  {numero:e}")`;
                onViewCode('Conversão de Bases em Python', code);
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Ver Código Python</span>
            </button>
          </div>

          <div>
            <label className="text-xs text-slate-500 block mb-1">
              Digite um número inteiro:
            </label>
            <input
              type="number"
              value={baseNumber}
              onChange={(e) => convertBases(Number(e.target.value))}
              className="w-full max-w-sm p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Binário · bin()
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-blue-600 dark:text-blue-400 break-all">
                {basesRes.bin}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Hexadecimal · hex()
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 break-all">
                {basesRes.hex}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Octal · oct()
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-amber-600 dark:text-amber-400 break-all">
                {basesRes.oct}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Notação Científica
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-200 break-all">
                {basesRes.sci}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Fração Irredutível
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-200 break-all">
                {basesRes.fraction}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block uppercase font-mono mb-1">
                Decimal
              </span>
              <span className="text-sm sm:text-base font-bold font-mono text-slate-800 dark:text-slate-200 break-all">
                {basesRes.dec}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
