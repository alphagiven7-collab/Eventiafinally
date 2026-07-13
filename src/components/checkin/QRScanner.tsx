'use client';

import { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const html5QrCode = new Html5Qrcode(ref.current.id);
      html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        onScanSuccess
      ).catch(console.error);
      
      return () => {
        html5QrCode.stop().catch(console.error);
      };
    }
  }, [onScanSuccess]);

  return <div id="qr-reader" ref={ref} className="w-full" />;
}