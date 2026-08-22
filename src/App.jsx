import { AnimatePresence, motion } from 'motion/react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import AIHelper from './components/AIHelper';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { StudyModeProvider, useStudyMode } from './contexts/StudyModeContext';
import { ThemeProvider } from './contexts/ThemeContext';
import CourseHub from './pages/CourseHub';
import Discussions from './pages/Discussions';
import Friends from './pages/Friends';
import Home from './pages/Home';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="w-full h-full"
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/course/:courseId" element={<CourseHub />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { isStudyMode } = useStudyMode();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-300">
      <Navbar />

      <AnimatePresence>
        {isStudyMode && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-500 text-white py-1 px-4 text-center text-[10px] font-black uppercase tracking-[0.3em] z-[100] sticky top-0"
          >
            Study Mode Active • Focus Mode On
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <AnimatedRoutes />
      </main>

      <Footer />
      <AIHelper />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <StudyModeProvider>
        <AuthProvider>
          <NotificationProvider>
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </NotificationProvider>
        </AuthProvider>
      </StudyModeProvider>
    </ThemeProvider>
  );
}
