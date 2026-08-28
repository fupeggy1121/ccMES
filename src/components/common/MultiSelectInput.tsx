import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';

interface MultiSelectInputProps {
  /** 可选项（值即展示文本） */
  options: string[];
  /** 已选中的值 */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  /** 禁用时的提示文案，例如"请先选择站点" */
  disabledHint?: string;
}

/**
 * 多选下拉输入框：输入框内以标签形式展示已选项，聚焦后展开下拉列表，
 * 支持关键字过滤、逐项勾选、全选/清空、点击外部收起。
 */
const MultiSelectInput: React.FC<MultiSelectInputProps> = ({
  options,
  value,
  onChange,
  placeholder = '请选择',
  disabled = false,
  disabledHint,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 点击组件外部时收起下拉
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setKeyword('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 组件被禁用时立即收起，避免残留展开态
  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
      setKeyword('');
    }
  }, [disabled]);

  const filteredOptions = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return options;
    return options.filter(o => o.toLowerCase().includes(kw));
  }, [options, keyword]);

  const toggleOption = (option: string) => {
    onChange(value.includes(option) ? value.filter(v => v !== option) : [...value, option]);
  };

  const removeOption = (option: string) => {
    onChange(value.filter(v => v !== option));
  };

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 输入框为空时按退格删除最后一个已选项
    if (e.key === 'Backspace' && keyword === '' && value.length > 0) {
      onChange(value.slice(0, -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setKeyword('');
    }
  };

  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every(o => value.includes(o));

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={handleOpen}
        className={`flex flex-wrap items-center gap-1 min-h-[38px] w-full border rounded px-2 py-1 text-sm ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : `bg-white cursor-text ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`
        }`}
      >
        {value.map(v => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-xs"
          >
            {v}
            {!disabled && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); removeOption(v); }}
                className="hover:text-blue-900"
                aria-label={`移除 ${v}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={keyword}
          disabled={disabled}
          onChange={e => { setKeyword(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? (disabled ? disabledHint || placeholder : placeholder) : ''}
          className="flex-1 min-w-[60px] border-0 outline-none bg-transparent text-sm py-0.5 disabled:cursor-not-allowed"
        />
        <ChevronDown className={`w-4 h-4 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100 text-xs">
            <span className="text-gray-400">已选 {value.length} 项</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onChange(
                    allFilteredSelected
                      ? value.filter(v => !filteredOptions.includes(v))
                      : Array.from(new Set([...value, ...filteredOptions]))
                  )
                }
                disabled={filteredOptions.length === 0}
                className="text-blue-600 hover:text-blue-800 disabled:text-gray-300"
              >
                {allFilteredSelected ? '取消全选' : '全选'}
              </button>
              <button
                type="button"
                onClick={() => onChange([])}
                disabled={value.length === 0}
                className="text-gray-500 hover:text-gray-700 disabled:text-gray-300"
              >
                清空
              </button>
            </div>
          </div>
          <ul className="max-h-52 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-center text-xs text-gray-400">无匹配选项</li>
            ) : (
              filteredOptions.map(option => {
                const selected = value.includes(option);
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onClick={() => toggleOption(option)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50 ${
                        selected ? 'text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate">{option}</span>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MultiSelectInput;
