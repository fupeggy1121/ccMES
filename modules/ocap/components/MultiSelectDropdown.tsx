import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { cn } from '../utils/cn';

interface Option {
  label: string;
  value: string;
}

interface MultiSelectDropdownProps {
  label: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = '请选择...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOptions = options.filter(option => selectedValues.includes(option.value));

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggleOption = useCallback((option: Option) => {
    const newSelectedValues = selectedValues.includes(option.value)
      ? selectedValues.filter(value => value !== option.value)
      : [...selectedValues, option.value];
    onChange(newSelectedValues);
  }, [selectedValues, onChange]);

  const handleRemoveSelected = useCallback((value: string) => {
    const newSelectedValues = selectedValues.filter(val => val !== value);
    onChange(newSelectedValues);
  }, [selectedValues, onChange]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="relative">
        <button
          type="button"
          className="relative w-full cursor-default rounded-lg bg-white py-2 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm sm:leading-6"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="flex flex-wrap gap-1">
            {selectedOptions.length > 0 ? (
              selectedOptions.map(option => (
                <span
                  key={option.value}
                  className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                >
                  {option.label}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSelected(option.value);
                    }}
                    className="ml-1 -mr-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center text-blue-700 hover:bg-blue-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
            )}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="relative p-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="w-full rounded-md border-0 bg-gray-100 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6"
                placeholder="搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
            </div>
            <ul className="max-h-60 overflow-auto py-1 text-base sm:text-sm">
              {filteredOptions.length === 0 && (
                <li className="text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9">
                  无匹配项
                </li>
              )}
              {filteredOptions.map(option => (
                <li
                  key={option.value}
                  className={cn(
                    'text-gray-900 relative cursor-default select-none py-2 pl-3 pr-9',
                    selectedValues.includes(option.value) ? 'bg-blue-50' : 'hover:bg-gray-100'
                  )}
                  onClick={() => handleToggleOption(option)}
                >
                  <span className="block truncate">{option.label}</span>
                  {selectedValues.includes(option.value) && (
                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                      <Check className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Dummy Check icon for now, replace with actual Lucide icon if needed
const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default MultiSelectDropdown;
