import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; }

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message }: ConfirmDialogProps) {
  return (
    <AnimatePresence>{isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm rounded-2xl border border-border-gold bg-bg-secondary p-6 shadow-2xl">
          <button onClick={onClose} className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-all hover:text-accent"><X size={16} /></button>
          <div className="mb-4 flex justify-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10"><AlertTriangle size={28} className="text-red-400" /></div></div>
          <h3 className="mb-2 text-center font-cairo text-lg font-bold text-text-primary">{title}</h3>
          <p className="mb-6 text-center text-sm text-text-secondary">{message}</p>
          <div className="flex gap-3">
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30">نعم، حذف</button>
            <button onClick={onClose} className="flex-1 rounded-xl border border-border-gold py-2.5 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent">إلغاء</button>
          </div>
        </motion.div>
      </motion.div>
    )}</AnimatePresence>
  );
}
