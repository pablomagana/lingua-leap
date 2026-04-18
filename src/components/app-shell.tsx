import { Link, useRouterState } from "@tanstack/react-router";
import { Home, BookOpen, GraduationCap, Sparkles, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/app", label: "Inicio", icon: Home },
  { to: "/app/vocabulary", label: "Vocabulario", icon: BookOpen },
  { to: "/app/grammar", label: "Gramática", icon: GraduationCap },
  { to: "/app/ai", label: "IA", icon: Sparkles },
  { to: "/app/progress", label: "Progreso", icon: BarChart3 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/app" className="flex items-center gap-2 font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
              EN
            </span>
            <span className="text-lg tracking-tight">Lingua</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.to || (l.to !== "/app" && pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <Button variant="ghost" size="icon" onClick={() => signOut()} title="Cerrar sesión">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-5">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.to || (l.to !== "/app" && pathname.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {l.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
