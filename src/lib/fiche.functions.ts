import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getTeachersFiche = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const supabase = context.supabase;
      const user = context.userId;

      // Get all teachers with their complete data
      const { data: teachers, error: teachersError } = await supabase
        .from("enseignants")
        .select(`
          id,
          prenom,
          nom,
          email,
          telephone,
          departement,
          grade,
          statut,
          taux_horaire
        `)
        .order("nom", { ascending: true });

      if (teachersError) throw teachersError;

      // For each teacher, calculate their volume and remuneration
      const enrichedTeachers = await Promise.all(
        (teachers || []).map(async (teacher: any) => {
          // Get validated activities for this teacher
          const { data: activities } = await supabase
            .from("activites_pedagogiques")
            .select("volume_horaire_calcule, statut_validation")
            .eq("enseignant_id", teacher.id)
            .eq("statut_validation", "approuve");

          const volume_total = (activities || []).reduce(
            (sum, act: any) => sum + Number(act.volume_horaire_calcule || 0),
            0
          );

          // Get teacher's charge
          const { data: charge } = await supabase
            .from("enseignants")
            .select("charge_statutaire")
            .eq("id", teacher.id)
            .single();

          const charge_statutaire = charge?.charge_statutaire || 0;
          const heures_complementaires = Math.max(
            0,
            volume_total - charge_statutaire
          );

          const montant_base = charge_statutaire * (teacher.taux_horaire || 0);
          const montant_comp =
            heures_complementaires * (teacher.taux_horaire || 0);
          const montant_total = montant_base + montant_comp;

          // Get courses assigned to this teacher
          const { data: courses } = await supabase
            .from("cours")
            .select("id, intitule, filiere, niveau, nombre_heures")
            .eq("enseignant_id", teacher.id);

          return {
            ...teacher,
            charge_statutaire,
            volume_total,
            heures_complementaires,
            montant_base,
            montant_comp,
            montant_total,
            courses: courses || [],
          };
        })
      );

      return enrichedTeachers;
    } catch (error) {
      console.error("Error fetching teachers fiche:", error);
      throw error;
    }
  });

export const getFichePDF = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    const ficheData = data.ficheData || {};

    // Generate a formatted text version suitable for PDF conversion
    // This can be extended with actual PDF library (pdfkit, etc.)
    const content = `
FICHE INDIVIDUELLE ENSEIGNANT
═══════════════════════════════════════════════════════════

INFORMATIONS PERSONNELLES
───────────────────────────────────────────────────────────
Nom Complet          : ${ficheData.prenom} ${ficheData.nom}
Email                : ${ficheData.email}
Téléphone            : ${ficheData.telephone || "N/A"}
Département          : ${ficheData.departement}
Grade                : ${ficheData.grade}
Statut               : ${ficheData.statut}

CHARGE ET RÉMUNÉRATION
───────────────────────────────────────────────────────────
Taux Horaire         : ${ficheData.taux_horaire?.toLocaleString("fr-FR")} FCFA/heure

Charge Statutaire    : ${ficheData.charge_statutaire} heures
Volume Réalisé       : ${ficheData.volume_total} heures
Heures Complémentaires: ${ficheData.heures_complementaires} heures

Montant Base         : ${(ficheData.charge_statutaire * ficheData.taux_horaire).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA
Montant Complémentaire: ${(ficheData.heures_complementaires * ficheData.taux_horaire).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA
Montant Total        : ${ficheData.montant_total?.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} FCFA

${
  ficheData.courses && ficheData.courses.length > 0
    ? `
COURS ASSIGNÉS
───────────────────────────────────────────────────────────
${ficheData.courses
  .map(
    (c: any) =>
      `${c.intitule} (${c.filiere} - ${c.niveau}) - ${c.nombre_heures}h`
  )
  .join("\n")}
`
    : ""
}

───────────────────────────────────────────────────────────
Généré le : ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}
Université Virtuelle de Côte d'Ivoire (UVCI)
`;

    return {
      filename: `fiche-${ficheData.prenom.toLowerCase().replace(/\s+/g, "-")}-${ficheData.nom.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.txt`,
      content: content,
      mimeType: "text/plain; charset=utf-8",
    };
  });
