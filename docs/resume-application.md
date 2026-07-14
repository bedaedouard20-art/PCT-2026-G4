# Résumé de l'application

Cette application permet à l'UVCI de suivre les enseignants, les cours, les productions pédagogiques, les validations administratives et les volumes horaires associés.

## Objectif

La plateforme centralise les informations liées aux enseignants, aux cours proposés, aux séquences pédagogiques, aux ressources produites et aux activités déclarées. Elle calcule automatiquement les volumes horaires selon les actions réalisées et les barèmes configurés, puis produit des tableaux de bord, récapitulatifs et états exportables.

## Rôles utilisateurs

### Administrateur

L'administrateur gère les accès, les comptes, les rôles, les années académiques et les barèmes de calcul. Il supervise aussi les états globaux et les paramètres de la plateforme.

### Secrétaire

Le secrétaire assure le suivi administratif courant. Il enregistre les enseignants, programme les cours, fixe les crédits, assigne les cours aux enseignants, valide ou rejette les activités déclarées et suit le calendrier pédagogique.

### Enseignant

L'enseignant consulte les cours qui lui sont assignés, crée les séquences de ces cours, dépose les ressources pédagogiques, déclare ses activités et consulte son récapitulatif personnel.

## Fonctionnalités principales

- Authentification avec Supabase Auth.
- Gestion des rôles administrateur, secrétaire et enseignant.
- Enregistrement et suivi des enseignants.
- Programmation des cours et assignation aux enseignants.
- Gestion des séquences pédagogiques par cours.
- Dépôt de ressources pédagogiques: documents, vidéos, quiz, évaluations et activités interactives.
- Déclaration des activités pédagogiques par les enseignants.
- Validation ou rejet des activités par le secrétariat, avec motif en cas de rejet.
- Calcul automatique du niveau et du volume horaire selon l'action pédagogique.
- Paramétrage des barèmes de calcul par l'administrateur.
- Tableaux de bord de pilotage.
- Récapitulatif individuel par enseignant.
- États de paiement et états globaux.
- Exports Excel et impression PDF via le navigateur.

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

## Logique métier

L'administration paramètre les accès, les années et les barèmes. Le secrétariat programme les cours, fixe les crédits et assigne les cours aux enseignants. L'enseignant produit les séquences, les ressources et les déclarations d'activités. Le secrétariat valide ensuite ces activités, ce qui permet de consolider les volumes horaires et les états.

Le volume horaire est calculé automatiquement à partir de l'action pédagogique, du niveau déduit et du barème actif. Les récapitulatifs et états de paiement se basent sur les activités approuvées.

## Sécurité

Les accès sont contrôlés à deux niveaux:

- côté interface, le menu affiche uniquement les pages autorisées pour le rôle connecté;
- côté base de données, les politiques RLS Supabase limitent l'accès aux données selon le rôle et l'utilisateur connecté.

## État du projet

Le projet est connecté à Supabase, déployé sur Render et prêt pour les tests fonctionnels avec les trois profils: administrateur, secrétaire et enseignant.
