import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getRecapEnseignant, type RecapEnseignant } from "@/lib/paiement.functions";
import { exportRecapitulatifPDF } from "@/lib/export.functions";
import { downloadFile } from "@/lib/download";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Award, DollarSign, AlertCircle, Download, BookOpen, ClipboardList, Printer } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/recapitulatif")({
  head: () => ({ meta: [{ title: "Mon récapitulatif · UVCI" }] }),
  component: RecapitulatifPage,
});

function RecapitulatifPage() {
  const { user, hasRole } = useAuth();
  const fetchRecap = useServerFn(getRecapEnseignant);
  const doExport = useServerFn(exportRecapitulatifPDF);
  const [recap, setRecap] = useState<RecapEnseignant | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchRecap();
        setRecap(data);
      } catch (e: any) {
        toast.error(e?.message ?? "Erreur de chargement");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport() {
    if (!recap) return;
    setExporting(true);
    try {
      const result = await doExport({ data: { recap } });
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

  const GRADES: Record<string, string> = {
    assistant: "Assistant",
    maitre_assistant: "Maître-Assistant",
    professeur: "Professeur",
  };
  const STATUTS: Record<string, string> = {
    permanent: "Permanent",
    vacataire: "Vacataire",
  };
  const TYPES: Record<string, string> = {
    creation: "Création",
    mise_a_jour: "Mise à jour",
  };
  const NIVEAUX: Record<string, string> = {
    niveau_1: "Niveau 1",
    niveau_2: "Niveau 2",
    niveau_3: "Niveau 3",
  };
  const VALIDATION: Record<string, { label: string; variant: "default" | "outline" | "destructive" }> = {
    en_attente: { label: "En attente", variant: "outline" },
    approuve: { label: "Approuvée", variant: "default" },
    rejete: { label: "Rejetée", variant: "destructive" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Mon récapitulatif</h1>
          <p className="text-muted-foreground">
            Vue d'ensemble de vos activités pédagogiques et de votre rémunération
          </p>
        </div>
        {recap && (
          <div className="no-print flex gap-2">
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="gap-2"
            >
              {exporting ? (
                <>Téléchargement…</>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Télécharger Excel
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimer / PDF
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Chargement…</div>
        </div>
      ) : recap ? (
        <>
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Nom complet</dt>
                  <dd className="mt-1 font-medium">
                    {recap.prenom} {recap.nom}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Email</dt>
                  <dd className="mt-1 font-mono text-sm">{recap.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Grade</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">{GRADES[recap.grade] || recap.grade}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Statut</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">{STATUTS[recap.statut] || recap.statut}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Département</dt>
                  <dd className="mt-1">{recap.departement}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Charge pédagogique */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Charge statutaire</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-bold">{recap.charge_statutaire}</div>
                <p className="mt-1 text-xs text-muted-foreground">heures / an</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Volume réalisé</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="font-display text-3xl font-bold text-primary">{recap.volume_total}</div>
                <p className="mt-1 text-xs text-muted-foreground">heures calculées</p>
              </CardContent>
            </Card>

            <Card className={recap.heures_complementaires > 0 ? "border-amber-200 bg-amber-50" : ""}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Heures complémentaires</CardTitle>
                {recap.heures_complementaires > 0 && (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className={`font-display text-3xl font-bold ${recap.heures_complementaires > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {recap.heures_complementaires}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">au-delà de la charge</p>
              </CardContent>
            </Card>
          </div>

          {/* Rémunération */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-green-700" />
                <CardTitle>Estimation de rémunération</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between border-b pb-3">
                  <dt>
                    <div className="text-sm font-medium">Charge statutaire</div>
                    <div className="text-xs text-muted-foreground">
                      {recap.charge_statutaire} h × {recap.taux_horaire.toLocaleString("fr-FR")} F/h
                    </div>
                  </dt>
                  <dd className="font-mono font-semibold">
                    {(recap.charge_statutaire * recap.taux_horaire).toLocaleString("fr-FR")} F
                  </dd>
                </div>
                {recap.heures_complementaires > 0 && (
                  <div className="flex justify-between border-b pb-3">
                    <dt>
                      <div className="text-sm font-medium">Heures complémentaires</div>
                      <div className="text-xs text-muted-foreground">
                        {recap.heures_complementaires} h × {recap.taux_horaire.toLocaleString("fr-FR")} F/h
                      </div>
                    </dt>
                    <dd className="font-mono font-semibold text-amber-600">
                      {(recap.heures_complementaires * recap.taux_horaire).toLocaleString("fr-FR")} F
                    </dd>
                  </div>
                )}
                <div className="flex justify-between pt-3 text-lg">
                  <dt className="font-semibold">Total estimé</dt>
                  <dd className="font-mono font-bold text-green-700">
                    {recap.montant_total.toLocaleString("fr-FR")} F
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-muted-foreground italic">
                Les montants sont estimés sur la base du taux horaire configuré et des heures validées par
                l'administration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>Cours assignés</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recap.cours.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun cours assigne pour le moment.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Intitulé</TableHead>
                      <TableHead>Filière</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead>Sem.</TableHead>
                      <TableHead className="text-right">Heures</TableHead>
                      <TableHead className="text-right">Credits</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.cours.map((cours) => (
                      <TableRow key={cours.id}>
                        <TableCell className="font-medium">{cours.intitule}</TableCell>
                        <TableCell>{cours.filiere}</TableCell>
                        <TableCell><Badge variant="secondary">{cours.niveau}</Badge></TableCell>
                        <TableCell>S{cours.semestre}</TableCell>
                        <TableCell className="text-right">{cours.nombre_heures} h</TableCell>
                        <TableCell className="text-right">{cours.credits}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-primary" />
                <CardTitle>Activités pédagogiques</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {recap.activites.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune activité pédagogique enregistrée.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Cours</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Niveau</TableHead>
                      <TableHead className="text-right">Ressource</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Commentaire</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recap.activites.map((activite) => (
                      <TableRow key={activite.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(activite.date_activite).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">{activite.cours?.intitule ?? "Non associé"}</TableCell>
                        <TableCell>{TYPES[activite.type_activite] ?? activite.type_activite}</TableCell>
                        <TableCell>{NIVEAUX[activite.niveau_ressource] ?? activite.niveau_ressource}</TableCell>
                        <TableCell className="text-right">{activite.nombre_heures_ressource} h</TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {activite.volume_horaire_calcule.toFixed(2)} h
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const status = activite.statut_validation ?? (activite.valide ? "approuve" : "en_attente");
                            const config = VALIDATION[status] ?? VALIDATION.en_attente;
                            return <Badge variant={config.variant}>{config.label}</Badge>;
                          })()}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {activite.commentaire_validation ?? "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <p className="text-sm text-blue-900">
                <strong>Note :</strong> Ce récapitulatif est calculé sur la base des activités pédagogiques validées.
                Les montants affichés sont des estimations et peuvent être modifiés suite à la validation finale de
                l'administration.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Aucune donnée disponible. Contactez l'administration.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

