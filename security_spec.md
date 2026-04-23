# Security Specification: Live Streaming

## 1. Data Invariants
- A `live_stream` must have a valid `streamerId` matching the creator's UID.
- `viewers` must be a non-negative number.
- `status` can only be `live` or `ended`.
- `createdAt` must be set to the server timestamp during creation.
- Comments must belong to a valid `live_stream`.
- A user can only delete or end their own stream.

## 2. The Dirty Dozen (Vulnerability Payloads)

1. **Identity Theft:** Attacker attempts to create a stream with someone else's `streamerId`.
2. **Zombie Stream:** Attacker attempts to update the `streamerId` of an existing stream.
3. **Time Travel:** Attacker attempts to set a manual `createdAt` date in the past.
4. **Ghost Comments:** Attacker attempts to post a comment to a stream that doesn't exist.
5. **Impersonation:** Attacker attempts to post a comment with a different `userId` or `user` name than their own.
6. **Double Kill:** Attacker attempts to end/delete a stream they don't own.
7. **Junk Data:** Attacker attempts to inject a 1MB string into the `title` field.
8. **Shadow Field:** Attacker attempts to add `isPromoted: true` to a stream.
9. **Negative Viewers:** Attacker attempts to set `viewers: -100`.
10. **State Shortcut:** Attacker attempts to change `status` from `ended` back to `live`.
11. **Bypassing Verification:** User with unverified email attempts to go live (if policy requires verification).
12. **Orphaned Writes:** Attacker attempts to create a comment with a non-string `id`.

## 3. Test Runner (Draft Rules Logic)

Tests should verify `PERMISSION_DENIED` for all above.

```typescript
// firestore.rules.test.ts (Conceptual)
// ... test cases for each payload ...
```
