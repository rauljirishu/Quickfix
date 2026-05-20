import supabaseAdmin from './admin.mjs'

export async function getOrCreateWallet(profileId) {
  const { data: wallet, error } = await supabaseAdmin.from('wallets').select('*').eq('profile_id', profileId).single()
  if (!error && wallet) return wallet

  const { data: created, error: createErr } = await supabaseAdmin
    .from('wallets')
    .insert({ profile_id: profileId, balance: 0 })
    .select('*')
    .single()
  if (createErr) throw createErr
  return created
}

export async function applyWalletTransaction(profileId, { type, amount, metadata = {} }) {
  const wallet = await getOrCreateWallet(profileId)
  const current = Number(wallet.balance || 0)
  const delta = type === 'debit' ? -Number(amount) : Number(amount)
  const nextBalance = current + delta

  if (nextBalance < 0) {
    throw new Error('Insufficient wallet balance')
  }

  const { error: walletErr } = await supabaseAdmin
    .from('wallets')
    .update({ balance: nextBalance, updated_at: new Date().toISOString() })
    .eq('id', wallet.id)
  if (walletErr) throw walletErr

  const { data: tx, error: txErr } = await supabaseAdmin
    .from('transactions')
    .insert({
      wallet_id: wallet.id,
      amount: Number(amount),
      type,
      metadata,
    })
    .select('*')
    .single()
  if (txErr) throw txErr

  return { walletId: wallet.id, balance: nextBalance, transaction: tx }
}

export default { getOrCreateWallet, applyWalletTransaction }
