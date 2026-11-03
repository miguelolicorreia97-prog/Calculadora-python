import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Helper function to invoke python_engine.py safely with timeout
  const runPythonEngine = (payload: object, timeoutMs = 6000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [path.join(__dirname, 'python_engine.py')]);

      let stdoutData = '';
      let stderrData = '';
      let timer: NodeJS.Timeout | null = null;
      let hasTimedOut = false;

      timer = setTimeout(() => {
        hasTimedOut = true;
        pythonProcess.kill('SIGKILL');
        reject(new Error('Tempo limite de execução excedido (máximo 6 segundos)'));
      }, timeoutMs);

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (timer) clearTimeout(timer);
        if (hasTimedOut) return;

        if (code !== 0 && !stdoutData) {
          return resolve({
            success: false,
            error: stderrData || `Processo Python finalizado com código ${code}`,
            stdout: '',
            stderr: stderrData,
          });
        }

        try {
          const parsed = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (err) {
          resolve({
            success: false,
            error: stderrData || 'Falha ao processar saída do Python',
            stdout: stdoutData,
            stderr: stderrData,
          });
        }
      });

      pythonProcess.on('error', (err) => {
        if (timer) clearTimeout(timer);
        reject(err);
      });

      // Write payload to stdin
      pythonProcess.stdin.write(JSON.stringify(payload));
      pythonProcess.stdin.end();
    });
  };

  // API endpoint for evaluating expressions or running scripts
  app.post('/api/python/eval', async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      if (typeof code !== 'string') {
        res.status(400).json({ success: false, error: 'Código inválido fornecido' });
        return;
      }

      const result = await runPythonEngine({ action: 'eval', code });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro interno ao executar script Python',
      });
    }
  });

  // API endpoint for plotting mathematical functions f(x)
  app.post('/api/python/plot', async (req: Request, res: Response) => {
    try {
      const { func, xMin, xMax, points } = req.body;
      if (!func || typeof func !== 'string') {
        res.status(400).json({ success: false, error: 'Função f(x) inválida' });
        return;
      }

      const result = await runPythonEngine({
        action: 'plot',
        func,
        xMin: Number(xMin) || -10,
        xMax: Number(xMax) || 10,
        points: Math.min(Math.max(Number(points) || 200, 20), 500),
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Erro ao gerar dados do gráfico',
      });
    }
  });

  // API endpoint for system and Python info
  app.get('/api/python/info', async (_req: Request, res: Response) => {
    res.json({
      engine: 'Python 3.10.12 (CPython)',
      status: 'online',
      standardModules: [
        'math',
        'cmath',
        'decimal',
        'fractions',
        'statistics',
        'random',
        'itertools',
        'datetime',
      ],
      capabilities: [
        'Arbitrary-precision arithmetic',
        'Complex numbers (j)',
        'Trigonometric & Hyperbolic',
        'Statistics & Distributions',
        'Combinatorics & Number theory',
        'Function plotting & Root finding',
        'Multi-line Python scripts & variables',
      ],
    });
  });

  // Setup Vite dev middleware or static files
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Calculadora Python] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar servidor:', err);
  process.exit(1);
});
