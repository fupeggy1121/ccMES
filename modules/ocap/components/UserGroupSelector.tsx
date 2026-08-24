import React, { useState, useEffect } from 'react';
import { X, Users, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { UserGroup } from '../types/user';
import { useUserGroups } from '../hooks/useUserGroups';

interface UserGroupSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (group: UserGroup) => void;
  selectedGroupIds?: string[];
}

const UserGroupSelector: React.FC<UserGroupSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedGroupIds = []
}) => {
  const { userGroups, loading, error, fetchGroupMembers } = useUserGroups();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Record<string, any[]>>({});

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setExpandedGroupId(null);
    }
  }, [isOpen]);

  const filteredGroups = userGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = async (group: UserGroup) => {
    if (expandedGroupId === group.id) {
      setExpandedGroupId(null);
    } else {
      setExpandedGroupId(group.id);
      if (!groupMembers[group.id]) {
        const members = await fetchGroupMembers(group.id);
        setGroupMembers(prev => ({ ...prev, [group.id]: members }));
      }
    }
  };

  const handleSelect = (group: UserGroup) => {
    onSelect(group);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">选择用户组</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索用户组名称或描述..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">
              加载中...
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          )}

          {!loading && !error && filteredGroups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchQuery ? '未找到匹配的用户组' : '暂无用户组'}
            </div>
          )}

          {!loading && !error && filteredGroups.length > 0 && (
            <div className="space-y-2">
              {filteredGroups.map((group) => {
                const isSelected = selectedGroupIds.includes(group.id);
                const isExpanded = expandedGroupId === group.id;
                const members = groupMembers[group.id] || [];

                return (
                  <div
                    key={group.id}
                    className={`border rounded-lg overflow-hidden transition-colors ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <Users className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className={`font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                              {group.name}
                            </h4>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'
                            }`}>
                              {group.member_count || 0} 人
                            </span>
                          </div>
                          {group.description && (
                            <p className={`text-sm truncate ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>
                              {group.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleGroupClick(group)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleSelect(group)}
                          disabled={isSelected}
                          className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                            isSelected
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isSelected ? '已添加' : '添加'}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50 p-3">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">成员列表：</h5>
                        {members.length === 0 ? (
                          <p className="text-sm text-gray-500">加载中...</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center space-x-2 text-sm bg-white rounded px-2 py-1.5 border border-gray-200"
                              >
                                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-medium text-gray-600">
                                  {member.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{member.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGroupSelector;
