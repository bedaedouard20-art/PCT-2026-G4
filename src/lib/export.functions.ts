import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Cell = string | number | boolean | null | undefined;

function xml(value: Cell) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sheetName(name: string) {
  return xml(name.slice(0, 31));
}

function cell(value: Cell) {
  const type = typeof value === "number" && Number.isFinite(value) ? "Number" : "String";
  return `<Cell><Data ss:Type="${type}">${xml(value)}</Data></Cell>`;
}

function row(values: Cell[]) {
  return `<Row>${values.map(cell).join("")}</Row>`;
}

function worksheet(name: string, rows: Cell[][]) {
  return `<Worksheet ss:Name="${sheetName(name)}"><Table>${rows.map(row).join("")}</Table></Worksheet>`;
}

function workbook(sheets: { name: string; rows: Cell[][] }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#D9EAF7" ss:Pattern="Solid"/></Style>
 </Styles>
 ${sheets.map((sheet) => worksheet(sheet.name, sheet.rows)).join("")}
</Workbook>`;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function validationLabel(activity: any) {
  const status = activity.statut_validation ?? (activity.valide ? "approuve" : "en_attente");
  if (status === "approuve") return "Approuvee";
  if (status === "rejete") return "Rejetee";
  return "En attente";
}

export const exportEtatsPaiementPDF = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data }) => {
    const etats = data.etats || [];
    const rows = [
      [
        "Enseignant",
        "Email",
        "Grade",
        "Charge statutaire",
        "Volume approuve",
        "Heures complementaires",
        "Taux horaire",
        "Montant base",
        "Montant complementaire",
        "Total",
        "Date generation",
      ],
      ...etats.map((e: any) => [
        `${e.enseignant_prenom} ${e.enseignant_nom}`,
        e.email || "",
        e.grade || "",
        e.charge_statutaire || 0,
        e.volume_total || 0,
        e.heures_comp || 0,
        e.taux_horaire || 0,
        e.montant_base || 0,
        e.montant_comp || 0,
        e.montant_total || 0,
        e.date_generation || "",
      ]),
    ];

    return {
      filename: `etats-paiement-${today()}.xls`,
      content: workbook([{ name: "Etats paiement", rows }]),
      mimeType: "application/vnd.ms-excel;charset=utf-8",
    };
  });

export const exportEtatsGlobalPDF = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data }) => {
    const etat = data.etat || {};

    const synthese = [
      ["Indicateur", "Valeur"],
      ["Total enseignants", etat.total_enseignants || 0],
      ["Total heures approuvées", etat.total_heures || 0],
      ["Montant total", etat.montant_total || 0],
      ["Date generation", new Date().toLocaleDateString("fr-FR")],
    ];

    const departements = [
      ["Departement", "Nombre enseignants", "Volume horaire", "Montant"],
      ...(etat.par_departement || []).map((d: any) => [
        d.departement || "",
        d.nb_enseignants || 0,
        d.total_heures || 0,
        d.montant || 0,
      ]),
    ];

    const statuts = [
      ["Statut", "Nombre enseignants", "Volume horaire", "Montant"],
      ...(etat.par_statut || []).map((s: any) => [
        s.statut || "",
        s.nb_enseignants || 0,
        s.total_heures || 0,
        s.montant || 0,
      ]),
    ];

    return {
      filename: `etats-globaux-${today()}.xls`,
      content: workbook([
        { name: "Synthese", rows: synthese },
        { name: "Départements", rows: departements },
        { name: "Statuts", rows: statuts },
      ]),
      mimeType: "application/vnd.ms-excel;charset=utf-8",
    };
  });

export const exportRecapitulatifPDF = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ data }) => {
    const recap = data.recap || {};

    const infos = [
      ["Champ", "Valeur"],
      ["Nom", `${recap.prenom ?? ""} ${recap.nom ?? ""}`.trim()],
      ["Email", recap.email || ""],
      ["Département", recap.departement || ""],
      ["Grade", recap.grade || ""],
      ["Statut", recap.statut || ""],
      ["Taux horaire", recap.taux_horaire || 0],
      ["Charge statutaire", recap.charge_statutaire || 0],
      ["Volume approuvé", recap.volume_total || 0],
      ["Heures complémentaires", recap.heures_complementaires || 0],
      ["Montant total estimé", recap.montant_total || 0],
    ];

    const cours = [
      ["Intitule", "Filiere", "Niveau", "Semestre", "Heures", "Credits"],
      ...(recap.cours || []).map((c: any) => [
        c.intitule || "",
        c.filiere || "",
        c.niveau || "",
        `S${c.semestre ?? ""}`,
        c.nombre_heures || 0,
        c.credits || 0,
      ]),
    ];

    const activites = [
      [
        "Date",
        "Cours",
        "Type",
        "Niveau",
        "Heures ressource",
        "Volume calcule",
        "Statut",
        "Commentaire validation",
        "Description",
      ],
      ...(recap.activites || []).map((a: any) => [
        a.date_activite || "",
        a.cours?.intitule ?? "",
        a.type_activite || "",
        a.niveau_ressource || "",
        a.nombre_heures_ressource || 0,
        a.volume_horaire_calcule || 0,
        validationLabel(a),
        a.commentaire_validation ?? "",
        a.description ?? "",
      ]),
    ];

    const slug = `${String(recap.prenom ?? "enseignant").toLowerCase().replace(/\s+/g, "-")}-${String(recap.nom ?? "").toLowerCase().replace(/\s+/g, "-")}`;

    return {
      filename: `recapitulatif-${slug}-${today()}.xls`,
      content: workbook([
        { name: "Informations", rows: infos },
        { name: "Cours", rows: cours },
        { name: "Activités", rows: activites },
      ]),
      mimeType: "application/vnd.ms-excel;charset=utf-8",
    };
  });
