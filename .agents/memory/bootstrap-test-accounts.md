---
name: Bootstrap Test Accounts
description: Permanent test accounts (seller + courier) that auto-bootstrap alongside root owner on every API startup.
---

## Accounts

| Email | Role | Password | Notes |
|---|---|---|---|
| delewatiamer7@gmail.com | admin | 00Amer00 | Root Owner — bootstrapRootAdmin() |
| delewatiamer8@gmail.com | seller | 00Amer00 | Permanent Seller — bootstrapTestAccounts() |
| delewatiamer9@gmail.com | courier | 00Amer00 | Permanent Courier — bootstrapTestAccounts() |

## Implementation

**File:** `artifacts/api-server/src/lib/bootstrap-test-accounts.ts`  
**Called from:** `artifacts/api-server/src/index.ts` — after `bootstrapRootAdmin()`, before `app.listen()`

```ts
await bootstrapRootAdmin();
await bootstrapTestAccounts();
```

## Guarantees

- Created if missing
- Repaired if role/status/isVerified drifted
- Password reset if empty/invalid hash
- Never creates duplicates (SELECT before INSERT)
- Survives schema restores and migration runs
- Non-fatal per-account: one failure doesn't block the others

**Why:** After any DB restore, test accounts are lost. The self-healing bootstrap ensures they always exist without manual intervention, matching the root owner pattern.

**How to apply:** If adding more permanent accounts, add to the `TEST_ACCOUNTS` array in `bootstrap-test-accounts.ts`. Never add more bootstrap admins — only one root admin (delewatiamer7) is allowed.
