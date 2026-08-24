import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useWorkflowTemplates } from '../hooks/useWorkflowTemplates';
import WorkflowDesigner from '../components/WorkflowDesigner';
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, Connection, Node as RFNode, Edge as RFEdge } from 'reactflow';
import { categoryConfigs } from '../data/workflowTemplateRegistry';
import { convertCustomWorkflowToReactFlow, convertReactFlowToCustomWorkflow } from '../utils/workflowConverter';
import { WorkflowTemplate, WorkflowNodeData } from '../types/workflow';

function incrementVersion(currentVersion: string): string {
  const parts = currentVersion.split('.').map(Number);
  if (parts.length === 0) {
    return '1.0';
  }
  parts[parts.length - 1]++;
  return parts.join('.');
}

const WorkflowDesignerPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, getTemplateById, updateTemplate, createTemplate } = useWorkflowTemplates();

  const [template, setTemplate] = useState<WorkflowTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateCategory, setTemplateCategory] = useState<WorkflowTemplate['category']>('custom');
  const [templateVersion, setTemplateVersion] = useState('1.0');

  const [nodes, setNodes, onNodesChange] = useNodesState<RFNode<WorkflowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RFEdge>([]);

  // State to hold the duplicated template data from location.state
  const [initialDuplicatedTemplateData, setInitialDuplicatedTemplateData] = useState<WorkflowTemplate | undefined>(undefined);

  // Effect to capture duplicatedTemplate from location.state once
  useEffect(() => {
    if (templateId === 'new' && location.state?.duplicatedTemplate && !initialDuplicatedTemplateData) {
      setInitialDuplicatedTemplateData(location.state.duplicatedTemplate as WorkflowTemplate);
    }
  }, [templateId, location.state, initialDuplicatedTemplateData]); // Only run when these change

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep' }, eds));
  }, [setEdges]);

  const handleUpdateNode = useCallback((updatedNode: RFNode<WorkflowNodeData>) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === updatedNode.id ? { ...node, data: updatedNode.data } : node
      )
    );
  }, [setNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== nodeId));
    setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
  }, [setNodes, setEdges]);

  // Effect 1: Load template data and set metadata states
  useEffect(() => {
    if (loading) {
      return; // Wait for loading to complete
    }

    if (templateId === 'new') {
      // If template is already initialized for 'new', do nothing to prevent re-initialization
      if (template && template.id === 'new') {
        return;
      }

      if (initialDuplicatedTemplateData) {
        setTemplate({
          ...initialDuplicatedTemplateData,
          id: 'new', // Ensure ID is 'new' to trigger new template creation logic
          isSystemTemplate: false, // Duplicated template is no longer a system template
          status: 'draft', // Duplicated template defaults to draft status
          metadata: {
            lastModified: new Date().toISOString().split('T')[0],
            createdBy: 'User', // Duplicator is current user
            department: initialDuplicatedTemplateData.metadata?.department,
            tags: initialDuplicatedTemplateData.metadata?.tags,
          },
        });
        setTemplateName(`${initialDuplicatedTemplateData.name} (副本)`);
        setTemplateDescription(initialDuplicatedTemplateData.description);
        setTemplateCategory(initialDuplicatedTemplateData.category);
        setTemplateVersion('1.0'); // New template version starts from 1.0
        setNotFound(false);
      } else {
        // Initialize empty new template data
        const newTemplateBase: WorkflowTemplate = {
          id: 'new',
          name: '',
          description: '',
          category: 'custom',
          version: '1.0',
          status: 'draft',
          nodeCount: 0,
          workflowData: [],
          metadata: {
            lastModified: new Date().toISOString().split('T')[0],
            createdBy: 'User',
          },
          isSystemTemplate: false,
        };
        setTemplate(newTemplateBase);
        setTemplateName('');
        setTemplateDescription('');
        setTemplateCategory('custom');
        setTemplateVersion('1.0');
        setNotFound(false);
      }
    } else { // Existing template
      const found = getTemplateById(templateId);
      if (found) {
        // Only update template state if it's a different template or if template is null
        if (!template || template.id !== found.id) {
          setTemplate(found);
          setTemplateName(found.name);
          setTemplateDescription(found.description);
          setTemplateCategory(found.category);
          setTemplateVersion(found.version);
          setNotFound(false);
        }
      } else {
        setNotFound(true);
        alert('模板不存在');
        navigate('/exceptions');
      }
    }
  }, [templateId, loading, getTemplateById, navigate, template, initialDuplicatedTemplateData]); // Added initialDuplicatedTemplateData to dependencies

  // Effect 2: Initialize React Flow nodes and edges when the 'template' object changes
  useEffect(() => {
    if (template) {
      const { nodes: rfNodes, edges: rfEdges } = convertCustomWorkflowToReactFlow(template.workflowData || []);
      setNodes(rfNodes);
      setEdges(rfEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [template, setNodes, setEdges]);

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('模板名称不能为空');
      return;
    }

    setSaving(true);
    try {
      const currentWorkflowData = convertReactFlowToCustomWorkflow(nodes, edges);

      let savedTemplate: WorkflowTemplate;
      if (templateId === 'new') {
        const newTemplateData: Omit<WorkflowTemplate, 'id'> = {
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          version: '1.0',
          status: 'draft',
          nodeCount: currentWorkflowData.length,
          workflowData: currentWorkflowData,
          metadata: {
            lastModified: new Date().toISOString().split('T')[0],
            createdBy: 'User',
          },
          isSystemTemplate: false,
        };
        savedTemplate = createTemplate(newTemplateData);
        alert('模板创建成功！');
        navigate(`/workflow-designer/${savedTemplate.id}`, { replace: true });
      } else {
        const newVersion = incrementVersion(templateVersion);
        savedTemplate = {
          ...template!,
          name: templateName,
          description: templateDescription,
          category: templateCategory,
          version: newVersion,
          nodeCount: currentWorkflowData.length,
          workflowData: currentWorkflowData,
          metadata: {
            ...template?.metadata,
            lastModified: new Date().toISOString().split('T')[0],
          },
        };
        updateTemplate(templateId, savedTemplate);
        setTemplateVersion(newVersion);
        alert('模板保存成功！');
      }
      setTemplate(savedTemplate); // Update local template state after save
    } catch (error: any) {
      alert(`保存失败: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-500 text-lg">加载模板中...</div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">模板不存在，正在返回...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 页头 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between w-full"> {/* Changed to items-start and w-full */}
          <div className="flex items-start space-x-4 w-2/3"> {/* Left section: back button + template details, taking 2/3 width */}
            <button
              onClick={() => navigate('/exceptions')}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              title="返回列表"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 min-w-0"> {/* Template details container */}
              <div className="flex items-center space-x-2 mb-1"> {/* Name */}
                {templateId === 'new' ? (
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="请输入模板名称"
                    className="flex-1 text-2xl font-bold text-gray-800 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <h1 className="flex-1 text-2xl font-bold text-gray-800">{templateName}</h1>
                )}
              </div>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="请输入模板描述"
                rows={1}
                className="w-full text-gray-600 mt-1 border-b border-gray-300 focus:outline-none focus:border-blue-500 resize-none"
              />
              <select
                value={templateCategory}
                onChange={(e) => setTemplateCategory(e.target.value as WorkflowTemplate['category'])}
                className="mt-2 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {categoryConfigs.map(cat => (
                  <option key={cat.category} value={cat.category}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2 w-1/3"> {/* Right section: version + save button, taking 1/3 width */}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              版本: {templateVersion}
            </span>
            <button
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} className="mr-2" />
              {saving ? '保存中...' : '保存流程'}
            </button>
          </div>
        </div>
      </div>

      {/* 工作流画布 */}
      <div className="flex-1 overflow-hidden">
        {template && (
          <ReactFlowProvider key={templateId}>
            <WorkflowDesigner
              template={template}
              nodes={nodes}
              setNodes={setNodes}
              onNodesChange={onNodesChange}
              edges={edges}
              setEdges={setEdges}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
            />
          </ReactFlowProvider>
        )}
      </div>
    </div>
  );
};

export default WorkflowDesignerPage;
