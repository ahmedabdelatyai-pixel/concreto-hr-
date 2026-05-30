import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

function VideoAnalyzer({ onAnalysisComplete }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { t, i18n } = useTranslation();
  
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [metrics, setMetrics] = useState({ confidence: 85, stress: 20, focus: 90 });
  const [hasPermission, setHasPermission] = useState(true);

  // Start Video Stream
  useEffect(() => {
    let activeStream = null;
    const startCamera = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
        setStream(activeStream);
        setIsScanning(true);
      } catch (err) {
        console.error("Camera access denied:", err);
        setHasPermission(false);
      }
    };
    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Simulate AI Biometric Tracking
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setMetrics(prev => {
        const newConfidence = Math.min(99, Math.max(70, prev.confidence + (Math.random() * 10 - 5)));
        const newStress = Math.min(40, Math.max(10, prev.stress + (Math.random() * 8 - 4)));
        const newFocus = Math.min(99, Math.max(75, prev.focus + (Math.random() * 12 - 6)));

        const finalMetrics = {
          confidence: Math.round(newConfidence),
          stress: Math.round(newStress),
          focus: Math.round(newFocus)
        };

        if (onAnalysisComplete) {
          onAnalysisComplete(finalMetrics);
        }

        return finalMetrics;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isScanning]);

  // Draw Scanner HUD on Canvas
  useEffect(() => {
    if (!isScanning || !canvasRef.current || !videoRef.current) return;
    
    const ctx = canvasRef.current.getContext('2d');
    let animationId;
    let scanLineY = 0;
    let scanDirection = 1;

    const drawHUD = () => {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      
      // Draw Face Bounding Box
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, canvasRef.current.width - 80, canvasRef.current.height - 80);

      // Draw Corner Accents
      ctx.beginPath();
      const s = 20; // corner size
      // Top Left
      ctx.moveTo(40, 40 + s); ctx.lineTo(40, 40); ctx.lineTo(40 + s, 40);
      // Top Right
      ctx.moveTo(canvasRef.current.width - 40 - s, 40); ctx.lineTo(canvasRef.current.width - 40, 40); ctx.lineTo(canvasRef.current.width - 40, 40 + s);
      // Bottom Left
      ctx.moveTo(40, canvasRef.current.height - 40 - s); ctx.lineTo(40, canvasRef.current.height - 40); ctx.lineTo(40 + s, canvasRef.current.height - 40);
      // Bottom Right
      ctx.moveTo(canvasRef.current.width - 40 - s, canvasRef.current.height - 40); ctx.lineTo(canvasRef.current.width - 40, canvasRef.current.height - 40); ctx.lineTo(canvasRef.current.width - 40, canvasRef.current.height - 40 - s);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Scan Line
      ctx.beginPath();
      ctx.moveTo(40, 40 + scanLineY);
      ctx.lineTo(canvasRef.current.width - 40, 40 + scanLineY);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Glow under scan line
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fillRect(40, 40 + scanLineY - 10, canvasRef.current.width - 80, 20);

      scanLineY += 2 * scanDirection;
      if (scanLineY > canvasRef.current.height - 80 || scanLineY < 0) {
        scanDirection *= -1;
      }

      animationId = requestAnimationFrame(drawHUD);
    };

    drawHUD();
    return () => cancelAnimationFrame(animationId);
  }, [isScanning]);

  if (!hasPermission) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>
        {i18n.language === 'ar' ? 'تم رفض إذن الكاميرا. لن يتم تسجيل تحليل الانفعالات.' : 'Camera permission denied. Emotion analysis will not be recorded.'}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '220px', height: '160px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#000' }}>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} 
      />
      <canvas 
        ref={canvasRef} 
        width="220" 
        height="160" 
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 10, pointerEvents: 'none' }}
      />
      
      {/* Live Metrics Overlay */}
      <div style={{ position: 'absolute', bottom: '4px', left: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: '6px', padding: '4px 8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#10b981', fontWeight: 'bold', fontFamily: 'monospace' }}>
        <span>CONF: {Math.round(metrics.confidence)}%</span>
        <span style={{ color: '#fca311' }}>FCS: {Math.round(metrics.focus)}%</span>
      </div>
      
      <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444', animation: 'pulse 1s infinite' }}></div>
        <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 'bold' }}>REC</span>
      </div>
    </div>
  );
}

export default VideoAnalyzer;
