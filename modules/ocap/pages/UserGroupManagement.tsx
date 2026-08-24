import React, { useState } from 'react';
import { Plus, Users, Edit2, Trash2, Search, Mail, X, Save } from 'lucide-react';
import { useUserGroups, useUsers } from '../hooks/useUserGroups';
import { supabase } from '../lib/supabase';
import { UserGroup } from '../types/user';

const UserGroupManagement: React.FC = () => {
  const { userGroups, loading, fetchUserGroups, fetchGroupMembers } = useUserGroups();
  const { users } = useUsers();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedUserIds: [] as string[]
  });

  const filteredGroups = userGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExpandGroup = async (groupId: string) => {
    if (expandedGroupId === groupId) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(groupId);
      if (!groupMembers[groupId]) {
        const members = await fetchGroupMembers(groupId);
        setGroupMembers(prev => ({ ...prev, [groupId]: members }));
      }
    }
  };

  const handleCreateGroup = async () => {
    try {
      const { data: group, error: groupError } = await supabase
        .from('user_groups')
        .insert({
          name: formData.name,
          description: formData.description
        })
        .select()
        .single();

      if (groupError) throw groupError;

      if (formData.selectedUserIds.length > 0 && group) {
        const memberInserts = formData.selectedUserIds.map(userId => ({
          group_id: group.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('user_group_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      setShowCreateModal(false);
      setFormData({ name: '', description: '', selectedUserIds: [] });
      fetchUserGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('创建用户组失败，请重试');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;

    try {
      const { error: groupError } = await supabase
        .from('user_groups')
        .update({
          name: formData.name,
          description: formData.description
        })
        .eq('id', editingGroup.id);

      if (groupError) throw groupError;

      const { error: deleteError } = await supabase
        .from('user_group_members')
        .delete()
        .eq('group_id', editingGroup.id);

      if (deleteError) throw deleteError;

      if (formData.selectedUserIds.length > 0) {
        const memberInserts = formData.selectedUserIds.map(userId => ({
          group_id: editingGroup.id,
          user_id: userId
        }));

        const { error: membersError } = await supabase
          .from('user_group_members')
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      setEditingGroup(null);
      setFormData({ name: '', description: '', selectedUserIds: [] });
      fetchUserGroups();
    } catch (error) {
      console.error('Error updating group:', error);
      alert('更新用户组失败，请重试');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('确定要删除此用户组吗？')) return;

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      fetchUserGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('删除用户组失败，请重试');
    }
  };

  const openEditModal = async (group: UserGroup) => {
    setEditingGroup(group);
    const members = await fetchGroupMembers(group.id);
    setFormData({
      name: group.name,
      description: group.description,
      selectedUserIds: members.map(m => m.id)
    });
  };

  const toggleUserSelection = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter(id => id !== userId)
        : [...prev.selectedUserIds, userId]
    }));
  };

  const renderModal = () => {
    const isEdit = editingGroup !== null;
    const title = isEdit ? '编辑用户组' : '创建用户组';
    const handleSubmit = isEdit ? handleUpdateGroup : handleCreateGroup;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingGroup(null);
                setFormData({ name: '', description: '', selectedUserIds: [] });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  组名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="输入用户组名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="输入用户组描述"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  选择成员
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <label
                      key={user.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedUserIds.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          {user.department && (
                            <span className="text-sm text-gray-500">{user.department}</span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Mail className="w-3 h-3 mr-1" />
                          {user.email}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  已选择 {formData.selectedUserIds.length} 个成员
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowCreateModal(false);
                setEditingGroup(null);
                setFormData({ name: '', description: '', selectedUserIds: [] });
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 inline mr-2" />
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">用户组管理</h1>
            <p className="text-gray-600 mt-1">管理系统用户组和成员</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>创建用户组</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="搜索用户组..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">加载中...</p>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">
            {searchQuery ? '未找到匹配的用户组' : '暂无用户组，点击上方按钮创建'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroupId === group.id;
            const members = groupMembers[group.id] || [];

            return (
              <div
                key={group.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                          <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-700 rounded-full">
                            {group.member_count || 0} 人
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleExpandGroup(group.id)}
                        className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? '收起' : '查看成员'}
                      </button>
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {isExpanded && members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">成员列表</h4>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
                              {member.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                              <p className="text-xs text-gray-500 truncate">{member.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(showCreateModal || editingGroup) && renderModal()}
    </div>
  );
};

export default UserGroupManagement;
