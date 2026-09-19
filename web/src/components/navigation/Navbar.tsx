import { LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";
import { BrandMark } from "@/components/brand/BrandMark";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-[0.78rem] uppercase tracking-[0.18em] transition ${
    isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
  }`;

export function Navbar() {
  const { isLoading, profile, clearAuth } = useAuthStore();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-8">
          <BrandMark to="/dashboard" compact />
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink to="/dashboard" className={navLinkClass}>
              Studio
            </NavLink>
            <NavLink to="/schools" className={navLinkClass}>
              Schools
            </NavLink>
            <NavLink to="/workspace" className={navLinkClass}>
              Workspace
            </NavLink>
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 pl-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-secondary font-display text-sm">
                {(profile?.user.first_name || profile?.user.username || "K").slice(0, 1)}
              </span>
              <span className="hidden md:inline">
                {!isLoading && (profile?.user.first_name || profile?.user.username)}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link to="/dashboard">Studio</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/schools">Schools</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/workspace">Workspace</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsSettingsModalOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={clearAuth}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </header>
  );
}
