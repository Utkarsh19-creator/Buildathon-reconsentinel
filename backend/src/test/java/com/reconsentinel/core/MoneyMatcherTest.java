package com.reconsentinel.core;

import com.reconsentinel.model.Records.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

/**
 * These cases mirror the Python/Decimal reference implementation that was
 * actually executed to validate the algorithm before this class was
 * written (see project notes). Run with: mvn test
 */
class MoneyMatcherTest {

    private final MoneyMatcher matcher = new MoneyMatcher();
    private final EntityMatch dummyEntity = new EntityMatch("X", "X", 1.0, "FALLBACK");

    @Test
    void cleanExactMatch() {
        BankTxn bank = new BankTxn("UTR001", new BigDecimal("985.00"), "2026-08-01", "");
        GatewayTxn gw = new GatewayTxn("UTR001", "ORD-1", new BigDecimal("1000.00"), new BigDecimal("15.00"), new BigDecimal("0.00"), "X", "2026-08-01");
        OmsTxn oms = new OmsTxn("O1", "UTR001", new BigDecimal("985.00"), "X", "2026-08-01");

        ReconResult r = matcher.reconcile(bank, gw, oms, dummyEntity, null);

        assertEquals(Status.CLEAN_MATCH, r.status());
        assertEquals(new BigDecimal("0.00"), r.delta());
    }

    @Test
    void tdsDeductionFlagged() {
        BankTxn bank = new BankTxn("UTR002", new BigDecimal("975.00"), "2026-08-01", "");
        GatewayTxn gw = new GatewayTxn("UTR002", "ORD-2", new BigDecimal("1000.00"), new BigDecimal("15.00"), new BigDecimal("0.00"), "X", "2026-08-01");
        OmsTxn oms = new OmsTxn("O2", "UTR002", new BigDecimal("975.00"), "X", "2026-08-01");

        ReconResult r = matcher.reconcile(bank, gw, oms, dummyEntity, null);

        assertEquals(Status.FLAGGED_EXCEPTION, r.status());
        assertTrue(r.reason().contains("TDS"));
    }

    @Test
    void missingFeeLineFlagged() {
        BankTxn bank = new BankTxn("UTR003", new BigDecimal("1000.00"), "2026-08-02", "");
        GatewayTxn gw = new GatewayTxn("UTR003", "ORD-3", new BigDecimal("1014.20"), new BigDecimal("0.00"), new BigDecimal("0.00"), "X", "2026-08-02");
        OmsTxn oms = new OmsTxn("O3", "UTR003", new BigDecimal("1000.00"), "X", "2026-08-02");

        ReconResult r = matcher.reconcile(bank, gw, oms, dummyEntity, null);

        assertEquals(Status.FLAGGED_EXCEPTION, r.status());
        assertTrue(r.reason().contains("fee"));
    }

    @Test
    void utrMismatchOverridesCleanAmount() {
        BankTxn bank = new BankTxn("UTR004", new BigDecimal("985.00"), "2026-08-02", "");
        GatewayTxn gw = new GatewayTxn("UTR004", "ORD-4", new BigDecimal("1000.00"), new BigDecimal("15.00"), new BigDecimal("0.00"), "X", "2026-08-02");
        OmsTxn oms = new OmsTxn("O4", "UTR999", new BigDecimal("985.00"), "X", "2026-08-02"); // mismatched UTR

        ReconResult r = matcher.reconcile(bank, gw, oms, dummyEntity, null);

        assertEquals(Status.FLAGGED_EXCEPTION, r.status());
        assertTrue(r.reason().contains("UTR mismatch"));
    }

    @Test
    void hashChainDetectsTampering() {
        BankTxn bank = new BankTxn("UTR001", new BigDecimal("985.00"), "2026-08-01", "");
        GatewayTxn gw = new GatewayTxn("UTR001", "ORD-1", new BigDecimal("1000.00"), new BigDecimal("15.00"), new BigDecimal("0.00"), "X", "2026-08-01");
        OmsTxn oms = new OmsTxn("O1", "UTR001", new BigDecimal("985.00"), "X", "2026-08-01");

        ReconResult r1 = matcher.reconcile(bank, gw, oms, dummyEntity, null);
        ReconResult r2 = matcher.reconcile(bank, gw, oms, dummyEntity, r1.auditHash());

        var rows = java.util.List.of(
            new String[]{r1.utr(), r1.bankAmount().toPlainString(), r1.expectedAmount().toPlainString(), r1.delta().toPlainString(), r1.status().name(), r1.auditHash()},
            new String[]{r2.utr(), r2.bankAmount().toPlainString(), r2.expectedAmount().toPlainString(), r2.delta().toPlainString(), r2.status().name(), r2.auditHash()}
        );
        assertTrue(AuditHasher.verifyChain(rows));

        // tamper: swap in a fake hash for the second record
        var tampered = java.util.List.of(
            rows.get(0),
            new String[]{r2.utr(), "999999.00", r2.expectedAmount().toPlainString(), r2.delta().toPlainString(), r2.status().name(), r2.auditHash()}
        );
        assertFalse(AuditHasher.verifyChain(tampered));
    }
}
