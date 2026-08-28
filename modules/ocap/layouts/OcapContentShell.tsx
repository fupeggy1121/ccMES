import { NavLink, Outlet } from 'react-router-dom';
import { Clipboard, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '../utils/cn';

// 精简版布局：保留一条轻量导航条（替代 OCAP 原有 Sidebar 里那三个非管理员可见的入口）
// + <Outlet/>，不带 Navbar，避免和宿主项目现有的顶部菜单 + 左侧栏形成双重导航。
// 只覆盖 work-orders / exceptions / form-templates 三个区段——user-groups 和更深的
// process/review 子路由在原始 OCAP 项目里本来就没有可点击入口，不在这次修复范围内。
const NAV_ITEMS = [
  { to: '/work-orders', icon: Clipboard, label: '工单管理' },
  { to: '/exceptions', icon: AlertTriangle, label: 'OCAP工单建模' },
  { to: '/form-templates', icon: FileText, label: '表单模版管理' },
];

// 外层必须撑满宿主 <main> 的高度：工作流设计器（ReactFlow 画布）靠 h-full/flex-1 逐层
// 继承高度，这里如果是默认的 height:auto，画布会塌成 0px（页面下方空白、无法拖拽节点）。
const OcapContentShell = () => (
  <div className="h-full flex flex-col min-h-0">
    <nav className="flex space-x-4 px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
            )
          }
        >
          <Icon size={18} className="mr-2" />
          {label}
        </NavLink>
      ))}
    </nav>
    {/* min-h-0 让内容区在超长列表时自己滚动，而不是把 flex 容器顶高 */}
    <div className="flex-1 min-h-0 overflow-auto">
      <Outlet />
    </div>
  </div>
);

export default OcapContentShell;
