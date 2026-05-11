import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Award, FileText, File, ExternalLink } from 'lucide-react';
import { Certificate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getOptimizedUrl, downloadFile, getPdfViewUrl, getDownloadUrl } from '../lib/cloudinary';

interface ViewCertificateModalProps { isOpen: boolean; onClose: () => void; certificate: Certificate | null; }

function detectFileType(cert: Certificate): 'image' | 'pdf' | 'document' {
  if (cert.fileMimeType) {
    if (cert.fileMimeType.startsWith('image/')) return 'image';
    if (cert.fileMimeType === 'application/pdf') return 'pdf';
    return 'document';
  }
  const ext = cert.fileName?.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (cert.fileResourceType === 'image' || cert.fileUrl?.includes('/image/upload/')) return 'image';
  if (cert.fileUrl?.toLowerCase().endsWith('.pdf')) return 'pdf';
  return 'document';
}

export default function ViewCertificateModal({ isOpen, onClose, certificate }: ViewCertificateModalProps) {
  const { t } = useLanguage();
  const [downloading, setDownloading] = useState(false);
  if (!certificate) return null;

  const fileType = detectFileType(certificate);
  const isImage = fileType === 'image';
  const isPdf = fileType === 'pdf';

  // Display URL: optimised for images, inline for PDFs, raw for everything else
  const displayUrl = certificate.fileUrl
    ? (isImage ? getOptimizedUrl(certificate.fileUrl) : isPdf ? getPdfViewUrl(certificate.fileUrl) : certificate.fileUrl)
    : '';

  const handleDownload = async () => {
    if (!certificate.fileUrl || downloading) return;
    setDownloading(true);
    try {
      // Use fl_attachment URL so Cloudinary serves Content-Disposition: attachment
      await downloadFile(getDownloadUrl(certificate.fileUrl), certificate.fileName || certificate.name || 'file');
    } finally {
      setDownloading(false);
    }
  };

  const FileIcon = isPdf ? FileText : File;

  return (
    <AnimatePresence>{isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-gold bg-bg-secondary p-6 shadow-2xl"
        >
          <button type="button" onClick={onClose} aria-label={t('viewCert.close')} className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold bg-bg-secondary text-text-secondary transition-all hover:border-accent hover:text-accent">
            <X size={18} />
          </button>

          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                {isImage ? <Award size={24} className="text-accent" /> : <FileIcon size={24} className="text-accent" />}
              </div>
              <div>
                <h2 className="font-cairo text-lg font-bold text-text-primary">{certificate.name}</h2>
                <p className="text-sm text-accent">{certificate.issuer}</p>
              </div>
            </div>
          </div>

          <p className="mb-4 text-sm text-text-secondary">{certificate.description}</p>

          {/* File preview */}
          {certificate.fileUrl && (
            <div className="overflow-hidden rounded-xl border border-border-gold">

              {/* Image: render inline */}
              {isImage && (
                <img src={displayUrl} alt={certificate.name} className="w-full object-contain" />
              )}

              {/* PDF: iframe with fl_inline so Cloudinary serves Content-Disposition: inline,
                  which triggers the browser's built-in PDF viewer. */}
              {isPdf && (
                <>
                  <iframe
                    src={displayUrl}
                    title={certificate.name}
                    className="h-[480px] w-full border-0"
                  />
                  <div className="flex items-center justify-center border-t border-border-gold bg-bg-primary/30 py-2">
                    <a
                      href={certificate.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-text-secondary transition-all hover:text-accent"
                    >
                      <ExternalLink size={13} />
                      <span>{t('viewCert.openPdf')}</span>
                    </a>
                  </div>
                </>
              )}

              {/* Other documents: icon + open link */}
              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                    <FileIcon size={32} className="text-accent" />
                  </div>
                  <div>
                    <p className="mb-1 font-cairo text-sm font-semibold text-text-primary">{certificate.fileName || certificate.name}</p>
                    <p className="text-xs text-text-secondary">{t('viewCert.previewUnavailable')}</p>
                  </div>
                  <a
                    href={displayUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-border-gold px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"
                  >
                    <ExternalLink size={14} />
                    <span>{t('viewCert.openFile')}</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex gap-3">
            {certificate.fileUrl && (
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-2.5 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 disabled:cursor-wait disabled:opacity-70"
              >
                {downloading
                  ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
                  : <Download size={16} />}
                {t('viewCert.download')}
              </button>
            )}
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border-gold py-2.5 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent">
              {t('viewCert.close')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}
