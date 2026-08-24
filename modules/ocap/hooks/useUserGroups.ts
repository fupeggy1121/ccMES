import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserGroup, User } from '../types/user';

export const useUserGroups = () => {
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_groups')
        .select(`
          *,
          members:user_group_members(count)
        `)
        .order('name');

      if (error) throw error;

      const groupsWithCount = data.map(group => ({
        ...group,
        member_count: group.members?.[0]?.count || 0
      }));

      setUserGroups(groupsWithCount);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('user_group_members')
        .select(`
          user:users(*)
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      return data.map(item => item.user).filter(Boolean) as User[];
    } catch (err) {
      console.error('Failed to fetch group members:', err);
      return [];
    }
  };

  return {
    userGroups,
    loading,
    error,
    fetchUserGroups,
    fetchGroupMembers
  };
};

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('name');

      if (error) throw error;

      setUsers(data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  return {
    users,
    loading,
    error,
    fetchUsers
  };
};
