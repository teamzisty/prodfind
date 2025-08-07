"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogInIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TwoFactorDialog } from "@/components/ui/two-factor-dialog";

export default function LoginPage() {
  const router = useRouter();
  const { auth, error: authError, isPending } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError(null);
  };

  useEffect(() => {
    auth.oneTap();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    setIsLoading(true);
    e.preventDefault();
    setError(null);
    try {
      const { error } = await auth.signIn.email(
        {
          email: form.email,
          password: form.password,
        },
        {
          async onSuccess(data: any) {
            if (data.data?.twoFactorRedirect) {
              setShowTwoFactorDialog(true);
              return;
            }

            toast.success("Login successful", {
              description: "Welcome back!",
            });
            router.push("/dashboard");
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (code: string) => {
    const { error } = await auth.twoFactor.verifyTotp({
      code,
      trustDevice: true,
    });

    if (error) {
      throw new Error(error.message);
    }

    toast.success("Login successful", {
      description: "Welcome back!",
    });
    router.push("/dashboard");
  };

  const handleSocialLogin = async (provider: string) => {
    try {
      const data = await auth.signIn.social({
        provider,
      });
      console.log(data);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Sign in to your account</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-6"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="you@email.com"
                disabled={isPending}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1"
              >
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isPending}
              />
            </div>
            {(error || authError?.message) && (
              <div className="text-destructive text-sm font-medium">
                {error || authError?.message || "Login failed"}
              </div>
            )}
            <Button
              type="submit"
              className="w-full flex items-center gap-2 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogInIcon size={18} />
                  Sign in
                </>
              )}
            </Button>
          </form>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleSocialLogin("google")}
            >
              <SiGoogle size={18} />
              Sign in with Google
            </Button>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => handleSocialLogin("github")}
            >
              <SiGithub size={18} />
              Sign in with GitHub
            </Button>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-primary underline underline-offset-2"
            >
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
      <TwoFactorDialog
        open={showTwoFactorDialog}
        onOpenChange={setShowTwoFactorDialog}
        onSubmit={handleTwoFactorSubmit}
      />
    </div>
  );
}
