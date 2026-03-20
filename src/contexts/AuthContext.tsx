import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "employee";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const roleRequestIdRef = useRef(0);

  const fetchRole = useCallback(async (userId: string, requestId: number) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (requestId !== roleRequestIdRef.current) return;

    if (error) {
      console.error("Failed to fetch role:", error);
      setRole(null);
      return;
    }

    setRole((data?.role as AppRole) ?? null);
  }, []);

  const applySession = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      roleRequestIdRef.current += 1;
      setRole(null);
      setLoading(false);
      return;
    }

    const requestId = ++roleRequestIdRef.current;
    setLoading(false);
    void fetchRole(nextSession.user.id, requestId);
  }, [fetchRole]);

  useEffect(() => {
    let mounted = true;

    const timeout = setTimeout(() => {
      if (!mounted) return;
      setLoading((prev) => {
        if (prev) {
          console.warn("Auth loading timeout - forcing loading to false");
        }
        return false;
      });
    }, 5000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      applySession(nextSession);
    });

    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        if (!mounted) return;
        applySession(currentSession);
      })
      .catch((error) => {
        console.error("Failed to get session:", error);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    roleRequestIdRef.current += 1;
    setUser(null);
    setSession(null);
    setRole(null);
  };

  const isAdmin = role === "admin";
  const isEmployee = role === "employee";

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signIn, signUp, signOut, isAdmin, isEmployee }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
