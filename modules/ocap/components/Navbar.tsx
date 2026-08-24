import React from 'react';
import { Menu, Bell, User, BookOpen } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface NavbarProps {
  onMenuClick: () => void;
  onShowDocumentation: () => void;
}

const Navbar = ({ onMenuClick, onShowDocumentation }: NavbarProps) => {
  const { user } = useAuthStore();

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-30">
      <div className="px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <span className="text-white font-semibold">OC</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">OCAP 管理系统</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center text-sm text-gray-700">
              {user && (
                <div className="flex items-center">
                  <User size={18} className="mr-2" />
                  <span>{user.name}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  <span className="text-blue-600">{user.role}</span>
                </div>
              )}
            </div>

            <button 
              onClick={onShowDocumentation}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
              title="功能文档"
            >
              <BookOpen size={20} />
            </button>

            <button className="p-2 rounded-full text-gray-600 hover:bg-gray-100 relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;