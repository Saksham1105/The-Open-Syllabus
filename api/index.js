import express from 'express';

const app = express();
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'The Open Syllabus API is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// For Vercel, we export the app instance
export default app;
