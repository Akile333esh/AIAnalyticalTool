import { Router } from "express";
import asyncHandler from "express-async-handler";
import { authRequired } from "../middleware/authRequired";
import {
  getDashboardLayout,
  saveDashboardLayout,
  getWidgetData,
} from "../services/dashboard.service";
import { StatusCodes } from "http-status-codes";

const router = Router();

// All dashboard routes require auth
router.use(authRequired);

// GET /frontend/dashboard/layout
router.get(
  "/layout",
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const layoutRow = await getDashboardLayout(user.userId);

    let parsed: any;
    try {
      parsed = JSON.parse(layoutRow.LayoutJson);
    } catch {
      parsed = layoutRow.LayoutJson;
    }

    res.json({
      layout: parsed,
    });
  })
);

// POST /frontend/dashboard/layout
router.post(
  "/layout",
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const layout = req.body.layout;
    await saveDashboardLayout(user.userId, layout);
    res.status(StatusCodes.OK).json({ message: "Layout saved" });
  })
);

// GET /frontend/dashboard/widget/:id/data
router.get(
  "/widget/:id/data",
  asyncHandler(async (req, res) => {
    const user = (req as any).user;
    const widgetId = req.params.id;
    const data = await getWidgetData(user.userId, widgetId);
    res.json({ widgetId, data });
  })
);

export default router;
