'use client';

import { useEffect } from 'react';

export default function RedirectToStatic() {
  useEffect(() => {
    window.location.replace('/static-invitation.html');
  }, []);
  
  return null;
}