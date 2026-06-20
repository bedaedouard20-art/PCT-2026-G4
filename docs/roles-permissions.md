# Roles et permissions

## Administrateur

- Gestion des comptes utilisateurs et roles.
- Parametrage des annees academiques.
- Parametrage des baremes de calcul.
- Acces complet aux enseignants, cours, sequences, ressources, activites, etats et tableaux de bord.

## Secretaire

- Gestion administrative des enseignants.
- Gestion des cours, sequences et ressources pedagogiques.
- Saisie, approbation et rejet des activites pedagogiques.
- Consultation du tableau de bord, des etats globaux, des etats de paiement et des fiches enseignants.
- Pas d'acces a la gestion des utilisateurs, des annees academiques ni des baremes.

## Enseignant

- Consultation de son recapitulatif.
- Consultation des cours visibles.
- Consultation de ses activites pedagogiques.
- Aucun acces aux pages administratives, aux etats globaux, aux etats de paiement, aux baremes, aux utilisateurs ou aux annees academiques.

## Routes protegees

- Admin uniquement: `/baremes`, `/annees-academiques`, `/utilisateurs`.
- Admin et secretaire: `/dashboard`, `/fiche-enseignant`, `/enseignants`, `/sequences`, `/ressources`, `/etats-paiement`, `/etats-globaux`.
- Tous les roles connectes: `/recapitulatif`, `/cours`, `/activites`.

La protection est appliquee a deux niveaux:

- Navigation: le menu affiche uniquement les liens autorises pour le role connecte.
- Layout authentifie: les routes interdites redirigent vers `/dashboard` pour le secretaire et `/recapitulatif` pour l'enseignant.
