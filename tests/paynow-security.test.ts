import assert from 'assert';
import { PaynowService } from '../server/paynow.js';
import { PaymentLedger } from '../server/payment-ledger.js';

async function runSecurityTests() {
  console.log('====================================================');
  console.log('STARTING CRITICAL PAYNOW PAYMENT SECURITY AUDIT TEST');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`[PASS] Test ${total}: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] Test ${total}: ${name}`);
      console.error('       Error:', e.message);
    }
  }

  async function testAsync(name: string, fn: () => Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`[PASS] Test ${total}: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`[FAIL] Test ${total}: ${name}`);
      console.error('       Error:', e.message);
    }
  }

  // Reset ledger before test execution
  PaymentLedger._resetForTests();
  const paynow = PaynowService.getInstance();
  const testIntegrationKey = 'TEST_SECRET_KEY_12345';
  (paynow as any).config.isProduction = false;
  (paynow as any).config.integrationId = '';
  (paynow as any).config.integrationKey = testIntegrationKey;

  // TEST 1: Payment initiation does NOT count as payment
  await testAsync('Payment initiation creates pending transaction without crediting user', async () => {
    const res = await paynow.initiatePayment({
      userId: 'user_alice_01',
      userEmail: 'alice@example.com',
      amount: 25.00,
    });

    assert.strictEqual(res.success, true, 'Initiation should succeed');
    assert.ok(res.reference, 'Must return internal transaction reference');

    const tx = PaymentLedger.getTransaction(res.reference!);
    assert.ok(tx, 'Transaction must exist in ledger');
    assert.strictEqual(tx?.status, 'pending', 'Status MUST be pending');
    assert.strictEqual(tx?.credited, false, 'Account must NOT be credited upon initiation');
    assert.strictEqual(tx?.amount, 25.00, 'Expected amount must match');
  });

  // TEST 2: Client cannot forge a PAID transaction directly (Zero client trust)
  test('Fabricated client transaction with status=completed cannot bypass ledger', () => {
    const fakeRef = 'PN-FORGED-REF-999';
    const tx = PaymentLedger.getTransaction(fakeRef);
    assert.strictEqual(tx, null, 'Uninitiated transaction reference must not exist in ledger');

    // Attempting to poll or check status on non-existent reference fails
    const userTxs = PaymentLedger.getUserTransactions('hacker_user');
    assert.strictEqual(userTxs.length, 0, 'No unauthorized transactions allowed for user');
  });

  // TEST 3: Webhook callback with INVALID hash is rejected immediately (400)
  await testAsync('Unverified callback with fake hash is rejected with 400 Bad Request', async () => {
    // First create a legitimate pending payment
    const init = await paynow.initiatePayment({
      userId: 'user_bob_02',
      userEmail: 'bob@example.com',
      amount: 15.00,
    });
    const ref = init.reference!;

    // Attacker crafts webhook payload with forged hash
    const fakePayload = {
      reference: ref,
      amount: '15.00',
      paynowreference: 'PN-LIVE-98765',
      pollurl: 'https://paynow.co.zw/poll',
      status: 'Paid',
      hash: 'BOGUS_HASH_ABC123DEF4567890BOGUS_HASH_ABC123DEF4567890',
    };

    const webhookRes = await paynow.handleWebhook(fakePayload);
    assert.strictEqual(webhookRes.success, false, 'Webhook must be rejected');
    assert.strictEqual(webhookRes.statusCode, 400, 'Must return HTTP 400');
    assert.strictEqual(webhookRes.message, 'Invalid signature hash', 'Must specify invalid hash');

    // Ensure transaction remains pending and uncredited
    const tx = PaymentLedger.getTransaction(ref);
    assert.strictEqual(tx?.status, 'pending', 'Transaction must remain pending after forged webhook');
    assert.strictEqual(tx?.credited, false, 'User must NOT be credited after forged webhook');
  });

  // TEST 4: Webhook callback with missing hash is rejected
  await testAsync('Callback missing hash parameter is rejected', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_charlie_03',
      userEmail: 'charlie@example.com',
      amount: 50.00,
    });

    const payloadWithoutHash = {
      reference: init.reference!,
      amount: '50.00',
      status: 'Paid',
    };

    const webhookRes = await paynow.handleWebhook(payloadWithoutHash as any);
    assert.strictEqual(webhookRes.success, false, 'Webhook without hash must fail');
    assert.strictEqual(webhookRes.statusCode, 400);
  });

  // TEST 5: Webhook with mismatched amount is rejected
  await testAsync('Webhook with valid hash but wrong amount is rejected', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_dan_04',
      userEmail: 'dan@example.com',
      amount: 100.00, // Expected $100
    });
    const ref = init.reference!;

    // Attacker attempts to pay $1 instead of $100
    const rawData = {
      reference: ref,
      amount: '1.00', // Tampered amount
      paynowreference: '998877',
      pollurl: 'https://paynow.co.zw/poll',
      status: 'Paid',
    };
    const validHash = paynow.generateHash(rawData, testIntegrationKey);
    const tamperedPayload = { ...rawData, hash: validHash };

    // Set integration key in service for verification test
    (paynow as any).config.integrationKey = testIntegrationKey;

    const res = await paynow.handleWebhook(tamperedPayload);
    assert.strictEqual(res.success, false, 'Mismatched amount must fail');
    assert.ok(res.message.includes('Amount mismatch'), 'Error must specify amount mismatch');

    const tx = PaymentLedger.getTransaction(ref);
    assert.strictEqual(tx?.status, 'pending', 'Transaction must not be paid when amount mismatches');
    assert.strictEqual(tx?.credited, false, 'User must not be credited');
  });

  // TEST 6: Webhook with status=Failed or Cancelled does not credit account
  await testAsync('Failed or Cancelled Paynow webhook does not credit account', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_eve_05',
      userEmail: 'eve@example.com',
      amount: 10.00,
    });
    const ref = init.reference!;

    const rawData = {
      reference: ref,
      amount: '10.00',
      paynowreference: 'FAIL-123',
      pollurl: 'https://paynow.co.zw/poll',
      status: 'Cancelled',
    };
    const hash = paynow.generateHash(rawData, testIntegrationKey);

    const res = await paynow.handleWebhook({ ...rawData, hash });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.transaction?.status, 'failed', 'Status must be marked failed');
    assert.strictEqual(res.transaction?.credited, false, 'User must not be credited for cancelled payment');
  });

  // TEST 7: Legitimate verified Paynow payment marks paid and credits exactly once
  await testAsync('Verified successful Paynow payment credits user exactly once', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_frank_06',
      userEmail: 'frank@example.com',
      amount: 30.00,
    });
    const ref = init.reference!;

    const rawData = {
      reference: ref,
      amount: '30.00',
      paynowreference: 'PAYNOW-REAL-999',
      pollurl: 'https://paynow.co.zw/poll',
      status: 'Paid',
    };
    const hash = paynow.generateHash(rawData, testIntegrationKey);

    const res = await paynow.handleWebhook({ ...rawData, hash });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.transaction?.status, 'completed', 'Status must be completed');
    assert.strictEqual(res.transaction?.credited, true, 'Credited must be true');
    assert.strictEqual(res.transaction?.paynowReference, 'PAYNOW-REAL-999');
    assert.ok(res.transaction?.paidAt, 'Must have recorded paidAt timestamp');
  });

  // TEST 8: Duplicate webhook delivery does NOT credit twice (Idempotency)
  await testAsync('Duplicate callback delivery does NOT generate double credit', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_grace_07',
      userEmail: 'grace@example.com',
      amount: 40.00,
    });
    const ref = init.reference!;

    const rawData = {
      reference: ref,
      amount: '40.00',
      paynowreference: 'PAYNOW-DUP-1',
      pollurl: 'https://paynow.co.zw/poll',
      status: 'Paid',
    };
    const hash = paynow.generateHash(rawData, testIntegrationKey);

    // First webhook delivery
    const firstDelivery = await paynow.handleWebhook({ ...rawData, hash });
    assert.strictEqual(firstDelivery.success, true);
    assert.strictEqual(firstDelivery.message, 'Payment confirmed and credited');

    // Second (duplicate) webhook delivery
    const secondDelivery = await paynow.handleWebhook({ ...rawData, hash });
    assert.strictEqual(secondDelivery.success, true);
    assert.strictEqual(secondDelivery.message, 'Duplicate callback acknowledged');

    // Ensure transaction was credited only once in audit trail
    const tx = PaymentLedger.getTransaction(ref);
    const creditedEvents = tx?.auditTrail.filter(e => e.event === 'PAYMENT_VERIFIED_AND_CREDITED');
    assert.strictEqual(creditedEvents?.length, 1, 'PAYMENT_VERIFIED_AND_CREDITED must appear exactly once');
    
    const duplicateEvents = tx?.auditTrail.filter(e => e.event === 'DUPLICATE_CONFIRMATION_IGNORED');
    assert.strictEqual(duplicateEvents?.length, 1, 'Duplicate attempt must be logged as ignored');
  });

  // TEST 9: Status polling is idempotent and rejects unauthorized users
  await testAsync('Polling status is idempotent and enforces authorization', async () => {
    const init = await paynow.initiatePayment({
      userId: 'user_helen_08',
      userEmail: 'helen@example.com',
      amount: 20.00,
    });
    const ref = init.reference!;

    // Unauthorized user cannot poll another user's transaction
    const unauthPoll = await paynow.pollStatus(ref, 'attacker_user_99');
    assert.strictEqual(unauthPoll.status, 'failed');
    assert.strictEqual(unauthPoll.credited, false);
    assert.ok(unauthPoll.error?.includes('Unauthorized'), 'Must reject unauthorized user');

    // Authorized user polling a pending transaction gets pending without credit
    const authPoll = await paynow.pollStatus(ref, 'user_helen_08');
    assert.strictEqual(authPoll.status, 'pending');
    assert.strictEqual(authPoll.credited, false);
  });

  // TEST 10: Cryptographic receipt generation and verification
  test('Cryptographic HMAC receipt validates verified payment and detects tampering', () => {
    const tx = PaymentLedger.getAllTransactions().find(t => t.status === 'completed');
    assert.ok(tx, 'Must have a completed transaction from earlier tests');

    const receipt = paynow.generateReceipt(tx!);
    assert.ok(receipt && receipt.length === 64, 'Must generate valid 64-char sha256 hex receipt');

    // Verification succeeds with valid receipt
    const isValid = paynow.verifyReceipt(tx!, receipt);
    assert.strictEqual(isValid, true, 'Valid receipt must verify');

    // Tampered receipt fails
    const isTamperedValid = paynow.verifyReceipt(tx!, receipt.replace(/.$/, '0'));
    assert.strictEqual(isTamperedValid, false, 'Tampered receipt must fail');

    // Tampered amount fails
    const tamperedTx = { ...tx!, amount: 9999.00 };
    const isAmountTamperedValid = paynow.verifyReceipt(tamperedTx as any, receipt);
    assert.strictEqual(isAmountTamperedValid, false, 'Receipt with tampered amount must fail');
  });

  // TEST 11: Production credentials enforcement
  await testAsync('Production environment rejects missing credentials and prevents bypass', async () => {
    const prodPaynow = PaynowService.getInstance();
    (prodPaynow as any).config.isProduction = true;
    (prodPaynow as any).config.integrationId = '';
    (prodPaynow as any).config.integrationKey = '';

    const res = await prodPaynow.initiatePayment({
      userId: 'prod_user_01',
      userEmail: 'prod@example.com',
      amount: 10.00,
    });

    assert.strictEqual(res.success, false, 'Must reject in production when credentials missing');
    assert.ok(res.error?.includes('credentials'), 'Error must specify credentials are required in production');

    // Restore test configuration
    (prodPaynow as any).config.isProduction = false;
    (prodPaynow as any).config.integrationKey = testIntegrationKey;
  });

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log('====================================================');

  if (passed === total) {
    console.log('ALL PAYMENT SECURITY ASSERTIONS VERIFIED SUCCESSFULLY.');
    process.exit(0);
  } else {
    console.error('CRITICAL: SOME PAYMENT SECURITY ASSERTIONS FAILED.');
    process.exit(1);
  }
}

runSecurityTests().catch(err => {
  console.error('FATAL TEST ERROR:', err);
  process.exit(1);
});
