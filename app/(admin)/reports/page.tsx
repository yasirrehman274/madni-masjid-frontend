"use client";

import { useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Printer, Download, Calendar, Filter, TrendingUp, TrendingDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDonations } from "@/services/donation.service";
import { getExpenses } from "@/services/expense.service";
import { getFunds } from "@/services/fund.service";
import { getDonors } from "@/services/donor.service";
import type { PaymentMethod } from "@/types";

type PaymentFilter = "all" | PaymentMethod;

const PAYMENT_LABELS: Record<PaymentFilter, string> = {
  all: "All Methods",
  cash: "Cash",
  bank: "Bank Transfer",
  cheque: "Cheque",
  online: "Online",
};

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("fund-summary");
  const [fundFilter, setFundFilter] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState<PaymentFilter>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const funds = getFunds();
  const donors = getDonors();
  const donations = getDonations();
  const expenses = getExpenses();

  const filterByDate = useCallback(
    <T extends { date: string }>(items: T[]): T[] => {
      return items.filter((item) => {
        if (fromDate && item.date < fromDate) return false;
        if (toDate && item.date > toDate) return false;
        return true;
      });
    },
    [fromDate, toDate],
  );

  const filteredDonations = useMemo(() => {
    let items = donations;
    if (fundFilter !== "all") items = items.filter((d) => d.fundId === fundFilter);
    if (paymentMethod !== "all") items = items.filter((d) => d.paymentMethod === paymentMethod);
    return filterByDate(items).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [donations, fundFilter, paymentMethod, filterByDate]);

  const filteredExpenses = useMemo(() => {
    let items = expenses;
    if (fundFilter !== "all") items = items.filter((e) => e.fundId === fundFilter);
    if (paymentMethod !== "all") items = items.filter((e) => e.paymentMethod === paymentMethod);
    return filterByDate(items).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [expenses, fundFilter, paymentMethod, filterByDate]);

  const fundSummaries = useMemo(() => {
    return funds.map((fund) => {
      const fd = filteredDonations.filter((d) => d.fundId === fund.id);
      const fe = filteredExpenses.filter((e) => e.fundId === fund.id);
      const totalDonations = fd.reduce((sum, d) => sum + d.amount, 0);
      const totalExpenses = fe.reduce((sum, e) => sum + e.amount, 0);
      return { ...fund, totalDonations, totalExpenses, balance: totalDonations - totalExpenses };
    });
  }, [funds, filteredDonations, filteredExpenses]);

  const grandTotalDonations = filteredDonations.reduce((sum, d) => sum + d.amount, 0);
  const grandTotalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const monthlyData = useMemo(() => {
    const map = new Map<string, { donations: number; expenses: number }>();
    for (const d of filteredDonations) {
      const key = format(new Date(d.date), "yyyy-MM");
      const entry = map.get(key) ?? { donations: 0, expenses: 0 };
      entry.donations += d.amount;
      map.set(key, entry);
    }
    for (const e of filteredExpenses) {
      const key = format(new Date(e.date), "yyyy-MM");
      const entry = map.get(key) ?? { donations: 0, expenses: 0 };
      entry.expenses += e.amount;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        key,
        label: format(new Date(key + "-01"), "MMMM yyyy"),
        ...data,
        net: data.donations - data.expenses,
      }));
  }, [filteredDonations, filteredExpenses]);

  const getFundName = (id: string) => funds.find((f) => f.id === id)?.name ?? "Unknown";
  const getDonorName = (id: string) => donors.find((d) => d.id === id)?.name ?? "Unknown";

  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleExportCSV = () => {
    const dateStr = format(new Date(), "yyyy-MM-dd");

    if (activeTab === "fund-summary") {
      const rows = [
        ["Fund", "Donations", "Expenses", "Balance"],
        ...fundSummaries.map((f) => [
          f.name,
          String(f.totalDonations),
          String(f.totalExpenses),
          String(f.balance),
        ]),
        ["Total", String(grandTotalDonations), String(grandTotalExpenses), String(grandTotalDonations - grandTotalExpenses)],
      ];
      downloadCSV(`fund-summary-${dateStr}.csv`, rows.map((r) => r.join(",")).join("\n"));
    } else if (activeTab === "donation-report") {
      const rows = [
        ["ID", "Donor Name", "Amount", "Fund", "Payment Method", "Date"],
        ...filteredDonations.map((d) => [
          d.id,
          getDonorName(d.donorId),
          String(d.amount),
          getFundName(d.fundId),
          PAYMENT_LABELS[d.paymentMethod] ?? d.paymentMethod,
          formatDate(d.date),
        ]),
      ];
      downloadCSV(`donation-report-${dateStr}.csv`, rows.map((r) => r.join(",")).join("\n"));
    } else if (activeTab === "expense-report") {
      const rows = [
        ["ID", "Description", "Category", "Amount", "Fund", "Payment Method", "Date"],
        ...filteredExpenses.map((e) => [
          e.id,
          e.description,
          e.category,
          String(e.amount),
          getFundName(e.fundId),
          PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod,
          formatDate(e.date),
        ]),
      ];
      downloadCSV(`expense-report-${dateStr}.csv`, rows.map((r) => r.join(",")).join("\n"));
    } else if (activeTab === "monthly-summary") {
      const rows = [
        ["Month", "Donations", "Expenses", "Net"],
        ...monthlyData.map((m) => [
          m.label,
          String(m.donations),
          String(m.expenses),
          String(m.net),
        ]),
      ];
      downloadCSV(`monthly-summary-${dateStr}.csv`, rows.map((r) => r.join(",")).join("\n"));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Generate and view financial reports.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4 mr-1" /> Print Report
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="size-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap">
            <div className="grid gap-2">
              <Label className="text-xs">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Fund</Label>
              <Select value={fundFilter} onValueChange={(v) => setFundFilter(v ?? "all")}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Funds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Funds</SelectItem>
                  {funds.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs">Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod((v ?? "all") as PaymentFilter)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Total Donations</p>
            <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
              <TrendingUp className="size-4" />
              {formatCurrency(grandTotalDonations)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-destructive flex items-center justify-center gap-1">
              <TrendingDown className="size-4" />
              {formatCurrency(grandTotalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Net Balance</p>
            <p className="text-2xl font-bold">{formatCurrency(grandTotalDonations - grandTotalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Total Donors</p>
            <p className="text-2xl font-bold">{donors.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v ?? "fund-summary")}>
        <TabsList>
          <TabsTrigger value="fund-summary">Fund Statement</TabsTrigger>
          <TabsTrigger value="donation-report">Donation Report</TabsTrigger>
          <TabsTrigger value="expense-report">Expense Report</TabsTrigger>
          <TabsTrigger value="monthly-summary">Monthly Summary</TabsTrigger>
        </TabsList>

        {/* ── Fund Statement ─────────────────────────────── */}
        <TabsContent value="fund-summary">
          <Card>
            <CardHeader>
              <CardTitle>Fund Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fund</TableHead>
                      <TableHead className="text-right">Donations</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fundSummaries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          <Filter className="size-4 mx-auto mb-2" />
                          No data found for the selected filters.
                        </TableCell>
                      </TableRow>
                    )}
                    {fundSummaries.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell className="font-medium">{f.name}</TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(f.totalDonations)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(f.totalExpenses)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(f.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {fundSummaries.length > 0 && (
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(grandTotalDonations)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {formatCurrency(grandTotalExpenses)}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(grandTotalDonations - grandTotalExpenses)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Donation Report ────────────────────────────── */}
        <TabsContent value="donation-report">
          <Card>
            <CardHeader>
              <CardTitle>Donation Report ({filteredDonations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Donor</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDonations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          <Calendar className="size-4 mx-auto mb-2" />
                          No donations found.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredDonations.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
                        <TableCell>{getDonorName(d.donorId)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getFundName(d.fundId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{PAYMENT_LABELS[d.paymentMethod] ?? d.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(d.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Expense Report ─────────────────────────────── */}
        <TabsContent value="expense-report">
          <Card>
            <CardHeader>
              <CardTitle>Expense Report ({filteredExpenses.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Fund</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          <Calendar className="size-4 mx-auto mb-2" />
                          No expenses found.
                        </TableCell>
                      </TableRow>
                    )}
                    {filteredExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                        <TableCell className="font-medium">{e.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{getFundName(e.fundId)}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{e.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{PAYMENT_LABELS[e.paymentMethod] ?? e.paymentMethod}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Monthly Summary ────────────────────────────── */}
        <TabsContent value="monthly-summary">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Donations</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monthlyData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          <Calendar className="size-4 mx-auto mb-2" />
                          No data found for the selected date range.
                        </TableCell>
                      </TableRow>
                    )}
                    {monthlyData.map((m) => (
                      <TableRow key={m.key}>
                        <TableCell className="font-medium">{m.label}</TableCell>
                        <TableCell className="text-right text-primary">
                          {formatCurrency(m.donations)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {formatCurrency(m.expenses)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-bold ${m.net >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatCurrency(m.net)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {monthlyData.length > 0 && (
                      <TableRow className="border-t-2">
                        <TableCell className="font-bold">Total</TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatCurrency(monthlyData.reduce((s, m) => s + m.donations, 0))}
                        </TableCell>
                        <TableCell className="text-right font-bold text-destructive">
                          {formatCurrency(monthlyData.reduce((s, m) => s + m.expenses, 0))}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(monthlyData.reduce((s, m) => s + m.net, 0))}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
