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
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/ressources")({
  head: () => ({ meta: [{ title: "Ressources pédagogiques - UVCI" }] }),
  component: RessourcesPage,
});

const TYPES = [
  { value: "texte", label: "Texte", help: "Support textuel ou consigne simple" },
  { value: "video", label: "Vidéo", help: "Lien vidéo ou capsule pédagogique" },
  { value: "document", label: "Document", help: "PDF, diaporama ou support de cours" },
  { value: "quiz", label: "Quiz", help: "Questions, réponses attendues ou lien vers un quiz" },
  { value: "activite_interactive", label: "Activité interactive", help: "Exercice guidé, simulation ou activité en ligne" },
  { value: "evaluation", label: "Évaluation", help: "Devoir, test ou activité notée" },
];

const EMPTY_FORM = {
  sequence_id: "",
  type_ressource: "document",
  titre: "",
  description: "",
  url_ou_contenu: "",
  ordre_affichage: "1",
};

function RessourcesPage() {
  const qc = useQueryClient();
  const { hasRole, user } = useAuth();
  const canManageResources = hasRole("admin") || hasRole("secretaire") || hasRole("enseignant");
  const isTeacherOnly = hasRole("enseignant") && !hasRole("admin") && !hasRole("secretaire");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);

  const selectedType = TYPES.find((type) => type.value === form.type_ressource);

  const { data: sequences } = useQuery({
    queryKey: ["sequences-list-for-resources", user?.id],
    enabled: canManageResources,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sequences_pedagogiques")
        .select("id, numero_sequence, titre, cours:cours(intitule, niveau)")
        .order("numero_sequence");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: ressources, isLoading, error } = useQuery({
    queryKey: ["ressources", user?.id],
    enabled: canManageResources,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ressources_pedagogiques")
        .select(`
          *,
          sequence:sequences_pedagogiques(
            titre,
            numero_sequence,
            cours:cours(intitule, niveau)
          )
        `)
        .order("ordre_affichage");
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
      toast.error("La gestion des ressources est réservée à l'enseignant assigné au cours.");
      return;
    }
    resetForm();
    setOpen(true);
  }

  function startEdit(ressource: any) {
    if (!isTeacherOnly) {
      toast.error("La modification des ressources est réservée à l'enseignant assigné au cours.");
      return;
    }
    setEditingId(ressource.id);
    setForm({
      sequence_id: ressource.sequence_id,
      type_ressource: ressource.type_ressource,
      titre: ressource.titre,
      description: ressource.description ?? "",
      url_ou_contenu: ressource.url_ou_contenu ?? "",
      ordre_affichage: String(ressource.ordre_affichage ?? 0),
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isTeacherOnly) {
      toast.error("La gestion des ressources est réservée à l'enseignant assigné au cours.");
      return;
    }
    const payload = {
      sequence_id: form.sequence_id,
      type_ressource: form.type_ressource,
      titre: form.titre.trim(),
      description: form.description.trim() || null,
      url_ou_contenu: form.url_ou_contenu.trim() || null,
      ordre_affichage: Number(form.ordre_affichage),
    };

    if (!payload.sequence_id) return toast.error("Sélectionnez une séquence");
    if (!payload.titre) return toast.error("Le titre est requis");
    if (payload.ordre_affichage < 0) return toast.error("L'ordre ne peut pas être négatif");

    const request = editingId
      ? supabase.from("ressources_pedagogiques").update(payload).eq("id", editingId)
      : supabase.from("ressources_pedagogiques").insert(payload);

    const { error } = await request;
    if (error) return toast.error(error.message);

    toast.success(editingId ? "Ressource modifiée" : "Ressource ajoutée");
    setOpen(false);
    resetForm();
    qc.invalidateQueries({ queryKey: ["ressources"] });
  }

  async function handleDelete(id: string) {
    if (!isTeacherOnly) {
      toast.error("La suppression des ressources est réservée à l'enseignant assigné au cours.");
      return;
    }
    if (!confirm("Supprimer cette ressource ?")) return;
    const { error } = await supabase.from("ressources_pedagogiques").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Ressource supprimée");
    qc.invalidateQueries({ queryKey: ["ressources"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {isTeacherOnly ? "Ressources produites" : "Contrôle des ressources pédagogiques"}
          </h1>
          <p className="text-muted-foreground">
            {isTeacherOnly
              ? "Déposez les supports, quiz, évaluations et activités interactives liés à vos séquences."
              : "Suivez les productions déposées sur les séquences de cours."}
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
          <CardTitle>{isTeacherOnly ? "Productions de mes séquences" : "Ressources déposées"}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (ressources ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isTeacherOnly
                ? "Aucune ressource enregistrée pour vos séquences."
                : "Aucune ressource enregistrée."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Séquence</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description / contenu</TableHead>
                  <TableHead className="text-right">Ordre</TableHead>
                  {isTeacherOnly && <TableHead className="w-[96px]"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ressources!.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.sequence?.cours?.intitule ?? "Cours inconnu"}</div>
                      <div className="text-xs text-muted-foreground">
                        Seq. {r.sequence?.numero_sequence ?? "-"} - {r.sequence?.titre ?? "Séquence"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {r.titre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {TYPES.find((type) => type.value === r.type_ressource)?.label ?? r.type_ressource}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[340px] truncate">
                      {r.description || r.url_ou_contenu || "-"}
                    </TableCell>
                    <TableCell className="text-right">{r.ordre_affichage}</TableCell>
                    {isTeacherOnly && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => startEdit(r)} title="Modifier">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} title="Supprimer">
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
            <DialogTitle>{editingId ? "Modifier la ressource" : "Nouvelle ressource"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Séquence</Label>
              <Select value={form.sequence_id} onValueChange={(v) => setForm({ ...form, sequence_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une séquence" />
                </SelectTrigger>
                <SelectContent>
                  {(sequences ?? []).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.cours?.intitule ?? "Cours"} - Seq. {s.numero_sequence}: {s.titre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isTeacherOnly && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Seules les séquences de vos cours assignés sont disponibles.
                </p>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type_ressource} onValueChange={(v) => setForm({ ...form, type_ressource: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && <p className="mt-1 text-xs text-muted-foreground">{selectedType.help}</p>}
            </div>
            <div>
              <Label>Ordre d'affichage</Label>
              <Input
                type="number"
                min={0}
                value={form.ordre_affichage}
                onChange={(e) => setForm({ ...form, ordre_affichage: e.target.value })}
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
            <div className="col-span-2">
              <Label>URL, consigne ou contenu</Label>
              <Textarea
                value={form.url_ou_contenu}
                onChange={(e) => setForm({ ...form, url_ou_contenu: e.target.value })}
                placeholder="Lien, texte du quiz, consigne d'activité interactive, corrigé attendu..."
              />
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
