import { Hono } from 'hono';
const app = new Hono();
const PIXEL = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

app.get('/track/:personId/:emailId', async (c) => {
  const personId = c.req.param('personId');
  const emailId  = c.req.param('emailId');
  const cf       = c.req.raw.cf || {};

  c.executionCtx.waitUntil((async () => {
    const openRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/opens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        c.env.SUPABASE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_KEY}`,
        'Prefer':        'return=representation'  // <-- tells supabase to return the row
      },
      body: JSON.stringify({
        person_id:  personId,
        email_id:   emailId,
        ip:         c.req.header('cf-connecting-ip'),
        user_agent: c.req.header('user-agent') || null,
      })
    });

    const openText = await openRes.text();
    console.log('STATUS:', openRes.status);
    console.log('BODY:', openText);

    if (!openRes.ok) return;

    const openData = JSON.parse(openText);
    const open = Array.isArray(openData) ? openData[0] : openData;

    if (!open?.id) {
      console.error('No id in response:', openText);
      return;
    }

    const detailRes = await fetch(`${c.env.SUPABASE_URL}/rest/v1/open_details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey':        c.env.SUPABASE_KEY,
        'Authorization': `Bearer ${c.env.SUPABASE_KEY}`,
        'Prefer':        'return=minimal'
      },
      body: JSON.stringify({
        open_id:         open.id,
        ip_forwarded:    (c.req.header('x-forwarded-for') || '').split(',')[0].trim() || null,
        country_code:    c.req.header('cf-ipcountry') || null,
        cf_country:      cf.country          || null,
        cf_city:         cf.city             || null,
        cf_region:       cf.region           || null,
        cf_latitude:     cf.latitude         ? String(cf.latitude)  : null,
        cf_longitude:    cf.longitude        ? String(cf.longitude) : null,
        cf_timezone:     cf.timezone         || null,
        cf_asn:          cf.asn              || null,
        cf_org:          cf.asOrganization   || null,
        cf_postal:       cf.postalCode       || null,
        cf_metro:        cf.metroCode        || null,
        cf_is_eu:        cf.isEUCountry === '1' ? true : false,
        accept_language: c.req.header('accept-language') || null,
        referer:         c.req.header('referer')          || null,
      })
    });

    console.log('open_details status:', detailRes.status);
    if (!detailRes.ok) console.error('open_details error:', await detailRes.text());

  })());

  const binary = Uint8Array.from(atob(PIXEL), c => c.charCodeAt(0));
  return new Response(binary, {
    headers: {
      'Content-Type':  'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  });
});

export default app;