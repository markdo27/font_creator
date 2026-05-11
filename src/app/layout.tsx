import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

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
    <html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="bg-void text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
