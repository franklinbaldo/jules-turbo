import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { LayoutDashboard, Database, LogOut } from "lucide-react";
import { cn } from "../lib/utils";

export default function DashboardLayout() {
  const { setApiKey } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    setApiKey(null, false);
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">Jules Client</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/sessions"
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )
            }
          >
            <LayoutDashboard size={20} />
            <span>Sessions</span>
          </NavLink>
          
          <NavLink
            to="/sources"
            className={({ isActive }) =>
              cn(
                "flex items-center space-x-2 px-4 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              )
            }
          >
            <Database size={20} />
            <span>Sources</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 space-x-2 text-sm text-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} />
            <span>Forget API Key</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
