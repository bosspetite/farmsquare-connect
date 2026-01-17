import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon, File } from 'lucide-react';

interface FileUploaderProps {
  maxFiles?: number;
  onFilesChange: (files: string[]) => void;
  files: string[];
  className?: string;
  accept?: string; // e.g., "image/*,.pdf"
  maxSizeMB?: number; // Maximum file size in MB
  showPreview?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  maxFiles = 3,
  onFilesChange,
  files,
  className,
  accept = 'image/*',
  maxSizeMB = 5,
  showPreview = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      setTimeout(() => setError(null), 5000);
      return false;
    }
    
    // Check file type
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      setError('Please upload an image or PDF file');
      setTimeout(() => setError(null), 5000);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const newFiles: string[] = [...files];
        Array.from(selectedFiles).forEach((file) => {
          if (newFiles.length < maxFiles && validateFile(file)) {
            // Create a data URL for preview
            const reader = new FileReader();
            reader.onloadend = () => {
              newFiles.push(reader.result as string);
              onFilesChange([...newFiles]);
            };
            reader.readAsDataURL(file);
          }
        });
      }
    },
    [files, maxFiles, onFilesChange, maxSizeMB]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const getFileType = (fileDataUrl: string): 'image' | 'pdf' => {
    if (fileDataUrl.startsWith('data:application/pdf')) return 'pdf';
    return 'image';
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Error message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* File previews */}
      {showPreview && files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file, index) => {
            const fileType = getFileType(file);
            return (
              <div
                key={index}
                className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-primary bg-muted flex items-center justify-center group cursor-pointer hover:scale-105 transition-transform shadow-lg"
                onClick={() => {
                  if (fileType === 'image') {
                    const newWindow = window.open();
                    if (newWindow) {
                      newWindow.document.write(`
                        <html>
                          <head>
                            <title>Image Preview</title>
                            <style>
                              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
                              img { max-width: 100%; max-height: 90vh; object-fit: contain; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                            </style>
                          </head>
                          <body>
                            <img src="${file}" alt="Preview" />
                          </body>
                        </html>
                      `);
                    }
                  }
                }}
              >
                {fileType === 'image' ? (
                  <img
                    src={file}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <File className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 z-10"
                >
                  <X className="w-3 h-3" />
                </button>
                {fileType === 'image' && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <p className="text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium bg-black/50 px-2 py-1 rounded">
                      Click to view
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload area */}
      {files.length < maxFiles && (
        <label
          className={cn(
            'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
            isDragging
              ? 'border-primary bg-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-primary/5'
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles) {
              const newFiles: string[] = [...files];
              Array.from(droppedFiles).forEach((file) => {
                if (newFiles.length < maxFiles && validateFile(file)) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    newFiles.push(reader.result as string);
                    onFilesChange([...newFiles]);
                  };
                  reader.readAsDataURL(file);
                }
              });
            }
          }}
        >
          <input
            type="file"
            accept={accept}
            multiple={maxFiles > 1}
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Tap to upload {accept.includes('pdf') ? 'file' : 'photos'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {files.length}/{maxFiles} {accept.includes('pdf') ? 'files' : 'photos'} · Max {maxSizeMB}MB
          </p>
        </label>
      )}
    </div>
  );
};
