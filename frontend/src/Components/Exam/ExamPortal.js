import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Clock, ShieldCheck, PlayCircle, Loader2, Save, Send, ShieldAlert, AlertTriangle, UserCheck, Volume2, VolumeX, Camera, RefreshCw } from 'lucide-react';
import { API_BASE } from '../../config/api';

const enterFullScreen = () => {
  try {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log("Fullscreen request blocked or already active:", err));
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    }
  } catch (err) {
    console.error("Error attempting to enable fullscreen:", err);
  }
};

const exitFullScreen = () => {
  try {
    const isFS = document.fullscreenElement || document.webkitFullscreenElement;
    if (isFS) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log("Exit fullscreen error:", err));
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  } catch (err) {
    console.error("Error attempting to exit fullscreen:", err);
  }
};

const ExamPortal = ({ credentialId }) => {
  const [loading, setLoading] = useState(!!credentialId);
  const [error, setError] = useState(null);
  const [examData, setExamData] = useState(null);
  
  const [examState, setExamState] = useState(credentialId ? 'compliance' : 'login'); // 'login', 'scheduled', 'compliance', 'taking', 'suspended', 'completed'
  const [loginForm, setLoginForm] = useState({ temp_user_id: credentialId || '', temp_password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [, setSessionInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingAnswer, setSavingAnswer] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  
  // Proctoring States
  const [cameraPermission, setCameraPermission] = useState('pending');
  const [liveStatusMessage, setLiveStatusMessage] = useState("Proctoring Active - Clean Frame");
  const [liveStatusType, setLiveStatusType] = useState('clean');
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);
  
  // Refs to avoid stale closures in event listeners
  const examStateRef = useRef(examState);
  const credentialIdRef = useRef(credentialId);
  const lastWarningTimeRef = useRef(0);
  const phoneDetectedStreakRef = useRef(0);
  const tabWarningActiveRef = useRef(false);
  const tabCountdownIntervalRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [tabWarningCountdown, setTabWarningCountdown] = useState(5);
  const [tabWarningActive, setTabWarningActive] = useState(false);
  const [muteAlerts, setMuteAlerts] = useState(false);
  const muteAlertsRef = useRef(false);

  const activeCredId = (credentialId || examData?.temp_user_id || loginForm.temp_user_id || '').trim().replace(/\s+/g, '-');

  useEffect(() => {
    examStateRef.current = examState;
    credentialIdRef.current = activeCredId;
    muteAlertsRef.current = muteAlerts;
  }, [examState, activeCredId, muteAlerts]);

  const playAlertSound = (severity = 1) => {
    if (muteAlertsRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (severity >= 2) {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(660, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(330, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(550, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch (e) {
      console.log("Audio synthesis error:", e);
    }
  };

  const reopenCamera = async () => {
    setCameraPermission('pending');
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraPermission('granted');
      setLiveStatusMessage("Proctoring Active - Clean Frame");
      setLiveStatusType('clean');
    } catch (err) {
      console.error("Camera error:", err);
      setCameraPermission('denied');
      if (examState === 'taking') {
        triggerSuspension('hardware', 'Camera access was denied or hardware disconnected.');
      }
    }
  };

  useEffect(() => {
    const rawId = (credentialId || '').trim();
    if (!rawId) {
      setExamState('login');
      setLoading(false);
      return;
    }

    const cleanId = rawId.replace(/\s+/g, '-');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second safety timeout

    const verifyCredential = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/v1/exam-engine/credentials/${encodeURIComponent(cleanId)}`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Failed to verify credential. It may be invalid or expired.');
        const data = await res.json();
        setExamData(data);

        if (data.status === 'not_yet_available') {
          setExamState('scheduled');
        } else if (data.is_valid && data.status === 'ready') {
          setExamState('compliance');
        } else {
          throw new Error(`Credential status: ${data.status.replace(/_/g, ' ')}`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        const errorMsg = err.name === 'AbortError'
          ? 'Network timeout while verifying credential. Please check your internet connection or backend server status.'
          : (err.message || 'Error connecting to exam server.');
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    verifyCredential();

    return () => clearTimeout(timeoutId);
  }, [credentialId]);

  const handleCredentialLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.temp_user_id || !loginForm.temp_password) {
      setLoginError("Please enter both Temporary User ID / Booking Ref and Access Password.");
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const cleanUserId = loginForm.temp_user_id.trim().replace(/\s+/g, '-');
      const res = await fetch(`${API_BASE}/api/v1/exam-engine/credentials/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temp_user_id: cleanUserId,
          temp_password: loginForm.temp_password.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Invalid Temporary User ID or Access Password.');
      }

      const data = await res.json();
      setExamData(data);
      if (data.status === 'not_yet_available') {
        setExamState('scheduled');
      } else if (data.is_valid && data.status === 'ready') {
        setExamState('compliance');
      } else {
        setLoginError(`Credential status: ${data.status.replace(/_/g, ' ')}`);
      }
    } catch (err) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };



  const logViolation = async (type, message, severity = 1) => {
    try {
      const targetId = credentialIdRef.current || activeCredId;
      await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/violations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message, severity })
      });
    } catch (err) { console.error("Failed to log violation", err); }
  };

  const triggerSuspension = async (type, message) => {
    playAlertSound(2);
    setSuspensionReason(message);
    setExamState('suspended');
    
    // Stop timers & cameras
    if (timerRef.current) clearInterval(timerRef.current);
    if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
    tabWarningActiveRef.current = false;
    setTabWarningActive(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    exitFullScreen();

    try {
      const targetId = credentialIdRef.current || activeCredId;
      await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, message })
      });
    } catch (err) { console.error("Failed to suspend", err); }
  };

  // Timer logic
  useEffect(() => {
    if (examState === 'taking' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState, timeLeft]);

  // Tab switch & Fullscreen logic
  useEffect(() => {
    if (examState !== 'taking') return;

    const handleCopyPaste = (e) => {
      e.preventDefault();
      logViolation('copy_paste', 'Learner attempted to copy, paste, or use context menu.', 0);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        logViolation('screenshot', 'Learner attempted to use PrintScreen key.', 1);
      }
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'S', 'P'].includes(e.key)) {
        e.preventDefault();
        logViolation('screenshot', `Learner attempted to use save/print shortcut: ${e.key}`, 1);
      }
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      logViolation('navigation', 'Learner attempted to close or refresh the tab.', 1);
    };

    const handlePopState = () => {
      logViolation('navigation', 'Learner used browser back/forward buttons.', 1);
      window.history.pushState(null, null, window.location.href);
    };

    const handleTabSwitchAlert = (violationType) => {
      if (tabWarningActiveRef.current) return;
      playAlertSound(1);
      tabWarningActiveRef.current = true;
      setTabWarningActive(true);
      setTabWarningCountdown(5);
      
      let count = 5;
      if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
      tabCountdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(tabCountdownIntervalRef.current);
          tabWarningActiveRef.current = false;
          setTabWarningActive(false);
          const msg = violationType === 'fullscreen' ? 'Exited Full Screen and failed to return within 5 seconds.' : 'Failed to return to test window within 5 seconds.';
          triggerSuspension(violationType, msg);
        } else {
          setTabWarningCountdown(count);
        }
      }, 1000);
    };

    const handleReturnToTab = (violationType) => {
      if (tabCountdownIntervalRef.current) {
        clearInterval(tabCountdownIntervalRef.current);
        tabCountdownIntervalRef.current = null;
      }
      tabWarningActiveRef.current = false;
      setTabWarningActive(false);
      const msg = violationType === 'fullscreen' ? 'Returned to Full Screen within 5s.' : 'Returned to test window within 5s.';
      logViolation(violationType, msg);
    };

    const handleVis = () => {
      if (document.hidden) handleTabSwitchAlert('tab_switch');
      else if (tabWarningActiveRef.current) handleReturnToTab('tab_switch');
    };

    const handleBlur = () => handleTabSwitchAlert('tab_switch');
    const handleFocus = () => { if (tabWarningActiveRef.current) handleReturnToTab('tab_switch'); };

    const handleFS = () => {
      const isFS = document.fullscreenElement || document.webkitFullscreenElement;
      if (!isFS) handleTabSwitchAlert('fullscreen');
      else if (tabWarningActiveRef.current) handleReturnToTab('fullscreen');
    };

    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('fullscreenchange', handleFS);
    document.addEventListener('webkitfullscreenchange', handleFS);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('contextmenu', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    
    // Push state so popstate can intercept back button
    window.history.pushState(null, null, window.location.href);

    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('fullscreenchange', handleFS);
      document.removeEventListener('webkitfullscreenchange', handleFS);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('contextmenu', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState]);

  // Video AI monitoring
  useEffect(() => {
    let stream = null;
    let monitorInterval = null;

    if (examState === 'taking') {
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        .then((videoStream) => {
          stream = videoStream;
          if (videoRef.current) videoRef.current.srcObject = videoStream;
          setCameraPermission('granted');
          monitorInterval = setInterval(analyzeVideoFrame, 800);
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setCameraPermission('denied');
          triggerSuspension('hardware', 'Camera access was denied or hardware disconnected.');
        });
    } else {
        if (videoRef.current && videoRef.current.srcObject) {
          videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
      }

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
      if (screenStreamRef.current) screenStreamRef.current.getTracks().forEach(track => track.stop());
      if (monitorInterval) clearInterval(monitorInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState]);

  const analyzeVideoFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4 || examStateRef.current !== 'taking') return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    let faceDetected = false;
    let faceCount = 0;
    let headTurned = false;
    let phoneDetected = false;

    if (window.BarcodeDetector) {
      try {
        if (!window._barcodeDetector) window._barcodeDetector = new window.BarcodeDetector({ formats: ['qr_code', 'code_128', 'data_matrix'] });
        const barcodes = await window._barcodeDetector.detect(canvas);
        if (barcodes && barcodes.length > 0) phoneDetected = true;
      } catch (e) {}
    }
    if (!phoneDetected) {
      const imageData = ctx.getImageData(0, 0, 160, 120).data;
      let glarePixels = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        if (imageData[i] > 245 && imageData[i+1] > 245 && imageData[i+2] > 245) glarePixels++;
      }
      // Require over 6,000 extreme white pixels (>30% of webcam canvas) to consider screen glare as potential device
      if (glarePixels > 6000) phoneDetected = true;
    }

    if (window.FaceDetector) {
      try {
        if (!faceDetectorRef.current) faceDetectorRef.current = new window.FaceDetector({ fastMode: true });
        const faces = await faceDetectorRef.current.detect(canvas);
        faceCount = faces.length;
        if (faceCount > 0) {
          faceDetected = true;
          const box = faces[0].boundingBox;
          const centerX = box.x + (box.width / 2);
          if (centerX < 35 || centerX > 125) headTurned = true;
        }
      } catch (e) {}
    } else {
      // Fallback skin pixel check
      const imageData = ctx.getImageData(0, 0, 160, 120).data;
      let skinPixels = 0;
      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i], g = imageData[i+1], b = imageData[i+2];
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) skinPixels++;
      }
      if (skinPixels > 150) { faceDetected = true; faceCount = 1; }
      else if (skinPixels < 50) { faceDetected = false; faceCount = 0; }
    }

    const now = Date.now();
    if (now - lastWarningTimeRef.current < 4000) return; // Debounce

    if (phoneDetected) {
      phoneDetectedStreakRef.current += 1;
      lastWarningTimeRef.current = now;
      if (phoneDetectedStreakRef.current >= 3) {
        playAlertSound(2);
        setLiveStatusMessage("⚠️ Unauthorized Phone/Device Detected!");
        setLiveStatusType('error');
        triggerSuspension('phone', 'Unauthorized mobile phone or screen detected in camera frame.');
      } else {
        playAlertSound(1);
        setLiveStatusMessage("⚠️ Potential Device/Glare Warning");
        setLiveStatusType('warning');
        logViolation('phone', 'Potential secondary screen or reflection detected in frame.', 1);
      }
    } else {
      phoneDetectedStreakRef.current = 0;
      if (!faceDetected || faceCount === 0) {
        lastWarningTimeRef.current = now;
        playAlertSound(1);
        setLiveStatusMessage("⚠️ Learner Out of Frame");
        setLiveStatusType('error');
        logViolation('body', 'Learner out of camera frame.');
      } else if (faceCount > 1) {
        lastWarningTimeRef.current = now;
        playAlertSound(2);
        setLiveStatusMessage("⚠️ Multiple Faces Detected!");
        setLiveStatusType('error');
        triggerSuspension('multi_person', 'Multiple individuals detected in camera frame.');
      } else if (headTurned) {
        lastWarningTimeRef.current = now;
        playAlertSound(1);
        setLiveStatusMessage("⚠️ Eye/Head deviation detected.");
        setLiveStatusType('warning');
        logViolation('eye', 'Eye or head deviation detected.');
      } else {
        setLiveStatusMessage("Proctoring Active - Clean Frame");
        setLiveStatusType('clean');
      }
    }
  };

  const handleStartExam = async () => {
    setLoading(true);
    try {
      if (examData?.requires_screenshare) {
        try {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          screenStreamRef.current = stream;
          stream.getVideoTracks()[0].addEventListener('ended', () => {
            triggerSuspension('screen_share', 'Screen sharing was stopped.');
          });
        } catch (e) {
          throw new Error('Screen sharing is required for this exam. Please grant permission to continue.');
        }
      }
      
      enterFullScreen(); // Request before API call
      const targetId = credentialIdRef.current || activeCredId;
      const res = await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/start`, { method: 'POST' });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to start exam session');
      }
      const data = await res.json();
      setSessionInfo(data);
      setQuestions(data.questions);
      setTimeLeft(data.remaining_seconds !== undefined ? data.remaining_seconds : data.duration_minutes * 60);
      setExamState('taking');
    } catch (err) {
      setError(err.message);
      exitFullScreen();
    } finally {
      setLoading(false);
    }
  };

  const pollForResume = async () => {
    try {
      const targetId = credentialIdRef.current || activeCredId;
      const res = await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/status`);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'active') {
          if (data.remaining_seconds !== undefined) setTimeLeft(data.remaining_seconds);
          enterFullScreen();
          setExamState('taking');
        } else if (data.status === 'terminated') {
          setExamState('completed'); // It's terminated, so end exam
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    let pollInterval;
    if (examState === 'suspended') {
      pollInterval = setInterval(pollForResume, 5000);
    }
    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examState]);

  const handleSelectAnswer = async (qId, optIndex) => {
    setAnswers(prev => ({ ...prev, [qId]: optIndex }));
    setSavingAnswer(true);
    try {
      const targetId = credentialIdRef.current || activeCredId;
      await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: qId, answer: optIndex })
      });
    } catch (err) {} finally { setSavingAnswer(false); }
  };

  const [scoreResult, setScoreResult] = useState(null);

  const handleSubmitExam = async () => {
    if (timeLeft > 0 && !window.confirm("Are you sure you want to submit your exam? You cannot change answers after submitting.")) return;
    
    setLoading(true);
    try {
      const targetId = credentialIdRef.current || activeCredId;
      const res = await fetch(`${API_BASE}/api/v1/exam-engine/sessions/${targetId}/submit`, {
        method: 'POST'
      });
      const data = await res.json();
      setScoreResult(data);
    } catch (err) {
      console.error(err);
    }
    
    setExamState('completed');
    setLoading(false);
    exitFullScreen();
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (examState === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 border border-slate-200 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-900">Exam Access Portal</h1>
            <p className="text-slate-500 text-sm font-medium">
              Enter the Temporary User ID and Access Password sent to your email to log into your formal examination.
            </p>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleCredentialLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Temporary User ID / Booking Ref
              </label>
              <input
                type="text"
                placeholder="E.g., SF-4A8B9C12 or BKG-123456"
                value={loginForm.temp_user_id}
                onChange={(e) => setLoginForm({ ...loginForm, temp_user_id: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                Access Password / Passcode
              </label>
              <input
                type="password"
                placeholder="Enter access password from email"
                value={loginForm.temp_password}
                onChange={(e) => setLoginForm({ ...loginForm, temp_password: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50"
            >
              {loginLoading ? <Loader2 size={20} className="animate-spin" /> : <PlayCircle size={20} />}
              <span>Verify & Launch Exam</span>
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <a href="/" className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
              ← Return to PEARL LMS Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (examState === 'scheduled' || (examData && !examData.is_valid && examData.status === 'not_yet_available')) {
    const windowStart = examData?.window_start ? new Date(examData.window_start) : null;
    const windowStartStr = windowStart ? windowStart.toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }) : 'Scheduled Check-in Time';

    const bookedSlotText = examData?.slot_date && examData?.slot_time
      ? `${examData.slot_date} (${examData.slot_time})`
      : (examData?.slot_datetime ? new Date(examData.slot_datetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Exam Slot Time');

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 select-none">
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8 border border-slate-200 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner animate-pulse">
            <Clock size={44} />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold uppercase tracking-wider">
              Exam Window Not Active Yet
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {examData?.subject_name || 'Formal Assessment'}
            </h1>
            <p className="text-sm font-bold text-indigo-600">
              Level: {examData?.level || 'District'} · Candidate: {examData?.student_name || 'Student'}
            </p>
          </div>

          <div className="bg-slate-50 border-2 border-slate-200 p-5 rounded-2xl space-y-4 text-left">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
              <span className="text-xs font-extrabold uppercase text-indigo-700 block text-center mb-1">
                📅 Scheduled Exam Slot Time
              </span>
              <div className="text-base font-black text-indigo-950 text-center font-mono">
                {bookedSlotText}
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl">
              <span className="text-xs font-extrabold uppercase text-amber-800 block text-center mb-1">
                ⏱️ Check-in Window Opens At (30 Mins Prior):
              </span>
              <div className="text-sm font-black text-amber-950 text-center font-mono">
                {windowStartStr}
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-500 leading-relaxed text-center">
              Check-in opens 30 minutes prior to your scheduled exam slot. Please return at that time to complete pre-exam compliance and start your exam.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <a
              href="/"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center"
            >
              Return to Dashboard
            </a>
            <button
              type="button"
              onClick={() => {
                if (credentialId) {
                  window.location.reload();
                } else if (loginForm.temp_user_id && loginForm.temp_password) {
                  handleCredentialLogin();
                }
              }}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Check Access Status</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && examState === 'compliance') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium text-lg animate-pulse">Verifying Exam Credential...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-4 border-rose-500">
          <div className="bg-rose-100 text-rose-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <a href="/" className="inline-block bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl hover:bg-slate-900 transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (examState === 'suspended') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center border-t-4 border-rose-600">
          <div className="bg-rose-100 text-rose-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-rose-700 mb-2">Exam Suspended</h2>
          <p className="text-slate-800 font-medium mb-4">{suspensionReason}</p>
          <p className="text-slate-500 text-sm mb-8">
            Your session has been locked due to a critical proctoring violation. 
            An administrator must review the logs and approve resumption before you can continue.
            The system is polling for clearance automatically...
          </p>
          <div className="flex justify-center"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
        </div>
      </div>
    );
  }

  if (examState === 'completed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className={`bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-4 ${scoreResult?.passed ? 'border-emerald-500' : 'border-rose-500'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${scoreResult?.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Exam Submitted</h2>
          <p className="text-slate-600 mb-6">Your answers have been securely submitted and sent back to PEARL.</p>
          
          {scoreResult && (
            <div className="mb-8">
              <div className={`p-4 rounded-xl mb-4 ${scoreResult.passed ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'}`}>
                <div className="text-sm font-bold uppercase tracking-wider mb-1">Score</div>
                <div className="text-4xl font-black">{Math.round(scoreResult.score_percentage)}%</div>
                <div className="text-sm font-semibold mt-1">
                  {scoreResult.level ? `${scoreResult.level} Level: ` : ''}
                  {scoreResult.passed ? 'QUALIFIED / PASSED' : 'NOT QUALIFIED / FAILED'}
                </div>
              </div>
              {scoreResult.topic_breakdown && Object.keys(scoreResult.topic_breakdown).length > 0 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Topic-Wise Performance</h4>
                  <div className="space-y-2">
                    {Object.entries(scoreResult.topic_breakdown).map(([topic, stats]) => (
                      <div key={topic} className="flex justify-between items-center text-sm">
                        <span className="font-medium text-slate-700 truncate mr-2">{topic}</span>
                        <span className="text-slate-600 font-mono text-xs">
                          {stats.correct}/{stats.total} ({stats.accuracy}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <a href="/" className="inline-block bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  if (examState === 'taking') {
    if (questions.length === 0) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center border-t-4 border-amber-500">
            <div className="bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Questions Found</h2>
            <p className="text-slate-600 mb-8">This exam does not currently have any questions assigned to its formal question bank. Please notify your administrator to add questions.</p>
            <button 
              onClick={handleSubmitExam} 
              className="inline-block bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-indigo-700 transition-colors">
              Submit Empty Exam
            </button>
          </div>
        </div>
      );
    }
    
    const currentQ = questions[currentQuestionIndex];
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col select-none">
        
        {/* Fullscreen Violation Warning Overlay */}
        {tabWarningActive && (
          <div className="fixed inset-0 bg-rose-600/95 z-[9999] flex flex-col items-center justify-center text-white">
            <AlertTriangle size={80} className="mb-6 animate-pulse" />
            <h2 className="text-4xl font-bold mb-4 text-center px-4">RETURN TO EXAM WINDOW IMMEDIATELY!</h2>
            <p className="text-xl max-w-2xl text-center mb-8">
              You have left the authorized full-screen examination environment. 
              Your session will be suspended if you do not return in:
            </p>
            <div className="text-8xl font-black">{tabWarningCountdown}s</div>
            <button onClick={enterFullScreen} className="mt-12 bg-white text-rose-600 px-8 py-4 rounded-full font-bold text-xl hover:bg-rose-50 shadow-2xl">
              Return to Full Screen
            </button>
          </div>
        )}

        <header className="bg-indigo-900 text-white py-3 px-6 md:px-8 flex justify-between items-center shadow-md sticky top-0 z-50">
          <div className="font-bold flex items-center gap-3">
            <ShieldCheck className="text-indigo-300" />
            <span>{examData.subject_name} ({examData.level})</span>
          </div>
          
          <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border shadow-inner ${
            liveStatusType === 'clean' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
            liveStatusType === 'warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
            'bg-rose-500/20 text-rose-300 border-rose-500/30'
          }`}>
            <UserCheck size={14} /> {liveStatusMessage}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMuteAlerts(!muteAlerts)} 
              title={muteAlerts ? "Unmute Proctoring Alerts" : "Mute Proctoring Alerts"}
              className="p-2 rounded-lg bg-indigo-800/60 hover:bg-indigo-800 text-indigo-300 transition-colors"
            >
              {muteAlerts ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            {savingAnswer && <span className="text-xs text-indigo-300 flex items-center gap-1"><Save size={12} className="animate-pulse" /> Saving...</span>}
            <div className={`font-mono text-lg font-bold flex items-center gap-2 bg-indigo-800/50 py-1.5 px-4 rounded-lg ${timeLeft < 300 ? 'text-rose-400' : 'text-emerald-400'}`}>
              <Clock size={18} /> {formatTime(timeLeft)}
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex w-full max-w-7xl mx-auto overflow-hidden">
          {/* Question List Sidebar */}
          <div className="w-64 bg-white border-r border-slate-200 overflow-y-auto hidden md:block">
            {/* Live Camera Feed */}
            <div className="p-4 border-b border-slate-100 bg-slate-900 flex justify-center relative">
              <video 
                ref={videoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-auto rounded-lg shadow-inner bg-black border border-slate-700" 
                style={{ transform: 'scaleX(-1)' }} 
              />
              <canvas ref={canvasRef} className="hidden" />
              {cameraPermission !== 'granted' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 rounded-lg p-3 text-center">
                  <Camera className="text-slate-400 mb-2" size={24} />
                  <p className="text-xs text-slate-300 mb-2">{cameraPermission === 'denied' ? 'Camera Denied / Error' : 'Connecting Camera...'}</p>
                  <button onClick={reopenCamera} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-1 shadow">
                    <RefreshCw size={12} /> Re-open Camera
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Questions Overview</div>
            <div className="p-4 grid grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                return (
                  <button 
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all
                      ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1' : ''}
                      ${isAnswered ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Main Question Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12 flex flex-col items-center relative">
            <div className="w-full max-w-3xl">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-lg font-bold text-slate-500 uppercase tracking-wider">Question {currentQuestionIndex + 1} of {questions.length}</h2>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-6 relative">
                <p className="text-xl text-slate-800 font-medium leading-relaxed mb-8">{currentQ.text}</p>
                <div className="space-y-3">
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = answers[currentQ.id] === oIdx;
                    return (
                      <div 
                        key={oIdx}
                        onClick={() => handleSelectAnswer(currentQ.id, oIdx)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                          ${isSelected ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-sm' : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50'}
                        `}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                          ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}
                        `}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className="font-medium">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <button 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                  className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                
                {currentQuestionIndex === questions.length - 1 ? (
                  <button 
                    onClick={handleSubmitExam}
                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2"
                  >
                    Submit Exam <Send size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                    className="px-8 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-all"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // default: compliance state
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 flex justify-between items-center shadow-sm">
        <div className="font-bold text-xl text-indigo-900 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" />
          PEARL Formal Examination
        </div>
        <div className="text-sm font-medium text-slate-500 bg-slate-100 py-1.5 px-3 rounded-full flex items-center gap-2">
          <Clock size={14} /> Time Window Strict Enforcement
        </div>
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{examData?.subject_name}</h1>
            <p className="text-indigo-100 font-medium text-lg">Level: {examData?.level}</p>
          </div>
          
          <div className="p-8">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" /> Pre-Exam Compliance Verification
              </h3>
              <ul className="space-y-3 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold mt-0.5">1</div>
                  <span>Ensure you are in a quiet, well-lit room. Your webcam will be monitored.</span>
                </li>
                {examData?.requires_screenshare && (
                  <li className="flex items-start gap-2 text-indigo-700 font-semibold bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                    <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center shrink-0 text-indigo-800 font-bold mt-0.5">!</div>
                    <span>This exam requires you to share your screen. You will be prompted to select 'Entire Screen' when you click Start.</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold mt-0.5">2</div>
                  <span>Leaving full-screen or switching tabs will suspend the exam and require Admin approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold mt-0.5">3</div>
                  <span>Copy, paste, and right-click are strictly disabled.</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold mt-0.5">4</div>
                  <span>By proceeding, you agree to the Academic Integrity Honor Code.</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-900 rounded-xl p-4 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 text-white shadow-inner">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${cameraPermission === 'granted' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  <Camera size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Hardware & Webcam Readiness</h4>
                  <p className="text-xs text-slate-400">{cameraPermission === 'granted' ? 'Webcam active & verified ready' : cameraPermission === 'denied' ? 'Camera permission denied or disconnected' : 'Webcam not tested yet'}</p>
                </div>
              </div>
              <button 
                onClick={reopenCamera}
                type="button"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 px-4 rounded-lg text-xs flex items-center gap-2 shrink-0 transition-all shadow"
              >
                <RefreshCw size={14} /> {cameraPermission === 'granted' ? 'Re-test Camera' : 'Test & Open Camera'}
              </button>
            </div>
            
            <div className="flex justify-between items-center border-t border-slate-100 pt-6">
              <div className="text-sm text-slate-500">
                Candidate: <span className="font-bold text-slate-800">{examData?.student_name}</span>
              </div>
              <button 
                onClick={handleStartExam}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Start Exam'} <PlayCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamPortal;
