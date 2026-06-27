import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  PhoneOff, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  Maximize2,
  Minimize2,
  User
} from 'lucide-react';
import { db, collection, doc, addDoc, onSnapshot, updateDoc, getDoc } from '../firebase';

export default function CallOverlay({ callData, onEndCall }) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(!callData.isVideo);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pc = useRef(null);
  const localStreamRef = useRef(null);

  const servers = useMemo(() => ({
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
    iceCandidatePoolSize: 10,
  }), []);

  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (pc.current) {
      pc.current.close();
      pc.current = null;
    }
  }, []);

  useEffect(() => {
    const startCall = async () => {
      pc.current = new RTCPeerConnection(servers);

      let stream;
      if (callData.isScreenShare && callData.isCaller) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioStream.getAudioTracks().forEach(track => stream.addTrack(track));
          setIsScreenSharing(true);
        } catch (err) {
          console.error("Initial screen share failed, falling back to camera:", err);
          stream = await navigator.mediaDevices.getUserMedia({
            video: callData.isVideo,
            audio: true,
          });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: callData.isVideo,
          audio: true,
        });
      }
      
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      stream.getTracks().forEach((track) => {
        pc.current.addTrack(track, stream);
      });

      pc.current.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      const callDoc = doc(db, 'calls', callData.id);
      const offerCandidates = collection(callDoc, 'offerCandidates');
      const answerCandidates = collection(callDoc, 'answerCandidates');

      pc.current.onicecandidate = (event) => {
        if (event.candidate) {
          const candidates = callData.isCaller ? offerCandidates : answerCandidates;
          addDoc(candidates, event.candidate.toJSON());
        }
      };

      if (callData.isCaller) {
        const offerDescription = await pc.current.createOffer();
        await pc.current.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };

        await updateDoc(callDoc, { offer });

        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          if (pc.current && !pc.current.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            pc.current.setRemoteDescription(answerDescription);
          }
        });

        onSnapshot(answerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.current) {
              const candidate = new RTCIceCandidate(change.doc.data());
              pc.current.addIceCandidate(candidate);
            }
          });
        });
      } else {
        const data = (await getDoc(callDoc)).data();
        const offerDescription = data.offer;
        await pc.current.setRemoteDescription(new RTCSessionDescription(offerDescription));

        const answerDescription = await pc.current.createAnswer();
        await pc.current.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        };

        await updateDoc(callDoc, { answer });

        onSnapshot(offerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added' && pc.current) {
              const data = change.doc.data();
              pc.current.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });
      }

      onSnapshot(callDoc, (snapshot) => {
        const data = snapshot.data();
        if (data?.status === 'ended') {
          cleanup();
          onEndCall();
        }
      });
    };

    startCall().catch(err => {
      console.error("Call error:", err);
    });

    return () => cleanup();
  }, [callData, cleanup, onEndCall, servers]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      const videoTrack = localStream.getVideoTracks()[0];
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const newVideoTrack = stream.getVideoTracks()[0];
      
      const sender = pc.current.getSenders().find(s => s.track.kind === 'video');
      sender.replaceTrack(newVideoTrack);
      
      videoTrack.stop();
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        
        const sender = pc.current.getSenders().find(s => s.track.kind === 'video');
        sender.replaceTrack(screenTrack);
        
        screenTrack.onended = () => toggleScreenShare();
        
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share error:", err);
      }
    }
  };

  const handleEndCall = async () => {
    await updateDoc(doc(db, 'calls', callData.id), { status: 'ended' });
    cleanup();
    onEndCall();
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: 1, 
        y: 0,
        width: isMinimized ? 300 : '100%',
        height: isMinimized ? 200 : '100%',
        position: isMinimized ? 'fixed' : 'absolute',
        bottom: isMinimized ? 24 : 0,
        right: isMinimized ? 24 : 0,
        zIndex: 100
      }}
      className={`bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${isMinimized ? 'border-2 border-indigo-500' : 'inset-0'}`}
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            {callData.isVideo ? <Video className="h-4 w-4 text-white" /> : <Phone className="h-4 w-4 text-white" />}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{callData.otherUser?.displayName || 'Discussion Call'}</p>
            <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              {isScreenSharing ? 'Sharing Screen' : callData.isVideo ? 'Video Call' : 'Voice Call'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center">
        {/* Remote Video */}
        <video 
          ref={remoteVideoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className={`absolute bottom-6 right-6 w-1/4 aspect-video bg-slate-800 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl transition-all ${isMinimized ? 'hidden' : ''}`}>
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
              <User className="h-8 w-8 text-slate-600" />
            </div>
          )}
        </div>

        {!remoteStream && !isMinimized && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900/80">
            <div className="h-20 w-20 bg-indigo-600/20 rounded-full flex items-center justify-center animate-pulse">
              <Phone className="h-10 w-10 text-indigo-500" />
            </div>
            <p className="text-white font-bold animate-pulse">Connecting...</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`p-6 flex justify-center items-center space-x-4 bg-slate-900/80 backdrop-blur-md z-10 transition-all ${isMinimized ? 'p-2 space-x-2' : ''}`}>
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} ${isMinimized ? 'p-2' : ''}`}
        >
          {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
        </button>
        
        {callData.isVideo && (
          <button 
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition-all ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} ${isMinimized ? 'p-2' : ''}`}
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
        )}

        <button 
          onClick={toggleScreenShare}
          className={`p-4 rounded-2xl transition-all ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'} ${isMinimized ? 'p-2' : ''}`}
        >
          <Monitor className="h-6 w-6" />
        </button>

        <button 
          onClick={handleEndCall}
          className={`p-4 bg-rose-600 text-white rounded-2xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20 ${isMinimized ? 'p-2' : ''}`}
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </motion.div>
  );
}
