import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
    },
    maxSize: 10485760 // 10MB
  });

  const removeFile = (file: File) => {
    // This is just a mock function since we can't directly modify the acceptedFiles array
    // In a real app, you would manage the files state yourself
    const newFiles = acceptedFiles.filter(f => f !== file);
    onUpload(newFiles);
  };

  return (
    <div>
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-blue-400 bg-blue-50" 
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-2">
          <Upload className="mx-auto h-10 w-10 text-gray-400" />
          
          <div>
            <p className="text-base text-gray-700">
              {isDragActive ? '释放文件上传' : '点击或拖拽文件到此处上传'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              支持图片(JPG, PNG), PDF, Excel文件
            </p>
            <p className="text-xs text-gray-500 mt-1">
              单个文件大小不超过10MB
            </p>
          </div>
        </div>
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-3 text-sm text-red-500">
          <p>无法上传以下文件:</p>
          <ul className="list-disc pl-5 mt-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={file.name}>
                {file.name} - {errors[0].message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;