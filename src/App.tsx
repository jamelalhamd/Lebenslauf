import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, ArrowUp, Menu, X, FileDown, LogIn, LogOut, Shield, Mail,
  Sun, Moon, Flame, Cloud, CloudOff, FolderOpen,
} from 'lucide-react';
import { CVData, PersonalInfo, Experience, Skill, Language, Certificate } from './types';
import { loadCVData, saveCVData, saveCVDataWithSync, loadCVDataWithSync } from './store';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useLanguage } from './contexts/LanguageContext';
import { useFirebase } from './contexts/FirebaseContext';
import { subscribeToFirestore } from './lib/firestore';
import { deleteFromCloudinary } from './lib/cloudinary';
import LanguageSwitcher from './components/LanguageSwitcher';
import Sidebar from './components/Sidebar';
import SummarySection from './components/SummarySection';
import ExperienceSection from './components/ExperienceSection';
import CertificatesSection from './components/CertificatesSection';
import {
  EditPersonalInfoModal, EditExperienceModal, EditSkillsModal,
  EditLanguagesModal, EditCertificateModal,
} from './components/EditModals';
import ConfirmDialog from './components/ConfirmDialog';
import ViewCertificateModal from './components/ViewCertificateModal';
import CVPrintLayout from './components/CVPrintLayout';
import PhotoCropModal from './components/PhotoCropModal';

type ModalState = {
  type: 'personalInfo' | 'experience' | 'skills' | 'languages' | 'certificate' | null;
  data?: Experience | Certificate | null;
};

export default function CVPage() {
  const [cvData, setCvData] = useState<CVData>(loadCVData);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [showCertificates, setShowCertificates] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'experience' | 'certificate'; id: string } | null>(null);
  const [viewCert, setViewCert] = useState<Certificate | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [photoCropOpen, setPhotoCropOpen] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const { isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const { connected, setLastSync } = useFirebase();
  const navigate = useNavigate();
  // Prevents the save-useEffect from writing Firestore data back to Firestore
  // when cvData changes because of a real-time snapshot (feedback loop guard).
  const isFirestoreUpdate = useRef(false);

  // Load data from Firebase on mount
  useEffect(() => {
    let mounted = true;
    loadCVDataWithSync().then(data => {
      if (mounted) {
        setCvData(data);
        setIsLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    const unsub = subscribeToFirestore((data) => {
      isFirestoreUpdate.current = true; // mark so the save-effect skips write-back
      setCvData(data);
      setLastSync(new Date());
    });
    return () => { if (unsub) unsub(); };
  }, [setLastSync]);

  // Persist data whenever it changes.
  // If the change came from a Firestore snapshot, only update localStorage (avoids
  // writing the snapshot straight back to Firestore and creating an infinite loop).
  useEffect(() => {
    if (isLoading) return;
    if (isFirestoreUpdate.current) {
      isFirestoreUpdate.current = false;
      saveCVData(cvData); // local cache only
      return;
    }
    saveCVDataWithSync(cvData); // local + Firestore
  }, [cvData, isLoading]);

  useEffect(() => {
    const h = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const showToast = useCallback(() => { setShowSuccessToast(true); setTimeout(() => setShowSuccessToast(false), 2500); }, []);
  const handleSavePersonalInfo = useCallback((d: PersonalInfo) => { setCvData(p => ({ ...p, personalInfo: d })); showToast(); }, [showToast]);

  const handleSavePhoto = useCallback((photoUrl: string, photoPublicId: string) => {
    setCvData(p => {
      // Delete previous photo from Cloudinary (fire-and-forget)
      if (p.personalInfo.photoPublicId) {
        deleteFromCloudinary(p.personalInfo.photoPublicId, 'image').catch(console.warn);
      }
      return { ...p, personalInfo: { ...p.personalInfo, photoUrl, photoPublicId } };
    });
    showToast();
  }, [showToast]);

  const handleDeletePhoto = useCallback(() => {
    setCvData(p => {
      const publicId = p.personalInfo.photoPublicId ?? 'cv/profile/photo';
      deleteFromCloudinary(publicId, 'image').catch(console.warn);
      return { ...p, personalInfo: { ...p.personalInfo, photoUrl: '', photoPublicId: undefined } };
    });
    showToast();
  }, [showToast]);

  const generatePDF = useCallback(async () => {
    if (isGeneratingPDF) return;
    setIsGeneratingPDF(true); // renders the loading overlay at z-index 9999

    const wrapper = document.getElementById('pdf-print-wrapper');
    const el = document.getElementById('cv-print-root');
    if (!wrapper || !el) { setIsGeneratingPDF(false); return; }

    // Show the wrapper at z-index 1 — the loading overlay (z-index 9999) hides it visually.
    // Crucially: do NOT touch el's opacity — html2canvas must see the element at full opacity
    // or it captures a transparent/blank image.
    Object.assign(wrapper.style, {
      display: 'block',
      position: 'fixed',
      top: '0',
      left: '0',
      zIndex: '1',
    });

    // Give the browser time to paint fonts and background colours
    await new Promise(r => setTimeout(r, 500));

    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const name = cvData.personalInfo.name.replace(/\s+/g, '_');

      // Convert the element's actual rendered height (CSS px at 96 dpi) to mm.
      // Using the exact height as the jsPDF page format prevents html2pdf from
      // creating a second blank page caused by px→mm rounding (e.g. 297mm = 1122.52 px
      // rounds to 1123 px → 297.08 mm → overflow → blank page).
      const heightMm = (el.scrollHeight / 96) * 25.4;

      await html2pdf().from(el).set({
        margin: 0,
        filename: `${name}_CV.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        pagebreak: { mode: 'avoid-all' },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: { unit: 'mm', format: [210, heightMm], orientation: 'portrait' },
      }).save();
    } catch (err) {
      console.error('PDF generation failed:', err);
    }

    // Restore hidden state
    Object.assign(wrapper.style, { display: '', position: '', top: '', left: '', zIndex: '' });
    setIsGeneratingPDF(false);
  }, [isGeneratingPDF, cvData.personalInfo.name]);
  const handleSaveExperience = useCallback((d: Experience) => { setCvData(p => { const ex = p.experiences.find(e => e.id === d.id); return ex ? { ...p, experiences: p.experiences.map(e => e.id === d.id ? d : e) } : { ...p, experiences: [...p.experiences, d] }; }); showToast(); }, [showToast]);
  const handleDeleteExperience = useCallback((id: string) => { setCvData(p => ({ ...p, experiences: p.experiences.filter(e => e.id !== id) })); showToast(); }, [showToast]);
  const handleSaveSkills = useCallback((s: Skill[]) => { setCvData(p => ({ ...p, skills: s })); showToast(); }, [showToast]);
  const handleSaveLanguages = useCallback((l: Language[]) => { setCvData(p => ({ ...p, languages: l })); showToast(); }, [showToast]);
  const handleSaveCertificate = useCallback((d: Certificate) => {
    setCvData(p => {
      const existing = p.certificates.find(c => c.id === d.id);
      if (existing?.filePublicId && existing.filePublicId !== d.filePublicId) {
        deleteFromCloudinary(existing.filePublicId, existing.fileResourceType ?? 'raw').catch(console.error);
      }
      return existing
        ? { ...p, certificates: p.certificates.map(c => c.id === d.id ? d : c) }
        : { ...p, certificates: [...p.certificates, d] };
    });
    showToast();
  }, [showToast]);
  const handleDeleteCertificate = useCallback((id: string) => {
    setCvData(p => {
      const cert = p.certificates.find(c => c.id === id);
      if (cert?.filePublicId) {
        deleteFromCloudinary(cert.filePublicId, cert.fileResourceType ?? 'raw').catch(console.error);
      }
      return { ...p, certificates: p.certificates.filter(c => c.id !== id) };
    });
    showToast();
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary" dir={dir}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-secondary">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary" dir={dir}>
      <div className="no-print pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="no-print sticky top-0 z-40 border-b border-border-gold backdrop-blur-xl" style={{ backgroundColor: 'var(--theme-nav-bg)' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/5">
              <span className="font-playfair text-lg font-bold text-accent">{cvData.personalInfo.name.charAt(0)}</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-cairo text-base font-bold text-text-primary">{cvData.personalInfo.name}</h1>
              <p className="text-xs text-accent">{cvData.personalInfo.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Firebase Status Indicator */}
            <div className={`hidden sm:flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] ${connected ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
              {connected ? <Cloud size={11} /> : <CloudOff size={11} />}
              <span>{connected ? 'Cloud' : 'Local'}</span>
            </div>
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent" title={isDark ? t('nav.theme.light') : t('nav.theme.dark')}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link to="/contact" className="flex items-center gap-2 rounded-xl border border-border-gold bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent sm:px-4 sm:text-sm">
              <Mail size={15} /><span className="hidden sm:inline">{t('nav.contact')}</span>
            </Link>
            <Link to="/files" className="flex items-center gap-2 rounded-xl border border-border-gold bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent sm:px-4 sm:text-sm">
              <FolderOpen size={15} /><span className="hidden sm:inline">{t('nav.files')}</span>
            </Link>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-border-gold bg-bg-secondary/50 px-3 py-2 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent sm:px-4 sm:text-sm">
              <Printer size={15} /><span className="hidden sm:inline">{t('nav.print')}</span>
            </button>
            <button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark px-3 py-2 text-xs font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 disabled:cursor-wait disabled:opacity-70 sm:px-4 sm:text-sm"
            >
              {isGeneratingPDF
                ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
                : <FileDown size={15} />}
              <span className="hidden sm:inline">{isGeneratingPDF ? t('pdf.generating') : t('nav.downloadPdf')}</span>
            </button>
            {isAdmin && (
              <Link to="/firebase" className="flex items-center gap-2 rounded-xl border border-orange-400/20 bg-orange-400/5 px-3 py-2 text-xs text-orange-400 transition-all hover:bg-orange-400/10 sm:px-4 sm:text-sm">
                <Flame size={15} /><span className="hidden sm:inline">Firebase</span>
              </Link>
            )}
            {isAdmin ? (
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition-all hover:bg-red-500/10 sm:px-4 sm:text-sm">
                <LogOut size={15} /><span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/login')} className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-3 py-2 text-xs text-accent transition-all hover:bg-accent/10 sm:px-4 sm:text-sm">
                <LogIn size={15} /><span className="hidden sm:inline">{t('nav.adminLogin')}</span>
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent lg:hidden">
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border-gold lg:hidden">
              <div className="flex flex-col gap-2 px-4 py-3">
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-xl border border-border-gold px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"><Mail size={15} /><span>{t('nav.contact')}</span></Link>
                {isAdmin && (
                  <>
                    <Link to="/firebase" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 rounded-xl border border-orange-400/20 bg-orange-400/5 px-4 py-2 text-sm text-orange-400 transition-all hover:bg-orange-400/10"><Flame size={15} /><span>Firebase</span></Link>
                    <button onClick={() => { setModal({ type: 'personalInfo' }); setMobileMenuOpen(false); }} className="flex items-center gap-2 rounded-xl border border-border-gold px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"><Shield size={15} className="text-accent" /><span>{t('sidebar.editPersonalInfo')}</span></button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isAdmin && (
          <div className="border-t bg-accent/5" style={{ borderColor: 'var(--theme-admin-border)' }}>
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-1.5 sm:px-6">
              <Shield size={12} className="text-accent" /><span className="text-xs text-accent">{t('nav.adminMode')}</span>
              <div className="ms-auto flex items-center gap-1.5 text-[10px]">
                {connected ? <Cloud size={10} className="text-green-400" /> : <CloudOff size={10} className="text-red-400" />}
                <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'Firebase Connected' : 'Offline'}</span>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="no-print relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Sidebar personalInfo={cvData.personalInfo} skills={cvData.skills} languages={cvData.languages} onEditPersonalInfo={() => setModal({ type: 'personalInfo' })} onEditSkills={() => setModal({ type: 'skills' })} onEditLanguages={() => setModal({ type: 'languages' })} onUploadPhoto={() => setPhotoCropOpen(true)} isAdmin={isAdmin} />
          </div>
          <div className="flex-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <SummarySection bio={cvData.personalInfo.bio} onEdit={() => setModal({ type: 'personalInfo' })} isAdmin={isAdmin} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <ExperienceSection experiences={cvData.experiences} onEdit={(exp) => setModal({ type: 'experience', data: exp })} onAdd={() => setModal({ type: 'experience', data: null })} onDelete={(id) => setDeleteTarget({ type: 'experience', id })} isAdmin={isAdmin} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <CertificatesSection certificates={cvData.certificates} showCertificates={showCertificates} onToggleShow={() => setShowCertificates(p => !p)} onAdd={() => setModal({ type: 'certificate', data: null })} onEdit={(c) => setModal({ type: 'certificate', data: c })} onDelete={(id) => setDeleteTarget({ type: 'certificate', id })} onView={(c) => setViewCert(c)} isAdmin={isAdmin} />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <div className="glass-card overflow-hidden rounded-2xl">
                <div className="h-1.5 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
                <div className="flex flex-col items-center gap-4 px-6 py-10 text-center sm:flex-row sm:text-start">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10"><Mail size={24} className="text-accent" /></div>
                  <div className="flex-1">
                    <h2 className="mb-1 font-cairo text-lg font-bold text-text-primary">{t('contact.ctaTitle')}</h2>
                    <p className="text-sm text-text-secondary">{t('contact.ctaDesc')}</p>
                  </div>
                  <Link to="/contact" className="flex items-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark px-6 py-3 text-sm font-bold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/25"><span>{t('contact.ctaButton')}</span><Mail size={16} /></Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="no-print border-t border-border-gold backdrop-blur-xl" style={{ backgroundColor: 'var(--theme-nav-bg)' }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-text-secondary">© {new Date().getFullYear()} {cvData.personalInfo.name}. {t('footer.rights')}.</p>
            <div className="flex items-center gap-4">
              <Link to="/contact" className="text-xs text-text-secondary transition-all hover:text-accent">{t('nav.contact')}</Link>
              <p className="text-xs text-text-secondary">{t('footer.madeWith')} <span className="text-accent">♥</span> {t('footer.using')}</p>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="no-print fixed bottom-6 start-6 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-bg-secondary/90 text-accent shadow-lg backdrop-blur-sm transition-all hover:bg-accent hover:text-bg-primary">
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="no-print fixed bottom-6 end-6 z-50 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-green-400" /><span className="text-sm text-green-400">{t('toast.saved')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isAdmin && (
        <>
          <EditPersonalInfoModal isOpen={modal.type === 'personalInfo'} onClose={() => setModal({ type: null })} onSave={handleSavePersonalInfo} data={cvData.personalInfo} />
          <EditExperienceModal isOpen={modal.type === 'experience'} onClose={() => setModal({ type: null })} onSave={handleSaveExperience} data={(modal.type === 'experience' ? modal.data : null) as Experience | null} />
          <EditSkillsModal isOpen={modal.type === 'skills'} onClose={() => setModal({ type: null })} onSave={handleSaveSkills} skills={cvData.skills} />
          <EditLanguagesModal isOpen={modal.type === 'languages'} onClose={() => setModal({ type: null })} onSave={handleSaveLanguages} languages={cvData.languages} />
          <EditCertificateModal isOpen={modal.type === 'certificate'} onClose={() => setModal({ type: null })} onSave={handleSaveCertificate} data={(modal.type === 'certificate' ? modal.data : null) as Certificate | null} />
        </>
      )}
      <ViewCertificateModal isOpen={!!viewCert} onClose={() => setViewCert(null)} certificate={viewCert} />
      {isAdmin && (
        <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { deleteTarget.type === 'experience' ? handleDeleteExperience(deleteTarget.id) : handleDeleteCertificate(deleteTarget.id); } }} title={t('modal.confirmDelete')} message={deleteTarget?.type === 'experience' ? t('modal.deleteExpMsg') : t('modal.deleteCertMsg')} />
      )}

      {/* ── PDF generation loading overlay ───────────────────────────── */}
      {/* z-index 9999 — visually covers the print layout (z-index 1) while html2canvas captures it */}
      {isGeneratingPDF && (
        <div className="no-print fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(10,14,20,0.92)' }}>
          <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-accent/20 border-t-accent" />
          <p className="text-base font-semibold text-text-primary">{t('pdf.generating')}</p>
          <p className="text-sm text-text-secondary">{t('pdf.pleaseWait')}</p>
        </div>
      )}

      {/* ── Print / PDF layout ───────────────────────────────────────── */}
      {/* shown only when printing (@media print) or during PDF generation (inline style) */}
      <div id="pdf-print-wrapper" className="print-only">
        <CVPrintLayout data={cvData} />
      </div>

      {/* Photo crop/upload modal */}
      <PhotoCropModal
        isOpen={photoCropOpen}
        currentPhoto={cvData.personalInfo.photoUrl}
        onSave={handleSavePhoto}
        onClose={() => setPhotoCropOpen(false)}
        onDeletePhoto={handleDeletePhoto}
      />
    </div>
  );
}
