import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, BookOpen, ClipboardList, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Tableau de bord - UVCI" }] }),
  component: Dashboard,
});

type StatProps = {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
};

function Stat({ icon: Icon, label, value, hint }: StatProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--gradient-gold)] text-gold-foreground">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return `${month}/${year.slice(2)}`;
}

function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [ens, crs, act] = await Promise.all([
        supabase
          .from("enseignants")
          .select("id, nom, prenom, charge_statutaire, departement:departements(nom)", { count: "exact" }),
        supabase.from("cours").select("id", { count: "exact", head: true }),
        supabase
          .from("activites_pedagogiques")
          .select("id, enseignant_id, volume_horaire_calcule, type_activite, valide, statut_validation, date_activite"),
      ]);

      if (ens.error) throw ens.error;
      if (crs.error) throw crs.error;
      if (act.error) throw act.error;

      const enseignants = ens.data ?? [];
      const activites = act.data ?? [];
      const activitesValidees = activites.filter((a: any) => a.statut_validation === "approuve" || a.valide);
      const activitesEnAttente = activites.filter((a: any) => (a.statut_validation ?? "en_attente") === "en_attente");
      const totalVolume = activitesValidees.reduce((s: number, a: any) => s + Number(a.volume_horaire_calcule), 0);

      const parEns = enseignants
        .map((e: any) => {
          const volume = activitesValidees
            .filter((a: any) => a.enseignant_id === e.id)
            .reduce((s: number, a: any) => s + Number(a.volume_horaire_calcule), 0);
          return {
            id: e.id,
            name: `${e.prenom} ${e.nom}`.trim() || "-",
            departement: e.departement?.nom ?? "-",
            charge: Number(e.charge_statutaire),
            volume: Number(volume.toFixed(1)),
            depassement: Number(Math.max(0, volume - Number(e.charge_statutaire)).toFixed(1)),
          };
        })
        .sort((a: any, b: any) => b.volume - a.volume);

      const parType = [
        {
          type: "Création",
          volume: Number(
            activitesValidees
              .filter((a: any) => a.type_activite === "creation")
              .reduce((s: number, a: any) => s + Number(a.volume_horaire_calcule), 0)
              .toFixed(1),
          ),
        },
        {
          type: "Mise à jour",
          volume: Number(
            activitesValidees
              .filter((a: any) => a.type_activite === "mise_a_jour")
              .reduce((s: number, a: any) => s + Number(a.volume_horaire_calcule), 0)
              .toFixed(1),
          ),
        },
      ];

      const deptMap = new Map<string, { departement: string; enseignants: number; volume: number }>();
      for (const enseignant of enseignants as any[]) {
        const departement = enseignant.departement?.nom ?? "-";
        const current = deptMap.get(departement) ?? { departement, enseignants: 0, volume: 0 };
        current.enseignants += 1;
        current.volume += parEns.find((e: any) => e.id === enseignant.id)?.volume ?? 0;
        deptMap.set(departement, current);
      }
      const parDepartement = Array.from(deptMap.values()).map((d) => ({
        ...d,
        volume: Number(d.volume.toFixed(1)),
      }));

      const monthlyMap = new Map<string, { mois: string; creation: number; mise_a_jour: number; total: number }>();
      for (const activity of activitesValidees as any[]) {
        const key = monthKey(activity.date_activite);
        const current = monthlyMap.get(key) ?? { mois: monthLabel(key), creation: 0, mise_a_jour: 0, total: 0 };
        const volume = Number(activity.volume_horaire_calcule);
        if (activity.type_activite === "creation") current.creation += volume;
        if (activity.type_activite === "mise_a_jour") current.mise_a_jour += volume;
        current.total += volume;
        monthlyMap.set(key, current);
      }
      const statsMensuelles = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([, value]) => ({
          mois: value.mois,
          creation: Number(value.creation.toFixed(1)),
          mise_a_jour: Number(value.mise_a_jour.toFixed(1)),
          total: Number(value.total.toFixed(1)),
        }));

      return {
        nbEnseignants: ens.count ?? enseignants.length,
        nbCours: crs.count ?? 0,
        nbActivites: activites.length,
        nbEnAttente: activitesEnAttente.length,
        totalVolume: Number(totalVolume.toFixed(1)),
        parEns,
        parType,
        parDepartement,
        statsMensuelles,
        depassements: parEns.filter((e: any) => e.depassement > 0),
      };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la charge pédagogique et des validations</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-destructive">{error.message}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat icon={Users} label="Enseignants" value={isLoading ? "..." : data?.nbEnseignants ?? 0} />
        <Stat icon={BookOpen} label="Cours" value={isLoading ? "..." : data?.nbCours ?? 0} />
        <Stat icon={ClipboardList} label="Activités" value={isLoading ? "..." : data?.nbActivites ?? 0} />
        <Stat
          icon={CheckCircle2}
          label="Volume validé"
          value={isLoading ? "..." : `${(data?.totalVolume ?? 0).toFixed(1)} h`}
          hint="Activités approuvées uniquement"
        />
        <Stat
          icon={AlertTriangle}
          label="En attente"
          value={isLoading ? "..." : data?.nbEnAttente ?? 0}
          hint="À valider ou rejeter"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Statistiques mensuelles</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {data && data.statsMensuelles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.statsMensuelles}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="mois" fontSize={12} />
                  <YAxis fontSize={12} unit="h" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="creation" stackId="a" fill="var(--color-primary)" name="Création" />
                  <Bar dataKey="mise_a_jour" stackId="a" fill="var(--color-muted)" name="Mise à jour" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par type d'activité</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {data && data.parType.some((t: any) => t.volume > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.parType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="type" fontSize={12} />
                  <YAxis fontSize={12} unit="h" />
                  <Tooltip />
                  <Bar dataKey="volume" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Volume horaire par département</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {data && data.parDepartement.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.parDepartement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis dataKey="departement" fontSize={12} />
                  <YAxis fontSize={12} unit="h" />
                  <Tooltip />
                  <Bar dataKey="volume" fill="var(--color-primary)" radius={[6, 6, 0, 0]} name="Volume" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top volumes par enseignant</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.parEns.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Enseignant</TableHead>
                    <TableHead>Département</TableHead>
                    <TableHead className="text-right">Charge</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.parEns.slice(0, 6).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.name}</TableCell>
                      <TableCell>{e.departement}</TableCell>
                      <TableCell className="text-right font-mono">{e.charge} h</TableCell>
                      <TableCell className="text-right font-mono font-semibold text-primary">{e.volume} h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune donnée à afficher.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enseignants ayant dépassé leur charge statutaire</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.depassements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Enseignant</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead className="text-right">Charge</TableHead>
                  <TableHead className="text-right">Volume validé</TableHead>
                  <TableHead className="text-right">Dépassement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.depassements.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.name}</TableCell>
                    <TableCell>{e.departement}</TableCell>
                    <TableCell className="text-right font-mono">{e.charge} h</TableCell>
                    <TableCell className="text-right font-mono">{e.volume} h</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{e.depassement} h</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Aucun dépassement de charge statutaire.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Aucune donnée à afficher pour le moment.
    </div>
  );
}
