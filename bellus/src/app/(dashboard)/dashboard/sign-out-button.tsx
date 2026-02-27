"use client";

import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button variant="outline" type="submit">
        Cerrar sesión
      </Button>
    </form>
  );
}
