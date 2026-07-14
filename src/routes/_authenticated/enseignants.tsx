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

export const Route = createFileRoute("/_authenticated/enseignants")({
  head: () => ({ meta: [{ title: "Enseignants · UVCI" }] }),
  component: EnseignantsPage,
});

const GRADES = [
  { v: "assistant", l: "Assistant" },
  { v: "maitre_assistant", l: "Maître-Assistant" },
  { v: "professeur", l: "Professeur" },
];
const STATUTS = [
  { v: "permanent", l: "Permanent" },
  { v: "vacataire", l: "Vacataire" },
];

function EnseignantsPage() {
  const qc = useQueryClient();
  const { isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    nom: "", prenom: "", email: "", telephone: "",
    grade: "assistant", statut: "permanent",
    departement_id: "", taux_horaire: "0", charge_statutaire: "192",
  });

  const { data: deps } = useQuery({
    queryKey: ["departements"],
    queryFn: async () => (await supabase.from("departements").select("*").order("nom")).data ?? [],
  });

  const { data: enseignants, isLoading, error: enseignantsError } = useQuery({
    queryKey: ["enseignants"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enseignants")
        .select("*, departement:departements(nom)")
        .order("nom");
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      taux_horaire: Number(form.taux_horaire),
      charge_statutaire: Number(form.charge_statutaire),
      departement_id: form.departement_id || null,
    };
    const { error } = await supabase.from("enseignants").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Enseignant ajouté");
    setOpen(false);
    setForm({ nom: "", prenom: "", email: "", telephone: "", grade: "assistant", statut: "permanent", departement_id: "", taux_horaire: "0", charge_statutaire: "192" });
    qc.invalidateQueries({ queryKey: ["enseignants"] });
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cet enseignant ?")) return;
    const { error } = await supabase.from("enseignants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé");
    qc.invalidateQueries({ queryKey: ["enseignants"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Registre des enseignants</h1>
          <p className="text-muted-foreground">Enregistrement, rattachement départemental et suivi administratif des enseignants.</p>
        </div>
        {isStaff && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> Ajouter</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Nouvel enseignant</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
                <div><Label>Prénom</Label><Input required value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} /></div>
                <div><Label>Nom</Label><Input required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                <div><Label>Téléphone</Label><Input value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} /></div>
                <div>
                  <Label>Grade</Label>
                  <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GRADES.map((g) => <SelectItem key={g.v} value={g.v}>{g.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.statut} onValueChange={(v) => setForm({ ...form, statut: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Département</Label>
                  <Select value={form.departement_id} onValueChange={(v) => setForm({ ...form, departement_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{(deps ?? []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nom}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Taux horaire (FCFA)</Label><Input type="number" value={form.taux_horaire} onChange={(e) => setForm({ ...form, taux_horaire: e.target.value })} /></div>
                <div><Label>Charge statutaire (h)</Label><Input type="number" value={form.charge_statutaire} onChange={(e) => setForm({ ...form, charge_statutaire: e.target.value })} /></div>
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
        <CardHeader><CardTitle>Enseignants enregistrés</CardTitle></CardHeader>
        <CardContent>
          {enseignantsError ? (
            <p className="text-sm text-destructive">{enseignantsError.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          ) : (enseignants ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun enseignant enregistré.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Taux / h</TableHead>
                  {isStaff && <TableHead></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {enseignants!.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium">{e.prenom} {e.nom}</div>
                      <div className="text-xs text-muted-foreground">{e.email}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{GRADES.find((g) => g.v === e.grade)?.l}</Badge></TableCell>
                    <TableCell>{STATUTS.find((s) => s.v === e.statut)?.l}</TableCell>
                    <TableCell>{e.departement?.nom ?? "—"}</TableCell>
                    <TableCell className="font-mono">{Number(e.taux_horaire).toLocaleString("fr-FR")} F</TableCell>
                    {isStaff && (
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}>
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
