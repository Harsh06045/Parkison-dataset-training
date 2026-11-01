import { useState, useCallback, useEffect } from "react";
import { alzheimerApi, AlzheimerAnalysisResult } from "@/services/alzheimerApi";
import { parkinsonApi, ParkinsonAnalysisResult } from "@/services/parkinsonApi";

export type AnyAnalysisResult = (AlzheimerAnalysisResult | ParkinsonAnalysisResult) & {
  disease: "Alzheimer's Disease" | "Parkinson's Disease";
};

export interface UnifiedHistoryItem {
  id: string;
  patientId: string;
  patientName: string;
  disease: "Alzheimer's Disease" | "Parkinson's Disease";
  prediction: string;
  confidence: number;
  date: string;
  status: string;
  modalityOrSource: string;
  rawResult: AnyAnalysisResult;
}

export function useAnalysis() {
  const [history, setHistory] = useState<UnifiedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUnifiedHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [alzList, pknList] = await Promise.all([
        alzheimerApi.getAllAnalyses(),
        parkinsonApi.getAllAnalyses(),
      ]);

      const items: UnifiedHistoryItem[] = [
        ...alzList.map((a) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: a.patientName,
          disease: "Alzheimer's Disease" as const,
          prediction: a.prediction,
          confidence: a.confidence,
          date: a.scanDate,
          status: "Completed",
          modalityOrSource: a.modality,
          rawResult: a,
        })),
        ...pknList.map((p) => ({
          id: p.id,
          patientId: p.patientId,
          patientName: p.patientName,
          disease: "Parkinson's Disease" as const,
          prediction: p.prediction,
          confidence: p.confidence,
          date: p.analysisDate,
          status: "Completed",
          modalityOrSource: `Vocal Audio (${p.audioDurationSeconds}s)`,
          rawResult: p,
        })),
      ];

      // Sort newest first
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items);
    } catch (e) {
      console.error("Failed to load analysis history", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnifiedHistory();
  }, [fetchUnifiedHistory]);

  const getAnalysisById = async (id: string): Promise<AnyAnalysisResult | null> => {
    if (id.startsWith("ALZ-")) {
      return await alzheimerApi.getAnalysisById(id);
    } else if (id.startsWith("PKN-")) {
      return await parkinsonApi.getAnalysisById(id);
    }
    // Try both
    const alz = await alzheimerApi.getAnalysisById(id);
    if (alz) return alz;
    return await parkinsonApi.getAnalysisById(id);
  };

  return {
    history,
    isLoading,
    refreshHistory: fetchUnifiedHistory,
    getAnalysisById,
  };
}
