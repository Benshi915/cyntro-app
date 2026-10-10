import { ButtonLink, Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="display text-[8rem] leading-none text-spot">404</h1>
      <p className="text-lg text-fog">הבמה הזו ריקה. אולי ההופעה עברה למקום אחר?</p>
      <ButtonLink href="/feed">חזרה להופעות</ButtonLink>
    </div>
  );
}
