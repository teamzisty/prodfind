import { notFound } from "next/navigation";
import { trpc } from "@/trpc/server";
import { HydrateClient } from "@/trpc/server";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductWithAuthor } from "@/types/product";
import { Metadata } from "next";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const product = await trpc.getProduct({ productId: id });

    if (!product) {
      return {
        title: "Product Not Found",
        description: "The requested product could not be found.",
      };
    }

    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || ""}/api/og?productId=${id}`;

    return {
      title: `${product.name} | Prodfind`,
      description: product.shortDescription || undefined,
      openGraph: {
        title: product.name,
        description: product.shortDescription || undefined,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: product.name,
          },
        ],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: product.name,
        description: product.shortDescription || undefined,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    return {
      title: "Product | Prodfind",
      description: "Discover amazing products on Prodfind",
    };
  }
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  // Server-side data fetching
  let product, bookmarkStatus, recommendationStatus;

  try {
    [product, bookmarkStatus, recommendationStatus] = await Promise.all([
      trpc.getProduct({ productId: id }),
      trpc.getBookmarkStatus({ productId: id }).catch(() => null),
      trpc.getRecommendationStatus({ productId: id }).catch(() => null),
    ]);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  return (
    <HydrateClient>
      <div className="container mx-auto px-4 py-8 min-h-screen">
        <ProductDetail
          product={product as unknown as ProductWithAuthor}
          bookmarkStatus={bookmarkStatus}
          recommendationStatus={recommendationStatus}
        />
      </div>
    </HydrateClient>
  );
}
