import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, AlertCircle, LogIn, Shield, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!email.trim()) { setError(t('login.emailRequired')); return; }
    if (!password.trim()) { setError(t('login.passwordRequired')); return; }
    const success = await login(email, password);
    if (success) navigate('/');
    else { setError(t('login.error')); setIsShaking(true); setTimeout(() => setIsShaking(false), 500); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" dir={dir}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-accent/[0.04] blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[120px]" />
      </div>
      <div className="fixed start-4 top-4 z-50 flex items-center gap-2">
        <LanguageSwitcher />
        <button onClick={toggleTheme} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-gold bg-bg-secondary/80 text-text-secondary backdrop-blur-sm transition-all hover:border-accent hover:text-accent">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative z-10 w-full max-w-md" style={isShaking ? { animation: 'shake 0.5s ease-in-out' } : {}}>
        <div className="glass-card glow-gold overflow-hidden rounded-3xl">
          <div className="h-1.5 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
          <div className="p-8 sm:p-10">
            <div className="mb-8 flex flex-col items-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl border border-accent/20 bg-accent/5"><Shield size={36} className="text-accent" /></div>
              <h1 className="mb-2 font-cairo text-2xl font-bold text-text-primary">{t('login.title')}</h1>
              <p className="text-sm text-text-secondary">{t('login.subtitle')}</p>
            </div>
            {error && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3"><AlertCircle size={16} className="shrink-0 text-red-400" /><span className="text-sm text-red-400">{error}</span></motion.div>}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('login.email')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-border-gold bg-bg-input py-3 ps-10 pe-4 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="you@example.com" dir="ltr" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-secondary">{t('login.password')}</label>
                <div className="relative">
                  <Lock size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-border-gold bg-bg-input py-3 ps-10 pe-12 text-sm text-text-primary placeholder:text-text-secondary/40 transition-all focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="••••••••" dir="ltr" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-1/2 -translate-y-1/2 text-text-secondary/50 transition-all hover:text-accent">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                </div>
              </div>
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-3.5 text-sm font-bold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/25 active:scale-[0.98]"><LogIn size={18} /><span>{t('login.submit')}</span></button>
            </form>
          </div>
        </div>
        <div className="mt-6 text-center"><button onClick={() => navigate('/')} className="text-sm text-text-secondary transition-all hover:text-accent">← {t('login.back')}</button></div>
      </motion.div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-4px)} 20%,40%,60%,80%{transform:translateX(4px)} }`}</style>
    </div>
  );
}
