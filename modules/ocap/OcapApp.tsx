import { useEffect } from "react";
import { MemoryRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import OcapContentShell from "./layouts/OcapContentShell";
import WorkOrderList from "./pages/WorkOrderList";
import WorkOrderDetail from "./pages/WorkOrderDetail";
import ProcessNode from "./pages/ProcessNode";
import QualityReview from "./pages/QualityReview";
import WorkflowModeling from "./pages/WorkflowModeling";
import WorkflowDesignerPage from "./pages/WorkflowDesignerPage";
import UserGroupManagement from "./pages/UserGroupManagement";
import FormTemplateManagement from "./pages/FormTemplateManagement";
import FormTemplateEditor from "./pages/FormTemplateEditor";
import FormTemplatePreview from "./pages/FormTemplatePreview";
import NotFound from "./pages/NotFound";

// 重建（2026-08-27）：宿主左侧菜单里 OCAP 拆成了"工单管理/OCAP工单建模/表单模版管理"三个
// 子菜单项，点击时宿主会把对应的 activeSubModule 传进来；这里映射到 OCAP 子应用内部的路由，
// 用于把外层菜单选择同步到内部 MemoryRouter（内部 OcapContentShell 自己的导航条切换不受影响）。
const OCAP_ROUTE_BY_SUB_MODULE: Record<string, string> = {
  'ocap-work-orders': '/work-orders',
  'ocap-work-order-modeling': '/exceptions',
  'ocap-form-templates': '/form-templates',
};

interface OcapAppProps {
  activeSubModule?: string;
}

/** 挂在 MemoryRouter 内部，监听外层 activeSubModule 变化并同步跳转 */
function OcapRouteSync({ activeSubModule }: OcapAppProps) {
  const navigate = useNavigate();
  useEffect(() => {
    const targetPath = activeSubModule ? OCAP_ROUTE_BY_SUB_MODULE[activeSubModule] : undefined;
    if (targetPath) {
      navigate(targetPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubModule]);
  return null;
}

// OCAP 子应用的独立路由树，使用 MemoryRouter 而不是 BrowserRouter：
// 内部页面跳转不会反映在宿主的浏览器地址栏上，也不会与宿主自身的导航状态冲突。
const OcapApp = ({ activeSubModule }: OcapAppProps) => (
  <MemoryRouter initialEntries={["/work-orders"]}>
    <OcapRouteSync activeSubModule={activeSubModule} />
    <Routes>
      <Route path="/" element={<OcapContentShell />}>
        <Route index element={<Navigate to="/work-orders" replace />} />
        <Route path="work-orders" element={<WorkOrderList />} />
        <Route path="work-orders/:id" element={<WorkOrderDetail />} />
        <Route path="work-orders/:id/process/:nodeId" element={<ProcessNode />} />
        <Route path="work-orders/:id/review" element={<QualityReview />} />
        <Route path="exceptions" element={<WorkflowModeling />} />
        <Route path="workflow-designer/:templateId" element={<WorkflowDesignerPage />} />
        <Route path="form-templates" element={<FormTemplateManagement />} />
        <Route path="form-templates/:id/edit" element={<FormTemplateEditor />} />
        <Route path="form-templates/:id/preview" element={<FormTemplatePreview />} />
        <Route path="form-templates/new" element={<FormTemplateEditor />} />
        <Route path="user-groups" element={<UserGroupManagement />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </MemoryRouter>
);

export default OcapApp;
