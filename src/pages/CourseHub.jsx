import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  ThumbsUp, 
  Download, 
  Plus, 
  Search,
  ArrowLeft,
  Pin,
  Loader2,
  Upload,
  X,
  Info,
  Users,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, onSnapshot, query, addDoc, updateDoc, doc, orderBy, OperationType, handleFirestoreError } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useStudyMode } from '../contexts/StudyModeContext';

export default function CourseHub() {
  const { courseId } = useParams();
  const { user, login } = useAuth();
  const { isStudyMode } = useStudyMode();
  const [activeTab, setActiveTab] = useState('files');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [advice, setAdvice] = useState([]);
  const [deadlines, setDeadlines] = useState([]);
  const [courseData, setCourseData] = useState(null);
  const [deptData, setDeptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Form states
  const [uploadForm, setUploadForm] = useState({ name: '', category: 'PYQ', year: 2024, downloadUrl: '' });
  const [deadlineForm, setDeadlineForm] = useState({ title: '', date: '' });
  const [adviceText, setAdviceText] = useState('');

  useEffect(() => {
    if (!courseId) return;

    // Listen for course data
    const unsubscribeCourse = onSnapshot(doc(db, 'courses', courseId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCourseData(data);
        if (data.departmentId) {
          // Fetch department data
          onSnapshot(doc(db, 'departments', data.departmentId), (deptSnap) => {
            if (deptSnap.exists()) {
              setDeptData(deptSnap.data());
            }
          });
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}`));

    // Listen for files
    const filesQuery = query(collection(db, `courses/${courseId}/files`), orderBy('createdAt', 'desc'));
    const unsubscribeFiles = onSnapshot(filesQuery, (snapshot) => {
      setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}/files`));

    // Listen for advice
    const adviceQuery = query(collection(db, `courses/${courseId}/advice`), orderBy('createdAt', 'desc'));
    const unsubscribeAdvice = onSnapshot(adviceQuery, (snapshot) => {
      setAdvice(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}/advice`));

    // Listen for deadlines
    const deadlinesQuery = query(collection(db, `courses/${courseId}/deadlines`), orderBy('date', 'asc'));
    const unsubscribeDeadlines = onSnapshot(deadlinesQuery, (snapshot) => {
      setDeadlines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, `courses/${courseId}/deadlines`));

    return () => {
      unsubscribeCourse();
      unsubscribeFiles();
      unsubscribeAdvice();
      unsubscribeDeadlines();
    };
  }, [courseId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) return login();
    if (!uploadForm.name || !uploadForm.downloadUrl) return;

    try {
      await addDoc(collection(db, `courses/${courseId}/files`), {
        ...uploadForm,
        courseId,
        verified: false,
        thanks: 0,
        uploaderUid: user.uid,
        createdAt: new Date().toISOString()
      });
      setIsUploadModalOpen(false);
      setUploadForm({ name: '', category: 'PYQ', year: 2024, downloadUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `courses/${courseId}/files`);
    }
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    if (file) {
      setUploadForm(prev => ({
        ...prev,
        name: file.name.split('.').slice(0, -1).join('.') || file.name
      }));
    }
  };

  const handlePostAdvice = async (e) => {
    e.preventDefault();
    if (!user) return login();
    if (!adviceText.trim()) return;

    try {
      await addDoc(collection(db, `courses/${courseId}/advice`), {
        courseId,
        authorName: user.displayName || 'Anonymous',
        authorUid: user.uid,
        text: adviceText,
        pinned: false,
        createdAt: new Date().toISOString()
      });
      setAdviceText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `courses/${courseId}/advice`);
    }
  };

  const handleAddDeadline = async (e) => {
    e.preventDefault();
    if (!user) return login();
    if (!deadlineForm.title || !deadlineForm.date) return;

    try {
      await addDoc(collection(db, `courses/${courseId}/deadlines`), {
        courseId,
        title: deadlineForm.title,
        date: new Date(deadlineForm.date).toISOString(),
        addedByUid: user.uid
      });
      setIsDeadlineModalOpen(false);
      setDeadlineForm({ title: '', date: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `courses/${courseId}/deadlines`);
    }
  };

  const handleThanks = async (fileId, currentThanks) => {
    if (!user) return login();
    try {
      await updateDoc(doc(db, `courses/${courseId}/files`, fileId), {
        thanks: currentThanks + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `courses/${courseId}/files/${fileId}`);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Loading {courseId} Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 -z-10 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Link to="/" className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center space-x-1 hover:translate-x-1 transition-transform">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Browse</span>
          </Link>
          <div className="flex items-center space-x-3">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">{courseId}</h1>
            <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              Active Hub
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Master Folder of Resources</p>
        </div>
        
        {!isStudyMode && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => user ? setIsUploadModalOpen(true) : login()}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl"
          >
            <Plus className="h-5 w-5" />
            <span>Upload Material</span>
          </motion.button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit border border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('files')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'files' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <FileText className="h-4 w-4" />
          <span>Files</span>
          <span className="ml-1 opacity-50">{files.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('advice')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'advice' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Advice</span>
          <span className="ml-1 opacity-50">{advice.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Calendar className="h-4 w-4" />
          <span>Deadlines</span>
          <span className="ml-1 opacity-50">{deadlines.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex items-center space-x-2 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-lg' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Info className="h-4 w-4" />
          <span>Info</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeTab === 'files' && (
          <div className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search files in this course..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              {filteredFiles.length > 0 ? filteredFiles.map((file, idx) => (
                <motion.div 
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">{file.name}</h3>
                        {file.verified && (
                          <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle className="h-3 w-3" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span>{file.category}</span>
                        <span>•</span>
                        <span>{file.year}</span>
                        <span>•</span>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleThanks(file.id, file.thanks)}
                          className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-2 py-0.5 rounded-lg transition-colors"
                        >
                          <ThumbsUp className="h-3 w-3" />
                          <span>{file.thanks} Thanks</span>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.a 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      href={file.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all"
                    >
                      <Download className="h-5 w-5" />
                    </motion.a>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  No files found. Be the first to upload!
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <textarea 
                  placeholder="Share advice for this course..."
                  className="w-full bg-transparent border-none outline-none resize-none text-slate-700 dark:text-slate-200"
                  rows={3}
                  value={adviceText}
                  onChange={(e) => setAdviceText(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={handlePostAdvice}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
                  >
                    Post Advice
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {advice.map((item) => (
                  <div key={item.id} className={`p-6 rounded-2xl border ${item.pinned ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400">
                          {item.authorName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.authorName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {item.pinned && (
                        <div className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400">
                          <Pin className="h-4 w-4 fill-indigo-600 dark:fill-indigo-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Pinned Advice</span>
                        </div>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="p-12 text-center space-y-4">
             {deadlines.length > 0 ? (
               <div className="space-y-4 text-left max-w-2xl mx-auto">
                 {deadlines.map((deadline, idx) => (
                   <motion.div 
                    key={deadline.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"
                   >
                     <div className="flex items-center space-x-4">
                       <div className="h-10 w-10 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
                         <Calendar className="h-5 w-5" />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-900 dark:text-white">{deadline.title}</h4>
                         <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(deadline.date).toLocaleDateString()}</p>
                       </div>
                     </div>
                   </motion.div>
                 ))}
                 <button 
                  onClick={() => user ? setIsDeadlineModalOpen(true) : login()}
                  className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-slate-400 dark:text-slate-500 font-bold hover:border-indigo-300 dark:hover:border-indigo-800 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all flex items-center justify-center space-x-2"
                 >
                   <Plus className="h-5 w-5" />
                   <span>Add Another Deadline</span>
                 </button>
               </div>
             ) : (
               <>
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Calendar className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Deadlines Added Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Be the first to add the Midterm or Final exam date for everyone in this course.</p>
                <button 
                  onClick={() => user ? setIsDeadlineModalOpen(true) : login()}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                >
                  Add Deadline
                </button>
               </>
             )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="p-8 space-y-12">
            {/* Course Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-indigo-600 dark:text-indigo-400">
                  <Users className="h-6 w-6" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Assigned Teachers</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {courseData?.assignedTeachers?.length > 0 ? courseData.assignedTeachers.map((teacher, i) => (
                    <div key={i} className="flex items-center space-x-3 p-4 glass rounded-2xl">
                      <div className="h-10 w-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center font-bold text-indigo-600">
                        {teacher[0]}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{teacher}</span>
                    </div>
                  )) : (
                    <p className="text-slate-500 italic">No teachers assigned yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-6 w-6" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Fee Structure</h3>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Tuition Fee</span>
                    <span className="font-black text-slate-900 dark:text-white">${courseData?.feeStructure?.tuition || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Lab Fee</span>
                    <span className="font-black text-slate-900 dark:text-white">${courseData?.feeStructure?.lab || 0}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <span className="text-indigo-600 dark:text-indigo-400 font-black uppercase text-xs tracking-widest">Total Course Fee</span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${courseData?.feeStructure?.total || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Details */}
            {deptData && (
              <div className="pt-12 border-t border-slate-100 dark:border-slate-800 space-y-8">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{deptData.name} Department</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Administrative Details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 glass rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Head of Dept (HOD)</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{deptData.hod || 'Not Assigned'}</p>
                  </div>
                  <div className="p-6 glass rounded-3xl space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dean</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{deptData.dean || 'Not Assigned'}</p>
                  </div>
                  <div className="p-6 bg-indigo-600 text-white rounded-3xl space-y-4">
                    <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">Dept. General Fees</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Admission</span>
                        <span className="font-black">${deptData.feeStructure?.admission || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Library</span>
                        <span className="font-black">${deptData.feeStructure?.library || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upload Material</h2>
                  <button type="button" onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div 
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      className="hidden" 
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isDragging ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 shadow-sm'}`}>
                        <Upload className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {isDragging ? 'Drop it here!' : 'Click or drag file to upload'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PDF, DOCX, or Images (Max 10MB)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">File Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Midterm 2023 Solutions" 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm({...uploadForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Download URL (External Link)</label>
                    <input 
                      type="url" 
                      required
                      placeholder="https://example.com/file.pdf" 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      value={uploadForm.downloadUrl}
                      onChange={(e) => setUploadForm({...uploadForm, downloadUrl: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                        value={uploadForm.category}
                        onChange={(e) => setUploadForm({...uploadForm, category: e.target.value})}
                      >
                        <option value="PYQ">PYQ</option>
                        <option value="Notes">Notes</option>
                        <option value="Syllabus">Syllabus</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Year</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                        value={uploadForm.year}
                        onChange={(e) => setUploadForm({...uploadForm, year: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg dark:shadow-none">
                  Upload to {courseId}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {isDeadlineModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleAddDeadline} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Add Deadline</h2>
                  <button type="button" onClick={() => setIsDeadlineModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    <Plus className="h-6 w-6 rotate-45" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Event Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Midterm Exam" 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      value={deadlineForm.title}
                      onChange={(e) => setDeadlineForm({...deadlineForm, title: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Date</label>
                    <input 
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                      value={deadlineForm.date}
                      onChange={(e) => setDeadlineForm({...deadlineForm, date: e.target.value})}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg dark:shadow-none">
                  Add to {courseId}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
