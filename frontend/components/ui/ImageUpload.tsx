'use client';

import React, { useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { X, Upload } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onUpload: (_fs: File[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
    acceptedFormats?: string[];
  currentImages?: string[];
  onRemove?: (_i: number) => void;
}

/**
 * Image Upload Component with Preview
 * Supports drag-and-drop, file selection, and preview
 * 
 * @param onUpload - Callback when files are selected
 * @param maxFiles - Maximum number offiles allowed (default: 5)
 * @param maxSize - Maximum file size in MB (default: 5)
 * @param acceptedFormats - Accepted MIME types (default: images only)
 * @param currentImages - Array of current image URLs
 * @param onRemove - Callback to remove an image
 */
export function ImageUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  currentImages = [],
  onRemove
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(file => {
        file.errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`File ${file.file.name} is too large. Max size: ${maxSize}MB`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`File ${file.file.name} has invalid type. Only images allowed.`);
          } else {
            toast.error(`Error uploading ${file.file.name}: ${error.message}`);
          }
        });
      });
    }

    // Check total file count
    const totalFiles = currentImages.length + previews.length + acceptedFiles.length;
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Create previews
    const newPreviews: string[] = [];
    acceptedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === acceptedFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    onUpload(acceptedFiles);
    toast.success(`${acceptedFiles.length} file(s) uploaded`);
  }, [currentImages.length, previews.length, maxFiles, maxSize, onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats.reduce((acc, format) => ({ ...acc, [format]: [] }), {}),
    maxFiles: maxFiles - currentImages.length - previews.length,
    maxSize: maxSize * 1024 * 1024, // Convert MB to bytes
    multiple: maxFiles > 1
  });

  const removePreview = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-primary-600 dark:text-primary-400 font-medium">
            Drop the files here...
          </p>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              Drag & drop images here, or click to select
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Max {maxFiles} files • Max {maxSize}MB per file • JPG, PNG, WebP, GIF
            </p>
          </>
        )}
      </div>

      {/* Image Previews */}
      {(currentImages.length > 0 || previews.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Current Images */}
          {currentImages.map((url, index) => (
            <div key={`current-${index}`} className="relative group">
              <Image
                src={url}
                alt={`Uploaded ${index + 1}`}
                width={300}
                height={128}
                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {/* New Previews */}
          {previews.map((preview, index) => (
            <div key={`preview-${index}`} className="relative group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={300}
                height={128}
                className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-700"
                unoptimized
              />
              <button
                onClick={() => removePreview(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove preview"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                New
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Count */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        {currentImages.length + previews.length} / {maxFiles} files
      </div>
    </div>
  );
}
