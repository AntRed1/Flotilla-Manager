// src/pages/Analytics.jsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { Skeleton } from "@/components/ui/skeleton";
import CycleComparison from "@/components/analytics/CycleComparison";
import StationsRanking from "@/components/analytics/StationsRanking";
import GlobalKPIs from "@/components/analytics/GlobalKPIs";
import { generateCycleOptions } from "@/utils";

export default function Analytics() {
  const [selectedCycle, setSelectedCycle] = useState(null); // null = histórico

  const { data: cyclesReport, isLoading: cyclesLoading } = useQuery({
    queryKey: ["analytics", "cycles"],
    queryFn: () => apiClient.getAnalyticsCycles(6),
  });

  const { data: stationsReport, isLoading: stationsLoading } = useQuery({
    queryKey: ["analytics", "stations", selectedCycle],
    queryFn: () => apiClient.getAnalyticsStations(selectedCycle),
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: () => apiClient.getAnalyticsSummary(),
  });

  const isLoading = cyclesLoading || stationsLoading || summaryLoading;
  const cycles = generateCycleOptions(6);

  if (isLoading) {
    return (
      <div className="px-4 pt-4 pb-24 space-y-4">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-24 space-y-5">
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Análisis</h1>
        <p className="text-sm text-gray-400 mt-1">Tendencias y comparativas</p>
      </div>

      {/* KPIs globales */}
      <GlobalKPIs summary={summary} />

      {/* Comparativa de ciclos */}
      {cyclesReport && <CycleComparison data={cyclesReport} />}

      {/* Ranking estaciones */}
      {stationsReport && (
        <StationsRanking
          data={stationsReport}
          cycles={cycles}
          selectedCycle={selectedCycle}
          onCycleChange={setSelectedCycle}
        />
      )}
    </div>
  );
}