import { Outlet } from 'react-router-dom';

// 精简版布局：只保留 <Outlet/>，不带 OCAP 原有的 Navbar/Sidebar，
// 避免和宿主项目现有的顶部菜单 + 左侧栏形成双重导航。
const OcapContentShell = () => (
  <div>
    <Outlet />
  </div>
);

export default OcapContentShell;
