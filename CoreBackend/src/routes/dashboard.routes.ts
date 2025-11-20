import { Router } from "express";
import asyncHandler from "express-async-handler";
import { authRequired } from "../middleware/authRequired";
import {
  getAllDashboards,
  getDashboardById,
  createDashboard,
  updateDashboard,
  getWidgetData,
  createSavedWidget // <--- Import this
} from "../services/dashboard.service";
import { StatusCodes } from "http-status-codes";

const router = Router();

router.use(authRequired);

// --- DASHBOARDS ---

router.get("/list", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const dashboards = await getAllDashboards(user.userId);
  res.json(dashboards);
}));

router.get("/:id", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const dashboard = await getDashboardById(user.userId, Number(req.params.id));
  if (!dashboard) {
    res.status(404).json({ message: "Dashboard not found" });
    return;
  }
  res.json(dashboard);
}));

router.post("/", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { name, layout } = req.body;
  const id = await createDashboard(user.userId, name || "New Dashboard", layout || { widgets: [] });
  res.json({ id, message: "Created" });
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { layout } = req.body;
  await updateDashboard(user.userId, Number(req.params.id), layout);
  res.json({ message: "Updated" });
}));

// --- WIDGETS ---

// POST /frontend/dashboard/widget -> Save a new widget (SQL) to DB
router.post("/widget", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const { name, type, sqlQuery } = req.body;
  
  if (!name || !sqlQuery) {
    res.status(400).json({ message: "Name and SqlQuery are required" });
    return;
  }

  const widgetId = await createSavedWidget(user.userId, name, type || 'table', sqlQuery);
  res.json({ widgetId, message: "Widget saved" });
}));

// GET /frontend/dashboard/widget/:id/data -> Execute saved SQL
router.get("/widget/:id/data", asyncHandler(async (req, res) => {
  const user = (req as any).user;
  const data = await getWidgetData(user.userId, req.params.id);
  res.json({ data });
}));

export default router;
