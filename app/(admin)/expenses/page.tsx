"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { getExpenses, createExpense, updateExpense, deleteExpense } from "@/services/expense.service";
import { getFunds, getFundBalance } from "@/services/fund.service";
import type { Expense, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
];

interface ExpenseFormData {
  fundId: string;
  category: string;
  description: string;
  vendor: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference: string;
  notes: string;
}

const emptyForm: ExpenseFormData = { fundId: "", category: "", description: "", vendor: "", amount: 0, paymentMethod: "cash", date: new Date().toISOString().split("T")[0], reference: "", notes: "" };

const CATEGORIES = ["Utilities", "Salaries", "Maintenance", "Materials", "Distribution", "Welfare", "Other"];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [funds, setFundsList] = useState<ReturnType<typeof getFunds>>([]);
  const [search, setSearch] = useState("");
  const [fundFilter, setFundFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [viewTarget, setViewTarget] = useState<Expense | null>(null);

  const refresh = () => { setExpenses(getExpenses()); setFundsList(getFunds()); };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    let result = expenses;
    if (fundFilter !== "all") result = result.filter((e) => e.fundId === fundFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.description.toLowerCase().includes(q) || e.vendor.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, search, fundFilter]);

  const getFundName = (id: string) => funds.find((f) => f.id === id)?.name ?? "Unknown";
  const selectedFundBalance = form.fundId ? getFundBalance(form.fundId) : 0;

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormOpen(true); };
  const openEdit = (exp: Expense) => {
    setForm({ fundId: exp.fundId, category: exp.category, description: exp.description, vendor: exp.vendor, amount: exp.amount, paymentMethod: exp.paymentMethod, date: exp.date, reference: exp.reference, notes: exp.notes });
    setEditingId(exp.id);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.fundId) { toast.error("Fund is required."); return; }
    if (!form.description.trim()) { toast.error("Description is required."); return; }
    if (form.amount <= 0) { toast.error("Amount must be positive."); return; }
    if (!form.date) { toast.error("Date is required."); return; }
    if (editingId) {
      const r = updateExpense(editingId, form);
      if (r.success) { toast.success("Expense updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createExpense(form);
      if (r.success) { toast.success("Expense created."); refresh(); } else { toast.error(r.error); return; }
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const r = deleteExpense(deleteTarget.id);
    if (r.success) { toast.success("Expense deleted."); refresh(); } else { toast.error(r.error); }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and manage mosque expenses.</p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto w-full"><Plus className="size-4 mr-1" /> Add Expense</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Expenses</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={fundFilter} onValueChange={(v) => setFundFilter(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Funds" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="hidden sm:table-cell">Fund</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No expenses found.</TableCell></TableRow>
                )}
                {filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                    <TableCell className="font-medium">{e.description}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{getFundName(e.fundId)}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTarget(e)} aria-label="View"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(e)} aria-label="Edit"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(e)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>{editingId ? "Update expense details." : "Record a new expense."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fund *</Label>
              <Select value={form.fundId} onValueChange={(v) => setForm({ ...form, fundId: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select fund" /></SelectTrigger>
                <SelectContent>{funds.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
              {form.fundId && (
                <p className="text-xs text-muted-foreground">Available balance: <span className="font-medium text-foreground">{formatCurrency(selectedFundBalance)}</span></p>
              )}
            </div>
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Description *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Expense description" />
            </div>
            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="Vendor name" />
            </div>
            <div className="grid gap-2">
              <Label>Amount (Rs.) *</Label>
              <Input type="number" min={1} value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label>Payment Method *</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => setForm({ ...form, paymentMethod: v as PaymentMethod })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Reference</Label>
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Reference" />
            </div>
            <div className="grid gap-2">
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Expense Details</DialogTitle></DialogHeader>
          {viewTarget && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span className="font-medium">{viewTarget.description}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fund</span><Badge variant="secondary">{getFundName(viewTarget.fundId)}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><Badge variant="outline">{viewTarget.category}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(viewTarget.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(viewTarget.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Vendor</span><span>{viewTarget.vendor || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><Badge variant="outline">{viewTarget.paymentMethod}</Badge></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
