import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Book, FileText, MessageSquare, ArrowRight, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useNotification } from '../contexts/NotificationContext';

const POPULAR_COURSES = [
  { id: 'MATH101', name: 'Calculus I', files: 124, advice: 42 },
  { id: 'CS202', name: 'Data Structures', files: 89, advice: 31 },
  { id: 'ECON101', name: 'Macroeconomics', files: 156, advice: 56 },
  { id: 'PHYS101', name: 'General Physics', files: 78, advice: 24 },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/course/${searchQuery.toUpperCase()}`);
    }
  };

  const handleViewAll = () => {
    showNotification("We're indexing more courses! Stay tuned for the full directory.", "info");
  };

  return (
    <div className="space-y-24 relative overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Mouse Follower Glow */}
      <motion.div 
        className="pointer-events-none absolute -z-10 w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/5 blur-[120px] rounded-full"
        animate={{
          x: mousePos.x - 300,
          y: mousePos.y - 300,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
      />

      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 blur-[100px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -100, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/5 blur-[100px] rounded-full"
        />
      </div>

      {/* Hero Section */}
      <section className="text-center space-y-12 py-20 relative">
        {/* Floating Icons */}
        <div className="absolute inset-0 pointer-events-none hidden lg:block">
          <motion.div className="absolute top-10 left-[10%] animate-float" style={{ animationDelay: '0s' }}>
            <div className="p-4 glass rounded-2xl shadow-xl">
              <Book className="h-8 w-8 text-indigo-500" />
            </div>
          </motion.div>
          <motion.div className="absolute top-40 right-[15%] animate-float" style={{ animationDelay: '1s' }}>
            <div className="p-4 glass rounded-2xl shadow-xl">
              <FileText className="h-8 w-8 text-emerald-500" />
            </div>
          </motion.div>
          <motion.div className="absolute bottom-10 left-[20%] animate-float" style={{ animationDelay: '2s' }}>
            <div className="p-4 glass rounded-2xl shadow-xl">
              <MessageSquare className="h-8 w-8 text-amber-500" />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-6 relative z-10"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold tracking-widest uppercase mb-4 border border-indigo-100 dark:border-indigo-800">
            <Sparkles className="h-3 w-3" />
            <span>The Future of Learning</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-slate-900 dark:text-white leading-[0.9]">
            STUDY <br />
            <span className="text-indigo-600 dark:text-indigo-400 italic">SMARTER.</span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
            No points, no karma, no barriers. Just the materials you need, 
            curated by students who&apos;ve been there.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSearch}
          className="max-w-2xl mx-auto relative group z-10"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="pl-6">
              <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search Course Code (e.g., MATH101)..."
              className="block w-full px-6 py-6 bg-transparent text-lg dark:text-white transition-all outline-none placeholder-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="submit"
              className="mr-3 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
            >
              Go
            </button>
          </div>
        </motion.form>
      </section>

      {/* Popular Courses - Bento Grid Style */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">POPULAR HUBS</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Most active this week</p>
          </div>
          <button 
            onClick={handleViewAll}
            className="group flex items-center space-x-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all"
          >
            <span>EXPLORE ALL</span>
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {POPULAR_COURSES.map((course, idx) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -8, scale: 1.02 }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 * idx }}
              onClick={() => navigate(`/course/${course.id}`)}
              className={`p-8 rounded-[2rem] border transition-all cursor-pointer group relative overflow-hidden ${
                idx === 0 ? 'md:col-span-2 md:row-span-2 bg-indigo-600 text-white border-indigo-500' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-0 right-0 p-12 opacity-10">
                  <TrendingUp className="h-48 w-48" />
                </div>
              )}
              <div className="h-full flex flex-col justify-between space-y-8 relative z-10">
                <div className="flex justify-between items-start">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${
                    idx === 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                  }`}>
                    {course.id}
                  </div>
                  <ArrowRight className={`h-6 w-6 transition-all group-hover:translate-x-2 ${
                    idx === 0 ? 'text-white/50' : 'text-slate-300 dark:text-slate-600'
                  }`} />
                </div>
                <div>
                  <h3 className={`text-2xl font-black leading-tight mb-4 ${idx === 0 ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {course.name}
                  </h3>
                  <div className={`flex items-center space-x-6 text-xs font-bold uppercase tracking-wider ${
                    idx === 0 ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    <span className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{course.files} FILES</span>
                    </span>
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>{course.advice} TIPS</span>
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Departments Section */}
      <section className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Departments</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-widest">Administrative & Fee Info</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'eng', name: 'Engineering', hod: 'Dr. Sarah Chen', dean: 'Prof. Robert Miller', color: 'bg-blue-500' },
            { id: 'sci', name: 'Sciences', hod: 'Dr. James Wilson', dean: 'Prof. Elena Rodriguez', color: 'bg-emerald-500' },
            { id: 'arts', name: 'Arts & Humanities', hod: 'Dr. Michael Brown', dean: 'Prof. Linda White', color: 'bg-purple-500' },
          ].map((dept) => (
            <motion.div
              key={dept.id}
              whileHover={{ y: -5 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 group"
            >
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 ${dept.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{dept.name}</h3>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HOD: <span className="text-slate-600 dark:text-slate-300">{dept.hod}</span></p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dean: <span className="text-slate-600 dark:text-slate-300">{dept.dean}</span></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Features - Bento Style */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 py-12">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="md:col-span-2 bg-emerald-500 text-white p-10 rounded-[2.5rem] space-y-6 relative overflow-hidden group"
        >
          <div className="absolute -right-10 -bottom-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Book className="h-64 w-64" />
          </div>
          <div className="h-14 w-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <Book className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black tracking-tight">VERIFIED CONTENT</h3>
            <p className="text-emerald-50 text-lg font-medium max-w-md">Resources are marked &quot;Verified&quot; once 5 students click &quot;This helped me&quot;. Quality curated by the community.</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-slate-900 text-white p-10 rounded-[2.5rem] space-y-6 flex flex-col justify-between"
        >
          <div className="h-14 w-14 bg-indigo-500 rounded-2xl flex items-center justify-center">
            <FileText className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black tracking-tight uppercase">THE LIBRARY MODEL</h3>
            <p className="text-slate-400 text-sm font-medium">Think of it like Wikipedia. Anyone can upload, and everyone benefits from a clean, organized library.</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 space-y-6 md:col-span-3 flex flex-col md:flex-row items-center justify-between gap-8"
        >
          <div className="flex items-center space-x-6">
            <div className="h-16 w-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">ADVICE THREADS</h3>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Pinned advice from students who took the class last semester. Real tips for real exams.</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, x: 5 }}
            whileTap={{ scale: 0.95 }}
            className="w-full md:w-auto px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all"
          >
            Join the convo
          </motion.button>
        </motion.div>
      </section>

      {/* Marquee Section */}
      <div className="relative py-12 border-y border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center space-x-8 px-8">
              <span className="text-4xl font-black text-slate-200 dark:text-slate-800 uppercase tracking-tighter">NO BARRIERS</span>
              <Sparkles className="h-6 w-6 text-indigo-500/30" />
              <span className="text-4xl font-black text-slate-200 dark:text-slate-800 uppercase tracking-tighter">OPEN ACCESS</span>
              <Sparkles className="h-6 w-6 text-emerald-500/30" />
              <span className="text-4xl font-black text-slate-200 dark:text-slate-800 uppercase tracking-tighter">STUDENT POWERED</span>
              <Sparkles className="h-6 w-6 text-amber-500/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
