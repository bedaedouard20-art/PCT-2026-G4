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

const STATUTS: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  en_attente: { label: "En attente", variant: "outline" },
  approuve: { label: "Approuvée", variant: "default" },
  rejete: { label: "Rejetée", variant: "destructive" },
};

function ActivitesPage() {
  const qc = useQueryClient();
  const { isStaff, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [motifRejet, setMotifRejet] = useState("");
  const [form, setForm] = useState<any>({
    enseignant_id: "",
    cours_id: "",
    type_activite: "creation",
    niveau_ressource: "niveau_1",
    nombre_heures_ressource: "10",
    description: "",
    date_activite: new Date().toISOString().slice(0, 10),
  });

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
      b.type_activite === form.type_activite && b.niveau_ressource === form.niveau_ressource
    );
    return Number(bareme?.coefficient ?? 0);
  }, [baremes, form.type_activite, form.niveau_ressource]);

  const previewVolume = useMemo(() => {
    return (Number(form.nombre_heures_ressource) * activeCoefficient).toFixed(2);
  }, [activeCoefficient, form.nombre_heures_ressource]);

  const { data: enseignants } = useQuery({
    queryKey: ["enseignants-list"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("enseignants").select("id, nom, prenom").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: cours } = useQuery({
    queryKey: ["cours-list"],
    enabled: isStaff,
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

  function invalidateActivityData() {
    qc.invalidateQueries({ queryKey: ["activites"] });
    qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      enseignant_id: form.enseignant_id,
      cours_id: form.cours_id || null,
      type_activite: form.type_activite,
      niveau_ressource: form.niveau_ressource,
      nombre_heures_ressource: Number(form.nombre_heures_ressource),
      description: form.description || null,
      date_activite: form.date_activite,
      valide: false,
      statut_validation: "en_attente",
      commentaire_validation: null,
      validee_par: null,
      date_validation: null,
    };
    if (!payload.enseignant_id) return toast.error("Sélectionnez un enseignant");
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
          <h1 className="font-display text-3xl font-bold">Activités pédagogiques</h1>
          <p className="text-muted-foreground">Saisie, validation et suivi des volumes horaires calculés</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouvelle activité pédagogique</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Enseignant</Label>
                  <Select value={form.enseignant_id} onValueChange={(v) => setForm({ ...form, enseignant_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un enseignant" /></SelectTrigger>
                    <SelectContent>
                      {(enseignants ?? []).map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Cours (optionnel)</Label>
                  <Select value={form.cours_id} onValueChange={(v) => setForm({ ...form, cours_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un cours" /></SelectTrigger>
                    <SelectContent>
                      {(cours ?? []).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.intitule}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Label>Niveau de la ressource</Label>
                  <Select value={form.niveau_ressource} onValueChange={(v) => setForm({ ...form, niveau_ressource: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {NIVEAUX.map((n) => <SelectItem key={n.v} value={n.v}>{n.l}</SelectItem>)}
                    </SelectContent>
                  </Select>
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

      <Card>
        <CardHeader><CardTitle>Activités enregistrées</CardTitle></CardHeader>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Niveau</TableHead>
                    <TableHead>Heures</TableHead>
                    <TableHead>Volume</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Commentaire</TableHead>
                    {isStaff && <TableHead className="text-right">Actions</TableHead>}
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
                        <TableCell><Badge variant="secondary">{TYPES.find((t) => t.v === a.type_activite)?.short}</Badge></TableCell>
                        <TableCell>{a.niveau_ressource.replace("niveau_", "N")}</TableCell>
                        <TableCell>{a.nombre_heures_ressource} h</TableCell>
                        <TableCell className="font-mono font-semibold text-primary">{Number(a.volume_horaire_calcule).toFixed(2)} h</TableCell>
                        <TableCell>{statusBadge(a)}</TableCell>
                        <TableCell className="max-w-[240px] truncate">{a.commentaire_validation ?? "-"}</TableCell>
                        {isStaff && (
                          <TableCell>
                            <div className="flex justify-end gap-1">
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
