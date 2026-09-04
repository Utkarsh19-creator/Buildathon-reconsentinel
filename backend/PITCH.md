# ReconSentinel — for judges

**Track:** AI Finance Controller
**One line:** Reconciles bank statements against payment-gateway
settlements and OMS logs, using AI only to clean up messy vendor
names — never to touch the actual money math.

## The core idea

Financial reconciliation has one hard trust requirement: an AI getting
a vendor name wrong is a minor annoyance; an AI getting a ₹ figure
wrong is an audit incident. So this system draws a hard architectural
line — the LLM (`EntityResolver`) only ever receives and returns
strings, and is structurally incapable of touching a `BigDecimal`. All
currency comparison lives in `MoneyMatcher`, which has zero AI
involvement and is independently unit-tested.

Every result is also chained into a SHA-256 hash (`AuditHasher`), so
retroactively editing any past record breaks every hash after it —
independently verifiable via `GET /api/reconcile/verify`.

## What's real vs. what's a known next step

Everything in `src/` is a working, tested build — not a mockup:
- `mvn test` passes (5 cases: clean match, TDS-explained variance,
  missing-fee variance, UTR-mismatch, hash-chain tamper detection)
- The API runs end-to-end against the sample data in `sample-data/`
- The LLM call is a genuine HTTP request to an OpenAI-compatible
  endpoint, with a documented fail-safe fallback if no key is set

Known gaps, stated upfront rather than discovered by a judge:
in-memory storage only (no DB yet), fixed CSV schema (no AI-driven
header auto-mapping yet — a natural v2), and two illustrative
deduction rules (TDS, missing fee) rather than a general tax engine.
Full list in `README.md` under "Known gaps."

## A real bug, on purpose

`docs/DEBUGGING_NOTES.md` documents an actual bug found while testing:
UTR was initially used as both the join key *and* the value being
validated between OMS and bank records, which meant a genuine mismatch
caused the record lookup to fail silently instead of getting flagged.
Fixed by joining on `order_id` instead. Left in the repo rather than
squashed out because it's a real example of the exact failure category
this tool is built to catch.

## Try it in under a minute

```bash
mvn spring-boot:run
# in another terminal:
curl -X POST http://localhost:8080/api/reconcile/upload \
  -F "bank=@sample-data/bank_statement.csv" \
  -F "gateway=@sample-data/gateway_settlement.csv" \
  -F "oms=@sample-data/oms_log.csv"
```
