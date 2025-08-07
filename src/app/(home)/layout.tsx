import { Footer } from "@/components/footer";
import { SiteHeader } from "@/components/site-header";

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col mt-10 md:mt-0">
            <main>{children}</main>
            <Footer />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
