"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations("auth");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await resetPassword(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setIsLoading(false);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">{t("emailSent")}</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-stone-600">{t("emailSentDescription")}</p>
        </CardContent>
        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-stone-500 hover:text-stone-700">
            {t("backToLogin")}
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center text-xl">{t("resetPassword")}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
          <p className="text-sm text-stone-600">{t("resetDescription")}</p>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              {t("email")}
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              required
              autoComplete="email"
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("sending") : t("sendLink")}
          </Button>
          <Link href="/login" className="text-sm text-stone-500 hover:text-stone-700">
            {t("backToLogin")}
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
