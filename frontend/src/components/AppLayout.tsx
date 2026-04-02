import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, HelpCircle, Mic, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BackendStatusPill } from "@/components/BackendStatusPill";

function AppLayoutInner({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loginDev, loginPending, logout } = useAuth();
  const initials =
    user && (user.first_name || user.last_name)
      ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "?"
      : "JD";

  return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header
              className={cn(
                "min-h-14 flex flex-wrap items-center gap-3 px-4 py-2 sm:py-0 sm:h-16",
                "bg-infy-header text-white shadow-md shadow-black/10 sticky top-0 z-20",
              )}
            >
              <div className="flex items-center gap-3 shrink-0">
                <SidebarTrigger
                  className="text-white hover:bg-white/15 hover:text-white border-0 h-9 w-9"
                />
                <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-white/20">
                  <span className="font-semibold text-lg tracking-tight text-white">
                    Event Hub
                  </span>
                </div>
              </div>

              <div className="flex-1 flex justify-center min-w-0 order-last sm:order-none w-full sm:w-auto">
                <div className="relative w-full max-w-2xl">
                  <Input
                    placeholder="Search for events, speakers, topics and more"
                    className={cn(
                      "h-10 w-full rounded-full border-0 bg-white/95 pl-4 pr-24",
                      "text-foreground placeholder:text-muted-foreground shadow-sm",
                      "focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--infy-header))]",
                    )}
                  />
                  <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      aria-label="Voice search"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
                      aria-label="Search"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                <BackendStatusPill />
                {!isAuthenticated ? (
                  <Button
                    type="button"
                    size="sm"
                    className="hidden sm:inline-flex rounded-full bg-white/15 hover:bg-white/25 text-white border-0 text-xs font-semibold"
                    disabled={loginPending}
                    onClick={() => void loginDev()}
                  >
                    {loginPending ? "Signing in…" : "Sign in (dev)"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex text-white/90 hover:bg-white/15 text-xs"
                    onClick={() => logout()}
                  >
                    Sign out
                  </Button>
                )}
                <span className="hidden lg:inline text-sm text-white/90 font-medium px-2">
                  Web Apps / Services
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/15 h-9 w-9"
                  aria-label="Help"
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/15 h-9 w-9">
                  <Bell className="h-5 w-5" />
                  <span
                    className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-infy-gold ring-2 ring-infy-header"
                    aria-hidden
                  />
                </Button>
                <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-white/30">
                  <AvatarFallback className="bg-white/90 text-infy-purple text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  return <AppLayoutInner>{children}</AppLayoutInner>;
}
