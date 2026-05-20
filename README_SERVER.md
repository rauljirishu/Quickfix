# QuickFix Server API

This project includes an Express API in `src/server` backed by Supabase service-role operations.

## Local setup

1. Create `.env.server` at project root (do not commit):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
PORT=8787
DEFAULT_MIN_PRICE=0
DEFAULT_MAX_PRICE=9999999
# Optional FCM
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVICE_ACCOUNT_PATH=/absolute/path/to/firebase-service-account.json
```

2. Install dependencies:

```bash
npm install
```

3. Start API server:

```bash
npm run start:server
```

4. Run server tests:

```bash
$env:NODE_ENV='test'; npm run test:server
```

## Core endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Profiles
- `GET /api/profile/:id`
- `POST /api/profile/:id` (admin or profile owner)

### Categories
- `GET /api/categories?search=clean`
- `POST /api/categories` (admin)
- `PATCH /api/categories/:id` (admin)
- `DELETE /api/categories/:id` (admin)

### Services
- `GET /api/services`
- `POST /api/services` (worker/vendor/admin)
- `DELETE /api/services/:id` (admin or owning vendor)

### Packages
- `POST /api/packages` (worker/vendor/admin)
- `GET /api/packages/:serviceId`
- `DELETE /api/packages/:id` (admin or owning vendor)

### Pricing rules (admin)
- `GET /api/pricing_rules`
- `POST /api/pricing_rules`
- `PATCH /api/pricing_rules/:id`
- `DELETE /api/pricing_rules/:id`

### Bookings
- `POST /api/bookings`
- `GET /api/bookings/:userId` (self or admin)
- `PATCH /api/bookings/:id/status` (admin or booking participant)
- `GET /api/bookings/:id/events` (admin or booking participant)
- `GET /api/bookings/:id/track` (admin or booking participant, returns booking + timeline)

### Chat
- `POST /api/chat/conversations` (create conversation; requester auto-included)
- `GET /api/chat/conversations` (list requester conversations)
- `POST /api/chat/messages` (participant-only)
- `GET /api/chat/:conversationId` (participant-only)
- `PATCH /api/chat/:conversationId/read` (participant-only; marks received messages as read)

### Reviews / Wallet
- `POST /api/reviews` (customer for completed booking; one per booking per reviewer)
- `GET /api/reviews/:profileId` (approved by default; add `?include_all=true` for full list)
- `GET /api/reviews/:profileId/summary` (count, average, distribution)
- `PATCH /api/reviews/:id/moderate` (admin)
- `GET /api/wallet/me`
- `POST /api/wallet/transaction` (validated `credit|debit`, balance-safe)
- `POST /api/wallet/transfer` (wallet-to-wallet transfer)
- `GET /api/wallet/:profileId` (self or admin)

### Vendors (multi-vendor)
- `POST /api/vendors` (admin/vendor/worker)
- `GET /api/vendors/me` (list vendors current user belongs to)
- `POST /api/vendors/:id/members` (vendor owner/admin or global admin)
- `POST /api/vendors/:id/services/:serviceId` (vendor owner/admin or global admin)
- `GET /api/vendors/:id/services`

### Notifications / Push
- `POST /api/notifications/token`
- `POST /api/notifications/send`
- `POST /api/push/send`

### Search / Upload / i18n / Terms
- `GET /api/recommendations/:userId?limit=6`
- `GET /api/search/nearby`
- `GET /api/search/nearby_sql`
- `POST /api/upload`
- `GET /api/i18n/:lang`
- `GET /api/terms/:lang`
- `POST /api/cookie-consent`
- `GET /api/admin/stats` (admin)
- `GET /api/admin/stats/top-workers?limit=10` (admin)

## Pricing enforcement

Service, package, and booking prices are validated against `pricing_rules`:

1. `service_id` rule (highest priority)
2. `category_id` rule
3. Env defaults (`DEFAULT_MIN_PRICE`, `DEFAULT_MAX_PRICE`)

## Real-time booking status tracking

- Status updates are written to `booking_status_events` for an immutable timeline.
- Booking creation creates an initial `requested` status event.
- On status updates, the server:
	- appends a status event (`requested|accepted|in_progress|completed|cancelled`)
	- stores in-app notification records in `notifications`
	- sends best-effort FCM push notifications if configured

## Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only.
- Use Supabase anon key (`VITE_*`) only in client code.
- Add stricter audit logs/webhooks for production environments.

## Reviews moderation notes

- Reviews include moderation lifecycle fields (`status`, `moderation_note`, `moderated_by`, `moderated_at`).
- Default status is `approved`.
- Enforced uniqueness: one review per booking per reviewer.

## Chat real-time notes

- Chat uses `chat_conversations`, `chat_participants`, and `messages` with `read_at`.
- Message creation updates conversation `updated_at` for recent-chat ordering.
- Realtime delivery can be subscribed via Supabase Realtime on `messages` and `chat_conversations`.

## Security notes

- `helmet` is enabled for secure HTTP headers.
- Joi validation is enforced on critical write endpoints.
