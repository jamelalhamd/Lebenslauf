import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, RotateCcw, Check, X, SunMedium, Contrast, Droplets, Trash2, AlertCircle } from 'lucide-react';
import { getCroppedImage, type CropArea, type ImageAdjustments } from '../lib/cropImage';
import { uploadPhotoToCloudinary } from '../lib/cloudinary';

interface Props {
  isOpen: boolean;
  currentPhoto?: string;
  onSave: (url: string) => void;
  onClose: () => void;
  onDeletePhoto?: () => void;
}

const DEFAULT_ADJ: ImageAdjustments = { brightness: 100, contrast: 100, saturation: 100 };

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;

function Slider({
  label, icon, value, min = 0, max = 200, onChange,
}: {
  label: string; icon: React.ReactNode; value: number; min?: number; max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">{icon}{label}</span>
        <span className="font-mono text-accent">{value}%</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-bg-primary accent-accent"
      />
    </div>
  );
}

export default function PhotoCropModal({ isOpen, currentPhoto, onSave, onClose, onDeletePhoto }: Props) {
  const [rawImage, setRawImage] = useState<string | null>(currentPhoto || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [adj, setAdj] = useState<ImageAdjustments>(DEFAULT_ADJ);
  const [uploadStep, setUploadStep] = useState<null | 'cropping' | 'uploading'>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: unknown, area: CropArea) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Ungültiger Dateityp. Nur JPG, PNG, WebP oder GIF erlaubt.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Datei zu groß. Maximale Größe: ${MAX_SIZE_MB} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setRawImage(ev.target?.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setAdj(DEFAULT_ADJ);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    setError(null);
    setUploadStep('cropping');
    try {
      const base64 = await getCroppedImage(rawImage, croppedAreaPixels, adj, 500);
      setUploadStep('uploading');
      const remoteUrl = await uploadPhotoToCloudinary(base64);
      onSave(remoteUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setUploadStep(null);
    }
  };

  const handleDelete = () => {
    if (onDeletePhoto) onDeletePhoto();
    onClose();
  };

  const reset = () => {
    setAdj(DEFAULT_ADJ);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const isBusy = uploadStep !== null;
  const stepLabel = uploadStep === 'cropping' ? 'Wird zugeschnitten…' : uploadStep === 'uploading' ? 'Wird hochgeladen…' : '';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}>
      <div
        className="glass-card flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border-gold shadow-2xl"
        style={{ backgroundColor: 'var(--theme-bg-secondary)', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-gold px-5 py-4">
          <h2 className="font-cairo text-base font-bold text-text-primary">Profilfoto hochladen</h2>
          <button type="button" onClick={onClose} disabled={isBusy} aria-label="Schließen" className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary transition-all hover:bg-bg-card hover:text-accent disabled:opacity-40">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Crop area */}
          <div className="relative bg-black" style={{ height: 300 }}>
            {rawImage ? (
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { background: '#0a0a0a' },
                  mediaStyle: {
                    filter: `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`,
                  },
                }}
              />
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-3 text-text-secondary transition-all hover:text-accent"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-current">
                  <Upload size={24} />
                </div>
                <span className="text-sm">Foto auswählen oder hierher ziehen</span>
                <span className="text-xs opacity-60">JPG, PNG, WebP · max {MAX_SIZE_MB} MB</span>
              </button>
            )}

            {/* Upload progress overlay */}
            {isBusy && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
                <span className="text-sm text-white">{stepLabel}</span>
              </div>
            )}
          </div>

          <div className="space-y-5 px-5 py-5">
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                <AlertCircle size={14} className="shrink-0 text-red-400" />
                <span className="text-xs text-red-400">{error}</span>
              </div>
            )}

            {/* Upload / Replace */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 py-2 text-sm text-accent transition-all hover:border-accent hover:bg-accent/10 disabled:opacity-40"
              >
                <Upload size={14} />
                {rawImage ? 'Anderes Foto wählen' : 'Foto hochladen'}
              </button>
              {rawImage && (
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-xl border border-border-gold px-3 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent disabled:opacity-40"
                  title="Anpassungen zurücksetzen"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} aria-hidden="true" tabIndex={-1} className="hidden" />

            {rawImage && (
              <>
                <Slider
                  label="Zoom"
                  icon={null}
                  value={Math.round(zoom * 100)}
                  min={100}
                  max={300}
                  onChange={v => setZoom(v / 100)}
                />
                <div className="border-t border-border-gold pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-secondary">Bildanpassungen</p>
                  <div className="space-y-3">
                    <Slider label="Helligkeit" icon={<SunMedium size={13} />} value={adj.brightness} onChange={v => setAdj(a => ({ ...a, brightness: v }))} />
                    <Slider label="Kontrast" icon={<Contrast size={13} />} value={adj.contrast} onChange={v => setAdj(a => ({ ...a, contrast: v }))} />
                    <Slider label="Sättigung" icon={<Droplets size={13} />} value={adj.saturation} onChange={v => setAdj(a => ({ ...a, saturation: v }))} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border-gold px-5 py-4">
          {onDeletePhoto && currentPhoto && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm text-red-400 transition-all hover:bg-red-500/15 disabled:opacity-40"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Löschen</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!rawImage || isBusy}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-2.5 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
              : <Check size={15} />}
            {isBusy ? stepLabel : 'Foto speichern'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 rounded-xl border border-border-gold py-2.5 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent disabled:opacity-40"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
