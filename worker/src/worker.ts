import { Worker } from "bullmq";
import { redisConnection } from "./config/env";
import { processJob } from "./services/jobProcessor";

console.log("Worker starting...");

const worker = new Worker(
  "jobs",
  async (job) => {
    await processJob(job);
  },
  { connection: redisConnection }
);

worker.on("completed", (job) => {
  console.log(`Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.log(`Job failed: ${job?.id}:`, err);
});
