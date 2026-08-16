# Offline bills: client-generated ids as idempotency keys

Counter connectivity in Indian retail is unreliable, so billing must work
with no network: the mobile app creates Bills locally with a
client-generated UUID and drains them to the server later. The server
treats the bill id as the idempotency key — a replayed outbox entry
returns the original bill instead of double-charging stock or points.
Trade-offs accepted: the server re-prices every item from the live catalog
(client prices are never trusted, so a stale offline catalog can misprice —
surfaced as a sync rejection), and bill numbers are sequential per shop at
sync time, not creation time.
