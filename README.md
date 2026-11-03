# Calculadora Python
<img width="1581" height="692" alt="image" src="https://github.com/user-attachments/assets/ef87ad83-3267-43e5-ae28-e31ca206d33e" />


Calculadora científica e programável que roda os cálculos num **motor Python 3** de verdade, com uma interface web em **React + TypeScript**.

> Projeto de estudo feito durante a graduação em Engenharia de Software, com a ajuda do Google AI Studio.

---

## Funcionalidades

- **Calculadora científica**: teclado com funções trigonométricas, logaritmos, potências, raízes, fatorial e constantes (π, e, τ), além do histórico de cálculos
- **Gráfico de funções f(x)**: digite uma função e veja o gráfico na hora
- **Editor de scripts Python**: escreva e rode código Python direto no navegador, com exemplos prontos:
  - Fórmula de Bhaskara e raízes
  - Sequência de Fibonacci e razão áurea
  - Derivada e integral numérica
  - Estatística de amostras
  - Simulação de Monte Carlo para estimar π
- **Ferramentas especializadas**:
  - Equação do 2º grau (Δ, raízes e vértice)
  - Estatística descritiva (média, mediana, variância, desvio padrão)
  - Simulador de investimentos com juros compostos
  - Conversor de bases numéricas (binário, octal, hexadecimal)
- **Ver código Python**: mostra o código Python por trás de cada cálculo, o que ajuda a aprender

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Front-end | React 19, TypeScript, Vite, Tailwind CSS, Motion, Lucide Icons |
| Back-end | Node.js, Express |
| Motor de cálculo | Python 3 (`math`, `cmath`, `statistics`, `decimal`, `fractions`) |

## Como funciona

```
[ Interface React ]  →  [ Servidor Express ]  →  [ python_engine.py ]
       (navegador)        /api/python/eval          executa o cálculo
                          /api/python/plot          e devolve JSON
```

O servidor recebe a expressão, abre um processo Python, envia o código e devolve o resultado em JSON. Toda execução tem um **limite de 6 segundos**, para que um código travado não derrube o servidor.

## Como rodar na sua máquina

**Pré-requisitos:** [Node.js](https://nodejs.org/) 18 ou superior e [Python 3](https://www.python.org/) instalados (o comando `python3` precisa funcionar no terminal).

```bash
# 1. Clone o repositório
git clone https://github.com/miguelolicorreia97-prog/Calculadora-python.git
cd Calculadora-python

# 2. Instale as dependências
npm install

# 3. Inicie o projeto
npm run dev
```

Depois, abra **http://localhost:3000** no navegador.

## Estrutura do projeto

```
Calculadora-python/
├── src/
│   ├── components/       # Calculadora, gráficos, editor e ferramentas
│   ├── lib/              # Comunicação com a API Python
│   ├── App.tsx           # Componente principal
│   └── types.ts          # Tipos TypeScript
├── python_engine.py      # Motor de cálculo em Python
├── server.ts             # Servidor Express (API)
├── index.html
└── package.json
```

## O que aprendi

- Integrar um front-end em React com um back-end Node.js
- Fazer o Node conversar com o Python por meio de processos (`child_process`)
- Usar as bibliotecas matemáticas do Python
- Organizar um projeto em componentes

## Autor

**Miguel Oliveira**: estudante de Engenharia de Software, começando na área de TI.

[![GitHub](https://img.shields.io/badge/GitHub-miguelolicorreia97--prog-181717?logo=github)](https://github.com/miguelolicorreia97-prog)
