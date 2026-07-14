import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Download, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getTeachersFiche, getFichePDF } from "@/lib/fiche.functions";
import { downloadFile } from "@/lib/download";

export const Route = createFileRoute("/_authenticated/fiche-enseignant")({
  component: FicheEnseignantPage,
});

const ACTIONS_PEDAGOGIQUES: Record<string, string> = {
  support_cours: "Support de cours",
  video_pedagogique: "Vidéo pédagogique",
  quiz: "Quiz",
  evaluation: "Évaluation",
  activite_interactive: "Activité interactive",
  simulation: "Simulation / serious game",
};

const STATUTS: Record<string, { label: string; variant: "default" | "outline" | "destructive" }> = {
  en_attente: { label: "En attente", variant: "outline" },
  approuve: { label: "Approuvée", variant: "default" },
  rejete: { label: "Rejetée", variant: "destructive" },
};

function FicheEnseignantPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTeachersServerFn = useServerFn(getTeachersFiche);
  const getFichePDFServerFn = useServerFn(getFichePDF);

  // Load teachers on mount
  const loadTeachers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getTeachersServerFn();
      setTeachers(result || []);
    } catch (err: any) {
      console.error("Error loading teachers:", err);
      setError(err?.message ?? "Impossible de charger les enseignants.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFiche = async (teacherId: string) => {
    if (!teacherId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await getTeachersServerFn();
      const teacher = result?.find((t: any) => t.id === teacherId);
      setSelectedFiche(teacher || null);
      setSelectedTeacher(teacherId);
    } catch (err: any) {
      console.error("Error loading fiche:", err);
      setError(err?.message ?? "Impossible de charger la fiche enseignant.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!selectedFiche) return;
    try {
      const result = await getFichePDFServerFn({ ficheData: selectedFiche });
      downloadFile(result.content, result.filename, result.mimeType);
    } catch (err) {
      console.error("Error exporting PDF:", err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const dashboardStats = useMemo(() => {
    const totalEnseignants = teachers.length;
    const totalCours = teachers.reduce((sum, teacher) => sum + (teacher.courses?.length ?? 0), 0);
    const activitesEnAttente = teachers.reduce((sum, teacher) => sum + Number(teacher.activites_en_attente ?? 0), 0);
    const activitesApprouvees = teachers.reduce((sum, teacher) => sum + Number(teacher.activites_approuvees ?? 0), 0);
    const volumeValide = teachers.reduce((sum, teacher) => sum + Number(teacher.volume_total ?? 0), 0);
    const enseignantsASuivre = teachers.filter((teacher) => Number(teacher.activites_en_attente ?? 0) > 0).length;

    return {
      totalEnseignants,
      totalCours,
      activitesEnAttente,
      activitesApprouvees,
      volumeValide,
      enseignantsASuivre,
    };
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return teachers.filter((teacher) => {
      const fullName = `${teacher.prenom} ${teacher.nom}`.toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        fullName.includes(normalizedSearch) ||
        String(teacher.email ?? "").toLowerCase().includes(normalizedSearch) ||
        String(teacher.departement ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "a_valider" && Number(teacher.activites_en_attente ?? 0) > 0) ||
        (statusFilter === "a_jour" && Number(teacher.activites_en_attente ?? 0) === 0) ||
        (statusFilter === "sans_cours" && (teacher.courses?.length ?? 0) === 0);

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, teachers]);

  const selectedActivities = useMemo(() => {
    if (!selectedFiche?.activities) return [];
    if (statusFilter === "all" || statusFilter === "a_jour" || statusFilter === "sans_cours") {
      return selectedFiche.activities;
    }
    if (statusFilter === "a_valider") {
      return selectedFiche.activities.filter((activity: any) => (activity.statut_validation ?? "en_attente") === "en_attente");
    }
    return selectedFiche.activities;
  }, [selectedFiche, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Suivi des enseignants</h1>
        <p className="text-muted-foreground">
          Contrôle des cours assignés, des activités déclarées et du calendrier effectif
        </p>
      </div>

      <div className="grid gap-4 no-print md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Enseignants</div>
            <div className="text-3xl font-bold">{dashboardStats.totalEnseignants}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Cours assignés</div>
            <div className="text-3xl font-bold">{dashboardStats.totalCours}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Activités à valider</div>
            <div className="text-3xl font-bold text-orange-600">{dashboardStats.activitesEnAttente}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-sm text-muted-foreground">Volume validé</div>
            <div className="text-3xl font-bold text-primary">{dashboardStats.volumeValide.toFixed(1)} h</div>
          </CardContent>
        </Card>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Contrôle du secrétariat</CardTitle>
          <CardDescription>
            Repérez rapidement les enseignants à suivre et ouvrez leur calendrier effectif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_240px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher par nom, email ou département"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les enseignants</SelectItem>
                <SelectItem value="a_valider">Avec activités à valider</SelectItem>
                <SelectItem value="a_jour">Sans activité en attente</SelectItem>
                <SelectItem value="sans_cours">Sans cours assigné</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Cours</TableHead>
                  <TableHead className="text-right">À valider</TableHead>
                  <TableHead className="text-right">Approuvées</TableHead>
                  <TableHead className="text-right">Volume validé</TableHead>
                  <TableHead>Suivi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-muted-foreground">
                      Aucun enseignant ne correspond aux filtres.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="font-medium">{teacher.prenom} {teacher.nom}</div>
                        <div className="text-xs text-muted-foreground">{teacher.email}</div>
                      </TableCell>
                      <TableCell>{teacher.departement}</TableCell>
                      <TableCell className="text-right">{teacher.courses?.length ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <span className={Number(teacher.activites_en_attente ?? 0) > 0 ? "font-semibold text-orange-600" : ""}>
                          {teacher.activites_en_attente ?? 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{teacher.activites_approuvees ?? 0}</TableCell>
                      <TableCell className="text-right font-mono">{Number(teacher.volume_total ?? 0).toFixed(1)} h</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => loadFiche(teacher.id)}>
                          Ouvrir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            {dashboardStats.enseignantsASuivre} enseignant(s) nécessitent une validation du secrétariat.
          </div>
        </CardContent>
      </Card>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Sélectionner un enseignant</CardTitle>
          <CardDescription>
            Choisissez un enseignant pour afficher sa fiche complète
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex gap-4">
            <Select value={selectedTeacher} onValueChange={loadFiche}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? "Chargement..." : "Sélectionner un enseignant..."} />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.prenom} {teacher.nom} ({teacher.grade}) -{" "}
                    {teacher.departement}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={loadTeachers} variant="outline">
              Rafraîchir
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedFiche && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="border-b print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">
                  {selectedFiche.prenom} {selectedFiche.nom}
                </CardTitle>
                <CardDescription>Fiche individuelle d'enseignant</CardDescription>
              </div>
              <div className="flex gap-2 no-print">
                <Button onClick={handlePrint} variant="outline" size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Imprimer / PDF
                </Button>
                <Button onClick={handleExportPDF} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter TXT
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Informations Personnelles</h3>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-40">Nom complet</TableCell>
                    <TableCell>
                      {selectedFiche.prenom} {selectedFiche.nom}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Email</TableCell>
                    <TableCell>{selectedFiche.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Téléphone</TableCell>
                    <TableCell>{selectedFiche.telephone || "N/A"}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Département</TableCell>
                    <TableCell>{selectedFiche.departement}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Grade</TableCell>
                    <TableCell>{selectedFiche.grade}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Statut</TableCell>
                    <TableCell>
                      <Badge variant={selectedFiche.statut === "Permanent" ? "default" : "secondary"}>
                        {selectedFiche.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Taux horaire (FCFA)</TableCell>
                    <TableCell className="font-semibold text-green-700">
                      {selectedFiche.taux_horaire?.toLocaleString("fr-FR")} FCFA/h
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Charge et Volume */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Charge et Volume Horaire</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Charge Statutaire</div>
                    <div className="text-2xl font-bold">
                      {selectedFiche.charge_statutaire}h
                    </div>
                  </CardContent>
                </Card>
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Volume Réalisé</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedFiche.volume_total}h
                    </div>
                  </CardContent>
                </Card>
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Heures Complémentaires</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedFiche.heures_complementaires}h
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Activités approuvées</div>
                    <div className="text-2xl font-bold text-green-700">
                      {selectedFiche.activites_approuvees ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">À valider</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedFiche.activites_en_attente ?? 0}
                    </div>
                  </CardContent>
                </Card>
                <Card className="print:border-gray-300">
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Rejetées</div>
                    <div className="text-2xl font-bold text-destructive">
                      {selectedFiche.activites_rejetees ?? 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Rémunération */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Rémunération Estimée</h3>
              <Table>
                <TableBody>
                  <TableRow className="bg-blue-50 print:bg-gray-50">
                    <TableCell className="font-medium">Montant Base</TableCell>
                    <TableCell className="font-semibold text-right">
                      {(
                        selectedFiche.charge_statutaire * selectedFiche.taux_horaire
                      ).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-orange-50 print:bg-gray-50">
                    <TableCell className="font-medium">Montant Complémentaire</TableCell>
                    <TableCell className="font-semibold text-right">
                      {(
                        selectedFiche.heures_complementaires * selectedFiche.taux_horaire
                      ).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA
                    </TableCell>
                  </TableRow>
                  <TableRow className="bg-green-50 print:bg-gray-100 font-semibold">
                    <TableCell>Montant Total Estimé</TableCell>
                    <TableCell className="text-right text-lg">
                      {selectedFiche.montant_total?.toLocaleString("fr-FR", {
                        maximumFractionDigits: 0,
                      })} FCFA
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <Tabs defaultValue="calendrier" className="no-print">
              <TabsList>
                <TabsTrigger value="calendrier">Calendrier effectif</TabsTrigger>
                <TabsTrigger value="cours">Cours assignés</TabsTrigger>
              </TabsList>

              <TabsContent value="calendrier" className="mt-4">
                <h3 className="mb-3 text-lg font-semibold">
                  Calendrier des activités ({selectedActivities.length})
                </h3>
                {selectedActivities.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Cours</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead className="text-right">Volume</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Commentaire</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedActivities.map((activity: any) => {
                        const status = activity.statut_validation ?? "en_attente";
                        const statusConfig = STATUTS[status] ?? STATUTS.en_attente;
                        return (
                          <TableRow key={activity.id}>
                            <TableCell className="whitespace-nowrap">
                              {new Date(activity.date_activite).toLocaleDateString("fr-FR")}
                            </TableCell>
                            <TableCell className="max-w-[220px] truncate">
                              {activity.cours?.intitule ?? "-"}
                            </TableCell>
                            <TableCell>
                              {ACTIONS_PEDAGOGIQUES[activity.action_pedagogique] ?? activity.type_activite}
                            </TableCell>
                            <TableCell>{activity.niveau_ressource?.replace("niveau_", "N")}</TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {Number(activity.volume_horaire_calcule ?? 0).toFixed(2)} h
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[260px] truncate">
                              {activity.commentaire_validation ?? "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune activité déclarée pour cet enseignant.</p>
                )}
              </TabsContent>

              <TabsContent value="cours" className="mt-4">
                <h3 className="mb-3 text-lg font-semibold">
                  Cours assignés ({selectedFiche.courses?.length ?? 0})
                </h3>
                {selectedFiche.courses && selectedFiche.courses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Intitulé</TableHead>
                        <TableHead>Filière</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead className="text-right">Heures</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedFiche.courses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.intitule}</TableCell>
                          <TableCell>{course.filiere}</TableCell>
                          <TableCell>{course.niveau}</TableCell>
                          <TableCell className="text-right">{course.nombre_heures}h</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun cours assigné.</p>
                )}
              </TabsContent>
            </Tabs>

            {/* Footer pour impression */}
            <div className="border-t pt-4 text-xs text-muted-foreground print:border-black print:text-black">
              <p>Document généré le {new Date().toLocaleDateString("fr-FR")}</p>
              <p>Université Virtuelle de Côte d'Ivoire (UVCI)</p>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedFiche && selectedTeacher && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucune donnée disponible pour cet enseignant.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
