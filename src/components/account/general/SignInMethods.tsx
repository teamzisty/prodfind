"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AtSign } from "lucide-react";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import { authClient } from "@/lib/auth-client";
import { users, accounts } from "@/lib/db/schema/auth";
import type { InferSelectModel } from "drizzle-orm";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import { AddPasswordDialog } from "./add-password-dialog";

type User = InferSelectModel<typeof users> & {
  accounts: InferSelectModel<typeof accounts>[];
};

type Props = {
  user: User;
};

export function SignInMethods({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showAddPasswordDialog, setShowAddPasswordDialog] = useState(false);

  const emailProvider = user.accounts?.find(
    (a) => a.providerId === "credential"
  );
  const googleProvider = user.accounts?.find((a) => a.providerId === "google");
  const githubProvider = user.accounts?.find((a) => a.providerId === "github");

  const handleConnect = (provider: "google" | "github") => {
    startTransition(async () => {
      const { error } = await authClient.linkSocial({
        provider,
        callbackURL: "/account",
      });

      if (error) {
        toast.error("Failed to connect account.", {
          description: error.message,
        });
        return;
      }

      toast.success("Account connected successfully.");
      router.refresh();
    });
  };

  const handleDisconnect = (providerId: "google" | "github" | "credential") => {
    startTransition(async () => {
      const { error } = await authClient.unlinkAccount({
        providerId,
      });

      if (error) {
        toast.error("Failed to disconnect account.", {
          description: error.message,
        });
        return;
      }

      toast.success("Account disconnected successfully.");
      router.refresh();
    });
  };

  return (
    <>
      <h3 className="mt-8 text-2xl font-semibold tracking-tight">
        Sign-in methods
      </h3>
      <p className="text-muted-foreground">
        Manage your ways of logging into Prodfind.
      </p>
      <Card className="mt-6 bg-secondary">
        <CardContent className="px-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <AtSign className="h-6 w-6" />
              <div>
                <p className="font-medium">Email and password</p>
                <p className="text-sm text-muted-foreground">
                  {emailProvider ? "Set up completed" : "Not set up"}
                </p>
              </div>
            </div>
            {emailProvider ? (
              <Button
                variant="outline"
                onClick={() => handleDisconnect("credential")}
                disabled={isPending || user.accounts.length === 1}
              >
                {isPending
                  ? "Disconnecting..."
                  : user.accounts.length === 1
                    ? "Cannot disable last method"
                    : "Disable"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddPasswordDialog(true)}
                disabled={isPending}
              >
                {isPending ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SiGoogle className="h-6 w-6" />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {googleProvider
                    ? `Connected as ${user.email}`
                    : "Connect your Google account"}
                </p>
              </div>
            </div>
            {googleProvider ? (
              <Button
                variant="outline"
                onClick={() => handleDisconnect("google")}
                disabled={isPending || user.accounts.length === 1}
              >
                {isPending
                  ? "Disconnecting..."
                  : user.accounts.length === 1
                    ? "Cannot disable last method"
                    : "Disable"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleConnect("google")}
                disabled={isPending}
              >
                {isPending ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SiGithub className="h-6 w-6" />
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">
                  {githubProvider
                    ? `Connected as ${githubProvider.accountId}`
                    : "Connect your Github account"}
                </p>
              </div>
            </div>
            {githubProvider ? (
              <Button
                variant="outline"
                onClick={() => handleDisconnect("github")}
                disabled={isPending || user.accounts.length === 1}
              >
                {isPending ? "Disconnecting..." : user.accounts.length === 1 ? "Cannot disable last method" : "Disable"}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => handleConnect("github")}
                disabled={isPending}
              >
                {isPending ? "Connecting..." : "Connect"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <AddPasswordDialog
        open={showAddPasswordDialog}
        onOpenChange={setShowAddPasswordDialog}
      />
    </>
  );
}
