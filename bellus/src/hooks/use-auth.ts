"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { Profile } from "@/stores/auth-store";

export function useAuth() {
  const { user, profile, role, isLoading, setUser, setProfile, clearUser } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadSession() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (currentUser) {
        setUser(currentUser);

        const { data: profileData } = await supabase
          .from("profissionais")
          .select("*")
          .eq("user_id", currentUser.id)
          .single();

        if (profileData) {
          setProfile(profileData as unknown as Profile);
        }
      } else {
        clearUser();
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        clearUser();
        return;
      }

      setUser(session.user);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const { data: profileData } = await supabase
          .from("profissionais")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (profileData) {
          setProfile(profileData as unknown as Profile);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, clearUser]);

  return { user, profile, role, isLoading };
}
