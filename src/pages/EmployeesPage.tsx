import TopBar from "@/components/TopBar";
import AppSidebar from "@/components/AppSidebar";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import EmployeesList from "@/components/EmployeesList";
import EmployeeDepartments from "@/components/EmployeeDepartments";
import EmployeeNationalities from "@/components/EmployeeNationalities";
import EmployeeDeductions from "@/components/EmployeeDeductions";
import EmployeeSalary from "@/components/EmployeeSalary";
import EmployeeActions from "@/components/EmployeeActions";

const componentMap: Record<string, React.ComponentType> = {
  "/employees/list": EmployeesList,
  "/employees/departments": EmployeeDepartments,
  "/employees/nationalities": EmployeeNationalities,
  "/employees/deductions": EmployeeDeductions,
  "/employees/salary": EmployeeSalary,
  "/employees/actions": EmployeeActions,
};

const EmployeesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const Component = componentMap[location.pathname] || EmployeesList;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <TopBar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 min-h-0">
        <AppSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        <Component />
      </div>
    </div>
  );
};

export default EmployeesPage;
