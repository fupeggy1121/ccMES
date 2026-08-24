// src/config/menuConfig.ts
import React from 'react';
import {
  LayoutDashboard,
  Package,
  Truck,
  ClipboardList,
  Settings,
  Box,
  FileText,
  AlertTriangle,
  Send,
  HardDrive,
  CheckCircle,
  Warehouse,
  Wrench,
  LifeBuoy,
  Clock,
  Layers,
  Tag,
  History,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

// Define menu item type
export interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  subItems?: MenuItem[];
  href?: string; // For external links
}

// Original menu items from TopNav.tsx
const originalMenuItems: MenuItem[] = [
  {
    id: 'production-plan-management',
    label: '生产计划',
    icon: ClipboardList,
    subItems: [
      { id: 'production-plan', label: '生产工单', icon: ClipboardList },
      { id: 'bom-management', label: 'BOM', icon: FileText },
      { id: 'wafer-preparation', label: 'MBE装片准备', icon: LayoutDashboard }
    ]
  },
  {
    id: 'wip-management',
    label: '生产管理',
    icon: Settings,
    subItems: [
      {
        id: 'wip-sub-management',
        label: '在制品管理',
        icon: Box,
        subItems: [
          { id: 'fragment-management', label: '批次作业', icon: AlertTriangle },
          { id: 'e-card', label: '批次流水卡', icon: FileText, href: 'https://oqkq2dgk7v34erk4eiqymb4jq.bolt.host' },
          { id: 'operation-log', label: '批次操作履历', icon: FileText, href: 'https://stellar-madeleine-ba4ceb.netlify.app' },
          { id: 'batch-creation', label: '本地批次创建', icon: Send, href: 'https://new-xxzc.bolt.host' },
        ]
      },
      // 新增成品入库管理菜单项
      {
        id: 'finished-product-inbound',
        label: '成品入库管理',
        icon: Warehouse, // 使用仓库图标
        subItems: [
          { id: 'finished-product-batch', label: '成品批次管理', icon: Box },
        ]
      },
      {
        id: 'carriers',
        label: '载具管理',
        icon: Truck,
        subItems: [
          { id: 'carrier-registration', label: '载具管理', icon: Truck },
          { id: 'carrier-group', label: '载具组', icon: Box },
          { id: 'cleaning-task-records', label: '清洗任务记录', icon: History } // 新增菜单项
        ]
      },
      // 新增辅料管理菜单
      {
        id: 'auxiliary-material-management',
        label: '辅料管理',
        icon: Wrench,
        subItems: [
          { id: 'auxiliary-lifetime-management', label: '辅料寿命管理', icon: LifeBuoy },
          { id: 'lifetime-control-modeling', label: '寿命管控建模', icon: Settings }
        ]
      },
      // 新增报工管理菜单
      {
        id: 'work-report-management',
        label: '报工管理',
        icon: ClipboardList,
        subItems: [
          { id: 'work-report-records', label: '报工记录', icon: FileText, href: 'https://mes-udjl.bolt.host' },
        ]
      }      
    ]
  },
  {
    id: 'lineside-warehouse-management',
    label: '线边仓管理',
    icon: Warehouse,
    subItems: [
      { id: 'inventory-management', label: '库存管理', icon: Package, href: 'https://new-suif.bolt.host' },
      { id: 'inventory-transactions', label: '库存交易', icon: Truck, href: 'https://new-qjl4.bolt.host' }
    ]
  },
  { id: 'shipment-management', label: '发货管理', icon: Send },
  { id: 'equipment-management', label: '设备管理', icon: HardDrive, href: 'https://gleeful-belekoy-08f2d9.netlify.app'},
  {
    id: 'quality-management',
    label: '质量管理',
    icon: CheckCircle,
    subItems: [
      { id: 'iqc', label: '来料质量管理', icon: CheckCircle, href: 'https://i68s1pah38xrypax3fq36cb3b.bolt.host/work-orders' },
      { id: 'shipping-judge', label: '成品入库审核', icon: CheckCircle, href: 'https://bskpre525ipc3tuktrjc50gab.bolt.host' },
      { id: 'oqc', label: '出货质量管理', icon: Send, href: 'https://fepkevlq5e089m7tyknk8tqd2.bolt.host' },
      { id: 'mrb-management', label: 'MRB管理', icon: ShieldAlert }
    ]
  },
  {
    id: 'basic-config-management',
    label: '基础配置',
    icon: Settings,
    subItems: [
      {
        id: 'material-source-management',
        label: '生产资源建模',
        icon: Settings,
        subItems: [
          { id: 'warehouse-modeling', label: '仓库建模', icon: Warehouse, href: 'https://qmso945pi9s9nbeb094wkbkrz.bolt.host' },
        ] 
      },
      {
        id: 'process-config',
        label: '工艺配置',
        icon: Settings,
        subItems: [
          // 新增站点建模菜单项
          { id: 'station-modeling', label: '站点建模', icon: Settings, href: 'https://site-process-path-co-vnhf.bolt.host' },
          // 新增工艺路径菜单项
          { id: 'process-route', label: '工艺路径', icon: Settings, href: 'https://site-process-path-co-vnhf.bolt.host' },
          { id: 'q-time-config', label: 'Q-Time配置', icon: Clock, href: 'https://mes-q-time-and-cycle-lnfq.bolt.host/qtime' },
          { id: 'cycle-time-config', label: 'Cycle Time配置', icon: Clock, href: 'https://mes-q-time-and-cycle-lnfq.bolt.host/cycletime' }
        ]
      },
      // 新增产品标准与规范配置二级菜单
      {
        id: 'product-standards-config',
        label: '产品标准与规范',
        icon: Settings, // 使用Settings图标，或选择更合适的
        subItems: [
          { id: 'product-packaging-template-config', label: '包装模版配置', href: 'https://vhw9qvjj72un1x1jhwkgu8gwx.bolt.host/packaging-templates'  },
          { id: 'product-grading-rules-config', label: '分档规则配置', icon: Layers,href: 'https://vhw9qvjj72un1x1jhwkgu8gwx.bolt.host/grading-rules'  },
          { id: 'product-marking-rules-config', label: '打标规则配置', icon: Tag,href: 'https://vhw9qvjj72un1x1jhwkgu8gwx.bolt.host/labeling-rules'  }
        ]
      },
      { id: 'material-model-management', label: '物料模型管理', icon: Package, href: 'https://pfzpa5om0dy40tgw8kotl1x9s.bolt.host' },
      { id: 'product-model-management-external', label: '产品模型管理', icon: Package },
      // 以下两项已移动到“本体管理”模块，此处不再保留
      // { id: 'semantic-mapping-management', label: '语义映射管理', icon: Tag },
      // { id: 'ontology-viewer', label: '本体可视化', icon: Network }
    ]
  },
  { id: 'ocap-quality', label: '工单质量管理', icon: ShieldCheck },
];


// Process menu items to ensure all top-level items have subItems
export const menuItems: MenuItem[] = originalMenuItems.map(item => {
  // If the item doesn't have subItems, create a subItems array with the item itself
  if (!item.subItems || item.subItems.length === 0) {
    return {
      ...item,
      subItems: [{
        id: item.id,
        label: item.label,
        icon: item.icon,
        href: item.href
      }]
    };
  }
  return item;
});

// Helper function to get all sub-menu items as a flat array
export const getAllSubMenuItems = (): MenuItem[] => {
  const allSubItems: MenuItem[] = [];
  menuItems.forEach(topItem => {
    if (topItem.subItems) {
      allSubItems.push(...topItem.subItems);
    }
  });
  return allSubItems;
};

// Helper function to find a top-level menu item by sub-menu ID
export const findTopMenuBySubMenuId = (subMenuId: string): MenuItem | undefined => {
  return menuItems.find(topItem =>
    topItem.subItems?.some(subItem => subItem.id === subMenuId)
  );
};