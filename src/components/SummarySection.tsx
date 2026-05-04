import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Edit3, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface SummarySectionProps { bio: string; onEdit: () => void; isAdmin: boolean; }

export default function SummarySection({ bio, onEdit, isAdmin }: SummarySectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t } = useLanguage();
  return (
    <div className="glass-card glow-gold mb-6 overflow-hidden rounded-2xl">
      <div className="flex cursor-pointer items-center justify-between border-b border-border-gold px-6 py-4 lg:cursor-default" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10"><FileText size={18} className="text-accent" /></div>
          <h2 className="font-cairo text-lg font-bold text-text-primary">{t('summary.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="no-print flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all hover:bg-accent/10 hover:text-accent"><Edit3 size={15} /></button>}
          <div className="lg:hidden">{isOpen ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}</div>
        </div>
      </div>
      <AnimatePresence>{isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"><div className="px-6 py-5"><p className="leading-relaxed text-text-secondary">{bio}</p></div></motion.div>)}</AnimatePresence>
    </div>
  );
}
