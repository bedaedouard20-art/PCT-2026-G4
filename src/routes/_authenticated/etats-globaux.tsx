import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getEtatGlobal } from "@/lib/paiement.functions";
import { exportEtatsGlobalPDF } from "@/lib/export.functions";
import { downloadFile } from "@/lib/download";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { RefreshCw, Loader2, FileDown, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/etats-globaux")({
  head: () => ({ meta: [{ title: "États globaux · UVCI" }] }),
  component: EtatsGlobauxPage,
});

function EtatsGlobauxPage() {
  const { hasRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fetchEtat = useServerFn(getEtatGlobal);
  const doExport = useServerFn(exportEtatsGlobalPDF);
  const [etat, setEtat] = useState<any>(null);
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
      const data = await fetchEtat();
      setEtat(data);
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
      const result = await doExport({ data: { etat } });
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">États globaux</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue consolidée des heures et paiements par département et statut
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Actualiser
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || !etat}
            className="gap-2"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            Exporter Excel
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={!etat}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer / PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          <span className="text-muted-foreground">Chargement…</span>
        </div>
      ) : etat ? (
        <>
          {/* Synthèse générale */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total enseignants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-bold">{etat.total_enseignants}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Volume global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-bold text-primary">{etat.total_heures.toFixed(1)}</div>
                <p className="mt-1 text-xs text-muted-foreground">heures calculées</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Montant global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-bold text-green-700">
                  {etat.montant_total.toLocaleString("fr-FR")}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">FCFA</p>
              </CardContent>
            </Card>
          </div>

          {/* Graphique par département */}
          {etat.par_departement && etat.par_departement.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Répartition par département</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={etat.par_departement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="département" fontSize={12} />
                    <YAxis yAxisId="left" fontSize={12} unit=" h" />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="total_heures" fill="var(--color-primary)" name="Heures" />
                    <Bar yAxisId="right" dataKey="nb_enseignants" fill="var(--color-muted)" name="Enseignants" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Tableau détail par département */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par département</CardTitle>
            </CardHeader>
            <CardContent>
              {etat.par_departement && etat.par_departement.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Département</TableHead>
                      <TableHead className="text-right">Enseignants</TableHead>
                      <TableHead className="text-right">Volume horaire</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etat.par_departement.map((d: any) => (
                      <TableRow key={d.département}>
                        <TableCell className="font-medium">{d.département}</TableCell>
                        <TableCell className="text-right">{d.nb_enseignants}</TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {d.total_heures.toFixed(1)} h
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-green-700">
                          {d.montant.toLocaleString("fr-FR")} F
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée par département.</p>
              )}
            </CardContent>
          </Card>

          {/* Tableau détail par statut */}
          <Card>
            <CardHeader>
              <CardTitle>Détail par statut d'enseignant</CardTitle>
            </CardHeader>
            <CardContent>
              {etat.par_statut && etat.par_statut.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Enseignants</TableHead>
                      <TableHead className="text-right">Volume horaire</TableHead>
                      <TableHead className="text-right">Montant total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {etat.par_statut.map((s: any) => (
                      <TableRow key={s.statut}>
                        <TableCell className="font-medium capitalize">
                          {s.statut === "permanent" ? "Permanent" : "Vacataire"}
                        </TableCell>
                        <TableCell className="text-right">{s.nb_enseignants}</TableCell>
                        <TableCell className="text-right font-mono text-primary">
                          {s.total_heures.toFixed(1)} h
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-green-700">
                          {s.montant.toLocaleString("fr-FR")} F
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée par statut.</p>
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
        </>
      ) : null}
    </div>
  );
}

