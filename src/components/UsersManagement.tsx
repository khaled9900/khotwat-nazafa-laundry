import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, Shield, ShieldCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserItem {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  role: "admin" | "employee";
}

const UsersManagement = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-users", {
        body: null,
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      // Handle edge function response
      if (res.error) throw res.error;

      // The response from functions.invoke puts the parsed JSON in res.data
      const usersData = res.data;
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      } else if (usersData?.error) {
        throw new Error(usersData.error);
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      toast.error(t("error_loading_users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "employee" : "admin";
    setUpdatingId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-users?action=update-role", {
        body: { userId, role: newRole },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw res.error;
      if (res.data?.error) throw new Error(res.data.error);

      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole as "admin" | "employee" } : u));
      toast.success(t("role_updated"));
    } catch (err: any) {
      console.error("Error updating role:", err);
      toast.error(err.message === "Cannot change own role" ? t("cannot_change_own_role") : t("error_updating_role"));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">{t("user_management")}</h1>
          </div>
          <button onClick={fetchUsers} className="flex items-center gap-1.5 bg-secondary text-secondary-foreground px-3 py-2 rounded-md text-sm hover:bg-secondary/80 transition-colors">
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </button>
        </div>
        <span className="text-sm text-muted-foreground">{users.length} {t("users_count")}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 sticky top-0 z-10">
            <tr>
              <th className="text-right px-4 py-3 font-semibold text-foreground">#</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">{t("email")}</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">{t("current_role")}</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">{t("registration_date")}</th>
              <th className="text-right px-4 py-3 font-semibold text-foreground">{t("last_login")}</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-3 font-medium text-foreground font-mono text-xs" dir="ltr">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                    user.role === "admin"
                      ? "bg-primary/10 text-primary"
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    {user.role === "admin" ? <ShieldCheck className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                    {user.role === "admin" ? t("role_admin") : t("role_employee")}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(user.created_at).toLocaleDateString("ar-SA")}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString("ar-SA") : "-"}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    disabled={updatingId === user.id}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors disabled:opacity-50 ${
                      user.role === "admin"
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {updatingId === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin inline" />
                    ) : user.role === "admin" ? (
                      t("demote_to_employee")
                    ) : (
                      t("promote_to_admin")
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default UsersManagement;
