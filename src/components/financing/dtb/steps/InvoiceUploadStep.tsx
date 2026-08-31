'use client';

import { useState, useRef } from 'react';

interface InvoiceUploadStepProps {
  onNext: (fileName: string) => void;
  onBack: () => void;
}

export function InvoiceUploadStep({ onNext, onBack }: InvoiceUploadStepProps) {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setFileName(file.name);
    setUploaded(true);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary">
        DTB pays the school directly against this invoice. It must be for the current academic year.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          uploaded
            ? 'border-green-500 bg-green-500/5'
            : 'border-border hover:border-foreground hover:bg-muted'
        }`}
      >
        {uploaded ? (
          <>
            <svg className="w-8 h-8 mx-auto mb-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p className="text-sm text-secondary">Upload complete</p>
            <p className="text-xs text-tertiary mt-1">{fileName}</p>
          </>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto mb-2 text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p className="text-sm text-secondary">Tap to upload invoice</p>
            <p className="text-xs text-tertiary mt-1">PDF, JPG, or PNG — max 5MB</p>
          </>
        )}
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext(fileName)}
          disabled={!uploaded}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
