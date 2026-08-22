import express from 'express';

const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'The Open Syllabus API is running',
    timestamp: new Date().toISOString(),
  });
});

export default app;
