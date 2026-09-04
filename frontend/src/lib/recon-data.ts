export type ReconStatus = "matched" | "exception" | "missing";

export interface ReconRow {
  id: string;
  txnId: string;
  rawVendor: string;
  resolvedEntity: string;
  bankAmount: number;
  ledgerAmount: number;
  discrepancy: number;
  discrepancyLabel: string;
  status: ReconStatus;
  source: string;
  valueDate: string;
  utr: string;
  reason?: string;
  guardrail?: string;
  confidence: number;
}

const inr = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

export const formatMoney = inr;

export const reconRows: ReconRow[] = [
  {
    id: "r1",
    txnId: "TXN-RZP-88412093",
    rawVendor: "RAZORPAY SOFTWARE PVT LT",
    resolvedEntity: "Razorpay Software Pvt Ltd",
    bankAmount: 184320.55,
    ledgerAmount: 184320.55,
    discrepancy: 0,
    discrepancyLabel: "$0.00",
    status: "matched",
    source: "HDFC Bank MT940",
    valueDate: "2026-08-31",
    utr: "HDFCN52290014412",
    confidence: 99.8,
  },
  {
    id: "r2",
    txnId: "TXN-STR-40219887",
    rawVendor: "STRIPE PAYMENTS INDIA",
    resolvedEntity: "Stripe Payments India Pvt Ltd",
    bankAmount: 92140.0,
    ledgerAmount: 92125.8,
    discrepancy: 14.2,
    discrepancyLabel: "+$14.20 TDS Risk",
    status: "exception",
    source: "Stripe Settlement Report",
    valueDate: "2026-08-31",
    utr: "STRPY2026083100418",
    reason:
      "Deterministic Guardrail Triggered: Discrepancy of $14.20 detected in TDS calculation. LLM match rejected due to zero-math tolerance policy.",
    guardrail: "GR-TDS-194O / zero-math-tolerance",
    confidence: 97.4,
  },
  {
    id: "r3",
    txnId: "TXN-HDF-77120044",
    rawVendor: "HDFC BK NEFT CR SETTLMNT",
    resolvedEntity: "HDFC Bank Ltd — Nodal Settlement",
    bankAmount: 561900.0,
    ledgerAmount: 561900.0,
    discrepancy: 0,
    discrepancyLabel: "$0.00",
    status: "matched",
    source: "HDFC Bank MT940",
    valueDate: "2026-08-30",
    utr: "HDFCN52290014377",
    confidence: 99.9,
  },
  {
    id: "r4",
    txnId: "TXN-RZP-88412117",
    rawVendor: "RZRPAY PAYOUT REV",
    resolvedEntity: "Razorpay Software Pvt Ltd",
    bankAmount: 24500.0,
    ledgerAmount: 24737.5,
    discrepancy: -237.5,
    discrepancyLabel: "-$237.50 Fee Variance",
    status: "exception",
    source: "OMS Log oms-prod-14",
    valueDate: "2026-08-30",
    utr: "RZPX20260830994",
    reason:
      "Deterministic Guardrail Triggered: Platform fee of $237.50 present in OMS log but absent from bank credit. Netting rule mismatch; BigDecimal comparison failed at scale 2.",
    guardrail: "GR-FEE-NET-02 / netting-parity",
    confidence: 94.1,
  },
  {
    id: "r5",
    txnId: "TXN-STR-40219902",
    rawVendor: "STRIPE TECHNOLOGY EUROPE",
    resolvedEntity: "Stripe Technology Europe Ltd",
    bankAmount: 310275.4,
    ledgerAmount: 310275.4,
    discrepancy: 0,
    discrepancyLabel: "$0.00",
    status: "matched",
    source: "Stripe Settlement Report",
    valueDate: "2026-08-30",
    utr: "STRPY2026083000391",
    confidence: 99.6,
  },
  {
    id: "r6",
    txnId: "TXN-HDF-77120061",
    rawVendor: "HDFC IMPS RTN CHRG",
    resolvedEntity: "HDFC Bank Ltd — Return Charges",
    bankAmount: 1180.0,
    ledgerAmount: 0,
    discrepancy: 1180.0,
    discrepancyLabel: "+$1,180.00 Unbooked",
    status: "missing",
    source: "HDFC Bank MT940",
    valueDate: "2026-08-29",
    utr: "HDFCN52290014301",
    reason:
      "Deterministic Guardrail Triggered: Bank debit has no counterpart in the ledger. Semantic resolver proposed a charge account mapping at 88.2% confidence — below the 99.0% autopost threshold.",
    guardrail: "GR-ORPHAN-01 / autopost-threshold",
    confidence: 88.2,
  },
  {
    id: "r7",
    txnId: "TXN-RZP-88412188",
    rawVendor: "RAZORPAY SOFTWARE PVT LT",
    resolvedEntity: "Razorpay Software Pvt Ltd",
    bankAmount: 78430.25,
    ledgerAmount: 78430.25,
    discrepancy: 0,
    discrepancyLabel: "$0.00",
    status: "matched",
    source: "OMS Log oms-prod-14",
    valueDate: "2026-08-29",
    utr: "RZPX20260829871",
    confidence: 99.4,
  },
  {
    id: "r8",
    txnId: "TXN-STR-40219944",
    rawVendor: "STRIPE PAYMENTS INDIA",
    resolvedEntity: "Stripe Payments India Pvt Ltd",
    bankAmount: 45900.0,
    ledgerAmount: 45900.0,
    discrepancy: 0,
    discrepancyLabel: "$0.00",
    status: "matched",
    source: "Stripe Settlement Report",
    valueDate: "2026-08-29",
    utr: "STRPY2026082900244",
    confidence: 99.7,
  },
  {
    id: "r9",
    txnId: "TXN-HDF-77120098",
    rawVendor: "HDFC BK FX REVAL CR",
    resolvedEntity: "HDFC Bank Ltd — FX Revaluation",
    bankAmount: 20140.9,
    ledgerAmount: 20139.12,
    discrepancy: 1.78,
    discrepancyLabel: "+$1.78 FX Rounding",
    status: "exception",
    source: "HDFC Bank MT940",
    valueDate: "2026-08-28",
    utr: "HDFCN52290014288",
    reason:
      "Deterministic Guardrail Triggered: FX rounding delta of $1.78 exceeds the zero-tolerance policy for settlement legs. No automatic write-off permitted.",
    guardrail: "GR-FX-ROUND-04 / zero-math-tolerance",
    confidence: 98.9,
  },
];

export const auditLedger = [
  {
    id: "a1",
    ts: "2026-09-01T14:02:11Z",
    event: "BATCH_OPENED",
    actor: "engine@reconsentinel",
    detail: "Batch RS-2026-0901-A opened · 3 sources · 4,182 records",
    hash: "0x9f4c…a71e",
  },
  {
    id: "a2",
    ts: "2026-09-01T14:02:19Z",
    event: "SCHEMA_MAPPED",
    actor: "langchain4j/entity-resolver",
    detail: "42 vendor aliases resolved to 17 canonical entities · confidence 99.1%",
    hash: "0x2b81…4cd0",
  },
  {
    id: "a3",
    ts: "2026-09-01T14:02:44Z",
    event: "GUARDRAIL_TRIGGERED",
    actor: "core/bigdecimal-verifier",
    detail: "TXN-STR-40219887 rejected · TDS delta $14.20 · zero-math tolerance",
    hash: "0x7d55…19ab",
  },
  {
    id: "a4",
    ts: "2026-09-01T14:03:02Z",
    event: "OVERRIDE_REQUESTED",
    actor: "p.kulkarni@finops",
    detail: "TXN-HDF-77120061 escalated to accounting review",
    hash: "0xc013…88f2",
  },
  {
    id: "a5",
    ts: "2026-09-01T14:03:27Z",
    event: "HASH_CHAIN_SEALED",
    actor: "engine@reconsentinel",
    detail: "Merkle root committed for 4,170 verified records",
    hash: "0x51ea…бd3c".replace("б", "b"),
  },
];

export const throughput = [
  32, 41, 38, 55, 61, 58, 72, 88, 81, 96, 104, 99, 118, 132, 127, 141, 155, 149, 168, 172, 165, 181,
  194, 188,
];
