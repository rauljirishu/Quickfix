import supabaseAdmin from './admin.mjs'

const DEFAULT_MIN = parseFloat(process.env.DEFAULT_MIN_PRICE || '0')
const DEFAULT_MAX = parseFloat(process.env.DEFAULT_MAX_PRICE || '9999999')

export async function getPricingRuleForService(serviceId, categoryId) {
  // try service-specific rule
  if (serviceId) {
    const { data: sr, error: srErr } = await supabaseAdmin.from('pricing_rules').select('*').eq('service_id', serviceId).limit(1).single()
    if (!srErr && sr) return { min: parseFloat(sr.min_price), max: parseFloat(sr.max_price) }
  }

  // try category rule
  if (categoryId) {
    const { data: cr, error: crErr } = await supabaseAdmin.from('pricing_rules').select('*').eq('category_id', categoryId).limit(1).single()
    if (!crErr && cr) return { min: parseFloat(cr.min_price), max: parseFloat(cr.max_price) }
  }

  return { min: DEFAULT_MIN, max: DEFAULT_MAX }
}

export async function validatePrice(amount, { serviceId = null, categoryId = null } = {}) {
  const { min, max } = await getPricingRuleForService(serviceId, categoryId)
  const a = parseFloat(amount || 0)
  return { ok: a >= min && a <= max, min, max }
}

export default { getPricingRuleForService, validatePrice }
