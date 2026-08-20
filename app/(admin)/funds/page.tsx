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
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { formatCurrency } from "@/lib/format";
import { getFunds, createFund, updateFund, deleteFund, getFundReceived, getFundSpent, getFundBalance } from "@/services/fund.service";
import type { Fund, FundType, FundStatus } from "@/types";

const FUND_TYPES: { value: FundType; label: string }[] = [
  { value: "construction", label: "Construction" },
  { value: "madrasa", label: "Madrasa" },
  { value: "zakat", label: "Zakat" },
  { value: "fitrana", label: "Fitrana" },
  { value: "khairat", label: "Khairat" },
  { value: "general", label: "General" },
];

const FUND_STATUSES: { value: FundStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "closed", label: "Closed" },
];

interface FundFormData {
  name: string;
  type: FundType;
  description: string;
  status: FundStatus;
}

const emptyForm: FundFormData = { name: "", type: "general", description: "", status: "active" };

export default function FundsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FundFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Fund | null>(null);
  const [viewTarget, setViewTarget] = useState<Fund | null>(null);

  const refresh = () => setFunds(getFunds());
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    if (!search) return funds;
    const q = search.toLowerCase();
    return funds.filter(
      (f) => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q)
    );
  }, [funds, search]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormOpen(true); };
  const openEdit = (fund: Fund) => {
    setForm({ name: fund.name, type: fund.type, description: fund.description, status: fund.status });
    setEditingId(fund.id);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Fund name is required."); return; }
    if (editingId) {
      const result = updateFund(editingId, form);
      if (result.success) { toast.success("Fund updated."); refresh(); } else { toast.error(result.error); return; }
    } else {
      const result = createFund(form);
      if (result.success) { toast.success("Fund created."); refresh(); } else { toast.error(result.error); return; }
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const result = deleteFund(deleteTarget.id);
    if (result.success) { toast.success("Fund deleted."); refresh(); } else { toast.error(result.error); }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funds</h1>
          <p className="text-muted-foreground">Manage donation funds and allocations.</p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto w-full"><Plus className="size-4 mr-1" /> Add Fund</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Funds</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search funds..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fund</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Received</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Spent</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No funds found.</TableCell></TableRow>
                )}
                {filtered.map((fund) => (
                  <TableRow key={fund.id}>
                    <TableCell className="font-medium">{fund.name}</TableCell>
                    <TableCell><Badge variant="secondary">{fund.type}</Badge></TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{formatCurrency(getFundReceived(fund.id))}</TableCell>
                    <TableCell className="text-right hidden sm:table-cell">{formatCurrency(getFundSpent(fund.id))}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(getFundBalance(fund.id))}</TableCell>
                    <TableCell><Badge variant={fund.status === "active" ? "default" : "secondary"}>{fund.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTarget(fund)} aria-label="View fund"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(fund)} aria-label="Edit fund"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(fund)} aria-label="Delete fund"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Fund" : "Add Fund"}</DialogTitle>
            <DialogDescription>{editingId ? "Update fund details." : "Create a new fund."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Fund name" />
            </div>
            <div className="grid gap-2">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as FundType })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUND_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as FundStatus })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FUND_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewTarget} onOpenChange={() => setViewTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{viewTarget?.name}</DialogTitle>
            <DialogDescription>Fund Details</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="secondary">{viewTarget.type}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={viewTarget.status === "active" ? "default" : "secondary"}>{viewTarget.status}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Received</span><span className="font-medium">{formatCurrency(getFundReceived(viewTarget.id))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Spent</span><span className="font-medium">{formatCurrency(getFundSpent(viewTarget.id))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Balance</span><span className="font-bold">{formatCurrency(getFundBalance(viewTarget.id))}</span></div>
              {viewTarget.description && <div className="pt-2 border-t"><span className="text-muted-foreground">{viewTarget.description}</span></div>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Fund" description={`Are you sure you want to delete "${deleteTarget?.name}"? Related donations/expenses will still reference this fund.`} />
    </div>
  );
}
