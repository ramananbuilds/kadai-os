# The loyalty ledger is append-only

Points are store credit, so the Loyalty Ledger is treated like a bank
ledger: rows are only ever inserted (`earn`, `redeem`, `expire`, `adjust`),
never updated or deleted. Balances on `customers` are transactionally
maintained aggregates of the ledger, not editable state — corrections and
disputes resolve as new `adjust` entries, leaving the history intact.
Rejected: a mutable `points` column as the source of truth (no audit trail,
no dispute resolution, race-prone under concurrent bills).
