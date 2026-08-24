// src/pages/FormTemplatePreview.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, AlertCircle, FileText } from 'lucide-react';
import { useFormTemplates } from '../hooks/useFormTemplates';
import { FormTemplate } from '../types/form';
import FieldPreview from '../components/form-template/FieldPreview'; // 导入 FieldPreview

const FormTemplatePreview = () => {
  const { id } = useParams<{ id: string }>();
  const { getTemplateById, loading: templatesLoading } = useFormTemplates();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (templatesLoading) {
      return;
    }

    if (id) {
      const foundTemplate = getTemplateById(id);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
    }
  }, [id, getTemplateById, templatesLoading]);

  if (templatesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">加载中...</p>
      </div>
    );
  }

  if (notFound || !template) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">表单模版未找到</h2>
        <p className="text-gray-600 mb-4">找不到 ID 为 {id} 的表单模版。</p>
        <Link to="/form-templates" className="text-blue-600 hover:underline">
          返回模版列表
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link to="/form-templates" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft size={18} className="mr-1" />
          返回模版列表
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600" />
            {template.name}
          </h1>
          <p className="text-gray-600 mt-1">{template.description}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">表单预览 (只读)</h2>
        <div className="space-y-4">
          {template.fields.length === 0 ? (
            <p className="text-gray-500 text-center py-8">此表单模版没有配置任何字段。</p>
          ) : (
            template.fields.map((field) => (
              <FieldPreview key={field.id} field={field} disabled={true} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FormTemplatePreview;
