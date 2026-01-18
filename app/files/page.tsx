'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Trash2, Download, FileText, Plus, FolderOpen, Folder } from 'lucide-react';
import { format } from 'date-fns';
import Sidebar from '@/components/Sidebar';

interface FileItem {
  id: string;
  file_name: string;
  file_size: number;
  file_type: string | null;
  file_path: string;
  storage_path: string | null;
  created_at: string;
}

interface Bucket {
  id: string;
  name: string;
  created_at: string;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [newBucketName, setNewBucketName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBuckets();
  }, []);

  useEffect(() => {
    if (selectedBucket) {
      loadFiles();
    }
  }, [selectedBucket]);

  const loadBuckets = async () => {
    try {
      const res = await fetch('/api/files?action=list-buckets');
      const data = await res.json();
      setBuckets(data.buckets || []);
      if (data.buckets && data.buckets.length > 0) {
        setSelectedBucket(data.buckets[0].id);
      }
    } catch (error) {
      console.error('Error loading buckets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    if (!selectedBucket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/files?bucket=${selectedBucket}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBucket = async () => {
    if (!newBucketName.trim()) return;
    try {
      const res = await fetch('/api/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-bucket', name: newBucketName }),
      });
      if (res.ok) {
        setNewBucketName('');
        setShowBucketModal(false);
        loadBuckets();
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
    }
  };

  const deleteBucket = async (bucketId: string) => {
    if (!confirm('Hapus bucket ini? Semua file di dalamnya akan terhapus.')) return;
    try {
      const res = await fetch(`/api/files?action=delete-bucket&bucket=${bucketId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadBuckets();
        setSelectedBucket('');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error deleting bucket:', error);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBucket) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', selectedBucket);

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        loadFiles();
      } else {
        alert('Gagal upload file');
      }
    } catch (error) {
      console.error(error);
      alert('Gagal upload file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Hapus file "${file.file_name}"?`)) return;

    try {
      const res = await fetch(
        `/api/files?id=${file.id}&storage_path=${encodeURIComponent(file.storage_path || '')}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        loadFiles();
      }
    } catch (error) {
      console.error(error);
      alert('Gagal hapus file');
    }
  };

  const handleDownload = (file: FileItem) => {
    window.open(file.file_path, '_blank');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);
  const maxSize = 100 * 1024 * 1024;
  const usagePercent = (totalSize / maxSize) * 100;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-6 lg:ml-0">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">File</h1>
            <p className="text-sm text-gray-600 mt-1">Kelola file dan bucket Anda</p>
          </div>

          {/* Buckets */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium text-gray-900">Bucket</h2>
              <button
                onClick={() => setShowBucketModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
              >
                <Plus size={16} />
                Buat Bucket
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {buckets.map((bucket) => (
                <div key={bucket.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBucket(bucket.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors whitespace-nowrap ${
                      selectedBucket === bucket.id
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Folder size={16} />
                    <span className="text-sm font-medium">{bucket.name}</span>
                  </button>
                  {buckets.length > 1 && (
                    <button
                      onClick={() => deleteBucket(bucket.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Storage Info */}
          {selectedBucket && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-gray-900 mb-3">Storage</h3>

              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">
                  {formatBytes(totalSize)} / {formatBytes(maxSize)}
                </span>
                <span
                  className={`font-medium ${
                    usagePercent > 90
                      ? 'text-red-600'
                      : usagePercent > 70
                      ? 'text-orange-600'
                      : 'text-green-600'
                  }`}
                >
                  {usagePercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usagePercent > 90
                      ? 'bg-red-600'
                      : usagePercent > 70
                      ? 'bg-orange-500'
                      : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || usagePercent >= 100}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={18} />
                {uploading ? 'Mengupload...' : 'Upload File'}
              </button>

              {usagePercent >= 100 && (
                <p className="text-xs text-red-600 mt-2 text-center">
                  Storage penuh! Hapus beberapa file terlebih dahulu.
                </p>
              )}
            </div>
          )}

          {/* Files List */}
          {selectedBucket && (
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : files.length === 0 ? (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Belum ada file</p>
                </div>
              ) : (
                files.map((file) => (
                  <div key={file.id} className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="flex gap-3">
                      <FileText size={20} className="text-gray-900 mt-1 flex-shrink-0" />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {file.file_name}
                          </h4>
                          <div className="flex gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleDownload(file)}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              title="Download"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(file)}
                              className="text-red-600 hover:text-red-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-gray-500">
                          {formatBytes(file.file_size)} • {file.file_type || 'Unknown'}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {format(new Date(file.created_at), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Create Bucket */}
      {showBucketModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Buat Bucket Baru</h3>
            <input
              type="text"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
              placeholder="Nama bucket"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowBucketModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={createBucket}
                className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Buat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}