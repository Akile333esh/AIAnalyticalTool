"use client";

import { useState } from "react";
import { apiFetch, API_BASE_URL } from "@/lib/apiClient";
import { getAccessToken } from "@/lib/auth";
import { ProtectedClient } from "@/components/auth/ProtectedClient";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [results, setResults] = useState<any[] | null>(null);
  // We store the generated SQL to save it later
  const [generatedSql, setGeneratedSql] = useState<string | null>(null); 
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  
  // Dashboard Save State
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [dashboards, setDashboards] = useState<any[]>([]);
  const [selectedDashId, setSelectedDashId] = useState<number | null>(null);
  const [widgetName, setWidgetName] = useState("");

  const runJob = async () => {
    setIsModalOpen(true);
    setEvents([]);
    setResults(null);
    setGeneratedSql(null);
    
    try {
      const job = await apiFetch("/jobs", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ naturalLanguageQuery: query })
      });
      setJobId(job.jobId);
      startStream(job.jobId, job.jobToken);
    } catch (e) {
      console.error(e);
    }
  };

  const startStream = async (id: string, token: string) => {
    const accessToken = getAccessToken();
    const url = `${API_BASE_URL}/v2/jobs/${id}/stream?t=${token}`;
    
    const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` }});
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n");
      
      for (const line of lines) {
        if (line.startsWith("data:")) {
          try {
            const data = JSON.parse(line.replace("data: ", ""));
            setEvents(prev => [...prev, data]);
            
            // Capture SQL if provided in event
            if (data.sqlQuery) setGeneratedSql(data.sqlQuery);
            
            if (data.type === "done") {
               setResults(data.rows);
               // Auto-suggest a widget name based on query
               setWidgetName(query.substring(0, 30) + (query.length > 30 ? "..." : ""));
            }
          } catch (e) { console.error("SSE Parse Error", e); }
        }
      }
    }
  };

  const cancelJob = async () => {
    if (jobId) {
      await apiFetch(`/jobs/${jobId}/cancel`, { method: "POST", auth: true });
      setJobId(null);
      setIsModalOpen(false); 
    }
  };

  const loadDashboards = async () => {
    if (!generatedSql) {
      alert("No SQL generated to save!");
      return;
    }
    const data = await apiFetch("/dashboard/list", { auth: true });
    setDashboards(data);
    setIsSaveModalOpen(true);
  };

  const saveToDashboard = async () => {
    if (!selectedDashId || !generatedSql) return;
    
    try {
      // 1. Create the SavedWidget in the DB
      const widgetRes = await apiFetch("/dashboard/widget", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          name: widgetName,
          type: viewMode,
          sqlQuery: generatedSql
        })
      });

      const newWidgetId = widgetRes.widgetId.toString();

      // 2. Get current dashboard layout
      const dash = await apiFetch(`/dashboard/${selectedDashId}`, { auth: true });
      
      // 3. Add new widget reference to layout
      const updatedLayout = {
        widgets: [
          ...dash.widgets, 
          {
            id: newWidgetId, 
            title: widgetName,
            type: viewMode,
            colSpan: 1
          }
        ]
      };

      // 4. Update Dashboard Layout
      await apiFetch(`/dashboard/${selectedDashId}`, {
        method: "PUT",
        auth: true,
        body: JSON.stringify({ layout: updatedLayout })
      });

      setIsSaveModalOpen(false);
      alert("Widget Saved Successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to save");
    }
  };

  return (
    <ProtectedClient>
      <div className="flex min-h-screen bg-slate-950 text-slate-200">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-4xl space-y-6">
              
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white tracking-tight">AI Analytics Workspace</h1>
                <p className="text-slate-400 mt-2">Transform natural language into actionable insights</p>
              </div>

              <Card className="p-1 border-slate-800 bg-slate-900/50 shadow-xl">
                <div className="relative">
                  <textarea 
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-4 text-white focus:ring-2 focus:ring-brand focus:border-transparent outline-none transition-all min-h-[120px] resize-none"
                    placeholder="Ask about your infrastructure (e.g., 'Show top 5 servers by CPU usage over the last 24 hours')"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button onClick={runJob} className="shadow-lg shadow-brand/20">Generate Report</Button>
                  </div>
                </div>
              </Card>

              {/* RESULTS AREA */}
              {results && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Card className="p-0 overflow-hidden border-slate-800">
                    <div className="bg-slate-900/80 border-b border-slate-800 p-4 flex justify-between items-center">
                      <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                        <button 
                          onClick={() => setViewMode("table")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          Table
                        </button>
                        <button 
                          onClick={() => setViewMode("chart")}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${viewMode === "chart" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          Chart
                        </button>
                      </div>
                      <Button onClick={loadDashboards} variant="outline" size="sm">
                        + Save to Dashboard
                      </Button>
                    </div>

                    <div className="p-4 bg-slate-950/50">
                      {viewMode === "table" ? (
                        <div className="overflow-auto max-h-[500px] rounded-lg border border-slate-800">
                          <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900 text-slate-200 sticky top-0 z-10">
                              <tr>
                                {Object.keys(results[0] || {}).map(k => (
                                  <th key={k} className="p-3 font-semibold border-b border-slate-700 whitespace-nowrap">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                              {results.map((row, i) => (
                                <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                                  {Object.values(row).map((v: any, j) => (
                                    <td key={j} className="p-3 font-mono text-xs">{String(v)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="h-80 flex items-end justify-center gap-2 p-4 bg-slate-900/20 rounded-lg border border-slate-800 border-dashed">
                           {/* Simple CSS Chart */}
                           {results.slice(0, 30).map((row, i) => {
                             const val = Object.values(row).find(v => typeof v === 'number') as number || 0;
                             return (
                               <div key={i} className="flex-1 bg-brand/80 hover:bg-brand transition-all relative group rounded-t-sm min-w-[4px]" style={{ height: `${Math.min(val, 100)}%` }}>
                                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[10px] py-1 px-2 rounded border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                                   {val}
                                 </div>
                               </div>
                             )
                           })}
                           {results.length === 0 && <div className="text-slate-500">No numeric data found to chart</div>}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* JOB STATUS MODAL */}
        {isModalOpen && !results && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
             <Card className="w-[400px] p-0 overflow-hidden border-brand/30 shadow-2xl shadow-brand/10">
               <div className="bg-slate-900 p-4 border-b border-slate-800">
                 <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                   <span className="relative flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-brand"></span>
                   </span>
                   Processing Query...
                 </h3>
               </div>
               <div className="bg-slate-950 p-4 min-h-[200px] max-h-[300px] overflow-y-auto font-mono text-xs space-y-3">
                 {events.map((e, i) => (
                   <div key={i} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                     <div className="min-w-[60px] text-slate-500 text-right uppercase tracking-wider text-[10px] pt-0.5">{e.type}</div>
                     <div className="text-slate-300 border-l border-slate-800 pl-3">{e.message}</div>
                   </div>
                 ))}
                 <div ref={(el) => el?.scrollIntoView({ behavior: "smooth" })} />
               </div>
               <div className="p-4 bg-slate-900 border-t border-slate-800">
                 <Button onClick={cancelJob} variant="destructive" className="w-full">Cancel Job</Button>
               </div>
             </Card>
          </div>
        )}

        {/* SAVE DASHBOARD MODAL */}
        {isSaveModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
            <Card className="w-96 p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Save Widget</h3>
              <div>
                <label className="text-xs text-slate-400">Widget Name</label>
                <input 
                  className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm mt-1" 
                  value={widgetName} 
                  onChange={e => setWidgetName(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Select Dashboard</label>
                <div className="mt-1 space-y-1 max-h-40 overflow-y-auto">
                   {dashboards.map(d => (
                     <div 
                      key={d.Id} 
                      onClick={() => setSelectedDashId(d.Id)}
                      className={`p-2 rounded text-sm cursor-pointer border ${selectedDashId === d.Id ? "border-brand bg-brand/10 text-brand" : "border-slate-700 hover:bg-slate-800 text-slate-300"}`}
                     >
                       {d.Name}
                     </div>
                   ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="ghost" onClick={() => setIsSaveModalOpen(false)}>Cancel</Button>
                <Button onClick={saveToDashboard} disabled={!selectedDashId || !widgetName}>Save Widget</Button>
              </div>
            </Card>
          </div>
        )}

      </div>
    </ProtectedClient>
  );
}
