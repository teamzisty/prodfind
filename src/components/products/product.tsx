"use client";

import React, { useState, useEffect } from "react";
import { Product as ProductType } from "@/types/product";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ArrowUpRight, CalendarRange, DollarSign, RefreshCcw, Heart } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function Product({ product }: { product: ProductType | null }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // This component should render the product details
  if (!product) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Not found</CardTitle>
          <CardDescription>No product found</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button>Explore products</Button>
        </CardFooter>
      </Card>
    );
  }
  return (
    <Card className="!gap-4">
      <CardHeader>
        {!product.images ||
          (product.images.length === 0 && (
            <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No images</p>
            </div>
          ))}
        {product.images && product.images.length > 0 && (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="w-full h-48 object-cover rounded-md mb-4"
          />
        )}
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.shortDescription || product.description?.slice(0, 100) + (product.description?.length && product.description?.length > 100 ? "..." : "")}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <div className="flex items-center gap-1">
          <DollarSign size="18" />
          <span className="font-medium">{product.price}</span>
          <span>・</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1">
                  <Heart size="18" className="fill-foreground" />
                  <span className="font-medium">
                    {product.recommendationCount || 0}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Recommendations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <CalendarRange size="18" />
                    <span className="text-sm">
                      {isClient
                        ? new Date(product.createdAt).toLocaleDateString()
                        : new Date(product.createdAt).toISOString().split('T')[0]
                      }
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Created at</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span>・</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <RefreshCcw size="18" />
                    <span className="text-sm">
                      {isClient
                        ? new Date(product.updatedAt).toLocaleDateString()
                        : new Date(product.updatedAt).toISOString().split('T')[0]
                      }
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Updated at</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col md:flex-row gap-2 items-center">
        <Button variant="outline" className="w-full md:flex-1" asChild>
          <Link href={`/product/${product.id}`}>View Details</Link>
        </Button>
        {product.links && product.links.length > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full md:flex-1 cursor-pointer">
                Play
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Do you want to play?</AlertDialogTitle>
                <AlertDialogDescription>
                  The page you are being redirected to is not related to Prodfind. Do you still want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Go Back</AlertDialogCancel>
                <AlertDialogAction><Link className="flex items-center" href={product.links[0].url.toString()} target="_blank">Redirect <ArrowUpRight /></Link></AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        {(!product.links || product.links.length === 0) && (
          <Button variant="outline" className="w-full md:flex-1" disabled>
            Not available
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
