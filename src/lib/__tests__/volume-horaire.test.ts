import { describe, it, expect } from "vitest";
import {
  COEFS,
  coefficient,
  calculerVolumeHoraire,
  type TypeActivite,
  type NiveauRessource,
} from "@/lib/volume-horaire";

describe("Coefficients UVCI", () => {
  it("création : N1=1.6, N2=3.0, N3=6.0", () => {
    expect(COEFS.creation.niveau_1).toBe(1.6);
    expect(COEFS.creation.niveau_2).toBe(3.0);
    expect(COEFS.creation.niveau_3).toBe(6.0);
  });

  it("mise à jour : N1=0.8, N2=1.5, N3=3.0", () => {
    expect(COEFS.mise_a_jour.niveau_1).toBe(0.8);
    expect(COEFS.mise_a_jour.niveau_2).toBe(1.5);
    expect(COEFS.mise_a_jour.niveau_3).toBe(3.0);
  });

  it("mise à jour = moitié de création (chaque niveau)", () => {
    (["niveau_1", "niveau_2", "niveau_3"] as NiveauRessource[]).forEach((n) => {
      expect(coefficient("mise_a_jour", n) * 2).toBeCloseTo(
        coefficient("creation", n),
        5,
      );
    });
  });
});

describe("calculerVolumeHoraire", () => {
  const cas: Array<{
    type: TypeActivite;
    niveau: NiveauRessource;
    heures: number;
    attendu: number;
  }> = [
    // Création
    { type: "creation", niveau: "niveau_1", heures: 10, attendu: 16 },
    { type: "creation", niveau: "niveau_2", heures: 10, attendu: 30 },
    { type: "creation", niveau: "niveau_3", heures: 10, attendu: 60 },
    { type: "creation", niveau: "niveau_2", heures: 5, attendu: 15 },
    { type: "creation", niveau: "niveau_3", heures: 7.5, attendu: 45 },
    // Mise à jour
    { type: "mise_a_jour", niveau: "niveau_1", heures: 10, attendu: 8 },
    { type: "mise_a_jour", niveau: "niveau_2", heures: 10, attendu: 15 },
    { type: "mise_a_jour", niveau: "niveau_3", heures: 10, attendu: 30 },
    { type: "mise_a_jour", niveau: "niveau_1", heures: 20, attendu: 16 },
  ];

  it.each(cas)(
    "$type / $niveau / $heures h → $attendu h",
    ({ type, niveau, heures, attendu }) => {
      expect(calculerVolumeHoraire(type, niveau, heures)).toBeCloseTo(attendu, 2);
    },
  );

  it("retourne 0 pour des heures négatives", () => {
    expect(calculerVolumeHoraire("creation", "niveau_2", -5)).toBe(0);
  });

  it("retourne 0 pour NaN", () => {
    expect(calculerVolumeHoraire("creation", "niveau_2", Number.NaN)).toBe(0);
  });

  it("zéro heure ⇒ zéro volume", () => {
    expect(calculerVolumeHoraire("mise_a_jour", "niveau_3", 0)).toBe(0);
  });
});
