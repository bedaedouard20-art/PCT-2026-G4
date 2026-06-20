// Server-only helper to enqueue the invitation email.
// Uses the Lovable Emails infrastructure if configured; otherwise throws
// so the caller can degrade gracefully.

type InviteArgs = {
  email: string;
  nom: string;
  prenom: string;
  provisionalPassword: string;
  role: "admin" | "secretaire" | "enseignant";
};

const APP_URL =
  process.env.VITE_APP_URL ||
  process.env.APP_URL ||
  "https://thesis-guide-magic.lovable.app";

const ROLE_FR: Record<string, string> = {
  admin: "Administrateur",
  secretaire: "Secrétaire",
  enseignant: "Enseignant",
};

export async function sendInvitationEmail(args: InviteArgs) {
  const { supabaseAdmin } = await import("./../integrations/supabase/client.server");

  const subject = `Votre accès à la plateforme UVCI`;
  const loginUrl = `${APP_URL}/auth`;
  const changeUrl = `${APP_URL}/change-password`;
  const fullName = `${args.prenom ?? ""} ${args.nom ?? ""}`.trim() || args.email;

  // Try to enqueue via Lovable Emails (pgmq queue + cron processor)
  const { error } = await supabaseAdmin.rpc("enqueue_email" as any, {
    p_queue: "transactional_emails",
    p_payload: {
      template_name: "invitation",
      to: args.email,
      subject,
      template_data: {
        fullName,
        email: args.email,
        provisionalPassword: args.provisionalPassword,
        role: ROLE_FR[args.role] ?? args.role,
        loginUrl,
        changeUrl,
      },
    },
  });

  if (error) {
    throw new Error(
      `Infrastructure d'envoi d'email non configurée (${error.message}). ` +
        `Configurez un domaine email pour activer l'envoi automatique.`,
    );
  }
}
