import fs from 'fs';
import path from 'path';

export interface PaymentTransaction {
  id: string; // Unique internal reference, e.g. PN-TXN-1729340000000-A1B2C3
  userId: string;
  userEmail: string;
  amount: number;
  currency: 'USD';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  method: 'paynow';
  pollUrl: string;
  redirectUrl: string;
  paynowReference?: string;
  credited: boolean;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  auditTrail: Array<{
    event: string;
    timestamp: string;
    details?: any;
  }>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const LEDGER_FILE = path.resolve(DATA_DIR, 'paynow-transactions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache + persistent disk backup
let transactionsMap: Map<string, PaymentTransaction> = new Map();

function loadLedger(): void {
  try {
    if (fs.existsSync(LEDGER_FILE)) {
      const raw = fs.readFileSync(LEDGER_FILE, 'utf-8');
      const list: PaymentTransaction[] = JSON.parse(raw);
      transactionsMap.clear();
      for (const tx of list) {
        transactionsMap.set(tx.id, tx);
      }
    } else {
      saveLedger();
    }
  } catch (err: any) {
    console.error('[PaymentLedger] Failed to load ledger file:', err.message);
  }
}

function saveLedger(): void {
  try {
    const list = Array.from(transactionsMap.values());
    fs.writeFileSync(LEDGER_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('[PaymentLedger] Failed to write ledger file:', err.message);
  }
}

// Initialize on startup
loadLedger();

export class PaymentLedger {
  /**
   * Generates a collision-resistant internal transaction ID
   */
  static generateTransactionId(): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PN-TXN-${ts}-${rand}`;
  }

  /**
   * Creates and persists a new transaction in pending state
   */
  static createTransaction(params: {
    id: string;
    userId: string;
    userEmail: string;
    amount: number;
    currency?: 'USD';
    pollUrl: string;
    redirectUrl: string;
  }): PaymentTransaction {
    const now = new Date().toISOString();
    const tx: PaymentTransaction = {
      id: params.id,
      userId: params.userId,
      userEmail: params.userEmail,
      amount: Number(params.amount.toFixed(2)),
      currency: params.currency || 'USD',
      status: 'pending',
      method: 'paynow',
      pollUrl: params.pollUrl,
      redirectUrl: params.redirectUrl,
      credited: false,
      createdAt: now,
      updatedAt: now,
      auditTrail: [
        {
          event: 'PAYMENT_INITIATED',
          timestamp: now,
          details: {
            amount: params.amount,
            pollUrl: params.pollUrl,
            redirectUrl: params.redirectUrl,
          },
        },
      ],
    };

    transactionsMap.set(tx.id, tx);
    saveLedger();
    return { ...tx };
  }

  /**
   * Retrieves a transaction by its internal ID
   */
  static getTransaction(id: string): PaymentTransaction | null {
    const tx = transactionsMap.get(id);
    return tx ? { ...tx } : null;
  }

  /**
   * Retrieves all transactions for a specific user
   */
  static getUserTransactions(userId: string): PaymentTransaction[] {
    const list: PaymentTransaction[] = [];
    for (const tx of transactionsMap.values()) {
      if (tx.userId === userId) {
        list.push({ ...tx });
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves all transactions in the ledger
   */
  static getAllTransactions(): PaymentTransaction[] {
    return Array.from(transactionsMap.values()).map(tx => ({ ...tx }));
  }

  /**
   * Atomically marks a transaction as completed/paid after successful Paynow verification.
   * Ensures idempotency: duplicate callbacks or repeated polling will NEVER double-credit.
   */
  static markPaid(params: {
    id: string;
    paynowReference: string;
    verifiedAmount: number;
    source: 'paynow_webhook' | 'paynow_poll';
  }): { success: boolean; alreadyCredited: boolean; transaction: PaymentTransaction | null; error?: string } {
    const tx = transactionsMap.get(params.id);
    if (!tx) {
      return { success: false, alreadyCredited: false, transaction: null, error: 'Transaction not found' };
    }

    // Verify amount matches expected value exactly
    const diff = Math.abs(tx.amount - params.verifiedAmount);
    if (diff > 0.001) {
      const now = new Date().toISOString();
      tx.auditTrail.push({
        event: 'AMOUNT_MISMATCH_REJECTED',
        timestamp: now,
        details: {
          expected: tx.amount,
          received: params.verifiedAmount,
          paynowReference: params.paynowReference,
        },
      });
      saveLedger();
      return {
        success: false,
        alreadyCredited: false,
        transaction: { ...tx },
        error: `Amount mismatch: expected $${tx.amount.toFixed(2)}, received $${params.verifiedAmount.toFixed(2)}`,
      };
    }

    // Idempotency check: Already credited
    if (tx.credited && tx.status === 'completed') {
      const now = new Date().toISOString();
      tx.auditTrail.push({
        event: 'DUPLICATE_CONFIRMATION_IGNORED',
        timestamp: now,
        details: {
          source: params.source,
          paynowReference: params.paynowReference,
        },
      });
      saveLedger();
      return { success: true, alreadyCredited: true, transaction: { ...tx } };
    }

    // Mark paid atomically
    const now = new Date().toISOString();
    tx.status = 'completed';
    tx.credited = true;
    tx.paynowReference = params.paynowReference;
    tx.paidAt = now;
    tx.updatedAt = now;
    tx.auditTrail.push({
      event: 'PAYMENT_VERIFIED_AND_CREDITED',
      timestamp: now,
      details: {
        source: params.source,
        paynowReference: params.paynowReference,
        amount: params.verifiedAmount,
      },
    });

    saveLedger();
    return { success: true, alreadyCredited: false, transaction: { ...tx } };
  }

  /**
   * Marks a transaction as failed or cancelled
   */
  static markFailed(id: string, reason: string, source: string): { success: boolean; transaction: PaymentTransaction | null } {
    const tx = transactionsMap.get(id);
    if (!tx) {
      return { success: false, transaction: null };
    }

    // Do not fail an already completed and verified transaction
    if (tx.status === 'completed') {
      return { success: false, transaction: { ...tx } };
    }

    const now = new Date().toISOString();
    tx.status = 'failed';
    tx.updatedAt = now;
    tx.auditTrail.push({
      event: 'PAYMENT_FAILED_OR_CANCELLED',
      timestamp: now,
      details: { reason, source },
    });

    saveLedger();
    return { success: true, transaction: { ...tx } };
  }

  /**
   * Resets ledger (used strictly in test environments)
   */
  static _resetForTests(): void {
    transactionsMap.clear();
    saveLedger();
  }
}
