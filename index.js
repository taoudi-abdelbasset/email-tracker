require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// 1x1 transparent GIF in binary
const PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

app.get('/track/:personId/:emailId', async (req, res) => {
  const { personId, emailId } = req.params;

  // Log to Supabase (don't await — serve pixel immediately, log in background)
  supabase.from('opens').insert({
    person_id: personId,
    email_id: emailId,
    ip: req.headers['x-forwarded-for'] || req.ip,
    user_agent: req.headers['user-agent']
  }).then(() => console.log(`Tracked: ${personId} / ${emailId}`));

  // Return the invisible pixel
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.send(PIXEL);
});

// Health check (Render needs this)
app.get('/', (req, res) => res.send('Tracker running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));