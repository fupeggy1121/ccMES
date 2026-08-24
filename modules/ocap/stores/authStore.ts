import { create } from 'zustand';

interface User {
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  isAuthenticated: true,
  user: {
    username: 'admin',
    name: '系统管理员',
    role: '管理员'
  }
}));