import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onRemoveFile?: () => void;
  accept?: string;
  maxSize?: number; // in MB
  preview?: string;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function FileUpload({
  onFileSelect,
  onRemoveFile,
  accept = "image/*",
  maxSize = 5,
  preview,
  loading = false,
  className,
  disabled = false,
  required = false
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`El archivo debe ser menor a ${maxSize}MB`);
      return;
    }
    
    // Validate file type
    if (accept && !file.type.match(accept.replace('*', '.*'))) {
      alert('Tipo de archivo no válido');
      return;
    }
    
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled || loading) return;
    
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled || loading) return;
    
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    if (disabled || loading) return;
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemoveFile) {
      onRemoveFile();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || loading}
        required={required}
      />
      
      {preview ? (
        <div className="relative">
          <div className="group relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-32 object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-red-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200",
            dragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
            disabled || loading ? "cursor-not-allowed opacity-50" : "",
            "bg-gray-50 hover:bg-gray-100"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {loading ? (
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
            ) : (
              <FileImage className="h-8 w-8 text-gray-400" />
            )}
            <div className="text-sm text-gray-600">
              {loading ? (
                "Subiendo archivo..."
              ) : (
                <>
                  <p><strong>Haz clic para subir</strong> o arrastra el archivo aquí</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo {maxSize}MB. {accept === 'image/*' ? 'Solo imágenes' : accept}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}