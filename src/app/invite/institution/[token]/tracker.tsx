'use client';

import { useEffect } from 'react';

export default function InviteTracker({ token }: { token: string }) {
  useEffect(() => {
    // Fire tracking ping
    fetch(`/api/invites/institution/${token}/track`, { method: 'POST' }).catch(() => {
      // Silent fail — don't block the page
    });
  }, [token]);

  return null;
}
