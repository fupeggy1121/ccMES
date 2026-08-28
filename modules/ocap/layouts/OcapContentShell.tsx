import { Outlet } from 'react-router-dom';

// 精简版布局：只剩 <Outlet/>，不带内部导航条、不带 Navbar。工单管理/OCAP工单建模/
// 表单模版管理/扣留规则这几个入口已经在宿主侧边栏的 OCAP 分组里，之前这里额外画的一条
// 顶部子Tab跟侧边栏是重复导航，已去掉；宿主侧边栏点击仍会通过 OcapRouteSync 同步内部路由。
//
// 外层必须撑满宿主 <main> 的高度：工作流设计器（ReactFlow 画布）靠 h-full/flex-1 逐层
// 继承高度，这里如果是默认的 height:auto，画布会塌成 0px（页面下方空白、无法拖拽节点）。
const OcapContentShell = () => (
  <div className="h-full flex flex-col min-h-0">
    {/* min-h-0 让内容区在超长列表时自己滚动，而不是把 flex 容器顶高 */}
    <div className="flex-1 min-h-0 overflow-auto">
      <Outlet />
    </div>
  </div>
);

export default OcapContentShell;
