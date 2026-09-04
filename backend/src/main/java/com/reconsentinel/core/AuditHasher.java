package com.reconsentinel.core;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;

/**
 * SHA-256 hash chain: each record's hash is derived from the previous
 * record's hash plus its own fields. Editing any historical record
 * without recomputing every hash after it will break the chain —
 * this is what "Cryptographic Audit Hash Generation" means concretely,
 * and it's independently verifiable (see verifyChain).
 */
public final class AuditHasher {

    private AuditHasher() {}

    public static String chainHash(String prevHash, String utr, BigDecimal bankAmt,
                                    BigDecimal expected, BigDecimal delta, String status) {
        String payload = String.join("|",
            prevHash == null ? "GENESIS" : prevHash,
            utr,
            bankAmt.toPlainString(),
            expected.toPlainString(),
            delta.toPlainString(),
            status
        );
        return sha256(payload);
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    /**
     * Recomputes the chain from scratch and compares to the stored hashes.
     * A single row with amount, e.g., $999,999.00 quietly edited will fail
     * this check even though nothing else about the row looks wrong.
     *
     * @param rows each row: {utr, bankAmt, expected, delta, status, claimedHash}
     */
    public static boolean verifyChain(List<String[]> rows) {
        String prev = null;
        for (String[] r : rows) {
            String recomputed = chainHash(prev,
                r[0], new BigDecimal(r[1]), new BigDecimal(r[2]), new BigDecimal(r[3]), r[4]);
            if (!recomputed.equals(r[5])) {
                return false;
            }
            prev = recomputed;
        }
        return true;
    }
}
