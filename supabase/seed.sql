BEGIN;

-- Donnees de demonstration pour initialiser une nouvelle base.
-- Ce fichier est idempotent: les UUID fixes evitent les doublons.

INSERT INTO public.enseignants (
  id, nom, prenom, email, telephone, grade, statut, departement_id,
  taux_horaire, charge_statutaire
) VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'ATSEBY', 'BEDA EDOUARD', 'beda.atseby@uvci.edu.ci', '+2250788125701',
    'maitre_assistant', 'permanent',
    (SELECT id FROM public.departements WHERE code = 'INFO' LIMIT 1),
    15000, 192
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'TRAORE', 'DJENINBA', 'djeninba.traore@uvci.edu.ci', '+2250166125174',
    'professeur', 'permanent',
    (SELECT id FROM public.departements WHERE code = 'MATH' LIMIT 1),
    20000, 192
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'YAO JEAN', 'PAUL', 'yao21.konan@uvci.edu.ci', '+2250708937759',
    'assistant', 'vacataire',
    (SELECT id FROM public.departements WHERE code = 'SG' LIMIT 1),
    12000, 96
  ),
    (
    '44444444-4444-4444-4444-444444444444',
    'MIANGUI', 'GERARD', 'miangui.deungo@uvci.edu.ci', '+2250700802618',
    'assistant', 'vacataire',
    (SELECT id FROM public.departements WHERE code = 'SG' LIMIT 1),
    12000, 96
  )
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  prenom = EXCLUDED.prenom,
  email = EXCLUDED.email,
  telephone = EXCLUDED.telephone,
  grade = EXCLUDED.grade,
  statut = EXCLUDED.statut,
  departement_id = EXCLUDED.departement_id,
  taux_horaire = EXCLUDED.taux_horaire,
  charge_statutaire = EXCLUDED.charge_statutaire;

INSERT INTO public.cours (
  id, intitule, filiere, niveau, semestre, nombre_heures, credits, enseignant_id
) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'Introduction aux bases de donnees', 'Informatique', 'L2', 3, 40, 4,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'Algorithmique avancee', 'Informatique', 'L3', 5, 45, 5,
    '11111111-1111-1111-1111-111111111111'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'Statistiques appliquees', 'Sciences de Gestion', 'L2', 4, 36, 4,
    '22222222-2222-2222-2222-222222222222'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'Management des organisations', 'Sciences de Gestion', 'L1', 2, 30, 3,
    '33333333-3333-3333-3333-333333333333'
  )
ON CONFLICT (id) DO UPDATE SET
  intitule = EXCLUDED.intitule,
  filiere = EXCLUDED.filiere,
  niveau = EXCLUDED.niveau,
  semestre = EXCLUDED.semestre,
  nombre_heures = EXCLUDED.nombre_heures,
  credits = EXCLUDED.credits,
  enseignant_id = EXCLUDED.enseignant_id;

INSERT INTO public.sequences_pedagogiques (
  id, cours_id, numero_sequence, titre, description, nombre_heures
) VALUES
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    1, 'Modelisation relationnelle',
    'Concepts de tables, cles primaires, cles etrangeres et cardinalites.',
    10
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    2, 'Langage SQL',
    'Requetes de selection, jointures, agregations et modifications.',
    12
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    1, 'Structures de donnees',
    'Listes, piles, files, arbres et graphes.',
    15
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    1, 'Statistiques descriptives',
    'Indicateurs de position, dispersion et representation des donnees.',
    12
  )
ON CONFLICT (id) DO UPDATE SET
  cours_id = EXCLUDED.cours_id,
  numero_sequence = EXCLUDED.numero_sequence,
  titre = EXCLUDED.titre,
  description = EXCLUDED.description,
  nombre_heures = EXCLUDED.nombre_heures;

INSERT INTO public.ressources_pedagogiques (
  id, sequence_id, type_ressource, titre, description, url_ou_contenu, ordre_affichage
) VALUES
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc1',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
    'document', 'Support de cours - modele relationnel',
    'Document de synthese pour la sequence.',
    'https://example.com/support-modele-relationnel.pdf',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc2',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
    'quiz', 'Quiz SQL niveau debutant',
    'Evaluation rapide sur SELECT, WHERE et JOIN.',
    'Quiz integre a la plateforme',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc3',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3',
    'video', 'Introduction aux graphes',
    'Capsule video de presentation des graphes.',
    'https://example.com/video-graphes',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-ccccccccccc4',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4',
    'activite_interactive', 'Exercice sur les indicateurs',
    'Activite guidee pour calculer moyenne, mediane et ecart-type.',
    'Activite interactive integree',
    1
  )
ON CONFLICT (id) DO UPDATE SET
  sequence_id = EXCLUDED.sequence_id,
  type_ressource = EXCLUDED.type_ressource,
  titre = EXCLUDED.titre,
  description = EXCLUDED.description,
  url_ou_contenu = EXCLUDED.url_ou_contenu,
  ordre_affichage = EXCLUDED.ordre_affichage;

INSERT INTO public.activites_pedagogiques (
  id, enseignant_id, cours_id, type_activite, niveau_ressource,
  nombre_heures_ressource, description, date_activite, valide,
  annee_academique_id, statut_validation
) VALUES
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd1',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    'creation', 'niveau_2', 12,
    'Creation du module SQL avec exercices corriges.',
    '2026-01-15', true,
    (SELECT id FROM public.annees_academiques WHERE est_active = true LIMIT 1),
    'approuve'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd2',
    '11111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
    'mise_a_jour', 'niveau_1', 8,
    'Mise a jour des supports sur les structures de donnees.',
    '2026-02-03', true,
    (SELECT id FROM public.annees_academiques WHERE est_active = true LIMIT 1),
    'approuve'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd3',
    '22222222-2222-2222-2222-222222222222',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
    'creation', 'niveau_3', 10,
    'Creation de ressources d evaluation en statistiques.',
    '2026-02-20', false,
    (SELECT id FROM public.annees_academiques WHERE est_active = true LIMIT 1),
    'en_attente'
  ),
  (
    'dddddddd-dddd-dddd-dddd-ddddddddddd4',
    '33333333-3333-3333-3333-333333333333',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4',
    'creation', 'niveau_1', 6,
    'Creation de fiches pratiques pour le management.',
    '2026-03-05', false,
    (SELECT id FROM public.annees_academiques WHERE est_active = true LIMIT 1),
    'en_attente'
  )
ON CONFLICT (id) DO UPDATE SET
  enseignant_id = EXCLUDED.enseignant_id,
  cours_id = EXCLUDED.cours_id,
  type_activite = EXCLUDED.type_activite,
  niveau_ressource = EXCLUDED.niveau_ressource,
  nombre_heures_ressource = EXCLUDED.nombre_heures_ressource,
  description = EXCLUDED.description,
  date_activite = EXCLUDED.date_activite,
  valide = EXCLUDED.valide,
  annee_academique_id = EXCLUDED.annee_academique_id,
  statut_validation = EXCLUDED.statut_validation;

COMMIT;
