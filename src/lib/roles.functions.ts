import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AppRole = "admin" | "secretaire" | "enseignant";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accès refusé : réservé aux administrateurs.");
}

export const listUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    if (usersErr) throw new Error(usersErr.message);

    const { data: rolesRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, nom, prenom, email");

    const profMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const rolesByUser = new Map<string, AppRole[]>();
    for (const r of rolesRows ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role as AppRole);
      rolesByUser.set(r.user_id, arr);
    }

    return {
      users: usersData.users.map((u) => {
        const p: any = profMap.get(u.id);
        return {
          id: u.id,
          email: u.email ?? p?.email ?? "",
          nom: p?.nom ?? "",
          prenom: p?.prenom ?? "",
          created_at: u.created_at,
          roles: rolesByUser.get(u.id) ?? [],
        };
      }),
    };
  });

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) => d)
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    if (data.userId === context.userId && data.role === "admin") {
      throw new Error("Vous ne pouvez pas retirer votre propre rôle administrateur.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createUserWithRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    email: string;
    password: string;
    nom: string;
    prenom: string;
    role: AppRole;
  }) => {
    if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) throw new Error("Email invalide");
    if (!d.password || d.password.length < 8) throw new Error("Mot de passe : 8 caractères min.");
    if (!d.nom?.trim()) throw new Error("Nom requis");
    if (!["admin", "secretaire", "enseignant"].includes(d.role)) throw new Error("Rôle invalide");
    return d;
  })
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        nom: data.nom,
        prenom: data.prenom,
        must_change_password: true,
      },
    });
    if (createErr) throw new Error(createErr.message);

    const newUserId = created.user!.id;

    let teacherLinked = false;

    if (data.role === "enseignant") {
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: "enseignant" });
      if (roleErr && !roleErr.message.includes("duplicate")) throw new Error(roleErr.message);

      const { data: linkedTeacher, error: teacherErr } = await supabaseAdmin
        .from("enseignants")
        .update({ user_id: newUserId })
        .ilike("email", data.email)
        .select("id")
        .maybeSingle();
      if (teacherErr) throw new Error(teacherErr.message);
      teacherLinked = Boolean(linkedTeacher);
    } else {
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId).eq("role", "enseignant");
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: data.role });
      if (roleErr && !roleErr.message.includes("duplicate")) throw new Error(roleErr.message);
    }

    // Send invitation email (best-effort; do not fail user creation if email is not yet configured)
    let emailSent = false;
    let emailError: string | null = null;
    try {
      const { sendInvitationEmail } = await import("./email-invitation.server");
      await sendInvitationEmail({
        email: data.email,
        nom: data.nom,
        prenom: data.prenom,
        provisionalPassword: data.password,
        role: data.role,
      });
      emailSent = true;
    } catch (e: any) {
      emailError = e?.message ?? "Envoi email indisponible";
      console.warn("[createUserWithRole] invitation email skipped:", emailError);
    }

    return { ok: true, userId: newUserId, emailSent, emailError, teacherLinked };
  });
