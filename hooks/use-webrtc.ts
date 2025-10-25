import { useState, useEffect, useRef, useCallback } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';
import { useAuth } from '@/contexts/auth-context';

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export interface MediaDevices {
  audioIn: MediaDeviceInfo[];
  audioOut: MediaDeviceInfo[];
  videoIn: MediaDeviceInfo[];
}

export function useWebRTC(contactId: string | null) {
  const { currentUser } = useAuth();
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'in-call' | 'receiving'>('idle');
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [devices, setDevices] = useState<MediaDevices>({ audioIn: [], audioOut: [], videoIn: [] });

  const callRef = useRef<string | null>(null);
  const localScreenStreamRef = useRef<MediaStream | null>(null);
  const localCameraStreamRef = useRef<MediaStream | null>(null);

  const getDevices = useCallback(async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const audioIn = allDevices.filter(device => device.kind === 'audioinput');
    const audioOut = allDevices.filter(device => device.kind === 'audiooutput');
    const videoIn = allDevices.filter(device => device.kind === 'videoinput');
    setDevices({ audioIn, audioOut, videoIn });
  }, []);

  useEffect(() => {
    getDevices();
  }, [getDevices]);

  const initializePeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(configuration);

    pc.onicecandidate = (event) => {
      if (event.candidate && callRef.current) {
        const candidatesRef = ref(database, `calls/${callRef.current}/candidates/${currentUser!.uid}`);
        push(candidatesRef, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    setPeerConnection(pc);
    return pc;
  }, [currentUser]);

  const startLocalStream = useCallback(async (video = false, audioDeviceId?: string, videoDeviceId?: string) => {
    const constraints = {
      audio: { deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined },
      video: video ? { deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined } : false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    setLocalStream(stream);
    localCameraStreamRef.current = stream; // Save camera stream
    return stream;
  }, []);

  const makeCall = useCallback(async (isVideoCall = false) => {
    if (!contactId || !currentUser) return;

    setCallStatus('calling');
    const pc = initializePeerConnection();
    const stream = await startLocalStream(isVideoCall);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const callId = `${currentUser.uid}-${contactId}`;
    callRef.current = callId;
    const callDocRef = ref(database, `calls/${callId}`);

    const offerDescription = await pc.createOffer();
    await pc.setLocalDescription(offerDescription);

    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
      caller: currentUser.uid,
      callee: contactId,
      isVideo: isVideoCall,
    };

    await set(callDocRef, { offer });

    onValue(callDocRef, (snapshot) => {
      const data = snapshot.val();
      if (data?.answer && !pc.currentRemoteDescription) {
        pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallStatus('in-call');
      }
    });

    const candidatesRef = ref(database, `calls/${callId}/candidates/${contactId}`);
    onValue(candidatesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        pc.addIceCandidate(new RTCIceCandidate(childSnapshot.val()));
      });
    });

  }, [contactId, currentUser, initializePeerConnection, startLocalStream]);

  const answerCall = useCallback(async () => {
    if (!incomingCall || !currentUser) return;

    setCallStatus('in-call');
    const pc = initializePeerConnection();
    const stream = await startLocalStream(incomingCall.offer.isVideo);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const callId = incomingCall.id;
    callRef.current = callId;
    const callDocRef = ref(database, `calls/${callId}`);

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    await update(callDocRef, { answer: { type: answerDescription.type, sdp: answerDescription.sdp } });

    const candidatesRef = ref(database, `calls/${callId}/candidates/${incomingCall.offer.caller}`);
    onValue(candidatesRef, (snapshot) => {
      snapshot.forEach((childSnapshot) => {
        pc.addIceCandidate(new RTCIceCandidate(childSnapshot.val()));
      });
    });

    setIncomingCall(null);
  }, [incomingCall, currentUser, initializePeerConnection, startLocalStream]);

  const hangUp = useCallback(async () => {
    if (callRef.current) {
      remove(ref(database, `calls/${callRef.current}`));
    }
    localStream?.getTracks().forEach(track => track.stop());
    localScreenStreamRef.current?.getTracks().forEach(track => track.stop());
    remoteStream?.getTracks().forEach(track => track.stop());
    peerConnection?.close();

    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setCallStatus('idle');
    setIsMuted(false);
    setIsSharingScreen(false);
    callRef.current = null;
    localScreenStreamRef.current = null;
    localCameraStreamRef.current = null;
  }, [localStream, remoteStream, peerConnection]);

  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(prev => !prev);
  }, [localStream]);
  
  const startScreenShare = useCallback(async () => {
    if (!peerConnection) return;
    
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    localScreenStreamRef.current = screenStream;

    const videoTrack = screenStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    
    if (sender) {
      sender.replaceTrack(videoTrack);
    }
    
    setIsSharingScreen(true);
    
    videoTrack.onended = () => {
      stopScreenShare();
    };
  }, [peerConnection]);

  const stopScreenShare = useCallback(() => {
    if (!peerConnection || !localCameraStreamRef.current) return;
    
    localScreenStreamRef.current?.getTracks().forEach(track => track.stop());

    const cameraTrack = localCameraStreamRef.current.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
    
    if (sender && cameraTrack) {
      sender.replaceTrack(cameraTrack);
    }

    setIsSharingScreen(false);
    localScreenStreamRef.current = null;
  }, [peerConnection]);


  useEffect(() => {
    if (!currentUser) return;
    const callsRef = ref(database, 'calls');
    const unsubscribe = onValue(callsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            Object.keys(data).forEach(key => {
                const call = data[key];
                if(call.offer && call.offer.callee === currentUser.uid && !call.answer){
                    setIncomingCall({id: key, ...call});
                    setCallStatus('receiving');
                }
            })
        }
    });
    return () => unsubscribe();
  }, [currentUser]);

  return {
    makeCall,
    answerCall,
    hangUp,
    localStream,
    remoteStream,
    callStatus,
    incomingCall,
    isMuted,
    toggleMute,
    isSharingScreen,
    startScreenShare,
    stopScreenShare,
    devices,
    getDevices
  };
}
