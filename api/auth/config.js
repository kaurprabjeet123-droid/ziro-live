// GET /api/auth/config — Vercel serverless function.
//
// Returns ONLY the public OAuth client/app IDs (like a username —
// they are public identifiers, not secrets), so the browser can
// start the real Google / Facebook sign-in flow.
//
// Why this exists: the client IDs must be read at RUN time, from
// Vercel env vars, not baked in at BUILD time. (When they were read
// from VITE_* build-time vars, a build without them made the
// bundler treat the sign-in as "never set up" and delete the real
// Google/Facebook redirect URL from the built site entirely.)
//
// Env vars needed in Vercel (Settings > Environment Variables):
//   GOOGLE_CLIENT_ID, FACEBOOK_APP_ID
// The matching secrets (GOOGLE_CLIENT_SECRET, FACEBOOK_APP_SECRET)
// are NEVER returned here — they are only used inside
// /api/auth/google.js and /api/auth/facebook.js, on the server.

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  return res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
  })
}
