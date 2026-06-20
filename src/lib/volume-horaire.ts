// Calcul du volume horaire pédagogique UVCI
// Doit rester strictement synchronisé avec le trigger SQL `calc_volume_horaire`.

export type TypeActivite = "creation" | "mise_a_jour";
export type NiveauRessource = "niveau_1" | "niveau_2" | "niveau_3";

export const COEFS: Record<TypeActivite, Record<NiveauRessource, number>> = {
  creation: { niveau_1: 1.6, niveau_2: 3.0, niveau_3: 6.0 },
  mise_a_jour: { niveau_1: 0.8, niveau_2: 1.5, niveau_3: 3.0 },
};

export function coefficient(type: TypeActivite, niveau: NiveauRessource): number {
  return COEFS[type][niveau];
}

export function calculerVolumeHoraire(
  type: TypeActivite,
  niveau: NiveauRessource,
  heures: number,
): number {
  if (!Number.isFinite(heures) || heures < 0) return 0;
  return Number((heures * coefficient(type, niveau)).toFixed(2));
}
