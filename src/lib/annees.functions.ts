import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAnneeAcademique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      const supabase = context.supabase;

      const { data, error } = await supabase
        .from("annees_academiques")
        .select("*")
        .order("annee_debut", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching annees academiques:", error);
      return [];
    }
  });

export const createAnneeAcademique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    try {
      const supabase = context.supabase;

      // Verify user is admin
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .single();

      if (userRoles?.role !== "admin") {
        throw new Error("Unauthorized: only admins can create academic years");
      }

      const { error } = await supabase
        .from("annees_academiques")
        .insert({
          annee_debut: data.annee_debut,
          annee_fin: data.annee_fin,
          libelle: data.libelle,
          est_active: data.est_active || false,
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error creating annee academique:", error);
      throw error;
    }
  });

export const updateAnneeAcademique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    try {
      const supabase = context.supabase;

      // Verify user is admin
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .single();

      if (userRoles?.role !== "admin") {
        throw new Error("Unauthorized: only admins can update academic years");
      }

      // If setting to active, deactivate others
      if (data.est_active) {
        await supabase
          .from("annees_academiques")
          .update({ est_active: false })
          .neq("id", data.id);
      }

      const { error } = await supabase
        .from("annees_academiques")
        .update({
          est_active: data.est_active,
          annee_debut: data.annee_debut,
          annee_fin: data.annee_fin,
          libelle: data.libelle,
        })
        .eq("id", data.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error updating annee academique:", error);
      throw error;
    }
  });

export const deleteAnneeAcademique = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: any) => d)
  .handler(async ({ context, data }) => {
    try {
      const supabase = context.supabase;

      // Verify user is admin
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .single();

      if (userRoles?.role !== "admin") {
        throw new Error("Unauthorized: only admins can delete academic years");
      }

      const { error } = await supabase
        .from("annees_academiques")
        .delete()
        .eq("id", data.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting annee academique:", error);
      throw error;
    }
  });
