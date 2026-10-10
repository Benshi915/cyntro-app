"use client";
import Link from "next/link";
import { useActionState } from "react";
import { MailCheck } from "lucide-react";
import { Button, Card, Field, FormError, Input } from "@/components/ui";
import { ROLE_LABEL } from "@/lib/constants";
import type { Role } from "@/lib/types";
import { signIn, signUp } from "./actions";

export function AuthForm({ mode, role, next }: { mode: "login" | "signup"; role?: Role; next?: string }) {
  const [state, action, pending] = useActionState(mode === "login" ? signIn : signUp, undefined);

  if (state?.sent) {
    return (
      <Card className="flex flex-col items-center gap-3 p-8 text-center">
        <MailCheck className="size-10 text-spot" />
        <h1 className="display text-4xl">בדקו את המייל</h1>
        <p className="text-fog">
          שלחנו קישור אישור ל־<span className="text-cream" dir="ltr">{state.email}</span>. לחיצה עליו תחזיר אתכם לכאן להשלמת הפרופיל.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h1 className="display text-5xl">{mode === "login" ? "ברוכים השבים" : "עולים לבמה"}</h1>
      <p className="mt-2 text-fog">
        {mode === "login"
          ? "התחברו כדי להמשיך מאיפה שעצרתם."
          : role
            ? `נרשמים בתור ${ROLE_LABEL[role]}. עוד דקה וזה מוכן.`
            : "חשבון אחד — ואז בוחרים: אמן, מקום או קהל."}
      </p>
      <form action={action} className="mt-6 flex flex-col gap-4">
        {role && <input type="hidden" name="role" value={role} />}
        {next && <input type="hidden" name="next" value={next} />}
        <Field label="מייל">
          <Input name="email" type="email" autoComplete="email" dir="ltr" required placeholder="you@example.com" />
        </Field>
        <Field label="סיסמה">
          <Input
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            dir="ltr"
            required
            minLength={8}
          />
        </Field>
        <FormError message={state?.error} />
        <Button type="submit" size="lg" disabled={pending} className="mt-2">
          {pending ? "רגע..." : mode === "login" ? "כניסה" : "יצירת חשבון"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-fog">
        {mode === "login" ? (
          <>
            עדיין אין חשבון?{" "}
            <Link href="/signup" className="text-spot hover:underline">
              הצטרפות
            </Link>
          </>
        ) : (
          <>
            כבר רשומים?{" "}
            <Link href="/login" className="text-spot hover:underline">
              כניסה
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
