import { LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.assign("/");
  };

  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-base)] transition-colors duration-[150ms]">
      <div className="w-full px-6 md:px-10 xl:px-16 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-[var(--color-accent)]" />
          </div>
          <span className="font-serif text-lg tracking-tight font-medium ml-1">Echo</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-all duration-[150ms] ease-out"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-[var(--color-border)]" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[var(--color-border)]" />
              )}
            </div>
            <span className="text-sm font-medium">{user?.name || "User"}</span>
          </div>
          
          <div className="w-px h-4 bg-[var(--color-border)]" />
          
          <button 
            onClick={handleLogout}
            className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors duration-[150ms] ease-out flex items-center gap-2 text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
