# AegisPay — Final Aligned Business & Functional Specification

## Status
Consolidated implementation specification for the current AegisPay prototype/testnet build.

## 1. Roles
Only two user-facing interfaces are provided:
- Client UI
- Master Admin UI

The previous Nodes and separate Admin UI concepts are retired.

## 2. Client account
Client signup creates:
- Unique User ID
- Name
- Email
- Password/authentication state
- Unique referral code/link
- Referrer relationship
- Account status

Forgot Password resets the password and starts a temporary security freeze. The current prototype defaults this freeze to 24 hours.

## 3. Withdrawal wallet
The client links one withdrawal wallet.
Once linked, the client cannot change it.
Only Master Admin can change it.
The prototype also requires the wallet owner name to match the signup name.

## 4. Deposit
Client selects one of six tiers and submits a USDT deposit on TRON.
The prototype is configured for TRON TESTNET only.
Transaction screenshot is mandatory.
The TXID must be available for the verification workflow.
Deposit verification is represented as:
Screenshot → TXID → receiving address → amount/status match → verified credit.

A $2 deposit fee is configured. First deposit minimum is $30; repeat deposits are at least $10.

## 5. VIP tiers
- Tier 1: $30 deposit, $5 initial cycle profit
- Tier 2: $50 deposit, $10 initial cycle profit
- Tier 3: $100 deposit, $15 initial cycle profit
- VVIP 1: $250 deposit, $40 initial cycle profit
- VVIP 2: $500 deposit, $65 initial cycle profit
- VVIP 3: $1,000 deposit, $135 initial cycle profit

Configured cycle rate is the initial profit divided by the tier gross deposit.

## 6. Shop / tasks
After verified deposit and tier selection, the client gets tier-based Shop/task offers.
The client completes the assigned tasks.
After all tasks in the active cycle are complete, the cycle enters a waiting state and the 18-hour timer starts.

## 7. 18-hour settlement
The completed cycle stores its cycle base.
After 18 hours, the system settles:
new amount = cycle base + cycle base × tier rate.

The next cycle can use the accumulated amount as its next base, giving the requested compounding behavior.

## 8. Referral
Two levels:
- Level 1: $5 after a referred client's verified first qualifying deposit
- Level 2: $2 after a second-level referred client's verified first qualifying deposit

Example:
A → B → C
B first deposit: A earns $5.
C first deposit: B earns $5 and A earns $2.

## 9. Withdrawals
Minimum withdrawal is $50.
Transfer fee is 10%:
$50 request → $5 fee → $45 net.
$100 request → $10 fee → $90 net.

Request flow:
Client submits → PENDING_APPROVAL → Telegram bot prepares internal Master Admin message → Master Admin approves/rejects → approved payout is recorded.

The prototype does not execute a live blockchain transfer.

## 10. Master Admin manual adjustments
Master Admin can search by Unique User ID and:
- Credit balance
- Reverse/deduct balance
- Freeze
- Block
- Restore normal status
- Review deposit records
- Review referral activity
- Review withdrawals
- Approve/reject withdrawals
- Change a locked withdrawal wallet
- Change platform settings

Credits and reversals are fully audited.

## 11. Liquidity settlement
For the prototype's backend accounting model, an approved withdrawal records the withdrawing user's own principal portion first. Any remaining simulated settlement requirement can be represented as internal liquidity/principal adjustment ledger entries against non-withdrawing users. This is an internal backend record and is not exposed as a separate client-side action.

## 12. AI assistant
AI handles client guidance and issue resolution:
- Deposit instructions
- Withdrawal instructions
- Referral instructions
- Shop/task explanations
- Password reset assistance
- Account status explanations
- General troubleshooting

AI has no financial approval authority.
AI cannot approve/reject withdrawals or freely edit balances.

## 13. Telegram
Clients do not receive direct Telegram access.
The bot is an internal Master Admin communication mechanism.
Client-side code never stores a Telegram bot token or Master Admin Telegram credentials.

## 14. Security
Sensitive financial operations remain server-side in a production architecture.
RLS is used for authenticated access.
Wallet linking is one-time for clients.
Withdrawal approval is Master Admin only.
Live payout execution is disabled in the prototype.

## 15. UI
Client:
Dashboard, Deposit, Shop, Referrals, Withdraw, Activity, Notifications, AI Assistant, Profile.

Master Admin:
Overview, Users, Withdrawals, Credits, Settings, Telegram.

Visual direction:
dark navy + electric blue + cyan + violet accents; emerald success states; amber transaction states; red security/rejection states; gold/VVIP tier accents.

## 16. User instructions are built into the app
Every critical workflow includes on-screen instructions:
- Deposit steps
- Screenshot/TXID requirement
- TRC20 network reminder
- Wallet locking warning
- Withdrawal minimum/fee calculation
- 18-hour cycle explanation
- Referral bonus trigger explanation
- Password reset security freeze
- AI authority limitation
- Testnet/prototype warning

## 17. Prototype boundary
This build is a professional functional prototype/testnet foundation.
It does not execute real Mainnet USDT transfers, does not custody real funds, does not store private keys, and does not claim independent proof-of-reserves.
