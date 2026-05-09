import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, MapPin, Edit3, ChevronDown, ChevronUp, Award, Globe, Sparkles, Github, Linkedin, Camera } from 'lucide-react';
import { PersonalInfo, Skill, Language } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { getProfilePhotoUrl } from '../lib/cloudinary';

interface SidebarProps {
  personalInfo: PersonalInfo; skills: Skill[]; languages: Language[];
  onEditPersonalInfo: () => void; onEditSkills: () => void; onEditLanguages: () => void;
  onUploadPhoto?: () => void;
  isAdmin: boolean;
}

function SkillBar({ name, level }: { name: string; level: number }) {
  const [animated, setAnimated] = useState(false);
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{name}</span>
        <span className="text-xs text-accent">{level}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-primary">
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--theme-accent-dark), var(--theme-accent), var(--theme-accent-light))' }}
          initial={{ width: 0 }} animate={{ width: animated ? `${level}%` : 0 }} transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          onAnimationComplete={() => setAnimated(true)} onViewportEnter={() => setAnimated(true)} />
      </div>
    </div>
  );
}

function LanguageBadge({ name, level, displayLevel }: { name: string; level: string; displayLevel: string }) {
  const levelColors: Record<string, string> = {
    native: 'from-accent to-accent-light', advanced: 'from-accent-dark to-accent',
    intermediate: 'from-accent-dark/70 to-accent/70', beginner: 'from-accent-dark/50 to-accent/50',
  };
  return (
    <div className="flex items-center justify-between rounded-xl border border-border-gold bg-bg-primary/50 px-3 py-2">
      <div className="flex items-center gap-2"><Globe size={14} className="text-accent" /><span className="text-sm text-text-primary">{name}</span></div>
      <span className={`rounded-lg bg-gradient-to-l ${levelColors[level] || 'from-accent-dark to-accent'} px-2 py-0.5 text-xs font-semibold text-bg-primary`}>{displayLevel}</span>
    </div>
  );
}

function AccordionSection({ title, icon, children, onEdit, isAdmin, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; onEdit?: () => void; isAdmin?: boolean; defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <div className="flex cursor-pointer items-center justify-between rounded-xl border border-border-gold bg-bg-card/50 px-4 py-3 lg:cursor-default" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">{icon}<h3 className="font-cairo text-sm font-bold text-accent">{title}</h3></div>
        <div className="flex items-center gap-2">
          {onEdit && isAdmin && <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="no-print flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary transition-all hover:bg-accent/10 hover:text-accent"><Edit3 size={14} /></button>}
          <div className="lg:hidden">{isOpen ? <ChevronUp size={16} className="text-text-secondary" /> : <ChevronDown size={16} className="text-text-secondary" />}</div>
        </div>
      </div>
      <AnimatePresence>{isOpen && (<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"><div className="px-2 pt-3">{children}</div></motion.div>)}</AnimatePresence>
    </div>
  );
}

export default function Sidebar({ personalInfo, skills, languages, onEditPersonalInfo, onEditSkills, onEditLanguages, onUploadPhoto, isAdmin }: SidebarProps) {
  const { t, getLevelDisplay } = useLanguage();
  return (
    <aside className="w-full lg:w-80 xl:w-96">
      <div className="glass-card glow-gold mb-6 overflow-hidden rounded-2xl">
        <div className="h-2 bg-gradient-to-l from-accent-dark via-accent to-accent-light" />
        <div className="p-6">
          <div className="mb-4 flex justify-center">
            <div className="relative group">
              {personalInfo.photoUrl ? (
                <img src={getProfilePhotoUrl(personalInfo.photoUrl!, 96)} alt={personalInfo.name} className="h-24 w-24 rounded-full border-2 border-accent object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-accent bg-gradient-to-bl from-accent/20 to-accent-dark/20">
                  <span className="font-playfair text-3xl font-bold text-accent">{personalInfo.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute -bottom-1 -start-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-bg-primary bg-accent"><Sparkles size={14} className="text-bg-primary" /></div>
              {isAdmin && onUploadPhoto && (
                <button
                  onClick={onUploadPhoto}
                  title="Foto hochladen & zuschneiden"
                  className="no-print absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Camera size={22} className="text-white" />
                </button>
              )}
            </div>
          </div>
          <div className="mb-4 text-center">
            <h1 className="font-cairo text-xl font-bold text-text-primary">{personalInfo.name}</h1>
            <p className="mt-1 text-sm text-accent">{personalInfo.title}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border-gold bg-bg-primary/30 px-3 py-2"><Mail size={14} className="shrink-0 text-accent" /><span className="truncate text-xs text-text-secondary">{personalInfo.email}</span></div>
            <div className="flex items-center gap-3 rounded-xl border border-border-gold bg-bg-primary/30 px-3 py-2"><Phone size={14} className="shrink-0 text-accent" /><span className="text-xs text-text-secondary" dir="ltr">{personalInfo.phone}</span></div>
            <div className="flex items-center gap-3 rounded-xl border border-border-gold bg-bg-primary/30 px-3 py-2"><MapPin size={14} className="shrink-0 text-accent" /><span className="text-xs text-text-secondary">{personalInfo.address}</span></div>
            {personalInfo.github && <a href={personalInfo.github} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-xl border border-border-gold bg-bg-primary/30 px-3 py-2 transition-all hover:border-accent hover:text-accent"><Github size={14} className="shrink-0 text-accent" /><span className="truncate text-xs text-text-secondary">{personalInfo.github.replace(/^https?:\/\//, '')}</span></a>}
            {personalInfo.linkedin && <a href={personalInfo.linkedin} target="_blank" rel="noreferrer noopener" className="flex items-center gap-3 rounded-xl border border-border-gold bg-bg-primary/30 px-3 py-2 transition-all hover:border-accent hover:text-accent"><Linkedin size={14} className="shrink-0 text-accent" /><span className="truncate text-xs text-text-secondary">{personalInfo.linkedin.replace(/^https?:\/\//, '')}</span></a>}
          </div>
          {isAdmin && <button onClick={onEditPersonalInfo} className="no-print mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-bg-primary/30 px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"><Edit3 size={14} /><span>{t('sidebar.editPersonalInfo')}</span></button>}
        </div>
      </div>
      <AccordionSection title={t('sidebar.skills')} icon={<Award size={16} className="text-accent" />} onEdit={onEditSkills} isAdmin={isAdmin}>
        <div className="space-y-1">{skills.map((s) => <SkillBar key={s.id} name={s.name} level={s.level} />)}</div>
      </AccordionSection>
      <AccordionSection title={t('sidebar.languages')} icon={<Globe size={16} className="text-accent" />} onEdit={onEditLanguages} isAdmin={isAdmin}>
        <div className="space-y-2">{languages.map((l) => <LanguageBadge key={l.id} name={l.name} level={l.level} displayLevel={getLevelDisplay(l.level)} />)}</div>
      </AccordionSection>
    </aside>
  );
}
