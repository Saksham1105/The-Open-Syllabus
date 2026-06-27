import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, CheckCircle, AlertCircle } from 'lucide-react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col space-y-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              className="pointer-events-auto bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 flex items-center space-x-4 min-w-[300px]"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                n.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 
                n.type === 'error' ? 'bg-red-50 text-red-600' : 
                'bg-indigo-50 text-indigo-600'
              }`}>
                {n.type === 'success' ? <CheckCircle className="h-5 w-5" /> : 
                 n.type === 'error' ? <AlertCircle className="h-5 w-5" /> : 
                 <Info className="h-5 w-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{n.message}</p>
              </div>
              <button onClick={() => removeNotification(n.id)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
