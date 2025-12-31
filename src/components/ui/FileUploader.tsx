import React, { useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface FileUploaderProps {
  maxFiles?: number;
  onFilesChange: (files: string[]) => void;
  files: string[];
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  maxFiles = 3,
  onFilesChange,
  files,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const newFiles: string[] = [...files];
        Array.from(selectedFiles).forEach((file) => {
          if (newFiles.length < maxFiles) {
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
    [files, maxFiles, onFilesChange]
  );

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {files.map((file, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-xl overflow-hidden border border-border bg-muted"
            >
              <img
                src={file}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => removeFile(index)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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
                if (newFiles.length < maxFiles && file.type.startsWith('image/')) {
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
            accept="image/*"
            multiple
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Tap to upload photos
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {files.length}/{maxFiles} photos
          </p>
        </label>
      )}
    </div>
  );
};
