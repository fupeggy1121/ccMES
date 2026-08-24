export interface User {
  id: string;
  email: string;
  name: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  members?: User[];
}

export interface UserGroupMember {
  id: string;
  group_id: string;
  user_id: string;
  created_at: string;
}

export interface EmailRecipient {
  type: 'email' | 'user' | 'group';
  value: string;
  label: string;
  id?: string;
}
