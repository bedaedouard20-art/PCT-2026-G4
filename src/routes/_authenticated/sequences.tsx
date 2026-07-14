import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/sequences")({
  head: () => ({ meta: [{ title: "Séquences pédagogiques - UVCI" }] }),
  component: SequencesPage,
});

const EMPTY_FORM = {
  cours_id: "",
  numero_sequence: "1",
  titre: "",
  description: "",
  nombre_heures: "0",
};

function SequencesPage() {
  const qc = useQueryClient();
  const { hasRole, user } = useAuth();
  const canManageSequences = hasRole("admin") || hasRole("secretaire") || hasRole("enseignant");
  const isTeacherOnly = hasRole("enseignant") && !hasRole("admin") && !hasRole("secretaire");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const { data: cours } = useQuery({
    queryKey: ["cours-list-for-sequences", user?.id],
    enabled: canManageSequences,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cours")
        .select("id, intitule, filiere, niveau")
        .order("intitule");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: sequences, isLoading, error } = useQuery({
    queryKey: ["sequences", user?.id],
    enabled: canManageSequences,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sequences_pedagogiques")
        .select("*, cours:cours(intitule, filiere, niveau)")
        .order("numero_sequence");
      if (error) throw error;
      return data ?? [];
    },
  });

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startCreate() {
    if (!isTeacherOnly) {
      toast.error("La gestion des séquences est réservée à l'enseignant assigné au cours.");
      return;
    }
    resetForm();
    setOpen(true);
  }

  function startEdit(sequence: any) {
    if (!isTeacherOnly) {
      toast.error("La modification des séquences est réservée à l'enseignant assigné au cours.");
      return;
    }
    setEditingId(sequence.id);
    setForm({
      cours_id: sequence.cours_id,
      numero_sequence: String(sequence.numero_sequence),
      titre: sequence.titre,
      description: sequence.description ?? "",
      nombre_heures: String(sequence.nombre_heures ?? 0),
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTeacherOnly) {
      toast.error("La gestion des séquences est réservée à l'enseignant assigné au cours.");
      return;
    }
    const payload = {
      cours_id: form.cours_id,
      numero_sequence: Number(form.numero_sequence),
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      nombre_heures: Number(form.nombre_heures),
    };

    if (!payload.cours_id) return toast.error("Sélectionnez un cours");
    if (!payload.titre) return toast.error("Le titre est requis");
    if (payload.numero_sequence <= 0) return toast.error("Le numéro de séquence doit être positif");
    if (payload.nombre_heures < 0) return toast.error("Le nombre d'heures ne peut pas être négatif");

    const request = editingId
      ? supabase.from("sequences_pedagogiques").update(payload).eq("id", editingId)
      : supabase.from("sequences_pedagogiques").insert(payload);

    const { error } = await request;
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Séquence modifiée" : "Séquence ajoutée");
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["sequences"] });
  }

  async function handleDelete(id: string) {
    if (!isTeacherOnly) {
      toast.error("La suppression des séquences est réservée à l'enseignant assigné au cours.");
      return;
    }
    if (!confirm("Supprimer cette séquence ? Les ressources liées seront aussi supprimées.")) return;
    const { error } = await supabase.from("sequences_pedagogiques").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Séquence supprimée");
    qc.invalidateQueries({ queryKey: ["sequences"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isTeacherOnly ? "Séquences de mes cours" : "Suivi des séquences pédagogiques"}
          </h1>
          <p className="text-muted-foreground">
            {isTeacherOnly
              ? "Structurez les cours qui vous sont assignés avant d'y déposer les ressources."
              : "Vue de contrôle des séquences déclarées sur les cours programmés."}
          </p>
        </div>
        {isTeacherOnly && (
          <Button className="gap-2" onClick={startCreate}>
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isTeacherOnly ? "Organisation de mes cours" : "Séquences déclarées"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (sequences ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isTeacherOnly
                ? "Aucune séquence enregistrée pour vos cours."
                : "Aucune séquence enregistrée."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cours</TableHead>
                  <TableHead>Séquence</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Heures</TableHead>
                  {isTeacherOnly && <TableHead className="w-[96px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequences!.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="font-medium">{s.cours?.intitule ?? "Cours inconnu"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.cours?.filiere ?? ""} {s.cours?.niveau ? `- ${s.cours.niveau}` : ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">No {s.numero_sequence}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{s.titre}</TableCell>
                    <TableCell className="max-w-[280px] truncate">{s.description ?? "-"}</TableCell>
                    <TableCell className="text-right">{s.nombre_heures} h</TableCell>
                    {isTeacherOnly && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(s)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} title="Supprimer">
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
            <DialogTitle>{editingId ? "Modifier la séquence" : "Nouvelle séquence"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Cours</Label>
              <Select value={form.cours_id} onValueChange={(v) => setForm({ ...form, cours_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un cours" />
                </SelectTrigger>
                <SelectContent>
                  {(cours ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.intitule} - {c.niveau}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isTeacherOnly && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Seuls les cours qui vous sont assignés sont disponibles.
                </p>
              )}
            </div>
            <div>
              <Label>Numéro</Label>
              <Input
                type="number"
                min={1}
                required
                value={form.numero_sequence}
                onChange={(e) => setForm({ ...form, numero_sequence: e.target.value })}
              />
            </div>
            <div>
              <Label>Nombre d'heures</Label>
              <Input
                type="number"
                min={0}
                value={form.nombre_heures}
                onChange={(e) => setForm({ ...form, nombre_heures: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Titre</Label>
              <Input required value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
