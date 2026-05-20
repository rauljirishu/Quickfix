import test from 'node:test'
import assert from 'node:assert/strict'
import { requireRole, requireAnyRole, requireAdminOrOwner } from './middleware.mjs'

function createRes() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.payload = data
      return this
    },
  }
}

test('requireRole allows matching role', async () => {
  const mw = requireRole('admin')
  const req = { profile: { role: 'admin' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})

test('requireRole blocks non-matching role', async () => {
  const mw = requireRole('admin')
  const req = { profile: { role: 'worker' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

test('requireAnyRole allows one of many', async () => {
  const mw = requireAnyRole(['admin', 'worker'])
  const req = { profile: { role: 'worker' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})

test('requireAdminOrOwner allows owner for service', async () => {
  const fakeClient = {
    from() {
      return {
        select() { return this },
        eq() { return this },
        async single() { return { data: { vendor_id: 'u1' } } },
      }
    },
  }
  const mw = requireAdminOrOwner('service', 'id', fakeClient)
  const req = { params: { id: 's1' }, user: { id: 'u1' }, profile: { role: 'worker' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})

test('requireAdminOrOwner blocks non-owner for service', async () => {
  const fakeClient = {
    from() {
      return {
        select() { return this },
        eq() { return this },
        async single() { return { data: { vendor_id: 'u1' } } },
      }
    },
  }
  const mw = requireAdminOrOwner('service', 'id', fakeClient)
  const req = { params: { id: 's1' }, user: { id: 'u2' }, profile: { role: 'worker' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, false)
  assert.equal(res.statusCode, 403)
})

test('requireAdminOrOwner allows admin bypass', async () => {
  const fakeClient = {
    from() {
      throw new Error('Should not query DB for admin bypass')
    },
  }
  const mw = requireAdminOrOwner('service', 'id', fakeClient)
  const req = { params: { id: 's1' }, user: { id: 'u2' }, profile: { role: 'admin' } }
  const res = createRes()
  let nextCalled = false
  await mw(req, res, () => { nextCalled = true })
  assert.equal(nextCalled, true)
})
