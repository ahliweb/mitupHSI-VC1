import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use(
  '*',
  cors({
    origin: [
      'https://personalfinance.ahlikoding.com',
      'http://localhost:3000',
      'http://localhost:4321',
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
    credentials: true,
  })
);

app.get('/', (c) => {
  return c.json({
    name: 'MeetUP HSI Personal Finance API',
    version: '3.1.0',
    status: 'operational',
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/media/upload', async (c) => {
  const bucket = c.env.MEDIA_BUCKET;
  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500);
  }

  const contentType = c.req.header('Content-Type');
  if (!contentType?.startsWith('multipart/form-data')) {
    return c.json({ error: 'Content-Type must be multipart/form-data' }, 400);
  }

  return c.json({
    message: 'Media upload endpoint ready',
    note: 'Implement multipart/form-data parsing for full functionality',
  });
});

app.get('/api/media/*', async (c) => {
  const key = c.req.path.replace('/api/media/', '');
  const bucket = c.env.MEDIA_BUCKET;
  
  if (!bucket) {
    return c.json({ error: 'R2 bucket not configured' }, 500);
  }

  try {
    const object = await bucket.get(key);
    if (!object) {
      return c.json({ error: 'Object not found' }, 404);
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    
    return new Response(object.body, { headers });
  } catch (error) {
    return c.json({ error: 'Failed to retrieve object' }, 500);
  }
});

app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

export default app;
