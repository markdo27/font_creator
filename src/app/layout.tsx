import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fontify — Image to Font Creator',
  description: 'Upload a handwritten character sheet and export a real .ttf font file — entirely in your browser, no server required.',
  keywords: ['font creator', 'image to font', 'handwriting font', 'ttf generator', 'character segmentation'],
  openGraph: {
    title: 'Fontify',
    description: 'Turn your handwriting into a real font.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-void text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
