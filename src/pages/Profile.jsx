import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  School, 
  FileText, 
  Save, 
  Loader2,
  Camera,
  Type
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  db, 
  doc, 
  getDoc, 
  updateDoc, 
  OperationType, 
  handleFirestoreError,
  storage,
  ref,
  uploadBytes,
  getDownloadURL
} from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export default function Profile() {
  const { user, login } = useAuth();
  const { showNotification } = useNotification();
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    displayName: '',
    email: '',
    photoURL: '',
    bio: '',
    college: ''
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            displayName: data.displayName || '',
            email: data.email || '',
            photoURL: data.photoURL || '',
            bio: data.bio || '',
            college: data.college || ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    // Check file size (limit to 2MB for now)
    if (file.size > 2 * 1024 * 1024) {
      showNotification('File size too large. Please select an image under 2MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      setProfileData(prev => ({ ...prev, photoURL: downloadURL }));
      showNotification('Photo uploaded! Save profile to apply changes.', 'success');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showNotification('Failed to upload photo.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        bio: profileData.bio,
        college: profileData.college,
        updatedAt: new Date().toISOString()
      });
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center">
          <User className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Your Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">Sign in to view and edit your student profile.</p>
        <button onClick={login} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
      >
        {/* Header/Cover */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar Section */}
          <div className="relative -mt-16 mb-8 flex justify-center">
            <div className="relative">
              {profileData.photoURL ? (
                <div className="relative">
                  <img 
                    src={profileData.photoURL} 
                    alt={profileData.displayName} 
                    className={`h-32 w-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover ${isUploading ? 'opacity-50' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 w-32 bg-slate-100 dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                  ) : (
                    <User className="h-16 w-16 text-slate-400" />
                  )}
                </div>
              )}
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 p-2 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                disabled={isUploading}
              >
                <Camera className="h-5 w-5" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{profileData.displayName || 'Student'}</h2>
            <p className="text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-1 mt-1">
              <Mail className="h-4 w-4" />
              <span>{profileData.email}</span>
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <Type className="h-4 w-4 text-indigo-500" />
                <span>Full Name</span>
              </label>
              <input 
                type="text" 
                placeholder="Your display name"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                value={profileData.displayName}
                onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <School className="h-4 w-4 text-indigo-500" />
                <span>College / University</span>
              </label>
              <input 
                type="text" 
                placeholder="Where do you study?"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all"
                value={profileData.college}
                onChange={(e) => setProfileData({...profileData, college: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>Bio</span>
              </label>
              <textarea 
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              disabled={isSaving || isUploading}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
