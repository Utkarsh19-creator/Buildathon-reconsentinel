package com.reconsentinel.web;

import com.reconsentinel.core.AuditHasher;
import com.reconsentinel.dto.BatchSummary;
import com.reconsentinel.model.Records.ReconResult;
import com.reconsentinel.service.ReconciliationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reconcile")
@CrossOrigin(origins = "http://localhost:5173")
public class ReconciliationController {

    private final ReconciliationService service;

    public ReconciliationController(ReconciliationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<BatchSummary> executeBatch() throws Exception {
        BatchSummary summary= service.runBatch(null,null,null);
        return ResponseEntity.ok(summary);
    }


    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<?> upload(
            @RequestParam("bank") MultipartFile bank,
            @RequestParam("gateway") MultipartFile gateway,
            @RequestParam(value = "oms", required = false) MultipartFile oms) {
        try {
            BatchSummary summary = service.runBatch(bank, gateway, oms);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/results")
    public BatchSummary results() {
        return service.getLastBatch();
    }

    @GetMapping("/exceptions")
    public List<ReconResult> exceptions() {
        return service.getExceptions();
    }

    @GetMapping("/verify")
    public Map<String, Object> verify() {
        boolean valid = service.verifyAuditChain();
        return Map.of(
                "auditChainValid", valid,
                "message", valid ? "All audit hashes recomputed and match - no tampering detected."
                        : "CHAIN BROKEN - a record's hash does not match its recomputed value."
        );
    }

    @PostMapping("/verify-audit")
    public ResponseEntity<Map<String, Object>> verifyAuditChain(@RequestBody List<String[]> records) {
        boolean isValid = AuditHasher.verifyChain(records);
        return ResponseEntity.ok(Map.of(
                "auditChainValid", isValid,
                "message", isValid ? "Ledger integrity confirmed. No records have been tampered with."
                        : "SECURITY ALERT: Tampered financial data detected in the hash chain!"
        ));
    }
}