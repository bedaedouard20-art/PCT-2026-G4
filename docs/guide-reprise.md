# Guide de reprise du projet

Ce document résume l'état actuel du projet et les vérifications à faire avant une démonstration ou une livraison.

## État actuel

- Le projet est connecté au nouveau projet Supabase.
- Les migrations locales sont synchronisées avec la base distante.
- Les données de départ ont été insérées avec `supabase/seed.sql`.
- Un compte administrateur a été ajouté avec `supabase/create_admin.sql`.
- Le compte enseignant `beda.atseby@uvci.edu.ci` a été lié à sa fiche enseignant avec `supabase/link_enseignant_user.sql`.
- Les rôles contrôlent l'affichage du menu, les protections de routes et les accès RLS.
- Les enseignants peuvent gérer leurs séquences, ressources et activités déclarées.
- Le secrétariat peut programmer les cours, fixer les crédits, assigner les enseignants, valider les activités et suivre les fiches enseignants.
- L'administrateur gère les accès, les rôles, les années académiques et les barèmes.
- Les exports Excel et l'impression PDF via le navigateur sont disponibles sur les pages d'états.
- Le projet est déployé sur Render.

## Commandes utiles

Depuis la racine du projet:

```powershell
cd C:\Users\HP\Downloads\thesis-guide-magic-main\thesis-guide-magic-main
```

Lancer en local:

```powershell
npm run dev -- --host 127.0.0.1 --port 8081
```

URL locale:

```text
http://127.0.0.1:8081
```

Build de vérification:

```powershell
npm run build
```

Pousser les migrations Supabase:

```powershell
$env:SUPABASE_DB_PASSWORD="MOT_DE_PASSE_DATABASE_SUPABASE"
supabase db push
```

Vérifier l'état des migrations:

```powershell
supabase migration list
```

Envoyer les changements sur GitHub:

```powershell
git add .
git commit -m "Message clair du changement"
git push origin main
```

## Comptes à vérifier

### Administrateur

- Rôle attendu: `admin`
- Responsabilités: comptes, accès, rôles, années académiques, barèmes, états globaux.
- Pages attendues: pilotage, états globaux, barèmes, années académiques, accès et rôles.

### Secrétaire

- Rôle attendu: `secretaire`
- Responsabilités: enseignants, programmation des cours, crédits, assignations, validations, suivi.
- Pages attendues: pilotage, gestion des enseignants, programmation des cours, validation des activités, suivi des enseignants, états de paiement, états globaux.
- Pages interdites: accès et rôles, années académiques, barèmes.

### Enseignant

- Rôle attendu: `enseignant`
- Responsabilités: consulter ses cours assignés, créer ses séquences, déposer ses ressources, déclarer ses activités, suivre son récapitulatif.
- Pages attendues: mon suivi, cours assignés, séquences, ressources produites, activités déclarées.
- Pages interdites: pilotage global, accès, barèmes, années académiques, états globaux.

## Vérification fonctionnelle par rôle

### Admin

1. Se connecter avec un compte administrateur.
2. Vérifier que les pages administratives sont visibles.
3. Créer ou modifier un utilisateur.
4. Attribuer ou retirer un rôle.
5. Modifier un barème.
6. Vérifier que le calcul prévisionnel d'une activité utilise le barème actif.
7. Consulter les états globaux.

### Secrétaire

1. Se connecter avec un compte secrétaire.
2. Vérifier que les pages administratives sensibles ne sont pas visibles.
3. Créer ou modifier un enseignant.
4. Créer ou modifier un cours.
5. Fixer les crédits du cours.
6. Assigner le cours à un enseignant.
7. Ouvrir le suivi des enseignants et filtrer la liste.
8. Approuver une activité.
9. Rejeter une activité avec un motif obligatoire.
10. Générer un état de paiement.

### Enseignant

1. Se connecter avec un compte enseignant lié à une fiche enseignant.
2. Vérifier que seuls ses espaces sont visibles.
3. Consulter ses cours assignés.
4. Créer une séquence pour un cours assigné.
5. Ajouter une ressource à une séquence.
6. Déclarer une activité pédagogique.
7. Vérifier que le niveau et le volume sont calculés automatiquement.
8. Consulter son récapitulatif.
9. Essayer d'accéder manuellement à `/dashboard`: l'application doit rediriger vers son espace autorisé.

## Scripts SQL utiles

Créer ou mettre à jour l'admin:

```text
supabase/create_admin.sql
```

Lier un utilisateur Auth à une fiche enseignant:

```text
supabase/link_enseignant_user.sql
```

Insérer les données de démonstration:

```text
supabase/seed.sql
```

## Variables Render

Les variables à renseigner dans Render sont:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_APP_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

## Erreurs connues

### `permission denied for function has_role`

Cause probable: les droits d'exécution de la fonction SQL `has_role` n'ont pas encore été poussés.

Action:

```powershell
$env:SUPABASE_DB_PASSWORD="MOT_DE_PASSE_DATABASE_SUPABASE"
supabase db push
```

### `Connect to your database by setting the env var correctly: SUPABASE_DB_PASSWORD`

Cause probable: le mot de passe database n'est pas disponible dans le terminal courant.

Action:

```powershell
$env:SUPABASE_DB_PASSWORD="MOT_DE_PASSE_DATABASE_SUPABASE"
supabase db push
```

### Timeout TLS pendant `supabase db push`

Cause probable: problème réseau temporaire entre le poste et l'API Supabase.

Action: relancer la commande après quelques minutes.

### Excel affiche un avertissement à l'ouverture

Les exports sont générés en XML Spreadsheet compatible Excel avec une extension `.xls`. Excel peut afficher un avertissement de format; accepter l'ouverture du fichier.

## Prochaine vérification conseillée

Faire un test complet sur Render avec les trois profils: administrateur, secrétaire et enseignant. Vérifier surtout les créations de séquences, ressources, activités, validations et états.
