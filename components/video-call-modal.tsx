import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PhoneOff } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
}

export default function VideoCallModal({ isOpen, localStream, remoteStream, onHangUp }: VideoCallModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onHangUp}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">Video Call</DialogTitle>
        </DialogHeader>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Remote Video (Your Friend) */}
          <div className="bg-black rounded-lg overflow-hidden relative">
            {remoteStream ? (
              <video ref={video => { if (video) video.srcObject = remoteStream }} autoPlay playsInline className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Connecting...</div>
            )}
          </div>
          {/* Local Video (You) */}
          <div className="bg-black rounded-lg overflow-hidden relative">
            {localStream && (
              <video ref={video => { if (video) video.srcObject = localStream }} autoPlay playsInline muted className="w-full h-full object-cover" />
            )}
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">You</div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={onHangUp} variant="destructive" size="lg" className="rounded-full h-16 w-16">
            <PhoneOff className="h-6 w-6" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
