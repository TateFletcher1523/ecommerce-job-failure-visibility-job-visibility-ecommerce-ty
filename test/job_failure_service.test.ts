import assert from "node:assert/strict";
import { shouldAlert, jobInput } from "../src/job_failure_service.js";

const firstAttempt = jobInput.parse({job: "checkout", orderId: "o-1", attempt: 1, errorMessage: "payment declined"});
assert.equal(shouldAlert(firstAttempt), false);
assert.equal(shouldAlert({...firstAttempt, attempt: 3}), true);
assert.equal(shouldAlert({...firstAttempt, job: "order-updates"}), true);
console.log("job alert decision tests passed");
