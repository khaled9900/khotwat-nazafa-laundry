import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Building2, UserPlus, Trash2, Loader2, RefreshCw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";

interface Branch {
  id: string;
  name: string;
}

interface UserItem {
  id: string;
  email: string;
  role: "admin" | "employee";
}

interface UserBranchRow {
  id: string;
  user_id: string;
  branch_id: string;
  is_manager: boolean;
  user_email?: string;
  branch_name?: string;
}

const UserBranchesManagement = () => {
  const { t } = useTranslation();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [assignments, setAssignments] = useState<UserBranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const [branchesRes, assignmentsRes, usersRes] = await Promise.all([
        supabase.from("branches").select("id, name").eq("is_active", true).order("name"),
        supabase.from("user_branches").select("*"),
        supabase.functions.invoke("admin-users", {
          body: null,
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
      ]);

      if (branchesRes.data) setBranches(branchesRes.data);
      if (assignmentsRes.data) setAssignments(assignmentsRes.data);

      const usersData = usersRes.data;
      if (Array.isArray(usersData)) {
        setUsers(usersData);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(t("error_loading_data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getUserEmail = (userId: string) =>
    users.find((u) => u.id === userId)?.email ?? userId;

  const getBranchName = (branchId: string) =>
    branches.find((b) => b.id === branchId)?.name ?? branchId;

  const handleAssign = async () => {
    if (!selectedUser || !selectedBranch) {
      toast.error(t("select_user_and_branch"));
      return;
    }

    const exists = assignments.some(
      (a) => a.user_id === selectedUser && a.branch_id === selectedBranch
    );
    if (exists) {
      toast.error(t("assignment_exists"));
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("user_branches").insert({
      user_id: selectedUser,
      branch_id: selectedBranch,
      is_manager: false,
    });
    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("assignment_added"));
      setSelectedUser("");
      setSelectedBranch("");
      fetchData();
    }
  };

  const handleToggleManager = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("user_branches")
      .update({ is_manager: !current })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_manager: !current } : a))
      );
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("user_branches").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("assignment_removed"));
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold text-foreground">{t("user_branches")}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 me-1" />
          {t("refresh")}
        </Button>
      </div>

      {/* Add assignment form */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">{t("assign_user_to_branch")}</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("select_user")} />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.email} {u.role === "admin" ? "👑" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder={t("select_branch")} />
            </SelectTrigger>
            <SelectContent>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={handleAssign} disabled={saving || !selectedUser || !selectedBranch}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4 me-1" />}
            {t("assign")}
          </Button>
        </div>
      </div>

      {/* Assignments table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("email")}</th>
                <th className="text-start p-3 font-medium text-muted-foreground">{t("branch")}</th>
                <th className="text-center p-3 font-medium text-muted-foreground">{t("is_manager")}</th>
                <th className="text-center p-3 font-medium text-muted-foreground">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    {t("no_assignments")}
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-foreground">{getUserEmail(a.user_id)}</td>
                    <td className="p-3 text-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary shrink-0" />
                        {getBranchName(a.branch_id)}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={a.is_manager}
                          onCheckedChange={() => handleToggleManager(a.id, a.is_manager)}
                        />
                        {a.is_manager && <Shield className="h-4 w-4 text-primary" />}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(a.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserBranchesManagement;
