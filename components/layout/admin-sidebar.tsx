"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navigation } from "@/lib/nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface AdminSidebarProps {
  collapsed: boolean;
}

export function AdminSidebar({ collapsed }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-0"
        )}
      >
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  href="/dashboard"
                  className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                  aria-label="Madni Masjid - Dashboard"
                />
              }
            >
              <span className="text-sm font-bold">M</span>
            </TooltipTrigger>
            <TooltipContent side="right">Madni Masjid</TooltipContent>
          </Tooltip>
        ) : (
          <Link href="/dashboard" className="flex flex-col gap-0">
            <span className="text-base font-bold text-sidebar-primary leading-tight">
              MADNI MASJID
            </span>
            <span className="text-xs text-muted-foreground">
              Management System
            </span>
          </Link>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navigation.map((section, sectionIndex) => (
          <div key={section.label} className="mb-1">
            {sectionIndex > 0 && collapsed && (
              <Separator className="my-2 mx-2" />
            )}
            {collapsed ? (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger
                        render={
                          <Link
                            href={item.href}
                            aria-label={item.title}
                            className={cn(
                              "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-sidebar-accent text-sidebar-primary"
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                          />
                        }
                      >
                        <item.icon className="size-5" />
                      </TooltipTrigger>
                      <TooltipContent side="right">{item.title}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ) : (
              <>
                <p className="mb-1 px-3 pt-3 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  {section.label}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      pathname.startsWith(item.href + "/");
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="size-5 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
