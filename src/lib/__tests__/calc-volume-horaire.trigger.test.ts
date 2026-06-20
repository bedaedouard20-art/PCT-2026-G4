// Tests d'intégration : exécute réellement le trigger PostgreSQL
// `calc_volume_horaire` et compare le résultat à la fonction TypeScript
// `calculerVolumeHoraire`. Les deux DOIVENT rester synchronisés.
//
// Chaque cas s'exécute dans une transaction qui est systématiquement
// annulée (ROLLBACK), donc rien n'est jamais persisté en base.
// Skip automatique si l'accès psql (PGHOST) n'est pas disponible.

import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import {
  calculerVolumeHoraire,
  type TypeActivite,
  type NiveauRessource,
} from "@/lib/volume-horaire";

const hasDb = !!process.env.PGHOST;
const d = hasDb ? describe : describe.skip;

function psql(sql: string): string {
  return execFileSync("psql", ["-At", "-v", "ON_ERROR_STOP=1", "-c", sql], {
    encoding: "utf8",
  }).trim();
}

// Exécute un INSERT activité dans une transaction et renvoie le
// volume calculé par le trigger SQL, puis ROLLBACK.
function volumeViaTrigger(
  type: TypeActivite,
  niveau: NiveauRessource,
  heures: number,
): number {
  const sql = `
    BEGIN;
    WITH d AS (
      INSERT INTO public.departements(nom) VALUES ('__test_trigger__')
      RETURNING id
    ),
    e AS (
      INSERT INTO public.enseignants(nom, prenom, email, departement_id)
      SELECT 'Test', 'Trigger', 'test-trigger-' || gen_random_uuid() || '@test.local', id
      FROM d RETURNING id
    ),
    a AS (
      INSERT INTO public.activites_pedagogiques
        (enseignant_id, type_activite, niveau_ressource, nombre_heures_ressource)
      SELECT id, '${type}', '${niveau}', ${heures} FROM e
      RETURNING volume_horaire_calcule
    )
    SELECT volume_horaire_calcule FROM a;
    ROLLBACK;
  `;
  const out = psql(sql);
  // psql -At affiche : BEGIN \n <valeur> \n ROLLBACK
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  const valueLine = lines.find((l) => /^-?\d/.test(l));
  if (!valueLine) {
    throw new Error(`Sortie psql inattendue:\n${out}`);
  }
  return Number(valueLine);
}

// Vérifie aussi qu'un UPDATE déclenche le recalcul.
function volumesViaUpdate(
  t1: TypeActivite,
  n1: NiveauRessource,
  h1: number,
  t2: TypeActivite,
  n2: NiveauRessource,
  h2: number,
): { initial: number; apresUpdate: number } {
  const sql = `
    BEGIN;
    WITH d AS (
      INSERT INTO public.departements(nom) VALUES ('__test_trigger__')
      RETURNING id
    ),
    e AS (
      INSERT INTO public.enseignants(nom, prenom, email, departement_id)
      SELECT 'Test', 'Trigger', 'test-trigger-' || gen_random_uuid() || '@test.local', id
      FROM d RETURNING id
    ),
    ins AS (
      INSERT INTO public.activites_pedagogiques
        (enseignant_id, type_activite, niveau_ressource, nombre_heures_ressource)
      SELECT id, '${t1}', '${n1}', ${h1} FROM e
      RETURNING id, volume_horaire_calcule
    ),
    upd AS (
      UPDATE public.activites_pedagogiques
      SET type_activite = '${t2}',
          niveau_ressource = '${n2}',
          nombre_heures_ressource = ${h2}
      WHERE id = (SELECT id FROM ins)
      RETURNING volume_horaire_calcule
    )
    SELECT (SELECT volume_horaire_calcule FROM ins) AS initial,
           (SELECT volume_horaire_calcule FROM upd) AS apres;
    ROLLBACK;
  `;
  const out = psql(sql);
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  const valueLine = lines.find((l) => l.includes("|"));
  if (!valueLine) throw new Error(`Sortie psql inattendue:\n${out}`);
  const [a, b] = valueLine.split("|");
  return { initial: Number(a), apresUpdate: Number(b) };
}

const cas: Array<{
  type: TypeActivite;
  niveau: NiveauRessource;
  heures: number;
}> = [
  // La colonne `nombre_heures_ressource` est INTEGER en base : on n'utilise
  // que des heures entières pour éviter une troncature côté SQL.
  { type: "creation", niveau: "niveau_1", heures: 10 },
  { type: "creation", niveau: "niveau_2", heures: 10 },
  { type: "creation", niveau: "niveau_3", heures: 10 },
  { type: "creation", niveau: "niveau_2", heures: 5 },
  { type: "creation", niveau: "niveau_3", heures: 8 },
  { type: "mise_a_jour", niveau: "niveau_1", heures: 10 },
  { type: "mise_a_jour", niveau: "niveau_2", heures: 10 },
  { type: "mise_a_jour", niveau: "niveau_3", heures: 10 },
  { type: "mise_a_jour", niveau: "niveau_1", heures: 20 },
];

d("Trigger SQL calc_volume_horaire ≡ calculerVolumeHoraire", () => {
  it.each(cas)(
    "INSERT $type / $niveau / $heures h → trigger == TS",
    ({ type, niveau, heures }) => {
      const sql = volumeViaTrigger(type, niveau, heures);
      const ts = calculerVolumeHoraire(type, niveau, heures);
      expect(sql).toBeCloseTo(ts, 2);
    },
  );

  it("UPDATE recalcule via le trigger (creation N2 10h → mise_a_jour N3 8h)", (ctx) => {
    let result: { initial: number; apresUpdate: number };
    try {
      result = volumesViaUpdate(
        "creation",
        "niveau_2",
        10,
        "mise_a_jour",
        "niveau_3",
        8,
      );
    } catch (e) {
      // Le rôle psql du sandbox peut être SELECT/INSERT only.
      // Dans ce cas l'aspect UPDATE n'est pas testable ici → skip propre.
      if (String(e).includes("permission denied")) return ctx.skip();
      throw e;
    }
    expect(result.initial).toBeCloseTo(
      calculerVolumeHoraire("creation", "niveau_2", 10),
      2,
    );
    expect(result.apresUpdate).toBeCloseTo(
      calculerVolumeHoraire("mise_a_jour", "niveau_3", 8),
      2,
    );
  });
});
