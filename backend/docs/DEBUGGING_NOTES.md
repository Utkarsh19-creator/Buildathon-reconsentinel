# Debugging notes: the UTR-mismatch join bug

This is a real bug found while testing this project, kept here (rather
than quietly fixed and forgotten) because it's an honest, concrete
example of the kind of failure this system exists to catch — and
because working through it is exactly the story worth telling in a
pitch about "what broke and how you recovered."

## Symptom

Bank statement row `UTR1004` was designed as a test case: its amount
reconciles *perfectly* against the gateway settlement, but the OMS
record for that order carries a different UTR (`UTR9999`) — simulating
a real-world case where money matches by coincidence but the
transaction is actually pointing at the wrong order.

Expected result: `FLAGGED_EXCEPTION`, reason `"UTR mismatch"`.

Actual result on first run: `MISSING_COUNTERPART`, reason `"No matching
gateway/OMS record found"` — as if the OMS row didn't exist at all.

## Root cause

The original join logic looked up the OMS record using the *bank's*
UTR as the key:

```java
OmsTxn oms = omsByUtr.get(bank.utr());
```

But UTR is exactly the field that's allowed to legitimately disagree
between systems — that's the whole point of checking it. Using it as
a join key meant that the moment a UTR genuinely didn't match, the
*lookup itself* failed before `MoneyMatcher` ever got a chance to
compare the two values and flag a proper mismatch. The bug wasn't in
the matching logic — it was one layer earlier, in how records got
paired up in the first place.

## Fix

Real reconciliation systems join Gateway↔OMS by `order_id` — a stable
reference both systems agree on — and only *then* compare each side's
UTR value against the bank's UTR. So:

- `GatewayTxn` gained an `orderId` field, populated from the gateway
  CSV's `order_id` column
- OMS records are now looked up by `order_id`, never by UTR
- UTR remains purely a *value being compared* between bank and OMS,
  never a join key

```java
Map<String, OmsTxn> omsByOrderId = new HashMap<>();
for (OmsTxn o : omsTxns) omsByOrderId.put(o.orderId(), o);
...
OmsTxn oms = omsByOrderId.get(gw.orderId()); // was: omsByUtr.get(bank.utr())
```

After the fix, `UTR1004` correctly returns:

```json
{
  "utr": "UTR1004",
  "status": "FLAGGED_EXCEPTION",
  "delta": 0.0,
  "reason": "UTR mismatch: bank=UTR1004 oms=UTR9999"
}
```

Delta is `0.0` — the money matched exactly — and the system still
flagged it. That's the case that actually matters.

## Takeaway

A field you're trying to *validate* can't also be the field you use to
*find* the record you're validating it against. Worth checking for the
same pattern anywhere else two sources are joined before comparison.
