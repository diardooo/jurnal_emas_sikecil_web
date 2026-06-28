import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { SiteFooter } from "@/components/marketing/site-footer";

/** Shared layout for static legal pages (privacy, terms). */
export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-muted transition-colors hover:text-navy"
          >
            <ArrowLeft className="h-4 w-4" /> Beranda
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="container max-w-3xl py-14">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-navy-muted">Terakhir diperbarui: {updated}</p>
          <div className="legal-body mt-8 space-y-6 text-sm leading-relaxed text-navy-muted">
            {children}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/** A titled section block for legal copy. */
export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
