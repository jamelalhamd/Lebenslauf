import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Mail, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { validateEmail, validateRequired } from '../store';

interface ContactSectionProps {
  email: string;
  phone: string;
}

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

export default function ContactSection({ email, phone }: ContactSectionProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState<'email' | 'whatsapp' | null>(null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!validateRequired(formData.name)) {
      newErrors.name = 'الاسم مطلوب';
    }
    if (!validateRequired(formData.email)) {
      newErrors.email = 'البريد الإلكتروني مطلوب';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صالح';
    }
    if (!validateRequired(formData.subject)) {
      newErrors.subject = 'الموضوع مطلوب';
    }
    if (!validateRequired(formData.message)) {
      newErrors.message = 'الرسالة مطلوبة';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendEmail = () => {
    if (!validate()) return;
    
    const subject = encodeURIComponent(formData.subject);
    const body = encodeURIComponent(
      `الاسم: ${formData.name}\nالبريد: ${formData.email}\n\n${formData.message}`
    );
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    setSent('email');
    setTimeout(() => setSent(null), 3000);
  };

  const handleSendWhatsApp = () => {
    if (!validate()) return;
    
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `الاسم: ${formData.name}\nالبريد: ${formData.email}\nالموضوع: ${formData.subject}\n\n${formData.message}`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    setSent('whatsapp');
    setTimeout(() => setSent(null), 3000);
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
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
        {sent && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3"
          >
            <CheckCircle size={16} className="text-green-400" />
            <span className="text-sm text-green-400">
              {sent === 'email' ? 'تم فتح تطبيق البريد الإلكتروني' : 'تم فتح واتساب'}
            </span>
          </motion.div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              الاسم الكامل
            </label>
            <div className="relative">
              <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.name ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="أدخل اسمك"
              />
            </div>
            {errors.name && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.email ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="example@email.com"
                dir="ltr"
              />
            </div>
            {errors.email && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={12} />
                {errors.email}
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              الموضوع
            </label>
            <div className="relative">
              <FileText size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange('subject', e.target.value)}
                className={`w-full rounded-xl border bg-bg-input py-2.5 pr-10 pl-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.subject ? 'border-red-400' : 'border-border-gold'}`}
                placeholder="موضوع الرسالة"
              />
            </div>
            {errors.subject && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={12} />
                {errors.subject}
              </p>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">
              الرسالة
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => handleChange('message', e.target.value)}
              rows={4}
              className={`w-full resize-none rounded-xl border bg-bg-input py-2.5 px-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30 ${errors.message ? 'border-red-400' : 'border-border-gold'}`}
              placeholder="اكتب رسالتك هنا..."
            />
            {errors.message && (
              <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={12} />
                {errors.message}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={handleSendEmail}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-3 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              <Send size={16} />
              <span>إرسال عبر البريد</span>
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-green-600/30 bg-green-600/10 py-3 text-sm font-semibold text-green-400 transition-all hover:bg-green-600/20 active:scale-[0.98]"
            >
              <MessageCircle size={16} />
              <span>إرسال عبر واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
