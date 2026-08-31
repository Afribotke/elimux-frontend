'use client';

import { useState } from 'react';

interface SchoolStudentStepProps {
  schoolName: string;
  defaultStudentName: string;
  onNext: (data: { studentName: string; admissionNo: string; eduLevel: string }) => void;
  onBack: () => void;
}

export function SchoolStudentStep({ schoolName, defaultStudentName, onNext, onBack }: SchoolStudentStepProps) {
  const [studentName, setStudentName] = useState(defaultStudentName);
  const [admissionNo, setAdmissionNo] = useState('');
  const [eduLevel, setEduLevel] = useState('Secondary School');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">School name</label>
        <input
          type="text"
          value={schoolName}
          readOnly
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-tertiary text-base"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Student full name</label>
        <input
          type="text"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Admission / registration number</label>
        <input
          type="text"
          value={admissionNo}
          onChange={(e) => setAdmissionNo(e.target.value)}
          placeholder="e.g. ADM/2026/0042"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Education level</label>
        <select
          value={eduLevel}
          onChange={(e) => setEduLevel(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-base outline-none focus:border-foreground"
        >
          <option>Pre-primary</option>
          <option>Primary School</option>
          <option>Secondary School</option>
          <option>University / College</option>
        </select>
      </div>

      <div className="flex gap-2.5 pt-2">
        <button
          onClick={onBack}
          className="px-4 py-3 rounded-xl border border-border bg-muted text-foreground font-medium text-base hover:bg-muted/80 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onNext({ studentName, admissionNo, eduLevel })}
          className="flex-1 py-3 rounded-xl bg-foreground text-background font-medium text-base hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
