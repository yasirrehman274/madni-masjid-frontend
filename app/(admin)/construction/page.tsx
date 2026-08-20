"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { getProjects, createProject, updateProject, deleteProject, getConstructionExpensesByProject, createConstructionExpense, deleteConstructionExpense, getProjectTotalSpent, getProjectRemainingBudget } from "@/services/construction.service";
import { getFunds, getFundBalance } from "@/services/fund.service";
import type { ConstructionProject, ConstructionExpense, ProjectStatus, PaymentMethod } from "@/types";

const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank Transfer" },
  { value: "online", label: "Online" },
  { value: "cheque", label: "Cheque" },
];

interface ProjectForm { name: string; estimatedBudget: number; description: string; status: ProjectStatus; startDate: string; targetDate: string; }
interface ExpenseForm { projectId: string; fundId: string; category: string; description: string; vendor: string; amount: number; paymentMethod: PaymentMethod; date: string; reference: string; }

const emptyProject: ProjectForm = { name: "", estimatedBudget: 0, description: "", status: "planning", startDate: "", targetDate: "" };
const emptyExpenseForm: ExpenseForm = { projectId: "", fundId: "", category: "", description: "", vendor: "", amount: 0, paymentMethod: "cash", date: new Date().toISOString().split("T")[0], reference: "" };
const CATEGORIES = ["Materials", "Labor", "Equipment", "Design", "Other"];

export default function ConstructionPage() {
  const [projects, setProjects] = useState<ConstructionProject[]>([]);
  const [funds, setFundsList] = useState<ReturnType<typeof getFunds>>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [pForm, setPForm] = useState<ProjectForm>(emptyProject);
  const [expFormOpen, setExpFormOpen] = useState(false);
  const [expForm, setExpForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<ConstructionProject | null>(null);
  const [deleteExpTarget, setDeleteExpTarget] = useState<ConstructionExpense | null>(null);

  const refresh = () => { setProjects(getProjects()); setFundsList(getFunds()); };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const activeProject = projects.find((p) => p.id === selectedProject);
  const projectExpenses = selectedProject ? getConstructionExpensesByProject(selectedProject) : [];

  const openProjectCreate = () => { setPForm(emptyProject); setEditingProject(null); setProjectFormOpen(true); };
  const openProjectEdit = (p: ConstructionProject) => {
    setPForm({ name: p.name, estimatedBudget: p.estimatedBudget, description: p.description, status: p.status, startDate: p.startDate, targetDate: p.targetDate });
    setEditingProject(p.id); setProjectFormOpen(true);
  };

  const handleProjectSubmit = () => {
    if (!pForm.name.trim()) { toast.error("Project name is required."); return; }
    if (pForm.estimatedBudget <= 0) { toast.error("Budget must be positive."); return; }
    if (editingProject) {
      const r = updateProject(editingProject, pForm);
      if (r.success) { toast.success("Project updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createProject(pForm);
      if (r.success) { toast.success("Project created."); refresh(); } else { toast.error(r.error); return; }
    }
    setProjectFormOpen(false);
  };

  const openExpenseCreate = () => {
    setExpForm({ ...emptyExpenseForm, projectId: selectedProject || "" });
    setExpFormOpen(true);
  };

  const handleExpenseSubmit = () => {
    if (!expForm.fundId) { toast.error("Fund is required."); return; }
    if (!expForm.description.trim()) { toast.error("Description is required."); return; }
    if (expForm.amount <= 0) { toast.error("Amount must be positive."); return; }
    const r = createConstructionExpense(expForm);
    if (r.success) { toast.success("Construction expense added."); refresh(); setExpFormOpen(false); } else { toast.error(r.error); }
  };

  const handleDeleteProject = () => {
    if (!deleteProjectTarget) return;
    const r = deleteProject(deleteProjectTarget.id);
    if (r.success) { toast.success("Project deleted."); if (selectedProject === deleteProjectTarget.id) setSelectedProject(null); refresh(); } else { toast.error(r.error); }
    setDeleteProjectTarget(null);
  };

  const handleDeleteExpense = () => {
    if (!deleteExpTarget) return;
    const r = deleteConstructionExpense(deleteExpTarget.id);
    if (r.success) { toast.success("Expense deleted."); refresh(); } else { toast.error(r.error); }
    setDeleteExpTarget(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Construction</h1>
        <p className="text-muted-foreground">Monitor mosque construction projects and expenses.</p>
      </div>

      {/* Project Cards */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button onClick={openProjectCreate} size="sm"><Plus className="size-4 mr-1" /> Add Project</Button>
        </div>
        {projects.length === 0 && <Card><CardContent className="py-8 text-center text-muted-foreground">No projects yet.</CardContent></Card>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const spent = getProjectTotalSpent(project.id);
            const remaining = getProjectRemainingBudget(project.id);
            const progress = project.estimatedBudget > 0 ? Math.min((spent / project.estimatedBudget) * 100, 100) : 0;
            return (
              <Card key={project.id} className={`cursor-pointer transition-colors ${selectedProject === project.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedProject(project.id)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon-sm" onClick={() => openProjectEdit(project)} aria-label="Edit"><Pencil className="size-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDeleteProjectTarget(project)} aria-label="Delete"><Trash2 className="size-3.5" /></Button>
                    </div>
                  </div>
                  <Badge variant={project.status === "in_progress" ? "default" : project.status === "completed" ? "secondary" : "outline"}>{project.status.replace("_", " ")}</Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Budget</span><p className="font-medium">{formatCurrency(project.estimatedBudget)}</p></div>
                    <div><span className="text-muted-foreground">Spent</span><p className="font-medium">{formatCurrency(spent)}</p></div>
                    <div><span className="text-muted-foreground">Remaining</span><p className="font-medium">{formatCurrency(remaining)}</p></div>
                    <div><span className="text-muted-foreground">Progress</span><p className="font-medium">{progress.toFixed(0)}%</p></div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Construction Expenses */}
      {selectedProject && activeProject && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Building2 className="size-5" /> {activeProject.name} - Expenses</CardTitle>
            <Button onClick={openExpenseCreate} size="sm"><Plus className="size-4 mr-1" /> Add Expense</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="hidden sm:table-cell">Vendor</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectExpenses.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No expenses for this project.</TableCell></TableRow>
                  )}
                  {projectExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-muted-foreground">{formatDate(e.date)}</TableCell>
                      <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                      <TableCell className="font-medium">{e.description}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">{e.vendor}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(e.amount)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setDeleteExpTarget(e)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Form Dialog */}
      <Dialog open={projectFormOpen} onOpenChange={setProjectFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name *</Label><Input value={pForm.name} onChange={(e) => setPForm({ ...pForm, name: e.target.value })} placeholder="Project name" /></div>
            <div className="grid gap-2"><Label>Estimated Budget (Rs.) *</Label><Input type="number" min={1} value={pForm.estimatedBudget || ""} onChange={(e) => setPForm({ ...pForm, estimatedBudget: Number(e.target.value) })} placeholder="0" /></div>
            <div className="grid gap-2"><Label>Status</Label><Select value={pForm.status} onValueChange={(v) => setPForm({ ...pForm, status: v as ProjectStatus })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={pForm.startDate} onChange={(e) => setPForm({ ...pForm, startDate: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Target Date</Label><Input type="date" value={pForm.targetDate} onChange={(e) => setPForm({ ...pForm, targetDate: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Description</Label><Textarea value={pForm.description} onChange={(e) => setPForm({ ...pForm, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectFormOpen(false)}>Cancel</Button>
            <Button onClick={handleProjectSubmit}>{editingProject ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Form Dialog */}
      <Dialog open={expFormOpen} onOpenChange={setExpFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Construction Expense</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Fund *</Label>
              <Select value={expForm.fundId} onValueChange={(v) => setExpForm({ ...expForm, fundId: v ?? "" })}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select fund" /></SelectTrigger>
                <SelectContent>{funds.map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
              {expForm.fundId && <p className="text-xs text-muted-foreground">Available: <span className="font-medium text-foreground">{formatCurrency(getFundBalance(expForm.fundId))}</span></p>}
            </div>
            <div className="grid gap-2"><Label>Category *</Label><Select value={expForm.category} onValueChange={(v) => setExpForm({ ...expForm, category: v ?? "" })}><SelectTrigger className="w-full"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2 sm:col-span-2"><Label>Description *</Label><Input value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} placeholder="Description" /></div>
            <div className="grid gap-2"><Label>Vendor</Label><Input value={expForm.vendor} onChange={(e) => setExpForm({ ...expForm, vendor: e.target.value })} placeholder="Vendor" /></div>
            <div className="grid gap-2"><Label>Amount (Rs.) *</Label><Input type="number" min={1} value={expForm.amount || ""} onChange={(e) => setExpForm({ ...expForm, amount: Number(e.target.value) })} placeholder="0" /></div>
            <div className="grid gap-2"><Label>Date *</Label><Input type="date" value={expForm.date} onChange={(e) => setExpForm({ ...expForm, date: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Method</Label><Select value={expForm.paymentMethod} onValueChange={(v) => setExpForm({ ...expForm, paymentMethod: v as PaymentMethod })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpFormOpen(false)}>Cancel</Button>
            <Button onClick={handleExpenseSubmit}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteProjectTarget} onOpenChange={() => setDeleteProjectTarget(null)} onConfirm={handleDeleteProject} title="Delete Project" description="Are you sure you want to delete this project and all its expenses?" />
      <DeleteConfirmDialog open={!!deleteExpTarget} onOpenChange={() => setDeleteExpTarget(null)} onConfirm={handleDeleteExpense} title="Delete Expense" description="Are you sure you want to delete this construction expense?" />
    </div>
  );
}
