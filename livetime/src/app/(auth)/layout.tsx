import Link from "next/link";
import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-[560px] bg-[radial-gradient(ellipse_40%_60%_at_70%_0%,rgb(255_178_62/0.16),transparent_70%)]"
      />
      <Link href="/" className="relative mb-8">
        <Logo className="scale-125" />
      </Link>
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
