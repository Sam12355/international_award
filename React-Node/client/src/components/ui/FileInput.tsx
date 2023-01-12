import React from 'react';

interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

const FileInput = React.forwardRef<HTMLInputElement, FileInputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="file"
          className={`block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-primary-50 file:text-primary-700
            hover:file:bg-primary-100
            cursor-pointer
            ${error ? 'border-red-300' : ''}
            ${className}`}
          {...props}
        />
        {hint && !error && <p className="mt-1 text-sm text-gray-500">{hint}</p>}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

FileInput.displayName = 'FileInput';
export default FileInput;
