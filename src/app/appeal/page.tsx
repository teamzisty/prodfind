"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/trpc/client";
import { useAuth } from "@/context/auth-context";
import { toast } from "sonner";
import { Notification } from "@/types/notification";

export default function AppealPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const notificationId = searchParams.get("notificationId");
  const { session, isPending } = useAuth();

  const [appealMessage, setAppealMessage] = useState("");
  const [notification, setNotification] = useState<Notification | null>(null);

  const { data: notifications } = trpc.notifications.get.useQuery(undefined, {
    enabled: !!session,
  });

  const appealMutation = trpc.notifications.appealProductRemoval.useMutation({
    onSuccess: () => {
      toast.success("Appeal submitted successfully");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error("Failed to submit appeal", { description: error.message });
    },
  });

  useEffect(() => {
    if (notifications && notificationId) {
      const foundNotification = notifications.find(
        (n) => n.id === notificationId
      );
      if (foundNotification && foundNotification.action === "product_removed") {
        setNotification(foundNotification);
      } else {
        toast.error("Appeal not found");
        router.replace("/dashboard");
      }
    }
  }, [notifications, notificationId, router]);

  if (!session && !isPending) {
    router.replace("/login");
    return null;
  }

  if (!notificationId) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Appeal Not Found</CardTitle>
            <CardDescription>
              No appeal notification was specified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const metadata = notification.metadata
    ? JSON.parse(notification.metadata)
    : {};
  const canAppeal = metadata.canAppeal && !metadata.appealed;

  if (!canAppeal) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Appeal Not Available</CardTitle>
            <CardDescription>
              {metadata.appealed
                ? "You have already submitted an appeal for this product removal."
                : "This product removal cannot be appealed."}
              {metadata.appealRejected && (
                <div className="text-xs text-red-600 mt-1">
                  Rejection reason:{" "}
                  {metadata.rejectionReason || "No reason provided"}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!appealMessage.trim()) return;

    appealMutation.mutate({
      notificationId: notification.id,
      appealMessage: appealMessage.trim(),
    });
  };

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <CardTitle>Appeal Product Removal</CardTitle>
          </div>
          <CardDescription>
            Submit an appeal if you believe your product was removed incorrectly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Product Removed:</h3>
            <p className="text-sm text-muted-foreground">
              &quot;{metadata.productName || "Unknown Product"}&quot; was
              removed for &quot;{metadata.reason || "unknown reason"}&quot;.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Removed on {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="appeal-message" className="text-sm font-medium">
              Appeal Message
            </label>
            <Textarea
              id="appeal-message"
              placeholder="Please explain why you believe your product was removed incorrectly. Provide specific details about why your product complies with our Terms of Service..."
              value={appealMessage}
              onChange={(e) => setAppealMessage(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters required
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                appealMessage.trim().length < 10 || appealMutation.isPending
              }
            >
              {appealMutation.isPending ? "Submitting..." : "Submit Appeal"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
