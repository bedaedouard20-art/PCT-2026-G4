import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/hooks/useAuth";
import { getTeachersFiche, getFichePDF } from "@/lib/fiche.functions";
import { downloadFile } from "@/lib/download";

export const Route = createFileRoute("/_authenticated/fiche-enseignant")({
  component: FicheEnseignantPage,
});

function FicheEnseignantPage() {
  const auth = useAuth();
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedFiche, setSelectedFiche] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getTeachersServerFn = useServerFn(getTeachersFiche);
  const getFichePDFServerFn = useServerFn(getFichePDF);

  // Load teachers on mount
  const loadTeachers = async () => {
    try {
      setLoading(true);
      const result = await getTeachersServerFn();
      setTeachers(result || []);
    } catch (err) {
      console.error("Error loading teachers:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadFiche = async (teacherId: string) => {
    if (!teacherId) return;
    try {
      setLoading(true);
      const result = await getTeachersServerFn();
      const teacher = result?.find((t: any) => t.id === teacherId);
      setSelectedFiche(teacher || null);
      setSelectedTeacher(teacherId);
    } catch (err) {
      console.error("Error loading fiche:", err);
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

  return (
    <div className="space-y-6">
      <div className="no-print">
        <h1 className="text-3xl font-bold">Fiche Enseignant</h1>
        <p className="text-muted-foreground">
          Consultation et impression de fiche individuelle enseignant
        </p>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Sélectionner un enseignant</CardTitle>
          <CardDescription>
            Choisissez un enseignant pour afficher sa fiche complète
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedTeacher} onValueChange={loadFiche}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionner un enseignant..." />
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
                  Imprimer
                </Button>
                <Button onClick={handleExportPDF} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger TXT
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

            {/* Cours assignés */}
            {selectedFiche.courses && selectedFiche.courses.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Cours Assignés ({selectedFiche.courses.length})
                </h3>
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
              </div>
            )}

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
