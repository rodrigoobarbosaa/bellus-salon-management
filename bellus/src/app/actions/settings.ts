"use server";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SalonRow = Database["public"]["Tables"]["saloes"]["Row"];

export async function getSalonSettings() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) return { error: "Usuario no encontrado" };

  const { salao_id: salaoId } = usuario;

  const { data: salon, error } = await supabase
    .from("saloes")
    .select("*")
    .eq("id", salaoId)
    .single();

  if (error) return { error: error.message };
  return { data: salon as SalonRow };
}

export async function updateSalonSettings(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) return { error: "Usuario no encontrado" };

  const { salao_id: salaoId } = usuario;

  const nome = formData.get("nome") as string;
  const whatsapp = formData.get("whatsapp") as string;

  if (!nome || !whatsapp) {
    return { error: "Nombre y WhatsApp son obligatorios" };
  }

  const { error } = await supabase
    .from("saloes")
    .update({
      nome,
      whatsapp,
      endereco: formData.get("endereco") as string,
      telefone: formData.get("telefone") as string,
      cor_primaria: formData.get("cor_primaria") as string,
      instagram_url: formData.get("instagram_url") as string,
      google_maps_url: formData.get("google_maps_url") as string,
      moeda: formData.get("moeda") as string,
      timezone: formData.get("timezone") as string,
    })
    .eq("id", salaoId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function uploadSalonLogo(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "No autenticado" };

  const file = formData.get("logo") as File;
  if (!file) return { error: "No se proporcionó archivo" };

  if (file.size > 2 * 1024 * 1024) {
    return { error: "Archivo demasiado grande (máx 2MB)" };
  }

  if (!["image/jpeg", "image/png"].includes(file.type)) {
    return { error: "Solo se permiten JPG y PNG" };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("salao_id")
    .eq("id", user.id)
    .single();

  if (!usuario) return { error: "Usuario no encontrado" };

  const { salao_id: salaoId } = usuario;
  const ext = file.name.split(".").pop();
  const filePath = `logos/${salaoId}/logo.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("salon-assets")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("salon-assets").getPublicUrl(filePath);

  const { error: updateError } = await supabase
    .from("saloes")
    .update({ logo_url: publicUrl })
    .eq("id", salaoId);

  if (updateError) return { error: updateError.message };
  return { data: { url: publicUrl } };
}
