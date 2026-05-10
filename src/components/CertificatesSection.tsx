import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Edit3, Plus, Trash2, Eye, Download, ChevronDown, ChevronUp, EyeOff, FileImage, FileText, File } from 'lucide-react';
import { Certificate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { downloadFile } from '../lib/cloudinary';

interface CertificatesSectionProps { certificates: Certificate[]; showCertificates: boolean; onToggleShow: () => void; onAdd: () => void; onEdit: (c: Certificate) => void; onDelete: (id: string) => void; onView: (c: Certificate) => void; isAdmin: boolean; }

export default function CertificatesSection({ certificates, showCertificates, onToggleShow, onAdd, onEdit, onDelete, onView, isAdmin }: CertificatesSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t, formatDate } = useLanguage();

  return (
    <div className="glass-card glow-gold mb-6 overflow-hidden rounded-2xl">
      <div className="flex cursor-pointer items-center justify-between border-b border-border-gold px-6 py-4 lg:cursor-default" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10"><Award size={18} className="text-accent" /></div>
          <h2 className="font-cairo text-lg font-bold text-text-primary">{t('certificates.title')}</h2>
          <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-xs text-accent">{certificates.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); onToggleShow(); }} className="no-print flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all hover:bg-accent/10 hover:text-accent" title={showCertificates ? t('certificates.hide') : t('certificates.show')}>
            {showCertificates ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="no-print flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all hover:bg-accent/10 hover:text-accent"><Plus size={15} /></button>}
          <div className="lg:hidden">{isOpen ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}</div>
        </div>
      </div>
      <AnimatePresence>{isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
        <div className="px-6 py-5">
          {certificates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border-gold bg-accent/5"><Award size={28} className="text-accent/40" /></div>
              <h3 className="mb-2 font-cairo text-base font-semibold text-text-primary">{t('certificates.empty')}</h3>
              <p className="mb-4 text-sm text-text-secondary">{t('certificates.emptyDesc')}</p>
              {isAdmin && <button onClick={onAdd} className="no-print flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark px-4 py-2 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20"><Plus size={16} /><span>{t('certificates.add')}</span></button>}
            </div>
          ) : !showCertificates ? (
            <div className="py-8 text-center">
              <p className="text-sm text-text-secondary">{t('certificates.hidden')}</p>
              <button onClick={onToggleShow} className="mt-2 text-sm text-accent transition-all hover:text-accent-light">{t('certificates.show')}</button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certificates.map((cert) => (
                <div key={cert.id} className="group rounded-xl border border-border-gold bg-bg-primary/30 p-4 transition-all hover:border-accent/30">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">{cert.fileUrl ? (cert.fileMimeType === 'application/pdf' || cert.fileName?.toLowerCase().endsWith('.pdf') ? <FileText size={18} className="text-accent" /> : cert.fileMimeType?.startsWith('image/') || cert.fileResourceType === 'image' ? <FileImage size={18} className="text-accent" /> : <File size={18} className="text-accent" />) : <Award size={18} className="text-accent" />}</div>
                      <div><h3 className="font-cairo text-sm font-bold text-text-primary leading-tight">{cert.name}</h3><p className="text-xs text-accent">{cert.issuer}</p></div>
                    </div>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-text-secondary">{cert.description}</p>
                  <div className="mb-3 flex items-center gap-2"><span className="rounded-lg bg-accent/10 px-2 py-0.5 text-xs text-accent">{formatDate(cert.date)}</span></div>

                  {/* Action buttons — ordered: Show | Download | Edit (admin) | Delete (admin) */}
                  <div className="flex flex-wrap gap-2">
                    {/* Show / Preview — all users, only when file exists */}
                    {cert.fileUrl && (
                      <button
                        onClick={() => onView(cert)}
                        className="flex items-center gap-1 rounded-lg border border-border-gold px-2 py-1 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
                      >
                        <Eye size={12} /><span>{t('certificates.view')}</span>
                      </button>
                    )}

                    {/* Download — all users, only when file exists */}
                    {cert.fileUrl && (
                      <button
                        type="button"
                        onClick={() => downloadFile(cert.fileUrl, cert.fileName || cert.name || 'file')}
                        className="flex items-center gap-1 rounded-lg border border-border-gold px-2 py-1 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
                      >
                        <Download size={12} /><span>{t('certificates.download')}</span>
                      </button>
                    )}

                    {/* Edit — admin only */}
                    {isAdmin && (
                      <button
                        onClick={() => onEdit(cert)}
                        className="no-print flex items-center gap-1 rounded-lg border border-border-gold px-2 py-1 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
                      >
                        <Edit3 size={12} /><span>{t('certificates.edit')}</span>
                      </button>
                    )}

                    {/* Delete — admin only */}
                    {isAdmin && (
                      <button
                        onClick={() => onDelete(cert.id)}
                        className="no-print flex items-center gap-1 rounded-lg border border-red-500/20 px-2 py-1 text-xs text-text-secondary transition-all hover:border-red-400 hover:text-red-400"
                      >
                        <Trash2 size={12} /><span>{t('certificates.delete')}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>)}</AnimatePresence>
    </div>
  );
}
