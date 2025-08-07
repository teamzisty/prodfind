"use client";

import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductActions } from "@/components/product/product-actions";
import { ProductEdit } from "@/components/product/product-edit";
import { ExternalLink } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductWithAuthor } from "@/types/product";
import { useState } from "react";
import { getLicenseText } from "@/lib/licenses";
import { Markdown } from "../products/markdown";
import { LinkIcon } from "../link-icon";
import { CommentsSection } from "../comments/comments-section";

interface ProductDetailProps {
  product: ProductWithAuthor;
  bookmarkStatus: any;
  recommendationStatus: any;
}

export function ProductDetail({
  product,
  bookmarkStatus,
  recommendationStatus,
}: ProductDetailProps) {
  const { session } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = session?.user?.id === product?.authorId;

  if (isEditing && isOwner) {
    return (
      <ProductEdit
        product={product}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
    );
  }

  const MainLink =
    product.links?.find(
      (link) =>
        link.title.toLowerCase() === "website" ||
        link.title.toLowerCase() === "live preview"
    ) || product.links?.[0];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 md:gap-6 mb-8">
        {product.icon && (
          <img
            src={product.icon}
            alt={product.name}
            width={96}
            height={96}
            className="rounded-lg w-24 h-24 object-cover flex-shrink-0"
          />
        )}

        <div className="flex-1">
          <h1 className="text-3xl font-semibold">{product.name}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className="capitalize">{product.visibility}</Badge>
            {(product.category as string[])?.map(
              (cat: string, index: number) => (
                <Badge key={index} variant="outline">
                  {cat}
                </Badge>
              )
            )}
          </div>
        </div>

        {isOwner && (
          <ProductEdit
            product={product}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="md:col-span-2">
          <Tabs defaultValue="general" className="w-full">
            <TabsList
              className={`grid w-full ${
                product.license ? "grid-cols-4" : "grid-cols-3"
              }`}
            >
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="creator">Creator</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
              {product.license && (
                <TabsTrigger value="license">License</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="general" className="mt-6">
              {/* Image Gallery */}
              <ProductGallery product={product} />

              {/* Description */}
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">
                  About this product
                </h2>
                <div className="bg-card border rounded-md p-6">
                  <Markdown content={product.description} />
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <CommentsSection productId={product.id} />
              </div>
            </TabsContent>
            <TabsContent value="creator" className="mt-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Creator</h2>
                <Card>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      {product.author.image && (
                        <Avatar>
                          <AvatarImage src={product.author.image} />
                          <AvatarFallback>
                            {product.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div>
                        <div className="font-semibold flex items-center gap-1 text-lg">
                          {product.author.name}
                          {/* {product.author.emailVerified && (
                            <BadgeCheck className="!w-5 !h-5 text-primary" />
                          )} */}
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {product.author.id.slice(0, 6)}...
                          {product.author.id.slice(-6)}
                        </p>
                      </div>
                    </div>
                    {/* <div className="flex items-center gap-2 mt-4">
                      {product.author.emailVerified && (
                        <Badge className="text-sm">
                          <BadgeCheck className="!w-4 !h-4" /> Verified Creator
                        </Badge>
                      )}
                    </div> */}
                    {/* {product.author.bio && (
                  <p className="mt-4 text-muted-foreground">
                    {product.author.bio}
                  </p>
                )} */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="links" className="mt-6">
              {product.links && product.links.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">Links</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {product.links.map((link: any) => (
                      <Card key={link.url} className="overflow-hidden">
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-full"
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <LinkIcon link={link} />
                                <span className="font-medium">
                                  {link.title}
                                </span>
                              </div>
                              {link.description && (
                                <p className="text-sm text-muted-foreground">
                                  {link.description}
                                </p>
                              )}
                            </div>
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          </CardContent>
                        </a>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            {product.license && (
              <TabsContent value="license" className="mt-6">
                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold">
                    {product.license} License
                  </h2>
                  <Card className="!gap-0 !py-0">
                    <CardContent className="!py-2 !pb-8 whitespace-pre-wrap font-mono text-sm">
                      {getLicenseText(product.license)}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="md:col-span-1 space-y-6">
          <ProductActions
            productId={product.id}
            mainLink={MainLink}
            initialBookmarkStatus={bookmarkStatus || { isBookmarked: false }}
            initialRecommendationStatus={
              recommendationStatus || { isRecommended: false }
            }
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Creator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <img
                  src={product.author.image || "/avatar-placeholder.svg"}
                  alt={product.author.name}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold flex items-center gap-1">
                    {product.author.name}
                    {/* {product.author.emailVerified && (
                      <BadgeCheck className="text-blue-500" size={16} />
                    )} */}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    {product.author.id.slice(0, 6)}...
                    {product.author.id.slice(-6)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {product.links && product.links.length > 0 && (
            <Card className="!gap-4">
              <CardHeader>
                <CardTitle className="text-lg">Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {product.links.map((link: any) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <LinkIcon link={link} />
                        <span className="font-medium">{link.title}</span>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
