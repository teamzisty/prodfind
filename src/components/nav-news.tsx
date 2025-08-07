"use client"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Binoculars } from "lucide-react"
import Link from "next/link"

export function NavNews() {
    return (
        <Card className="w-full max-w-sm mb-3.5 border border-dotted bg-transparent">
            <CardContent>
                <h1 className="pb-2 text-lg font-semibold">A fastest way to find <span className="text-primary">Products</span></h1>
                <p className="text-sm text-neutral-400">Let's find the best products together!</p>
                <Link href="/login">
                    <Button className="w-full mt-4" variant="outline"><Binoculars /> Join early access</Button>
                </Link>
            </CardContent>
        </Card>
    )
}
