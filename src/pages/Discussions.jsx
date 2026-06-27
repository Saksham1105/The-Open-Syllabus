import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Send, 
  Hash,
  Loader2,
  ChevronRight,
  User,
  MessageCircle,
  Video,
  Phone,
  Monitor,
  PhoneIncoming,
  PhoneOff,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, collection, onSnapshot, query, addDoc, updateDoc, orderBy, OperationType, handleFirestoreError, where, doc, getDoc, deleteDoc } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import CallOverlay from '../components/CallOverlay';

export default function Discussions() {
  const { user, login } = useAuth();
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialChatId = queryParams.get('chat');

  const [groups, setGroups] = useState([]);
  const [privateChats, setPrivateChats] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); // Can be a group or a private chat
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCourse, setNewGroupCourse] = useState('');
  const messagesEndRef = useRef(null);

  // Call state
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const hasAutoStartedCall = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startCall = useCallback(async (isVideo = true, isScreenShare = false) => {
    if (!user || !selectedItem) return;
    
    // For now, only private calls are supported
    if (selectedItem.type !== 'private') {
      alert("Voice/Video calls are currently only supported in private chats.");
      return;
    }

    const callRef = await addDoc(collection(db, 'calls'), {
      callerUid: user.uid,
      callerName: user.displayName,
      receiverUid: selectedItem.participants.find(uid => uid !== user.uid),
      isVideo: isVideo || isScreenShare,
      isScreenShare,
      status: 'ringing',
      createdAt: new Date().toISOString()
    });

    setActiveCall({
      id: callRef.id,
      isCaller: true,
      isVideo: isVideo || isScreenShare,
      isScreenShare,
      otherUser: selectedItem.otherUser
    });
  }, [user, selectedItem]);

  // Handle auto-starting call from query params
  useEffect(() => {
    const callType = queryParams.get('call');
    if (callType && selectedItem && selectedItem.id === initialChatId && !hasAutoStartedCall.current && !activeCall) {
      hasAutoStartedCall.current = true;
      // Use setTimeout to avoid cascading render lint error
      setTimeout(() => {
        startCall(callType === 'video' || callType === 'screen', callType === 'screen');
      }, 0);
    }
  }, [selectedItem, initialChatId, activeCall, queryParams, startCall]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    await updateDoc(doc(db, 'calls', incomingCall.id), {
      status: 'active'
    });

    setActiveCall({
      id: incomingCall.id,
      isCaller: false,
      isVideo: incomingCall.isVideo,
      otherUser: { displayName: incomingCall.callerName }
    });
    setIncomingCall(null);
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    await updateDoc(doc(db, 'calls', incomingCall.id), {
      status: 'ended'
    });
    setIncomingCall(null);
  };

  useEffect(() => {
    const groupsQuery = query(collection(db, 'chatGroups'), orderBy('createdAt', 'desc'));
    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, type: 'group', ...doc.data() }));
      setGroups(groupsData);
      setLoading(false);
      
      // If no item selected and we have groups, select first group
      if (!selectedItem && groupsData.length > 0 && !initialChatId) {
        setSelectedItem(groupsData[0]);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'chatGroups'));

    return () => unsubscribeGroups();
  }, [selectedItem, initialChatId]);

  useEffect(() => {
    if (!user) return;

    const privateChatsQuery = query(
      collection(db, 'privateChats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribePrivate = onSnapshot(privateChatsQuery, async (snapshot) => {
      const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
        const data = chatDoc.data();
        const otherUid = data.participants.find(uid => uid !== user.uid);
        
        // Fetch other user's info for display
        const otherUserDoc = await getDoc(doc(db, 'users', otherUid));
        const otherUserData = otherUserDoc.exists() ? otherUserDoc.data() : { displayName: 'Unknown User' };
        
        return { 
          id: chatDoc.id, 
          type: 'private', 
          otherUser: otherUserData,
          ...data 
        };
      }));
      setPrivateChats(chatsData);

      // Handle initialChatId from query param
      if (initialChatId) {
        const chat = chatsData.find(c => c.id === initialChatId);
        if (chat) setSelectedItem(chat);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'privateChats'));

    return () => unsubscribePrivate();
  }, [user, initialChatId]);

  useEffect(() => {
    if (!selectedItem) return;

    const collectionPath = selectedItem.type === 'group' 
      ? `chatGroups/${selectedItem.id}/messages`
      : `privateChats/${selectedItem.id}/messages`;

    const messagesQuery = query(
      collection(db, collectionPath), 
      orderBy('createdAt', 'asc')
    );
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, collectionPath));

    return () => unsubscribeMessages();
  }, [selectedItem]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) return login();
    if (!newMessage.trim() || !selectedItem) return;

    const collectionPath = selectedItem.type === 'group' 
      ? `chatGroups/${selectedItem.id}/messages`
      : `privateChats/${selectedItem.id}/messages`;

    try {
      await addDoc(collection(db, collectionPath), {
        senderUid: user.uid,
        senderName: user.displayName || 'Anonymous',
        text: newMessage,
        createdAt: new Date().toISOString()
      });

      // Update last message in private chat
      if (selectedItem.type === 'private') {
        await updateDoc(doc(db, 'privateChats', selectedItem.id), {
          lastMessage: newMessage,
          lastMessageAt: new Date().toISOString()
        });
      }

      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionPath);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!user) return login();
    if (!newGroupName.trim() || !newGroupCourse.trim()) return;

    try {
      await addDoc(collection(db, 'chatGroups'), {
        name: newGroupName,
        courseId: newGroupCourse.toUpperCase(),
        createdByUid: user.uid,
        createdAt: new Date().toISOString()
      });
      setIsCreateGroupModalOpen(false);
      setNewGroupName('');
      setNewGroupCourse('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chatGroups');
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedItem || !user) return;
    
    const collectionName = selectedItem.type === 'group' ? 'chatGroups' : 'privateChats';
    
    try {
      await deleteDoc(doc(db, collectionName, selectedItem.id));
      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      setMessages([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${selectedItem.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">Loading Discussions...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* Active Call Overlay */}
      <AnimatePresence>
        {activeCall && (
          <CallOverlay 
            callData={activeCall} 
            user={user} 
            onEndCall={() => setActiveCall(null)} 
          />
        )}
      </AnimatePresence>

      {/* Incoming Call Modal */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl border-2 border-indigo-500 flex items-center space-x-6"
          >
            <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center animate-bounce">
              <PhoneIncoming className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-white font-bold">{incomingCall.callerName}</p>
              <p className="text-slate-500 dark:text-slate-400 text-xs">Incoming {incomingCall.isVideo ? 'Video' : 'Voice'} Call...</p>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={acceptCall}
                className="p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20"
              >
                <Phone className="h-5 w-5" />
              </button>
              <button 
                onClick={rejectCall}
                className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-lg shadow-rose-900/20"
              >
                <PhoneOff className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Discussions</span>
          </h2>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => user ? setIsCreateGroupModalOpen(true) : login()}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Groups Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Groups</h3>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => setSelectedItem(group)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedItem?.id === group.id ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold ${selectedItem?.id === group.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>
                    <Hash className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs truncate max-w-[120px]">{group.name}</p>
                    <p className="text-[9px] uppercase font-bold tracking-wider opacity-60">{group.courseId}</p>
                  </div>
                </div>
                <ChevronRight className={`h-3 w-3 transition-all ${selectedItem?.id === group.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
              </button>
            ))}
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Direct Messages</h3>
            {privateChats.length > 0 ? privateChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedItem(chat)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${selectedItem?.id === chat.id ? 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm hover:text-slate-900 dark:hover:text-white'}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {chat.otherUser.photoURL ? (
                      <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-8 w-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-xs truncate max-w-[120px]">{chat.otherUser.displayName}</p>
                    <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[120px]">{chat.lastMessage || 'Start chatting...'}</p>
                  </div>
                </div>
                <ChevronRight className={`h-3 w-3 transition-all ${selectedItem?.id === chat.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
              </button>
            )) : (
              <p className="px-4 text-[10px] text-slate-400 dark:text-slate-500 italic">No direct messages yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
        {selectedItem ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center font-bold">
                  {selectedItem.type === 'group' ? <Hash className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {selectedItem.type === 'group' ? selectedItem.name : selectedItem.otherUser.displayName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase">
                    {selectedItem.type === 'group' ? `${selectedItem.courseId} Discussion Hub` : 'Private Conversation'}
                  </p>
                </div>
              </div>

              {/* Call Buttons */}
              <div className="flex items-center space-x-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startCall(false)}
                  className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Voice Call"
                >
                  <Phone className="h-5 w-5" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startCall(true)}
                  className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Video Call"
                >
                  <Video className="h-5 w-5" />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startCall(true, true)}
                  className="p-3 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                  title="Screen Share"
                >
                  <Monitor className="h-5 w-5" />
                </motion.button>

                {/* Delete Chat Button */}
                {(selectedItem.type === 'private' || selectedItem.createdByUid === user?.uid) && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-3 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                    title="Delete Chat"
                  >
                    <Trash2 className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/30">
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div 
                    key={msg.id} 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.05, 0.5) }}
                    className={`flex flex-col ${msg.senderUid === user?.uid ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-end space-x-2 ${msg.senderUid === user?.uid ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm">
                        {msg.senderName[0]}
                      </div>
                      <div className={`max-w-md px-4 py-3 rounded-2xl shadow-sm ${msg.senderUid === user?.uid ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 mt-1 px-10 ${msg.senderUid === user?.uid ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{msg.senderName}</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-700">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={`Message ${selectedItem.type === 'group' ? '#' + selectedItem.name : selectedItem.otherUser.displayName}...`}
                  className="w-full pl-6 pr-16 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white dark:placeholder-slate-500"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 rounded-3xl flex items-center justify-center">
              <MessageSquare className="h-12 w-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No Groups Selected</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Select a group from the sidebar to start discussing or create a new one.</p>
            </div>
            <button 
              onClick={() => user ? setIsCreateGroupModalOpen(true) : login()}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none"
            >
              Create Discussion Group
            </button>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreateGroupModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Create Group</h2>
                  <button type="button" onClick={() => setIsCreateGroupModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <Plus className="h-6 w-6 rotate-45" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Group Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., Exam Prep Study Group" 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-slate-600"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Course Code</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., MATH101" 
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:placeholder-slate-600"
                      value={newGroupCourse}
                      onChange={(e) => setNewGroupCourse(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none">
                  Create Group
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-8 space-y-6"
            >
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete {selectedItem?.type === 'group' ? 'Group' : 'Chat'}?</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Are you sure you want to delete this {selectedItem?.type === 'group' ? 'group' : 'conversation'}? This action cannot be undone and all messages will be lost.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleDeleteChat}
                  className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-100 dark:shadow-none"
                >
                  Delete Permanently
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
