"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { getPageTitle } from "@/lib/nav-config";

interface AdminHeaderProps {
  onToggleMobile: () => void;
  onToggleCollapse: () => void;
  collapsed: boolean;
}

export function AdminHeader({
  onToggleMobile,
  onToggleCollapse,
  collapsed,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-background px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleMobile}
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
          >
            <Menu className="size-5" />
          </Button>
        )}
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
          >
            <Menu className="size-5" />
          </Button>
        )}
        <Separator orientation="vertical" className="h-6 lg:block" />
        <h1 className="text-lg font-semibold tracking-tight">{pageTitle}</h1>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-5" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
        </Button>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
                aria-label="User menu"
              />
            }
          >
            <Avatar size="sm">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-medium leading-tight">Admin</span>
              <span className="text-xs text-muted-foreground">
                Madni Masjid
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
