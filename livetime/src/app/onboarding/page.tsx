import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile-form";
import { Logo } from "@/components/ui";
import { getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Role } from "@/lib/types";

export const metadata: Metadata = { title: "יצירת פרופיל" };

export default async function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  const viewer = await getViewer();
  // In demo mode the form is shown as-is so it can be previewed.
  if (isSupabaseConfigured) {
    if (!viewer) redirect("/login?next=/onboarding");
    if (viewer.profile) redirect("/feed");
  }
  const { role } = await searchParams;
  const initialRole = ["artist", "venue", "fan"].includes(role as string) ? (role as Role) : undefined;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-32 pt-8">
      <Link href="/">
        <Logo />
      </Link>
      <h1 className="display mt-10 text-6xl">בונים לכם במה</h1>
      <p className="mb-8 mt-2 text-lg text-fog">כמה פרטים, ואתם ברשת. תמיד אפשר לערוך אחר כך.</p>
      <ProfileForm initialRole={initialRole} />
    </div>
  );
}
