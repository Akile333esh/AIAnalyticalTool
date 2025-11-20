"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { DashboardLayout, DashboardWidget } from "@/lib/types";
import { normalizeLayoutResponse } from "@/lib/dashboardLayout";
import { Card } from "@/components/ui/Card";
import { WidgetCard } from "@/components/dashboard/WidgetCard";

interface WidgetState {
  loading: boolean;
  error: string | null;
  data: any;
}

export function DashboardGrid() {
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [widgetStates, setWidgetStates] = useState<Record<string, WidgetState>>(
    {}
  );

  // Load dashboard layout
  const loadLayout = async () => {
    setLayoutLoading(true);
    setLayoutError(null);
    try {
      const res = await apiFetch<any>("/frontend/dashboard/layout", {
        auth: true
      });
      const normalized = normalizeLayoutResponse(res);
      setLayout(normalized);
    } catch (err: any) {
      setLayoutError(err.message ?? "Failed to load layout");
      setLayout(null);
    } finally {
      setLayoutLoading(false);
    }
  };

  useEffect(() => {
    void loadLayout();
  }, []);

  // Load data for a single widget
  const loadWidgetData = async (widget: DashboardWidget) => {
    setWidgetStates((prev) => ({
      ...prev,
      [widget.id]: {
        loading: true,
        error: null,
        data: prev[widget.id]?.data
      }
    }));

    try {
      const res = await apiFetch<{ widgetId: string; data: any }>(
        `/frontend/dashboard/widget/${encodeURIComponent(widget.id)}/data`,
        { auth: true }
      );
      const data = (res as any).data ?? res;
      setWidgetStates((prev) => ({
        ...prev,
        [widget.id]: {
          loading: false,
          error: null,
          data
        }
      }));
    } catch (err: any) {
      setWidgetStates((prev) => ({
        ...prev,
        [widget.id]: {
          loading: false,
          error: err.message ?? "Failed to load widget data",
          data: null
        }
      }));
    }
  };

  // Whenever layout changes, load all widgets
  useEffect(() => {
    if (!layout) return;
    for (const w of layout.widgets) {
      void loadWidgetData(w);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout?.widgets?.map((w) => w.id).join(",")]);

  const renderData = (widget: DashboardWidget, state: WidgetState | undefined) => {
    if (!state || state.loading) {
      return <div className="text-xs text-slate-500">Loading…</div>;
    }
    if (state.error) {
      return (
        <div className="text-xs text-red-300">
          {state.error}
        </div>
      );
    }

    const data = state.data;

    // Generic rendering based on shape
    if (Array.isArray(data)) {
      if (data.length === 0) {
        return (
          <div className="text-xs text-slate-500">No rows.</div>
        );
      }
      if (typeof data[0] === "object" && data[0] !== null) {
        const cols = Object.keys(data[0]);
        return (
          <div className="max-h-64 overflow-auto text-xs">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr>
                  {cols.map((c) => (
                    <th
                      key={c}
                      className="border-b border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300"
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 100).map((row: any, idx: number) => (
                  <tr
                    key={idx}
                    className="odd:bg-slate-950/60 even:bg-slate-900/60"
                  >
                    {cols.map((c) => (
                      <td
                        key={c}
                        className="border-b border-slate-800 px-2 py-1 align-top"
                      >
                        {String(row[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      // Primitive array
      return (
        <pre className="max-h-64 overflow-auto text-[11px] text-slate-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }

    if (typeof data === "object" && data !== null) {
      // For KPIs / single objects, show key→value list
      if (widget.type === "kpi") {
        return (
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(data).map(([k, v]) => (
              <div
                key={k}
                className="rounded-md bg-slate-900/80 px-3 py-2"
              >
                <div className="text-[10px] uppercase tracking-wide text-slate-400">
                  {k}
                </div>
                <div className="text-sm font-semibold text-slate-50">
                  {String(v)}
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <pre className="max-h-64 overflow-auto text-[11px] text-slate-200">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    }

    // Fallback: primitive
    return (
      <div className="text-xs text-slate-200">{String(data)}</div>
    );
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-100">
            Capacity dashboard
          </div>
          <div className="text-xs text-slate-500">
            Widgets defined in <code>Dashboards.LayoutJson</code> and served by{" "}
            <code>/frontend/dashboard/widget/:id/data</code>.
          </div>
        </div>
        <button
          className="text-xs text-brand hover:text-brand-dark"
          onClick={() => layout && void loadLayout()}
        >
          Refresh layout
        </button>
      </div>

      {layoutLoading && (
        <div className="text-xs text-slate-500">Loading layout…</div>
      )}
      {layoutError && (
        <div className="text-xs text-red-300">{layoutError}</div>
      )}

      {!layoutLoading && layout && layout.widgets.length === 0 && (
        <div className="text-xs text-slate-500">
          No widgets defined. Use the layout editor above to add some.
        </div>
      )}

      {!layoutLoading && layout && layout.widgets.length > 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {layout.widgets.map((w) => (
            <WidgetCard key={w.id} title={w.title}>
              {renderData(w, widgetStates[w.id])}
            </WidgetCard>
          ))}
        </div>
      )}
    </Card>
  );
}
