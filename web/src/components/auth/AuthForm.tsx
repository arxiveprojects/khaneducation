import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useRegister } from "@/hooks/useApiQueries";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import { BrandMark } from "@/components/brand/BrandMark";

const DEMO_ACCOUNTS = [
  { label: "Student", email: "student@example.com" },
  { label: "Teacher", email: "teacher@example.com" },
  { label: "Owner", email: "owner@example.com" },
] as const;

export const AuthForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    first_name: "",
    last_name: "",
    account_type: "student" as "student" | "teacher" | "school_admin",
  });
  const [mode, setAuthMode] = useState("login");

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const toggleAuthMode = () => {
    setAuthMode((prev) => (prev === "login" ? "register" : "login"));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "login") {
        await loginMutation.mutateAsync({
          email: formData.email,
          password: formData.password,
        });
      } else {
        await registerMutation.mutateAsync(formData);
      }
    } catch {
      // Error handling is done in the mutations
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,hsl(16_60%_55%/0.16),transparent_42%),radial-gradient(circle_at_88%_8%,hsl(148_28%_40%/0.14),transparent_36%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-10 md:grid-cols-[1.1fr_0.9fr] md:px-8">
        <div className="max-w-xl">
          <BrandMark />
          <p className="mt-10 text-[0.72rem] uppercase tracking-[0.32em] text-muted-foreground">School operating system</p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] md:text-7xl">
            Learn from the page.
            <span className="block italic text-primary">Cite every line.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg text-muted-foreground">
            Books become isolated interactive chapters. Teachers mark attendance. Slidegen jobs stay visible until a chapter is ready.
          </p>
        </div>

        <Card className="shadow-large">
          <CardHeader className="pb-3">
            <CardTitle className="text-3xl">
              {mode === "login" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to continue your learning journey"
                : "Start your educational adventure today"}
            </CardDescription>
            {mode === "login" ? (
              <p className="pt-2 text-xs text-muted-foreground">
                Demo: student@example.com, teacher@example.com, or owner@example.com — password Abc123()
              </p>
            ) : null}
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {mode === "login" ? (
                <div className="flex flex-wrap gap-2">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.email}
                      type="button"
                      className="rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs uppercase tracking-[0.12em] text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          email: account.email,
                          password: "Abc123()",
                        }))
                      }
                    >
                      {account.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {mode === "register" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        required
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        required
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="johndoe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_type">I am a</Label>
                    <select
                      id="account_type"
                      name="account_type"
                      value={formData.account_type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          account_type: e.target.value as typeof prev.account_type,
                        }))
                      }
                      className="flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="school_admin">School admin</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="•••"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isLoading || loginMutation.isPending || registerMutation.isPending}
              >
                {isLoading || loginMutation.isPending || registerMutation.isPending
                  ? "Processing..."
                  : mode === "login"
                    ? "Sign In"
                    : "Sign Up"}
              </Button>

              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={toggleAuthMode}
                  className="ml-1 font-medium text-primary hover:underline"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
