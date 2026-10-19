import { PaymentLedger, PaymentTransaction } from '../server/payment-ledger.js';

export interface AuditReport {
  timestamp: string;
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  verifiedPaynowCount: number;
  suspiciousUnverifiedCount: number;
  discrepancies: Array<{
    transactionId: string;
    maskedUserId: string;
    amount: number;
    status: string;
    issue: string;
    recommendation: string;
  }>;
  summary: string;
}

export function auditAndReconcileTransactions(): AuditReport {
  const allTx = PaymentLedger.getAllTransactions();
  const discrepancies: AuditReport['discrepancies'] = [];

  let completedCount = 0;
  let pendingCount = 0;
  let failedCount = 0;
  let verifiedPaynowCount = 0;
  let suspiciousCount = 0;

  for (const tx of allTx) {
    if (tx.status === 'completed') {
      completedCount++;
      
      // Check if it has a real verified Paynow reference and audit trail
      const hasVerifiedLog = tx.auditTrail?.some(e => e.event === 'PAYMENT_VERIFIED_AND_CREDITED');
      const hasPaynowRef = Boolean(tx.paynowReference && tx.paynowReference.trim() !== '');

      if (hasVerifiedLog && hasPaynowRef) {
        verifiedPaynowCount++;
      } else {
        suspiciousCount++;
        discrepancies.push({
          transactionId: tx.id,
          maskedUserId: `${tx.userId.substring(0, 4)}***${tx.userId.slice(-2)}`,
          amount: tx.amount,
          status: tx.status,
          issue: 'Transaction marked completed without verified Paynow webhook or poll confirmation audit trail',
          recommendation: 'Reconcile against Paynow merchant portal statement before acknowledging credit.',
        });
      }
    } else if (tx.status === 'pending') {
      pendingCount++;
    } else if (tx.status === 'failed' || tx.status === 'cancelled') {
      failedCount++;
    }
  }

  const report: AuditReport = {
    timestamp: new Date().toISOString(),
    totalTransactions: allTx.length,
    completedTransactions: completedCount,
    pendingTransactions: pendingCount,
    failedTransactions: failedCount,
    verifiedPaynowCount,
    suspiciousUnverifiedCount: suspiciousCount,
    discrepancies,
    summary: suspiciousCount === 0
      ? `Audit PASSED: All ${completedCount} completed transactions have verified Paynow references and audit logs.`
      : `Audit WARNING: Found ${suspiciousCount} transactions needing manual reconciliation against Paynow merchant portal.`,
  };

  return report;
}

// If run directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = auditAndReconcileTransactions();
  console.log(JSON.stringify(report, null, 2));
}
