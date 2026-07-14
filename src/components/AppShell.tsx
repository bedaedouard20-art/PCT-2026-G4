import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Calendar,
  ClipboardList,
  DollarSign,
  FileStack,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  ShieldCheck,
  SlidersHorizontal,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const NAV: {
  to: string;
  label: string;
  icon: any;
  roles: AppRole[];
}[] = [
  { to: "/dashboard", label: "Pilotage", icon: LayoutDashboard, roles: ["admin", "secretaire"] },
  { to: "/recapitulatif", label: "Mon suivi", icon: FileText, roles: ["enseignant"] },
  { to: "/cours", label: "Cours assignés", icon: BookOpen, roles: ["enseignant"] },
  { to: "/sequences", label: "Séquences", icon: ListOrdered, roles: ["enseignant"] },
  { to: "/ressources", label: "Ressources produites", icon: FileStack, roles: ["enseignant"] },
  { to: "/activites", label: "Activités déclarées", icon: ClipboardList, roles: ["enseignant"] },
  { to: "/enseignants", label: "Gestion des enseignants", icon: Users, roles: ["secretaire"] },
  { to: "/cours", label: "Programmation des cours", icon: BookOpen, roles: ["secretaire"] },
  { to: "/activites", label: "Validation des activités", icon: ClipboardList, roles: ["secretaire"] },
  { to: "/fiche-enseignant", label: "Suivi des enseignants", icon: UserCheck, roles: ["secretaire"] },
  { to: "/etats-paiement", label: "États de paiement", icon: DollarSign, roles: ["secretaire"] },
  { to: "/etats-globaux", label: "États globaux", icon: BarChart3, roles: ["admin", "secretaire"] },
  { to: "/baremes", label: "Barèmes", icon: SlidersHorizontal, roles: ["admin"] },
  { to: "/annees-academiques", label: "Années académiques", icon: Calendar, roles: ["admin"] },
  { to: "/utilisateurs", label: "Accès & rôles", icon: ShieldCheck, roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, hasRole } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  function canSeeNavItem(item: (typeof NAV)[number]) {
    return item.roles.some((role) => hasRole(role));
  }

  const visibleNav = NAV.filter(canSeeNavItem);

  const SidebarInner = (
    <aside className="flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white p-1.5 shadow-sm">
          <img src={logo} alt="UVCI" className="h-full w-full object-contain" />
        </div>
        <div className="leading-tight">
          <div className="font-display text-base font-bold">UVCI</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/70">
            Gestion pédagogique
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = path === item.to;
          return (
            <Link
              key={`${item.to}-${item.label}`}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-4">
        <div className="mb-3 text-xs">
          <div className="truncate font-medium">{user?.email}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {roles.map((role) => (
              <span
                key={role}
                className="rounded bg-sidebar-accent px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-sidebar-primary"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mb-2 w-full gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Link to="/change-password">
            <KeyRound className="h-4 w-4" /> Mot de passe
          </Link>
        </Button>
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="w-full gap-2 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">{SidebarInner}</div>

      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative">{SidebarInner}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
          <button onClick={() => setOpen(true)} className="p-2">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <img src={logo} alt="UVCI" className="h-8 w-auto" />
          <div className="w-9" />
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
