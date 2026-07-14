import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, Check, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/activites")({
  head: () => ({ meta: [{ title: "Activités pédagogiques - UVCI" }] }),
  component: ActivitesPage,
});

const TYPES = [
  { v: "creation", l: "Création de ressources", short: "Création" },
  { v: "mise_a_jour", l: "Mise à jour", short: "Mise à jour" },
];

const NIVEAUX = [
  { v: "niveau_1", l: "Niveau 1 - contenus simples + quiz" },
  { v: "niveau_2", l: "Niveau 2 - activités interactives" },
  { v: "niveau_3", l: "Niveau 3 - serious games, simulations" },
];

const ACTIONS_PEDAGOGIQUES = [
  {
    v: "support_cours",
    l: "Support de cours / contenu simple",
    niveau: "niveau_1",
    heures: 6,
    aide: "Document, texte, diaporama ou support statique.",
  },
  {
    v: "video_pedagogique",
    l: "Vidéo pédagogique",
    niveau: "niveau_1",
    heures: 6,
    aide: "Capsule vidéo ou lien vers une ressource audiovisuelle.",
  },
  {
    v: "quiz",
    l: "Quiz",
    niveau: "niveau_1",
    heures: 4,
    aide: "Questions de contrôle, QCM ou auto-évaluation.",
  },
  {
    v: "evaluation",
    l: "Évaluation / devoir",
    niveau: "niveau_2",
    heures: 8,
    aide: "Devoir, test, activité notée ou grille d'évaluation.",
  },
  {
    v: "activite_interactive",
    l: "Activité interactive",
    niveau: "niveau_2",
    heures: 10,
    aide: "Exercice guidé, activité en ligne ou parcours interactif.",
  },
  {
    v: "simulation",
    l: "Simulation / serious game",
    niveau: "niveau_3",
    heures: 15,
    aide: "Simulation, serious game ou ressource avancée.",
  },
];

const STATUTS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  en_attente: { label: "En attente", variant: "outline" },
  approuve: { label: "Approuvée", variant: "default" },
  rejete: { label: "Rejetée", variant: "destructive" },
};

function ActivitesPage() {
  const qc = useQueryClient();
  const { isStaff, hasRole, user } = useAuth();
  const isTeacherOnly = hasRole("enseignant") && !isStaff;
  const canCreateActivity = isTeacherOnly;
  const canValidateActivities = hasRole("secretaire");
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [form, setForm] = useState<any>({
    enseignant_id: "",
    cours_id: "",
    action_pedagogique: "support_cours",
    type_activite: "creation",
    niveau_ressource: "niveau_1",
    nombre_heures_ressource: "6",
    description: "",
    date_activite: new Date().toISOString().slice(0, 10),
  });

  const selectedAction = useMemo(() => {
    return ACTIONS_PEDAGOGIQUES.find((action) => action.v === form.action_pedagogique) ?? ACTIONS_PEDAGOGIQUES[0];
  }, [form.action_pedagogique]);

  const { data: baremes } = useQuery({
    queryKey: ["baremes-actifs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("baremes_activites")
        .select("type_activite, niveau_ressource, coefficient")
        .eq("actif", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const activeCoefficient = useMemo(() => {
    const bareme = (baremes ?? []).find((b: any) =>
      b.type_activite === form.type_activite && b.niveau_ressource === selectedAction.niveau
    );
    return Number(bareme?.coefficient ?? 0);
  }, [baremes, form.type_activite, selectedAction.niveau]);

  const previewVolume = useMemo(() => {
    return (Number(form.nombre_heures_ressource) * activeCoefficient).toFixed(2);
  }, [activeCoefficient, form.nombre_heures_ressource]);

  const { data: enseignantConnecte } = useQuery({
    queryKey: ["enseignant-connecte", user?.id],
    enabled: isTeacherOnly && Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enseignants")
        .select("id, nom, prenom")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: cours } = useQuery({
    queryKey: ["cours-list", user?.id],
    enabled: canCreateActivity,
    queryFn: async () => {
      const { data, error } = await supabase.from("cours").select("id, intitule").order("intitule");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: activites, isLoading, error: activitesError } = useQuery({
    queryKey: ["activites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activites_pedagogiques")
        .select("*, enseignant:enseignants(nom, prenom), cours:cours(intitule)")
        .order("date_activite", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const activityStats = useMemo(() => {
    const rows = activites ?? [];
    const enAttente = rows.filter((a: any) => (a.statut_validation ?? "en_attente") === "en_attente");
    const approuvees = rows.filter((a: any) => (a.statut_validation ?? (a.valide ? "approuve" : "en_attente")) === "approuve");
    const rejetees = rows.filter((a: any) => (a.statut_validation ?? "en_attente") === "rejete");
    const volumeApprouve = approuvees.reduce((sum: number, a: any) => sum + Number(a.volume_horaire_calcule ?? 0), 0);

    return {
      total: rows.length,
      enAttente: enAttente.length,
      approuvees: approuvees.length,
      rejetees: rejetees.length,
      volumeApprouve,
    };
  }, [activites]);

  function invalidateActivityData() {
    qc.invalidateQueries({ queryKey: ["activites"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreateActivity) return toast.error("La déclaration d'activité est réservée aux enseignants");
    const enseignantId = enseignantConnecte?.id;
    const payload = {
      enseignant_id: enseignantId,
      cours_id: form.cours_id || null,
      action_pedagogique: form.action_pedagogique,
      type_activite: form.type_activite,
      niveau_ressource: selectedAction.niveau,
      nombre_heures_ressource: Number(form.nombre_heures_ressource),
      description: form.description || null,
      date_activite: form.date_activite,
      valide: false,
      statut_validation: "en_attente",
      commentaire_validation: null,
      validee_par: null,
      date_validation: null,
    };
    if (!payload.enseignant_id) return toast.error("Aucune fiche enseignant n'est liée à ce compte");
    if (!payload.cours_id) return toast.error("Sélectionnez un cours");
    const { error } = await supabase.from("activites_pedagogiques").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Activité enregistrée et mise en attente de validation");
    setOpen(false);
    invalidateActivityData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette activité ?")) return;
    const { error } = await supabase.from("activites_pedagogiques").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Activité supprimée");
    invalidateActivityData();
  }

  async function approveActivity(id: string) {
    if (!canValidateActivities) return toast.error("Validation réservée au secrétariat");
    const { error } = await supabase
      .from("activites_pedagogiques")
      .update({
        valide: true,
        statut_validation: "approuve",
        commentaire_validation: null,
        validee_par: user?.id ?? null,
        date_validation: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Activité approuvée");
    invalidateActivityData();
  }

  async function rejectActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!canValidateActivities) return toast.error("Validation réservée au secrétariat");
    if (!rejecting) return;
    if (!motifRejet.trim()) {
      toast.error("Le motif de rejet est obligatoire");
      return;
    }

    const { error } = await supabase
      .from("activites_pedagogiques")
      .update({
        valide: false,
        statut_validation: "rejete",
        commentaire_validation: motifRejet.trim(),
        validee_par: user?.id ?? null,
        date_validation: new Date().toISOString(),
      })
      .eq("id", rejecting.id);
    if (error) return toast.error(error.message);
    toast.success("Activité rejetée");
    setRejecting(null);
    setMotifRejet("");
    invalidateActivityData();
  }

  function statusBadge(activity: any) {
    const status = activity.statut_validation ?? (activity.valide ? "approuve" : "en_attente");
    const config = STATUTS[status] ?? STATUTS.en_attente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isTeacherOnly ? "Mes activités déclarées" : "Validation des activités pédagogiques"}
          </h1>
          <p className="text-muted-foreground">
            {isTeacherOnly
              ? "Déclarez vos actions pédagogiques avec niveau et volume calculés automatiquement."
              : "File de validation du secrétariat et traçabilité des productions déclarées."}
          </p>
        </div>
        {canCreateActivity && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouvelle activité pédagogique</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div className="col-span-2 rounded-md border bg-secondary/40 p-3 text-sm">
                  <div className="text-xs text-muted-foreground">Enseignant</div>
                  <div className="font-medium">
                    {enseignantConnecte ? `${enseignantConnecte.prenom} ${enseignantConnecte.nom}` : "Compte enseignant non lié"}
                  </div>
                </div>
                <div className="col-span-2">
                  <Label>Cours</Label>
                  <Select value={form.cours_id} onValueChange={(v) => setForm({ ...form, cours_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un cours" /></SelectTrigger>
                    <SelectContent>
                      {(cours ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.intitule}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Action pédagogique réalisée</Label>
                  <Select
                    value={form.action_pedagogique}
                    onValueChange={(v) => {
                      const action = ACTIONS_PEDAGOGIQUES.find((item) => item.v === v) ?? ACTIONS_PEDAGOGIQUES[0];
                      setForm({
                        ...form,
                        action_pedagogique: action.v,
                        niveau_ressource: action.niveau,
                        nombre_heures_ressource: String(action.heures),
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACTIONS_PEDAGOGIQUES.map((action) => (
                        <SelectItem key={action.v} value={action.v}>{action.l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-muted-foreground">{selectedAction.aide}</p>
                </div>
                <div>
                  <Label>Type d'activité</Label>
                  <Select value={form.type_activite} onValueChange={(v) => setForm({ ...form, type_activite: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Niveau calculé</Label>
                  <div className="flex h-10 items-center rounded-md border bg-secondary/40 px-3 text-sm font-medium">
                    {NIVEAUX.find((n) => n.v === selectedAction.niveau)?.l ?? selectedAction.niveau}
                  </div>
                </div>
                <div>
                  <Label>Nombre d'heures de ressource</Label>
                  <Input type="number" min={1} required value={form.nombre_heures_ressource} onChange={(e) => setForm({ ...form, nombre_heures_ressource: e.target.value })} />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date_activite} onChange={(e) => setForm({ ...form, date_activite: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-md border bg-secondary/50 p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-primary" />
                    <div>
                      <div className="text-xs text-muted-foreground">Volume horaire calculé</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {form.nombre_heures_ressource} h x {activeCoefficient.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="font-display text-3xl font-bold text-primary">{previewVolume} h</div>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
                  <Button type="submit">Enregistrer</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isStaff && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">À valider</div>
              <div className="font-display text-3xl font-bold text-orange-600">{activityStats.enAttente}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Approuvées</div>
              <div className="font-display text-3xl font-bold text-green-700">{activityStats.approuvees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Rejetées</div>
              <div className="font-display text-3xl font-bold text-destructive">{activityStats.rejetees}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Volume validé</div>
              <div className="font-display text-3xl font-bold text-primary">
                {activityStats.volumeApprouve.toFixed(1)} h
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Registre des activités déclarées</CardTitle></CardHeader>
        <CardContent>
          {activitesError ? (
            <p className="text-sm text-destructive">{activitesError.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (activites ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune activité enregistrée.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Cours</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Heures</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commentaire</TableHead>
                    {(canValidateActivities || isStaff) && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activites!.map((a: any) => {
                    const status = a.statut_validation ?? (a.valide ? "approuve" : "en_attente");
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap">{new Date(a.date_activite).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>{a.enseignant ? `${a.enseignant.prenom} ${a.enseignant.nom}` : "-"}</TableCell>
                        <TableCell className="max-w-[180px] truncate">{a.cours?.intitule ?? "-"}</TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {ACTIONS_PEDAGOGIQUES.find((action) => action.v === a.action_pedagogique)?.l ?? "-"}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{TYPES.find((t) => t.v === a.type_activite)?.short}</Badge></TableCell>
                        <TableCell>{a.niveau_ressource.replace("niveau_", "N")}</TableCell>
                        <TableCell>{a.nombre_heures_ressource} h</TableCell>
                        <TableCell className="font-mono font-semibold text-primary">{Number(a.volume_horaire_calcule).toFixed(2)} h</TableCell>
                        <TableCell>{statusBadge(a)}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{a.commentaire_validation ?? "-"}</TableCell>
                        {(canValidateActivities || isStaff) && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
                              {canValidateActivities && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={status === "approuve"}
                                    onClick={() => approveActivity(a.id)}
                                    title="Approuver"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={status === "rejete"}
                                    onClick={() => {
                                      setRejecting(a);
                                      setMotifRejet(a.commentaire_validation ?? "");
                                    }}
                                    title="Rejeter"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)} title="Supprimer">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(rejecting)} onOpenChange={(open) => {
        if (!open) {
          setRejecting(null);
          setMotifRejet("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'activité</DialogTitle>
          </DialogHeader>
          <form onSubmit={rejectActivity} className="space-y-4">
            <div className="rounded-md border p-3 text-sm">
              <div className="font-medium">
                {rejecting?.enseignant ? `${rejecting.enseignant.prenom} ${rejecting.enseignant.nom}` : "Activité"}
              </div>
              <div className="text-muted-foreground">
                {rejecting ? `${Number(rejecting.volume_horaire_calcule).toFixed(2)} h - ${rejecting.cours?.intitule ?? "Sans cours"}` : ""}
              </div>
            </div>
            <div>
              <Label>Motif de rejet</Label>
              <Textarea value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setRejecting(null)}>Annuler</Button>
              <Button type="submit" variant="destructive">Rejeter</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
