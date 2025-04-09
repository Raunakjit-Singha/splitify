import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  DollarSign, 
  Users, 
  FileChartColumn, 
  Settings, 
  LogOut 
} from "lucide-react";

export default function MobileNav({ activeItem = "dashboard" }) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMenuOpen(false);
  };

  if (!user) {
    return null;
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", path: "/", icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { id: "expenses", label: "My Expenses", path: "/expenses", icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { id: "groups", label: "Split Groups", path: "/groups", icon: <Users className="h-5 w-5 mr-3" /> },
    { id: "reports", label: "Reports", path: "/reports", icon: <FileChartColumn className="h-5 w-5 mr-3" /> },
    { id: "settings", label: "Settings", path: "/settings", icon: <Settings className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 7H19M5 12H19M5 17H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 17C15 17 16 21 19.5 21C23 21 24 17 24 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <h1 className="ml-2 text-xl font-bold text-primary-600">Splitify</h1>
        </div>
        <button 
          type="button" 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          className="text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {isMenuOpen && (
        <div className="px-2 pt-2 pb-3 space-y-1 shadow-lg">
          {navItems.map((item) => (
            <Link key={item.id} href={item.path}>
              <a 
                className={`block px-3 py-2 text-base font-medium rounded-md ${
                  activeItem === item.id
                    ? "bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon}
                  {item.label}
                </div>
              </a>
            </Link>
          ))}
          
          <div className="pt-2 mt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400">
                {user.name.charAt(0)}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="mt-2 w-full flex items-center justify-center"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Signing out..." : "Sign out"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
