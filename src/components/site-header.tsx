"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import NotificationMenu from "@/components/navbar-components/notification-menu";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();

  let title = "Home";
  if (pathname === "/ranking") {
    title = "Ranking";
  } else if (pathname === "/new") {
    title = "New";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex md:hidden h-(--header-height) shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <NotificationMenu />
        </div>
      </div>
    </header>
  );
}
