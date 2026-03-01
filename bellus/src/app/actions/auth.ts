"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const nome = formData.get("nome") as string;
  const salonName = formData.get("salonName") as string;

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!authData.user) {
    return { error: "Error al crear la cuenta. Intenta de nuevo." };
  }

  // Usar service client (bypassa RLS) para criar salao + usuario
  const serviceClient = createServiceClient();

  // Criar salao
  const slug = (salonName || nome)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const { data: salon, error: salonError } = await serviceClient
    .from("saloes")
    .insert({
      nome: salonName || `Salón de ${nome}`,
      slug: `${slug}-${Date.now().toString(36)}`,
    })
    .select("id")
    .single();

  if (salonError) {
    return { error: "Error al crear el salón. Intenta de nuevo." };
  }

  // Criar usuario (bridge auth.users <-> salao)
  const { error: userError } = await serviceClient.from("usuarios").insert({
    id: authData.user.id,
    salao_id: salon.id,
    role: "proprietario",
    nome,
    email,
  });

  if (userError) {
    return { error: "Error al configurar el usuario. Intenta de nuevo." };
  }

  // Criar profissional (para aparecer na sidebar e agenda)
  await serviceClient.from("profissionais").insert({
    user_id: authData.user.id,
    salao_id: salon.id,
    nome,
    email,
    role: "proprietario",
  });

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Credenciales incorrectas. Intenta de nuevo." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resetPassword(formData: FormData) {
  const email = formData.get("email") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  if (error) {
    return { error: "Error al enviar el correo. Intenta de nuevo." };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Error al actualizar la contraseña. Intenta de nuevo." };
  }

  redirect("/dashboard");
}
