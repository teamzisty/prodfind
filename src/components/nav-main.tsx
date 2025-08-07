"use client"

import React from "react"
import Link from "next/link"
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { type Icon } from "lucide-react"
import { NavSearch } from "./nav-search"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: typeof Icon,
        invalid?: boolean
    }[]
}) {
    return (
        <SidebarGroup>
            <SidebarGroupContent className="flex flex-col gap-2">
                <SidebarMenu className="mb-2">
                    <NavSearch />
                </SidebarMenu>
                <SidebarMenu>
                    {items.map((item) => (
                        item.title && item.url ? (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton 
                                    tooltip={item.title}
                                    disabled={item.invalid}
                                    className={item.invalid ? "opacity-50 cursor-not-allowed" : ""}
                                    asChild={!item.invalid}
                                >
                                    {item.invalid ? (
                                        <>
                                            {item.icon ? React.createElement(item.icon) : null}
                                            <span>{item.title}</span>
                                        </>
                                    ) : (
                                        <Link href={item.url}>
                                            {item.icon ? React.createElement(item.icon) : null}
                                            <span>{item.title}</span>
                                        </Link>
                                    )}
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ) : (
                            <div className="py-1.5" key={item.title || Math.random()} />
                        )
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    )
}
