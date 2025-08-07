"use client";

import {
  BellIcon,
  AlertTriangle,
  Sparkles,
  Bookmark,
  CheckCircle,
  RefreshCcwIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";

function Dot({ className }: { className?: string }) {
  return (
    <svg
      width="6"
      height="6"
      fill="currentColor"
      viewBox="0 0 6 6"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="3" cy="3" r="3" />
    </svg>
  );
}

export default function NotificationMenu() {
  const utils = trpc.useUtils();
  const { session } = useAuth();

  const {
    data: notifications,
    isLoading,
    refetch,
  } = trpc.notifications.get.useQuery(undefined, { enabled: !!session });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.get.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.get.invalidate();
    },
  });

  if (!session) return null;

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleNotificationClick = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const getNotificationMessage = (notification: any) => {
    if (notification.action === "product_removed") {
      const metadata = notification.metadata
        ? JSON.parse(notification.metadata)
        : {};
      return (
        <Link href={`/appeal?notificationId=${notification.id}`}>
          Your product{" "}
          <span className="text-foreground font-medium">
            &quot;{metadata.productName || "Unknown Product"}&quot;
          </span>{" "}
          was removed for violating our Terms of Service.
        </Link>
      );
    }

    if (notification.action === "product_restored") {
      const metadata = notification.metadata
        ? JSON.parse(notification.metadata)
        : {};
      return (
        <Link href={`/product/${notification.target}`}>
          Congrats! Your product{" "}
          <span className="text-foreground font-medium">
            &quot;{metadata.productName || "Unknown Product"}&quot;
          </span>{" "}
          was restored.
        </Link>
      );
    }

    if (notification.action === "appeal_rejected") {
      const metadata = notification.metadata
        ? JSON.parse(notification.metadata)
        : {};
      return (
        <>
          Sorry, your appeal was rejected for the product{" "}
          <span className="text-foreground font-medium">
            &quot;{metadata.productName || "Unknown Product"}&quot;
          </span>{" "}
          with the reason &quot;{metadata.message || "violated our Terms of Service"}&quot;.
        </>
      );
    }
    

    // Default format for other notifications
    return (
      <>
        <span className="text-foreground font-medium hover:underline">
          {notification.actor?.name || "Someone"}
        </span>{" "}
        {notification.action}{" "}
        <span className="text-foreground font-medium hover:underline">
          {notification.product?.name || "a product"}
        </span>
        .
      </>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground relative size-8 rounded-full shadow-none"
          aria-label="Open notifications"
        >
          <BellIcon size={16} aria-hidden="true" />
          {unreadCount > 0 && (
            <div
              aria-hidden="true"
              className="bg-primary absolute top-0.5 right-0.5 size-1 rounded-full"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-1 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between gap-4 px-3 py-2">
          <div className="text-sm font-semibold">Notifications</div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="!p-0 !w-6 !h-6"
              onClick={() => {
                refetch();
              }}
            >

              <RefreshCcwIcon size={16} className={isLoading ? "animate-spin" : ""} />
            </Button>
            {unreadCount > 0 && (
              <button
                className="text-xs font-medium hover:underline"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
        <div
          role="separator"
          aria-orientation="horizontal"
          className="bg-border -mx-1 my-1 h-px"
        ></div>
        {isLoading && <div className="p-4 text-sm">Loading...</div>}
        {!isLoading && notifications?.length === 0 && (
          <div className="p-4 text-sm">No notifications</div>
        )}
        {notifications?.map((notification) => {
          const metadata = notification.metadata
            ? JSON.parse(notification.metadata)
            : {};
          const isProductRemoval = notification.action === "product_removed";

          return (
            <div
              key={notification.id}
              className="rounded-md px-3 py-2 text-sm transition-colors"
            >
              <div className="relative flex items-center pe-3">
                <div className="flex-1 space-y-1">
                  <div
                    className={`text-foreground/80 text-left cursor-pointer hover:bg-accent`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    {isProductRemoval && (
                      <AlertTriangle className="inline w-4 h-4 mr-2 text-orange-500" />
                    )}
                    {notification.action === "recommendation" && (
                      <Sparkles className="inline w-4 h-4 mr-2 text-yellow-500" />
                    )}
                    {notification.action === "bookmark" && (
                      <Bookmark className="inline w-4 h-4 mr-2 text-blue-500" />
                    )}
                    {notification.action === "product_restored" && (
                      <CheckCircle className="inline w-4 h-4 mr-2 text-green-500" />
                    )}
                    {notification.action === "appeal_rejected" && (
                      <AlertTriangle className="inline w-4 h-4 mr-2 text-red-500" />
                    )}
                    {getNotificationMessage(notification)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(notification.createdAt).toLocaleString()}
                    {metadata.appealed && !metadata.appealRejected && (
                      <span className="ml-2 text-blue-600 font-medium">
                        • Appeal submitted
                      </span>
                    )}
                    {metadata.appealRejected && (
                      <span className="ml-2 text-red-600 font-medium">
                        • Appeal rejected
                      </span>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <div className="absolute end-0 self-center">
                    <span className="sr-only">Unread</span>
                    <Dot />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
