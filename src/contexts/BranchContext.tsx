import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Branch {
  id: string;
  name: string;
}

interface BranchContextType {
  selectedBranch: Branch | null;
  branches: Branch[];
  selectBranch: (branch: Branch) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const BRANCH_STORAGE_KEY = "selectedBranchId";

export const BranchProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setBranches([]);
      setSelectedBranch(null);
      setLoading(false);
      return;
    }

    const fetchBranches = async () => {
      // Fetch branches the user has access to
      const { data: userBranches } = await supabase
        .from("user_branches")
        .select("branch_id, branches(id, name)")
        .eq("user_id", user.id);

      if (userBranches && userBranches.length > 0) {
        const branchList = userBranches
          .map((ub: any) => ub.branches as Branch)
          .filter(Boolean);
        setBranches(branchList);

        // Restore last selected branch
        const savedId = localStorage.getItem(BRANCH_STORAGE_KEY);
        const saved = branchList.find((b) => b.id === savedId);
        if (saved) {
          setSelectedBranch(saved);
        } else if (branchList.length === 1) {
          setSelectedBranch(branchList[0]);
        }
      } else {
        // Admin might see all branches
        const { data: allBranches } = await supabase
          .from("branches")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        setBranches(allBranches || []);
      }

      setLoading(false);
    };

    fetchBranches();
  }, [user]);

  const selectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem(BRANCH_STORAGE_KEY, branch.id);
  };

  return (
    <BranchContext.Provider value={{ selectedBranch, branches, selectBranch, loading }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used within a BranchProvider");
  }
  return context;
};
