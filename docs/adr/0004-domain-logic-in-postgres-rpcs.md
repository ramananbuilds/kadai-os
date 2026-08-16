# Domain logic lives in Postgres RPCs

`create_bill()` — bill + items + stock movements + loyalty ledger + customer
aggregates — is a single Postgres function under a single COMMIT boundary.
Clients (and future edge functions) stay thin: they call the RPC and render
the result. Multi-round-trip orchestration from TypeScript cannot be
transactional over HTTP, which is unacceptable when the unit of work is
"take money-ish things". This is also the Supabase exit strategy: schema +
functions are plain Postgres, portable to any host or a custom API server
in front of the same database. Rejected: client-side transactions;
per-table CRUD RPCs stitched together by clients.
