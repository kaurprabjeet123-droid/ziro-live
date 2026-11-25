// POST /api/auth/google  — Vercel serverless function.
// Exchanges the one-time Google OAuth `code` for the user's name + email.
//
// The client secret lives ONLY here, on the server, read from Vercel
// environment variables. It is never sent to the browser, never put in
// code, and never logged. Only the user's name and email are returned
// to the browser — never any Google tokens.
//
// Env vars needed in Vercel (Settings > Environment Variables):
//   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// The matching public client ID is served at run time by
// /api/auth/config.js so the browser can start the Google flow
// (a client ID is public; the secret is what must stay hidden).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    // Deliberately vague: do not reveal which value is missing.
    return res.status(500).json({
      error: 'oauth_not_configured',
      message: 'Google sign-in is not set up yet. An adult needs to add the Google keys in Vercel (Settings > Environment Variables).',
    })
  }

  let body = req.body
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch { body = {} }
  }
  const code = body && typeof body.code === 'string' ? body.code : ''
  const redirectUri = body && typeof body.redirectUri === 'string' ? body.redirectUri : ''
  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'missing_code' })
  }
  // Only allow redirect URIs on ziro.site or a *.vercel.app preview of
  // this project — never send the code anywhere else.
  let redirectUrl
  try { redirectUrl = new URL(redirectUri) } catch {
    return res.status(400).json({ error: 'bad_redirect_uri' })
  }
  const hostOk =
    redirectUrl.protocol === 'https:' &&
    (redirectUrl.hostname === 'ziro.site' || redirectUrl.hostname.endsWith('.vercel.app'))
  if (!hostOk) {
    return res.status(400).json({ error: 'bad_redirect_uri' })
  }

  try {
    // 1. Swap the one-time code for tokens (server-to-server only).
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })
    const token = await tokenRes.json()
    if (!tokenRes.ok || !token.access_token) {
      return res.status(502).json({
        error: 'google_exchange_failed',
        message: 'Google did not accept the sign-in. Please try again.',
      })
    }

    // 2. Ask Google who just signed in (name + email only).
    const meRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    })
    const me = await meRes.json()
    if (!meRes.ok || !me.email) {
      return res.status(502).json({
        error: 'google_profile_failed',
        message: 'Google signed you in but did not share your details. Please try again.',
      })
    }

    // 3. Return only name + email. Tokens stay on the server and are
    // thrown away — ziro does not need them after this.
    return res.status(200).json({
      name: me.name || (me.email ? me.email.split('@')[0] : 'ziro user'),
      email: me.email,
      picture: me.picture || null,
    })
  } catch (e) {
    return res.status(502).json({
      error: 'google_unreachable',
      message: 'Could not reach Google. Check your connection and try again.',
    })
  }
}
