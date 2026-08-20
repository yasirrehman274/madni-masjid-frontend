"use client";

import { useEffect, useRef, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Save,
  Download,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Clock,
  CheckCircle,
  Pencil,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getSettings, updateSettings, type MosqueSettings } from "@/services/settings.service";
import { getAuditLogs, clearAuditLogs } from "@/lib/audit";
import { downloadBackup, validateBackupFile, restoreBackup, type BackupData } from "@/lib/backup";
import type { AuditLog } from "@/types";

const ENTITY_LABELS: Record<string, string> = {
  donation: "Donation",
  expense: "Expense",
  fund: "Fund",
  donor: "Donor",
  construction_expense: "Construction Expense",
  construction_project: "Construction Project",
  student: "Student",
  teacher: "Teacher",
  user: "User",
  receipt: "Receipt",
  settings: "Settings",
};

function ActionIcon({ action }: { action: string }) {
  if (action === "create") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (action === "update") return <Pencil className="h-4 w-4 text-blue-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

function actionBadgeVariant(action: string): "default" | "secondary" | "destructive" {
  if (action === "create") return "default";
  if (action === "update") return "secondary";
  return "destructive";
}

interface PageData {
  settings: MosqueSettings;
  logs: AuditLog[];
  lastBackupTime: string | null;
}

const defaultPageData: PageData = {
  settings: { mosqueName: "Madni Masjid", address: "", phone: "", email: "", description: "", currency: "PKR", dateFormat: "dd MMM yyyy" },
  logs: [],
  lastBackupTime: null,
};

export default function SettingsPage() {
  const [data, setData] = useState<PageData>(defaultPageData);
  const [activeTab, setActiveTab] = useState("mosque");
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [backupPreview, setBackupPreview] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData({
      settings: getSettings(),
      logs: getAuditLogs(),
      lastBackupTime: localStorage.getItem("madni_last_backup"),
    });
    setLoading(false);
  }, []);

  const handleSave = () => {
    updateSettings(data.settings);
    toast.success("Settings saved successfully.");
  };

  const handleExport = () => {
    setBackupLoading(true);
    setTimeout(() => {
      try {
        downloadBackup();
        const now = new Date().toISOString();
        localStorage.setItem("madni_last_backup", now);
        setData({ ...data, lastBackupTime: now });
        toast.success("Backup downloaded successfully.");
      } catch {
        toast.error("Failed to download backup.");
      } finally {
        setBackupLoading(false);
      }
    }, 300);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!validateBackupFile(data)) {
          toast.error("Invalid backup file format.");
          return;
        }
        setBackupPreview(data);
      } catch {
        toast.error("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRestore = () => {
    if (!backupPreview) return;
    setRestoreLoading(true);
    setTimeout(() => {
      const result = restoreBackup(backupPreview);
      setRestoreLoading(false);
      if (result.success) {
        toast.success(`Restored ${result.count} collections successfully.`);
        setBackupPreview(null);
        window.location.reload();
      } else {
        toast.error(result.error ?? "Restore failed.");
      }
    }, 300);
  };

  const handleClearLogs = () => {
    clearAuditLogs();
    setData({ ...data, logs: [] });
    toast.success("Audit logs cleared.");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure mosque information and application preferences.</p>
        </div>
        <div className="h-[200px] animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Configure mosque information and application preferences.</p>
        </div>
        {activeTab === "mosque" || activeTab === "preferences" ? (
          <Button onClick={handleSave} className="sm:w-auto w-full"><Save className="size-4 mr-1" /> Save Changes</Button>
        ) : null}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="mosque">Mosque Info</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="mosque" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Mosque Information</CardTitle>
              <CardDescription>Basic details about the mosque.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2 sm:col-span-2"><Label>Mosque Name</Label><Input value={data.settings.mosqueName} onChange={(e) => setData({ ...data, settings: { ...data.settings, mosqueName: e.target.value } })} /></div>
                <div className="grid gap-2 sm:col-span-2"><Label>Address</Label><Textarea value={data.settings.address} onChange={(e) => setData({ ...data, settings: { ...data.settings, address: e.target.value } })} rows={2} /></div>
                <div className="grid gap-2"><Label>Phone</Label><Input value={data.settings.phone} onChange={(e) => setData({ ...data, settings: { ...data.settings, phone: e.target.value } })} /></div>
                <div className="grid gap-2"><Label>Email</Label><Input type="email" value={data.settings.email} onChange={(e) => setData({ ...data, settings: { ...data.settings, email: e.target.value } })} /></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Application settings and display options.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Currency</Label>
                  <Input value={data.settings.currency} onChange={(e) => setData({ ...data, settings: { ...data.settings, currency: e.target.value } })} />
                </div>
                <div className="grid gap-2">
                  <Label>Date Format</Label>
                  <Input value={data.settings.dateFormat} onChange={(e) => setData({ ...data, settings: { ...data.settings, dateFormat: e.target.value } })} />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label>Description</Label>
                  <Textarea value={data.settings.description} onChange={(e) => setData({ ...data, settings: { ...data.settings, description: e.target.value } })} rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
                <CardDescription>Download a backup of all mosque data as a JSON file.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {data.lastBackupTime ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last backup: {format(new Date(data.lastBackupTime), "dd MMM yyyy, hh:mm a")} ({formatDistanceToNow(new Date(data.lastBackupTime), { addSuffix: true })})
                  </div>
                ) : null}
                <Button onClick={handleExport} disabled={backupLoading} className="w-full sm:w-auto">
                  {backupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                  Download Backup
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Import Data</CardTitle>
                <CardDescription>Restore data from a previously exported backup file.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="backup-file" className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full sm:w-auto">
                    <Upload className="mr-2 h-4 w-4" />
                    Choose Backup File
                  </Label>
                  <input ref={fileInputRef} id="backup-file" type="file" accept=".json" className="hidden" onChange={handleFileSelect} />
                </div>

                {backupPreview ? (
                  <div className="rounded-md border p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm font-medium">Backup Preview</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <div>Version: <span className="text-foreground font-medium">{backupPreview.version}</span></div>
                      <div>Exported: <span className="text-foreground font-medium">{format(new Date(backupPreview.exportedAt), "dd MMM yyyy")}</span></div>
                      <div className="col-span-2">Mosque: <span className="text-foreground font-medium">{backupPreview.mosqueName}</span></div>
                    </div>
                    <Separator />
                    <div className="text-sm font-medium">Collections</div>
                    <div className="grid grid-cols-2 gap-1 text-sm text-muted-foreground">
                      {Object.entries(backupPreview.collections).map(([key, val]) => (
                        <div key={key}>
                          {key.replace("madni_", "").replace("_", " ")}: <span className="text-foreground font-medium">{Array.isArray(val) ? val.length : 0}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleRestore} disabled={restoreLoading}>
                        {restoreLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Confirm Restore
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setBackupPreview(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a .json backup file to preview and restore.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Track all changes made across the application.</CardDescription>
              </div>
              {data.logs.length > 0 ? (
                <Button variant="destructive" size="sm" onClick={handleClearLogs}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              {data.logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No audit logs recorded yet.</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Actions like creating, updating, and deleting records will appear here.</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="flex flex-col gap-2">
                    {data.logs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 rounded-md border p-3">
                        <ActionIcon action={log.action} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={actionBadgeVariant(log.action)} className="capitalize">
                              {log.action}
                            </Badge>
                            <Badge variant="outline">{ENTITY_LABELS[log.entity] ?? log.entity}</Badge>
                          </div>
                          <p className="text-sm mt-1">{log.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{format(new Date(log.timestamp), "dd MMM yyyy, hh:mm a")}</span>
                            <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</span>
                            <span>{log.userName}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
