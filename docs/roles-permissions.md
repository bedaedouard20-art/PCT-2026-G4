# Rôles et permissions

Ce document décrit les responsabilités fonctionnelles et les accès attendus par profil.

## Administrateur

- Gestion des comptes utilisateurs et des rôles.
- Paramétrage des années académiques.
- Paramétrage des barèmes de calcul.
- Consultation des états globaux.
- Supervision des accès et des paramètres de la plateforme.

## Secrétaire

- Enregistrement et suivi administratif des enseignants.
- Programmation des cours.
- Fixation des crédits.
- Assignation des cours aux enseignants.
- Validation ou rejet des activités pédagogiques.
- Suivi effectif du calendrier et des fiches enseignants.
- Consultation des états de paiement et des états globaux.
- Pas d'accès à la gestion des utilisateurs, aux années académiques ni aux barèmes.

## Enseignant

- Consultation de son suivi personnel.
- Consultation des cours qui lui sont assignés.
- Création et gestion des séquences de ses cours.
- Dépôt des ressources pédagogiques liées à ses séquences.
- Déclaration de ses activités pédagogiques.
- Consultation de son récapitulatif.
- Aucun accès aux pages administratives, aux états globaux, aux états de paiement, aux barèmes, aux utilisateurs ou aux années académiques.

## Routes protégées

- Admin uniquement: `/baremes`, `/annees-academiques`, `/utilisateurs`.
- Admin et secrétaire: `/dashboard`, `/fiche-enseignant`, `/enseignants`, `/etats-paiement`, `/etats-globaux`.
- Enseignant, admin et secrétaire selon les politiques métier: `/cours`, `/sequences`, `/ressources`, `/activites`.
- Tous les rôles connectés: `/recapitulatif`.

La protection est appliquée à deux niveaux:

- Navigation: le menu affiche uniquement les liens autorisés pour le rôle connecté.
- Layout authentifié: les routes interdites redirigent vers `/dashboard` pour le secrétaire et vers `/recapitulatif` pour l'enseignant.
