import React from 'react';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import { ProductCategory } from '../types/Product';

interface ProductTreeProps {
  categories: ProductCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onEditCategory: (categoryId: string) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubCategory: (parentId: string) => void;
}

const ProductTree: React.FC<ProductTreeProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  onToggleCategory,
  onEditCategory,
  onDeleteCategory,
  onAddSubCategory
}) => {
  const renderCategoryItem = (category: ProductCategory, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory === category.id;

    return (
      <div key={category.id} className="select-none">
        <div
          className={`
            flex items-center justify-between py-1.5 px-2 hover:bg-gray-100 cursor-pointer
            ${isSelected ? 'bg-blue-50 border-r-2 border-blue-500' : ''}
            ${level > 0 ? `ml-${level * 4}` : ''}
          `}
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div
            className="flex items-center flex-1"
            onClick={() => onCategorySelect(category.id)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCategory(category.id);
                }}
                className="p-0.5 mr-1 hover:bg-gray-200 rounded"
              >
                {category.isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : (
              <div className="w-4 mr-1" />
            )}
            <span className="text-sm text-gray-700 truncate">{category.name}</span>
          </div>
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditCategory(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="编辑"
            >
              <Edit className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddSubCategory(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="添加子分类"
            >
              <Plus className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCategory(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="删除"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        {hasChildren && category.isExpanded && (
          <div>
            {category.children!.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-3 border-b">
        <h3 className="text-sm font-medium text-gray-900">产品分类</h3>
      </div>
      <div className="group">
        {categories.map(category => renderCategoryItem(category))}
      </div>
    </div>
  );
};

export default ProductTree;