import React from 'react';
import { BookOpen, Github, Twitter, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export default function Footer() {
  const { showNotification } = useNotification();

  const handlePlaceholder = (feature) => {
    showNotification(`${feature} is coming soon! We're building it for you.`, "info");
  };
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-24 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">The Open Syllabus</span>
            </Link>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              A student-led initiative to provide frictionless access to academic resources. 
              No points, no karma, just pure information sharing for the benefit of all.
            </p>
            <div className="flex items-center space-x-4">
              <button onClick={() => handlePlaceholder('Twitter')} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Twitter className="h-5 w-5" />
              </button>
              <button onClick={() => handlePlaceholder('Github')} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Github className="h-5 w-5" />
              </button>
              <button onClick={() => handlePlaceholder('Support')} className="text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Mail className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">Platform</h4>
            <ul className="space-y-4">
              <li><Link to="/" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Browse Courses</Link></li>
              <li><Link to="/discussions" className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Discussions</Link></li>
              <li><button onClick={() => handlePlaceholder('Upload')} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Upload Material</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6">Community</h4>
            <ul className="space-y-4">
              <li><button onClick={() => handlePlaceholder('About')} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">About Us</button></li>
              <li><button onClick={() => handlePlaceholder('Guidelines')} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Guidelines</button></li>
              <li><button onClick={() => handlePlaceholder('Support')} className="text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm transition-colors">Support</button></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 dark:text-slate-500 text-xs">
            © {new Date().getFullYear()} The Open Syllabus. Built for students, by students.
          </p>
          <div className="flex items-center space-x-6 text-xs text-slate-400 dark:text-slate-500">
            <button onClick={() => handlePlaceholder('Privacy')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</button>
            <button onClick={() => handlePlaceholder('Terms')} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
