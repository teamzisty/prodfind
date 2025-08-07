"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, UserPlusIcon } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { SiGithub, SiGoogle } from "@icons-pack/react-simple-icons";
import Link from "next/link";
import { toast } from "sonner";

export default function RegisterPage() {
  const { auth, error: authError, isPending } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
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
      const { error } = await auth.signUp.email({
        name: "",
        email: form.email,
        password: form.password,
      });
      if (error) {
        throw new Error(error.message);
      }
      toast.success("Registration successful", {
        description: "Please check your email for complete registration",
      });
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialRegister = async (provider: string) => {
    try {
      const data = await auth.signIn.social({
        provider,
      });
      console.log(data);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-0 bg-card/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
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
                autoComplete="new-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={isPending}
              />
            </div>
            {(error || authError?.message) && (
              <div className="text-destructive text-sm font-medium">
                {error || authError?.message || "Registration failed"}
              </div>
            )}
            <Button
              type="submit"
              className="w-full flex items-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlusIcon size={18} />
                  Register
                </>
              )}
            </Button>
          </form>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleSocialRegister("google")}
            >
              <SiGoogle size={18} />
              Login with Google
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSocialRegister("github")}
            >
              <SiGithub size={18} />
              Login with GitHub
            </Button>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
