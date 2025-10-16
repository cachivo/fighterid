import React, { useRef, useState } from 'react';
import { Upload, X, FileImage, Loader2, Info } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { resizeImage, formatFileSize, ImageResizeOptions, ImageResizeResult } from '@/lib/imageUtils';

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
  autoResize?: boolean;
  resizeOptions?: ImageResizeOptions;
  showResizeInfo?: boolean;
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
  required = false,
  autoResize = true,
  resizeOptions = { maxWidth: 800, maxHeight: 800, quality: 0.85, format: 'jpeg' },
  showResizeInfo = true
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [resizeInfo, setResizeInfo] = useState<ImageResizeResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Cleanup object URL when it changes or on unmount
  React.useEffect(() => {
    return () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    };
  }, [localPreview]);

  const handleFiles = async (files: FileList | null) => {
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

    try {
      let finalFile = file;
      let resizeResult: ImageResizeResult | null = null;

      // Auto-resize images if enabled and file is an image
      if (autoResize && file.type.startsWith('image/')) {
        setProcessing(true);
        resizeResult = await resizeImage(file, resizeOptions);
        finalFile = resizeResult.file;
        setResizeInfo(resizeResult);
      }

      // Create local preview URL
      if (localPreview) URL.revokeObjectURL(localPreview);
      const url = URL.createObjectURL(finalFile);
      setLocalPreview(url);

      onFileSelect(finalFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen. Intenta con otro archivo.');
    } finally {
      setProcessing(false);
    }
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
    if (disabled || loading || processing) return;
    
    handleFiles(e.target.files);
  };

  const handleClick = () => {
    if (disabled || loading || processing) return;
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
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(null);
    setResizeInfo(null);
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || loading || processing}
        required={required}
      />
      
      {(preview || localPreview) ? (
        <div className="relative max-h-40">
          <div className="group relative border-2 border-dashed border-border rounded-lg overflow-hidden">
            <img
              src={(preview || localPreview) as string}
              alt="Preview"
              className="w-full h-32 object-cover max-h-32"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white hover:bg-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {showResizeInfo && resizeInfo && (
            <div className="mt-2 p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3 w-3" />
                <span>Imagen optimizada:</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <div>Tamaño: {formatFileSize(resizeInfo.originalSize)} → {formatFileSize(resizeInfo.newSize)}</div>
                <div>Dimensiones: {resizeInfo.originalDimensions.width}×{resizeInfo.originalDimensions.height} → {resizeInfo.newDimensions.width}×{resizeInfo.newDimensions.height}</div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-200",
            dragActive ? "border-primary bg-primary/5" : "border-border hover:border-border/80",
            disabled || loading || processing ? "cursor-not-allowed opacity-50" : "",
            "bg-muted/20 hover:bg-muted/40"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            {loading || processing ? (
              <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
            ) : (
              <FileImage className="h-6 w-6 text-muted-foreground" />
            )}
            <div className="text-xs text-muted-foreground">
              {loading ? (
                "Subiendo..."
              ) : processing ? (
                "Procesando..."
              ) : (
                <>
                  <p><strong>Subir foto</strong> o arrastrar aquí</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máx {maxSize}MB
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