import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/brand/BrandMark";

export default function Header() {
  const { isAuthenticated, isLoading, clearAuth } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flex items-center justify-between py-4">
          <BrandMark />
          <nav className="hidden items-center gap-8 md:flex">
            <button onClick={() => scrollToSection("features")} className="text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              Features
            </button>
            <button onClick={() => scrollToSection("how-it-works")} className="text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              How it works
            </button>
            <button onClick={() => scrollToSection("testimonials")} className="text-[0.78rem] uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground">
              Voices
            </button>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {!isLoading &&
              (isAuthenticated ? (
                <>
                  <button onClick={clearAuth} className="text-sm text-muted-foreground hover:text-foreground">
                    Logout
                  </button>
                  <Link to="/dashboard" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <Link to="/login" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
                  Get Started
                </Link>
              ))}
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
        {isMenuOpen ? (
          <nav className="flex flex-col gap-3 pb-4 md:hidden">
            <Link to="/login" className="rounded-full bg-primary px-5 py-2 text-center text-sm text-primary-foreground">
              Get Started
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
