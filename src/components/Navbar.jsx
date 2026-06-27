import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, LogIn, LogOut, User, Sun, Moon, Palette, Check, Download, Coffee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useStudyMode } from '../contexts/StudyModeContext';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, login, logout, isLoggingIn } = useAuth();
  const { theme, variant, toggleTheme, changeVariant } = useTheme();
  const { isStudyMode, toggleStudyMode } = useStudyMode();
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  const themeOptions = [
    { id: 'midnight', name: 'Midnight', color: 'bg-slate-950' },
    { id: 'ocean', name: 'Ocean', color: 'bg-sky-900' },
    { id: 'forest', name: 'Forest', color: 'bg-emerald-900' },
    { id: 'purple', name: 'Purple', color: 'bg-purple-900' },
    { id: 'slate', name: 'Slate', color: 'bg-slate-900' },
  ];

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">The Open Syllabus</span>
          </Link>
          
          <div className="flex items-center space-x-4 md:space-x-8">
            <Link to="/" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Browse Courses</Link>
            <Link to="/discussions" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Discussions</Link>
            <Link to="/friends" className="hidden md:block text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Friends</Link>
            
            {deferredPrompt && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleInstall}
                className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all border border-indigo-100 dark:border-indigo-800"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install App</span>
              </motion.button>
            )}

            <div className="relative flex items-center space-x-2">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleStudyMode}
                className={`p-2 transition-colors rounded-xl relative overflow-hidden ${
                  isStudyMode 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                title={isStudyMode ? "Disable Study Mode" : "Enable Study Mode"}
              >
                <Coffee className={`h-5 w-5 ${isStudyMode ? 'animate-pulse' : ''}`} />
              </motion.button>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsThemePickerOpen(!isThemePickerOpen)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 relative overflow-hidden"
                aria-label="Open Theme Picker"
              >
                <Palette className="h-5 w-5" />
              </motion.button>

              <AnimatePresence>
                {isThemePickerOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsThemePickerOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-3 z-50 space-y-2"
                    >
                      <button
                        onClick={() => {
                          toggleTheme();
                          setIsThemePickerOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                            {theme === 'light' ? <Sun className="h-3 w-3 text-amber-500" /> : <Moon className="h-3 w-3 text-slate-400" />}
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                          </span>
                        </div>
                      </button>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                        <p className="px-2 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Dark Themes</p>
                        <div className="grid grid-cols-1 gap-1">
                          {themeOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => {
                                changeVariant(opt.id);
                                setIsThemePickerOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${variant === opt.id && theme === 'dark' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`h-6 w-6 ${opt.color} rounded-full border border-white/20`} />
                                <span className={`text-xs font-bold ${variant === opt.id && theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {opt.name}
                                </span>
                              </div>
                              {variant === opt.id && theme === 'dark' && (
                                <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-2 group">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full border border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 transition-colors" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <User className="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600" />
                    </div>
                  )}
                  <span className="hidden sm:block text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{user.displayName?.split(' ')[0]}</span>
                </Link>
                <button onClick={logout} className="p-2 text-slate-400 hover:text-rose-600 transition-colors rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20" title="Sign Out">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={login}
                disabled={isLoggingIn}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? (
                  <span className="animate-pulse">Signing In...</span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
