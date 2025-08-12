"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BoxIcon,
  PlusIcon,
  TelescopeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  const { session } = useAuth();

  return (
    <div className="py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
        Welcome back, {session?.user?.name}!
      </p>
      </div>
      
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-2">Quick actions</h2>
        <p className="text-sm text-muted-foreground">
          Here are some quick actions you can take.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  <span>Create a new product</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create a new product to get started. You can add images, links, and more.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/products/new">
                  <PlusIcon className="w-4 h-4" />
                  Create product
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <TelescopeIcon className="w-4 h-4" />
                  <span>Explore world of products</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Explore the world of products and find the best ones for you.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/ranking">
                  <PlusIcon className="w-4 h-4" />
                  Explore products
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <CardTitle>
                <div className="flex items-center gap-2">
                  <BoxIcon className="w-4 h-4" />
                  <span>Your products</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View and manage your products. You can edit, delete, and more.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/products">
                  <BoxIcon className="w-4 h-4" />
                  View products
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
