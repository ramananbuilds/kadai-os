# Money is integer paise, end to end

Every rupee amount — prices, costs, bill totals, lifetime spend — is an
integer count of paise (`bigint` in Postgres, `number` in TypeScript),
converted from human-entered rupees exactly once via `rupeesToPaise()`.
Floats drift on precisely the arithmetic retail does (percent discounts,
per-unit multiplication), and NUMERIC/DECIMAL columns merely move the drift
to the driver boundary where every client parses to float anyway. Rejected:
`numeric` columns; rupee floats; cents-in-strings.
