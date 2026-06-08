import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({ onUpload, isLoading }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = function(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = function(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = function(e) {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  return (
    <div 
      className={`relative w-full rounded-xl border-2 border-dashed transition-colors flex flex-row items-center justify-between px-6 py-3 bg-white ${
        dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleChange}
      />
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-blue-100 rounded-full text-blue-600">
          <UploadCloud size={24} />
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-700">
            {isLoading ? 'Uploading...' : 'Drag Excel sheet here'}
          </p>
        </div>
      </div>
      <button 
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors ml-4 whitespace-nowrap"
        onClick={onButtonClick}
        disabled={isLoading}
      >
        Select File
      </button>
    </div>
  );
}
