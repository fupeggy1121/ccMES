创建菜单配置文件 src/config/menuConfig.ts:

文件: src/config/menuConfig.ts (新文件)
描述: 将原 src/components/Layout/TopNav.tsx 中的 menuItems 数组及其 MenuItem 接口移动到此文件。同时，对 menuItems 数组进行处理，确保所有顶级菜单项都包含一个 subItems 数组。如果某个顶级菜单项原本没有子菜单，则将其自身作为唯一的子菜单项添加到 subItems 中。这将简化 App.tsx 和 LeftSidebar.tsx 中的逻辑。