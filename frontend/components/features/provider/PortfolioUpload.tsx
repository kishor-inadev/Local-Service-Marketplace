'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createPortfolioItem } from '@/services/user-service';

interface PortfolioUploadProps {
  providerId: string;
  onUploadSuccess?: () => void;
}

export function PortfolioUpload({ providerId, onUploadSuccess }: PortfolioUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate total count (max 10 images)
    if (files.length + acceptedFiles.length > 10) {
      setError('Maximum 10 images allowed per portfolio item');
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    for (const file of acceptedFiles) {
      // Check size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit`);
        continue;
      }

      // Check type
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    },
    maxFiles: 10,
    multiple: true
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (files.length === 0) {
      setError('Please select at least one image');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await createPortfolioItem(providerId, {
        title,
        description: description || undefined,
        images: files
      });

      // Success - reset form
      setTitle('');
      setDescription('');
      setFiles([]);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      toast.success('Portfolio item created successfully!');
    } catch (error: any) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ImageIcon className="w-6 h-6" />
        Add Portfolio Item
      </h2>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Kitchen Renovation Project"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{title.length}/100 characters</p>
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this project, the work done, and any special details..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />
        <p className="text-sm text-gray-500 mt-1">{description.length}/500 characters</p>
      </div>

      {/* Image Upload Area */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Images * (1-10 images, max 5MB each)
        </label>

        {files.length < 10 && (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-4 ${isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the images here...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-2">
                  Drag & drop images here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG, GIF, WEBP (Max 5MB per image, up to 10 images)
                </p>
              </>
            )}
          </div>
        )}

        {/* Image Previews */}
        {files.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-60 rounded text-white text-xs">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <p className="text-sm text-gray-600 mt-3">
            {files.length} / 10 images selected
          </p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Upload Button */}
      <button
        onClick={handleUpload}
        disabled={!title.trim() || files.length === 0 || uploading}
        className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {uploading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Create Portfolio Item
          </>
        )}
      </button>
    </div>
  );
}
