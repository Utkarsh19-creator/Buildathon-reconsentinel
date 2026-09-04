package com.reconsentinel.llm;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reconsentinel.model.Records.EntityMatch;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * EntityResolver using Google Gemini API (via OpenAI-compatible endpoint).
 * Resolves raw payment gateway/bank transaction strings to canonical business names.
 */
@Component
public class EntityResolver {

    private static final Logger log = LoggerFactory.getLogger(EntityResolver.class);

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, EntityMatch> cache = new ConcurrentHashMap<>();

    @Value("${reconsentinel.llm.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    @Value("${reconsentinel.llm.base-url:https://generativelanguage.googleapis.com/v1beta/openai/chat/completions}")
    private String baseUrl;

    @Value("${reconsentinel.llm.model:gemini-3.6-flash}")
    private String model;

    private static final String SYSTEM_PROMPT = """
        You are an entity-resolution engine for financial reconciliation.
        Given a raw vendor/payment descriptor from a bank or payment gateway
        statement, output the clean canonical business name and a confidence
        score between 0 and 1.
        Respond with ONLY a JSON object, no prose, no markdown fences:
        {"entity": "<clean name>", "confidence": <0.0-1.0>}
        """;

    public EntityMatch resolve(String rawName) {
        if (rawName == null || rawName.isBlank()) {
            return new EntityMatch(rawName, rawName, 0.0, "FALLBACK");
        }

        EntityMatch cached = cache.get(rawName);
        if (cached != null) {
            return new EntityMatch(rawName, cached.resolvedName(), cached.confidence(), "CACHE");
        }

        if (apiKey == null || apiKey.isBlank()) {
            EntityMatch fb = ruleBasedFallback(rawName);
            cache.put(rawName, fb);
            return fb;
        }

        try {
            EntityMatch resolved = callLlm(rawName);
            cache.put(rawName, resolved);
            return resolved;
        } catch (Exception e) {
            log.warn("LLM entity resolution failed for '{}', falling back: {}", rawName, e.getMessage());
            EntityMatch fb = ruleBasedFallback(rawName);
            cache.put(rawName, fb);
            return fb;
        }
    }

    private EntityMatch callLlm(String rawName) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "temperature", 0.0,
                "messages", new Object[] {
                        Map.of("role", "system", "content", SYSTEM_PROMPT),
                        Map.of("role", "user", "content", "Raw descriptor: " + rawName)
                }
        );

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .timeout(Duration.ofSeconds(35))
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = null;
        int maxRetries = 3;

        // Retry loop with exponential delay for transient server capacity errors (503/429)
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                response = http.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    break; // Success! Exit retry loop.
                }

                // Temporary capacity spike (503) or rate-limit (429)
                if (response.statusCode() == 503 || response.statusCode() == 429) {
                    log.info("Gemini server busy (HTTP {}), retrying attempt {}/{}...", response.statusCode(), attempt, maxRetries);
                    Thread.sleep(1500L * attempt); // Delay 1.5s on attempt 1, 3.0s on attempt 2
                    continue;
                }

                // Non-retriable error (e.g. 400, 401, 404)
                break;
            } catch (Exception e) {
                if (attempt == maxRetries) {
                    throw e;
                }
                Thread.sleep(1500L * attempt);
            }
        }

        if (response == null || response.statusCode() != 200) {
            throw new IllegalStateException("LLM API returned HTTP " +
                    (response != null ? response.statusCode() + ": " + response.body() : "No Response"));
        }

        JsonNode root = mapper.readTree(response.body());
        String content = root.path("choices").get(0).path("message").path("content").asText();

        // Strip accidental markdown fences defensively
        content = content.replaceAll("(?s)```json|```", "").trim();
        JsonNode parsed = mapper.readTree(content);

        String entity = parsed.path("entity").asText(rawName);
        double confidence = parsed.path("confidence").asDouble(0.5);

        return new EntityMatch(rawName, entity, confidence, "LLM");
    }

    /**
     * Deterministic, no-AI fallback: strip common gateway noise tokens.
     */
    private EntityMatch ruleBasedFallback(String rawName) {
        String cleaned = rawName
                .replaceAll("(?i)(RAZORPAYX?\\|*|PAY IN|PAYMENTS?|LTD|PVT)", "")
                .replaceAll("[^A-Za-z0-9 ]", "")
                .trim()
                .replaceAll("\\s+", " ");

        if (cleaned.isBlank()) cleaned = rawName;
        return new EntityMatch(rawName, cleaned, 0.3, "FALLBACK");
    }
}