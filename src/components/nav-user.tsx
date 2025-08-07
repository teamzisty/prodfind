"use client"

import {
    BoltIcon,
    HomeIcon,
    LogInIcon,
    LogOutIcon,
    UserIcon,
    MessageCircleIcon,
    BookOpenIcon,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from "uuid";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

export function NavUser() {
    const router = useRouter();
    const { session, auth } = useAuth();
    const uuid = uuidv4().slice(0, 8);

    const { isMobile } = useSidebar()

    if (!session) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <Avatar>
                                    <AvatarImage src="https://github.com/ghost.png" />
                                    <AvatarFallback>
                                        <UserIcon
                                            size={16}
                                            className="text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">Guest</span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {uuid}
                                    </span>
                                </div>
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                            side={isMobile ? "bottom" : "right"}
                            align="end"
                            sideOffset={4}
                        >
                            <DropdownMenuLabel className="p-0 font-normal">
                                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                    <Avatar>
                                        <AvatarImage src="https://github.com/ghost.png" />
                                        <AvatarFallback>
                                            <UserIcon
                                                size={16}
                                                className="text-muted-foreground"
                                                aria-hidden="true"
                                            />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">Guest</span>
                                        <span className="text-muted-foreground truncate text-xs">
                                            {uuid}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <Link className="flex items-center gap-2 w-full" href="https://docs.prodfind.space/" target="_blank" rel="noopener noreferrer">
                                        <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                            <BookOpenIcon />
                                            Docs
                                        </DropdownMenuItem>
                                    </Link>
                                    <Link className="flex items-center gap-2 w-full" href="https://discord.gg/teamzisty" target="_blank" rel="noopener noreferrer">
                                        <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                            <MessageCircleIcon />
                                            <span className="flex items-center">Discord Server</span>
                                        </DropdownMenuItem>
                                    </Link>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <Link className="flex items-center gap-2 w-full" href="/login">
                                    <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                        <LogInIcon
                                            size={16}
                                            className="text-muted-foreground"
                                            aria-hidden="true"
                                        />
                                        <span>Login</span>
                                    </DropdownMenuItem>
                                </Link>
                            </DropdownMenuGroup>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu >
        );
    }

    const handleLogout = async () => {
        await auth.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/");
                },
            },
        });
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar>
                                <AvatarImage
                                    src={session.user.image ?? undefined}
                                    alt="Profile image"
                                />
                                <AvatarFallback>
                                    {session.user.name ? session.user.name.charAt(0) : "A"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{session.user.name ? session.user.name : "Anonymous"}</span>
                                <span className="text-muted-foreground truncate text-xs">
                                    {session.user.email}
                                </span>
                            </div>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar>
                                    <AvatarImage
                                        src={session.user.image ?? undefined}
                                        alt="Profile image"
                                    />
                                    <AvatarFallback>
                                        {session.user.name ? session.user.name.charAt(0) : "A"}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{session.user.name ? session.user.name : "Anonymous"}</span>
                                    <span className="text-muted-foreground truncate text-xs">
                                        {session.user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link className="flex items-center gap-2 w-full" href="/account" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                    <UserIcon size={16} className="opacity-60" aria-hidden="true" />
                                    <span>Account</span>
                                </DropdownMenuItem>
                            </Link>
                            <Link className="flex items-center gap-2 w-full" href="/dashboard" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                    <BoltIcon size={16} className="opacity-60" aria-hidden="true" />
                                    <span>Dashboard</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <Link className="flex items-center gap-2 w-full" href="https://docs.prodfind.space/" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                    <BookOpenIcon />
                                    Docs
                                </DropdownMenuItem>
                            </Link>
                            <Link className="flex items-center gap-2 w-full" href="https://discord.gg/teamzisty" target="_blank" rel="noopener noreferrer">
                                <DropdownMenuItem className="flex items-center gap-2 w-full cursor-pointer">
                                    <MessageCircleIcon />
                                    <span className="flex items-center">Discord Server</span>
                                </DropdownMenuItem>
                            </Link>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                            <LogOutIcon size={16} className="opacity-60" aria-hidden="true" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}