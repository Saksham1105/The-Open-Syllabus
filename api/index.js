import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'The Open Syllabus API is running',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/ai', async (req, res) => {
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!message) {
    return res.status(400).json({ error: 'A message is required.' });
  }

  if (!ai) {
    return res.status(503).json({ error: 'AI service is not configured.' });
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction:
          "You are the study assistant for The Open Syllabus. Help students navigate course resources, discussions, friends, profiles, and study mode. You may also answer general academic questions. Keep responses concise, clear, and practical.",
      },
    });

    const response = await chat.sendMessage({ message });
    return res.json({ reply: response.text });
  } catch (error) {
    console.error('AI request failed:', error);
    return res.status(502).json({ error: 'The AI service could not complete the request.' });
  }
});

export default app;
