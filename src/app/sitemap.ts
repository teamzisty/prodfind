import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { isNull } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodfind.space'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/ranking`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ]

  // Get all non-deleted products for dynamic routes
  const productRoutes: MetadataRoute.Sitemap = []
  
  try {
    const allProducts = await db
      .select({
        id: products.id,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(isNull(products.deletedAt))

    for (const product of allProducts) {
      productRoutes.push({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch (error) {
    console.error('Failed to fetch products for sitemap:', error)
  }

  return [...staticRoutes, ...productRoutes]
}