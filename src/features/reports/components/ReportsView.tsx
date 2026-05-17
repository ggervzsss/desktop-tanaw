import React, { useState } from "react";
import { Activity, AlertTriangle, FileText, History, MessageSquare, Plus, RotateCcw, Send, TrendingDown, TrendingUp } from "lucide-react";
import { DotFormModal } from "./DotFormModal";
import { ReportLedgerTable } from "./ReportLedgerTable";
import { SubmitReportDialog } from "./SubmitReportDialog";
import { Card } from "../../../components/Card";
import { SYSTEM_LOGS } from "../../../lib/enterpriseMockData";
import type { DemoBreakdown, ReportRecord, SystemLogPeriod } from "../../../types/enterprise";

type ReportsViewProps = {
  reportsHistory: ReportRecord[];
  setReportsHistory: React.Dispatch<React.SetStateAction<ReportRecord[]>>;
};

export function ReportsView({ reportsHistory, setReportsHistory }: ReportsViewProps) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [period, setPeriod] = useState<SystemLogPeriod>("May 2026");
  const [notes, setNotes] = useState("");
  const [demo, setDemo] = useState<DemoBreakdown>({
    thisProvMale: "",
    thisProvFemale: "",
    otherProvMale: "",
    otherProvFemale: "",
    foreignMale: "",
    foreignFemale: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const activeReport = activeReportId ? (reportsHistory.find((r) => r.id === activeReportId) ?? null) : null;
  const isReadOnly = activeReport ? !["Draft", "Returned for Revision"].includes(activeReport.status) : false;

  const metrics = SYSTEM_LOGS[period] ?? { entries: 0, peak: 0, unique: 0 };
  const periodKeys = Object.keys(SYSTEM_LOGS) as SystemLogPeriod[];
  const currIndex = periodKeys.indexOf(period);
  const prevPeriod = currIndex < periodKeys.length - 1 ? periodKeys[currIndex + 1] : null;
  const prevMetrics = prevPeriod ? SYSTEM_LOGS[prevPeriod] : null;
  const uniqueTrend = prevMetrics ? Math.round(((metrics.unique - prevMetrics.unique) / prevMetrics.unique) * 100) : 0;

  const isError = metrics.peak > metrics.entries;

  const handleGenerateNew = () => {
    setActiveReportId(null);
    setPeriod("May 2026");
    setNotes("");
    setDemo({
      thisProvMale: "",
      thisProvFemale: "",
      otherProvMale: "",
      otherProvFemale: "",
      foreignMale: "",
      foreignFemale: "",
    });
  };

  const handleViewReport = (report: ReportRecord) => {
    setActiveReportId(report.id);
    setPeriod(report.period || "May 2026");
    setNotes(report.notes || "");
    setDemo(
      report.demo || {
        thisProvMale: "",
        thisProvFemale: "",
        otherProvMale: "",
        otherProvFemale: "",
        foreignMale: "",
        foreignFemale: "",
      },
    );
  };

  const executeSubmit = () => {
    const now = new Date().toLocaleString("en-US", {
      hour12: true,
      hour: "numeric",
      minute: "2-digit",
    });
    const todayDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    if (activeReportId) {
      setReportsHistory((prev) =>
        prev.map((r) => {
          if (r.id === activeReportId) {
            return {
              ...r,
              status: "Resubmitted",
              period,
              demo,
              notes,
              auditTrail: [
                ...(r.auditTrail || []),
                {
                  time: `${todayDate} ${now}`,
                  action: "Report Resubmitted",
                  actor: "SPL Market Admin",
                },
              ],
            };
          }
          return r;
        }),
      );
    } else {
      const newReport = {
        id: `REP-${new Date().getTime().toString().slice(-6)}`,
        date: period,
        status: "Submitted",
        entries: metrics.entries,
        unique: metrics.unique,
        period,
        demo,
        notes,
        auditTrail: [
          {
            time: `${todayDate} ${now}`,
            action: "Draft Created",
            actor: "SPL Market Admin",
          },
          {
            time: `${todayDate} ${now}`,
            action: "Report Submitted",
            actor: "SPL Market Admin",
          },
        ],
        remarks: null,
      };
      setReportsHistory([newReport, ...reportsHistory]);
    }
    setShowConfirm(false);
    handleGenerateNew();
  };

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {showPreview && <DotFormModal onClose={() => setShowPreview(false)} period={period} metrics={metrics} demo={demo} notes={notes} />}

      {showConfirm && <SubmitReportDialog onCancel={() => setShowConfirm(false)} onConfirm={executeSubmit} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Report Generation & Submission</h2>
          <p className="mt-1 text-sm text-gray-500">Generate LGU-required DOT reports using system-verified metrics.</p>
        </div>
        <button
          onClick={handleGenerateNew}
          className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#111827] shadow-sm transition-colors hover:bg-gray-50"
        >
          <Plus size={16} /> New Draft
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          className={`h-fit rounded-sm border-t-4 p-6 shadow-md transition-colors lg:col-span-1 ${isReadOnly ? "border-t-gray-400" : activeReport?.status === "Returned for Revision" ? "border-t-[#ffd200]" : "border-t-[#065f46]"}`}
        >
          <h3 className="mb-5 flex items-center gap-2 border-b border-gray-100 pb-2 text-sm font-bold tracking-wider text-[#111827] uppercase">
            {isReadOnly ? <History size={18} className="text-gray-500" /> : <FileText size={18} className="text-[#065f46]" />}
            {isReadOnly ? "Report Details (Locked)" : activeReportId ? `Edit Report: ${activeReportId}` : "Draft Generator"}
          </h3>

          {activeReport?.status === "Returned for Revision" && (
            <div className="mb-5 rounded-sm border border-[#ffd200]/40 bg-[#ffd200]/10 p-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-[#a40e0e] uppercase">
                <MessageSquare size={14} /> Staff Remarks
              </h4>
              <p className="text-xs leading-relaxed font-medium text-[#a40e0e]">{activeReport.remarks}</p>
            </div>
          )}

          {isError && !isReadOnly && (
            <div className="mb-5 flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 p-4 shadow-inner">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
              <div>
                <h4 className="mb-1 text-[10px] font-bold tracking-wider text-red-800 uppercase">Data Validation Error</h4>
                <p className="text-xs leading-relaxed text-red-700">Peak Occupancy cannot exceed Total Entries. Check your edge logic configs before submitting.</p>
              </div>
            </div>
          )}

          <div className={`space-y-5 ${isReadOnly ? "opacity-80" : ""}`}>
            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Reporting Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as SystemLogPeriod)}
                disabled={isReadOnly}
                className="w-full rounded-sm border border-gray-300 bg-white p-2.5 text-sm font-medium text-[#111827] transition-all outline-none focus:border-[#065f46] disabled:bg-gray-50"
              >
                {Object.keys(SYSTEM_LOGS).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-sm border border-gray-200 bg-gray-50 p-4 shadow-inner">
              <p className="mb-3 text-[10px] font-bold tracking-widest text-gray-500 uppercase">System Locked Metrics</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Total Entries</span>
                  <span className="rounded-sm border border-gray-200 bg-white px-2 py-0.5 font-mono font-bold text-[#111827]">{metrics.entries.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-600">Peak Occupancy</span>
                  <span className="rounded-sm border border-gray-200 bg-white px-2 py-0.5 font-mono font-bold text-[#111827]">{metrics.peak.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-sm">
                  <span className="font-semibold text-[#065f46]">Est. Unique Count</span>
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-lg leading-none font-bold text-[#065f46]">{metrics.unique.toLocaleString()}</span>
                    {prevMetrics && (
                      <span
                        className={`mt-1.5 flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${uniqueTrend >= 0 ? "border border-green-200 bg-green-100 text-green-700" : "border border-red-200 bg-red-100 text-red-700"}`}
                      >
                        {uniqueTrend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {Math.abs(uniqueTrend)}% vs Prev
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-[9px] tracking-wider text-gray-400 uppercase">* Edge logs data. Non-editable.</p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Demographics Breakdown</label>
              <div className="grid grid-cols-3 gap-2 rounded-sm border border-gray-200 bg-white p-2">
                <div className="border-r border-gray-100 pr-2">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="This Province">
                    This Prov.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.thisProvMale}
                      onChange={(e) => setDemo({ ...demo, thisProvMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.thisProvFemale}
                      onChange={(e) => setDemo({ ...demo, thisProvFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <div className="border-r border-gray-100 pr-2 pl-1">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="Other Province">
                    Other Prov.
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.otherProvMale}
                      onChange={(e) => setDemo({ ...demo, otherProvMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.otherProvFemale}
                      onChange={(e) => setDemo({ ...demo, otherProvFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
                <div className="pl-1">
                  <p className="mb-2 truncate text-[9px] font-bold text-[#111827] uppercase" title="Foreign Country">
                    Foreign
                  </p>
                  <div className="space-y-2">
                    <input
                      type="number"
                      placeholder="M"
                      disabled={isReadOnly}
                      value={demo.foreignMale}
                      onChange={(e) => setDemo({ ...demo, foreignMale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                    <input
                      type="number"
                      placeholder="F"
                      disabled={isReadOnly}
                      value={demo.foreignFemale}
                      onChange={(e) => setDemo({ ...demo, foreignFemale: e.target.value })}
                      className="w-full rounded-sm border border-gray-300 p-1.5 text-center text-xs outline-none focus:border-[#065f46] disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold tracking-wider text-[#111827] uppercase">Supplementary Data</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isReadOnly}
                className="min-h-20 w-full resize-none rounded-sm border border-gray-300 p-3 text-sm text-[#111827] outline-none focus:border-[#065f46] disabled:bg-gray-50 disabled:text-gray-600"
                placeholder="Add notes regarding events, closures, or demographic estimates..."
              ></textarea>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPreview(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm border-2 border-[#111827] bg-white py-2 text-xs font-bold tracking-wide text-[#111827] uppercase transition-colors hover:bg-[#111827] hover:text-white"
              >
                <FileText size={14} /> Preview {isReadOnly ? "" : "Draft"}
              </button>
              {!isReadOnly && (
                <button
                  disabled={isError}
                  onClick={() => setShowConfirm(true)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-sm border-2 py-2 text-xs font-bold tracking-wide uppercase shadow-md transition-colors ${
                    isError ? "cursor-not-allowed border-gray-300 bg-gray-300 text-gray-500" : "border-[#065f46] bg-[#065f46] text-white hover:border-[#044a36] hover:bg-[#044a36]"
                  }`}
                >
                  {activeReport?.status === "Returned for Revision" ? <RotateCcw size={14} /> : <Send size={14} />}
                  {activeReport?.status === "Returned for Revision" ? "Resubmit" : "Submit"}
                </button>
              )}
            </div>

            {/* Audit Trail Section for Read-Only or Revision Mode */}
            {activeReport && activeReport.auditTrail && (
              <div className="mt-8 border-t border-gray-200 pt-5">
                <h4 className="mb-4 flex items-center gap-2 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                  <Activity size={12} /> Interaction Audit Trail
                </h4>
                <div className="space-y-4">
                  {activeReport.auditTrail.map((log, idx) => (
                    <div key={idx} className="flex gap-3 text-xs">
                      <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#065f46] shadow-[0_0_4px_#065f46]"></div>
                      <div>
                        <p className="font-semibold text-[#111827]">{log.action}</p>
                        <p className="mt-0.5 text-gray-500">
                          {log.time} • by <span className="font-medium text-gray-700">{log.actor}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        <ReportLedgerTable
          activeReportId={activeReportId}
          reportsHistory={reportsHistory}
          onViewReport={handleViewReport}
          onPrintReport={(report) => {
            handleViewReport(report);
            setShowPreview(true);
            window.setTimeout(() => window.print(), 100);
          }}
        />
      </div>
    </div>
  );
}
