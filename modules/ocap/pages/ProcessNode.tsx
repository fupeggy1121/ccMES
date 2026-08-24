import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { mockWorkOrders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import FileUpload from '../components/FileUpload';

const ProcessNode = () => {
  const { id, nodeId } = useParams<{ id: string; nodeId: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [currentStage, setCurrentStage] = useState<any>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  useEffect(() => {
    // In a real app, we would fetch from an API
    const foundOrder = mockWorkOrders.find(order => order.id === id);
    
    if (foundOrder) {
      setWorkOrder(foundOrder);
      const stage = foundOrder.stages.find((s: any) => s.id === nodeId);
      setCurrentStage(stage);
    }
  }, [id, nodeId]);
  
  const handleFileUpload = (files: File[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };
  
  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // In a real app, we would send this to the server
    console.log('Form data:', data);
    console.log('Uploaded files:', uploadedFiles);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/work-orders/${id}`);
    }, 1500);
  };
  
  if (!workOrder || !currentStage) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">处理节点不存在</h2>
        <p className="text-gray-600 mb-4">找不到对应的工单或处理节点</p>
        <Link to="/work-orders" className="text-blue-600 hover:underline">
          返回工单列表
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link to={`/work-orders/${id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ChevronLeft size={18} className="mr-1" />
          返回工单详情
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">处理节点：{currentStage.name}</h1>
            <p className="text-gray-600 mt-1">
              工单号: {workOrder.id} · 批次: {workOrder.batchNumber} · 状态: <StatusBadge status={workOrder.status} />
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Processing Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">处理信息</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="analysis" className="block text-sm font-medium text-gray-700 mb-1">
                  分析说明 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="analysis"
                  rows={4}
                  className={`w-full px-3 py-2 border ${errors.analysis ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="请输入异常原因分析..."
                  {...register('analysis', { required: '请输入分析说明' })}
                />
                {errors.analysis && (
                  <p className="mt-1 text-sm text-red-600">{errors.analysis.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="actions" className="block text-sm font-medium text-gray-700 mb-1">
                  处理措施 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="actions"
                  rows={4}
                  className={`w-full px-3 py-2 border ${errors.actions ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="请输入处理措施..."
                  {...register('actions', { required: '请输入处理措施' })}
                />
                {errors.actions && (
                  <p className="mt-1 text-sm text-red-600">{errors.actions.message as string}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">上传附件</h3>
                <FileUpload onUpload={handleFileUpload} />
              </div>
              
              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  处理结果 <span className="text-red-500">*</span>
                </label>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="result-pass"
                        type="radio"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        value="pass"
                        {...register('result', { required: '请选择处理结果' })}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="result-pass" className="text-sm font-medium text-gray-700">合格，流程可以继续</label>
                      <p className="text-xs text-gray-500">异常已处理完毕，生产流程可以继续</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="result-fail"
                        type="radio"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        value="fail"
                        {...register('result', { required: '请选择处理结果' })}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="result-fail" className="text-sm font-medium text-gray-700">需要额外处理</label>
                      <p className="text-xs text-gray-500">异常需要进一步的处理和分析</p>
                    </div>
                  </div>
                </div>
                
                {errors.result && (
                  <p className="mt-1 text-sm text-red-600">{errors.result.message as string}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="nextRole" className="block text-sm font-medium text-gray-700 mb-1">
                  下一处理人角色 <span className="text-red-500">*</span>
                </label>
                <select
                  id="nextRole"
                  className={`w-full px-3 py-2 border ${errors.nextRole ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  {...register('nextRole', { required: '请选择下一处理人角色' })}
                >
                  <option value="">请选择...</option>
                  <option value="engineer">工程师</option>
                  <option value="quality">质量控制</option>
                  <option value="production">生产主管</option>
                  <option value="manager">部门经理</option>
                </select>
                {errors.nextRole && (
                  <p className="mt-1 text-sm text-red-600">{errors.nextRole.message as string}</p>
                )}
              </div>
              
              <div className="flex items-center justify-end pt-6">
                <button
                  type="button"
                  className="mr-4 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={() => navigate(`/work-orders/${id}`)}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                        <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      提交处理结果
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Current Node Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">节点信息</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">处理角色</p>
                <p className="text-sm font-medium text-gray-800">{currentStage.role}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">处理要求</p>
                <p className="text-sm text-gray-800">{currentStage.requirements || "根据异常类型进行分析和处理，并提供处理措施"}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">时间要求</p>
                <p className="text-sm text-gray-800">{currentStage.timeRequirement || "24小时内"}</p>
              </div>
            </div>
          </div>
          
          {/* Exception Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">异常信息</h2>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">批次号</p>
                <p className="text-sm font-medium text-gray-800">{workOrder.batchNumber}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">设备</p>
                <p className="text-sm font-medium text-gray-800">{workOrder.equipment}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">异常类型</p>
                <p className="text-sm font-medium text-gray-800">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {workOrder.exceptionType}
                  </span>
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">提交人</p>
                <p className="text-sm font-medium text-gray-800">{workOrder.submitter}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">提交时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(workOrder.createdAt), 'yyyy-MM-dd HH:mm')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessNode;