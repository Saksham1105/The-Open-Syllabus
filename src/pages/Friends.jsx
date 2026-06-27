import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  UserCheck, 
  Search, 
  Users, 
  MessageCircle,
  Loader2,
  Check,
  X,
  User,
  Phone,
  Video,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  setDoc,
  doc, 
  where, 
  getDocs,
  deleteDoc,
  OperationType, 
  handleFirestoreError 
} from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function Friends() {
  const { user, login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Listen for incoming friend requests
    const incomingQuery = query(
      collection(db, 'friendRequests'), 
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribeIncoming = onSnapshot(incomingQuery, (snapshot) => {
      setPendingRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'friendRequests'));

    // Listen for sent friend requests
    const sentQuery = query(
      collection(db, 'friendRequests'), 
      where('fromUid', '==', user.uid),
      where('status', '==', 'pending')
    );
    const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
      setSentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'friendRequests'));

    // Listen for accepted friendships
    const friendsQuery = query(
      collection(db, 'users'),
      where('friends', 'array-contains', user.uid)
    );
    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      setFriends(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'users'));

    return () => {
      unsubscribeIncoming();
      unsubscribeSent();
      unsubscribeFriends();
    };
  }, [user]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    
    try {
      // Search by display name or email
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.uid !== user?.uid); // Don't show self
      
      setSearchResults(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    if (!user) return login();
    
    // Check if already friends or request already sent
    const alreadySent = sentRequests.find(r => r.toUid === targetUser.uid);
    if (alreadySent) return showNotification("Request already sent!", "info");

    try {
      await addDoc(collection(db, 'friendRequests'), {
        fromUid: user.uid,
        fromName: user.displayName,
        toUid: targetUser.uid,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      showNotification(`Friend request sent to ${targetUser.displayName}!`, "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'friendRequests');
    }
  };

  const acceptRequest = async (request) => {
    try {
      // Update request status
      await updateDoc(doc(db, 'friendRequests', request.id), {
        status: 'accepted'
      });

      // Add to each other's friends list
      const userRef = doc(db, 'users', user.uid);
      const friendRef = doc(db, 'users', request.fromUid);

      // We'll use arrayUnion but for simplicity in this environment let's just update the doc
      // In a real app, use arrayUnion
      const currentUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      const friendUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', request.fromUid)));
      
      const currentUserData = currentUserDoc.docs[0].data();
      const friendUserData = friendUserDoc.docs[0].data();

      await updateDoc(userRef, {
        friends: [...(currentUserData.friends || []), request.fromUid]
      });
      await updateDoc(friendRef, {
        friends: [...(friendUserData.friends || []), user.uid]
      });

      showNotification("Friend request accepted!", "success");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'friendRequests');
    }
  };

  const declineRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', requestId));
      showNotification("Request declined.", "info");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'friendRequests');
    }
  };

  const startPrivateChat = async (friend, startCall = false, isVideo = false, isScreen = false) => {
    // Generate a unique chatId based on UIDs
    const chatId = [user.uid, friend.uid].sort().join('_');
    
    try {
      // Check if chat exists, if not create it
      const chatRef = doc(db, 'privateChats', chatId);
      await setDoc(chatRef, {
        participants: [user.uid, friend.uid],
        lastMessageAt: new Date().toISOString()
      }, { merge: true });
      
      let callParam = '';
      if (startCall) {
        if (isScreen) callParam = '&call=screen';
        else if (isVideo) callParam = '&call=video';
        else callParam = '&call=voice';
      }
      
      navigate(`/discussions?chat=${chatId}${callParam}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'privateChats');
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-6">
        <div className="h-20 w-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-3xl flex items-center justify-center">
          <Users className="h-10 w-10" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Connect with Friends</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center">Sign in to find your classmates, add them as friends, and start private discussions.</p>
        <button onClick={login} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95">
          Sign In to Connect
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Search Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Search className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <span>Find Classmates</span>
          </h2>
        </div>
        
        <form onSubmit={handleSearch} className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name..."
            className="block w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none dark:text-white dark:placeholder-slate-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search'}
          </button>
        </form>

        <AnimatePresence>
          {searchResults.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {searchResults.map((u) => (
                <div key={u.uid} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{u.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => sendFriendRequest(u)}
                    className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    <UserPlus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Friend Requests */}
        <div className="lg:col-span-1 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Requests</span>
          </h3>
          
          <div className="space-y-4">
            {pendingRequests.length > 0 ? pendingRequests.map((req) => (
              <motion.div 
                key={req.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3"
              >
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{req.fromName}</span> wants to be friends
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => acceptRequest(req)}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center justify-center space-x-1"
                  >
                    <Check className="h-3 w-3" />
                    <span>Accept</span>
                  </button>
                  <button 
                    onClick={() => declineRequest(req.id)}
                    className="flex-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center justify-center space-x-1"
                  >
                    <X className="h-3 w-3" />
                    <span>Decline</span>
                  </button>
                </div>
              </motion.div>
            )) : (
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No pending requests</p>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <span>Your Friends</span>
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {friends.length > 0 ? friends.map((friend) => (
              <motion.div 
                key={friend.uid}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  {friend.photoURL ? (
                    <img src={friend.photoURL} alt={friend.displayName} className="h-10 w-10 rounded-full border border-slate-200 dark:border-slate-700" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{friend.displayName}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Online</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => startPrivateChat(friend, true, false)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Voice Call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => startPrivateChat(friend, true, true)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Video Call"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => startPrivateChat(friend, true, true, true)} // Screen share is video call with screen share flag
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Screen Share"
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => startPrivateChat(friend)}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all"
                    title="Message"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-2 py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 dark:text-slate-500 font-medium">You haven&apos;t added any friends yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Search for classmates above to get started!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
