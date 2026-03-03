import { AuthForm } from "@/components/auth/AuthForm";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any stale/corrupted session first, then check for valid session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Stale session - sign out to clear corrupted tokens
        supabase.auth.signOut();
        return;
      }
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return <AuthForm />;
};

export default Auth;
