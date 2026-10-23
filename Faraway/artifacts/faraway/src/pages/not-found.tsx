import { Link } from 'wouter';
import { Compass } from 'lucide-react';
import { SpectrumIcon } from '@/components/spectrum';

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center" data-testid="page-not-found">
      <div>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border bg-white shadow-md"><SpectrumIcon icon={Compass} size={36} /></div>
        <p className="eyebrow mt-6">404 · off the map</p>
        <h1 className="mt-2 font-display text-5xl">No bearing here.</h1>
        <p className="mt-3 text-muted-foreground">This page drifted too far away.</p>
        <Link href="/" className="btn-ink mt-8" data-testid="link-home">Back to workspace</Link>
      </div>
    </div>
  );
}
