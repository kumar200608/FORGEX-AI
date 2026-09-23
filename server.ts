import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'AdaptX Adaptive Engine API',
      timestamp: Date.now(),
    });
  });

  // Ollama status check endpoint
  app.get('/api/ai/status', async (req: Request, res: Response) => {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const ping = await fetch(`${ollamaHost}/api/tags`, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (ping.ok) {
        const data = await ping.json();
        const models = (data.models || []).map((m: { name: string }) => m.name);
        return res.json({
          available: true,
          host: ollamaHost,
          models,
        });
      }
    } catch {
      // Ollama not running locally
    }

    res.json({
      available: false,
      host: ollamaHost,
      message: 'Local Ollama service not reachable on ' + ollamaHost,
    });
  });

  // AI optimization analysis endpoint
  app.post('/api/ai/analyze', async (req: Request, res: Response) => {
    const { network, device, adaptiveMode, jsTier, imageStrategy, prefetchStrategy, metrics } = req.body || {};
    const ollamaHost = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

    const prompt = `You are a web performance optimization assistant for AdaptX, a network- and device-adaptive web platform.
Analyze only the supplied real browser measurements.
Identify the biggest bottleneck.
Recommend concrete optimizations.
Never invent measurements. Do not claim an optimization improved performance unless measured.

Supplied Measurements:
- Network Condition: ${network}
- Device Hardware Profile: ${device}
- Current Adaptive Mode: ${adaptiveMode}
- Active JS Tier: ${jsTier}
- Image Delivery Strategy: ${imageStrategy}
- Prefetch Strategy: ${prefetchStrategy}
- Measured LCP: ${metrics?.lcpMs !== null ? metrics?.lcpMs + 'ms' : 'N/A'}
- Measured INP: ${metrics?.inpMs !== null ? metrics?.inpMs + 'ms' : 'N/A'}
- Measured CLS: ${metrics?.cls !== null ? metrics?.cls : 'N/A'}
- Measured FCP: ${metrics?.fcpMs !== null ? metrics?.fcpMs + 'ms' : 'N/A'}
- Measured TTFB: ${metrics?.ttfbMs !== null ? metrics?.ttfbMs + 'ms' : 'N/A'}
- Measured JS Transfer: ${metrics ? Math.round(metrics.jsTransferBytes / 1024) + ' KB' : 'N/A'}
- Measured Image Transfer: ${metrics ? Math.round(metrics.imageTransferBytes / 1024) + ' KB' : 'N/A'}
- Total Transfer Size: ${metrics ? Math.round(metrics.totalTransferBytes / 1024) + ' KB' : 'N/A'}
- Resource Count: ${metrics?.resourceCount ?? 'N/A'}

Respond strictly with a JSON object in this exact schema, without markdown code fences or conversational text:
{
  "bottleneck": "Short diagnosis of the single largest bottleneck based on the numbers above",
  "recommendation": "Precise concrete optimization to apply",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "reasoning": "Technical justification referencing the exact metrics provided",
  "estimatedImpact": "Expected quantitative improvement"
}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000); // 4s timeout

      const ollamaRes = await fetch(`${ollamaHost}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          prompt,
          stream: false,
          format: 'json',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (ollamaRes.ok) {
        const ollamaData = await ollamaRes.json();
        const responseText = ollamaData.response;
        try {
          const parsed = JSON.parse(responseText);
          return res.json({
            recommendation: {
              ...parsed,
              source: 'ollama-local',
              modelUsed: ollamaModel,
            },
          });
        } catch {
          // JSON parsing fallback
        }
      }
    } catch {
      // Handled gracefully below
    }

    // Return null so the client can apply the deterministic analysis fallback
    return res.status(200).json({
      recommendation: null,
      fallbackRequired: true,
      message: 'Local Ollama not reachable; client fallback activated.',
    });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AdaptX server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
