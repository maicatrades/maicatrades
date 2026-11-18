"use client";
import {useEffect, useState} from 'react';
export default function ReadOnlyPreviewNotice() {
  const [active, setActive] = useState(false);
  useEffect(() => {
    let mounted = true;
    fetch('/api/preview-status', {cache: 'no-store'})
      .then(response => response.ok ? response.json() : null)
      .then(result => {if (mounted) setActive(result?.readOnlyPreview === true);})
      .catch(() => {});
    return () => {mounted = false;};
  }, []);
  if (!active) return null;
  return <aside role="status" className="border-b border-amber-500/30 bg-amber-950 px-4 py-2 text-center text-sm text-amber-200">
    Read-only preview · Market-record writes blocked. Scores may be provisional calculations; saved Trade Ideas are recorded snapshots.
  </aside>;
}
