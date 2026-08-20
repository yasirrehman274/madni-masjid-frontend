import { getFunds, getFundReceived, getFundSpent, getFundBalance } from "@/services/fund.service";
import { getDonations } from "@/services/donation.service";
import { getExpenses } from "@/services/expense.service";
import { getDonors } from "@/services/donor.service";
import type { DashboardStats, FundOverviewRow, FundType } from "@/types";

// ─── Dashboard Stats ────────────────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  const funds = getFunds();
  const totalDonations = getDonations().reduce((sum, d) => sum + d.amount, 0);
  const totalExpenses = getExpenses().reduce((sum, e) => sum + e.amount, 0);

  const findBalance = (type: FundType): number => {
    const fund = funds.find((f) => f.type === type);
    if (!fund) return 0;
    return getFundBalance(fund.id);
  };

  return {
    totalDonations,
    totalExpenses,
    constructionBalance: findBalance("construction"),
    madrasaBalance: findBalance("madrasa"),
    zakatBalance: findBalance("zakat"),
    fitranaBalance: findBalance("fitrana"),
    khairatBalance: findBalance("khairat"),
    generalBalance: findBalance("general"),
  };
}

// ─── Fund Overview ──────────────────────────────────────────────────

export function getFundOverview(): FundOverviewRow[] {
  const funds = getFunds();
  return funds.map((fund) => ({
    fundId: fund.id,
    fundName: fund.name,
    received: getFundReceived(fund.id),
    spent: getFundSpent(fund.id),
    balance: getFundBalance(fund.id),
  }));
}

// ─── Recent Donations (with donor + fund names) ─────────────────────

export interface RecentDonationRow {
  id: string;
  donorName: string;
  fundName: string;
  amount: number;
  date: string;
  status: string;
}

export function getRecentDonations(limit: number = 5): RecentDonationRow[] {
  const donations = getDonations();
  const donors = getDonors();
  const funds = getFunds();

  const sorted = [...donations].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted.slice(0, limit).map((donation) => {
    const donor = donors.find((d) => d.id === donation.donorId);
    const fund = funds.find((f) => f.id === donation.fundId);
    return {
      id: donation.id,
      donorName: donor?.name ?? "Unknown Donor",
      fundName: fund?.name ?? "Unknown Fund",
      amount: donation.amount,
      date: donation.date,
      status: "Completed",
    };
  });
}

// ─── Recent Expenses (with fund name) ───────────────────────────────

export interface RecentExpenseRow {
  id: string;
  description: string;
  fundName: string;
  amount: number;
  date: string;
  status: string;
}

export function getRecentExpenses(limit: number = 5): RecentExpenseRow[] {
  const expenses = getExpenses();
  const funds = getFunds();

  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted.slice(0, limit).map((expense) => {
    const fund = funds.find((f) => f.id === expense.fundId);
    return {
      id: expense.id,
      description: expense.description,
      fundName: fund?.name ?? "Unknown Fund",
      amount: expense.amount,
      date: expense.date,
      status: "Approved",
    };
  });
}
