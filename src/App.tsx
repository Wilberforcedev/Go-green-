import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import WhatsAppButton from './components/Layout/WhatsAppButton';
import { AuthProvider } from './contexts/AuthProvider';

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Team = lazy(() => import('./pages/Team'));
const Services = lazy(() => import('./pages/Services'));
const Campaigns = lazy(() => import('./pages/Campaigns'));
const Blog = lazy(() => import('./pages/Blog'));
const Contact = lazy(() => import('./pages/Contact'));
const ImpactHub = lazy(() => import('./pages/ImpactHub'));

const pagePaths: Record<string, string> = {
  home: '/', about: '/about', team: '/team', services: '/services',
  campaigns: '/campaigns', blog: '/blog', contact: '/contact', impact: '/impact',
};
const pageMeta: Record<string, { title: string; description: string }> = {
  '/': { title: 'Grin Mates | Community environmental action', description: 'Join community environmental activities, connect with local organizers, and track verified participation with Grin Mates.' },
  '/about': { title: 'About | Grin Mates', description: 'Learn about Grin Mates and its community environmental work.' },
  '/team': { title: 'Our Team | Grin Mates', description: 'Meet the people behind Grin Mates.' },
  '/services': { title: 'Services | Grin Mates', description: 'Explore environmental services and community programmes from Grin Mates.' },
  '/campaigns': { title: 'Campaigns | Grin Mates', description: 'Explore Grin Mates environmental campaigns and request current progress updates.' },
  '/blog': { title: 'Green Voices | Grin Mates', description: 'Read stories and updates from the Grin Mates community.' },
  '/contact': { title: 'Contact | Grin Mates', description: 'Contact the Grin Mates team.' },
  '/impact': { title: 'Impact Hub | Grin Mates', description: 'Find community activities, register to participate, and track verified participation.' },
};

function SiteLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const meta = pageMeta[location.pathname] ?? pageMeta['/'];
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', meta.title);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', meta.description);
  }, [location.pathname]);

  const currentPage = Object.entries(pagePaths).find(([, path]) => path === location.pathname)?.[0] ?? '';
  const handleNavigate = (page: string) => navigate(pagePaths[page] ?? '/');

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-900">
      <Header currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="pt-20">
        <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-16 text-slate-600">Loading page…</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/team" element={<Team />} />
            <Route path="/services" element={<Services />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/impact" element={<ImpactHub />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider><SiteLayout /></AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
