# Checklist de recette

Cette checklist sert à vérifier rapidement que l'application fonctionne correctement après un déploiement.

## Préparation

- Vérifier que le dernier commit est déployé sur Render.
- Vérifier que les variables d'environnement Render sont renseignées.
- Vérifier dans Supabase que l'URL Render est configurée dans les URL autorisées d'authentification.
- Vérifier que les migrations Supabase sont à jour avec `supabase migration list`.
- Vérifier que les comptes de test existent dans Supabase Auth et que leurs rôles sont bien attribués.

## Test administrateur

- Se connecter avec un compte `admin`.
- Vérifier que le menu affiche les pages d'administration.
- Créer un utilisateur.
- Attribuer un rôle à un utilisateur.
- Vérifier que la page publique de connexion ne propose pas d'inscription libre.
- Modifier un barème.
- Vérifier que les années académiques sont visibles.
- Consulter les états globaux.
- Vérifier que l'onglet inutile aux administrateurs n'apparaît pas.

## Test secrétaire

- Se connecter avec un compte `secretaire`.
- Créer ou modifier une fiche enseignant.
- Créer ou modifier un cours.
- Fixer les crédits du cours.
- Assigner le cours à un enseignant.
- Ouvrir le suivi des enseignants.
- Rechercher un enseignant dans le suivi.
- Vérifier que les séquences et ressources sont consultables sans bouton de création côté secrétariat.
- Vérifier que le secrétariat peut valider ou rejeter les activités sans pouvoir en déclarer à la place de l'enseignant.
- Valider une activité en attente.
- Rejeter une activité avec un motif.
- Générer un état de paiement.
- Vérifier que les pages `Accès & rôles`, `Barèmes` et `Années académiques` ne sont pas accessibles.

## Test enseignant

- Se connecter avec un compte `enseignant`.
- Vérifier que seuls les espaces enseignant sont visibles.
- Consulter les cours assignés.
- Créer une séquence sur un cours assigné.
- Ajouter une ressource pédagogique à une séquence.
- Déclarer une activité pédagogique.
- Vérifier que le niveau est déduit automatiquement selon l'action.
- Vérifier que le volume horaire est calculé automatiquement.
- Consulter le récapitulatif personnel.
- Vérifier qu'un accès direct à `/dashboard` redirige vers l'espace autorisé.

## Test exports

- Télécharger un état de paiement.
- Télécharger un état global.
- Utiliser le bouton d'impression.
- Vérifier que les fichiers générés sont lisibles.

## Points de démonstration

- L'administration contrôle les accès et les paramètres.
- Le secrétariat programme les cours, assigne les enseignants et valide les activités.
- L'enseignant produit les séquences, les ressources et les déclarations.
- Les volumes horaires sont calculés automatiquement.
- Les états sont exportables.
