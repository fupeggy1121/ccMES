import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { workOrderService } from '../services/workOrderService';
import StatusBadge from '../components/StatusBadge';
import FilterDropdown from '../components/FilterDropdown';

const WorkOrderList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [workOrders, setWorkOrders] = useState(() => workOrderService.listWorkOrders());
  const [filteredOrders, setFilteredOrders] = useState(() => workOrderService.listWorkOrders());
  
  useEffect(() => {
    let filtered = workOrders;
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.equipment.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(order => order.exceptionType === typeFilter);
    }
    
    setFilteredOrders(filtered);
  }, [workOrders, searchTerm, statusFilter, typeFilter]);
  
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待处理' },
    { value: 'processing', label: '处理中' },
    { value: 'completed', label: '已完成' },
  ];
  
  const typeOptions = [
    { value: 'all', label: '全部类型' },
    { value: 'SPC OCAP', label: 'SPC OCAP' },
    { value: '工艺异常', label: '工艺异常' },
    { value: '设备异常', label: '设备异常' },
    { value: '材料异常', label: '材料异常' },
    { value: '质量缺陷', label: '质量缺陷' },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工单管理</h1>
          <p className="text-gray-600 mt-1">管理所有异常处理工单</p>
        </div>

      </div>
      
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="搜索批次号/设备/工单号..."
                className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            <div className="flex gap-3 md:gap-2">
              <FilterDropdown
                icon={<Clock size={16} />}
                label="状态"
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
              />
              
              <FilterDropdown
                icon={<AlertTriangle size={16} />}
                label="异常类型"
                options={typeOptions}
                value={typeFilter}
                onChange={setTypeFilter}
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  工单号
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  批次/设备
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  异常类型
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  提交时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{order.id}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-medium">{order.batchNumber}</div>
                      <div className="text-sm text-gray-500">{order.equipment}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {order.exceptionType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/work-orders/${order.id}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-900"
                      >
                        查看详情
                        <ChevronRight size={16} className="ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    未找到匹配的工单
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-6 py-4 flex items-center justify-between border-t">
          <div className="text-sm text-gray-500">
            共 <span className="font-medium">{filteredOrders.length}</span> 条记录
          </div>
          
          {/* Pagination would go here */}
        </div>
      </div>
    </div>
  );
};

export default WorkOrderList;