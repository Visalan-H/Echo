import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <div className="min-h-screen bg-[var(--color-base)] text-[var(--color-primary)] font-sans antialiased flex flex-col selection:bg-[var(--color-accent)] selection:text-black">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/dashboard"
          element={(
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
