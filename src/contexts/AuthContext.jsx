import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, onAuthStateChanged, signInWithPopup, googleProvider, db, doc, setDoc, getDoc } from '../firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Sync user profile to Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          const syncData = {
            uid: user.uid,
            email: user.email,
            lastLogin: new Date().toISOString()
          };

          // Only sync displayName and photoURL if they don't exist in Firestore
          if (!userDoc.exists()) {
            syncData.displayName = user.displayName;
            syncData.photoURL = user.photoURL;
            syncData.friends = [];
          } else {
            const data = userDoc.data();
            if (!data.displayName) syncData.displayName = user.displayName;
            if (!data.photoURL) syncData.photoURL = user.photoURL;
          }

          await setDoc(userRef, syncData, { merge: true });
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      }
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      // Handle common user-triggered errors gracefully
      if (error.code === 'auth/popup-closed-by-user') {
        console.log('User closed the login popup.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        console.log('Login popup request was cancelled.');
      } else {
        console.error('Login error:', error);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isLoggingIn }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
