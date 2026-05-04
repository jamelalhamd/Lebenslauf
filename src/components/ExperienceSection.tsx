import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, Edit3, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Experience } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ExperienceSectionProps { experiences: Experience[]; onEdit: (e: Experience) => void; onAdd: () => void; onDelete: (id: string) => void; isAdmin: boolean; }

export default function ExperienceSection({ experiences, onEdit, onAdd, onDelete, isAdmin }: ExperienceSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { t, formatDate } = useLanguage();

  return (
    <div className="glass-card glow-gold mb-6 overflow-hidden rounded-2xl">
      <div className="flex cursor-pointer items-center justify-between border-b border-border-gold px-6 py-4 lg:cursor-default" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10"><Briefcase size={18} className="text-accent" /></div>
          <h2 className="font-cairo text-lg font-bold text-text-primary">{t('experience.title')}</h2>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className="no-print flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all hover:bg-accent/10 hover:text-accent"><Plus size={15} /></button>}
          <div className="lg:hidden">{isOpen ? <ChevronUp size={18} className="text-text-secondary" /> : <ChevronDown size={18} className="text-text-secondary" />}</div>
        </div>
      </div>
      <AnimatePresence>{isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
        <div className="px-6 py-5">
          <div className="relative">
            <div className="absolute start-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-accent via-accent/50 to-transparent" />
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative ps-6">
                  <div className="absolute start-0 top-2 h-[15px] w-[15px] rounded-full border-2 border-accent bg-bg-primary" />
                  <div className="group rounded-xl border border-border-gold bg-bg-primary/30 p-4 transition-all hover:border-accent/30">
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div><h3 className="font-cairo text-base font-bold text-text-primary">{exp.position}</h3><p className="text-sm text-accent">{exp.company}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-accent/10 px-2 py-1 text-xs text-accent" dir="ltr">{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</span>
                        {isAdmin && (<>
                          <button onClick={() => onEdit(exp)} className="no-print flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary opacity-0 transition-all group-hover:opacity-100 hover:bg-accent/10 hover:text-accent"><Edit3 size={13} /></button>
                          <button onClick={() => onDelete(exp.id)} className="no-print flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary opacity-0 transition-all group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"><Trash2 size={13} /></button>
                        </>)}
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed text-text-secondary">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>)}</AnimatePresence>
    </div>
  );
}
