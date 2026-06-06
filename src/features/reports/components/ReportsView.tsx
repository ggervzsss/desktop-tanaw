import React, { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DotFormModal } from "./DotFormModal";
import { ReportDraftPanel } from "./ReportDraftPanel";
import { ReportLedgerTable } from "./ReportLedgerTable";
import { SubmitReportDialog } from "./SubmitReportDialog";
import { EMPTY_METRICS, REPORTING_PERIODS } from "../../../lib/operationalDefaults";
import type { DemoBreakdown, ReportRecord, SystemLogPeriod } from "../../../types/enterprise";
import { DEFAULT_ML_SERVICE_BASE_URL, getLocalMetricsSummary, getMlServiceStatus, recordLocalReportSubmission } from "../../camera/services/ml-service";

type ReportsViewProps = {
  reportsHistory: ReportRecord[];
  setReportsHistory: React.Dispatch<React.SetStateAction<ReportRecord[]>>;
};

export function ReportsView({ reportsHistory, setReportsHistory }: ReportsViewProps) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [period, setPeriod] = useState<SystemLogPeriod>("Current Period");
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
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeReport = activeReportId ? (reportsHistory.find((r) => r.id === activeReportId) ?? null) : null;
  const isReadOnly = activeReport ? !["Draft", "Returned for Revision"].includes(activeReport.status) : false;

  const periodKeys = [...REPORTING_PERIODS];
  const currIndex = periodKeys.indexOf(period);
  const prevPeriod = currIndex < periodKeys.length - 1 ? periodKeys[currIndex + 1] : null;
  const prevMetrics = prevPeriod ? EMPTY_METRICS : null;
  const uniqueTrend = prevMetrics ? Math.round(((metrics.unique - prevMetrics.unique) / prevMetrics.unique) * 100) : 0;

  const isError = metrics.peak > metrics.entries;

  const refreshLocalMetrics = useCallback(async () => {
    try {
      const status = await getMlServiceStatus();
      const summary = await getLocalMetricsSummary(status.baseUrl || DEFAULT_ML_SERVICE_BASE_URL);
      setMetrics({
        entries: summary.entries,
        exits: summary.exits,
        peak: summary.peak_occupancy,
        unique: summary.unique_count,
      });
      setMetricsError(null);
    } catch (error) {
      setMetricsError(error instanceof Error ? error.message : "Unable to load local edge metrics.");
    }
  }, []);

  useEffect(() => {
    void refreshLocalMetrics();
    const intervalId = window.setInterval(() => void refreshLocalMetrics(), 5000);
    return () => window.clearInterval(intervalId);
  }, [refreshLocalMetrics]);

  const handleGenerateNew = () => {
    setActiveReportId(null);
    setPeriod("Current Period");
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
    setPeriod(report.period || "Current Period");
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

  const executeSubmit = async () => {
    setIsSubmitting(true);
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

    const reportId = activeReportId ?? `REP-${new Date().getTime().toString().slice(-6)}`;
    const reportPayload = {
      demo,
      metrics,
      notes,
      period,
    };

    try {
      const status = await getMlServiceStatus();
      await recordLocalReportSubmission(status.baseUrl || DEFAULT_ML_SERVICE_BASE_URL, {
        notes,
        period,
        reportId,
        reportPayload,
      });
    } catch (error) {
      setMetricsError(error instanceof Error ? error.message : "Unable to save report submission locally.");
      setIsSubmitting(false);
      return;
    }

    if (activeReportId) {
      setReportsHistory((prev) =>
        prev.map((r) => {
          if (r.id === activeReportId) {
            return {
              ...r,
              status: "Resubmitted",
              entries: metrics.entries,
              exits: metrics.exits,
              unique: metrics.unique,
              period,
              demo,
              notes,
              auditTrail: [
                ...(r.auditTrail || []),
                {
                  time: `${todayDate} ${now}`,
                  action: "Report Resubmitted",
                  actor: "Enterprise User",
                },
              ],
            };
          }
          return r;
        }),
      );
    } else {
      const newReport = {
        id: reportId,
        date: period,
        status: "Submitted",
        entries: metrics.entries,
        exits: metrics.exits,
        unique: metrics.unique,
        period,
        demo,
        notes,
        auditTrail: [
          {
            time: `${todayDate} ${now}`,
            action: "Draft Created",
            actor: "Enterprise User",
          },
          {
            time: `${todayDate} ${now}`,
            action: "Report Submitted",
            actor: "Enterprise User",
          },
        ],
        remarks: null,
      };
      setReportsHistory([newReport, ...reportsHistory]);
    }
    setShowConfirm(false);
    setIsSubmitting(false);
    void refreshLocalMetrics();
    handleGenerateNew();
  };

  return (
    <div className="animate-in fade-in space-y-6 font-['Inter'] duration-500">
      {showPreview && <DotFormModal onClose={() => setShowPreview(false)} period={period} metrics={metrics} demo={demo} notes={notes} />}

      {showConfirm && <SubmitReportDialog isSubmitting={isSubmitting} onCancel={() => setShowConfirm(false)} onConfirm={executeSubmit} />}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">Report Generation & Submission</h2>
          <p className="mt-1 text-sm text-gray-500">Generate LGU-required DOT reports using system-verified metrics.</p>
          {metricsError && <p className="mt-1 text-xs font-semibold text-red-600">Local metrics unavailable: {metricsError}</p>}
        </div>
        <button
          onClick={handleGenerateNew}
          className="flex items-center gap-2 rounded-sm border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#111827] shadow-sm transition-colors hover:bg-gray-50"
        >
          <Plus size={16} /> New Draft
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReportDraftPanel
          activeReport={activeReport}
          activeReportId={activeReportId}
          demo={demo}
          isError={isError}
          isReadOnly={isReadOnly}
          metrics={metrics}
          notes={notes}
          period={period}
          prevMetrics={prevMetrics}
          uniqueTrend={uniqueTrend}
          onPreview={() => setShowPreview(true)}
          onSubmitPrompt={() => setShowConfirm(true)}
          setDemo={setDemo}
          setNotes={setNotes}
          setPeriod={setPeriod}
        />

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
