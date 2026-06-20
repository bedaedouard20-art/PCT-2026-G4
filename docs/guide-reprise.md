# Guide de reprise du projet

Ce document resume l'etat actuel du projet et les actions a verifier avant livraison.

## Etat actuel

- Le projet est connecte au nouveau projet Supabase.
- Les migrations locales sont synchronisees avec la base distante.
- Les donnees de depart ont ete inserees avec `supabase/seed.sql`.
- Un compte administrateur a ete ajoute avec `supabase/create_admin.sql`.
- Le compte enseignant `beda.atseby@uvci.edu.ci` a ete lie a sa fiche enseignant avec `supabase/link_enseignant_user.sql`.
- Les roles gerent maintenant l'affichage du menu et les protections de routes.
- Les exports Excel et l'impression PDF via le navigateur sont disponibles sur les pages d'etats.

## Commandes utiles

Depuis la racine du projet:

```powershell
cd C:\Users\HP\Downloads\thesis-guide-magic-main\thesis-guide-magic-main
npm run dev -- --host 127.0.0.1 --port 8081
```

URL locale:

```text
http://127.0.0.1:8081
```

Build de verification:

```powershell
npm run build
```

Pousser les migrations Supabase:

```powershell
$env:SUPABASE_DB_PASSWORD="MOT_DE_PASSE_DATABASE_SUPABASE"
supabase db push
```

Verifier l'etat des migrations:

```powershell
supabase migration list
```

## Comptes a verifier

### Administrateur

- Email utilise: `atsebyedouard@gmail.com`
- Role attendu: `admin`
- Pages attendues: toutes les pages, dont utilisateurs, annees academiques et baremes.

### Enseignant

- Email utilise: `beda.atseby@uvci.edu.ci`
- Role attendu: `enseignant`
- Pages attendues: recapitulatif, cours, activites pedagogiques.
- Pages interdites: dashboard global, enseignants, sequences, ressources, etats, baremes, annees academiques, utilisateurs.

### Secretaire

Si besoin, creer un compte Supabase Auth puis ajouter le role `secretaire` dans `public.user_roles`.

Pages attendues:

- Dashboard
- Fiches enseignants
- Enseignants
- Cours
- Sequences pedagogiques
- Ressources pedagogiques
- Activites pedagogiques
- Etats de paiement
- Etats globaux
- Recapitulatif

Pages interdites:

- Utilisateurs
- Annees academiques
- Baremes

## Verification fonctionnelle par role

### Admin

1. Se connecter avec le compte administrateur.
2. Verifier que toutes les entrees du menu sont visibles.
3. Modifier un bareme dans `Baremes`.
4. Verifier que le calcul previsionnel d'une activite utilise le bareme actif.
5. Exporter un etat de paiement en Excel.
6. Lancer `Imprimer / PDF` depuis un etat.

### Enseignant

1. Se connecter avec `beda.atseby@uvci.edu.ci`.
2. Verifier que le menu ne montre que recapitulatif, cours et activites.
3. Verifier que le recapitulatif affiche uniquement ses donnees.
4. Verifier que ses cours et ses activites sont visibles.
5. Essayer d'acceder manuellement a `/dashboard`: l'application doit rediriger vers `/recapitulatif`.

### Secretaire

1. Se connecter avec un compte ayant le role `secretaire`.
2. Verifier que les pages administratives sensibles ne sont pas visibles.
3. Creer ou modifier un enseignant.
4. Creer ou modifier un cours, une sequence et une ressource.
5. Approuver une activite.
6. Rejeter une activite avec un motif obligatoire.

## Scripts SQL utiles

Creer ou mettre a jour l'admin:

```text
supabase/create_admin.sql
```

Lier un utilisateur Auth a une fiche enseignant:

```text
supabase/link_enseignant_user.sql
```

Inserer les donnees de demonstration:

```text
supabase/seed.sql
```

## Erreurs connues

### `permission denied for function has_role`

Cause probable: les droits d'execution de la fonction SQL `has_role` n'ont pas encore ete pousses.

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

Cause probable: probleme reseau temporaire entre le poste et l'API Supabase.

Action: relancer la commande apres quelques minutes.

### Excel affiche un avertissement a l'ouverture

Les exports sont generes en XML Spreadsheet compatible Excel avec une extension `.xls`. Excel peut afficher un avertissement de format; accepter l'ouverture du fichier.

## Prochaine etape conseillee

Faire une passe de nettoyage final sur les textes visibles dans l'application, notamment les accents et libelles, puis refaire un test complet avec les trois roles.
