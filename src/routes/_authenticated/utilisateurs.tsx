import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { listUsersWithRoles, assignRole, removeRole, createUserWithRole } from "@/lib/roles.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Shield, ShieldCheck, UserCog, UserPlus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/utilisateurs")({
  component: UtilisateursPage,
});

type Row = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  created_at: string;
  roles: ("admin" | "secretaire" | "enseignant")[];
};

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrateur",
  secretaire: "Secrétaire",
  enseignant: "Enseignant",
};

const ROLE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  secretaire: "secondary",
  enseignant: "outline",
};

function UtilisateursPage() {
  const { hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchUsers = useServerFn(listUsersWithRoles);
  const doAssign = useServerFn(assignRole);
  const doRemove = useServerFn(removeRole);
  const doCreate = useServerFn(createUserWithRole);

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    password: "",
    role: "enseignant" as "admin" | "secretaire" | "enseignant",
  });

  useEffect(() => {
    if (!authLoading && !hasRole("admin")) {
      toast.error("Accès réservé aux administrateurs");
      navigate({ to: "/dashboard" });
    }
  }, [authLoading, hasRole, navigate]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchUsers();
      setRows(res.users);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasRole("admin")) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handleAssign(userId: string) {
    const role = pending[userId] as "admin" | "secretaire" | "enseignant" | undefined;
    if (!role) return;
    setBusy(userId);
    try {
      const res: any = await doAssign({ data: { userId, role } });
      toast.success(`Rôle « ${ROLE_LABEL[role]} » attribué`);
      if (role === "enseignant" && !res?.teacherLinked) {
        toast.warning("Aucune fiche enseignant n'a été liée à ce compte", {
          description: "Vérifiez que l'email Auth correspond exactement à l'email de la fiche enseignant.",
          duration: 9000,
        });
      }
      setPending((p) => ({ ...p, [userId]: "" }));
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Échec");
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove(userId: string, role: "admin" | "secretaire" | "enseignant") {
    setBusy(userId + role);
    try {
      await doRemove({ data: { userId, role } });
      toast.success(`Rôle « ${ROLE_LABEL[role]} » retiré`);
      await load();
    } catch (e: any) {
      toast.error(e?.message ?? "Échec");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res: any = await doCreate({ data: form });
      if (res?.emailSent) {
        toast.success(`Utilisateur ${form.email} créé — invitation envoyée par email`);
      } else {
        toast.success(`Utilisateur ${form.email} créé`, {
          description:
            "L'email d'invitation n'a pas pu être envoyé (domaine email non configuré). Communiquez le mot de passe provisoire manuellement.",
          duration: 8000,
        });
      }
      if (form.role === "enseignant" && !res?.teacherLinked) {
        toast.warning("Aucune fiche enseignant n'a été liée à ce compte", {
          description: "Vérifiez que l'email du compte correspond exactement à l'email de la fiche enseignant.",
          duration: 9000,
        });
      }
      setCreateOpen(false);
      setForm({ prenom: "", nom: "", email: "", password: "", role: "enseignant" });
      await load();
    } catch (err: any) {
      toast.error(err?.message ?? "Échec de la création");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || !hasRole("admin")) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Vérification…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Créez de nouveaux comptes et gérez les rôles administrateur, secrétaire et enseignant.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualiser"}
          </Button>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" /> Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un utilisateur</DialogTitle>
                <DialogDescription>
                  Le compte sera créé avec son email confirmé et le rôle initial choisi.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nom">Nom *</Label>
                    <Input id="nom" required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe provisoire *</Label>
                  <Input id="password" type="text" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <p className="text-xs text-muted-foreground">8 caractères minimum. À communiquer à l'utilisateur.</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Rôle initial *</Label>
                  <Select value={form.role} onValueChange={(v: any) => setForm({ ...form, role: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enseignant">Enseignant</SelectItem>
                      <SelectItem value="secretaire">Secrétaire</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôles actuels</TableHead>
              <TableHead className="w-[320px]">Attribuer un rôle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Aucun utilisateur.
                </TableCell>
              </TableRow>
            )}
            {!loading &&
              rows.map((u) => {
                const available = (["admin", "secretaire", "enseignant"] as const).filter(
                  (r) => !u.roles.includes(r),
                );
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">
                        {u.prenom || u.nom ? `${u.prenom} ${u.nom}`.trim() : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Inscrit le {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {u.roles.length === 0 && (
                          <span className="text-xs text-muted-foreground">Aucun</span>
                        )}
                        {u.roles.map((r) => (
                          <Badge key={r} variant={ROLE_VARIANT[r]} className="gap-1 pr-1">
                            {r === "admin" ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : r === "secretaire" ? (
                              <UserCog className="h-3 w-3" />
                            ) : (
                              <Shield className="h-3 w-3" />
                            )}
                            {ROLE_LABEL[r]}
                            <button
                              onClick={() => handleRemove(u.id, r)}
                              disabled={busy === u.id + r}
                              className="ml-1 rounded-sm p-0.5 hover:bg-background/30"
                              title="Retirer ce rôle"
                            >
                              {busy === u.id + r ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {available.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Tous les rôles attribués</span>
                      ) : (
                        <div className="flex gap-2">
                          <Select
                            value={pending[u.id] ?? ""}
                            onValueChange={(v) => setPending((p) => ({ ...p, [u.id]: v }))}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choisir un rôle…" />
                            </SelectTrigger>
                            <SelectContent>
                              {available.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ROLE_LABEL[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => handleAssign(u.id)}
                            disabled={!pending[u.id] || busy === u.id}
                          >
                            {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Attribuer"}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
