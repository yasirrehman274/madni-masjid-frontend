"use client";

import { useEffect, useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { initializeData } from "@/lib/initialize-data";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar collapsed={collapsed} />
        </div>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0" showCloseButton={false}>
            <AdminSidebar collapsed={false} />
          </SheetContent>
        </Sheet>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <AdminHeader
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
            onToggleMobile={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
