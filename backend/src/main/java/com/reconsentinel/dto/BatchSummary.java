package com.reconsentinel.dto;

import com.reconsentinel.model.Records.ReconResult;

import java.math.BigDecimal;
import java.util.List;

public record BatchSummary(
    BigDecimal totalVolumeProcessed,
    double matchedRatePercent,
    long cleanMatchCount,
    long exceptionCount,
    long missingCounterpartCount,
    double avgEntityConfidencePercent,
    boolean auditChainValid,
    List<ReconResult> results
) {}
