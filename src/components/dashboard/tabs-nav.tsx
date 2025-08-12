"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";

const navLinks = [
  { value: "dashboard", label: "Home", href: "/dashboard" },
  { value: "products", label: "Products", href: "/dashboard/products" },
  { value: "bookmarks", label: "Bookmarks", href: "/dashboard/bookmarks" },
  {
    value: "recommendations",
    label: "Recommendations",
    href: "/dashboard/recommendations",
  },
  { value: "explore", label: "Explore", href: "/dashboard/ranking" },
  { value: "admin", label: "Admin", href: "/admin", isAdmin: true },
];

export default function TabsNav({
  session,
}: {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
}) {
  const pathname = usePathname();

  const getCurrentTab = () => {
    const current = navLinks.find((link) => link.href === pathname);
    return current ? current.value : "";
  };

  return (
    <div className="sticky top-0 z-50 border-b-2 shadow-sm bg-background p-2">
      <Tabs value={getCurrentTab()} className="w-full">
        <TabsList className="w-full justify-start p-0 bg-background overflow-x-auto scrollbar-hide">
          {navLinks
            .filter((link) => !link.isAdmin || session?.user.role === "admin")
            .map((link) => (
              <TabsTrigger value={link.value} key={link.value} asChild>
                <Link href={link.href}>{link.label}</Link>
              </TabsTrigger>
            ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
