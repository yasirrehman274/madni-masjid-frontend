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
import { formatCurrency, formatDate } from "@/lib/format";
import { getDonations, createDonation, updateDonation, deleteDonation } from "@/services/donation.service";
import { getDonors } from "@/services/donor.service";
import { getFunds } from "@/services/fund.service";
import { createReceipt } from "@/services/receipt.service";
import type { Donation, PaymentMethod } from "@/types";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
];

interface DonationFormData {
  donorId: string;
  fundId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  reference: string;
  notes: string;
}

const emptyForm: DonationFormData = { donorId: "", fundId: "", amount: 0, paymentMethod: "cash", date: new Date().toISOString().split("T")[0], reference: "", notes: "" };

export default function DonationsPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [donors, setDonorsList] = useState<ReturnType<typeof getDonors>>([]);
  const [funds, setFundsList] = useState<ReturnType<typeof getFunds>>([]);
  const [search, setSearch] = useState("");
  const [fundFilter, setFundFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DonationFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Donation | null>(null);
  const [viewTarget, setViewTarget] = useState<Donation | null>(null);

  const refresh = () => { setDonations(getDonations()); setDonorsList(getDonors()); setFundsList(getFunds()); };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    let result = donations;
    if (fundFilter !== "all") result = result.filter((d) => d.fundId === fundFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((d) => {
        const donor = donors.find((dr) => dr.id === d.donorId);
        const fund = funds.find((f) => f.id === d.fundId);
        return (donor?.name.toLowerCase().includes(q) || fund?.name.toLowerCase().includes(q) || d.reference.toLowerCase().includes(q));
      });
    }
    return [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [donations, search, fundFilter, donors, funds]);

  const getDonorName = (id: string) => donors.find((d) => d.id === id)?.name ?? "Unknown";
  const getFundName = (id: string) => funds.find((f) => f.id === id)?.name ?? "Unknown";

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormOpen(true); };
  const openEdit = (donation: Donation) => {
    setForm({ donorId: donation.donorId, fundId: donation.fundId, amount: donation.amount, paymentMethod: donation.paymentMethod, date: donation.date, reference: donation.reference, notes: donation.notes });
    setEditingId(donation.id);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.donorId) { toast.error("Donor is required."); return; }
    if (!form.fundId) { toast.error("Fund is required."); return; }
    if (form.amount <= 0) { toast.error("Amount must be positive."); return; }
    if (!form.date) { toast.error("Date is required."); return; }
    if (editingId) {
      const r = updateDonation(editingId, form);
      if (r.success) { toast.success("Donation updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createDonation(form);
      if (r.success) {
        toast.success("Donation created.");
        // Auto-create receipt
        createReceipt({ donationId: r.data!.id });
        refresh();
      } else { toast.error(r.error); return; }
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const r = deleteDonation(deleteTarget.id);
    if (r.success) { toast.success("Donation deleted."); refresh(); } else { toast.error(r.error); }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donations</h1>
          <p className="text-muted-foreground">Manage mosque and madrasa donations.</p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto w-full"><Plus className="size-4 mr-1" /> Add Donation</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Donations</CardTitle>
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
                  <TableHead>Donor</TableHead>
                  <TableHead className="hidden sm:table-cell">Fund</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No donations found.</TableCell></TableRow>
                )}
                {filtered.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
                    <TableCell className="font-medium">{getDonorName(d.donorId)}</TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{getFundName(d.fundId)}</Badge></TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(d.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline">{d.paymentMethod}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTarget(d)} aria-label="View"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(d)} aria-label="Edit"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(d)} aria-label="Delete"><Trash2 className="size-4" /></Button>
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
            <DialogTitle>{editingId ? "Edit Donation" : "Add Donation"}</DialogTitle>
            <DialogDescription>{editingId ? "Update donation details." : "Record a new donation."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Donor *</Label>
              <Select value={form.donorId} onValueChange={(v) => setForm({ ...form, donorId: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select donor" /></SelectTrigger>
                <SelectContent>{donors.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Fund *</Label>
              <Select value={form.fundId} onValueChange={(v) => setForm({ ...form, fundId: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select fund" /></SelectTrigger>
                <SelectContent>{funds.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
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
              <Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Transaction ref" />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} />
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
          <DialogHeader>
            <DialogTitle>Donation Details</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Donor</span><span className="font-medium">{getDonorName(viewTarget.donorId)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Fund</span><Badge variant="secondary">{getFundName(viewTarget.fundId)}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-bold">{formatCurrency(viewTarget.amount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{formatDate(viewTarget.date)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Method</span><Badge variant="outline">{viewTarget.paymentMethod}</Badge></div>
              {viewTarget.reference && <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span>{viewTarget.reference}</span></div>}
              {viewTarget.notes && <div className="pt-2 border-t"><span className="text-muted-foreground text-xs">Notes</span><p>{viewTarget.notes}</p></div>}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
