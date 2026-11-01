import React, { useState, useEffect } from "react";
import { useAnalysis, AnyAnalysisResult } from "@/hooks/useAnalysis";
import { CommonResultView } from "@/components/results/CommonResultView";
import { LoadingState } from "@/components/common/LoadingState";
import { ErrorState } from "@/components/common/ErrorState";
import { reportApi, UnifiedDiagnosticReport } from "@/services/reportApi";
import { Modal } from "@/components/common/Modal";
import { ReportPreview } from "@/components/reports/ReportPreview";

interface ResultDetailsPageProps {
  analysisId: string;
  onBack: () => void;
  onNavigateToReports: () => void;
  onAnalyzeAgain: () => void;
}

export function ResultDetailsPage({
  analysisId,
  onBack,
  onNavigateToReports,
  onAnalyzeAgain,
}: ResultDetailsPageProps) {
  const { getAnalysisById } = useAnalysis();
  const [result, setResult] = useState<AnyAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedReport, setGeneratedReport] = useState<UnifiedDiagnosticReport | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchResult = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetched = await getAnalysisById(analysisId);
        if (mounted) {
          if (fetched) {
            setResult(fetched);
          } else {
            setError(`Analysis record #${analysisId} could not be located.`);
          }
        }
      } catch (err: any) {
        if (mounted) setError(err.message || "Failed to load analysis result.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchResult();
    return () => {
      mounted = false;
    };
  }, [analysisId]);

  const handleGenerateReport = async () => {
    if (!result) return;
    if (result.disease === "Alzheimer's Disease") {
      const rep = await reportApi.generateReportFromAlzheimer(result as any);
      setGeneratedReport(rep);
      setIsReportModalOpen(true);
    } else {
      const rep = await reportApi.generateReportFromParkinson(result as any);
      setGeneratedReport(rep);
      setIsReportModalOpen(true);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading Diagnostic Analysis..." subMessage="Fetching 3D volumetric maps and quantum layer parameters" />;
  }

  if (error || !result) {
    return (
      <ErrorState
        title="Analysis Record Not Found"
        message={error || `Unable to load diagnostic result for ID ${analysisId}.`}
        onBack={onBack}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <CommonResultView
        result={result}
        onGenerateReport={handleGenerateReport}
        onAnalyzeAgain={onAnalyzeAgain}
        onBackToPatient={onBack}
      />

      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        maxWidth="4xl"
      >
        {generatedReport && (
          <ReportPreview
            report={generatedReport}
            onClose={() => setIsReportModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
}
