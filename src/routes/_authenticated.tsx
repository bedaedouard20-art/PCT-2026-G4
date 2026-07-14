import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, hasRole } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if ((user.user_metadata as any)?.must_change_password) {
      navigate({ to: "/change-password" });
      return;
    }
    const isStaff = hasRole("admin") || hasRole("secretaire");
    const adminOnlyPaths = [
      "/baremes",
      "/annees-academiques",
      "/utilisateurs",
    ];
    const teacherRestrictedPaths = [
      "/dashboard",
      "/fiche-enseignant",
      "/enseignants",
      "/etats-paiement",
      "/etats-globaux",
      "/baremes",
      "/annees-academiques",
      "/utilisateurs",
    ];
    if (!hasRole("admin") && adminOnlyPaths.includes(path)) {
      navigate({ to: hasRole("secretaire") ? "/dashboard" : "/recapitulatif" });
      return;
    }
    if (!isStaff && teacherRestrictedPaths.includes(path)) {
      navigate({ to: "/recapitulatif" });
    }
  }, [loading, user, hasRole, path, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
