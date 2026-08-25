// src/components/smarttrack/SmartQRCode.tsx
// Downloadable QR code for a smart link, with the ElimuX icon embedded

'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode } from 'lucide-react';

interface SmartQRCodeProps {
  url: string;
  size?: number;
  title?: string;
}

export default function SmartQRCode({ url, size = 200, title = 'Scan to view' }: SmartQRCodeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const downloadQR = () => {
    const svg = document.getElementById('smart-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `elimux-qr-${Date.now()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <QrCode size={16} />
        {title}
      </div>
      <div className="p-3 bg-white rounded-lg">
        <QRCodeSVG
          id="smart-qr-code"
          value={url}
          size={size}
          level="H"
          marginSize={4}
          imageSettings={{
            src: '/icon-192x192.png',
            height: 30,
            width: 30,
            excavate: true,
          }}
        />
      </div>
      <button
        onClick={downloadQR}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all"
      >
        <Download size={14} />
        Download PNG
      </button>
    </div>
  );
}
