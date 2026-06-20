import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAllEtatsPaiement } from "@/lib/paiement.functions";
import { exportEtatsPaiementPDF } from "@/lib/export.functions";
import { downloadFile } from "@/lib/download";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileDown, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/etats-paiement")({
  head: () => ({ meta: [{ title: "États de paiement · UVCI" }] }),
  component: EtatsPaiementPage,
});

const GRADES: Record<string, string> = {
  assistant: "Assistant",
  maitre_assistant: "Maître-Assistant",
  professeur: "Professeur",
};

function EtatsPaiementPage() {
  const { hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchEtats = useServerFn(getAllEtatsPaiement);
  const doExport = useServerFn(exportEtatsPaiementPDF);
  const [etats, setEtats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !hasRole("admin") && !hasRole("secretaire")) {
      toast.error("Accès réservé à l'administration");
      navigate({ to: "/dashboard" });
      return;
    }
  }, [authLoading, hasRole, navigate]);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchEtats();
      setEtats(data.etats);
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (hasRole("admin") || hasRole("secretaire")) {
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function handleExport() {
    setExporting(true);
    try {
      const result = await doExport({ data: { etats } });
      downloadFile(result.content, result.filename, result.mimeType);
      toast.success("Fichier téléchargé avec succès");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Vérification…</span>
      </div>
    );
  }

  if (!hasRole("admin") && !hasRole("secretaire")) {
    return null;
  }

  const totalVolume = etats.reduce((s, e) => s + e.volume_total, 0);
  const montantTotal = etats.reduce((s, e) => s + e.montant_total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">États de paiement</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Récapitulatif des volumes horaires et montants à verser
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Actualiser
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || etats.length === 0}
            className="gap-2"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Exporter Excel
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={etats.length === 0}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </Button>
        </div>
      </div>

      {/* Synthèse */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enseignants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold">{etats.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Volume total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-primary">{totalVolume.toFixed(1)}</div>
            <p className="mt-1 text-xs text-muted-foreground">heures</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Montant total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-green-700">
              {montantTotal.toLocaleString("fr-FR")}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">FCFA</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau détaillé */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par enseignant</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-muted-foreground">Chargement…</span>
            </div>
          ) : etats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun enseignant enregistré.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead className="text-right">Volume réalisé</TableHead>
                    <TableHead className="text-right">Heures comp.</TableHead>
                    <TableHead className="text-right">Taux/h</TableHead>
                    <TableHead className="text-right">Montant base</TableHead>
                    <TableHead className="text-right">Montant comp.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {etats.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">
                          {e.enseignant_prenom} {e.enseignant_nom}
                        </div>
                        <div className="text-xs text-muted-foreground">{e.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{GRADES[e.grade] || e.grade}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{e.charge_statutaire}</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">
                        {e.volume_total}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${e.heures_comp > 0 ? 'text-amber-600 font-semibold' : ''}`}>
                        {e.heures_comp}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {e.taux_horaire.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {e.montant_base.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className={`text-right font-mono ${e.montant_comp > 0 ? 'text-amber-600 font-semibold' : ''}`}>
                        {e.montant_comp.toLocaleString("fr-FR")}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-green-700">
                        {e.montant_total.toLocaleString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Généré le :</strong> {new Date().toLocaleDateString("fr-FR")} à{" "}
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

