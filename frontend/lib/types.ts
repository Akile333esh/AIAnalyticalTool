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
  sqlQuery?: string;
  sqlExplanation?: string;
  rows?: any[];
  error?: string;
}

export interface Report {
  Id: number;
  Name: string;
  Description?: string;
  FolderId?: number | null;
  CreatedAt?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "kpi" | "timeseries" | "table" | "bar";
  queryKey?: string;
}

export interface DashboardLayout {
  id?: number;
  name?: string;
  widgets: DashboardWidget[];
}
