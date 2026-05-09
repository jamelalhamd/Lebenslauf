import { useState, useEffect, useRef, useCallback, DragEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Download, Trash2, FileText, File, X, Sun, Moon,
  LogIn, LogOut, Cloud, CloudOff, FolderOpen, Image as ImageIcon,
  ChevronLeft,
} from 'lucide-react';
import { MediaFile } from '../types';
import { subscribeToFiles, saveFileMetadata, deleteFileMetadata } from '../lib/firestore';
import { uploadMediaFile, deleteFromCloudinary, getDownloadUrl } from '../lib/cloudinary';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFirebase } from '../contexts/FirebaseContext';
import ConfirmDialog from '../components/ConfirmDialog';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { generateId } from '../store';

type Filter = 'all' | 'image' | 'document';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType === 'application/pdf') return <FileText className={className} />;
  if (mimeType.startsWith('image/')) return <ImageIcon className={className} />;
  return <File className={className} />;
}

function FileCard({
  file,
  isAdmin,
  onDelete,
}: {
  file: MediaFile;
  isAdmin: boolean;
  onDelete: (file: MediaFile) => void;
}) {
  const downloadUrl = getDownloadUrl(file.url, file.resourceType);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="glass-card overflow-hidden rounded-2xl flex flex-col"
    >
      {/* Preview */}
      <div className="relative bg-bg-secondary/50 aspect-square overflow-hidden">
        {file.type === 'image' ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
            <FileIcon
              mimeType={file.mimeType}
              className="w-14 h-14 text-accent opacity-80"
            />
            <span className="text-xs text-text-secondary uppercase font-semibold tracking-wider">
              {file.mimeType.split('/').pop()?.replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX') ?? 'file'}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pt-3 pb-2 flex-1 flex flex-col gap-1">
        <p className="text-sm font-semibold text-text-primary leading-tight truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-text-secondary">
          {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 flex items-center gap-2">
        <a
          href={downloadUrl}
          download={file.name}
          target="_blank"
          rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border-gold bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
        >
          <Download size={13} />
          <span>Download</span>
        </a>
        {isAdmin && (
          <button
            type="button"
            onClick={() => onDelete(file)}
            className="flex items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 p-2 text-red-400 transition-all hover:bg-red-500/15"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function FilesPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MediaFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { dir } = useLanguage();
  const { connected } = useFirebase();

  useEffect(() => {
    const unsub = subscribeToFiles(setFiles);
    return () => { if (unsub) unsub(); };
  }, []);

  const counts = {
    all: files.length,
    image: files.filter(f => f.type === 'image').length,
    document: files.filter(f => f.type === 'document').length,
  };

  const filtered = files.filter(f => filter === 'all' || f.type === filter);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const accepted = Array.from(fileList).filter(f => {
      if (f.size > 25 * 1024 * 1024) return false;
      return f.type.startsWith('image/') || [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ].includes(f.type);
    });

    if (!accepted.length) {
      setUploadStatus('No valid files selected (max 25 MB, images or documents).');
      setTimeout(() => setUploadStatus(null), 3000);
      return;
    }

    setUploading(true);
    let done = 0;

    for (const file of accepted) {
      setUploadStatus(`Uploading ${file.name}… (${done + 1}/${accepted.length})`);
      const result = await uploadMediaFile(file);
      if (result) {
        const meta: MediaFile = {
          id: generateId(),
          url: result.url,
          publicId: result.publicId,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'document',
          resourceType: result.resourceType,
          mimeType: file.type,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        };
        await saveFileMetadata(meta);
      }
      done++;
    }

    setUploading(false);
    setUploadStatus(`${done} file${done !== 1 ? 's' : ''} uploaded.`);
    setTimeout(() => setUploadStatus(null), 3000);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    await deleteFromCloudinary(deleteTarget.publicId, deleteTarget.resourceType);
    await deleteFileMetadata(deleteTarget.id);
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-bg-primary" dir={dir}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav
        className="sticky top-0 z-40 border-b border-border-gold backdrop-blur-xl"
        style={{ backgroundColor: 'var(--theme-nav-bg)' }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-border-gold bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Back to CV</span>
            </Link>
            <div className="h-4 w-px bg-border-gold" />
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-accent" />
              <span className="font-cairo text-sm font-bold text-text-primary">Media & Files</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {connected ? <Cloud size={11} /> : <CloudOff size={11} />}
              <span>{connected ? 'Cloud' : 'Local'}</span>
            </div>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            {isAdmin ? (
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition-all hover:bg-red-500/10"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent transition-all hover:bg-accent/10"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-playfair text-2xl font-bold text-text-primary sm:text-3xl">
            Media &amp; Files
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {counts.all} file{counts.all !== 1 ? 's' : ''} · {counts.image} photo{counts.image !== 1 ? 's' : ''} · {counts.document} document{counts.document !== 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Upload zone — admin only */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-8"
          >
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all
                ${isDragging ? 'border-accent bg-accent/5' : 'border-border-gold hover:border-accent/60 hover:bg-accent/[0.02]'}
                ${uploading ? 'cursor-wait opacity-70' : ''}`}
            >
              {uploading ? (
                <>
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                  <p className="text-sm text-text-secondary">{uploadStatus}</p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
                    <Upload size={24} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      Drag &amp; drop files here, or click to select
                    </p>
                    <p className="mt-0.5 text-xs text-text-secondary">
                      Images (JPG, PNG, GIF, WebP) · PDF · DOC · DOCX · TXT · Max 25 MB each
                    </p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* Upload status toast */}
            <AnimatePresence>
              {uploadStatus && !uploading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-2"
                >
                  <span className="text-sm text-green-400">{uploadStatus}</span>
                  <button type="button" onClick={() => setUploadStatus(null)}>
                    <X size={14} className="text-green-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex gap-2"
        >
          {(['all', 'image', 'document'] as Filter[]).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition-all
                ${filter === f
                  ? 'bg-accent text-bg-primary shadow-lg shadow-accent/20'
                  : 'border border-border-gold text-text-secondary hover:border-accent hover:text-accent'}`}
            >
              {f === 'all' && <FolderOpen size={14} />}
              {f === 'image' && <ImageIcon size={14} />}
              {f === 'document' && <FileText size={14} />}
              <span className="capitalize">{f === 'all' ? 'All' : f === 'image' ? 'Photos' : 'Documents'}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
                ${filter === f ? 'bg-bg-primary/20 text-bg-primary' : 'bg-bg-secondary text-text-secondary'}`}>
                {counts[f]}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Files grid */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col items-center justify-center gap-4 py-24 text-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border-gold bg-bg-secondary/50">
              <FolderOpen size={36} className="text-text-secondary/40" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">No files yet</p>
              <p className="mt-1 text-sm text-text-secondary">
                {isAdmin ? 'Upload your first file using the area above.' : 'No files have been uploaded yet.'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((file, i) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <FileCard
                    file={file}
                    isAdmin={isAdmin}
                    onDelete={setDeleteTarget}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>

      {/* Delete confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete file"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
      />

      {/* Deleting overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/60 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        </div>
      )}
    </div>
  );
}
