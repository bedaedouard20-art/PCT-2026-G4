# PCT 2026 - Groupe 4

Application de gestion des enseignants, cours, activites pedagogiques, volumes horaires, baremes et etats de paiement pour le projet PCT BD DAS 2026.

## Prerequis

- Node.js installe sur le poste
- npm installe avec Node.js
- Un acces au projet Supabase utilise par le groupe

## Installation apres telechargement

Cloner le depot :

```powershell
git clone https://github.com/bedaedouard20-art/PCT-2026-G4.git
cd PCT-2026-G4
```

Installer les dependances :

```powershell
npm install
```

Creer le fichier d'environnement local :

```powershell
copy .env.example .env
```

Remplir ensuite le fichier `.env` avec les vraies valeurs Supabase du projet.

## Configuration Supabase

Le fichier `.env` n'est pas envoye sur GitHub volontairement, car il contient des cles sensibles. Chaque membre du groupe doit creer son propre `.env` a partir de `.env.example`.

Variables minimales pour tester l'application dans le navigateur :

```env
VITE_SUPABASE_URL=https://PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Variables utiles pour les fonctions serveur, scripts admin ou migrations :

```env
SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_database_password
```

La cle `SUPABASE_SERVICE_ROLE_KEY` doit rester privee et ne doit jamais etre exposee dans le code client ou publiee sur GitHub.

## Lancement en local

```powershell
npm run dev
```

L'application demarre ensuite sur l'adresse locale affichee dans le terminal, generalement :

```text
http://localhost:5173
```

## Commandes utiles

Construire le projet :

```powershell
npm run build
```

Lancer les tests :

```powershell
npm run test
```

Verifier le code :

```powershell
npm run lint
```
