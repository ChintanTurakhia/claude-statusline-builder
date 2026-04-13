import { ClientOnly } from "@/components/client-only";
import { StatuslineBuilder } from "@/components/statusline-builder";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="4 17 10 11 4 5" />
                <line x1="12" y1="19" x2="20" y2="19" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground tracking-tight">
              Statusline Builder
            </span>
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
              Claude Code
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://code.claude.com/docs/en/statusline"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </a>
            <ClientOnly>
              <ThemeToggle />
            </ClientOnly>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent" />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16 md:py-20 text-center">
          <h1 className="animate-fade-up font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground mb-4 italic">
            Statusline Builder
          </h1>
          <p className="animate-fade-up stagger-2 text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed">
            Craft your perfect Claude Code statusline.
            <br className="hidden sm:block" />
            <span className="text-foreground/70">Pick segments. Style them. Export.</span>
          </p>
        </div>
      </div>

      {/* Builder */}
      <div className="max-w-6xl mx-auto px-6 py-10">
        <ClientOnly>
          <StatuslineBuilder />
        </ClientOnly>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Built for{" "}
            <a href="https://claude.ai/code" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
              Claude Code
            </a>
          </span>
          <a href="https://code.claude.com/docs/en/statusline" className="hover:text-foreground transition-colors" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        </div>
      </footer>
    </main>
  );
}
