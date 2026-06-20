import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface RecapEnseignant {
  enseignant_id: string;
  nom: string;
  prenom: string;
  email: string;
  grade: string;
  statut: string;
  departement: string;
  taux_horaire: number;
  charge_statutaire: number;
  volume_total: number;
  heures_complementaires: number;
  montant_total: number;
  cours: {
    id: string;
    intitule: string;
    filiere: string;
    niveau: string;
    semestre: number;
    nombre_heures: number;
    credits: number;
  }[];
  activites: {
    id: string;
    date_activite: string;
    type_activite: string;
    niveau_ressource: string;
    nombre_heures_ressource: number;
    volume_horaire_calcule: number;
    valide: boolean;
    statut_validation: string | null;
    commentaire_validation: string | null;
    description: string | null;
    cours: { intitule: string } | null;
  }[];
}

export interface EtatPaiement {
  id: string;
  enseignant_nom: string;
  enseignant_prenom: string;
  email: string;
  grade: string;
  volume_total: number;
  charge_statutaire: number;
  heures_comp: number;
  taux_horaire: number;
  montant_base: number;
  montant_comp: number;
  montant_total: number;
  date_generation: string;
}

export interface EtatGlobal {
  total_enseignants: number;
  total_heures: number;
  montant_total: number;
  par_departement: {
    departement: string;
    nb_enseignants: number;
    total_heures: number;
    montant: number;
  }[];
  par_statut: {
    statut: string;
    nb_enseignants: number;
    total_heures: number;
    montant: number;
  }[];
}

export const getRecapEnseignant = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const userId = context.userId;

    // Récupérer l'enseignant lié à l'utilisateur
    const { data: enseignant } = await supabase
      .from("enseignants")
      .select("id, nom, prenom, email, grade, statut, departement_id, taux_horaire, charge_statutaire")
      .eq("user_id", userId)
      .single();

    if (!enseignant) {
      throw new Error("Enseignant non trouvé pour cet utilisateur");
    }

    // Récupérer le département
    const { data: dept } = await supabase
      .from("departements")
      .select("nom")
      .eq("id", enseignant.departement_id)
      .single();

    // Récupérer les activités et calculer le volume
    const { data: cours } = await supabase
      .from("cours")
      .select("id, intitule, filiere, niveau, semestre, nombre_heures, credits")
      .eq("enseignant_id", enseignant.id)
      .order("intitule");

    const { data: activites } = await supabase
      .from("activites_pedagogiques")
      .select(`
        id,
        date_activite,
        type_activite,
        niveau_ressource,
        nombre_heures_ressource,
        volume_horaire_calcule,
        valide,
        statut_validation,
        commentaire_validation,
        description,
        cours:cours(intitule)
      `)
      .eq("enseignant_id", enseignant.id)
      .order("date_activite", { ascending: false });

    const volume_total = (activites ?? [])
      .filter((a: any) => a.statut_validation === "approuve" || a.valide)
      .reduce((sum, a: any) => sum + Number(a.volume_horaire_calcule), 0);
    const heures_complementaires = Math.max(0, volume_total - Number(enseignant.charge_statutaire));
    const montant_base = Number(enseignant.charge_statutaire) * Number(enseignant.taux_horaire);
    const montant_comp = heures_complementaires * Number(enseignant.taux_horaire);

    return {
      enseignant_id: enseignant.id,
      nom: enseignant.nom,
      prenom: enseignant.prenom,
      email: enseignant.email,
      grade: enseignant.grade,
      statut: enseignant.statut,
      departement: dept?.nom ?? "—",
      taux_horaire: Number(enseignant.taux_horaire),
      charge_statutaire: Number(enseignant.charge_statutaire),
      volume_total: Math.round(volume_total * 100) / 100,
      heures_complementaires: Math.round(heures_complementaires * 100) / 100,
      montant_total: Math.round((montant_base + montant_comp) * 100) / 100,
      cours: cours ?? [],
      activites: (activites ?? []).map((a: any) => ({
        ...a,
        nombre_heures_ressource: Number(a.nombre_heures_ressource),
        volume_horaire_calcule: Number(a.volume_horaire_calcule),
      })),
    };
  });

export const getAllEtatsPaiement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // Récupérer tous les enseignants
    const { data: enseignants } = await supabase
      .from("enseignants")
      .select("id, nom, prenom, email, grade, statut, taux_horaire, charge_statutaire");

    if (!enseignants || enseignants.length === 0) {
      return { etats: [] };
    }

    const etats: EtatPaiement[] = [];

    for (const ens of enseignants) {
      // Récupérer les activités validées
      const { data: activites } = await supabase
        .from("activites_pedagogiques")
        .select("volume_horaire_calcule")
        .eq("enseignant_id", ens.id)
        .eq("statut_validation", "approuve");

      const volume_total = (activites ?? []).reduce((sum, a: any) => sum + Number(a.volume_horaire_calcule), 0);
      const heures_comp = Math.max(0, volume_total - Number(ens.charge_statutaire));
      const montant_base = Number(ens.charge_statutaire) * Number(ens.taux_horaire);
      const montant_comp = heures_comp * Number(ens.taux_horaire);

      etats.push({
        id: ens.id,
        enseignant_nom: ens.nom,
        enseignant_prenom: ens.prenom,
        email: ens.email,
        grade: ens.grade,
        volume_total: Math.round(volume_total * 100) / 100,
        charge_statutaire: Number(ens.charge_statutaire),
        heures_comp: Math.round(heures_comp * 100) / 100,
        taux_horaire: Number(ens.taux_horaire),
        montant_base: Math.round(montant_base * 100) / 100,
        montant_comp: Math.round(montant_comp * 100) / 100,
        montant_total: Math.round((montant_base + montant_comp) * 100) / 100,
        date_generation: new Date().toLocaleDateString("fr-FR"),
      });
    }

    return { etats };
  });

export const getEtatGlobal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    // Récupérer tous les enseignants avec département
    const { data: enseignants } = await supabase
      .from("enseignants")
      .select("id, nom, prenom, statut, departement_id, taux_horaire, charge_statutaire, departement:departements(nom)");

    if (!enseignants || enseignants.length === 0) {
      return {
        total_enseignants: 0,
        total_heures: 0,
        montant_total: 0,
        par_departement: [],
        par_statut: [],
      };
    }

    let totalHeures = 0;
    let montantTotal = 0;
    const parDept = new Map<string, { nb_enseignants: number; total_heures: number; montant: number }>();
    const parStatut = new Map<string, { nb_enseignants: number; total_heures: number; montant: number }>();

    for (const ens of enseignants) {
      const { data: activites } = await supabase
        .from("activites_pedagogiques")
        .select("volume_horaire_calcule")
        .eq("enseignant_id", ens.id)
        .eq("statut_validation", "approuve");

      const volume_total = (activites ?? []).reduce((sum, a: any) => sum + Number(a.volume_horaire_calcule), 0);
      const heures_comp = Math.max(0, volume_total - Number(ens.charge_statutaire));
      const montant_base = Number(ens.charge_statutaire) * Number(ens.taux_horaire);
      const montant_comp = heures_comp * Number(ens.taux_horaire);
      const montant_ens = montant_base + montant_comp;

      totalHeures += volume_total;
      montantTotal += montant_ens;

      // Par département
      const deptName = (ens.departement as any)?.nom ?? "—";
      const deptData = parDept.get(deptName) ?? { nb_enseignants: 0, total_heures: 0, montant: 0 };
      deptData.nb_enseignants += 1;
      deptData.total_heures += volume_total;
      deptData.montant += montant_ens;
      parDept.set(deptName, deptData);

      // Par statut
      const statutData = parStatut.get(ens.statut) ?? { nb_enseignants: 0, total_heures: 0, montant: 0 };
      statutData.nb_enseignants += 1;
      statutData.total_heures += volume_total;
      statutData.montant += montant_ens;
      parStatut.set(ens.statut, statutData);
    }

    return {
      total_enseignants: enseignants.length,
      total_heures: Math.round(totalHeures * 100) / 100,
      montant_total: Math.round(montantTotal * 100) / 100,
      par_departement: Array.from(parDept.entries()).map(([dept, data]) => ({
        departement: dept,
        nb_enseignants: data.nb_enseignants,
        total_heures: Math.round(data.total_heures * 100) / 100,
        montant: Math.round(data.montant * 100) / 100,
      })),
      par_statut: Array.from(parStatut.entries()).map(([statut, data]) => ({
        statut,
        nb_enseignants: data.nb_enseignants,
        total_heures: Math.round(data.total_heures * 100) / 100,
        montant: Math.round(data.montant * 100) / 100,
      })),
    };
  });
