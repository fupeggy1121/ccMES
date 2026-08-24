// src/components/Shipment/ShipmentManagementModule.tsx
import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Package, Plus, Calendar, User, MapPin, 
  CheckCircle, Clock, AlertTriangle, Eye, Truck, Target, 
  FileText, Box, Layers, ArrowRight, Settings, Download, 
  ChevronDown, ChevronRight, Battery, Info, ClipboardList, Printer 
} from 'lucide-react';
import { ShippingProcessModal } from './ShippingProcessModal'; // 新增流程组件导入

interface ShipmentManagementModuleProps {
  initialActiveTab?: 'shipping'; // Only shipping tab is allowed now
}

export const ShipmentManagementModule: React.FC<ShipmentManagementModuleProps> = ({ initialActiveTab = 'shipping' }) => {
  // 使用本地状态替代已删除的 hook
  const [shippingOrderRecords, setShippingOrderRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'shipping'>(initialActiveTab);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // 新增状态：控制流程模态框显示
  const [showProcessModal, setShowProcessModal] = useState(false);
  
  // Update activeTab if initialActiveTab changes (e.g., from App.tsx)
  useEffect(() => {
    setActiveTab(initialActiveTab);
  }, [initialActiveTab]);

  // Filter shipping order records
  const filteredShippingOrders = shippingOrderRecords.filter(order => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, type: 'pallet' | 'shipping' = 'pallet') => {
    let styles = '';
    let labels: Record<string, string> = {};

    if (type === 'pallet') { // This is for pallet status within warehouse tab
      styles = {
        'pending-approval': 'bg-yellow-100 text-yellow-800',
        'approved': 'bg-green-100 text-green-800',
        'in-warehouse': 'bg-purple-100 text-purple-800',
        'shipped': 'bg-gray-100 text-gray-800'
      }[status] || 'bg-gray-100 text-gray-800';
      labels = {
        'pending-approval': '待审批',
        'approved': '已通过',
        'in-warehouse': '已入库',
        'shipped': '已出货'
      };
    } else if (type === 'shipping') {
      styles = {
        'draft': 'bg-gray-100 text-gray-800', // 保持，但不会在筛选器中显示
        'confirmed': 'bg-yellow-100 text-yellow-800', // 映射为待发货
        'pending_shipment': 'bg-yellow-100 text-yellow-800', // 新增
        'partially_shipped': 'bg-green-100 text-green-800', // 映射为已发货
        'shipped': 'bg-green-100 text-green-800', // 映射为已发货
        'delivered': 'bg-green-100 text-green-800' // 映射为已发货
      }[status] || 'bg-gray-100 text-gray-800';

      labels = {
        'draft': '草稿',
        'confirmed': '待发货', // 映射
        'pending_shipment': '待发货', // 新增
        'partially_shipped': '已发货', // 映射
        'shipped': '已发货', // 映射
        'delivered': '已发货' // 映射
      };
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'pending_shipment':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'partially_shipped':
      case 'shipped':
      case 'delivered':
        return <Truck className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">发货管理</h2>
            <p className="text-sm text-gray-600 mt-1">成品出货单管理</p>
          </div>
          <button
            onClick={() => setShowProcessModal(true)}
            className="text-sm text-blue-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <Info className="w-4 h-4" />
            业务流程
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">

        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="flex flex-col lg:flex-row gap-4 flex-grow">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索出货单号或客户名称..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">全部状态</option>
                  <option value="pending_shipment">待发货</option>
                  <option value="shipped">已发货</option>
                </select>

                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  筛选
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出货单号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  客户信息
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发货数量 (单位：盒)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  出货日期
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredShippingOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 text-blue-600 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">出货单</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerAddress}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.totalPallets} 盒</div>
                      <div className="text-sm text-gray-500">{order.totalCellQuantity.toLocaleString()} 片晶圆</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.shippingDate.toLocaleDateString('zh-CN')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-2">
                        {getStatusBadge(order.status, 'shipping')}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {/* 操作按钮已移除 */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredShippingOrders.length === 0 && (
          <div className="text-center py-12">
            <Layers className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              暂无出货单数据
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              当前没有可显示的出货单记录
            </p>
          </div>
        )}
      </div>
      
      {/* 新增：出货流程说明模态框 */}
      {showProcessModal && (
        <ShippingProcessModal
          onClose={() => setShowProcessModal(false)}
        />
      )}
    </div>
  );
};