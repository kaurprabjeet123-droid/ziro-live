// POST /api/auth/facebook — Vercel serverless function.
// Same pattern as Google: exchanges the one-time Facebook Login `code`
// for the user's name + email, server-side only.
//
// The app secret lives ONLY here, read from Vercel environment
// variables. It is never sent to the browser, never put in code, and
// never logged. Only name + email are returned — never any tokens.
//
// Env vars needed in Vercel (Settings > Environment Variables):
//   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
// The matching public app ID is served at run time by
// /api/auth/config.js so the browser can start the Facebook flow
// (an app ID is public; the secret is what must stay hidden).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  const appId = process.env.FACEBOOK_APP_ID
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appId || !appSecret) {
    return res.status(500).json({
      error: 'oauth_not_configured',
      message: 'Facebook sign-in is not set up yet. An adult needs to add the Facebook keys in Vercel (Settings > Environment Variables).',
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
    // 1. Swap the one-time code for a token (server-to-server only).
    const tokenUrl =
      'https://graph.facebook.com/v20.0/oauth/access_token?' +
      new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      })
    const tokenRes = await fetch(tokenUrl)
    const token = await tokenRes.json()
    if (!tokenRes.ok || !token.access_token) {
      return res.status(502).json({
        error: 'facebook_exchange_failed',
        message: 'Facebook did not accept the sign-in. Please try again.',
      })
    }

    // 2. Ask Facebook who just signed in (name + email only).
    const meUrl =
      'https://graph.facebook.com/v20.0/me?' +
      new URLSearchParams({
        fields: 'id,name,email',
        access_token: token.access_token,
      })
    const meRes = await fetch(meUrl)
    const me = await meRes.json()
    if (!meRes.ok || !me.name) {
      return res.status(502).json({
        error: 'facebook_profile_failed',
        message: 'Facebook signed you in but did not share your details. Please try again.',
      })
    }

    return res.status(200).json({
      name: me.name,
      email: me.email || '',
      picture: null,
    })
  } catch (e) {
    return res.status(502).json({
      error: 'facebook_unreachable',
      message: 'Could not reach Facebook. Check your connection and try again.',
    })
  }
}
