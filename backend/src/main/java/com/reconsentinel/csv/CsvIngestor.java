package com.reconsentinel.csv;

import com.reconsentinel.model.Records.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Expected headers (case-insensitive, order-independent):
 *
 * Bank statement CSV:    utr, amount, date, description
 * Gateway/Razorpay CSV:  utr, order_id, gross_amount, fee, tax, vendor, date
 * OMS CSV:                order_id, utr, amount, vendor, date
 *
 * order_id is the join key between gateway and OMS — UTR is deliberately
 * NOT used for that join, because UTR consistency across bank/gateway/OMS
 * is exactly the thing being validated, not something safe to assume.
 *
 * Real-world exports rarely match this exactly — that's precisely why
 * schema/header normalization is one of the first things to harden if
 * you extend this beyond the hackathon build (see README "Known Gaps").
 */
@Component
public class CsvIngestor {

    public List<BankTxn> parseBank(MultipartFile file) throws IOException {
        List<BankTxn> out = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true)
                     .build().parse(reader)) {
            for (CSVRecord r : parser) {
                out.add(new BankTxn(
                    r.get("utr").trim(),
                    new BigDecimal(r.get("amount").trim()),
                    r.get("date").trim(),
                    r.isMapped("description") ? r.get("description") : ""
                ));
            }
        }
        return out;
    }

    public List<GatewayTxn> parseGateway(MultipartFile file) throws IOException {
        List<GatewayTxn> out = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true)
                     .build().parse(reader)) {
            for (CSVRecord r : parser) {
                out.add(new GatewayTxn(
                    r.get("utr").trim(),
                    r.get("order_id").trim(),
                    new BigDecimal(r.get("gross_amount").trim()),
                    new BigDecimal(r.isMapped("fee") && !r.get("fee").isBlank() ? r.get("fee").trim() : "0.00"),
                    new BigDecimal(r.isMapped("tax") && !r.get("tax").isBlank() ? r.get("tax").trim() : "0.00"),
                    r.get("vendor").trim(),
                    r.get("date").trim()
                ));
            }
        }
        return out;
    }

    public List<OmsTxn> parseOms(MultipartFile file) throws IOException {
        List<OmsTxn> out = new ArrayList<>();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8);
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader().setSkipHeaderRecord(true).setIgnoreHeaderCase(true).setTrim(true)
                     .build().parse(reader)) {
            for (CSVRecord r : parser) {
                out.add(new OmsTxn(
                    r.get("order_id").trim(),
                    r.get("utr").trim(),
                    new BigDecimal(r.get("amount").trim()),
                    r.get("vendor").trim(),
                    r.get("date").trim()
                ));
            }
        }
        return out;
    }
}
