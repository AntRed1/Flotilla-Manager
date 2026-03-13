// @ts-nocheck
// src/pages/Dashboard.jsx
import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/apiClient";
import { queryKeys, QUERY_OPTIONS } from "@/lib/queryKeys";
import { Skeleton } from "@/components/ui/skeleton";
import BalanceCard from "@/components/dashboard/BalanceCard";
import QuickStats from "@/components/dashboard/QuickStats";
import RecentExpenses from "@/components/dashboard/RecentExpenses";
import CycleChart from "@/components/dashboard/CycleChart";
import LimitAlert from "@/components/dashboard/LimitAlert";
import PullToRefresh from "@/components/shared/PullToRefresh";
import {
  getCurrentCycleId,
  getCycleLabel,
  isCardBlocked,
  getDaysUntilCutoff,
  getDaysUntilRecharge,
} from "@/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();

  // Config del usuario — dinámica (staleTime: 0)
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.config.all(),
    queryFn:  () => apiClient.getConfig().then(r => r.data ?? r),
    ...QUERY_OPTIONS.dynamic,
  });

  const currentCycle = getCurrentCycleId(new Date(), config?.rechargeDay ?? 3);

  // Gastos del ciclo actual — dinámicos, habilitados solo cuando config esté lista
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: queryKeys.expenses.byCycle(currentCycle),
    queryFn:  () => apiClient.getExpenses({ cycle_id: currentCycle }).then(r => r.data ?? r),
    enabled:  !!config,
    ...QUERY_OPTIONS.dynamic,
  });

  // Pull-to-refresh: invalida solo las queries de esta pantalla
  const handleRefresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.config.all() }),
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses.byCycle(currentCycle) }),
    ]);

  const isLoading = configLoading || expensesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4 pt-2 pb-24">
        <div className="px-4">
          <Skeleton className="h-52 w-full rounded-3xl" />
        </div>
        <div className="grid grid-cols-3 gap-3 px-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="px-4">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const monthlyLimit      = config?.monthlyLimit ?? 10000;
  const totalSpent        = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const avgPerTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;
  const percentage        = Math.min(100, (totalSpent / monthlyLimit) * 100);
  const blocked           = isCardBlocked(config);
  const daysUntilRecharge = getDaysUntilRecharge(config);
  const daysToCutoff      = blocked ? 0 : getDaysUntilCutoff(config);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-5 pt-2 pb-24">
        <BalanceCard
          config={config}
          totalSpent={totalSpent}
          isCardBlocked={blocked}
          cycleLabel={getCycleLabel(currentCycle)}
        />
        <LimitAlert percentage={percentage} />
        <QuickStats
          totalTransactions={expenses.length}
          averagePerTransaction={avgPerTransaction}
          daysUntilCutoff={blocked ? daysUntilRecharge : daysToCutoff}
          cardBlocked={blocked}
        />
        <CycleChart expenses={expenses} limit={monthlyLimit} />
        <RecentExpenses expenses={expenses} />
      </div>
    </PullToRefresh>
  );
}