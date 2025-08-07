"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import {
    Search,
    Trophy,
    PackagePlus,
    Hourglass,
    Sparkles,
    Bookmark,
    Bell,
    House,
    Package,
    Telescope,
    UserIcon,
    Lock,
    Globe,
    KeyRound,
} from "lucide-react"
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"

export function NavSearch() {
    const [open, setOpen] = useState(false)

    const commandGroups: Array<{
        heading?: string;
        items: Array<{
            icon: any;
            label: string;
            url: string;
            disabled?: boolean;
        }>;
    }> = [
            {
                items: [
                    { icon: House, label: "Home", url: "/" },
                    { icon: Search, label: "Search", url: "/search" },
                    { icon: Trophy, label: "Ranking", url: "/ranking" },
                    { icon: PackagePlus, label: "New Products", url: "/new" },
                    { icon: Sparkles, label: "Recommended", url: "/explore", disabled: true },
                    { icon: Hourglass, label: "Upcoming", url: "/explore", disabled: true },
                ]
            },
            {
                heading: "Dashboard",
                items: [
                    { icon: House, label: "Home", url: "/dashboard" },
                    { icon: Package, label: "Products", url: "/dashboard/products" },
                    { icon: Bookmark, label: "Bookmarks", url: "/dashboard/bookmarks" },
                    { icon: Sparkles, label: "Recommendations", url: "/dashboard/recommendations" },
                    { icon: Telescope, label: "Explore", url: "/dashboard/explore" },
                ]
            },
            {
                heading: "Account",
                items: [
                    { icon: UserIcon, label: "Account", url: "/account" },
                    { icon: Lock, label: "Security", url: "/account/security" },
                    { icon: Globe, label: "Sessions", url: "/account/sessions" },
                    { icon: KeyRound, label: "Data", url: "/account/data" },
                ]
            }
        ]

    return (
        <>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 ml-0.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search..."
                    className="pl-8 pr-7 cursor-pointer"
                    onClick={() => setOpen(true)}
                    readOnly
                />
            </div>

            <CommandDialog className="border-4 border-neutral-800 bg-neutral-900" open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Type a command or search..." />
                <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    {commandGroups.map((group, groupIndex) => (
                        <React.Fragment key={groupIndex}>
                            <CommandGroup className="py-2!" heading={group.heading}>
                                {group.items.map((item) => (
                                    <CommandItem
                                        className={`py-2! ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        key={item.label}
                                        disabled={!!item.disabled}
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.label}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {groupIndex < commandGroups.length - 1 && <CommandSeparator />}
                        </React.Fragment>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    )
}
