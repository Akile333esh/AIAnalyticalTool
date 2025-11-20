export type UserRole = "user" | "admin";

export interface User {
  userId: number;
  email?: string;
  role: UserRole;
}

export type JobEventType = "step" | "progress" | "reasoning" | "done" | "error";

export interface JobEvent {
  type: JobEventType;
  message?: string;
  progress?: number;
  etaSeconds?: number;
  sqlQuery?: string;       // ✅ Needed to capture SQL for saving
  sqlExplanation?: string;
  rows?: any[];
  error?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "kpi" | "timeseries" | "table" | "bar" | "chart";
  colSpan?: number;        // ✅ Added for grid resizing (1, 2, or 3)
}

export interface DashboardLayout {
  id?: number;
  name?: string;
  widgets: DashboardWidget[];
  CreatedAt?: string;
}

export interface SavedWidget {
  id: number;
  name: string;
  type: string;
  sqlQuery: string;
}
