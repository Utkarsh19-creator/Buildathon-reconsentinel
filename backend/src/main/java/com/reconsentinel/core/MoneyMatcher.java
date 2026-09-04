package com.reconsentinel.core;

import com.reconsentinel.model.Records.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Deterministic matching engine. NO LLM, NO floating point, anywhere
 * in this class. All money is BigDecimal, scale=2, HALF_UP.
 *
 * This is the component the "Java BigDecimal Verified (Zero-LLM Math)"
 * badge in the UI refers to — the AI never touches a currency figure,
 * it only ever resolves *names* (see EntityResolver).
 *
 * Algorithm verified against a parallel Python/Decimal implementation
 * covering: exact match, TDS-explained variance, missing-fee variance,
 * UTR-mismatch override, rounding edge cases, and hash-chain tamper
 * detection. All cases passed before this class was written.
 */
@Component
public class MoneyMatcher {

    private static final BigDecimal ZERO = new BigDecimal("0.00");
    private static final BigDecimal TDS_RATE = new BigDecimal("0.01"); // illustrative 1% TDS

    public ReconResult reconcile(BankTxn bank, GatewayTxn gw, OmsTxn oms,
                                  EntityMatch entity, String prevHash) {

        BigDecimal bankAmt = norm(bank.amount());
        BigDecimal expected = norm(gw.grossAmount().subtract(gw.fee()).subtract(gw.tax()));
        BigDecimal delta = norm(bankAmt.subtract(expected));

        Status status;
        String reason;

        if (delta.compareTo(ZERO) == 0) {
            status = Status.CLEAN_MATCH;
            reason = "Exact match";
        } else {
            status = Status.FLAGGED_EXCEPTION;
            reason = classify(delta, gw);
        }

        // UTR consistency is checked independently of the amount match.
        // An amount can coincidentally balance while pointing at the wrong
        // order — that must always be flagged, never silently passed.
        if (!Objects.equals(bank.utr(), oms.utr())) {
            status = Status.FLAGGED_EXCEPTION;
            reason = "UTR mismatch: bank=" + bank.utr() + " oms=" + oms.utr();
        }

        String hash = AuditHasher.chainHash(prevHash, bank.utr(), bankAmt, expected, delta, status.name());

        return new ReconResult(bank.utr(), status, bankAmt, expected, delta, reason, entity, hash);
    }

    /** For a bank transaction with no OMS/gateway counterpart at all. */
    public ReconResult missingCounterpart(BankTxn bank, EntityMatch entity, String prevHash) {
        BigDecimal bankAmt = norm(bank.amount());
        String reason = "No matching gateway/OMS record found for UTR " + bank.utr();
        String hash = AuditHasher.chainHash(prevHash, bank.utr(), bankAmt, ZERO, bankAmt, Status.MISSING_COUNTERPART.name());
        return new ReconResult(bank.utr(), Status.MISSING_COUNTERPART, bankAmt, ZERO, bankAmt, reason, entity, hash);
    }

    private String classify(BigDecimal delta, GatewayTxn gw) {
        BigDecimal absDelta = delta.abs();
        BigDecimal impliedTds = norm(gw.grossAmount().multiply(TDS_RATE));

        if (absDelta.compareTo(impliedTds) == 0) {
            return "Possible unrecorded TDS deduction (" + impliedTds + ")";
        }
        if (gw.fee().compareTo(BigDecimal.ZERO) == 0 && absDelta.compareTo(new BigDecimal("0.01")) > 0) {
            return "Missing/zero fee line item — variance " + absDelta;
        }
        return "Unexplained variance of " + absDelta + " — exceeds zero-tolerance threshold";
    }

    private BigDecimal norm(BigDecimal v) {
        return v.setScale(2, RoundingMode.HALF_UP);
    }
}
