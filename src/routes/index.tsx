import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  ClipboardCheck,
  FileSpreadsheet,
  GraduationCap,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import heroImg from "@/assets/image-hero.jpeg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UVCI - Gestion des heures d'enseignement" },
      {
        name: "description",
        content:
          "Plateforme institutionnelle de suivi des enseignants, productions pédagogiques, validations, volumes horaires et états administratifs.",
      },
      { property: "og:title", content: "UVCI - Gestion des heures d'enseignement" },
      {
        property: "og:description",
        content:
          "Cours proposés par l'administration, ressources produites par les enseignants, validation du secrétariat et calcul automatique des volumes.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: Users,
    title: "Enseignants",
    desc: "Fiches administratives, départements, statuts, grades, taux horaires et charges statutaires.",
  },
  {
    icon: BookOpen,
    title: "Cours proposés",
    desc: "Programmation des cours, crédits, assignations aux enseignants et suivi des niveaux.",
  },
  {
    icon: ClipboardCheck,
    title: "Validation secrétariat",
    desc: "Contrôle des activités en attente, approbation, rejet motivé et suivi effectif du calendrier.",
  },
  {
    icon: Calculator,
    title: "Calcul automatique",
    desc: "Déduction du niveau selon l'action réalisée et application automatique des barèmes.",
  },
  {
    icon: BarChart3,
    title: "Pilotage",
    desc: "Tableaux de bord par enseignant, département, cours, action pédagogique et période.",
  },
  {
    icon: FileSpreadsheet,
    title: "États",
    desc: "Récapitulatifs, états globaux, états de paiement, exports Excel et impression PDF.",
  },
];

const ROLES = [
  {
    title: "Administrateur",
    desc: "Gère les accès, les comptes, les rôles, les années académiques, les barèmes et les paramètres.",
  },
  {
    title: "Secrétaire",
    desc: "Enregistre les enseignants, fixe les crédits, assigne les cours, valide les activités et suit le calendrier.",
  },
  {
    title: "Enseignant",
    desc: "Gère les séquences, dépose les ressources, déclare ses activités et consulte son récapitulatif.",
  },
];

function FeatureItem({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-accent text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/15 bg-sidebar/85 text-sidebar-foreground backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white p-1.5">
              <img src={logo} alt="UVCI" className="h-full w-full object-contain" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-lg font-bold">UVCI</span>
              <span className="block text-[10px] uppercase tracking-widest text-sidebar-foreground/70">
                Gestion pédagogique
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm md:flex">
            <a href="#fonctionnalites" className="text-sidebar-foreground/75 hover:text-white">
              Fonctionnalités
            </a>
            <a href="#roles" className="text-sidebar-foreground/75 hover:text-white">
              Rôles
            </a>
            <a href="#baremes" className="text-sidebar-foreground/75 hover:text-white">
              Barèmes
            </a>
          </nav>

          <Link to="/auth">
            <Button variant="secondary" className="gap-2">
              Connexion
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden text-white">
          <img
            src={heroImg}
            alt="Étudiants et enseignants de l'UVCI utilisant une plateforme numérique"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-sidebar/80" aria-hidden />
          <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-4 pb-10 pt-24 sm:px-6 md:min-h-[660px] lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/85">
                <GraduationCap className="h-4 w-4" />
                Université Virtuelle de Côte d'Ivoire
              </div>
              <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Gestion des heures d'enseignement
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 md:text-lg">
                Une plateforme institutionnelle pour suivre les enseignants, valider les activités
                pédagogiques, calculer les volumes horaires et produire les états de paiement.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/auth" className="sm:w-auto">
                  <Button size="lg" className="h-12 w-full gap-2 px-6 text-base sm:w-auto">
                    Accéder à la plateforme
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#fonctionnalites" className="sm:w-auto">
                  <Button size="lg" variant="secondary" className="h-12 w-full px-6 text-base sm:w-auto">
                    Voir les modules
                  </Button>
                </a>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              <div className="border-l-2 border-gold bg-sidebar/75 px-4 py-3 backdrop-blur">
                <div className="text-xl font-bold">3</div>
                <div className="text-xs uppercase tracking-widest text-white/65">Profils utilisateurs</div>
              </div>
              <div className="border-l-2 border-gold bg-sidebar/75 px-4 py-3 backdrop-blur">
                <div className="text-xl font-bold">Auto</div>
                <div className="text-xs uppercase tracking-widest text-white/65">Calcul des volumes</div>
              </div>
              <div className="border-l-2 border-gold bg-sidebar/75 px-4 py-3 backdrop-blur">
                <div className="text-xl font-bold">Excel / PDF</div>
                <div className="text-xs uppercase tracking-widest text-white/65">États exportables</div>
              </div>
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Modules</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
                Un suivi complet de l'activité pédagogique
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                L'application couvre la chaîne complète: paramétrage, saisie, validation,
                calcul, consultation et production des documents administratifs.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <FeatureItem key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="border-y bg-secondary/55 px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Accès</p>
                <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
                  Chaque rôle voit uniquement ce qui le concerne
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  Les menus, les routes et les politiques Supabase séparent les responsabilités
                  entre administration, gestion courante et consultation enseignant.
                </p>
              </div>

              <div className="grid gap-4">
                {ROLES.map((role, index) => (
                  <div key={role.title} className="grid gap-4 rounded-lg border bg-card p-5 shadow-[var(--shadow-card)] sm:grid-cols-[56px_1fr]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-sidebar text-sidebar-foreground">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{role.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{role.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="baremes" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Barèmes</p>
              <h2 className="mt-3 font-display text-3xl font-bold md:text-5xl">
                Des coefficients configurables pour les activités
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Les volumes sont calculés à partir du nombre d'heures, du type d'activité
                et du niveau de ressource. Les activités approuvées alimentent les états.
              </p>
            </div>

            <div className="mt-10 overflow-hidden rounded-lg border bg-card shadow-[var(--shadow-card)]">
              <div className="grid border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:grid-cols-4">
                <div>Type</div>
                <div>Niveau 1</div>
                <div>Niveau 2</div>
                <div>Niveau 3</div>
              </div>
              <div className="grid gap-px bg-border text-sm sm:grid-cols-4">
                <div className="bg-card p-5 font-semibold">Création de ressources</div>
                <div className="bg-card p-5">Contenus simples + quiz</div>
                <div className="bg-card p-5">Activités interactives</div>
                <div className="bg-card p-5">Serious games, simulations</div>
                <div className="bg-card p-5 font-semibold">Mise à jour</div>
                <div className="bg-card p-5">Coefficient réduit</div>
                <div className="bg-card p-5">Ressources enrichies</div>
                <div className="bg-card p-5">Ressources avancées</div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-sidebar px-4 py-16 text-sidebar-foreground sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Prêt à gérer les heures d'enseignement ?
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-sidebar-foreground/75">
                Connectez-vous pour accéder au tableau de bord, aux enseignants, aux activités
                et aux états de paiement.
              </p>
            </div>
            <Link to="/auth">
              <Button size="lg" variant="secondary" className="gap-2">
                Se connecter
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Université Virtuelle de Côte d'Ivoire</p>
          <p>Plateforme de gestion pédagogique et administrative</p>
        </div>
      </footer>
    </div>
  );
}
