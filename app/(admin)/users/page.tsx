"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { getUsers, createUser, updateUser, deleteUser } from "@/services/user.service";
import { formatDate } from "@/lib/format";
import type { User, UserRole } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Accountant" },
  { value: "viewer", label: "Viewer" },
];

interface UserForm { name: string; email: string; role: UserRole; status: "active" | "inactive"; }
const emptyForm: UserForm = { name: "", email: "", role: "viewer", status: "active" };

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const refresh = () => { setUsers(getUsers()); };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setFormOpen(true); };
  const openEdit = (user: User) => { setForm({ name: user.name, email: user.email, role: user.role, status: user.status }); setEditingId(user.id); setFormOpen(true); };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Name is required."); return; }
    if (!form.email.trim()) { toast.error("Email is required."); return; }
    if (editingId) {
      const r = updateUser(editingId, form);
      if (r.success) { toast.success("User updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createUser(form);
      if (r.success) { toast.success("User created."); refresh(); } else { toast.error(r.error); return; }
    }
    setFormOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    const r = deleteUser(deleteTarget.id);
    if (r.success) { toast.success("User deleted."); refresh(); } else { toast.error(r.error); }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage system access for mosque staff.</p>
        </div>
        <Button onClick={openCreate} className="sm:w-auto w-full"><Plus className="size-4 mr-1" /> Add User</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All Users ({filtered.length})</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users found.</TableCell></TableRow>}
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant={u.role === "admin" ? "default" : "secondary"}>{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)} aria-label="Edit"><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTarget(u)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "Add User"}</DialogTitle>
            <DialogDescription>{editingId ? "Update user details." : "Grant a new user access to the system."}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" /></div>
            <div className="grid gap-2"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email address" /></div>
            <div className="grid gap-2"><Label>Role *</Label><Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete User" description={`Are you sure you want to delete "${deleteTarget?.name}"?`} />
    </div>
  );
}
