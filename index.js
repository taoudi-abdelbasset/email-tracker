import { Hono } from 'hono';

const app = new Hono();

const PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

app.get('/track/:personId/:emailId', async (c) => {
  const personId = c.req.param('personId');
  const emailId = c.req.param('emailId');

  // Log to Supabase in background
  c.executionCtx.waitUntil(
    fetch(`${c.env.SUPABASE_URL}/rest/v1/opens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': c.env.SUPABASE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        person_id: personId,
        email_id: emailId,
        ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
        user_agent: c.req.header('user-agent')
      })
    })
  );

  // Return pixel
  const binary = Uint8Array.from(atob(PIXEL), c => c.charCodeAt(0));
  return new Response(binary, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
});

app.get('/', (c) => c.text('Tracker running'));

export default app;