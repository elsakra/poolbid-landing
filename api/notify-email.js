/**
 * POST JSON { "email": "user@example.com" } — forwards to Slack Incoming Webhook.
 * Set SLACK_WEBHOOK_URL in Vercel Project → Settings → Environment Variables.
 */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let body = req.body;
  if (body == null || typeof body === 'string') {
    try {
      body = typeof body === 'string' ? JSON.parse(body || '{}') : {};
    } catch {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    return res.status(503).json({ error: 'Notifications not configured' });
  }

  const slackRes = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `PoolBidder lead email: ${email}`,
    }),
  });

  if (!slackRes.ok) {
    const t = await slackRes.text().catch(() => '');
    return res.status(502).json({ error: 'Slack request failed', detail: t.slice(0, 200) });
  }

  return res.status(200).json({ ok: true });
};
