"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Search, Users, GraduationCap } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { formatCurrency } from "@/lib/format";
import { getStudents, createStudent, updateStudent, deleteStudent, getActiveStudents, getTeachers, createTeacher, updateTeacher, deleteTeacher, getActiveTeachers, getTotalTeacherSalary } from "@/services/madrasa.service";
import type { MadrasaStudent, MadrasaTeacher, StudentStatus, TeacherStatus } from "@/types";

const STUDENT_STATUSES: { value: StudentStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "graduated", label: "Graduated" },
  { value: "transferred", label: "Transferred" },
];

const TEACHER_STATUSES: { value: TeacherStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on_leave", label: "On Leave" },
];

interface StudentForm { name: string; fatherName: string; phone: string; className: string; admissionDate: string; status: StudentStatus; notes: string; }
interface TeacherForm { name: string; phone: string; subject: string; salary: number; joiningDate: string; status: TeacherStatus; notes: string; }

const emptyStudent: StudentForm = { name: "", fatherName: "", phone: "", className: "", admissionDate: new Date().toISOString().split("T")[0], status: "active", notes: "" };
const emptyTeacher: TeacherForm = { name: "", phone: "", subject: "", salary: 0, joiningDate: new Date().toISOString().split("T")[0], status: "active", notes: "" };

export default function MadrasaPage() {
  const [students, setStudents] = useState<MadrasaStudent[]>([]);
  const [teachers, setTeachers] = useState<MadrasaTeacher[]>([]);
  const [search, setSearch] = useState("");
  const [studentFormOpen, setStudentFormOpen] = useState(false);
  const [teacherFormOpen, setTeacherFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<string | null>(null);
  const [sForm, setSForm] = useState<StudentForm>(emptyStudent);
  const [tForm, setTForm] = useState<TeacherForm>(emptyTeacher);
  const [deleteStudentTarget, setDeleteStudentTarget] = useState<MadrasaStudent | null>(null);
  const [deleteTeacherTarget, setDeleteTeacherTarget] = useState<MadrasaTeacher | null>(null);

  const refresh = () => { setStudents(getStudents()); setTeachers(getTeachers()); };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  const filteredStudents = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.fatherName.toLowerCase().includes(q) || s.className.toLowerCase().includes(q));
  }, [students, search]);

  const filteredTeachers = useMemo(() => {
    if (!search) return teachers;
    const q = search.toLowerCase();
    return teachers.filter((t) => t.name.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q));
  }, [teachers, search]);

  const handleStudentSubmit = () => {
    if (!sForm.name.trim()) { toast.error("Student name is required."); return; }
    if (!sForm.className.trim()) { toast.error("Class is required."); return; }
    if (editingStudent) {
      const r = updateStudent(editingStudent, sForm);
      if (r.success) { toast.success("Student updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createStudent(sForm);
      if (r.success) { toast.success("Student added."); refresh(); } else { toast.error(r.error); return; }
    }
    setStudentFormOpen(false);
  };

  const handleTeacherSubmit = () => {
    if (!tForm.name.trim()) { toast.error("Teacher name is required."); return; }
    if (tForm.salary < 0) { toast.error("Salary cannot be negative."); return; }
    if (editingTeacher) {
      const r = updateTeacher(editingTeacher, tForm);
      if (r.success) { toast.success("Teacher updated."); refresh(); } else { toast.error(r.error); return; }
    } else {
      const r = createTeacher(tForm);
      if (r.success) { toast.success("Teacher added."); refresh(); } else { toast.error(r.error); return; }
    }
    setTeacherFormOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Madrasa</h1>
        <p className="text-muted-foreground">Manage madrasa students and teachers.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><Users className="size-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Students</p><p className="text-xl font-bold">{students.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><Users className="size-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Active Students</p><p className="text-xl font-bold">{getActiveStudents().length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="size-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Total Teachers</p><p className="text-xl font-bold">{teachers.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="size-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Active Teachers</p><p className="text-xl font-bold">{getActiveTeachers().length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 py-4"><div className="flex size-10 items-center justify-center rounded-lg bg-primary/10"><GraduationCap className="size-5 text-primary" /></div><div><p className="text-xs text-muted-foreground">Teacher Salary</p><p className="text-xl font-bold">{formatCurrency(getTotalTeacherSalary())}</p></div></CardContent></Card>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Search students or teachers..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="teachers">Teachers</TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Students ({filteredStudents.length})</CardTitle>
              <Button onClick={() => { setSForm(emptyStudent); setEditingStudent(null); setStudentFormOpen(true); }} size="sm"><Plus className="size-4 mr-1" /> Add Student</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">Father</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No students found.</TableCell></TableRow>}
                    {filteredStudents.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.name}</TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">{s.fatherName}</TableCell>
                        <TableCell><Badge variant="secondary">{s.className}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{s.phone}</TableCell>
                        <TableCell><Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => { setSForm({ name: s.name, fatherName: s.fatherName, phone: s.phone, className: s.className, admissionDate: s.admissionDate, status: s.status, notes: s.notes }); setEditingStudent(s.id); setStudentFormOpen(true); }} aria-label="Edit"><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteStudentTarget(s)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
              <Button onClick={() => { setTForm(emptyTeacher); setEditingTeacher(null); setTeacherFormOpen(true); }} size="sm"><Plus className="size-4 mr-1" /> Add Teacher</Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Salary</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No teachers found.</TableCell></TableRow>}
                    {filteredTeachers.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell>{t.subject}</TableCell>
                        <TableCell className="text-right hidden sm:table-cell font-medium">{formatCurrency(t.salary)}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">{t.phone}</TableCell>
                        <TableCell><Badge variant={t.status === "active" ? "default" : "secondary"}>{t.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon-sm" onClick={() => { setTForm({ name: t.name, phone: t.phone, subject: t.subject, salary: t.salary, joiningDate: t.joiningDate, status: t.status, notes: t.notes }); setEditingTeacher(t.id); setTeacherFormOpen(true); }} aria-label="Edit"><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteTeacherTarget(t)} aria-label="Delete"><Trash2 className="size-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Student Form */}
      <Dialog open={studentFormOpen} onOpenChange={setStudentFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingStudent ? "Edit Student" : "Add Student"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name *</Label><Input value={sForm.name} onChange={(e) => setSForm({ ...sForm, name: e.target.value })} placeholder="Student name" /></div>
            <div className="grid gap-2"><Label>Father Name</Label><Input value={sForm.fatherName} onChange={(e) => setSForm({ ...sForm, fatherName: e.target.value })} placeholder="Father name" /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Phone</Label><Input value={sForm.phone} onChange={(e) => setSForm({ ...sForm, phone: e.target.value })} placeholder="Phone" /></div>
              <div className="grid gap-2"><Label>Class *</Label><Input value={sForm.className} onChange={(e) => setSForm({ ...sForm, className: e.target.value })} placeholder="e.g. Hifz - Class 2" /></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Admission Date</Label><Input type="date" value={sForm.admissionDate} onChange={(e) => setSForm({ ...sForm, admissionDate: e.target.value })} /></div>
              <div className="grid gap-2"><Label>Status</Label><Select value={sForm.status} onValueChange={(v) => setSForm({ ...sForm, status: v as StudentStatus })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{STUDENT_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={sForm.notes} onChange={(e) => setSForm({ ...sForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setStudentFormOpen(false)}>Cancel</Button><Button onClick={handleStudentSubmit}>{editingStudent ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teacher Form */}
      <Dialog open={teacherFormOpen} onOpenChange={setTeacherFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2"><Label>Name *</Label><Input value={tForm.name} onChange={(e) => setTForm({ ...tForm, name: e.target.value })} placeholder="Teacher name" /></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Phone</Label><Input value={tForm.phone} onChange={(e) => setTForm({ ...tForm, phone: e.target.value })} placeholder="Phone" /></div>
              <div className="grid gap-2"><Label>Subject</Label><Input value={tForm.subject} onChange={(e) => setTForm({ ...tForm, subject: e.target.value })} placeholder="Subject" /></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label>Salary (Rs.)</Label><Input type="number" min={0} value={tForm.salary || ""} onChange={(e) => setTForm({ ...tForm, salary: Number(e.target.value) })} placeholder="0" /></div>
              <div className="grid gap-2"><Label>Joining Date</Label><Input type="date" value={tForm.joiningDate} onChange={(e) => setTForm({ ...tForm, joiningDate: e.target.value })} /></div>
            </div>
            <div className="grid gap-2"><Label>Status</Label><Select value={tForm.status} onValueChange={(v) => setTForm({ ...tForm, status: v as TeacherStatus })}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{TEACHER_STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Notes</Label><Textarea value={tForm.notes} onChange={(e) => setTForm({ ...tForm, notes: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTeacherFormOpen(false)}>Cancel</Button><Button onClick={handleTeacherSubmit}>{editingTeacher ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmDialog open={!!deleteStudentTarget} onOpenChange={() => setDeleteStudentTarget(null)} onConfirm={() => { if (deleteStudentTarget) { const r = deleteStudent(deleteStudentTarget.id); if (r.success) { toast.success("Student deleted."); refresh(); } else { toast.error(r.error); } } setDeleteStudentTarget(null); }} title="Delete Student" description={`Are you sure you want to delete "${deleteStudentTarget?.name}"?`} />
      <DeleteConfirmDialog open={!!deleteTeacherTarget} onOpenChange={() => setDeleteTeacherTarget(null)} onConfirm={() => { if (deleteTeacherTarget) { const r = deleteTeacher(deleteTeacherTarget.id); if (r.success) { toast.success("Teacher deleted."); refresh(); } else { toast.error(r.error); } } setDeleteTeacherTarget(null); }} title="Delete Teacher" description={`Are you sure you want to delete "${deleteTeacherTarget?.name}"?`} />
    </div>
  );
}
