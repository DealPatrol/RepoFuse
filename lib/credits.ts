import { getDb } from '@/lib/db'

// Credit constants
export const CREDITS = {
  INITIAL_GRANT: 500,           // Credits given when a paid subscription trial starts
  PRO_MONTHLY_GRANT: 3000,      // Credits given to Pro on monthly renewal
  SCALE_MONTHLY_GRANT: 12000,   // Credits given to Scale on monthly renewal
  MONTHLY_GRANT: 3000,          // Legacy alias — matches Pro grant
  ANALYSIS_COST: 100,           // Credits per analysis run
  SCAFFOLD_COST: 150,           // Credits per scaffold generation
  BUILD_APP_COST: 500,          // Credits per Build This App
  PATTERN_ANALYZER_COST: 100,   // Credits per Pattern Analyzer scan
}

// Types
export interface UserCredit {
  id: string
  user_id: string
  current_balance: number
  total_granted: number
  total_used: number
  last_renewal_date: string | null
  created_at: string
  updated_at: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  amount: number
  transaction_type: 'grant' | 'analysis' | 'scaffold' | 'build_app' | 'pattern_analyzer' | 'refund' | 'renewal'
  reason: string | null
  metadata: CreditMetadata
  balance_after: number
  created_at: string
}

type CreditMetadata = Record<string, unknown>

interface CreditBalanceRow {
  current_balance: number
}

interface CreditUsageBreakdownRow {
  analyses_used: string | number | null
  scaffolds_used: string | number | null
}

interface MonthlyTokenUsageRow {
  total: string | number | null
}

function toCount(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value
  return Number.parseInt(value ?? '0', 10)
}

// Initialize or get user credits
export async function getOrCreateUserCredits(userId: string): Promise<UserCredit> {
  const sql = getDb()
  
  // Try to get existing
  const existing = await sql`
    SELECT * FROM user_credits WHERE user_id = ${userId}
  `
  
  if (existing.length > 0) {
    return existing[0] as UserCredit
  }
  
  // Create new
  const result = await sql`
    INSERT INTO user_credits (user_id, current_balance, total_granted, total_used)
    VALUES (${userId}, 0, 0, 0)
    RETURNING *
  `
  
  return result[0] as UserCredit
}

// Get current credit balance
export async function getCreditBalance(userId: string): Promise<number> {
  const sql = getDb()
  const result = await sql`
    SELECT current_balance FROM user_credits WHERE user_id = ${userId}
  `
  
  if (result.length === 0) {
    return 0
  }
  
  return (result[0] as CreditBalanceRow).current_balance
}

// Grant credits (for signup or renewal)
export async function grantCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata: CreditMetadata = {}
): Promise<CreditTransaction> {
  const sql = getDb()
  
  // Get or create user credits
  const userCredits = await getOrCreateUserCredits(userId)
  const newBalance = userCredits.current_balance + amount
  
  // Update balance
  await sql`
    UPDATE user_credits
    SET 
      current_balance = ${newBalance},
      total_granted = total_granted + ${amount},
      last_renewal_date = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `
  
  // Record transaction
  const transaction = await sql`
    INSERT INTO credit_transactions (
      user_id, amount, transaction_type, reason, metadata, balance_after
    )
    VALUES (
      ${userId}, ${amount}, 'grant', ${reason}, ${JSON.stringify(metadata)}::jsonb, ${newBalance}
    )
    RETURNING *
  `
  
  return transaction[0] as CreditTransaction
}

// Renew monthly credits without stacking unused balance above the plan allowance.
export async function renewMonthlyCredits(
  userId: string,
  monthlyAllowance: number,
  reason: string,
  metadata: CreditMetadata = {}
): Promise<CreditTransaction | null> {
  const sql = getDb()
  const userCredits = await getOrCreateUserCredits(userId)
  const topUpAmount = Math.max(0, monthlyAllowance - userCredits.current_balance)

  if (topUpAmount === 0) {
    await sql`
      UPDATE user_credits
      SET last_renewal_date = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
    `
    return null
  }

  const newBalance = userCredits.current_balance + topUpAmount

  await sql`
    UPDATE user_credits
    SET
      current_balance = ${newBalance},
      total_granted = total_granted + ${topUpAmount},
      last_renewal_date = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
  `

  const transaction = await sql`
    INSERT INTO credit_transactions (
      user_id, amount, transaction_type, reason, metadata, balance_after
    )
    VALUES (
      ${userId}, ${topUpAmount}, 'renewal', ${reason}, ${JSON.stringify(metadata)}::jsonb, ${newBalance}
    )
    RETURNING *
  `

  return transaction[0] as CreditTransaction
}

// Deduct credits (for analysis, scaffold, build_app, or pattern_analyzer)
export async function deductCredits(
  userId: string,
  amount: number,
  type: 'analysis' | 'scaffold' | 'build_app' | 'pattern_analyzer',
  metadata: CreditMetadata = {}
): Promise<{ success: boolean; transaction?: CreditTransaction; error?: string }> {
  const sql = getDb()

  await getOrCreateUserCredits(userId)

  const transaction = await sql`
    WITH updated AS (
      UPDATE user_credits
      SET
        current_balance = current_balance - ${amount},
        total_used = total_used + ${amount}
      WHERE user_id = ${userId}
        AND current_balance >= ${amount}
      RETURNING current_balance
    )
    INSERT INTO credit_transactions (
      user_id, amount, transaction_type, reason, metadata, balance_after
    )
    SELECT
      ${userId}, ${-amount}, ${type}, ${`${type} deduction`}, ${JSON.stringify(metadata)}::jsonb, current_balance
    FROM updated
    RETURNING *
  `

  if (transaction.length === 0) {
    const currentBalance = await getCreditBalance(userId)
    return {
      success: false,
      error: `Insufficient credits. Required: ${amount}, Available: ${currentBalance}`,
    }
  }

  return {
    success: true,
    transaction: transaction[0] as CreditTransaction,
  }
}

// Refund credits
export async function refundCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata: CreditMetadata = {}
): Promise<CreditTransaction> {
  const sql = getDb()

  await getOrCreateUserCredits(userId)

  const transaction = await sql`
    WITH updated AS (
      UPDATE user_credits
      SET current_balance = current_balance + ${amount}
      WHERE user_id = ${userId}
      RETURNING current_balance
    )
    INSERT INTO credit_transactions (
      user_id, amount, transaction_type, reason, metadata, balance_after
    )
    SELECT
      ${userId}, ${amount}, 'refund', ${reason}, ${JSON.stringify(metadata)}::jsonb, current_balance
    FROM updated
    RETURNING *
  `

  return transaction[0] as CreditTransaction
}

// Get credit transaction history
export async function getCreditTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<CreditTransaction[]> {
  const sql = getDb()
  const transactions = await sql`
    SELECT * FROM credit_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `
  
  return transactions as CreditTransaction[]
}

// Get credit usage summary
export async function getCreditUsageSummary(userId: string): Promise<{
  total_granted: number
  total_used: number
  current_balance: number
  analyses_used: number
  scaffolds_used: number
}> {
  const sql = getDb()
  
  const credits = await getOrCreateUserCredits(userId)
  
  // Calculate usage breakdown
  const usageBreakdown = await sql`
    SELECT 
      SUM(CASE WHEN transaction_type = 'analysis' THEN 1 ELSE 0 END) as analyses_used,
      SUM(CASE WHEN transaction_type = 'scaffold' THEN 1 ELSE 0 END) as scaffolds_used
    FROM credit_transactions
    WHERE user_id = ${userId} AND amount < 0
  `
  
  const breakdown = usageBreakdown[0] as CreditUsageBreakdownRow | undefined
  
  return {
    total_granted: credits.total_granted,
    total_used: credits.total_used,
    current_balance: credits.current_balance,
    analyses_used: toCount(breakdown?.analyses_used),
    scaffolds_used: toCount(breakdown?.scaffolds_used),
  }
}

// Token tracking - store token usage per analysis
export interface TokenUsageRecord {
  id: string
  user_id: string
  analysis_id: string
  tokens_used: number
  estimated_cost: number
  model_used: string
  created_at: string
}

export async function trackTokenUsage(
  userId: string,
  analysisId: string,
  tokensUsed: number,
  estimatedCost: number,
  modelUsed: string
): Promise<void> {
  const sql = getDb()
  
  try {
    // Create token_usage table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS token_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        analysis_id UUID NOT NULL,
        tokens_used INT,
        estimated_cost DECIMAL(10, 4),
        model_used VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      )
    `
  } catch {
    // Table might already exist
  }
  
  try {
    await sql`
      INSERT INTO token_usage (user_id, analysis_id, tokens_used, estimated_cost, model_used)
      VALUES (${userId}, ${analysisId}, ${tokensUsed}, ${estimatedCost}, ${modelUsed})
    `
  } catch (error) {
    console.error('Error tracking token usage:', error)
  }
}

export async function getMonthlyTokenUsage(userId: string): Promise<number> {
  const sql = getDb()
  
  try {
    const result = await sql`
      SELECT SUM(tokens_used) as total FROM token_usage
      WHERE user_id = ${userId}
      AND created_at > NOW() - INTERVAL '30 days'
    `
    
    return toCount((result[0] as MonthlyTokenUsageRow | undefined)?.total)
  } catch (error) {
    console.error('Error getting monthly token usage:', error)
    return 0
  }
}
