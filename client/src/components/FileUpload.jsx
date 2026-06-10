import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function FileUpload({ onUpload, isLoading, label }) {
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
      className={`relative rounded-lg border-2 border-dashed transition-colors flex flex-row items-center gap-2 px-3 py-2 bg-white overflow-hidden ${
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
      <UploadCloud size={16} className="text-blue-500 flex-shrink-0" />
      <p className="text-xs font-medium text-gray-600 truncate flex-1 min-w-0">
        {isLoading ? 'Uploading...' : (label || 'Drag Excel here')}
      </p>
      <button
        className="flex-shrink-0 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors"
        onClick={onButtonClick}
        disabled={isLoading}
      >
        {isLoading ? '...' : 'Select'}
      </button>
    </div>
  );
}
