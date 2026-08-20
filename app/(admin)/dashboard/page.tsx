"use client";

import { useEffect, useState } from "react";
import { HandCoins, Receipt, Building2, GraduationCap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initializeData } from "@/lib/initialize-data";
import { getDashboardStats, getFundOverview, getRecentDonations, getRecentExpenses } from "@/services/dashboard.service";
import { StatCard } from "@/components/dashboard/stat-card";
import { FundOverview } from "@/components/dashboard/fund-overview";
import { RecentDonations } from "@/components/dashboard/recent-donations";
import { RecentExpenses } from "@/components/dashboard/recent-expenses";
import type { DashboardStats, FundOverviewRow } from "@/types";
import type { RecentDonationRow, RecentExpenseRow } from "@/services/dashboard.service";

interface DashboardData {
  stats: DashboardStats;
  fundOverview: FundOverviewRow[];
  recentDonations: RecentDonationRow[];
  recentExpenses: RecentExpenseRow[];
}

function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `Rs. ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `Rs. ${(amount / 1_000).toFixed(1)}K`;
  return `Rs. ${amount.toLocaleString("en-PK")}`;
}

function IncomeExpenseChart({ data }: { data: FundOverviewRow[] }) {
  const maxVal = Math.max(...data.map((f) => Math.max(f.received, f.spent)), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses by Fund</CardTitle>
        <CardDescription>Received vs spent amounts per fund</CardDescription>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Received</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">Spent</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((fund) => {
            const receivedPct = (fund.received / maxVal) * 100;
            const spentPct = (fund.spent / maxVal) * 100;
            return (
              <div key={fund.fundId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{fund.fundName}</span>
                  <span className="text-muted-foreground">
                    {formatCurrencyShort(fund.received)} / {formatCurrencyShort(fund.spent)}
                  </span>
                </div>
                <div className="flex gap-1 h-5">
                  <div
                    className="bg-emerald-500 rounded-sm transition-all"
                    style={{ width: `${receivedPct}%` }}
                  />
                  <div
                    className="bg-red-500 rounded-sm transition-all"
                    style={{ width: `${spentPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FundBalanceWarning({ balance, received }: { balance: number; received: number }) {
  if (balance < 0) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-right font-medium text-red-600">
          {formatCurrencyShort(balance)}
        </span>
        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
          <AlertTriangle className="mr-0.5 size-2.5" />
          Deficit
        </Badge>
      </div>
    );
  }
  if (received > 0 && balance < received * 0.2) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-right font-medium text-amber-600">
          {formatCurrencyShort(balance)}
        </span>
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
          Low
        </Badge>
      </div>
    );
  }
  return (
    <span className="text-right font-medium text-emerald-600">
      {formatCurrencyShort(balance)}
    </span>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData({
      stats: getDashboardStats(),
      fundOverview: getFundOverview(),
      recentDonations: getRecentDonations(5),
      recentExpenses: getRecentExpenses(5),
    });
  }, []);

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of Madni Masjid management system
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-[88px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of Madni Masjid management system
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Donations"
          value={data.stats.totalDonations}
          icon={HandCoins}
        />
        <StatCard
          title="Total Expenses"
          value={data.stats.totalExpenses}
          icon={Receipt}
        />
        <StatCard
          title="Construction Fund"
          value={data.stats.constructionBalance}
          icon={Building2}
        />
        <StatCard
          title="Madrasa Fund"
          value={data.stats.madrasaBalance}
          icon={GraduationCap}
        />
      </div>

      <IncomeExpenseChart data={data.fundOverview} />

      <div className="grid gap-6 xl:grid-cols-2">
        <FundOverview data={data.fundOverview} />
        <div className="flex flex-col gap-6">
          <RecentDonations data={data.recentDonations} />
          <RecentExpenses data={data.recentExpenses} />
        </div>
      </div>
    </div>
  );
}
