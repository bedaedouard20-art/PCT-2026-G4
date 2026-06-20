# Résumé de l'application

Cette application permet à l'UVCI de gérer les activités pédagogiques des enseignants, de calculer les volumes horaires associés et de produire les états nécessaires au suivi administratif et au paiement.

## Objectif principal

L'application centralise les informations liées aux enseignants, aux cours, aux ressources pédagogiques produites et aux activités déclarées. Elle automatise ensuite le calcul des volumes horaires selon des barèmes configurables, puis fournit des tableaux de bord, récapitulatifs et états exportables.

## Utilisateurs concernés

### Administrateur

L'administrateur dispose de l'accès complet à l'application. Il peut gérer les utilisateurs, les rôles, les années académiques, les barèmes de calcul, les enseignants, les cours, les activités et les états.

### Secrétaire

Le secrétaire gère la partie administrative courante. Il peut suivre les enseignants, les cours, les séquences, les ressources pédagogiques et les activités. Il peut aussi valider ou rejeter les activités pédagogiques et consulter les états.

### Enseignant

L'enseignant accède uniquement à ses informations utiles: ses cours, ses activités pédagogiques et son récapitulatif personnel.

## Fonctionnalités principales

- Authentification avec Supabase Auth.
- Gestion des rôles: administrateur, secrétaire, enseignant.
- Gestion des enseignants et de leurs informations administratives.
- Gestion des cours assignés aux enseignants.
- Gestion des séquences pédagogiques liées aux cours.
- Gestion des ressources pédagogiques liées aux séquences.
- Déclaration et suivi des activités pédagogiques.
- Validation ou rejet des activités avec commentaire.
- Calcul automatique du volume horaire selon le type d'activité, le niveau de ressource et les barèmes actifs.
- Tableau de bord global pour suivre les volumes, validations, départements et dépassements de charge.
- Récapitulatif personnel pour chaque enseignant.
- États de paiement par enseignant.
- États globaux par département et statut.
- Exports Excel.
- Impression navigateur pour générer des PDF.

## Données principales

L'application s'appuie sur les tables Supabase suivantes:

- `profiles`
- `user_roles`
- `departements`
- `annees_academiques`
- `enseignants`
- `cours`
- `sequences_pedagogiques`
- `ressources_pedagogiques`
- `activites_pedagogiques`
- `baremes_activites`

## Logique de calcul

Chaque activité pédagogique possède:

- un type d'activité, par exemple création ou mise à jour;
- un niveau de ressource;
- un nombre d'heures de ressource;
- un barème actif correspondant.

Le volume horaire est calculé automatiquement à partir du nombre d'heures et du coefficient du barème actif. Les états de paiement et les récapitulatifs se basent sur les activités approuvées.

## Sécurité et accès

Les accès sont contrôlés à deux niveaux:

- côté interface, le menu affiche seulement les pages autorisées pour le rôle connecté;
- côté base de données, les politiques RLS Supabase limitent l'accès aux données selon le rôle et l'utilisateur connecté.

## Livrables produits

L'application permet de produire:

- un récapitulatif enseignant;
- un état de paiement;
- un état global;
- des exports Excel;
- des impressions PDF via le navigateur.

## État actuel du projet

Le projet est configuré pour fonctionner avec le nouveau projet Supabase. Les migrations, rôles, données de départ, barèmes, exports, validations et restrictions d'accès par rôle ont été mis en place.
