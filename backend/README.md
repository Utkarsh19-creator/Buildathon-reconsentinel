# ReconSentinel — Deterministic Multi-Source Audit & Settlement Engine

Reconciles Bank Statement × Gateway Settlement × OMS logs, using AI **only**
to resolve messy vendor names — never to touch money math. All currency
comparisons run on `BigDecimal`. Every result row is chained into a
SHA-256 audit hash so tampering is independently detectable.

## Quick start

```bash
export OPENAI_API_KEY=sk-...        # optional — see fallback behavior below
mvn spring-boot:run
```

Then, from another terminal:

```bash
curl -X POST http://localhost:8080/api/reconcile/upload \
  -F "bank=@sample-data/bank_statement.csv" \
  -F "gateway=@sample-data/gateway_settlement.csv" \
  -F "oms=@sample-data/oms_log.csv"
```

Other endpoints:
- `GET /api/reconcile/results` — last batch summary + full row list
- `GET /api/reconcile/exceptions` — flagged rows only
- `GET /api/reconcile/verify` — recomputes the whole hash chain and confirms nothing was tampered with

Run the test suite: `mvn test`

## What the sample data demonstrates

`sample-data/` ships five bank rows engineered to hit every code path:

| UTR | Scenario | Expected result |
|---|---|---|
| UTR1001 | Amounts reconcile exactly | `CLEAN_MATCH` |
| UTR1002 | Bank amount is short by exactly 1% of gross | `FLAGGED_EXCEPTION` — "Possible unrecorded TDS deduction" |
| UTR1003 | Gateway fee recorded as ₹0 but a real fee was clearly deducted | `FLAGGED_EXCEPTION` — "Missing/zero fee line item" |
| UTR1004 | Amounts match perfectly, but OMS points at a different UTR | `FLAGGED_EXCEPTION` — "UTR mismatch" (this is the case that matters most: money can match by coincidence, the UTR check catches it anyway) |
| UTR1006 | No gateway or OMS row exists at all | `MISSING_COUNTERPART` |

## Architecture

```
CSV uploads (bank / gateway / OMS)
        │
        ▼
  CsvIngestor  ── parses to typed records (Apache Commons CSV)
        │
        ▼
  EntityResolver ── LLM call to clean vendor names ONLY
        │             (falls back to rule-based cleanup if no API key
        │              or the call fails — pipeline never blocks on AI)
        ▼
  MoneyMatcher  ── BigDecimal-only comparison + exception classification
        │             (zero LLM involvement, unit tested)
        ▼
  AuditHasher   ── SHA-256 hash chain over every result row
        │
        ▼
  ReconciliationService ── orchestration + batch summary stats
        │
        ▼
  ReconciliationController ── REST API
```

The **AI/deterministic split is the core design decision**: an LLM
resolving "AMZN PAY IN" → "Amazon India" wrong is a minor annoyance you
fix by re-running; an LLM computing a ₹14.20 discrepancy wrong is a
financial-audit incident. So the LLM is architecturally barred from ever
seeing a `BigDecimal` — it only ever receives and returns strings.

## How the matching logic was verified

Before writing the Java, the exact same algorithm (BigDecimal-equivalent
`Decimal` arithmetic, same classification rules, same hash chain) was
implemented in Python and run against a table of edge cases — clean
match, TDS-explained variance, missing-fee variance, UTR-mismatch
override, a rounding boundary, and a hash-chain tamper test. All cases
passed before the Java was transcribed. `MoneyMatcherTest.java` encodes
the same cases as JUnit tests.

## A real bug we hit (good pitch-video material)

During dev testing, UTR1004 — the row deliberately engineered to have a
UTR mismatch between bank and OMS — was coming back as
`MISSING_COUNTERPART` instead of `FLAGGED_EXCEPTION`. The cause: the
service was looking up the OMS record using the *bank's* UTR as the key.
Since the OMS row was deliberately filed under a different UTR (that's
the whole point of the test case), the lookup returned nothing, and the
row fell into "no counterpart found" before `MoneyMatcher` ever got a
chance to compare the two UTRs and flag a real mismatch.

Fix: the join chain was restructured so gateway↔OMS links by `order_id`
(the real-world reference both systems share), not by UTR — because UTR
consistency is exactly the thing being validated, so it can't safely be
used as a join key. This is a good example of a class of bug that's easy
to miss in reconciliation logic specifically: using the value under
audit as the audit mechanism's own lookup key.

## Known gaps — read this before your pitch

Being upfront about these will land better with judges than pretending
they don't exist:

- **In-memory storage only.** `ReconciliationService` keeps the last
  batch in a field, not a database. Fine for a demo, not for production —
  say so if asked.
- **CSV schema is fixed**, not auto-detected. Headers must match the
  README table. A real "AI Schema Confidence" feature (auto-mapping
  arbitrary headers) is a natural v2, not yet built here.
- **TDS/fee classification is heuristic**, not a general rules engine —
  it explains exactly two deduction patterns (1% TDS, missing fee) as a
  demonstration of the concept, not a production tax engine.
- **No auth** on the API. Add Spring Security before this touches real
  financial data.
- **LLM entity resolution needs a live API key to actually call an LLM.**
  Without `OPENAI_API_KEY` set, it automatically degrades to a
  rule-based string cleaner (still functional, just not AI) — this was a
  deliberate fail-safe design choice, not an oversight, and it's worth
  saying so explicitly if a judge asks what happens without a key.

## Extending it

- Swap the in-memory store for Postgres — the `ReconResult` record is
  already a clean persistence boundary.
- Add a `/schema-detect` endpoint that asks the LLM to map arbitrary CSV
  headers onto the canonical fields — this is what the original UI's
  "AI Schema Confidence: 99.1%" metric implied and is a good "what we'd
  build next" line for the pitch.
- Multi-currency support: right now everything assumes a single currency
  and scale=2; real Razorpay settlements can include forex.
