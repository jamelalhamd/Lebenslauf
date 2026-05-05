import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Mail, User, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { validateEmail, validateRequired } from '../store';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ContactSection() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!validateRequired(formData.name)) newErrors.name = 'الاسم مطلوب';
    if (!validateRequired(formData.email)) newErrors.email = 'البريد الإلكتروني مطلوب';
    else if (!validateEmail(formData.email)) newErrors.email = 'البريد الإلكتروني غير صالح';
    if (!validateRequired(formData.subject)) newErrors.subject = 'الموضوع مطلوب';
    if (!validateRequired(formData.message)) newErrors.message = 'الرسالة مطلوبة';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
          subject: formData.subject,
          message: formData.message,
        }),
      });
      const json = await res.json() as { success: boolean };
      if (!json.success) throw new Error('send failed');
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    if (status === 'error') setStatus('idle');
  };

  return (
    <div className="glass-card glow-gold overflow-hidden rounded-2xl">
      <div className="border-b border-border-gold px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10">
            <Mail size={18} className="text-accent" />
          </div>
          <h2 className="font-cairo text-lg font-bold text-text-primary">تواصل معي</h2>
        </div>
      </div>

      <div className="px-6 py-5">
        {status === 'success' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
            <CheckCircle size={16} className="shrink-0 text-green-400" />
            <span className="text-sm text-green-400">تم إرسال رسالتك بنجاح!</span>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertCircle size={16} className="shrink-0 text-red-400" />
            <span className="text-sm text-red-400">فشل الإرسال. يرجى المحاولة مرة أخرى.</span>
          </motion.div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">الاسم الكامل</label>
            <div className="relative">
              <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.name ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="أدخل اسمك" />
            </div>
            {errors.name && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">البريد الإلكتروني</label>
            <div className="relative">
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.email ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="example@email.com" dir="ltr" />
            </div>
            {errors.email && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">الموضوع</label>
            <div className="relative">
              <FileText size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input type="text" value={formData.subject} onChange={e => handleChange('subject', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.subject ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="موضوع الرسالة" />
            </div>
            {errors.subject && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.subject}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">الرسالة</label>
            <textarea value={formData.message} onChange={e => handleChange('message', e.target.value)} rows={4}
              className={`w-full resize-none rounded-xl border bg-bg-input py-2.5 px-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.message ? 'border-red-400' : 'border-border-gold'}`}
              placeholder="اكتب رسالتك هنا..." />
            {errors.message && <p className="mt-1 flex items-center gap-1 text-xs text-red-400"><AlertCircle size={12} />{errors.message}</p>}
          </div>

          <button
            onClick={handleSendEmail}
            disabled={status === 'loading'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-3 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            <span>{status === 'loading' ? 'جاري الإرسال...' : 'إرسال عبر البريد'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
