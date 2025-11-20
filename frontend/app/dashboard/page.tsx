"use client";

import { useState, useEffect } from "react";
import { ProtectedClient } from "@/components/auth/ProtectedClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { apiFetch } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import type { DashboardLayout } from "@/lib/types";

export default function DashboardPage() {
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [activeDashboard, setActiveDashboard] = useState<DashboardLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // 1. Load list of dashboards on mount
  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/dashboard/list", { auth: true });
      setDashboards(data);
    } catch (e) {
      console.error("Failed to load dashboards", e);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load a specific dashboard details
  const loadDashboard = async (id: number) => {
    try {
      setLoading(true);
      const data = await apiFetch(`/dashboard/${id}`, { auth: true });
      setActiveDashboard(data);
    } catch (e) {
      console.error("Failed to load dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Create a new empty dashboard
  const createDashboard = async () => {
    const name = prompt("Enter Dashboard Name:");
    if (!name) return;
    
    try {
      await apiFetch("/dashboard", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ name })
      });
      loadList(); // Refresh list
    } catch (e) {
      alert("Failed to create dashboard");
    }
  };

  // 4. Save Layout Changes (Resize/Move)
  const saveLayout = async () => {
    if (!activeDashboard || !activeDashboard.id) return;
    try {
      await apiFetch(`/dashboard/${activeDashboard.id}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ layout: { widgets: activeDashboard.widgets } })
      });
      setIsEditing(false);
    } catch (e) {
      alert("Failed to save layout");
    }
  };

  // 5. Handle resizing widgets (Simple toggle for demo: 1 -> 2 -> 3 -> 1 cols)
  const toggleWidgetSize = (widgetId: string) => {
    if (!activeDashboard) return;
    
    const updatedWidgets = activeDashboard.widgets.map(w => {
      if (w.id === widgetId) {
        const currentSpan = w.colSpan || 1;
        return { ...w, colSpan: currentSpan >= 3 ? 1 : currentSpan + 1 };
      }
      return w;
    });

    setActiveDashboard({ ...activeDashboard, widgets: updatedWidgets });
  };

  return (
    <ProtectedClient>
      <div className="flex min-h-screen bg-slate-950 text-slate-200">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6">
            
            {/* VIEW 1: LIST OF DASHBOARDS (Tile View) */}
            {!activeDashboard && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-white">Dashboards</h1>
                    <p className="text-slate-400 text-sm">Select a dashboard to view analytics</p>
                  </div>
                  <Button onClick={createDashboard} className="shadow-lg shadow-brand/20">+ New Dashboard</Button>
                </div>

                {loading ? (
                  <div className="text-slate-500 text-sm">Loading dashboards...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dashboards.map((d) => (
                      <div 
                        key={d.Id}
                        onClick={() => loadDashboard(d.Id)}
                        className="group relative h-40 rounded-xl border border-slate-800 bg-slate-900/50 p-6 hover:border-brand hover:bg-slate-900 cursor-pointer transition-all hover:shadow-xl hover:shadow-brand/10"
                      >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-5 h-5 text-slate-500 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                        <h3 className="font-bold text-lg text-slate-100 mb-2">{d.Name}</h3>
                        <div className="text-xs text-slate-500">
                          Created: {new Date(d.CreatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                    
                    {/* Empty State */}
                    {dashboards.length === 0 && (
                      <div className="col-span-full text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                        No dashboards found. Create one to get started.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: SINGLE DASHBOARD (Grid View) */}
            {activeDashboard && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setActiveDashboard(null)} 
                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      Back
                    </button>
                    <h1 className="text-xl font-bold text-white">{activeDashboard.name}</h1>
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" onClick={() => { setIsEditing(false); loadDashboard(activeDashboard.id!); }}>Cancel</Button>
                        <Button onClick={saveLayout} className="bg-emerald-600 hover:bg-emerald-700 text-white">Save Layout</Button>
                      </>
                    ) : (
                      <Button variant="secondary" onClick={() => setIsEditing(true)}>Edit Layout</Button>
                    )}
                  </div>
                </div>

                {/* We reuse the DashboardGrid component, but we need to pass the 
                    resize handler if we are in edit mode. 
                    
                    Since the standard DashboardGrid component might not accept a 'onResize' prop 
                    depending on your implementation, you can wrap it here or 
                    modify DashboardGrid.tsx to accept children or render props.
                    
                    For this example, we'll modify how we render it slightly:
                */}
                
                <div className="relative">
                  {isEditing && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600/90 text-white text-xs px-3 py-1 rounded-full z-10 animate-bounce">
                      Edit Mode Active: Click "Resize" on widgets to change their width.
                    </div>
                  )}
                  
                  {/* If you want resizing controls, we can map manually here 
                      OR update DashboardGrid.tsx to accept an 'isEditing' prop.
                      Let's map manually here for maximum flexibility.
                   */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {activeDashboard.widgets.map((w) => (
                      <div 
                        key={w.id} 
                        className={`relative transition-all duration-300 ${
                          w.colSpan === 2 ? "md:col-span-2" : w.colSpan === 3 ? "md:col-span-3" : ""
                        }`}
                      >
                        {/* Import the WidgetCard & GenericWidget logic from DashboardGrid.tsx essentially */}
                        <DashboardGrid widgets={[w]} /> 
                        
                        {isEditing && (
                          <div className="absolute top-3 right-3 z-20">
                            <button 
                              onClick={() => toggleWidgetSize(w.id)}
                              className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] px-2 py-1 rounded border border-slate-600 shadow-lg"
                            >
                              Resize ({w.colSpan || 1}x)
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {activeDashboard.widgets.length === 0 && (
                      <div className="col-span-full text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                        This dashboard is empty. <br/> 
                        Go to the <a href="/" className="text-brand hover:underline">Workspace</a> to generate and save widgets.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </ProtectedClient>
  );
}
