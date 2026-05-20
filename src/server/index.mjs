import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import fs from 'fs'
import path from 'path'
import supabaseAdmin from './admin.mjs'
import { requireAuth, requireAdminOrOwner } from './middleware.mjs'
import { validate, bookingSchema, bookingStatusSchema, chatConversationSchema, chatMessageSchema, reviewSchema, reviewModerationSchema, walletTransactionSchema, walletTransferSchema, loginSchema, vendorSchema, vendorMemberSchema, serviceSchema, profileSchema, packageSchema, pricingRuleSchema, signupSchema, categorySchema } from './validation.mjs'
import { globalLimiter, authLimiter } from './rateLimit.mjs'
import fcm from './fcm.mjs'
import { validatePrice } from './pricing.mjs'
import getAuthClient from './authClient.mjs'
import { getOrCreateWallet, applyWalletTransaction } from './wallet.mjs'

const app = express()
app.use(helmet())
app.use(cors())
app.use(bodyParser.json({ limit: '5mb' }))
app.use(globalLimiter)

// apply authLimiter to auth-sensitive routes
app.use('/api/profile', authLimiter)
app.use('/api/bookings', authLimiter)
app.use('/api/chat', authLimiter)

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }))

// Profiles
app.get('/api/profile/:id', async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single()
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/profile/:id', requireAuth, requireAdminOrOwner('profile', 'id'), validate(profileSchema), async (req, res) => {
  const { id } = req.params

  const payload = { id, ...req.body }
  const { data, error } = await supabaseAdmin.from('profiles').upsert(payload)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Categories
app.get('/api/categories', async (req, res) => {
  const { search } = req.query
  let query = supabaseAdmin.from('categories').select('*')
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/categories', requireAuth, validate(categorySchema), async (req, res) => {
  // only admin can create categories
  const isAdmin = req.profile?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const payload = { ...req.body }
  if (!payload.slug && payload.name) {
    payload.slug = payload.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const { data, error } = await supabaseAdmin.from('categories').insert(payload)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.patch('/api/categories/:id', requireAuth, validate(categorySchema), async (req, res) => {
  const isAdmin = req.profile?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const { id } = req.params
  const payload = { ...req.body }
  if (payload.name && !payload.slug) {
    payload.slug = payload.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  }

  const { data, error } = await supabaseAdmin.from('categories').update(payload).eq('id', id)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  const isAdmin = req.profile?.role === 'admin'
  if (!isAdmin) return res.status(403).json({ error: 'Forbidden' })

  const { id } = req.params
  const { data, error } = await supabaseAdmin.from('categories').delete().eq('id', id)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Services
app.get('/api/services', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('services').select('*')
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/services', requireAuth, validate(serviceSchema), async (req, res) => {
  // vendors/workers/admins can create services
  const role = req.profile?.role
  if (!['worker', 'vendor', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

  const payload = { ...req.body, vendor_id: req.profile?.id }
  // enforce pricing rule if price provided
  if (payload.price != null) {
    const { ok, min, max } = await validatePrice(payload.price, { categoryId: payload.category_id })
    if (!ok) return res.status(400).json({ error: `Price must be between ${min} and ${max}` })
  }

  const { data, error } = await supabaseAdmin.from('services').insert(payload)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Delete service (owner or admin)
app.delete('/api/services/:id', requireAuth, requireAdminOrOwner('service', 'id'), async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabaseAdmin.from('services').delete().eq('id', id)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Packages CRUD
app.post('/api/packages', requireAuth, validate(packageSchema), async (req, res) => {
  try {
    // only vendors/workers/admins
    const role = req.profile?.role
    if (!['worker', 'vendor', 'admin'].includes(role)) return res.status(403).json({ error: 'Forbidden' })

    const payload = { ...req.body }
    // validate against service/category pricing
    const { data: svc } = await supabaseAdmin.from('services').select('id, category_id').eq('id', payload.service_id).single()
    const categoryId = svc?.category_id ?? null
    const { ok, min, max } = await validatePrice(payload.price, { serviceId: payload.service_id, categoryId })
    if (!ok) return res.status(400).json({ error: `Package price must be between ${min} and ${max}` })

    const { data, error } = await supabaseAdmin.from('packages').insert(payload)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    console.error('Package create error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/packages/:serviceId', async (req, res) => {
  const { serviceId } = req.params
  const { data, error } = await supabaseAdmin.from('packages').select('*').eq('service_id', serviceId)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.delete('/api/packages/:id', requireAuth, requireAdminOrOwner('package', 'id'), async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabaseAdmin.from('packages').delete().eq('id', id)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Pricing rules admin endpoints
app.get('/api/pricing_rules', requireAuth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { data, error } = await supabaseAdmin.from('pricing_rules').select('*')
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Failed' })
  }
})

app.post('/api/pricing_rules', requireAuth, validate(pricingRuleSchema), async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { data, error } = await supabaseAdmin.from('pricing_rules').insert(req.body)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Failed' })
  }
})

app.patch('/api/pricing_rules/:id', requireAuth, validate(pricingRuleSchema), async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { id } = req.params
    const { data, error } = await supabaseAdmin.from('pricing_rules').update(req.body).eq('id', id)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Failed' })
  }
})

app.delete('/api/pricing_rules/:id', requireAuth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { id } = req.params
    const { data, error } = await supabaseAdmin.from('pricing_rules').delete().eq('id', id)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Failed' })
  }
})

// Bookings
app.post('/api/bookings', requireAuth, validate(bookingSchema), async (req, res) => {
  const payload = { ...req.body, customer_id: req.user.id }
  // ensure total_amount adheres to pricing rules if present, else derive from package/service price when possible
  if (payload.total_amount != null) {
    // fetch service to determine category
    const { data: svc } = await supabaseAdmin.from('services').select('id, category_id').eq('id', payload.service_id).single()
    const categoryId = svc?.category_id ?? null
    const { ok, min, max } = await validatePrice(payload.total_amount, { serviceId: payload.service_id, categoryId })
    if (!ok) return res.status(400).json({ error: `Booking total must be between ${min} and ${max}` })
  } else {
    // attempt to compute total from package or service
    if (payload.package_id) {
      const { data: pkg } = await supabaseAdmin.from('packages').select('price').eq('id', payload.package_id).single()
      if (pkg?.price != null) payload.total_amount = pkg.price
    } else {
      const { data: svc } = await supabaseAdmin.from('services').select('price').eq('id', payload.service_id).single()
      if (svc?.price != null) payload.total_amount = svc.price
    }
  }

  const { data, error } = await supabaseAdmin.from('bookings').insert(payload).select('*').single()
  if (error) return res.status(400).json({ error })

  // create initial status event for timeline tracking
  await supabaseAdmin.from('booking_status_events').insert({
    booking_id: data.id,
    status: data.status || 'requested',
    note: 'Booking created',
    changed_by: req.user.id,
  })

  res.json({ data })
})

// Track a single booking with timeline
app.get('/api/bookings/:id/track', requireAuth, requireAdminOrOwner('booking', 'id'), async (req, res) => {
  const { id } = req.params
  const [bookingRes, eventsRes] = await Promise.all([
    supabaseAdmin.from('bookings').select('*').eq('id', id).single(),
    supabaseAdmin.from('booking_status_events').select('*').eq('booking_id', id).order('created_at', { ascending: true }),
  ])

  if (bookingRes.error) return res.status(400).json({ error: bookingRes.error })
  if (eventsRes.error) return res.status(400).json({ error: eventsRes.error })
  res.json({ booking: bookingRes.data, events: eventsRes.data })
})

// Booking status events timeline only
app.get('/api/bookings/:id/events', requireAuth, requireAdminOrOwner('booking', 'id'), async (req, res) => {
  const { id } = req.params
  const { data, error } = await supabaseAdmin.from('booking_status_events').select('*').eq('booking_id', id).order('created_at', { ascending: true })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.get('/api/bookings/:userId', requireAuth, async (req, res) => {
  const { userId } = req.params
  // users may only fetch their own bookings unless admin
  if (req.user.id !== userId && req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
  const { data, error } = await supabaseAdmin.from('bookings').select('*').or(`customer_id.eq.${userId},worker_id.eq.${userId}`)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.patch('/api/bookings/:id/status', requireAuth, requireAdminOrOwner('booking', 'id'), validate(bookingStatusSchema), async (req, res) => {
  const { id } = req.params
  const { status, note } = req.body
  // only worker assigned or admin can change status
  const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id', id).single()
  if (!booking) return res.status(404).json({ error: 'Not found' })
  const allowed = req.profile?.role === 'admin' || req.user.id === booking.worker_id
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.from('bookings').update({ status }).eq('id', id).select('*').single()
  if (error) return res.status(400).json({ error })

  // append timeline event for status tracking
  await supabaseAdmin.from('booking_status_events').insert({
    booking_id: id,
    status,
    note: note || null,
    changed_by: req.user.id,
  })

  // persist in-app notification records for both sides
  await supabaseAdmin.from('notifications').insert([
    {
      profile_id: booking.customer_id,
      title: 'Booking status updated',
      body: `Your booking status is now ${status}`,
      data: { booking_id: id, status },
      sent: true,
    },
    {
      profile_id: booking.worker_id,
      title: 'Booking status updated',
      body: `Booking status is now ${status}`,
      data: { booking_id: id, status },
      sent: true,
    },
  ])

  // best-effort push notifications (if FCM configured)
  try {
    if (booking.customer_id) {
      await fcm.sendToProfile(booking.customer_id, 'Booking status updated', `Your booking status is now ${status}`, { booking_id: id, status })
    }
    if (booking.worker_id) {
      await fcm.sendToProfile(booking.worker_id, 'Booking status updated', `Booking status is now ${status}`, { booking_id: id, status })
    }
  } catch (pushErr) {
    console.error('Push notification failed for booking status update', pushErr)
  }

  res.json({ data })
})

// Chat messages
app.post('/api/chat/conversations', requireAuth, validate(chatConversationSchema), async (req, res) => {
  try {
    const participantIds = Array.from(new Set([req.user.id, ...(req.body.participant_ids || [])]))

    // if booking provided, ensure requester is part of booking
    if (req.body.booking_id) {
      const { data: booking } = await supabaseAdmin.from('bookings').select('*').eq('id', req.body.booking_id).single()
      if (!booking) return res.status(404).json({ error: 'Booking not found' })
      const allowed = req.profile?.role === 'admin' || booking.customer_id === req.user.id || booking.worker_id === req.user.id
      if (!allowed) return res.status(403).json({ error: 'Forbidden' })
    }

    const { data: conv, error: convErr } = await supabaseAdmin
      .from('chat_conversations')
      .insert({ booking_id: req.body.booking_id || null, created_by: req.user.id })
      .select('*')
      .single()
    if (convErr) return res.status(400).json({ error: convErr })

    const participantRows = participantIds.map((pid) => ({ conversation_id: conv.id, profile_id: pid }))
    const { error: partErr } = await supabaseAdmin.from('chat_participants').insert(participantRows)
    if (partErr) return res.status(400).json({ error: partErr })

    res.json({ data: conv })
  } catch (err) {
    console.error('Create conversation error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/chat/conversations', requireAuth, async (req, res) => {
  const { data: myParts, error: partErr } = await supabaseAdmin
    .from('chat_participants')
    .select('conversation_id')
    .eq('profile_id', req.user.id)
  if (partErr) return res.status(400).json({ error: partErr })

  const conversationIds = (myParts || []).map((p) => p.conversation_id)
  if (conversationIds.length === 0) return res.json({ data: [] })

  const { data, error } = await supabaseAdmin
    .from('chat_conversations')
    .select('*')
    .in('id', conversationIds)
    .order('updated_at', { ascending: false })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/chat/messages', requireAuth, validate(chatMessageSchema), async (req, res) => {
  const payload = { ...req.body, sender_id: req.user.id }

  // ensure user is conversation participant
  const { data: part } = await supabaseAdmin
    .from('chat_participants')
    .select('*')
    .eq('conversation_id', payload.conversation_id)
    .eq('profile_id', req.user.id)
    .single()
  if (!part) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.from('messages').insert(payload).select('*').single()
  if (error) return res.status(400).json({ error })

  // bump conversation updated_at
  await supabaseAdmin.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', payload.conversation_id)

  // best-effort push notification for recipient
  try {
    if (payload.recipient_id) {
      await fcm.sendToProfile(payload.recipient_id, 'New message', payload.body.slice(0, 120), {
        conversation_id: payload.conversation_id,
        message_id: data.id,
      })
    }
  } catch (err) {
    console.error('Chat push failed', err)
  }

  res.json({ data })
})

app.get('/api/chat/:conversationId', requireAuth, async (req, res) => {
  const { conversationId } = req.params
  const { data: part } = await supabaseAdmin
    .from('chat_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('profile_id', req.user.id)
    .single()
  if (!part) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.patch('/api/chat/:conversationId/read', requireAuth, async (req, res) => {
  const { conversationId } = req.params
  const { data: part } = await supabaseAdmin
    .from('chat_participants')
    .select('*')
    .eq('conversation_id', conversationId)
    .eq('profile_id', req.user.id)
    .single()
  if (!part) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', req.user.id)
    .is('read_at', null)
    .select('*')
  if (error) return res.status(400).json({ error })

  res.json({ data })
})

// Reviews
app.post('/api/reviews', requireAuth, validate(reviewSchema), async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body

    const { data: booking, error: bookingErr } = await supabaseAdmin.from('bookings').select('*').eq('id', booking_id).single()
    if (bookingErr || !booking) return res.status(404).json({ error: 'Booking not found' })

    // only customer who made booking can submit review and only after completion
    if (booking.customer_id !== req.user.id && req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    if (booking.status !== 'completed' && req.profile?.role !== 'admin') return res.status(400).json({ error: 'Review allowed only for completed bookings' })

    const payload = {
      booking_id,
      reviewer_id: req.user.id,
      reviewee_id: booking.worker_id,
      rating,
      comment: comment || null,
      status: 'approved',
    }

    const { data, error } = await supabaseAdmin.from('reviews').insert(payload).select('*').single()
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    console.error('Create review error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/reviews/:profileId', async (req, res) => {
  const { profileId } = req.params
  const includeAll = req.query.include_all === 'true'

  let query = supabaseAdmin.from('reviews').select('*').eq('reviewee_id', profileId)
  if (!includeAll) query = query.eq('status', 'approved')

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.get('/api/reviews/:profileId/summary', async (req, res) => {
  const { profileId } = req.params
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', profileId)
    .eq('status', 'approved')

  if (error) return res.status(400).json({ error })

  const rows = data || []
  const count = rows.length
  const total = rows.reduce((sum, row) => sum + Number(row.rating || 0), 0)
  const average = count > 0 ? total / count : 0
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  rows.forEach((row) => {
    const star = Number(row.rating)
    if (distribution[star] != null) distribution[star] += 1
  })

  res.json({ count, average, distribution })
})

app.patch('/api/reviews/:id/moderate', requireAuth, validate(reviewModerationSchema), async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const { id } = req.params
    const { status, moderation_note } = req.body

    const payload = {
      status,
      moderation_note: moderation_note || null,
      moderated_by: req.user.id,
      moderated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from('reviews').update(payload).eq('id', id).select('*').single()
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    console.error('Moderate review error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

// Wallet / transactions
app.get('/api/wallet/me', requireAuth, async (req, res) => {
  try {
    const wallet = await getOrCreateWallet(req.user.id)
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return res.status(400).json({ error })
    res.json({ wallet, transactions })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.post('/api/wallet/transaction', requireAuth, validate(walletTransactionSchema), async (req, res) => {
  try {
    const result = await applyWalletTransaction(req.user.id, req.body)
    res.json({ data: result })
  } catch (err) {
    const msg = String(err)
    if (msg.includes('Insufficient wallet balance')) return res.status(400).json({ error: msg })
    res.status(500).json({ error: msg })
  }
})

app.post('/api/wallet/transfer', requireAuth, validate(walletTransferSchema), async (req, res) => {
  try {
    const { to_profile_id, amount, metadata } = req.body
    if (to_profile_id === req.user.id) return res.status(400).json({ error: 'Cannot transfer to self' })

    const debit = await applyWalletTransaction(req.user.id, {
      type: 'debit',
      amount,
      metadata: { ...(metadata || {}), transfer_to: to_profile_id },
    })

    const credit = await applyWalletTransaction(to_profile_id, {
      type: 'credit',
      amount,
      metadata: { ...(metadata || {}), transfer_from: req.user.id },
    })

    res.json({ debit, credit })
  } catch (err) {
    const msg = String(err)
    if (msg.includes('Insufficient wallet balance')) return res.status(400).json({ error: msg })
    res.status(500).json({ error: msg })
  }
})

app.get('/api/wallet/:profileId', requireAuth, async (req, res) => {
  const { profileId } = req.params
  if (req.profile?.role !== 'admin' && req.user.id !== profileId) return res.status(403).json({ error: 'Forbidden' })

  try {
    const wallet = await getOrCreateWallet(profileId)
    const { data: transactions, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) return res.status(400).json({ error })
    res.json({ wallet, transactions })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Notifications (store tokens / send stub)
app.post('/api/notifications/token', requireAuth, async (req, res) => {
  const payload = { profile_id: req.user.id, ...req.body }
  const { data, error } = await supabaseAdmin.from('notifications_tokens').upsert(payload)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/notifications/send', requireAuth, async (req, res) => {
  // stub: store notification in DB for delivery by worker or external service
  const payload = { profile_id: req.body.profile_id, ...req.body }
  const { data, error } = await supabaseAdmin.from('notifications').insert(payload)
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/auth/signup', validate(signupSchema), async (req, res) => {
  try {
    const { email, password, full_name, age, gender, phone, role } = req.body

    // create a new user via admin
    const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, phone, role }
    })
    if (userErr) return res.status(400).json({ error: userErr })

    const userId = userData.user?.id
    if (!userId) return res.status(500).json({ error: 'Failed to create user' })

    const { data, error } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      full_name,
      age,
      gender,
      phone,
      role,
    })
    if (error) return res.status(400).json({ error })

    res.json({ user: userData.user, profile: data })
  } catch (err) {
    console.error('Signup error', err)
    res.status(500).json({ error: 'Signup failed' })
  }
})

app.post('/api/auth/login', authLimiter, validate(loginSchema), async (req, res) => {
  const authClient = getAuthClient()
  if (!authClient) return res.status(500).json({ error: 'SUPABASE_ANON_KEY is not configured on server' })

  const { email, password } = req.body
  const { data, error } = await authClient.auth.signInWithPassword({ email, password })
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  // Stateless JWT flow: client should clear local session tokens.
  res.json({ ok: true })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  res.json({ user: req.user, profile: req.profile })
})

// Multi-vendor management
app.post('/api/vendors', requireAuth, validate(vendorSchema), async (req, res) => {
  try {
    if (!['admin', 'vendor', 'worker'].includes(req.profile?.role)) return res.status(403).json({ error: 'Forbidden' })

    const { data: vendor, error: vendorErr } = await supabaseAdmin
      .from('vendors')
      .insert({ name: req.body.name, profile_id: req.user.id })
      .select('*')
      .single()
    if (vendorErr) return res.status(400).json({ error: vendorErr })

    await supabaseAdmin.from('vendor_members').insert({ vendor_id: vendor.id, profile_id: req.user.id, role: 'owner' })

    res.json({ data: vendor })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.get('/api/vendors/me', requireAuth, async (req, res) => {
  const { data: memberships, error } = await supabaseAdmin
    .from('vendor_members')
    .select('vendor_id,role')
    .eq('profile_id', req.user.id)
  if (error) return res.status(400).json({ error })

  const vendorIds = (memberships || []).map((m) => m.vendor_id)
  if (vendorIds.length === 0) return res.json({ data: [] })

  const { data: vendors, error: vendorsErr } = await supabaseAdmin.from('vendors').select('*').in('id', vendorIds)
  if (vendorsErr) return res.status(400).json({ error: vendorsErr })

  res.json({ data: vendors, memberships })
})

app.post('/api/vendors/:id/members', requireAuth, validate(vendorMemberSchema), async (req, res) => {
  const { id } = req.params

  // only vendor owner/admin or global admin
  const { data: myMember } = await supabaseAdmin
    .from('vendor_members')
    .select('*')
    .eq('vendor_id', id)
    .eq('profile_id', req.user.id)
    .single()
  const allowed = req.profile?.role === 'admin' || myMember?.role === 'owner' || myMember?.role === 'admin'
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('vendor_members')
    .upsert({ vendor_id: id, profile_id: req.body.profile_id, role: req.body.role })
    .select('*')
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.post('/api/vendors/:id/services/:serviceId', requireAuth, async (req, res) => {
  const { id, serviceId } = req.params

  const { data: myMember } = await supabaseAdmin
    .from('vendor_members')
    .select('*')
    .eq('vendor_id', id)
    .eq('profile_id', req.user.id)
    .single()
  const allowed = req.profile?.role === 'admin' || myMember?.role === 'owner' || myMember?.role === 'admin'
  if (!allowed) return res.status(403).json({ error: 'Forbidden' })

  const { data, error } = await supabaseAdmin
    .from('vendor_services')
    .upsert({ vendor_id: id, service_id: serviceId })
    .select('*')
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

app.get('/api/vendors/:id/services', async (req, res) => {
  const { id } = req.params
  const { data: links, error } = await supabaseAdmin.from('vendor_services').select('service_id').eq('vendor_id', id)
  if (error) return res.status(400).json({ error })
  const ids = (links || []).map((x) => x.service_id)
  if (ids.length === 0) return res.json({ data: [] })
  const { data, error: svcErr } = await supabaseAdmin.from('services').select('*').in('id', ids)
  if (svcErr) return res.status(400).json({ error: svcErr })
  res.json({ data })
})

// Push send endpoint using FCM (requires FCM_SERVICE_ACCOUNT or FCM_SERVICE_ACCOUNT_PATH and FCM_PROJECT_ID)
app.post('/api/push/send', requireAuth, async (req, res) => {
  try {
    const { to_profile_id, to_token, title, body, data: extra } = req.body
    // allow admin or sending to own tokens
    if (to_profile_id && req.user.id !== to_profile_id && req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

    if (to_token) {
      const r = await fcm.sendToToken(to_token, title || '', body || '', extra || {})
      return res.json({ result: r })
    }

    if (to_profile_id) {
      const r = await fcm.sendToProfile(to_profile_id, title || '', body || '', extra || {})
      return res.json({ result: r })
    }

    return res.status(400).json({ error: 'to_profile_id or to_token required' })
  } catch (err) {
    console.error('Push send error', err)
    res.status(500).json({ error: String(err) })
  }
})

// Recommendations (AI stub)
app.get('/api/recommendations/:userId', async (req, res) => {
  const { userId } = req.params
  try {
    const limit = parseInt(req.query.limit) || 6

    // user's booking history to infer preferred categories
    const { data: userBookings } = await supabaseAdmin
      .from('bookings')
      .select('service_id')
      .eq('customer_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    const serviceIds = (userBookings || []).map((b) => b.service_id).filter(Boolean)
    const { data: bookedServices } = serviceIds.length
      ? await supabaseAdmin.from('services').select('id, category_id').in('id', serviceIds)
      : { data: [] }

    const preferredCategoryCount = {}
    ;(bookedServices || []).forEach((s) => {
      if (!s.category_id) return
      preferredCategoryCount[s.category_id] = (preferredCategoryCount[s.category_id] || 0) + 1
    })

    // Candidate pool
    const { data: services, error } = await supabaseAdmin.from('services').select('*').limit(100)
    if (error) return res.status(400).json({ error })

    const scored = (services || []).map((service) => {
      const categoryBoost = preferredCategoryCount[service.category_id] || 0
      const affordabilityBoost = service.price != null ? Math.max(0, 50 - Number(service.price) / 10) : 0
      const score = categoryBoost * 20 + affordabilityBoost
      return { ...service, _score: score }
    })

    scored.sort((a, b) => b._score - a._score)
    res.json({ data: scored.slice(0, limit) })
  } catch (err) {
    console.error('Recommendation error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

// Location-based worker search
app.get('/api/search/nearby', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    const radiusKm = parseFloat(req.query.radius) || 10 // default 10 km
    const categoryId = req.query.category_id || null
    const limit = parseInt(req.query.limit) || 20

    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })

    let vendorIds = null
    if (categoryId) {
      const { data: sv, error: svErr } = await supabaseAdmin.from('services').select('vendor_id').eq('category_id', categoryId)
      if (svErr) return res.status(400).json({ error: svErr })
      vendorIds = sv.map((s) => s.vendor_id).filter(Boolean)
      if (vendorIds.length === 0) return res.json({ data: [] })
    }

    // fetch candidate workers
    let query = supabaseAdmin.from('profiles').select('*').eq('role', 'worker')
    if (vendorIds) query = query.in('id', vendorIds)
    const { data: candidates, error } = await query
    if (error) return res.status(400).json({ error })

    // compute Haversine distance
    function haversine(aLat, aLng, bLat, bLng) {
      const toRad = (v) => (v * Math.PI) / 180
      const R = 6371 // km
      const dLat = toRad(bLat - aLat)
      const dLon = toRad(bLng - aLng)
      const lat1 = toRad(aLat)
      const lat2 = toRad(bLat)

      const sinDLat = Math.sin(dLat / 2)
      const sinDLon = Math.sin(dLon / 2)
      const a = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    const results = (candidates || [])
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => {
        const distance = haversine(lat, lng, parseFloat(c.latitude), parseFloat(c.longitude))
        return { ...c, distance }
      })
      .filter((c) => c.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit)

    res.json({ data: results })
  } catch (err) {
    console.error('Search nearby error', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Location-based search using DB RPC (more efficient)
app.get('/api/search/nearby_sql', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat)
    const lng = parseFloat(req.query.lng)
    const radiusKm = parseFloat(req.query.radius) || 10 // default 10 km
    const categoryId = req.query.category_id || null
    const limit = parseInt(req.query.limit) || 20

    if (Number.isNaN(lat) || Number.isNaN(lng)) return res.status(400).json({ error: 'lat and lng required' })

    const params = {
      _lat: lat,
      _lng: lng,
      _radius_km: radiusKm,
      _category: categoryId,
      _lim: limit,
    }

    const { data, error } = await supabaseAdmin.rpc('search_nearby', params)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    console.error('Search nearby SQL error', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// File upload (base64 JSON) -> uploads bucket
app.post('/api/upload', requireAuth, async (req, res) => {
  try {
    const { filename, b64, contentType } = req.body
    if (!filename || !b64) return res.status(400).json({ error: 'Missing filename or b64' })

    const buffer = Buffer.from(b64, 'base64')
    const path = `${req.user.id}/${Date.now()}-${filename}`
    const { error: uploadError } = await supabaseAdmin.storage.from('uploads').upload(path, buffer, { contentType })
    if (uploadError) return res.status(400).json({ error: uploadError })

    const { data: publicData } = supabaseAdmin.storage.from('uploads').getPublicUrl(path)
    res.json({ url: publicData.publicUrl })
  } catch (err) {
    console.error('Upload error', err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

app.get('/api/i18n/:lang', (req, res) => {
  const lang = req.params.lang || 'en'
  const file = path.resolve('src', 'i18n', `${lang}.json`)
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Language not found' })
  const raw = fs.readFileSync(file, 'utf8')
  res.type('application/json').send(raw)
})

// Terms and conditions by language
app.get('/api/terms/:lang', async (req, res) => {
  const lang = req.params.lang || 'en'
  const { data, error } = await supabaseAdmin.from('terms_and_conditions').select('*').eq('lang', lang).limit(1).single()
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

// Cookie consent recording
app.post('/api/cookie-consent', async (req, res) => {
  try {
    const payload = { profile_id: req.body.profile_id || null, consent: req.body.consent || {}, user_agent: req.headers['user-agent'], ip: req.ip }
    const { data, error } = await supabaseAdmin.from('cookie_consents').insert(payload)
    if (error) return res.status(400).json({ error })
    res.json({ data })
  } catch (err) {
    res.status(500).json({ error: 'Failed' })
  }
})

// Admin analytics
app.get('/api/admin/stats', requireAuth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const from = req.query.from ? new Date(req.query.from).toISOString() : null
    const to = req.query.to ? new Date(req.query.to).toISOString() : null

    const [{ count: users }, { count: services }, { count: bookings }, txs, reviews] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact' }).then(r => r),
      supabaseAdmin.from('services').select('id', { count: 'exact' }).then(r => r),
      (from && to
        ? supabaseAdmin.from('bookings').select('id', { count: 'exact' }).gte('created_at', from).lte('created_at', to)
        : supabaseAdmin.from('bookings').select('id', { count: 'exact' })).then(r => r),
      (from && to
        ? supabaseAdmin.from('transactions').select('amount,type,created_at').gte('created_at', from).lte('created_at', to)
        : supabaseAdmin.from('transactions').select('amount,type,created_at')),
      supabaseAdmin.from('reviews').select('rating,status')
    ])

    const credits = (txs.data || []).filter((t) => t.type === 'credit')
    const debits = (txs.data || []).filter((t) => t.type === 'debit')
    const creditVolume = credits.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const debitVolume = debits.reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const revenue = creditVolume

    const approvedReviews = (reviews.data || []).filter((r) => r.status === 'approved')
    const reviewCount = approvedReviews.length
    const avgRating = reviewCount ? approvedReviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviewCount : 0

    const bookingStatusDist = (await supabaseAdmin.from('bookings').select('status')).data || []
    const statusDistribution = {}
    bookingStatusDist.forEach((b) => {
      statusDistribution[b.status] = (statusDistribution[b.status] || 0) + 1
    })

    res.json({
      users: users.count || 0,
      services: services.count || 0,
      bookings: bookings.count || 0,
      revenue,
      creditVolume,
      debitVolume,
      reviewCount,
      avgRating,
      statusDistribution,
    })
  } catch (err) {
    console.error('Admin stats error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

app.get('/api/admin/stats/top-workers', requireAuth, async (req, res) => {
  try {
    if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })
    const limit = parseInt(req.query.limit) || 10

    const { data: workers } = await supabaseAdmin.from('profiles').select('id,full_name').eq('role', 'worker')
    const workerIds = (workers || []).map((w) => w.id)
    if (workerIds.length === 0) return res.json({ data: [] })

    const [reviews, bookings] = await Promise.all([
      supabaseAdmin.from('reviews').select('reviewee_id,rating,status').in('reviewee_id', workerIds),
      supabaseAdmin.from('bookings').select('worker_id,status').in('worker_id', workerIds),
    ])

    const map = {}
    ;(workers || []).forEach((w) => {
      map[w.id] = { worker_id: w.id, full_name: w.full_name, avg_rating: 0, review_count: 0, completed_jobs: 0 }
    })

    ;(reviews.data || []).forEach((r) => {
      if (r.status !== 'approved') return
      const slot = map[r.reviewee_id]
      if (!slot) return
      slot.avg_rating += Number(r.rating || 0)
      slot.review_count += 1
    })

    Object.values(map).forEach((slot) => {
      slot.avg_rating = slot.review_count ? slot.avg_rating / slot.review_count : 0
    })

    ;(bookings.data || []).forEach((b) => {
      if (b.status !== 'completed') return
      const slot = map[b.worker_id]
      if (!slot) return
      slot.completed_jobs += 1
    })

    const data = Object.values(map)
      .sort((a, b) => (b.avg_rating * 2 + b.completed_jobs) - (a.avg_rating * 2 + a.completed_jobs))
      .slice(0, limit)

    res.json({ data })
  } catch (err) {
    console.error('Top workers stats error', err)
    res.status(500).json({ error: 'Failed' })
  }
})

const port = process.env.PORT || 8787
app.listen(port, () => console.log(`Server listening on ${port}`))
