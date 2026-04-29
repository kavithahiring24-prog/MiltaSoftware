import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, clearAuth } from "../../services/auth";

function Home() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((user) => {
        if (!active) return;
        const role = user?.role || "Employee";
        
        // Dispatch to appropriate dashboard
        if (role === "Admin") navigate("/admin/dashboard", { replace: true });
        else if (role === "Manager") navigate("/manager/dashboard", { replace: true });
        else if (role === "Client") navigate("/client/dashboard", { replace: true });
        else navigate("/employee/dashboard", { replace: true });
      })
      .catch(() => {
        if (!active) return;
        clearAuth();
        navigate("/login", { replace: true });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => { active = false; };
  }, [navigate]);

  return (
    <main className="auth-layout">
      <section className="auth-card">
        <h2>Redirecting to your dashboard...</h2>
      </section>
    </main>
  );
}

export default Home;
