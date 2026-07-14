import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/cours")({
  head: () => ({ meta: [{ title: "Cours · UVCI" }] }),
  component: CoursPage,
});

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];
const UNASSIGNED = "__none__";

const EMPTY_FORM = {
  intitule: "",
  filiere: "",
  niveau: "L1",
  semestre: "1",
  nombre_heures: "0",
  credits: "0",
  enseignant_id: UNASSIGNED,
};

function CoursPage() {
  const qc = useQueryClient();
  const { hasRole, user } = useAuth();
  const canManageCourses = hasRole("admin") || hasRole("secretaire");
  const isTeacherOnly = hasRole("enseignant") && !canManageCourses;
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const { data: enseignants } = useQuery({
    queryKey: ["enseignants-list"],
    enabled: canManageCourses,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enseignants")
        .select("id, nom, prenom")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: cours, isLoading, error: coursError } = useQuery({
    queryKey: ["cours", user?.id, canManageCourses],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cours")
        .select("*, enseignant:enseignants(nom, prenom)")
        .order("intitule");
      if (error) throw error;
      return data ?? [];
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startCreate() {
    resetForm();
    setOpen(true);
  }

  function startEdit(coursItem: any) {
    setEditingId(coursItem.id);
    setForm({
      intitule: coursItem.intitule ?? "",
      filiere: coursItem.filiere ?? "",
      niveau: coursItem.niveau ?? "L1",
      semestre: String(coursItem.semestre ?? 1),
      nombre_heures: String(coursItem.nombre_heures ?? 0),
      credits: String(coursItem.credits ?? 0),
      enseignant_id: coursItem.enseignant_id ?? UNASSIGNED,
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      intitule: form.intitule.trim(),
      filiere: form.filiere.trim(),
      niveau: form.niveau,
      semestre: Number(form.semestre),
      nombre_heures: Number(form.nombre_heures),
      credits: Number(form.credits),
      enseignant_id: form.enseignant_id === UNASSIGNED ? null : form.enseignant_id,
    };

    if (!payload.intitule) return toast.error("L'intitulé est requis");
    if (!payload.filiere) return toast.error("La filière est requise");
    if (payload.semestre <= 0) return toast.error("Le semestre doit être positif");
    if (payload.credits < 0) return toast.error("Le nombre de crédits ne peut pas être négatif");

    const request = editingId
      ? supabase.from("cours").update(payload).eq("id", editingId)
      : supabase.from("cours").insert(payload);

    const { error } = await request;
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Cours mis à jour" : "Cours créé");
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["cours"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce cours ? Les séquences associées seront aussi supprimées.")) return;
    const { error } = await supabase.from("cours").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cours supprimé");
    qc.invalidateQueries({ queryKey: ["cours"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isTeacherOnly ? "Mes cours" : "Cours et assignations"}
          </h1>
          <p className="text-muted-foreground">
            {isTeacherOnly
              ? "Consultez les cours qui vous ont été assignés avant de structurer leurs séquences et ressources."
              : "Créez les cours, fixez les crédits et assignez-les aux enseignants."}
          </p>
        </div>
        {canManageCourses && (
          <Button className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isTeacherOnly ? "Cours assignés" : "Catalogue des cours"}</CardTitle>
        </CardHeader>
        <CardContent>
          {coursError ? (
            <p className="text-sm text-destructive">{coursError.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (cours ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isTeacherOnly ? "Aucun cours ne vous est assigné." : "Aucun cours enregistré."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Intitulé</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Sem.</TableHead>
                  <TableHead>Heures</TableHead>
                  <TableHead>Crédits</TableHead>
                  <TableHead>Enseignant</TableHead>
                  {canManageCourses && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cours!.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.intitule}</TableCell>
                    <TableCell>{c.filiere}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.niveau}</Badge>
                    </TableCell>
                    <TableCell>S{c.semestre}</TableCell>
                    <TableCell>{c.nombre_heures} h</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>{c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : "-"}</TableCell>
                    {canManageCourses && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(c)} title="Modifier / assigner">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} title="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le cours" : "Nouveau cours"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Intitulé</Label>
              <Input required value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} />
            </div>
            <div>
              <Label>Filière</Label>
              <Input required value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} />
            </div>
            <div>
              <Label>Niveau du cours</Label>
              <Select value={form.niveau} onValueChange={(v) => setForm({ ...form, niveau: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NIVEAUX.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semestre</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={form.semestre}
                onChange={(e) => setForm({ ...form, semestre: e.target.value })}
              />
            </div>
            <div>
              <Label>Volume horaire du cours</Label>
              <Input
                type="number"
                min={0}
                value={form.nombre_heures}
                onChange={(e) => setForm({ ...form, nombre_heures: e.target.value })}
              />
            </div>
            <div>
              <Label>Crédits fixés par le secrétariat</Label>
              <Input
                type="number"
                min={0}
                value={form.credits}
                onChange={(e) => setForm({ ...form, credits: e.target.value })}
              />
            </div>
            <div>
              <Label>Enseignant assigné</Label>
              <Select value={form.enseignant_id} onValueChange={(v) => setForm({ ...form, enseignant_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED}>Non assigné</SelectItem>
                  {(enseignants ?? []).map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.prenom} {e.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 rounded-md border bg-secondary/40 p-3 text-sm text-muted-foreground">
              L'enseignant pourra gérer les séquences et ressources après assignation du cours.
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
