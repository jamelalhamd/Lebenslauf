import { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Upload, RotateCcw, Check, X, SunMedium, Contrast, Droplets } from 'lucide-react';
import { getCroppedImage, type CropArea, type ImageAdjustments } from '../lib/cropImage';

interface Props {
  isOpen: boolean;
  currentPhoto?: string;
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

const DEFAULT_ADJ: ImageAdjustments = { brightness: 100, contrast: 100, saturation: 100 };

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

export default function PhotoCropModal({ isOpen, currentPhoto, onSave, onClose }: Props) {
  const [rawImage, setRawImage] = useState<string | null>(currentPhoto || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [adj, setAdj] = useState<ImageAdjustments>(DEFAULT_ADJ);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: unknown, area: CropArea) => {
    setCroppedAreaPixels(area);
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    setSaving(true);
    try {
      const result = await getCroppedImage(rawImage, croppedAreaPixels, adj, 500);
      onSave(result);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setAdj(DEFAULT_ADJ);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

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
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-text-secondary transition-all hover:bg-bg-card hover:text-accent">
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
                onClick={() => fileRef.current?.click()}
                className="flex h-full w-full flex-col items-center justify-center gap-3 text-text-secondary transition-all hover:text-accent"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-current">
                  <Upload size={24} />
                </div>
                <span className="text-sm">Foto auswählen oder hierher ziehen</span>
                <span className="text-xs opacity-60">JPG, PNG, WEBP · max 5 MB</span>
              </button>
            )}
          </div>

          <div className="space-y-5 px-5 py-5">
            {/* Upload / Replace */}
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 py-2 text-sm text-accent transition-all hover:border-accent hover:bg-accent/10"
              >
                <Upload size={14} />
                {rawImage ? 'Anderes Foto wählen' : 'Foto hochladen'}
              </button>
              {rawImage && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded-xl border border-border-gold px-3 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"
                  title="Anpassungen zurücksetzen"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

            {rawImage && (
              <>
                {/* Zoom */}
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
                    <Slider
                      label="Helligkeit"
                      icon={<SunMedium size={13} />}
                      value={adj.brightness}
                      onChange={v => setAdj(a => ({ ...a, brightness: v }))}
                    />
                    <Slider
                      label="Kontrast"
                      icon={<Contrast size={13} />}
                      value={adj.contrast}
                      onChange={v => setAdj(a => ({ ...a, contrast: v }))}
                    />
                    <Slider
                      label="Sättigung"
                      icon={<Droplets size={13} />}
                      value={adj.saturation}
                      onChange={v => setAdj(a => ({ ...a, saturation: v }))}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-border-gold px-5 py-4">
          <button
            onClick={handleSave}
            disabled={!rawImage || saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-accent to-accent-dark py-2.5 text-sm font-semibold text-bg-primary transition-all hover:shadow-lg hover:shadow-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
            ) : (
              <Check size={15} />
            )}
            {saving ? 'Wird gespeichert…' : 'Foto speichern'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-border-gold py-2.5 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
