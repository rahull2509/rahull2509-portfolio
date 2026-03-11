import { Poppins, Inter } from 'next/font/google';
import Providers from '../src/providers/Providers';
import SmoothScroller from '../src/components/SmoothScroller';
import HydrationGate from '../src/components/HydrationGate';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata = {
  title: 'Rahul Gangwar - Full-Stack Developer | Portfolio',
  description:
    'Rahul Gangwar - Full-Stack Developer specializing in React.js, Next.js, Node.js, and MongoDB/PostgreSQL',
  keywords:
    'Full-Stack Developer, React.js, Next.js, Node.js, MongoDB, PostgreSQL, JavaScript, TypeScript',
  authors: [{ name: 'Rahul Gangwar' }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <HydrationGate />
        <SmoothScroller>
          <Providers>{children}</Providers>
        </SmoothScroller>
      </body>
    </html>
  );
}
