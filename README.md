# ReconSentinel: High-Performance Fintech Reconciliation Engine

ReconSentinel is an enterprise-grade, deterministic financial settlement and reconciliation command center built for high-volume, multi-source payment operations. Designed to eliminate manual exception processing, it pairs a high-throughput Java 21 engine with an immutable SHA-256 cryptographic audit chain and a high-density operational workbench.

---

## Technical Architecture

ReconSentinel follows a decoupled, production-grade microservice architecture designed for zero-trust accuracy and ultra-low latency.

* **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide Icons (Hosted on Vercel)
* **Backend:** Java 21 (Virtual Threads / Project Loom), Spring Boot 3, Docker (Hosted on Railway)
* **Performance Engine:** Polars / Fast CSV Parsers, Strict BigDecimal Precision
* **Cryptographic Engine:** SHA-256 Merkle Hash Generation for Audit Trail Verification

---

## Key Features

* **Java 21 Virtual Threads Engine:** Engineered to process thousands of multi-source records (Bank MT940, Gateway Settlement Reports, OMS Logs) concurrently with sub-millisecond thread overhead and zero GC pause stalls.
* **Tamper-Evident Ledger:** Automatically generates an immutable SHA-256 cryptographic Merkle chain for every processed batch, ensuring regulatory compliance and audit readiness.
* **AI Schema & Entity Resolution:** Normalizes disparate transaction headers and maps entities across heterogeneous payment rails (Razorpay, Stripe, HDFC, Gateway logs).
* **Deterministic Precision:** Employs strict numerical handling via BigDecimal to prevent floating-point rounding errors on fee variance, tax splits, and multi-currency reconciliations.
* **Fintech Command Center UI:** High-density operational dashboard equipped with live batch stream monitoring, throughput counters, memory consumption gauges, and real-time exception triage drawers.

---

## API Specifications

The Spring Boot backend exposes a clean RESTful interface:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | /api/reconcile/upload | Ingests multipart files (bank, gateway, oms) and runs batch reconciliation. |
| GET | /api/reconcile/results | Returns summary metrics, TPS counts, and transaction exception records. |
| GET | /api/reconcile/verify | Validates the integrity of the SHA-256 cryptographic audit chain. |

---

## Local Development Setup

### Prerequisites
* Java 21 or higher
* Node.js 18+ & npm
* Docker (optional)

### 1. Backend Setup (Spring Boot)

```bash
# Clone the repository
git clone [https://github.com/YOUR_USERNAME/reconsentinel.git](https://github.com/YOUR_USERNAME/reconsentinel.git)
cd reconsentinel

# Build and package the application
./mvnw clean package -DskipTests

# Run the Spring Boot application
java -jar target/*.jar
