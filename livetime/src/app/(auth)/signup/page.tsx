import type { Metadata } from "next";
import type { Role } from "@/lib/types";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "הצטרפות" };

const ROLES: Role[] = ["artist", "venue", "fan"];

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { role } = await searchParams;
  return <AuthForm mode="signup" role={ROLES.includes(role as Role) ? (role as Role) : undefined} />;
}
