import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '../i18n';

/**
 * Pengambilan foto langsung dari kamera (wajib, bukan dari galeri).
 * Menampilkan preview live, menangkap ke canvas, mengompresi ke target ≤ 1 MB,
 * lalu memanggil onCapture dengan Blob JPEG.
 */
export function CameraCapture({
  onCapture,
  onCancel,
  submitting,
}: {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError(t('cam.cannotAccess'));
      } finally {
        setStarting(false);
      }
    }
    start();
    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    let quality = 0.85;
    let blob: Blob | null = null;
    for (let i = 0; i < 6; i++) {
      blob = dataUrlToBlob(canvas.toDataURL('image/jpeg', quality));
      if (blob.size <= 1024 * 1024) break;
      quality -= 0.15;
    }
    if (blob) {
      setPreview(URL.createObjectURL(blob));
      stopStream();
    }
  }, [stopStream]);

  const retake = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setError(null);
    setStarting(true);
    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch(() => setError(t('cam.cannotAccessRetake')))
      .finally(() => setStarting(false));
  }, [preview]);

  const submit = useCallback(() => {
    if (preview) {
      fetch(preview)
        .then((r) => r.blob())
        .then((blob) => onCapture(blob));
    }
  }, [preview, onCapture]);

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!preview ? (
        <div className="overflow-hidden rounded-xl bg-black">
          <video ref={videoRef} playsInline muted className="aspect-[4/3] w-full object-cover" />
          {starting && (
            <div className="flex items-center justify-center py-8 text-sm text-white/70">
              {t('cam.starting')}
            </div>
          )}
        </div>
      ) : (
        <img
          src={preview}
          alt="Pratinjau absen"
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          <X className="size-4" />
          {t('common.cancel')}
        </Button>
        {!preview ? (
          <Button onClick={capture} disabled={starting || !!error}>
            <Camera className="size-4" />
            {t('cam.takePhoto')}
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button variant="outline" onClick={retake} disabled={submitting}>
              <RotateCcw className="size-4" />
              {t('cam.retake')}
            </Button>
            <Button onClick={submit} disabled={submitting}>
              <Send className="size-4" />
              {submitting ? t('common.sending') : t('cam.sendAttendance')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bin = atob(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}