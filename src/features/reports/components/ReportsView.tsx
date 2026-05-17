import React, { useState } from "react";
import { Activity, AlertTriangle, Check, Download, Edit2, FileText, Filter, History, MessageSquare, Plus, RotateCcw, Send, TrendingDown, TrendingUp, X } from "lucide-react";
import { Badge } from "../../../components/Badge";
import { Card } from "../../../components/Card";
import { SYSTEM_LOGS } from "../../../lib/enterpriseMockData";
import type { DemoBreakdown, Metrics, ReportRecord, SystemLogPeriod } from "../../../types/enterprise";

type DotFormModalProps = {
  onClose: () => void;
  period: SystemLogPeriod;
  metrics: Metrics;
  demo: DemoBreakdown;
  notes: string;
};

function DotFormModal({ onClose, period, metrics, demo, notes }: DotFormModalProps) {
  const tpm = parseInt(demo.thisProvMale || "0", 10);
  const tpf = parseInt(demo.thisProvFemale || "0", 10);
  const totalThisProv = tpm + tpf;

  const opm = parseInt(demo.otherProvMale || "0", 10);
  const opf = parseInt(demo.otherProvFemale || "0", 10);
  const totalOtherProv = opm + opf;

  const fm = parseInt(demo.foreignMale || "0", 10);
  const ff = parseInt(demo.foreignFemale || "0", 10);
  const totalForeign = fm + ff;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/80 p-4 font-['Inter'] backdrop-blur-sm duration-200 sm:p-8 print:block print:bg-white print:p-0">
      <div className="flex h-full max-h-[90vh] w-full max-w-6xl flex-col rounded-sm bg-white shadow-2xl print:m-0 print:h-auto print:max-h-none print:max-w-none print:shadow-none">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 p-4 print:hidden">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[#111827]" />
            <h3 className="font-bold text-[#111827]">DOT Form Preview</h3>
            <span className="rounded-sm bg-[#065f46]/10 px-2 py-1 text-xs font-semibold text-[#065f46]">Ready for Export</span>
          </div>
          <button onClick={onClose} className="rounded-sm p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-[#111827]">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-white p-8 sm:p-12 print:overflow-visible print:p-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-6 text-xl font-bold tracking-wide text-black uppercase">Visitor Attraction</h2>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="mb-8 w-full border-collapse border-2 border-black text-center text-xs text-black">
                <thead>
                  <tr>
                    <th rowSpan={4} className="w-20 border border-black p-2">
                      Attraction Code
                    </th>
                    <th rowSpan={4} className="w-48 border border-black p-2">
                      Name/ Month
                    </th>
                    <th colSpan={9} className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">
                      ***Place of Residence
                    </th>
                    <th rowSpan={4} className="w-24 border border-black p-2">
                      Grand Total Number of Visitors
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={6} className="border border-black bg-gray-50 p-1 print:bg-transparent">
                      Philippines
                    </th>
                    <th colSpan={3} className="border border-black bg-gray-50 p-1 print:bg-transparent">
                      Foreign Country Residence
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={3} className="border border-black p-1">
                      This province
                    </th>
                    <th colSpan={3} className="border border-black p-1">
                      Other Province
                    </th>
                    <th colSpan={3} className="border border-t-0 border-black p-1"></th>
                  </tr>
                  <tr>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                    <th className="w-12 border border-black p-1">Male</th>
                    <th className="w-12 border border-black p-1">Female</th>
                    <th className="w-12 border border-black bg-gray-50 p-1 print:bg-transparent">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black p-2 text-xs font-semibold uppercase">SPL-MKT-01</td>
                    <td className="border border-black p-2 text-left align-top leading-tight">
                      <span className="font-bold">SPL Market Branch</span>
                      <br />
                      <span className="text-[10px]">{period}</span>
                    </td>
                    <td className="border border-black p-2">{tpm || ""}</td>
                    <td className="border border-black p-2">{tpf || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalThisProv || ""}</td>
                    <td className="border border-black p-2">{opm || ""}</td>
                    <td className="border border-black p-2">{opf || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalOtherProv || ""}</td>
                    <td className="border border-black p-2">{fm || ""}</td>
                    <td className="border border-black p-2">{ff || ""}</td>
                    <td className="border border-black bg-gray-50 p-2 font-bold print:bg-transparent">{totalForeign || ""}</td>
                    <td className="border border-black bg-gray-100 p-2 text-sm font-bold print:bg-transparent">{metrics.entries}</td>
                  </tr>
                  {[...Array(6)].map((_, i) => (
                    <tr key={i} className="h-8">
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1"></td>
                      <td className="border border-black bg-gray-50 p-1 print:bg-transparent"></td>
                      <td className="border border-black bg-gray-100 p-1 print:bg-transparent"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {notes && (
              <div className="mt-4 border border-black bg-gray-50/50 p-4">
                <h4 className="mb-2 border-b border-gray-300 pb-1 text-xs font-bold uppercase">Supplementary Notes / Details</h4>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-4 print:hidden">
          <button onClick={onClose} className="rounded-sm border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-[#111827] transition-colors hover:bg-gray-100">
            Close Preview
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-sm bg-[#065f46] px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#044a36]">
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

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

      {showConfirm && (
        <div className="animate-in fade-in fixed inset-0 z-60 flex items-center justify-center bg-[#111827]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-sm border-t-4 border-[#065f46] bg-white p-6 shadow-2xl">
            <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#111827]">
              <Send size={20} className="text-[#065f46]" /> Confirm Submission
            </h3>
            <p className="mb-6 text-sm leading-relaxed text-gray-600">
              Are you sure you want to submit this report to the LGU Admin? This action will finalize current system metrics and lock further edits.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-bold text-[#111827] transition-colors hover:bg-gray-50">
                Edit Draft
              </button>
              <button onClick={executeSubmit} className="flex items-center gap-2 rounded-sm bg-[#065f46] px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#044a36]">
                <Check size={16} /> Yes, Submit
              </button>
            </div>
          </div>
        </div>
      )}

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

        <Card className="flex flex-col overflow-hidden rounded-sm border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white p-5">
            <h3 className="text-sm font-bold tracking-wider text-[#111827] uppercase">Submission Ledger</h3>
            <div className="flex cursor-pointer items-center gap-2 rounded-sm bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-[#111827]">
              <Filter size={14} /> Filter Records
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-white p-0">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-50 text-[10px] font-bold tracking-wider text-gray-500 uppercase">
                <tr>
                  <th className="border-b border-gray-200 px-5 py-3">Report ID</th>
                  <th className="border-b border-gray-200 px-5 py-3">Period</th>
                  <th className="border-b border-gray-200 px-5 py-3 text-right">Unique Pax</th>
                  <th className="border-b border-gray-200 px-5 py-3">Status</th>
                  <th className="border-b border-gray-200 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportsHistory.map((report) => (
                  <tr
                    key={report.id}
                    onClick={() => handleViewReport(report)}
                    className={`group cursor-pointer transition-colors ${activeReportId === report.id ? "bg-[#065f46]/5" : "hover:bg-gray-50"}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-[#111827]">{report.id}</td>
                    <td className="px-5 py-4 text-sm font-medium text-gray-700">{report.date}</td>
                    <td className="px-5 py-4 text-right font-mono font-bold text-[#065f46]">{report.unique?.toLocaleString() || 0}</td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={
                          report.status === "Consolidated"
                            ? "success"
                            : report.status === "Submitted" || report.status === "Resubmitted"
                              ? "info"
                              : report.status === "Returned for Revision"
                                ? "warning"
                                : "default"
                        }
                      >
                        {report.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-60 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewReport(report);
                            setShowPreview(true);
                            setTimeout(() => window.print(), 100);
                          }}
                          className="flex items-center text-gray-500 hover:text-[#065f46]"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          className={`flex items-center gap-1 text-xs font-semibold tracking-wider uppercase ${report.status === "Draft" || report.status === "Returned for Revision" ? "text-[#065f46] hover:text-[#044a36]" : "text-gray-400 hover:text-[#111827]"}`}
                        >
                          {report.status === "Draft" || report.status === "Returned for Revision" ? <Edit2 size={14} /> : <FileText size={14} />}
                          {report.status === "Draft" || report.status === "Returned for Revision" ? "Edit" : "View"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reportsHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">
                      No reports submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
