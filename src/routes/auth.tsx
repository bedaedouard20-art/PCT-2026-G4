import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Connexion · UVCI" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function navigateAfterLogin(userId: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (data ?? []).map((r: any) => r.role);
    if (roles.includes("admin") || roles.includes("secretaire")) {
      navigate({ to: "/dashboard" });
      return;
    }
    navigate({ to: "/recapitulatif" });
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigateAfterLogin(data.session.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bienvenue !");
    await navigateAfterLogin(data.user.id);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="bogolan-pattern absolute inset-0 opacity-50" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex flex-col items-center justify-center gap-2">
          <img src={logo} alt="UVCI" className="h-16 w-auto" />
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Gestion pédagogique
          </div>
        </Link>

        <div className="rounded-2xl border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <h1 className="mb-1 text-center font-display text-2xl font-bold">Espace utilisateur</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Connectez-vous avec le compte fourni par l'administration.
          </p>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pwd">Mot de passe</Label>
              <Input id="pwd" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
