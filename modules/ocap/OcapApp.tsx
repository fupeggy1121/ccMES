import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
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

// OCAP 子应用的独立路由树，使用 MemoryRouter 而不是 BrowserRouter：
// 内部页面跳转不会反映在宿主的浏览器地址栏上，也不会与宿主自身的导航状态冲突。
const OcapApp = () => (
  <MemoryRouter initialEntries={["/work-orders"]}>
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
