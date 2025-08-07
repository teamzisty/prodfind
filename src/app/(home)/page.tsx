import { Hero } from "@/components/hero";
import Features from "@/components/features";
import { Products } from "@/components/products/products";
import { Products as ProductsType } from "@/types/product";
import { trpc } from "@/trpc/server";
import { CTA } from "@/components/cta";

export default async function Home() {
  const products = await trpc.getProducts({}) as ProductsType;

  return (
    <>
      <div className="container mx-auto py-10 px-3 md:px-5">
        <div className="flex flex-col gap-1 pb-11">
          <h1 className="text-3xl font-semibold">Let's find the best products together!</h1>
          <p className="text-neutral-400">There products are randomly selected from Prodfind.</p>
        </div>

        <Products initialProducts={products} />
      </div>
      <Features />
      <CTA />
    </>
  );
}
