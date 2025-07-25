import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodfind.space'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/features',
          '/contact',
          '/privacy',
          '/terms',
          '/login',
          '/register',
          '/product/',
        ],
        disallow: [
          '/dashboard/',
          '/admin/',
          '/account/',
          '/api/',
          '/_next/',
          '/static/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}