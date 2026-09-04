package com.reconsentinel.model;

import java.math.BigDecimal;

/**
 * All money fields are BigDecimal end to end. No double/float is used
 * anywhere in the matching path — that is the "Zero-LLM Math" guarantee.
 */
public class Records {

    public record BankTxn(
        String utr,
        BigDecimal amount,
        String date,
        String rawDescription
    ) {}

    public record GatewayTxn(
        String utr,
        String orderId,
        BigDecimal grossAmount,
        BigDecimal fee,
        BigDecimal tax,
        String vendorRaw,
        String date
    ) {}

    public record OmsTxn(
        String orderId,
        String utr,
        BigDecimal amount,
        String vendorRaw,
        String date
    ) {}

    public enum Status { CLEAN_MATCH, FLAGGED_EXCEPTION, MISSING_COUNTERPART }

    public record EntityMatch(
        String rawName,
        String resolvedName,
        double confidence,
        String source // "LLM" | "CACHE" | "FALLBACK"
    ) {}

    public record ReconResult(
        String utr,
        Status status,
        BigDecimal bankAmount,
        BigDecimal expectedAmount,
        BigDecimal delta,
        String reason,
        EntityMatch entity,
        String auditHash
    ) {}
}
