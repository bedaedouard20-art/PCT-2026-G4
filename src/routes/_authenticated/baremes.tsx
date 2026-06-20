import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/baremes")({
  head: () => ({ meta: [{ title: "Barèmes - UVCI" }] }),
  component: BaremesPage,
});

const TYPES: Record<string, string> = {
  creation: "Création",
  mise_a_jour: "Mise à jour",
};

const NIVEAUX: Record<string, string> = {
  niveau_1: "Niveau 1",
  niveau_2: "Niveau 2",
  niveau_3: "Niveau 3",
};

function BaremesPage() {
  const { hasRole } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({
    coefficient: "0",
    libelle: "",
    description: "",
    actif: true,
  });

  const isAdmin = hasRole("admin");

  const { data: baremes, isLoading, error } = useQuery({
    queryKey: ["baremes-activites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("baremes_activites")
        .select("*")
        .order("type_activite")
        .order("niveau_ressource");
      if (error) throw error;
      return data ?? [];
    },
  });

  function startEdit(bareme: any) {
    setEditing(bareme);
    setForm({
      coefficient: String(Number(bareme.coefficient)),
      libelle: bareme.libelle ?? "",
      description: bareme.description ?? "",
      actif: Boolean(bareme.actif),
    });
  }

  async function saveBareme(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const coefficient = Number(form.coefficient);
    if (!Number.isFinite(coefficient) || coefficient < 0) {
      toast.error("Le coefficient doit être un nombre positif");
      return;
    }
    if (!form.libelle.trim()) {
      toast.error("Le libellé est requis");
      return;
    }

    const { error } = await supabase
      .from("baremes_activites")
      .update({
        coefficient,
        libelle: form.libelle.trim(),
        description: form.description.trim() || null,
        actif: form.actif,
      })
      .eq("id", editing.id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Barème mis à jour");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["baremes-activites"] });
    qc.invalidateQueries({ queryKey: ["baremes-actifs"] });
  }

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Accès réservé aux administrateurs.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Barèmes de calcul</h1>
        <p className="text-muted-foreground">
          Configurez les coefficients appliqués aux activités pédagogiques.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coefficients par type et niveau</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-sm text-destructive">{error.message}</p>
          ) : isLoading ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead className="text-right">Coefficient</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[72px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(baremes ?? []).map((bareme: any) => (
                  <TableRow key={bareme.id}>
                    <TableCell>{TYPES[bareme.type_activite] ?? bareme.type_activite}</TableCell>
                    <TableCell>{NIVEAUX[bareme.niveau_ressource] ?? bareme.niveau_ressource}</TableCell>
                    <TableCell className="font-medium">{bareme.libelle}</TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      {Number(bareme.coefficient).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={bareme.actif ? "default" : "outline"}>
                        {bareme.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[360px] truncate">
                      {bareme.description ?? "-"}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(bareme)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le barème</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveBareme} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 rounded-md border p-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="font-medium">{editing ? TYPES[editing.type_activite] : ""}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Niveau</div>
                <div className="font-medium">{editing ? NIVEAUX[editing.niveau_ressource] : ""}</div>
              </div>
            </div>
            <div>
              <Label>Coefficient</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.coefficient}
                onChange={(e) => setForm({ ...form, coefficient: e.target.value })}
              />
            </div>
            <div>
              <Label>Libellé</Label>
              <Input
                value={form.libelle}
                onChange={(e) => setForm({ ...form, libelle: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.actif}
                onCheckedChange={(checked) => setForm({ ...form, actif: checked })}
              />
              <Label>Barème actif</Label>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
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
