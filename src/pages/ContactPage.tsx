import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail, User, CheckCircle, AlertCircle,
  ArrowRight, Sun, Moon, Loader2, Phone, MapPin, MessageCircle,
} from 'lucide-react';
import { validateEmail, validateRequired, loadCVData, loadCVDataWithSync } from '../store';
import { subscribeToFirestore } from '../lib/firestore';
import { CVData } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const CONTACT_EMAIL = 'alsalamkulturzentrum@gmail.com';
const WHATSAPP_NUMBER = '4917682216044';
const WHATSAPP_DISPLAY = '+49 176 82216044';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

interface FormData { name: string; email: string; message: string }
interface FormErrors { name?: string; email?: string; message?: string }
type FormStatus = 'idle' | 'loading' | 'success' | 'error';

function buildWhatsAppUrl(form: FormData): string {
  const text = `*Name:* ${form.name}\n*Email:* ${form.email}\n\n${form.message}`;
  return `${WHATSAPP_LINK}?text=${encodeURIComponent(text)}`;
}

export default function ContactPage() {
  const [cvData, setCvData] = useState<CVData>(loadCVData);
  const { isDark, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  // Load fresh data from Firestore on mount, then stay subscribed for real-time updates
  useEffect(() => {
    let mounted = true;
    loadCVDataWithSync().then(data => { if (mounted) setCvData(data); });
    const unsub = subscribeToFirestore(data => { if (mounted) setCvData(data); });
    return () => { mounted = false; unsub?.(); };
  }, []);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!validateRequired(formData.name)) e.name = t('contact.nameRequired');
    if (!validateRequired(formData.email)) e.email = t('contact.emailRequired');
    else if (!validateEmail(formData.email)) e.email = t('contact.emailInvalid');
    if (!validateRequired(formData.message)) e.message = t('contact.messageRequired');
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSendEmail = async () => {
    if (!validate()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `Message from ${formData.name}`,
          message: formData.message,
        }),
      });
      const json = await res.json() as { success: boolean };
      if (!json.success) throw new Error('send failed');
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleSendWhatsApp = () => {
    if (!validate()) return;
    window.open(buildWhatsAppUrl(formData), '_blank', 'noopener,noreferrer');
  };

  const handleChange = (f: keyof FormData, v: string) => {
    setFormData(p => ({ ...p, [f]: v }));
    if (errors[f]) setErrors(p => ({ ...p, [f]: undefined }));
    if (status === 'error') setStatus('idle');
  };

  const infoItems = [
    {
      icon: <Mail size={20} className="text-accent" />,
      color: 'from-accent/20 to-accent-dark/10',
      label: t('contact.emailMethod'),
      value: CONTACT_EMAIL,
      href: `mailto:${CONTACT_EMAIL}`,
    },
    {
      icon: <Phone size={20} className="text-green-400" />,
      color: 'from-green-500/20 to-green-600/10',
      label: t('contact.phoneMethod'),
      value: cvData.personalInfo.phone,
      href: `tel:${cvData.personalInfo.phone.replace(/\s/g, '')}`,
    },
    {
      icon: <MessageCircle size={20} className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-emerald-600/10',
      label: t('contact.whatsappNumber'),
      value: WHATSAPP_DISPLAY,
      href: WHATSAPP_LINK,
    },
    {
      icon: <MapPin size={20} className="text-blue-400" />,
      color: 'from-blue-500/20 to-blue-600/10',
      label: t('contact.addressMethod'),
      value: [
        [cvData.personalInfo.street, cvData.personalInfo.houseNumber].filter(Boolean).join(' '),
        cvData.personalInfo.address,
      ].filter(Boolean).join(', '),
      href: null,
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary" dir={dir}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-border-gold backdrop-blur-xl" style={{ backgroundColor: 'var(--theme-nav-bg)' }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-text-secondary transition-all hover:text-accent">
            <ArrowRight size={18} />
            <span>{t('contact.backToCv')}</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-cairo text-base font-bold text-text-primary">{t('contact.title')}</h1>
            <LanguageSwitcher />
            <button type="button" onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h2 className="mb-3 font-cairo text-3xl font-bold text-text-primary sm:text-4xl">
            {t('contact.letsTalk').split(' ').map((w, i) =>
              i === 0 ? <span key={i} className="gold-gradient-text">{w}</span> : ' ' + w
            )}
          </h2>
          <p className="mx-auto max-w-md text-text-secondary">{t('contact.subtitle')}</p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact info panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            className="space-y-3 lg:col-span-2"
          >
            <p className="mb-4 font-cairo text-sm font-semibold uppercase tracking-wider text-text-secondary/60">
              {t('contact.infoTitle')}
            </p>
            {infoItems.map((item, i) => (
              <div key={i} className="glass-card rounded-2xl p-4 transition-all hover:border-accent/30">
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-bl ${item.color}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-xs text-text-secondary">{item.label}</p>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="block truncate font-cairo text-sm font-semibold text-text-primary transition-colors hover:text-accent"
                        dir="ltr"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="font-cairo text-sm font-semibold text-text-primary">{item.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="glass-card glow-gold overflow-hidden rounded-2xl">
              <div className="h-1.5 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
              <div className="p-6 sm:p-8">
                <h3 className="mb-6 font-cairo text-lg font-bold text-text-primary">{t('contact.sendMsg')}</h3>

                {status === 'success' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
                    <CheckCircle size={18} className="shrink-0 text-green-400" />
                    <span className="text-sm font-medium text-green-400">{t('contact.emailSuccess')}</span>
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
                    <AlertCircle size={18} className="shrink-0 text-red-400" />
                    <span className="text-sm font-medium text-red-400">{t('contact.emailError')}</span>
                  </motion.div>
                )}

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.fullName')}</label>
                    <div className="relative">
                      <User size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                      <input
                        type="text" value={formData.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className={`w-full rounded-xl border bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.name ? 'border-red-400' : 'border-border-gold'}`}
                        placeholder={t('contact.namePlaceholder')}
                      />
                    </div>
                    {errors.name && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.emailLabel')}</label>
                    <div className="relative">
                      <Mail size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                      <input
                        type="email" value={formData.email} dir="ltr"
                        onChange={e => handleChange('email', e.target.value)}
                        className={`w-full rounded-xl border bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.email ? 'border-red-400' : 'border-border-gold'}`}
                        placeholder={t('contact.emailPlaceholder')}
                      />
                    </div>
                    {errors.email && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.email}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('contact.message')}</label>
                    <textarea
                      value={formData.message} rows={5}
                      onChange={e => handleChange('message', e.target.value)}
                      className={`w-full resize-none rounded-xl border bg-bg-input py-3 px-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 ${errors.message ? 'border-red-400' : 'border-border-gold'}`}
                      placeholder={t('contact.messagePlaceholder')}
                    />
                    {errors.message && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.message}</p>}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                    {/* Email */}
                    <button
                      type="button"
                      onClick={handleSendEmail}
                      disabled={status === 'loading'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-3.5 text-sm font-bold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
                    >
                      {status === 'loading'
                        ? <Loader2 size={16} className="animate-spin" />
                        : <Mail size={16} />}
                      <span>{status === 'loading' ? t('contact.sending') : t('contact.sendEmail')}</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      type="button"
                      onClick={handleSendWhatsApp}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3.5 text-sm font-bold text-emerald-400 transition-all hover:border-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]"
                    >
                      <MessageCircle size={16} />
                      <span>{t('contact.sendWhatsapp')}</span>
                    </button>
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
