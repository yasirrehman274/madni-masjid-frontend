"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Eye, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { getDonors, createDonor, updateDonor, deleteDonor, getDonorTotalDonations, getDonorDonations } from "@/services/donor.service";
import type { Donor } from "@/types";

interface DonorFormData {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const emptyForm: DonorFormData = { name: "", phone: "", address: "", notes: "" };

export default function DonorsPage() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DonorFormData>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Donor | null>(null);
  const [viewTarget, setViewTarget] = useState<Donor | null>(null);

  const refresh = () => setDonors(getDonors());
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    if (!search) return donors;
    const q = search.toLowerCase();
    return donors.filter((d) => d.name.toLowerCase().includes(q) || d.phone.includes(q));
  }, [donors, search]);

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormOpen(true); };
  const openEdit = (donor: Donor) => {
    setForm({ name: donor.name, phone: donor.phone, address: donor.address, notes: donor.notes });
    setEditingId(donor.id);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Donor name is required."); return; }
    if (editingId) {
      const r = updateDonor(editingId, form);
      if (r.success) { toast.success("Donor updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createDonor(form);
      if (r.success) { toast.success("Donor created."); refresh(); } else { toast.error(r.error); return; }
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const donations = getDonorDonations(deleteTarget.id);
    if (donations.length > 0) {
      toast.error("Cannot delete donor with existing donations. Remove donations first.");
      setDeleteTarget(null);
      return;
    }
    const r = deleteDonor(deleteTarget.id);
    if (r.success) { toast.success("Donor deleted."); refresh(); } else { toast.error(r.error); }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donors</h1>
          <p className="text-muted-foreground">View and manage donor information.</p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto w-full"><Plus className="size-4 mr-1" /> Add Donor</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Donors</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search name/phone..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Phone</TableHead>
                  <TableHead className="text-right">Total Donations</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No donors found.</TableCell></TableRow>
                )}
                {filtered.map((donor) => (
                  <TableRow key={donor.id}>
                    <TableCell className="font-medium">{donor.name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{donor.phone}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(getDonorTotalDonations(donor.id))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewTarget(donor)} aria-label="View donor"><Eye className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(donor)} aria-label="Edit donor"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(donor)} aria-label="Delete donor"><Trash2 className="size-4" /></Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Donor" : "Add Donor"}</DialogTitle>
            <DialogDescription>{editingId ? "Update donor details." : "Register a new donor."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
            <div className="grid gap-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="03XX-XXXXXXX" /></div>
            <div className="grid gap-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" rows={2} /></div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes" rows={2} /></div>
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
            <DialogTitle>{viewTarget?.name}</DialogTitle>
            <DialogDescription>Donor Details</DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{viewTarget.phone || "-"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Donations</span><span className="font-bold">{formatCurrency(getDonorTotalDonations(viewTarget.id))}</span></div>
              {viewTarget.address && <div><span className="text-muted-foreground text-xs">Address</span><p>{viewTarget.address}</p></div>}
              {viewTarget.notes && <div><span className="text-muted-foreground text-xs">Notes</span><p>{viewTarget.notes}</p></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Since</span><span>{formatDate(viewTarget.createdAt)}</span></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setViewTarget(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Donor" description={`Are you sure you want to delete "${deleteTarget?.name}"?`} />
    </div>
  );
}
