import Joi from 'joi'

export const profileSchema = Joi.object({
  full_name: Joi.string().max(200).allow(null, ''),
  age: Joi.number().integer().min(0).max(150).allow(null),
  gender: Joi.string().valid('male', 'female', 'other').allow(null),
  phone: Joi.string().max(30).allow(null, ''),
  role: Joi.string().valid('customer', 'worker', 'admin', 'vendor').optional(),
  avatar_url: Joi.string().uri().allow(null, ''),
  latitude: Joi.number().min(-90).max(90).allow(null),
  longitude: Joi.number().min(-180).max(180).allow(null),
})

export const signupSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().max(200).allow(null, ''),
  age: Joi.number().integer().min(0).max(150).allow(null),
  gender: Joi.string().valid('male', 'female', 'other').allow(null),
  phone: Joi.string().max(30).allow(null, ''),
  role: Joi.string().valid('customer', 'worker', 'admin', 'vendor').default('customer')
})

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
})

export const bookingSchema = Joi.object({
  service_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  worker_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).optional().allow(null),
  package_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).optional().allow(null),
  scheduled_at: Joi.date().iso().optional().allow(null),
  total_amount: Joi.number().precision(2).optional().allow(null),
  metadata: Joi.object().optional().allow(null),
})

export const bookingStatusSchema = Joi.object({
  status: Joi.string().valid('requested', 'accepted', 'in_progress', 'completed', 'cancelled').required(),
  note: Joi.string().max(500).optional().allow(null, ''),
})

export const chatConversationSchema = Joi.object({
  booking_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).optional().allow(null),
  participant_ids: Joi.array().items(Joi.string().guid({ version: ['uuidv4', 'uuidv1'] })).min(1).required(),
})

export const chatMessageSchema = Joi.object({
  conversation_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  recipient_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).optional().allow(null),
  body: Joi.string().max(5000).required(),
  attachments: Joi.array().items(Joi.object()).optional().allow(null),
})

export const reviewSchema = Joi.object({
  booking_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(2000).optional().allow(null, ''),
})

export const reviewModerationSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected', 'flagged').required(),
  moderation_note: Joi.string().max(1000).optional().allow(null, ''),
})

export const walletTransactionSchema = Joi.object({
  type: Joi.string().valid('credit', 'debit').required(),
  amount: Joi.number().precision(2).positive().required(),
  metadata: Joi.object().optional().allow(null),
})

export const walletTransferSchema = Joi.object({
  to_profile_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  amount: Joi.number().precision(2).positive().required(),
  metadata: Joi.object().optional().allow(null),
})

export const vendorSchema = Joi.object({
  name: Joi.string().max(200).required(),
})

export const vendorMemberSchema = Joi.object({
  profile_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  role: Joi.string().valid('owner', 'admin', 'member').default('member'),
})

export const serviceSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().allow(null, ''),
  category_id: Joi.string().guid().optional().allow(null),
  price: Joi.number().precision(2).optional().allow(null),
  duration_minutes: Joi.number().integer().optional().allow(null),
})

export const categorySchema = Joi.object({
  name: Joi.string().max(120).required(),
  slug: Joi.string().max(120).pattern(/^[a-z0-9-]+$/).optional(),
  description: Joi.string().allow(null, ''),
})

export const packageSchema = Joi.object({
  service_id: Joi.string().guid({ version: ['uuidv4', 'uuidv1'] }).required(),
  title: Joi.string().max(200).required(),
  details: Joi.object().optional().allow(null),
  price: Joi.number().precision(2).required(),
})

export const pricingRuleSchema = Joi.object({
  category_id: Joi.string().guid().optional().allow(null),
  service_id: Joi.string().guid().optional().allow(null),
  min_price: Joi.number().precision(2).required(),
  max_price: Joi.number().precision(2).required(),
})

export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { stripUnknown: true })
    if (error) return res.status(400).json({ error: error.details.map((d) => d.message).join(', ') })
    req.body = value
    next()
  }
}
