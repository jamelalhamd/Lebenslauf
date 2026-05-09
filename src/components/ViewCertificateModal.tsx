import { AnimatePresence, motion } from 'framer-motion';
import { X, Download, Award } from 'lucide-react';
import { Certificate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getDownloadUrl, getOptimizedUrl } from '../lib/cloudinary';

interface ViewCertificateModalProps { isOpen: boolean; onClose: () => void; certificate: Certificate | null; }

export default function ViewCertificateModal({ isOpen, onClose, certificate }: ViewCertificateModalProps) {
  const { t } = useLanguage();
  if (!certificate) return null;

  const isImage = certificate.fileResourceType === 'image'
    || !!certificate.fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    || certificate.fileUrl?.includes('/image/upload/');
  const isPdf = certificate.fileName?.toLowerCase().endsWith('.pdf')
    || (certificate.fileResourceType === 'raw' && certificate.fileUrl?.toLowerCase().includes('.pdf'));

  const displayUrl = certificate.fileUrl
    ? (isImage ? getOptimizedUrl(certificate.fileUrl) : certificate.fileUrl)
    : '';
  const downloadUrl = certificate.fileUrl
    ? getDownloadUrl(certificate.fileUrl, certificate.fileResourceType ?? 'raw')
    : '';

  return (
    <AnimatePresence>{isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-gold bg-bg-secondary p-6 shadow-2xl">
          <button type="button" onClick={onClose} className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold bg-bg-secondary text-text-secondary transition-all hover:border-accent hover:text-accent"><X size={18} /></button>
          <div className="mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10"><Award size={24} className="text-accent" /></div>
              <div><h2 className="font-cairo text-lg font-bold text-text-primary">{certificate.name}</h2><p className="text-sm text-accent">{certificate.issuer}</p></div>
            </div>
          </div>
          <p className="mb-4 text-sm text-text-secondary">{certificate.description}</p>
          {certificate.fileUrl && (
            <div className="overflow-hidden rounded-xl border border-border-gold">
              {isImage && <img src={displayUrl} alt={certificate.name} className="w-full object-contain" />}
              {isPdf && <iframe src={displayUrl} className="h-[500px] w-full" title={certificate.name} />}
              {!isImage && !isPdf && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Award size={48} className="mb-3 text-accent/30" />
                  <p className="text-sm text-text-secondary">{t('viewCert.previewUnavailable')}</p>
                </div>
              )}
            </div>
          )}
          <div className="mt-4 flex gap-3">
            {certificate.fileUrl && (
              <a href={downloadUrl} download={certificate.fileName || 'certificate'} target="_blank" rel="noreferrer" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-2.5 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20">
                <Download size={16} />{t('viewCert.download')}
              </a>
            )}
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border-gold py-2.5 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent">{t('viewCert.close')}</button>
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}
