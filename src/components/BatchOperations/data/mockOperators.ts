export interface OperatorOption {
  id: string;
  name: string;
}

// 包装人员下拉数据源。项目暂无全局登录用户体系，
// 默认选中列表第一项模拟"当前登录用户"。
export const mockOperators: OperatorOption[] = [
  { id: '0001', name: 'admin' },
  { id: '0002', name: '张伟' },
  { id: '0003', name: '李娜' },
];
