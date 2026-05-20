import { GoogleAuth } from 'google-auth-library'
import supabaseAdmin from './admin.mjs'

const serviceAccountJson = process.env.FCM_SERVICE_ACCOUNT || null
const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH || null

let projectId = process.env.FCM_PROJECT_ID || null

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: serviceAccountJson ? JSON.parse(serviceAccountJson) : undefined,
    keyFilename: serviceAccountPath || undefined,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
  const client = await auth.getClient()
  const tokenResponse = await client.getAccessToken()
  return tokenResponse.token
}

export async function sendToToken(token, title, body, data = {}) {
  if (!projectId) {
    // attempt to read from service account
    try {
      const creds = serviceAccountJson ? JSON.parse(serviceAccountJson) : null
      projectId = projectId || creds?.project_id
    } catch (e) {
      // ignore
    }
  }
  if (!projectId) throw new Error('FCM project id not set (FCM_PROJECT_ID or service account)')

  const accessToken = await getAccessToken()
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  const message = {
    message: {
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`FCM send failed: ${res.status} ${text}`)
  }

  return res.json()
}

export async function sendToProfile(profileId, title, body, data = {}) {
  const { data: tokens, error } = await supabaseAdmin.from('notifications_tokens').select('*').eq('profile_id', profileId)
  if (error) throw error
  if (!tokens || tokens.length === 0) return { skipped: true }
  const results = []
  for (const t of tokens) {
    try {
      const r = await sendToToken(t.token, title, body, data)
      results.push({ token: t.token, result: r })
    } catch (err) {
      results.push({ token: t.token, error: String(err) })
    }
  }
  return results
}

export default { sendToToken, sendToProfile }
