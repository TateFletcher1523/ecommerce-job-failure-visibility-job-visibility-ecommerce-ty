import { z } from "zod";
import { captureFailure } from "./infrai_client.js";

export const jobInput = z.object({
  job: z.enum(["checkout", "fulfillment", "receipts", "order-updates"]),
  orderId: z.string().min(1),
  attempt: z.number().int().positive(),
  errorMessage: z.string().min(1)
});
export type JobInput = z.infer<typeof jobInput>;

export function shouldAlert(input: JobInput): boolean {
  return input.attempt >= 3 || input.job === "order-updates";
}

export async function reportJobFailure(raw: unknown): Promise<{ alert: boolean; captured: boolean; job: string }> {
  const input = jobInput.parse(raw);
  const alert = shouldAlert(input);
  await captureFailure({
    title: `scheduled ${input.job} failed`,
    message: input.errorMessage,
    level: alert ? "error" : "warning",
    fingerprint: ["ecommerce", input.job],
    exception: input.errorMessage,
    context: {job: input.job, orderId: input.orderId, attempt: String(input.attempt)}
  });
  return {alert, captured: true, job: input.job};
}

if (process.argv[1]?.endsWith("job_failure_service.ts")) {
  const sample = {job: "fulfillment", orderId: "order-1042", attempt: 3, errorMessage: "carrier reservation rejected"};
  reportJobFailure(sample).then((result) => console.log(JSON.stringify(result))).catch((error) => { console.error(error.message); process.exitCode = 1; });
}
