import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, MapPin, Phone, User, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  is_active: boolean;
}

interface UserBranch {
  branch_id: string;
  is_manager: boolean;
}

const BranchSelectPage = () => {
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userBranches, setUserBranches] = useState<UserBranch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [branchesRes, userBranchesRes] = await Promise.all([
        supabase.from("branches").select("*").eq("is_active", true).order("name"),
        supabase.from("user_branches").select("branch_id, is_manager").eq("user_id", user.id),
      ]);
      if (branchesRes.data) setBranches(branchesRes.data);
      if (userBranchesRes.data) setUserBranches(userBranchesRes.data as UserBranch[]);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const accessibleBranches = isAdmin
    ? branches
    : branches.filter((b) => userBranches.some((ub) => ub.branch_id === b.id));

  const isManagerOf = (branchId: string) =>
    isAdmin || userBranches.some((ub) => ub.branch_id === branchId && ub.is_manager);

  const selectBranch = (branch: Branch) => {
    localStorage.setItem("selectedBranchId", branch.id);
    localStorage.setItem("selectedBranchName", branch.name);
    toast.success(`تم اختيار فرع: ${branch.name}`);
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-topbar text-topbar-foreground px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6" />
          <h1 className="text-xl font-bold">اختيار الفرع</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4" />
            <span>{user?.email?.split("@")[0]}</span>
            {isAdmin && (
              <span className="bg-primary/20 text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold">
                مدير
              </span>
            )}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-destructive"
          >
            <LogOut className="h-4 w-4" />
            خروج
          </button>
        </div>
      </header>

      {/* Branch Grid */}
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">مرحباً بك 👋</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "يمكنك الدخول لجميع الفروع" : "اختر الفرع الذي تريد العمل عليه"}
          </p>
        </div>

        {accessibleBranches.length === 0 ? (
          <div className="text-center py-16">
            <Building2 className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">لا توجد فروع متاحة</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "أضف فروعاً من الإعدادات أولاً" : "تواصل مع المدير لربط حسابك بفرع"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accessibleBranches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => selectBranch(branch)}
                className="group relative bg-card border border-border rounded-xl p-6 text-start hover:border-primary hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                {isManagerOf(branch.id) && (
                  <span className="absolute top-3 end-3 bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                    مدير
                  </span>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{branch.name}</h3>
                </div>
                {branch.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{branch.address}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span dir="ltr">{branch.phone}</span>
                  </div>
                )}
                {branch.manager && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-3.5 w-3.5 shrink-0" />
                    <span>{branch.manager}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BranchSelectPage;
