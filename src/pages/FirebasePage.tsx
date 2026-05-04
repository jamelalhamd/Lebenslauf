import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Database, Trash2, CheckCircle,
  Upload, Cloud, RefreshCw, AlertCircle,
  Sun, Moon, Flame, CloudOff, Download
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { FIREBASE_CONFIG, FirebaseConfig } from '../lib/firebase';
import { loadFromFirestore, saveToFirestore } from '../lib/firestore';
import { loadCVData, saveCVData } from '../store';
import { defaultCVData } from '../data';
import { migrateLevel } from '../i18n/translations';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function FirebasePage() {
  const { isAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, dir } = useLanguage();
  const { connected, config, reconnect, lastSync } = useFirebase();
  const navigate = useNavigate();

  const [syncStatus, setSyncStatus] = useState<'idle' | 'uploading' | 'downloading' | 'success' | 'error'>('idle');

  if (!isAdmin) {
    navigate('/login');
    return null;
  }

  const handleUpload = async () => {
    setSyncStatus('uploading');
    const localData = loadCVData();
    const ok = await saveToFirestore(localData);
    setSyncStatus(ok ? 'success' : 'error');
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleDownload = async () => {
    setSyncStatus('downloading');
    const remoteData = await loadFromFirestore();
    if (remoteData) {
      saveCVData(remoteData);
      setSyncStatus('success');
      setTimeout(() => { setSyncStatus('idle'); window.location.reload(); }, 1500);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  const handleResetLocal = () => {
    if (confirm('Are you sure? This will reset all local data to defaults.')) {
      saveCVData({ ...defaultCVData, languages: defaultCVData.languages.map(l => ({ ...l, level: migrateLevel(l.level) })) });
      window.location.reload();
    }
  };

  const configFields: { key: keyof FirebaseConfig; label: string }[] = [
    { key: 'apiKey', label: 'API Key' },
    { key: 'authDomain', label: 'Auth Domain' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'storageBucket', label: 'Storage Bucket' },
    { key: 'messagingSenderId', label: 'Sender ID' },
    { key: 'appId', label: 'App ID' },
  ];

  return (
    <div className="min-h-screen bg-bg-primary" dir={dir}>
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full bg-accent/[0.03] blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-accent/[0.02] blur-[100px]" />
      </div>

      <nav className="sticky top-0 z-40 border-b border-border-gold backdrop-blur-xl" style={{ backgroundColor: 'var(--theme-nav-bg)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-text-secondary transition-all hover:text-accent">
            <ArrowRight size={18} /><span>العودة</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="font-cairo text-base font-bold text-text-primary flex items-center gap-2">
              <Flame size={18} className="text-orange-400" /> Firebase
            </h1>
            <LanguageSwitcher />
            <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-gold text-text-secondary transition-all hover:border-accent hover:text-accent">
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-400/20 bg-orange-400/5">
                <Flame size={32} className="text-orange-400" />
              </div>
            </div>
            <h2 className="mb-2 font-cairo text-2xl font-bold text-text-primary">Firebase Integration</h2>
            <p className="text-sm text-text-secondary">Your CV data is synced with Firebase Cloud Firestore</p>
          </div>

          {/* Connection Status */}
          <div className="glass-card mb-6 overflow-hidden rounded-2xl">
            <div className={`h-1.5 ${connected ? 'bg-gradient-to-l from-green-500 to-green-400' : 'bg-gradient-to-l from-red-500/50 to-red-400/50'}`} />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {connected ? (
                    <><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10"><Cloud size={24} className="text-green-400" /></div><div><p className="font-cairo text-sm font-bold text-green-400">Connected to Firebase</p><p className="text-xs text-text-secondary">Project: <span className="text-accent font-mono">{config.projectId}</span></p></div></>
                  ) : (
                    <><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10"><CloudOff size={24} className="text-red-400" /></div><div><p className="font-cairo text-sm font-bold text-red-400">Not Connected</p><p className="text-xs text-text-secondary">Check your network connection</p></div></>
                  )}
                </div>
                {!connected && (
                  <button onClick={reconnect} className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2 text-xs text-accent transition-all hover:bg-accent/10">
                    <RefreshCw size={14} /> Reconnect
                  </button>
                )}
              </div>
              {lastSync && connected && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-500/5 px-3 py-2">
                  <CheckCircle size={12} className="text-green-400" />
                  <span className="text-[11px] text-green-400">Last sync: {lastSync.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sync Status */}
          {syncStatus === 'success' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
              <CheckCircle size={16} className="text-green-400" /><span className="text-sm text-green-400">Sync completed successfully!</span>
            </motion.div>
          )}
          {syncStatus === 'error' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <AlertCircle size={16} className="text-red-400" /><span className="text-sm text-red-400">Sync failed. Check your connection.</span>
            </motion.div>
          )}

          {/* Config Display */}
          <div className="glass-card mb-6 overflow-hidden rounded-2xl">
            <div className="h-1.5 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10"><Database size={18} className="text-accent" /></div>
                <div>
                  <h3 className="font-cairo text-base font-bold text-text-primary">Firebase Configuration</h3>
                  <p className="text-xs text-text-secondary">Current project settings</p>
                </div>
              </div>
              <div className="space-y-3">
                {configFields.map(f => (
                  <div key={f.key} className="flex items-center justify-between rounded-lg border border-border-gold bg-bg-primary/30 px-3 py-2">
                    <span className="text-xs text-text-secondary">{f.label}</span>
                    <span className="max-w-[60%] truncate font-mono text-xs text-accent" dir="ltr">{FIREBASE_CONFIG[f.key]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sync Controls */}
          <div className="glass-card mb-6 overflow-hidden rounded-2xl">
            <div className="h-1.5 bg-gradient-to-l from-blue-500 to-blue-400" />
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10"><Upload size={18} className="text-blue-400" /></div>
                <div>
                  <h3 className="font-cairo text-base font-bold text-text-primary">Data Synchronization</h3>
                  <p className="text-xs text-text-secondary">Auto-sync is active — changes save to both local & cloud</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border-gold bg-bg-primary/30 p-4">
                  <div className="mb-3 flex items-center gap-2"><Upload size={16} className="text-blue-400" /><span className="text-sm font-semibold text-text-primary">Upload to Cloud</span></div>
                  <p className="mb-4 text-xs text-text-secondary">Push local data to Firestore</p>
                  <button onClick={handleUpload} disabled={syncStatus === 'uploading'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 py-2.5 text-sm font-semibold text-blue-400 transition-all hover:bg-blue-500/20 disabled:opacity-50">
                    {syncStatus === 'uploading' ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />} Upload
                  </button>
                </div>
                <div className="rounded-xl border border-border-gold bg-bg-primary/30 p-4">
                  <div className="mb-3 flex items-center gap-2"><Download size={16} className="text-green-400" /><span className="text-sm font-semibold text-text-primary">Download from Cloud</span></div>
                  <p className="mb-4 text-xs text-text-secondary">Pull Firestore data to local</p>
                  <button onClick={handleDownload} disabled={syncStatus === 'downloading'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 py-2.5 text-sm font-semibold text-green-400 transition-all hover:bg-green-500/20 disabled:opacity-50">
                    {syncStatus === 'downloading' ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />} Download
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card overflow-hidden rounded-2xl">
            <div className="h-1.5 bg-gradient-to-l from-red-600 to-red-500" />
            <div className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10"><Trash2 size={18} className="text-red-400" /></div>
                <div>
                  <h3 className="font-cairo text-base font-bold text-text-primary">Danger Zone</h3>
                  <p className="text-xs text-text-secondary">Irreversible actions</p>
                </div>
              </div>
              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div><p className="text-sm font-semibold text-text-primary">Reset Local Data</p><p className="text-xs text-text-secondary">Restore default values</p></div>
                  <button onClick={handleResetLocal} className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-500/10"><Trash2 size={14} /> Reset</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
