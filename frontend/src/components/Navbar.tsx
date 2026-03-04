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
    <nav className="border-b border-border bg-base transition-colors duration-150">
      <div className="w-full px-4 sm:px-6 md:px-10 xl:px-16 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary rounded-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-accent" />
          </div>
          <span className="font-serif text-lg tracking-tight font-medium ml-1">Echo</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-transparent hover:border-border hover:bg-surface text-muted hover:text-primary transition-all duration-150 ease-out"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <div className="w-px h-4 bg-border" />

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-surface">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-border" />
              )}
            </div>
            <span className="hidden sm:inline text-sm font-medium">{user?.name || "User"}</span>
          </div>
          
          <div className="hidden sm:block w-px h-4 bg-border" />
          
          <button 
            onClick={handleLogout}
            className="text-muted hover:text-primary transition-colors duration-150 ease-out flex items-center gap-1.5 text-sm font-medium"
            aria-label="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
