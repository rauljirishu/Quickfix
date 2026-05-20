import supabaseAdmin from './admin.mjs'

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null
    if (!token) return res.status(401).json({ error: 'Missing access token' })

    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' })

    req.user = data.user
    // fetch profile
    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', data.user.id).single()
    req.profile = profile ?? null
    next()
  } catch (err) {
    console.error('Auth middleware error', err)
    res.status(500).json({ error: 'Auth error' })
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.profile) return res.status(401).json({ error: 'Unauthorized' })
    if (req.profile.role !== role) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

export function requireAnyRole(roles = []) {
  return (req, res, next) => {
    if (!req.profile) return res.status(401).json({ error: 'Unauthorized' })
    if (!roles.includes(req.profile.role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

// Generic ownership helper: checks resource owner fields and allows admin override
export function requireAdminOrOwner(resourceType, idParam = 'id', client = supabaseAdmin) {
  return async (req, res, next) => {
    try {
      if (!req.profile) return res.status(401).json({ error: 'Unauthorized' })
      if (req.profile.role === 'admin') return next()

      const id = req.params[idParam]
      let ownerId = null

      if (resourceType === 'service') {
        const { data } = await client.from('services').select('vendor_id').eq('id', id).single()
        ownerId = data?.vendor_id
      } else if (resourceType === 'package') {
        // find package -> service -> vendor
        const { data: p } = await client.from('packages').select('service_id').eq('id', id).single()
        const serviceId = p?.service_id
        if (serviceId) {
          const { data: s } = await client.from('services').select('vendor_id').eq('id', serviceId).single()
          ownerId = s?.vendor_id
        }
      } else if (resourceType === 'profile') {
        ownerId = id
      } else if (resourceType === 'booking') {
        const { data: b } = await client.from('bookings').select('customer_id,worker_id').eq('id', id).single()
        // owner if customer or worker
        if (b) {
          if (b.customer_id === req.user.id || b.worker_id === req.user.id) return next()
        }
        return res.status(403).json({ error: 'Forbidden' })
      } else {
        return res.status(400).json({ error: 'Unknown resource type' })
      }

      if (!ownerId) return res.status(404).json({ error: 'Resource not found' })
      if (ownerId !== req.user.id) return res.status(403).json({ error: 'Forbidden' })
      return next()
    } catch (err) {
      console.error('Ownership check error', err)
      return res.status(500).json({ error: 'Ownership check failed' })
    }
  }
}
