import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { ProfileForm } from "@/components/profile-form";
import { Button } from "@/components/ui";
import { getViewer } from "@/lib/data";

export const metadata: Metadata = { title: "עריכת פרופיל" };

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer?.profile) redirect("/login");
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="display text-5xl">עריכת פרופיל</h1>
        <form action="/auth/signout" method="post">
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="size-4" /> יציאה
          </Button>
        </form>
      </div>
      <ProfileForm profile={viewer.profile} />
    </div>
  );
}
