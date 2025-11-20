import { Router } from "express";
import asyncHandler from "express-async-handler";
import { authRequired } from "../middleware/authRequired";
import { createJob } from "../services/jobs.service";
import { initJobSseStream } from "../services/sse.service";

const router = Router();

// All job routes require auth
router.use(authRequired);

// POST /jobs -> create new job
router.post(
  "/jobs",
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const { naturalLanguageQuery, timeRange, metricType, filters } = req.body;

    const { jobId, jobToken } = await createJob(user.userId, {
      naturalLanguageQuery,
      timeRange,
      metricType,
      filters,
    });

    res.json({ jobId, jobToken });
  })
);

// GET /v2/jobs/:id/stream?t=jobToken -> SSE stream
router.get(
  "/v2/jobs/:id/stream",
  (req, res) => {
    const jobId = req.params.id;
    const jobToken = req.query.t as string;

    // user is already checked via authRequired
    initJobSseStream(req, res, jobId, jobToken);
  }
);

export default router;
