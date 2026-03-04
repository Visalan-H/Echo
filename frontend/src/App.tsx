import { LazyMotion, domAnimation } from "framer-motion";
import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import RequireAuth from "./components/RequireAuth";
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-base text-primary font-sans antialiased flex flex-col selection:bg-accent selection:text-black">
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
    </LazyMotion>
    </ErrorBoundary>
  );
}
