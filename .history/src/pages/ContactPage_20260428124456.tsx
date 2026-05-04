import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Mail, User, FileText, CheckCircle, AlertCircle, ArrowRight, Phone, MapPin, Clock, MessageSquare, Sun, Moon, Github, Linkedin } from 'lucide-react';
import { validateEmail, validateRequired, loadCVData } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

interface FormData { name: string; email: string; subject: string; message: string }
interface FormErrors { name?: string; email?: string; subject?: string; message?: string }

export default function ContactPage() {
  const cvData = loadCVData();
  const { isDark, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState<'email' | 'whatsapp' | null>(null);

  const validate = (): boolean => { const e: FormErrors = {}; if (!validateRequired(formData.name)) e.name = t('contact.nameRequired'); if (!validateRequired(formData.email)) e.email = t('contact.emailRequired'); else if (!validateEmail(formData.email)) e.email = t('contact.emailInvalid'); if (!validateRequired(formData.subject)) e.subject = t('contact.subjectRequired'); if (!validateRequired(formData.message)) e.message = t('contact.messageRequired'); setErrors(e); return !Object.keys(e).length; };
  const handleSendEmail = () => { if (!validate()) return; const s = encodeURIComponent(formData.subject); const b = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`); window.open(`mailto:${cvData.personalInfo.email}?subject=${s}&body=${b}`, '_blank'); setSent('email'); setTimeout(() => setSent(null), 4000); };
  const handleSendWhatsApp = () => { if (!validate()) return; const p = cvData.personalInfo.phone.replace(/[^0-9]/g, ''); const m = encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\n${formData.message}`); window.open(`https://wa.me/${p}?text=${m}`, '_blank'); setSent('whatsapp'); setTimeout(() => setSent(null), 4000); };
  const handleChange = (f: keyof FormData, v: string) => { setFormData(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); };

  const methods = [
    { icon: <Mail size={22} className="text-accent" />, title: t('contact.emailMethod'), value: cvData.personalInfo.email, dir: 'ltr' as const, color: 'from-accent/20 to-accent-dark/10' },
    { icon: <Phone size={22} className="text-green-400" />, title: t('contact.phoneMethod'), value: cvData.personalInfo.phone, dir: 'ltr' as const, color: 'from-green-500/20 to-green-600/10' },
    { icon: <MapPin size={22} className="text-blue-400" />, title: t('contact.addressMethod'), value: cvData.personalInfo.address, dir: 'rtl' as const, color: 'from-blue-500/20 to-blue-600/10' },
    { icon: <Github size={22} className="text-slate-400" />, title: t('contact.githubMethod'), value: cvData.personalInfo.github || t('contact.notAvailable'), dir: 'ltr' as const, color: 'from-slate-500/20 to-slate-600/10', href: cvData.personalInfo.github },
    { icon: <Linkedin size={22} className="text-blue-500" />, title: t('contact.linkedinMethod'), value: cvData.personalInfo.linkedin || t('contact.notAvailable'), dir: 'ltr' as const, color: 'from-blue-500/20 to-blue-600/10', href: cvData.personalInfo.linkedin },
    { icon: <Clock size={22} className="text-purple-400" />, title: t('contact.hoursMethod'), value: t('contact.hoursValue'), dir: 'rtl' as const, color: 'from-purple-500/20 to-purple-600/10' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary" dir={dir}>
      <div className="pointer-events-none fixed inset-0 z-0"><div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-accent/[0.03] blur-[120px]" /><div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/[0.02] blur-[100px]" /></div>
      <nav className="sticky top-0 z-40 border-b border-border-gold backdrop-blur-xl" style={{ backgroundColor: 'var(--theme-nav-bg)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-text-secondary transition-all hover:text-accent"><ArrowRight size={18} /><span>{t('contact.backToCv')}</span></button>
          <div className="flex items-center gap-3">
            <h1 className="font-cairo text-base font-bold text-text-primary">{t('contact.title')}</h1>
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent">{isDark ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </div>
      </nav>
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5"><MessageSquare size={14} className="text-accent" /><span className="text-xs font-medium text-accent">{t('contact.title')}</span></div>
          <h2 className="mb-3 font-cairo text-3xl font-bold text-text-primary sm:text-4xl">{t('contact.letsTalk').split(' ').map((w, i) => i === 0 ? <span key={i} className="gold-gradient-text">{w}</span> : ' ' + w)}</h2>
          <p className="mx-auto max-w-md text-text-secondary">{t('contact.subtitle')}</p>
        </motion.div>
        <div className="grid gap-8 lg:grid-cols-5">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4 lg:col-span-2">
            {methods.map((m, i) => (<div key={i} className="glass-card rounded-2xl p-4 transition-all hover:border-accent/30"><div className="flex items-center gap-4"><div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-bl ${m.color}`}>{m.icon}</div><div><p className="text-xs text-text-secondary">{m.title}</p>{m.href ? <a href={m.href} target="_blank" rel="noopener noreferrer" className="font-cairo text-sm font-semibold text-text-primary break-words" dir={m.dir}>{m.value}</a> : <p className="font-cairo text-sm font-semibold text-text-primary" dir={m.dir}>{m.value}</p>}</div></div></div>))}
            <div className="glass-card overflow-hidden rounded-2xl">
              <div className="h-1 bg-gradient-to-l from-green-500 to-green-400" />
              <div className="p-4"><div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-500/10"><MessageCircle size={22} className="text-green-400" /></div><div className="flex-1"><p className="font-cairo text-sm font-semibold text-text-primary">{t('contact.whatsappDirect')}</p><p className="text-xs text-text-secondary">{t('contact.whatsappQuick')}</p></div><a href={`https://wa.me/${cvData.personalInfo.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex h-10 items-center gap-1.5 rounded-xl bg-green-500/10 px-3 text-xs font-semibold text-green-400 transition-all hover:bg-green-500/20"><MessageCircle size={14} />{t('contact.open')}</a></div></div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-3">
            <div className="glass-card glow-gold overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
              <div className="p-6 sm:p-8">
                <h3 className="mb-6 font-cairo text-lg font-bold text-text-primary">{t('contact.sendMsg')}</h3>
                {sent && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3"><CheckCircle size={16} className="text-green-400" /><span className="text-sm text-green-400">{sent === 'email' ? t('contact.emailSent') : t('contact.whatsappSent')}</span></motion.div>}
                <div className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.fullName')}</label><div className="relative"><User size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" /><input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} className={`w-full rounded-xl border bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.name ? 'border-red-400' : 'border-border-gold'}`} placeholder={t('contact.namePlaceholder')} /></div>{errors.name && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.name}</p>}</div>
                    <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.emailLabel')}</label><div className="relative"><Mail size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" /><input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} className={`w-full rounded-xl border bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.email ? 'border-red-400' : 'border-border-gold'}`} placeholder={t('contact.emailPlaceholder')} dir="ltr" /></div>{errors.email && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.email}</p>}</div>
                  </div>
                  <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.subject')}</label><div className="relative"><FileText size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" /><input type="text" value={formData.subject} onChange={e => handleChange('subject', e.target.value)} className={`w-full rounded-xl border bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.subject ? 'border-red-400' : 'border-border-gold'}`} placeholder={t('contact.subjectPlaceholder')} /></div>{errors.subject && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.subject}</p>}</div>
                  <div><label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.message')}</label><textarea value={formData.message} onChange={e => handleChange('message', e.target.value)} rows={5} className={`w-full resize-none rounded-xl border bg-bg-input py-3 px-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.message ? 'border-red-400' : 'border-border-gold'}`} placeholder={t('contact.messagePlaceholder')} />{errors.message && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.message}</p>}</div>
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    <button onClick={handleSendEmail} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-3.5 text-sm font-bold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]"><Send size={16} /><span>{t('contact.sendEmail')}</span></button>
                    <button onClick={handleSendWhatsApp} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-600/30 bg-green-600/10 py-3.5 text-sm font-bold text-green-400 transition-all hover:bg-green-600/20 active:scale-[0.98]"><MessageCircle size={16} /><span>{t('contact.sendWhatsapp')}</span></button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
