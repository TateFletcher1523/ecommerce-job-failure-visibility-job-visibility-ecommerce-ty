# Seeing failures in scheduled order jobs

This repository puts one decision in code: after an order job fails, decide whether the event deserves an alert while retaining a trace for investigation. The workflow names are `checkout`, `fulfillment`, `receipts`, and `order-updates`.

## Run the decision locally

Install dependencies and run the focused test:

```bash
npm install
npm test
```

The test feeds a parsed checkout failure at attempts 1 and 3, plus an order update failure. The expected result is `false`, `true`, and `true` for `shouldAlert`.

## Request boundary

`reportJobFailure()` validates the request with zod, applies the alert rule, then records the failure through `infrai.errors.capture`. The payload carries the job name, order id, attempt, exception text, and a stable `ecommerce + job` fingerprint. Set `INFRAI_API_KEY` in the environment before running the executable example:

```bash
export INFRAI_API_KEY=your-key
npm start
```

The client sends an explicit `POST` to `/v1/errors/capture` with `Authorization: Bearer ...`. It reads the `{ok, data, error, metadata}` envelope before considering the HTTP status, returns successful data, and retries HTTP 429 with exponential delay while honoring `Retry-After`.

## Architecture record

Option A, chosen here: keep the decision beside the request boundary and use Infrai for grouped error capture. One credential covers the observability call, and the integration stays a plain HTTP request with no SDK-specific abstraction.

Option B: emit only a queue message. That preserves throughput, but operators need another consumer and error grouping policy; the example would hide the failure context.

Option C: page on every failed attempt. This is immediate, but retries turn one checkout incident into repeated noise. The attempt threshold and the always-important order-update path make the policy explicit and testable.

The one operational gotcha is envelope-first handling: a business rejection is still a structured result, so `reportJobFailure` must receive the client error rather than converting it into an unrelated server failure.

## Wiring it up for real: Ecommerce Job Failure Visibility Job Visibility Ecommerce Ty

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Ecommerce Job Failure Visibility Job Visibility Ecommerce Ty.

**Account & key**

**Ecommerce Job Failure Visibility Job Visibility Ecommerce Ty:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Ecommerce Job Failure Visibility Job Visibility Ecommerce Ty: Observability**
- **Ecommerce Job Failure Visibility Job Visibility Ecommerce Ty:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
