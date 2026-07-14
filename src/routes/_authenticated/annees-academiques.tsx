import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, Plus, Trash2, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import {
  getAnneeAcademique,
  createAnneeAcademique,
  updateAnneeAcademique,
  deleteAnneeAcademique,
} from "@/lib/annees.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/annees-academiques")({
  component: AnneesAcademiquesPage,
});

function AnneesAcademiquesPage() {
  const auth = useAuth();
  const [annees, setAnnees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    annee_debut: new Date().getFullYear(),
    annee_fin: new Date().getFullYear() + 1,
    libelle: "",
    est_active: false,
  });

  const getAnneesServerFn = useServerFn(getAnneeAcademique);
  const createAnneeServerFn = useServerFn(createAnneeAcademique);
  const updateAnneeServerFn = useServerFn(updateAnneeAcademique);
  const deleteAnneeServerFn = useServerFn(deleteAnneeAcademique);

  // Load annees on mount
  const loadAnnees = async () => {
    try {
      setLoading(true);
      const result = await getAnneesServerFn();
      setAnnees(result || []);
    } catch (err) {
      console.error("Error loading annees:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (!formData.libelle) {
        alert("Veuillez remplir le libellé");
        return;
      }

      await createAnneeServerFn({
        annee_debut: formData.annee_debut,
        annee_fin: formData.annee_fin,
        libelle: formData.libelle,
        est_active: formData.est_active,
      });

      setFormData({
        annee_debut: new Date().getFullYear(),
        annee_fin: new Date().getFullYear() + 1,
        libelle: "",
        est_active: false,
      });
      setOpenDialog(false);
      await loadAnnees();
    } catch (err) {
      console.error("Error creating annee:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      await updateAnneeServerFn({
        id,
        est_active: !currentStatus,
      });
      await loadAnnees();
    } catch (err) {
      console.error("Error updating annee:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette année académique?")) {
      try {
        setLoading(true);
        await deleteAnneeServerFn({ id });
        await loadAnnees();
      } catch (err) {
        console.error("Error deleting annee:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramétrage des années académiques</h1>
        <p className="text-muted-foreground">
          Définissez les périodes de référence utilisées pour les cours, validations et états.
        </p>
      </div>

      {!auth.hasRole("admin") && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous n'avez pas accès à cette page. Seuls les administrateurs peuvent gérer les années académiques.
          </AlertDescription>
        </Alert>
      )}

      {auth.hasRole("admin") && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Ajouter une année académique</CardTitle>
                <CardDescription>
                  Créer une nouvelle période de suivi pédagogique
                </CardDescription>
              </div>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle année
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une année académique</DialogTitle>
                    <DialogDescription>
                      Saisissez les détails de la nouvelle année scolaire
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="annee_debut">Année de début</Label>
                      <Input
                        id="annee_debut"
                        type="number"
                        value={formData.annee_debut}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            annee_debut: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="annee_fin">Année de fin</Label>
                      <Input
                        id="annee_fin"
                        type="number"
                        value={formData.annee_fin}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            annee_fin: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="libelle">Libellé</Label>
                      <Input
                        id="libelle"
                        placeholder="Ex: 2025-2026"
                        value={formData.libelle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            libelle: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="est_active"
                        checked={formData.est_active}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            est_active: checked,
                          })
                        }
                      />
                      <Label htmlFor="est_active">Activer cette année</Label>
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? "Création..." : "Créer"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Années académiques enregistrées</CardTitle>
              <CardDescription>
                Cliquez sur "Rafraîchir" pour charger la liste des années
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadAnnees} variant="outline" className="mb-4">
                Rafraîchir
              </Button>

              {loading && !annees.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chargement...
                </div>
              ) : annees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Aucune année académique créée pour le moment
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Années</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créée le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {annees.map((annee: any) => (
                      <TableRow key={annee.id}>
                        <TableCell className="font-medium">{annee.libelle}</TableCell>
                        <TableCell>
                          {annee.annee_debut}-{annee.annee_fin}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={annee.est_active}
                              onCheckedChange={() =>
                                handleToggleActive(annee.id, annee.est_active)
                              }
                            />
                            {annee.est_active && (
                              <Badge>
                                <Check className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {annee.created_at
                            ? new Date(annee.created_at).toLocaleDateString(
                                "fr-FR"
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            onClick={() => handleDelete(annee.id)}
                            variant="destructive"
                            size="sm"
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
