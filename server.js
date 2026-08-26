/* global process */

import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'The Open Syllabus API is running',
      timestamp: new Date().toISOString(),
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve('dist');

    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`The Open Syllabus is running on port ${port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start the server:', error);
  process.exit(1);
});
