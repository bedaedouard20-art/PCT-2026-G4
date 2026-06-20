import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/cours")({
  head: () => ({ meta: [{ title: "Cours · UVCI" }] }),
  component: CoursPage,
});

const NIVEAUX = ["L1", "L2", "L3", "M1", "M2"];

function CoursPage() {
  const qc = useQueryClient();
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    intitule: "", filiere: "", niveau: "L1", semestre: "1",
    nombre_heures: "0", credits: "0", enseignant_id: "",
  });

  const { data: enseignants } = useQuery({
    queryKey: ["enseignants-list"],
    enabled: isStaff,
    queryFn: async () => {
      const { data, error } = await supabase.from("enseignants").select("id, nom, prenom").order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: cours, isLoading, error: coursError } = useQuery({
    queryKey: ["cours"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cours")
        .select("*, enseignant:enseignants(nom, prenom)")
        .order("intitule");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      semestre: Number(form.semestre),
      nombre_heures: Number(form.nombre_heures),
      credits: Number(form.credits),
      enseignant_id: form.enseignant_id || null,
    };
    const { error } = await supabase.from("cours").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Cours ajouté");
    setOpen(false);
    setForm({ intitule: "", filiere: "", niveau: "L1", semestre: "1", nombre_heures: "0", credits: "0", enseignant_id: "" });
    qc.invalidateQueries({ queryKey: ["cours"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce cours ?")) return;
    const { error } = await supabase.from("cours").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["cours"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Cours</h1>
          <p className="text-muted-foreground">Intitulés, filières, niveaux et crédits</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouveau cours</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Intitulé</Label><Input required value={form.intitule} onChange={(e) => setForm({ ...form, intitule: e.target.value })} /></div>
                <div><Label>Filière</Label><Input required value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })} /></div>
                <div>
                  <Label>Niveau</Label>
                  <Select value={form.niveau} onValueChange={(v) => setForm({ ...form, niveau: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{NIVEAUX.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Semestre</Label><Input type="number" min={1} max={10} value={form.semestre} onChange={(e) => setForm({ ...form, semestre: e.target.value })} /></div>
                <div><Label>Nombre d'heures</Label><Input type="number" value={form.nombre_heures} onChange={(e) => setForm({ ...form, nombre_heures: e.target.value })} /></div>
                <div><Label>Crédits</Label><Input type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} /></div>
                <div className="col-span-2">
                  <Label>Enseignant (optionnel)</Label>
                  <Select value={form.enseignant_id} onValueChange={(v) => setForm({ ...form, enseignant_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{(enseignants ?? []).map((e: any) => <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>)}</SelectContent>
                  </Select>
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
        <CardHeader><CardTitle>Catalogue des cours</CardTitle></CardHeader>
        <CardContent>
          {coursError ? (
            <p className="text-sm text-destructive">{coursError.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (cours ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun cours enregistré.</p>
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
                  {isStaff && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cours!.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.intitule}</TableCell>
                    <TableCell>{c.filiere}</TableCell>
                    <TableCell><Badge variant="secondary">{c.niveau}</Badge></TableCell>
                    <TableCell>S{c.semestre}</TableCell>
                    <TableCell>{c.nombre_heures} h</TableCell>
                    <TableCell>{c.credits}</TableCell>
                    <TableCell>{c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : "—"}</TableCell>
                    {isStaff && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
