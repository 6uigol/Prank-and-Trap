import { useEffect, useRef } from 'react';

export default function AdSense({ slot }: { slot: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      const timer = setTimeout(() => {
        if (containerRef.current && containerRef.current.offsetWidth > 0) {
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          } catch (e) {
            console.error("AdSense error", e);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-w-[300px] min-h-[90px] relative flex items-center justify-center bg-neutral-900 border border-neutral-800 overflow-hidden rounded-lg shadow-inner">
      <span className="absolute text-neutral-600 text-xs uppercase tracking-widest z-0">Advertisement</span>
      <ins className="adsbygoogle relative z-10 w-full h-full"
           style={{ display: 'block', minWidth: '300px', minHeight: '90px' }}
           data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT_ID || "ca-pub-XXXXXXXXXXXXXXXX"}
           data-ad-slot={slot}
           data-ad-format="auto"
           data-full-width-responsive="true">
      </ins>
    </div>
  );
}
