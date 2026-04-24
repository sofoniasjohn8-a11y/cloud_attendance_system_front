import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

const FaceCapture = ({ onReady, label = 'Position your face in the frame' }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;
    navigator.mediaDevices.getUserMedia({ video: true }).then((s) => {
      stream = s;
      videoRef.current.srcObject = s;
      videoRef.current.onloadedmetadata = () => onReady?.(videoRef.current);
    });
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-64 h-48 rounded-xl overflow-hidden bg-gray-900 border-2 border-primary-400">
        <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 border-4 border-dashed border-primary-400 opacity-40 rounded-xl pointer-events-none" />
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Camera className="w-4 h-4" />
        <span>{label}</span>
      </div>
    </div>
  );
};

export default FaceCapture;
