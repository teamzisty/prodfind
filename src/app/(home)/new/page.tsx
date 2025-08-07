import { Suspense } from "react"
import { New } from "@/components/products/products"
import { Skeleton } from "@/components/ui/skeleton"
import { trpc } from "@/trpc/server";
import { Products as ProductsType } from "@/types/product";
import { Metadata } from "next";
import { Badge } from "@/components/ui/badge"
import { FlaskConical, TriangleAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "New - Prodfind",
  description: "Let's find the most popular products",
};

export default async function ExplorePage() {
  const products = await trpc.getProducts({}) as ProductsType;
  
  return (
    <div className="container mx-auto py-10 px-5">
      <div className="flex flex-col gap-1 pb-11">
        <h1 className="text-3xl font-semibold">Let's find newly launched products!</h1>
        <p className="text-neutral-400">These are products that have just been released on Prodfind.</p>
        <div className="flex items-center gap-x-2 mt-2"><Badge className="px-2 py-1" variant="outline"><FlaskConical /> Beta</Badge> <Badge className="px-2 py-1" variant="outline"><TriangleAlert /> Developing Feature</Badge></div>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="rounded-lg border p-4">
              <Skeleton className="h-40 w-full rounded-md" />
              <Skeleton className="mt-4 h-6 w-3/4" />
              <Skeleton className="mt-2 h-4 w-1/2" />
            </div>
          ))}
        </div>
      }>
        <New initialProducts={products} autoFocus />
      </Suspense>
    </div >
  )
}
