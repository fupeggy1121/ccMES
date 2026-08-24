import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckSquare, AlertCircle, X, Link2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { mockWorkOrders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import FileUpload from '../components/FileUpload';

const QualityReview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCapaModal, setShowCapaModal] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  useEffect(() => {
    // In a real app, we would fetch from an API
    const foundOrder = mockWorkOrders.find(order => order.id === id);
    
    if (foundOrder) {
      setWorkOrder(foundOrder);
    }
  }, [id]);
  
  const onSubmit = (data: any) => {
    setIsSubmitting(true);
    
    // In a real app, we would send this to the server
    console.log('Review data:', data);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      if (data.requiresCapa) {
        setShowCapaModal(true);
      } else {
        navigate(`/work-orders/${id}`);
      }
    }, 1500);
  };
  
  if (!workOrder) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">工单不存在</h2>
        <p className="text-gray-600 mb-4">找不到工单号为 {id} 的记录</p>
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
        <h1 className="text-2xl font-bold text-gray-800">质量审核</h1>
        <p className="text-gray-600 mt-1">
          工单号: {workOrder.id} · 批次: {workOrder.batchNumber} · 状态: <StatusBadge status={workOrder.status} />
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Review Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">工单处理汇总</h2>
            
            <div className="space-y-6">
              {workOrder.stages.map((stage: any, index: number) => (
                <div key={stage.id} className="border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start">
                    <div className={`rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0 ${stage.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {stage.status === 'completed' ? (
                        <CheckSquare size={14} />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="ml-3">
                      <div className="flex items-center">
                        <h3 className="text-md font-medium text-gray-800">{stage.name}</h3>
                        <span className="ml-2 text-sm text-gray-500">({stage.role})</span>
                      </div>
                      
                      {stage.status === 'completed' && (
                        <>
                          {stage.analysis && (
                            <div className="mt-2">
                              <h4 className="text-sm font-medium text-gray-700">分析说明:</h4>
                              <p className="mt-1 text-sm text-gray-600">{stage.analysis}</p>
                            </div>
                          )}
                          
                          {stage.actions && (
                            <div className="mt-3">
                              <h4 className="text-sm font-medium text-gray-700">处理措施:</h4>
                              <p className="mt-1 text-sm text-gray-600">{stage.actions}</p>
                            </div>
                          )}
                          
                          <div className="mt-2 text-xs text-gray-500">
                            处理人: {stage.assignee} · 
                            完成时间: {stage.completedAt ? format(new Date(stage.completedAt), 'yyyy-MM-dd HH:mm') : '未完成'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Review Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">质量审核</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="reviewComments" className="block text-sm font-medium text-gray-700 mb-1">
                  审核意见 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reviewComments"
                  rows={4}
                  className={`w-full px-3 py-2 border ${errors.reviewComments ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="请输入审核意见..."
                  {...register('reviewComments', { required: '请输入审核意见' })}
                />
                {errors.reviewComments && (
                  <p className="mt-1 text-sm text-red-600">{errors.reviewComments.message as string}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">审核结论</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="conclusion-pass"
                        type="radio"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        value="pass"
                        {...register('conclusion', { required: '请选择审核结论' })}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="conclusion-pass" className="text-sm font-medium text-gray-700">通过</label>
                      <p className="text-xs text-gray-500">异常处理满足要求，可以关闭工单</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="conclusion-conditionalPass"
                        type="radio"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        value="conditionalPass"
                        {...register('conclusion', { required: '请选择审核结论' })}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="conclusion-conditionalPass" className="text-sm font-medium text-gray-700">有条件通过</label>
                      <p className="text-xs text-gray-500">异常处理基本满足要求，需要后续跟进</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="conclusion-reject"
                        type="radio"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        value="reject"
                        {...register('conclusion', { required: '请选择审核结论' })}
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="conclusion-reject" className="text-sm font-medium text-gray-700">不通过</label>
                      <p className="text-xs text-gray-500">异常处理不满足要求，需要重新处理</p>
                    </div>
                  </div>
                </div>
                
                {errors.conclusion && (
                  <p className="mt-1 text-sm text-red-600">{errors.conclusion.message as string}</p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="requiresCapa"
                      type="checkbox"
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      {...register('requiresCapa')}
                    />
                  </div>
                  <div className="ml-3">
                    <label htmlFor="requiresCapa" className="text-sm font-medium text-gray-700">需要生成CAPA</label>
                    <p className="text-xs text-gray-500">创建纠正和预防措施计划以避免类似问题再次发生</p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="reviewerName" className="block text-sm font-medium text-gray-700 mb-1">
                  审核人 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="reviewerName"
                  className={`w-full px-3 py-2 border ${errors.reviewerName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="请输入姓名..."
                  {...register('reviewerName', { required: '请输入审核人姓名' })}
                />
                {errors.reviewerName && (
                  <p className="mt-1 text-sm text-red-600">{errors.reviewerName.message as string}</p>
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
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <CheckSquare size={18} className="mr-2" />
                      提交审核
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="space-y-6">
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
                <p className="text-sm text-gray-500">提交时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {format(new Date(workOrder.createdAt), 'yyyy-MM-dd HH:mm')}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">异常描述</p>
                <p className="text-sm text-gray-800">{workOrder.description}</p>
              </div>
            </div>
          </div>
          
          {/* Quality Guidelines */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">质量审核指南</h2>
            
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0">1</span>
                <span>检查所有处理步骤是否完成并满足要求</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0">2</span>
                <span>确认异常根因是否已经明确识别</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0">3</span>
                <span>验证处理措施是否有效且充分</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0">4</span>
                <span>评估是否需要进一步的纠正预防措施(CAPA)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-100 text-blue-600 mr-2 flex-shrink-0">5</span>
                <span>确保所有必要的文档和记录都已完成</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CAPA Modal */}
      {showCapaModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => navigate(`/work-orders/${id}`)}
                >
                  <span className="sr-only">关闭</span>
                  <X size={20} />
                </button>
              </div>
              
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <Link2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">CAPA链接已生成</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      已成功生成CAPA纠正预防措施计划，点击下方链接查看详情。
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-5 sm:mt-6">
                <a
                  href="#/capa/CAP2023001"
                  className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  查看CAPA计划
                </a>
                
                <button
                  type="button"
                  className="mt-3 inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                  onClick={() => navigate(`/work-orders/${id}`)}
                >
                  返回工单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityReview;