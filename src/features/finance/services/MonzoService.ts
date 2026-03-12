import { createClient } from '@supabase/supabase-js'
import { notifyMonzoTransaction } from '../utils/monzo-notifications'

export interface MonzoToken {
    access_token: string
    refresh_token: string
    expires_at: number
    user_id: string
}

export class MonzoService {
    private static CLIENT_ID = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID
    private static CLIENT_SECRET = process.env.MONZO_CLIENT_SECRET
    private static REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/monzo/callback`

    private static getServerSupabase() {
        return createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
    }

    private static mapMonzoCategory(monzoCategory: string): string {
        const mapping: Record<string, string> = {
            'bills': 'bills',
            'charity': 'charity',
            'eating_out': 'eating_out',
            'entertainment': 'entertainment',
            'expenses': 'expenses',
            'family': 'family',
            'finances': 'finances',
            'general': 'general',
            'mondo': 'general',
            'gifts': 'gifts',
            'groceries': 'groceries',
            'holidays': 'holidays',
            'income': 'income',
            'personal_care': 'personal_care',
            'savings': 'savings',
            'shopping': 'shopping',
            'transfers': 'transfers',
            'p2p': 'transfers',
            'transport': 'transport',
            'cash': 'general',
            'other': 'other'
        }
        return mapping[monzoCategory.toLowerCase()] || mapping['other']
    }

    static async getAuthUrl(state: string) {
        const clientId = process.env.NEXT_PUBLIC_MONZO_CLIENT_ID
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/monzo/callback`
        // Explicitly requesting scopes can help with permission issues on some account types
        return `https://auth.monzo.com/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}&scope=read:accounts`
    }

    static async exchangeCode(code: string) {
        const response = await fetch('https://api.monzo.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: this.CLIENT_ID!,
                client_secret: this.CLIENT_SECRET!,
                redirect_uri: this.REDIRECT_URI,
                code
            })
        })

        if (!response.ok) throw new Error('Failed to exchange Monzo code')
        return response.json()
    }

    static async saveToken(userId: string, tokenData: any) {
        const expiresAt = Math.floor(Date.now() / 1000) + tokenData.expires_in
        const supabase = this.getServerSupabase()
        const { error } = await supabase
            .from('fin_secrets')
            .upsert({
                user_id: userId,
                service: 'monzo',
                secret_data: {
                    access_token: tokenData.access_token,
                    refresh_token: tokenData.refresh_token,
                    expires_at: expiresAt,
                    account_id: tokenData.account_id
                }
            }, { onConflict: 'user_id,service' })

        if (error) throw error
    }

    static async getValidToken(userId: string) {
        const supabase = this.getServerSupabase()
        const { data, error } = await supabase
            .from('fin_secrets')
            .select('secret_data')
            .eq('user_id', userId)
            .eq('service', 'monzo')
            .single()

        if (error || !data) return null

        const token = data.secret_data
        if (Date.now() / 1000 < token.expires_at - 60) {
            return token.access_token
        }

        // Refresh token if expired
        return this.refreshToken(userId, token.refresh_token)
    }


    private static async refreshToken(userId: string, refreshToken: string) {
        const response = await fetch('https://api.monzo.com/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: this.CLIENT_ID!,
                client_secret: this.CLIENT_SECRET!,
                refresh_token: refreshToken
            })
        })

        if (!response.ok) throw new Error('Failed to refresh Monzo token')
        const data = await response.json()
        await this.saveToken(userId, data)
        return data.access_token
    }

    static async syncPots(userId: string) {
        console.log(`[MonzoService] syncPots started for user ${userId}`);
        const token = await this.getValidToken(userId);
        if (!token) {
            console.error('[MonzoService] No valid token found');
            throw new Error('No Monzo connection found');
        }

        // 1. Get Accounts
        const accountsRes = await fetch('https://api.monzo.com/accounts', {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!accountsRes.ok) {
            console.error(`[MonzoService] Failed to fetch accounts: ${accountsRes.status}`);
            throw new Error(`Monzo API error: ${accountsRes.status}`);
        }
        
        const accountsData = await accountsRes.json();
        const accounts = (accountsData.accounts || []).filter((a: any) => !a.closed);
        console.log(`[MonzoService] Found ${accounts.length} active accounts`);
        
        const supabase = this.getServerSupabase();
        const syncedMonzoIds = new Set<string>();
        let syncIsPartial = false; // SAFETY: If we fail to fetch part of the data, don't cleanup!

        // 2. Process each account sequentially
        for (const account of accounts) {
            console.log(`[MonzoService] Processing: ${account.id} | Type: ${account.type} | Desc: "${account.description}"`);
            try {
                // RE-FETCH existing pots every loop to avoid stale matches between accounts
                const { data: currentPots } = await supabase.from('fin_pockets').select('*');

                const profile = account.type === 'uk_business' ? 'business' : 'personal';
                const isJoint = account.type === 'uk_retail_joint';
                const isCurrentAccount = ['uk_retail', 'uk_retail_joint', 'uk_business'].includes(account.type);
                
                // B. Fetch Pots first to calculate "Real Cash" for the main account
                const potsRes = isCurrentAccount ? await fetch(`https://api.monzo.com/pots?current_account_id=${account.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }) : null;

                let pots: any[] = [];
                if (potsRes?.ok) {
                    const potsData = await potsRes.json();
                    pots = (potsData.pots || []).filter((p: any) => !p.deleted);
                }

                const totalPotsBalance = pots.reduce((sum, p) => sum + p.balance, 0) / 100;

                // A. Sync Main Balance
                const balRes = await fetch(`https://api.monzo.com/balance?account_id=${account.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (balRes.ok) {
                    const balData = await balRes.json();
                    
                    const totalBalance = (balData.total_balance ?? balData.balance) / 100;
                    const overdraftLimit = balData.overdraft_limit_authorized ?? 0;
                    const actualAvailable = (balData.balance - overdraftLimit) / 100;

                    const isStandard = account.type === 'uk_retail' || isJoint || account.type === 'uk_business';
                    const defaultName = isStandard ? (isJoint ? 'Joint Account' : 'General') : (account.description || 'Monzo Account');
                    
                    const isSavingsAccount = account.type.toLowerCase().includes('savings') || 
                                     account.description?.toLowerCase().includes('savings');

                    const existingPrimary = currentPots?.find(p => p.monzo_id === account.id) ||
                        currentPots?.find(p => p.profile === profile && p.name.toLowerCase().includes(defaultName.toLowerCase()) && !p.monzo_id);

                    const primaryData: any = {
                        user_id: userId,
                        monzo_id: account.id,
                        name: existingPrimary?.name || defaultName,
                        balance: Math.max(0, actualAvailable),
                        current_balance: totalBalance,
                        last_synced_at: new Date().toISOString(),
                        type: isSavingsAccount ? 'savings' : 'general',
                        profile: profile,
                        sort_order: existingPrimary?.sort_order ?? (isJoint ? 1 : 0)
                    };

                    if (existingPrimary?.id) primaryData.id = existingPrimary.id;

                    console.log(`[MonzoService] Syncing Account: "${primaryData.name}" | Real Cash: £${actualAvailable} | Total: £${totalBalance}`);
                    
                    await supabase.from('fin_pockets').upsert(primaryData, existingPrimary?.id ? {} : { onConflict: 'monzo_id' });
                    syncedMonzoIds.add(account.id);
                } else {
                    console.error(`[MonzoService] Balance API Error: ${balRes.status} for ${account.id}`);
                    syncIsPartial = true;
                }

                // C. Sync the Pots we fetched earlier
                if (pots.length > 0) {
                    console.log(`[MonzoService] Account ${account.id} has ${pots.length} pots`);

                    for (const pot of pots) {
                        syncedMonzoIds.add(pot.id);

                        const existing = currentPots?.find(p => p.monzo_id === pot.id) ||
                            currentPots?.find(p => p.name.trim().toLowerCase() === pot.name.trim().toLowerCase() && p.profile === profile && !p.monzo_id);

                        const isSavingsPot = pot.type?.toLowerCase().includes('savings') ||
                                            pot.type?.toLowerCase().includes('instant_access') ||
                                            pot.type?.toLowerCase().includes('flexible') ||
                                            pot.name.toLowerCase().includes('savings') ||
                                            pot.name.toLowerCase().includes('challenge') ||
                                            pot.name.toLowerCase().includes('goal') ||
                                            !!pot.savings_account_id;

                        const pocketData: any = {
                            user_id: userId,
                            monzo_id: pot.id,
                            name: pot.name,
                            balance: pot.balance / 100,
                            current_balance: pot.balance / 100,
                            target_budget: existing?.target_budget || 0,
                            target_amount: (pot.goal_amount && pot.goal_amount > 0) 
                                ? (pot.goal_amount / 100) 
                                : (existing?.target_amount || 0),
                            last_synced_at: new Date().toISOString(),
                            type: isSavingsPot ? 'savings' : 'general',
                            profile: profile
                        };

                        if (existing?.id) pocketData.id = existing.id;

                        console.log(`[MonzoService] Syncing Pot: "${pot.name}" | £${pot.balance/100} | Type: ${pocketData.type}`);

                        await supabase.from('fin_pockets').upsert(pocketData, existing?.id ? {} : { onConflict: 'monzo_id' });
                    }
                }
            } catch (err) {
                console.error(`[MonzoService] Loop Error for account ${account.id}:`, err);
                syncIsPartial = true;
            }
        }

        // 4. Cleanup (Only if we have successfully completed the loop and NO ERRORS occurred)
        if (!syncIsPartial) {
            console.log(`[MonzoService] Proceeding to cleanup. Synced ${syncedMonzoIds.size} total entities.`);
            const { data: finalPockets } = await supabase.from('fin_pockets').select('*');
            if (!finalPockets) return;

            const potsToDelete = finalPockets.filter(p => {
                const nameLower = p.name.toLowerCase();
                if (nameLower.includes('liabilities')) return false;

                // AGGRESSIVE DEDUPLICATION:
                if (!p.monzo_id) {
                    const hasSyncedDuplicate = finalPockets.some(other => 
                        other.monzo_id && 
                        other.name === p.name && 
                        other.profile === p.profile
                    );
                    if (hasSyncedDuplicate) return true;

                    const isPrimaryPlaceholder = nameLower.includes('general') || nameLower.includes('joint account');
                    if (isPrimaryPlaceholder) {
                        const hasLinkedPrimary = finalPockets.some(other => 
                            other.monzo_id?.startsWith('acc_') && 
                            other.profile === p.profile
                        );
                        if (hasLinkedPrimary) return true;
                    }
                }

                // Standard cleanup: Deleted from Monzo but still in our DB
                if (p.monzo_id && !syncedMonzoIds.has(p.monzo_id)) return true;
                
                return false;
            });

            if (potsToDelete.length > 0) {
                console.log(`[MonzoService] Cleanup: Deleting ${potsToDelete.length} duplicate/orphaned pots. Synced Count: ${syncedMonzoIds.size}`);
                for (const pot of potsToDelete) {
                    const truePot = finalPockets.find(other => 
                        other.id !== pot.id &&
                        other.profile === pot.profile &&
                        (other.name === pot.name || (pot.name.toLowerCase().includes('general') && other.monzo_id?.startsWith('acc_'))) &&
                        !potsToDelete.find(d => d.id === other.id)
                    );

                    if (truePot) {
                        await supabase.from('fin_transactions').update({ pocket_id: truePot.id }).eq('pocket_id', pot.id);
                        await supabase.from('fin_income').update({ pocket_id: truePot.id }).eq('pocket_id', pot.id);
                        await supabase.from('fin_tasks').update({ pocket_id: truePot.id }).eq('pocket_id', pot.id);
                    }
                }
                await supabase.from('fin_pockets').delete().in('id', potsToDelete.map(p => p.id));
            }
        } else if (syncIsPartial) {
            console.warn('[MonzoService] Sync was partial due to errors. Skipping cleanup to protect data.');
        }

        // 5. Sync Transactions
        await this.syncTransactions(userId);
    }

    static async registerWebhooks(userId: string) {
        const token = await this.getValidToken(userId)
        if (!token) throw new Error('No Monzo connection found')

        const accountsRes = await fetch('https://api.monzo.com/accounts', {
            headers: { Authorization: `Bearer ${token}` }
        })
        const accountsData = await accountsRes.json()
        const accounts = accountsData.accounts || []

        const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/finance/monzo/webhook`

        for (const account of accounts) {
            if (account.closed) continue

            // 1. Delete ALL existing webhooks for this account first
            const existingRes = await fetch(`https://api.monzo.com/webhooks?account_id=${account.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const existingData = await existingRes.json()
            const existing = existingData.webhooks || []

            for (const wh of existing) {
                await fetch(`https://api.monzo.com/webhooks/${wh.id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                })
                console.log(`[MonzoService] Deleted old webhook: ${wh.id}`)
            }

            // 2. Register exactly ONE new webhook
            console.log(`[MonzoService] Registering webhook for account ${account.id}...`)
            const regRes = await fetch('https://api.monzo.com/webhooks', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    account_id: account.id,
                    url: webhookUrl
                })
            })
            const regData = await regRes.json()
            console.log(`[MonzoService] Registered webhook: ${regData.webhook?.id}`)
        }
        return { success: true }
    }

    static async syncTransactions(userId: string) {
        const token = await this.getValidToken(userId)
        if (!token) throw new Error('No Monzo connection found')

        const accountsRes = await fetch('https://api.monzo.com/accounts', {
            headers: { Authorization: `Bearer ${token}` }
        })
        const accountsData = await accountsRes.json()
        const accounts = accountsData.accounts || []

        const supabase = this.getServerSupabase()

        await Promise.all(accounts.map(async (account: any) => {
            if (account.closed) return

            console.log(`[MonzoService] Syncing transactions for account ${account.id}...`)
            const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
            const txRes = await fetch(`https://api.monzo.com/transactions?account_id=${account.id}&since=${since}&limit=100&expand[]=merchant`, {
                headers: { Authorization: `Bearer ${token}` }
            })

            if (!txRes.ok) return
            const txData = await txRes.json()
            const transactions = txData.transactions || []

            const profile: 'personal' | 'business' = account.type === 'uk_business' ? 'business' : 'personal'

            // PRE-FILTER: Avoid hundreds of redundant slow RPC calls on every sync
            const txIds = transactions.map((t: any) => t.id)

            const { data: existingTxs } = await supabase
                .from('fin_transactions')
                .select('provider_tx_id')
                .in('provider_tx_id', txIds)

            const existingIds = new Set(existingTxs?.map(t => t.provider_tx_id) || [])
            const twoDaysAgo = Date.now() - (2 * 24 * 60 * 60 * 1000)

            const txsToProcess = transactions.filter((tx: any) => {
                const isRecent = new Date(tx.created).getTime() > twoDaysAgo
                // Process if it doesn't exist yet OR if it's very recent (to catch settlements)
                return !existingIds.has(tx.id) || isRecent
            })

            console.log(`[MonzoService] Account ${account.id}: Found ${transactions.length} txs. Processing ${txsToProcess.length} (skipped ${transactions.length - txsToProcess.length} existing).`)

            for (const tx of txsToProcess) {
                if (tx.decline_reason) continue

                const amount = Math.abs(tx.amount / 100)
                const isSpend = tx.amount < 0
                const potId = tx.metadata?.pot_id
                const isTransfer = tx.category === 'p2p' || !!potId || tx.description?.startsWith('pot_')
                const targetMonzoId = potId || account.id

                // Find pocket to get name and ID
                const { data: pocket } = await supabase
                    .from('fin_pockets')
                    .select('id, name')
                    .eq('monzo_id', targetMonzoId)
                    .single()

                // Improve description for transfers/pots
                let description = tx.merchant?.name || tx.description
                if (description?.startsWith('pot_') && pocket) {
                    description = isSpend ? `Transfer to ${pocket.name}` : `Top up from ${pocket.name}`
                } else if (tx.category === 'p2p' && tx.counterparty?.name) {
                    description = tx.counterparty.name
                }

                // Determine type: transfer vs spend vs income
                let txType: 'spend' | 'income' | 'transfer'
                if (isTransfer) {
                    txType = 'transfer'
                } else if (isSpend) {
                    txType = 'spend'
                } else {
                    txType = 'income'
                }

                // Use the atomic RPC to ensure consistency with the webhook
                const { data: rpcStatus, error: rpcError } = await supabase.rpc('process_monzo_transaction', {
                    p_provider_tx_id: tx.id,
                    p_description: description,
                    p_amount: amount,
                    p_type: txType,
                    p_category: this.mapMonzoCategory(tx.category || 'other'),
                    p_pocket_id: pocket?.id,
                    p_profile: profile,
                    p_date: tx.created
                })

                if (rpcError) {
                    console.error(`[MonzoService] RPC Error syncing ${tx.id}:`, rpcError)
                    continue
                }

                if (rpcStatus === 'INSERTED') {
                    const isTransfer = tx.category === 'p2p' || !!tx.metadata?.pot_id
                    const shouldNotify = !isTransfer || isSpend

                    if (shouldNotify) {
                        await notifyMonzoTransaction({
                            amount,
                            description,
                            isSpend,
                            isTransfer,
                            pocketName: pocket?.name || 'Main Account',
                            pocketId: pocket?.id
                        })
                    }
                }

                console.log(`[MonzoService] Synced tx ${tx.id}: ${rpcStatus}`)
            }
        }))
    }
}
