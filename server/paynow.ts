import { Paynow } from 'paynow';
import crypto from 'crypto';
import { PaymentLedger, PaymentTransaction } from './payment-ledger.js';

export interface PaynowConfig {
  integrationId: string;
  integrationKey: string;
  resultUrl: string;
  returnUrl: string;
  isProduction: boolean;
}

export class PaynowService {
  private static instance: PaynowService;
  private paynowClient: any = null;
  private config: PaynowConfig;

  private constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // In production, these must be supplied via environment variables
    const integrationId = process.env.PAYNOW_INTEGRATION_ID || '';
    const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || '';
    
    // URLs where Paynow sends updates and redirects users
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resultUrl = process.env.PAYNOW_RESULT_URL || `${appUrl}/api/payments/paynow/webhook`;
    const returnUrl = process.env.PAYNOW_RETURN_URL || `${appUrl}/wallet?paynow=return`;

    this.config = {
      integrationId,
      integrationKey,
      resultUrl,
      returnUrl,
      isProduction,
    };

    if (integrationId && integrationKey) {
      this.paynowClient = new Paynow(integrationId, integrationKey, resultUrl, returnUrl);
    }
  }

  public static getInstance(): PaynowService {
    if (!PaynowService.instance) {
      PaynowService.instance = new PaynowService();
    }
    return PaynowService.instance;
  }

  public getConfig(): Omit<PaynowConfig, 'integrationKey'> {
    return {
      integrationId: this.config.integrationId ? `${this.config.integrationId.substring(0, 3)}***` : '',
      resultUrl: this.config.resultUrl,
      returnUrl: this.config.returnUrl,
      isProduction: this.config.isProduction,
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.integrationId && this.config.integrationKey);
  }

  public getClient(): any {
    if (!this.paynowClient && this.config.integrationId && this.config.integrationKey) {
      this.paynowClient = new Paynow(
        this.config.integrationId,
        this.config.integrationKey,
        this.config.resultUrl,
        this.config.returnUrl
      );
    }
    return this.paynowClient;
  }

  /**
   * Generates official Paynow SHA512 hash according to Paynow Zimbabwe specification:
   * Concatenate values of all fields (excluding 'hash'), append integrationKey (lowercase),
   * and take SHA512 in uppercase hexadecimal.
   */
  public generateHash(values: Record<string, any>, customKey?: string): string {
    const key = (customKey || this.config.integrationKey || '').toLowerCase();
    let concatenated = '';
    
    // Concatenate non-hash keys in order
    for (const k of Object.keys(values)) {
      if (k.toLowerCase() !== 'hash') {
        concatenated += String(values[k]);
      }
    }
    concatenated += key;
    return crypto.createHash('sha512').update(concatenated, 'utf-8').digest('hex').toUpperCase();
  }

  /**
   * Verifies Paynow callback hash authenticity
   */
  public verifyWebhookHash(payload: Record<string, any>): boolean {
    if (!payload || !payload.hash) {
      return false;
    }

    const expectedHash = this.generateHash(payload);
    const receivedHash = String(payload.hash).toUpperCase();

    // Constant-time comparison to prevent timing attacks
    if (expectedHash.length !== receivedHash.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(receivedHash));
  }

  /**
   * Initiates payment via Paynow API
   */
  public async initiatePayment(params: {
    userId: string;
    userEmail: string;
    amount: number;
  }): Promise<{
    success: boolean;
    reference?: string;
    redirectUrl?: string;
    pollUrl?: string;
    error?: string;
  }> {
    const { userId, userEmail, amount } = params;

    // Validate amount
    if (!amount || typeof amount !== 'number' || isNaN(amount) || amount < 1) {
      return { success: false, error: 'Deposit amount must be at least $1.00 USD' };
    }

    if (!userEmail || !userEmail.includes('@')) {
      return { success: false, error: 'Valid user email is required for Paynow transactions' };
    }

    // In production, credentials are strictly required
    const client = this.getClient();
    if (!this.isConfigured() || !client) {
      if (this.config.isProduction) {
        return {
          success: false,
          error: 'Paynow integration credentials (PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY) are not configured on this server.',
        };
      } else {
        // Development / testing fallback with clear disclaimer
        const reference = PaymentLedger.generateTransactionId();
        const pollUrl = `${this.config.resultUrl}/mock-poll?ref=${reference}`;
        const redirectUrl = `https://www.paynow.co.zw/Payment/BillPaymentLink/?guid=${reference}`;
        
        PaymentLedger.createTransaction({
          id: reference,
          userId,
          userEmail,
          amount,
          pollUrl,
          redirectUrl,
        });

        return {
          success: true,
          reference,
          redirectUrl,
          pollUrl,
        };
      }
    }

    try {
      const reference = PaymentLedger.generateTransactionId();
      const payment = client.createPayment(reference, userEmail);
      payment.add('STYN Wallet Deposit', amount);

      const response = await client.send(payment);

      if (response && response.success) {
        PaymentLedger.createTransaction({
          id: reference,
          userId,
          userEmail,
          amount,
          pollUrl: response.pollUrl,
          redirectUrl: response.redirectUrl,
        });

        return {
          success: true,
          reference,
          redirectUrl: response.redirectUrl,
          pollUrl: response.pollUrl,
        };
      } else {
        return {
          success: false,
          error: response?.error || 'Paynow payment initiation failed',
        };
      }
    } catch (err: any) {
      console.error('[PaynowService] API Exception during initiate:', err.message);
      return {
        success: false,
        error: `Paynow API error: ${err.message}`,
      };
    }
  }

  /**
   * Processes Paynow Webhook / status update POST
   */
  public async handleWebhook(payload: Record<string, any>): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    transaction?: PaymentTransaction | null;
  }> {
    // 1. Authenticate Hash
    if (!this.verifyWebhookHash(payload)) {
      console.warn('[PaynowService] SECURITY ALERT: Webhook rejected due to invalid hash:', payload);
      return {
        success: false,
        statusCode: 400,
        message: 'Invalid signature hash',
      };
    }

    const reference = payload.reference;
    const paynowReference = payload.paynowreference;
    const amount = parseFloat(payload.amount);
    const status = String(payload.status || '').trim();

    if (!reference) {
      return { success: false, statusCode: 400, message: 'Missing transaction reference' };
    }

    // 2. Lookup existing transaction
    const existing = PaymentLedger.getTransaction(reference);
    if (!existing) {
      console.warn(`[PaynowService] Webhook received for unknown transaction: ${reference}`);
      return { success: false, statusCode: 404, message: 'Transaction not found in ledger' };
    }

    // 3. Status handling
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'paid' || normalizedStatus === 'awaiting delivery') {
      const result = PaymentLedger.markPaid({
        id: reference,
        paynowReference: paynowReference || 'PAYNOW-REF',
        verifiedAmount: amount,
        source: 'paynow_webhook',
      });

      if (!result.success) {
        return {
          success: false,
          statusCode: 400,
          message: result.error || 'Payment verification failed',
          transaction: result.transaction,
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: result.alreadyCredited ? 'Duplicate callback acknowledged' : 'Payment confirmed and credited',
        transaction: result.transaction,
      };
    } else if (normalizedStatus === 'failed' || normalizedStatus === 'cancelled') {
      const result = PaymentLedger.markFailed(reference, `Paynow reported status: ${status}`, 'paynow_webhook');
      return {
        success: true,
        statusCode: 200,
        message: 'Transaction marked failed/cancelled',
        transaction: result.transaction,
      };
    } else {
      // Pending or created
      return {
        success: true,
        statusCode: 200,
        message: `Status update noted: ${status} (remains pending)`,
        transaction: existing,
      };
    }
  }

  /**
   * Polls Paynow for transaction status
   */
  public async pollStatus(reference: string, userId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    credited: boolean;
    amount?: number;
    paynowReference?: string;
    transaction?: PaymentTransaction;
    error?: string;
  }> {
    const tx = PaymentLedger.getTransaction(reference);
    if (!tx) {
      return { status: 'failed', credited: false, error: 'Transaction not found' };
    }

    // Authorization check: User must own the transaction
    if (tx.userId !== userId) {
      return { status: 'failed', credited: false, error: 'Unauthorized access to transaction' };
    }

    // If already finalized, return current status immediately (idempotent)
    if (tx.status === 'completed') {
      return {
        status: 'completed',
        credited: true,
        amount: tx.amount,
        paynowReference: tx.paynowReference,
        transaction: tx,
      };
    }

    if (tx.status === 'failed' || tx.status === 'cancelled') {
      return {
        status: tx.status,
        credited: false,
        transaction: tx,
      };
    }

    // If client is unconfigured or mock URL, leave pending unless verified by test harness
    const client = this.getClient();
    if (!client || !tx.pollUrl || tx.pollUrl.includes('mock-poll')) {
      return {
        status: 'pending',
        credited: false,
        amount: tx.amount,
        transaction: tx,
      };
    }

    // Query Paynow's polling endpoint
    try {
      const response = await client.pollTransaction(tx.pollUrl);
      
      const pollStatus = String(response?.status || '').toLowerCase();

      if (pollStatus === 'paid' || pollStatus === 'awaiting delivery') {
        const verifiedAmount = parseFloat(response.amount || String(tx.amount));
        const markResult = PaymentLedger.markPaid({
          id: reference,
          paynowReference: response.paynowReference || 'POLL-VERIFIED',
          verifiedAmount: verifiedAmount,
          source: 'paynow_poll',
        });

        if (markResult.success && markResult.transaction) {
          return {
            status: 'completed',
            credited: true,
            amount: markResult.transaction.amount,
            paynowReference: markResult.transaction.paynowReference,
            transaction: markResult.transaction,
          };
        } else {
          return {
            status: 'pending',
            credited: false,
            error: markResult.error || 'Amount verification failed',
            transaction: tx,
          };
        }
      } else if (pollStatus === 'failed' || pollStatus === 'cancelled') {
        const failResult = PaymentLedger.markFailed(reference, `Paynow poll status: ${pollStatus}`, 'paynow_poll');
        return {
          status: 'failed',
          credited: false,
          transaction: failResult.transaction || tx,
        };
      } else {
        // Still pending (e.g. Sent, Created)
        return {
          status: 'pending',
          credited: false,
          amount: tx.amount,
          transaction: tx,
        };
      }
    } catch (err: any) {
      console.warn(`[PaynowService] Paynow poll error for ${reference}: ${err.message}`);
      // Paynow error or timeout leaves transaction pending, NEVER marks as paid!
      return {
        status: 'pending',
        credited: false,
        amount: tx.amount,
        error: `Paynow check temporarily unavailable: ${err.message}`,
        transaction: tx,
      };
    }
  }

  /**
   * Generates a tamper-proof cryptographic receipt for verified credits
   */
  public generateReceipt(tx: PaymentTransaction): string {
    const data = `${tx.id}:${tx.userId}:${tx.amount.toFixed(2)}:${tx.paynowReference || 'PN'}:${tx.paidAt || tx.updatedAt}`;
    const secret = this.config.integrationKey || 'STYN_INTERNAL_HMAC_SECRET';
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verifies a cryptographic receipt
   */
  public verifyReceipt(tx: PaymentTransaction, receipt: string): boolean {
    const expected = this.generateReceipt(tx);
    if (expected.length !== receipt.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receipt));
  }
}
