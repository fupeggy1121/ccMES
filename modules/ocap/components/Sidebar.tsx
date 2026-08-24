import React from 'react';
import { NavLink } from 'react-router-dom';
import { Clipboard, AlertTriangle, FileText, Settings, Users } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { cn } from '../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuthStore();

  return (
    <div className="bg-white shadow-sm fixed top-16 left-0 right-0 z-20">
      <div className="px-4 py-2">
        <nav className="flex space-x-4">
          <NavItem to="/work-orders" icon={<Clipboard size={18} />} label="OCAP工单管理" />
          <NavItem to="/exceptions" icon={<AlertTriangle size={18} />} label="OCAP工单建模" />
          <NavItem to="/form-templates" icon={<FileText size={18} />} label="表单模版管理" />

          {user?.role === 'admin' && (
            <>
              <div className="h-4 w-px bg-gray-200 mx-2 my-2" />
              <NavItem to="/settings" icon={<Settings size={18} />} label="系统设置" />
              <NavItem to="/users" icon={<Users size={18} />} label="用户管理" />
              <NavItem to="/user-groups" icon={<Users size={18} />} label="用户组管理" />
            </>
          )}
        </nav>
      </div>
    </div>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

const NavItem = ({ to, icon, label }: NavItemProps) => (
  <NavLink 
    to={to}
    className={({ isActive }) => cn(
      "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
      isActive 
        ? "bg-blue-50 text-blue-700" 
        : "text-gray-700 hover:bg-gray-100"
    )}
  >
    <span className="mr-2">{icon}</span>
    {label}
  </NavLink>
);

export default Sidebar;