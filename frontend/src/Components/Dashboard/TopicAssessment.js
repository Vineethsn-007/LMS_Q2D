import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Brain, Award, CheckCircle, AlertCircle, 
  ChevronRight, ChevronLeft, Clock, Zap, X, 
  ArrowRight, ShieldCheck, Check,
  RotateCcw, BookOpen, Layers, Code, Database,
  Eye, AlertTriangle, ShieldAlert, FileText,
  Volume2, VolumeX, Maximize2, Minimize2, Activity, UserCheck
} from 'lucide-react';
import './TopicAssessment.css';

const SUGGESTED_TOPICS = [
  { title: "Quantitative Aptitude & Speed Math", category: "Aptitude", icon: Brain, color: "text-amber-600", bg: "bg-amber-100" },
  { title: "Logical Reasoning & Puzzles", category: "Reasoning", icon: Zap, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "Probability & Combinatorics", category: "Mathematics", icon: Award, color: "text-emerald-600", bg: "bg-emerald-100" },
  { title: "Python Asyncio & Concurrency", category: "Backend", icon: Code, color: "text-blue-600", bg: "bg-blue-100" },
  { title: "React 19 & Server Components", category: "Frontend", icon: Layers, color: "text-cyan-600", bg: "bg-cyan-100" },
  { title: "SQL Indexing & Query Optimization", category: "Database", icon: Database, color: "text-rose-600", bg: "bg-rose-100" },
];

const enterFullScreen = () => {
  try {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.log("Fullscreen request blocked or already active:", err));
    } else if (elem.mozRequestFullScreen) { /* Firefox */
      elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
      elem.msRequestFullscreen();
    }
  } catch (err) {
    console.error("Error attempting to enable fullscreen:", err);
  }
};

const exitFullScreen = () => {
  try {
    const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
    if (isFS) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log("Exit fullscreen error:", err));
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  } catch (err) {
    console.error("Error attempting to exit fullscreen:", err);
  }
};

const TopicAssessment = ({ user, initialTopic, onClearTopic, onBack, onTestCompleted }) => {
  const [step, setStep] = useState('setup'); // 'setup', 'loading', 'taking', 'report'
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Proctoring & Real-Time Monitoring State
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [eyeWarningCount, setEyeWarningCount] = useState(0);
  const [bodyWarningCount, setBodyWarningCount] = useState(0);
  const [autoSkipCount, setAutoSkipCount] = useState(0);
  const [proctorLog, setProctorLog] = useState([]);
  const [tabWarningActive, setTabWarningActive] = useState(false);
  const [tabWarningCountdown, setTabWarningCountdown] = useState(5);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60);
  const [cameraPermission, setCameraPermission] = useState('pending'); // 'pending', 'granted', 'denied', 'error'
  const [liveStatusMessage, setLiveStatusMessage] = useState("Proctoring Active - Clean Frame");
  const [liveStatusType, setLiveStatusType] = useState('clean'); // 'clean', 'warning', 'error'
  const [cameraMinimized, setCameraMinimized] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Refs for AI and video
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);
  const lastWarningTimeRef = useRef(0);
  const tabWarningActiveRef = useRef(false);
  const tabCountdownIntervalRef = useRef(null);
  const elapsedSecondsRef = useRef(0);
  const currentQIndexRef = useRef(0);
  const questionsLengthRef = useRef(0);
  const audioEnabledRef = useRef(true);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
    currentQIndexRef.current = currentQIndex;
    questionsLengthRef.current = questions.length;
    audioEnabledRef.current = audioEnabled;
  }, [elapsedSeconds, currentQIndex, questions.length, audioEnabled]);

  // Auto-start test when navigating from Mock Tests tab
  useEffect(() => {
    if (initialTopic && step === 'setup') {
      setTopicInput(initialTopic);
      // Delay slightly to allow state to settle
      const timer = setTimeout(() => {
        handleStartGeneration(initialTopic);
        if (onClearTopic) onClearTopic();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTopic]);

  const playAudioAlert = (type = 'warn') => {
    if (!audioEnabledRef.current) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(293.66, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  const resetProctoringState = () => {
    setTabSwitchCount(0);
    setEyeWarningCount(0);
    setBodyWarningCount(0);
    setAutoSkipCount(0);
    setProctorLog([]);
    setTabWarningActive(false);
    tabWarningActiveRef.current = false;
    if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
    setQuestionTimeLeft(60);
    setLiveStatusMessage("Proctoring Active - Clean Frame");
    setLiveStatusType('clean');
  };

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sf_topic_assessment_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Reset 1-minute question timer whenever question index changes
  useEffect(() => {
    if (step === 'taking') {
      setQuestionTimeLeft(60);
    }
  }, [currentQIndex, step]);

  const handleQuestionTimeExpired = () => {
    playAudioAlert('warn');
    setAutoSkipCount(prev => prev + 1);
    const qNum = currentQIndexRef.current + 1;
    setProctorLog(prev => [{
      id: Date.now(),
      time: formatTime(elapsedSecondsRef.current),
      type: 'timer',
      message: `Time limit (60s) expired on Question #${qNum}. Auto-advanced to next question.`
    }, ...prev]);

    if (currentQIndexRef.current < questionsLengthRef.current - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      handleSubmitAssessment();
    }
  };

  // Timer effect for quiz taking and 60s per-question countdown
  useEffect(() => {
    let interval = null;
    if (timerActive && step === 'taking') {
      interval = setInterval(() => {
        setElapsedSeconds(sec => sec + 1);
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleQuestionTimeExpired();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, step]);

  // Tab/Browser switch detection & 5-second countdown
  useEffect(() => {
    if (step !== 'taking') return;

    const triggerTabSwitchAlert = (violationType = 'tab') => {
      if (tabWarningActiveRef.current) return;
      tabWarningActiveRef.current = true;
      setTabWarningActive(true);
      setTabWarningCountdown(5);
      playAudioAlert('critical');

      let count = 5;
      if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
      tabCountdownIntervalRef.current = setInterval(() => {
        count -= 1;
        if (count <= 0) {
          clearInterval(tabCountdownIntervalRef.current);
          tabCountdownIntervalRef.current = null;
          tabWarningActiveRef.current = false;
          setTabWarningActive(false);
          
          setTabSwitchCount(prev => prev + 1);
          setProctorLog(prev => [{
            id: Date.now(),
            time: formatTime(elapsedSecondsRef.current),
            type: 'tab_violation',
            message: violationType === 'fullscreen'
              ? 'CRITICAL VIOLATION: Exited Full Screen mode and failed to return within 5 seconds. Assessment auto-submitted!'
              : 'CRITICAL VIOLATION: Failed to return to test window within 5 seconds. Assessment auto-submitted!'
          }, ...prev]);

          handleSubmitAssessment();
        } else {
          setTabWarningCountdown(count);
          playAudioAlert('warn');
        }
      }, 1000);
    };

    const handleReturnToTab = (violationType = 'tab') => {
      if (tabCountdownIntervalRef.current) {
        clearInterval(tabCountdownIntervalRef.current);
        tabCountdownIntervalRef.current = null;
      }
      tabWarningActiveRef.current = false;
      setTabWarningActive(false);
      setTabSwitchCount(prev => prev + 1);
      setProctorLog(prev => [{
        id: Date.now(),
        time: formatTime(elapsedSecondsRef.current),
        type: 'tab',
        message: violationType === 'fullscreen'
          ? 'Full Screen exit detected. Learner returned to Full Screen within 5s warning limit.'
          : 'Browser/Tab switch detected. Learner returned within 5s warning limit.'
      }, ...prev]);
      playAudioAlert('beep');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerTabSwitchAlert('tab');
      } else {
        if (tabWarningActiveRef.current) {
          handleReturnToTab('tab');
        }
      }
    };

    const handleWindowBlur = () => {
      triggerTabSwitchAlert('tab');
    };

    const handleWindowFocus = () => {
      if (tabWarningActiveRef.current) {
        handleReturnToTab('tab');
      }
    };

    const handleFullscreenChange = () => {
      const isFS = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      if (!isFS) {
        triggerTabSwitchAlert('fullscreen');
      } else {
        if (tabWarningActiveRef.current) {
          handleReturnToTab('fullscreen');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      if (tabCountdownIntervalRef.current) clearInterval(tabCountdownIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Live Camera Stream & Real-Time AI Monitoring Loop
  useEffect(() => {
    let stream = null;
    let monitorInterval = null;

    if (step === 'taking') {
      setCameraPermission('pending');
      navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        .then((videoStream) => {
          stream = videoStream;
          if (videoRef.current) {
            videoRef.current.srcObject = videoStream;
          }
          setCameraPermission('granted');
          setLiveStatusMessage("Proctoring Active - Clean Frame");
          setLiveStatusType('clean');

          monitorInterval = setInterval(() => {
            analyzeVideoFrame();
          }, 600);
        })
        .catch((err) => {
          console.error("Camera access failed:", err);
          setCameraPermission('denied');
          setLiveStatusMessage("⚠️ Camera access denied or unavailable");
          setLiveStatusType('error');
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (monitorInterval) clearInterval(monitorInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const analyzeVideoFrame = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 160;
    canvas.height = 120;
    ctx.drawImage(video, 0, 0, 160, 120);

    let faceDetected = false;
    let faceCount = 0;
    let headTurned = false;

    if (window.FaceDetector) {
      try {
        if (!faceDetectorRef.current) {
          faceDetectorRef.current = new window.FaceDetector({ maxDetectedFaces: 3, fastMode: true });
        }
        const faces = await faceDetectorRef.current.detect(canvas);
        faceCount = faces.length;
        if (faceCount > 0) {
          faceDetected = true;
          const face = faces[0];
          const box = face.boundingBox;
          const centerX = box.x + (box.width / 2);
          if (centerX < 35 || centerX > 125 || box.width < 22) {
            headTurned = true;
          }
        }
      } catch (e) {}
    }

    if (!window.FaceDetector || faceCount === 0) {
      const imageData = ctx.getImageData(0, 0, 160, 120).data;
      let skinPixels = 0;
      let leftZoneSkin = 0;
      let rightZoneSkin = 0;
      let centerZoneSkin = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        const r = imageData[i];
        const g = imageData[i+1];
        const b = imageData[i+2];
        const x = (i / 4) % 160;
        
        if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15) {
          skinPixels++;
          if (x < 45) leftZoneSkin++;
          else if (x > 115) rightZoneSkin++;
          else centerZoneSkin++;
        }
      }

      if (skinPixels > 150) {
        faceDetected = true;
        faceCount = 1;
        if ((leftZoneSkin > centerZoneSkin * 1.5 && leftZoneSkin > 100) || (rightZoneSkin > centerZoneSkin * 1.5 && rightZoneSkin > 100)) {
          headTurned = true;
        }
      } else if (skinPixels < 50) {
        faceDetected = false;
        faceCount = 0;
      }
    }

    const now = Date.now();
    if (now - lastWarningTimeRef.current < 3500) return;

    if (!faceDetected || faceCount === 0) {
      lastWarningTimeRef.current = now;
      setBodyWarningCount(prev => prev + 1);
      setLiveStatusMessage("⚠️ Learner Out of Frame - Return immediately!");
      setLiveStatusType('error');
      playAudioAlert('warn');
      setProctorLog(prev => [{
        id: now,
        time: formatTime(elapsedSecondsRef.current),
        type: 'body',
        message: 'Learner out of camera frame or body absence detected.'
      }, ...prev]);
    } else if (faceCount > 1) {
      lastWarningTimeRef.current = now;
      setBodyWarningCount(prev => prev + 1);
      setLiveStatusMessage("⚠️ Multiple Faces Detected! Unauthorized presence.");
      setLiveStatusType('error');
      playAudioAlert('critical');
      setProctorLog(prev => [{
        id: now,
        time: formatTime(elapsedSecondsRef.current),
        type: 'body',
        message: 'Multiple individuals detected in camera frame.'
      }, ...prev]);
    } else if (headTurned) {
      lastWarningTimeRef.current = now;
      setEyeWarningCount(prev => prev + 1);
      setLiveStatusMessage("⚠️ Look at the screen! Eye/Head deviation detected.");
      setLiveStatusType('warning');
      playAudioAlert('warn');
      setProctorLog(prev => [{
        id: now,
        time: formatTime(elapsedSecondsRef.current),
        type: 'eye',
        message: 'Eye or head deviation detected. Looking away from screen.'
      }, ...prev]);
    } else {
      setLiveStatusMessage("Proctoring Active - Clean Frame");
      setLiveStatusType('clean');
    }
  };

  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sanitizeFrontendQuestions = (rawList) => {
    if (!Array.isArray(rawList)) return [];
    return rawList.map(q => {
      let opts = Array.isArray(q?.options) ? q.options.map(o => strOrDefault(o, '')) : [];
      opts = opts.filter(o => o.trim() !== '');
      while (opts.length < 4) {
        opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
      }
      if (opts.length > 4) opts = opts.slice(0, 4);

      let ans = 0;
      if (typeof q?.answer === 'number') {
        ans = q.answer;
      } else if (typeof q?.answer === 'string') {
        const parsed = parseInt(q.answer, 10);
        ans = isNaN(parsed) ? 0 : parsed;
      }

      if (ans >= opts.length) {
        if (ans === opts.length || ans === 4) ans = opts.length - 1;
        else ans = ans % opts.length;
      }
      if (ans < 0) ans = 0;

      return {
        ...q,
        question: q?.question || "Question text unavailable",
        options: opts,
        answer: ans,
        explanation: q?.explanation || `Option ${String.fromCharCode(65 + ans)} is correct.`
      };
    });
  };

  const strOrDefault = (val, def) => (val !== null && val !== undefined ? String(val) : def);

  const handleStartGeneration = async (customTopic = null) => {
    const targetTopic = customTopic || topicInput;
    if (!targetTopic || !targetTopic.trim()) {
      setError("Please enter or select a topic to generate your 10-question test.");
      return;
    }
    setError(null);
    setTopicInput(targetTopic);
    enterFullScreen();
    setStep('loading');

    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/assessment/generate`;
      const token = localStorage.getItem('sf_token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          topic: targetTopic,
          difficulty: difficulty,
          count: 10
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const cleanQs = sanitizeFrontendQuestions(data);
          setQuestions(cleanQs);
          setSelectedAnswers({});
          setCurrentQIndex(0);
          setElapsedSeconds(0);
          setTimerActive(true);
          resetProctoringState();
          enterFullScreen();
          setStep('taking');
          return;
        }
      } else if (res.status === 429) {
        const errorData = await res.json();
        const limitMsg = errorData.detail || "Daily mock test limit reached. Please try again tomorrow.";
        setError(limitMsg);
        setStep('setup');
        exitFullScreen();
        return;
      }
      throw new Error("Could not synthesize test questions");
    } catch (err) {
      console.error("Test generation failed:", err);
      const msg = err.message || "Unable to generate test from server.";
      if (!msg.toLowerCase().includes("limit")) {
        const fallback = generateLocalFallback(targetTopic, 10);
        if (fallback && fallback.length > 0) {
          const cleanQs = sanitizeFrontendQuestions(fallback);
          setQuestions(cleanQs);
          setSelectedAnswers({});
          setCurrentQIndex(0);
          setElapsedSeconds(0);
          setTimerActive(true);
          resetProctoringState();
          enterFullScreen();
          setStep('taking');
          return;
        }
      }
      setError(msg);
      setStep('setup');
      exitFullScreen();
      return;
    }
  };

  const generateLocalFallback = (topic, count = 10) => {
    const topic_lower = (topic || '').toLowerCase();
    
    // 1. QUANTITATIVE APTITUDE & MATH
    if (['aptitude', 'quant', 'math', 'speed', 'distance', 'train', 'work', 'percentage', 'ratio', 'number', 'algebra'].some(k => topic_lower.includes(k))) {
      return [
        {
          question: "Question 1: A train 150 meters long is running at a speed of 60 km/hr. In how much time will it pass a person running at 6 km/hr in the opposite direction?",
          options: ["8.0 seconds", "8.18 seconds", "9.50 seconds", "10.2 seconds"],
          answer: 1,
          explanation: "Relative speed = 60 + 6 = 66 km/hr = 66 * (5/18) m/s = 18.33 m/s. Time = Distance / Speed = 150 / 18.33 = 8.18 seconds."
        },
        {
          question: "Question 2: Person A can finish a project in 12 days and Person B in 15 days. If they work together for 4 days, what fraction of work is left?",
          options: ["3/5", "2/5", "1/5", "4/5"],
          answer: 1,
          explanation: "A's 1-day work = 1/12, B's 1-day work = 1/15. Together in 1 day = 1/12 + 1/15 = 3/20. In 4 days = 4 * (3/20) = 3/5. Remaining = 1 - 3/5 = 2/5."
        },
        {
          question: "Question 3: Two cards are drawn together from a deck of 52 cards. What is the probability that both cards drawn are Kings?",
          options: ["1/221", "2/221", "1/13", "1/17"],
          answer: 0,
          explanation: "Total ways = 52C2 = 1326. Ways to pick 2 Kings = 4C2 = 6. Probability = 6 / 1326 = 1 / 221."
        },
        {
          question: "Question 4: If an item's price increases by 20% and then decreases by 20%, what is the net percentage change in final price?",
          options: ["0% (No change)", "4% decrease", "4% increase", "2% decrease"],
          answer: 1,
          explanation: "Initial = 100 -> +20% = 120 -> -20% of 120 = 96. Net change = 100 - 96 = 4% decrease."
        },
        {
          question: "Question 5: What is the next number in the sequence: 2, 6, 12, 20, 30, 42, ...?",
          options: ["54", "56", "60", "64"],
          answer: 1,
          explanation: "Differences are +4, +6, +8, +10, +12. Next difference is +14, so 42 + 14 = 56."
        },
        {
          question: "Question 6: A bag contains 6 red, 4 blue, and 5 green balls. If one ball is drawn at random, what is the probability it is NOT green?",
          options: ["2/3", "1/3", "3/5", "4/5"],
          answer: 0,
          explanation: "Total balls = 15. Non-green (red + blue) = 10. Probability = 10/15 = 2/3."
        },
        {
          question: "Question 7: If 15 workers build a 35m wall in 6 days, how many days will 25 workers take for a 50m wall?",
          options: ["5.00 days", "5.14 days", "6.00 days", "4.50 days"],
          answer: 1,
          explanation: "(M1 * D1)/W1 = (M2 * D2)/W2 -> (15 * 6)/35 = (25 * D2)/50 -> D2 = 180 / 35 = 5.14 days."
        },
        {
          question: "Question 8: An item bought for $400 is sold at 25% profit. What would be the profit percentage if sold for $550?",
          options: ["35.0%", "37.5%", "40.0%", "42.5%"],
          answer: 1,
          explanation: "Cost Price = $400. SP = $550 -> Profit = $150. Profit % = (150/400)*100 = 37.5%."
        },
        {
          question: "Question 9: Out of 60 students, 35 like Math, 30 like Science, and 10 like neither. How many students like both?",
          options: ["10", "15", "20", "25"],
          answer: 1,
          explanation: "Students liking at least one = 50. n(M U S) = n(M) + n(S) - n(M ∩ S) -> 50 = 35 + 30 - X -> X = 15."
        },
        {
          question: "Question 10: What principal amount will earn $120 in simple interest over 2 years at an annual interest rate of 6%?",
          options: ["$800", "$1,000", "$1,200", "$1,500"],
          answer: 1,
          explanation: "SI = (P * R * T) / 100 -> 120 = (P * 6 * 2) / 100 -> P = 12000 / 12 = $1,000."
        }
      ].slice(0, count);
    }

    // 2. AI / FEDERATED LEARNING / EDGE AI / ML / DATA SCIENCE
    if (['federated', 'edge', 'ai', 'learning', 'machine', 'deep', 'model', 'neural', 'vision', 'llm'].some(k => topic_lower.includes(k))) {
      return [
        {
          question: `Question 1: In ${topic}, what is the primary advantage of Federated Averaging (FedAvg) over centralized data aggregation?`,
          options: [
            "Raw client data never leaves local devices, enhancing privacy and data security.",
            "Central servers bypass neural network backpropagation completely.",
            "Device batteries are completely insulated from gradient calculations.",
            "Network bandwidth is reduced to zero during training rounds."
          ],
          answer: 0,
          explanation: "FedAvg transmits model weight/gradient updates to a central server while keeping raw telemetry on local edge devices."
        },
        {
          question: `Question 2: How does Differential Privacy mitigate data leakage in edge-based ${topic}?`,
          options: [
            "By encrypting all database indexes with AES-256 keys.",
            "By injecting controlled Gaussian/Laplacian noise into gradient updates before transmission.",
            "By converting continuous weights into binary floating point values.",
            "By restricting server access exclusively to hardware security modules."
          ],
          answer: 1,
          explanation: "Differential Privacy introduces calibrated noise into parameters to prevent adversaries from inferring individual training samples."
        },
        {
          question: `Question 3: Which technique addresses Non-IID (Non-Identically & Independently Distributed) client data in ${topic}?`,
          options: [
            "FedProx with a proximal term to penalize local weight divergence from the global model.",
            "Disabling local gradient updates on high-latency edge nodes.",
            "Replacing Stochastic Gradient Descent with deterministic linear regression.",
            "Forcing all edge nodes to execute identical batch sizes simultaneously."
          ],
          answer: 0,
          explanation: "FedProx adds a proximal regularization term to the local objective function to keep local models close to the global model."
        },
        {
          question: `Question 4: What is the main purpose of Model Quantization (e.g. FP32 to INT8) on edge AI devices?`,
          options: [
            "Increases model parameter precision to eliminate rounding errors.",
            "Reduces memory footprint and accelerates matrix operations on resource-constrained hardware.",
            "Eliminates the requirement for activation functions in convolutional layers.",
            "Automates real-time hyperparameter tuning during deployment."
          ],
          answer: 1,
          explanation: "Quantization converts floating-point weights to lower precision integers, dramatically shrinking memory usage and speeding up inference."
        },
        {
          question: `Question 5: In secure aggregation protocols for ${topic}, what prevents the central coordinator from reading individual client updates?`,
          options: [
            "Pairwise secret sharing masks that cancel out when all client updates are summed.",
            "Running inference inside isolated Docker containers.",
            "Hashing parameter names with SHA-256 before gradient calculation.",
            "Filtering out gradient vectors whose L2 norm exceeds a set threshold."
          ],
          answer: 0,
          explanation: "Secure Aggregation uses cryptographic secret sharing masks between pairs of clients so individual updates are hidden while aggregate sums remain readable."
        },
        {
          question: `Question 6: Which metric evaluates communication efficiency in constrained edge deployments?`,
          options: [
            "Number of communication rounds required to reach target global model accuracy.",
            "Total disk space used by central server logging databases.",
            "Frequency of GPU fan spin cycles per training epoch.",
            "Ratio of HTML DOM elements rendered on the management portal."
          ],
          answer: 0,
          explanation: "Communication efficiency measures how quickly a federated system reaches convergence with minimal network rounds."
        },
        {
          question: `Question 7: What phenomenon occurs when edge devices drop offline mid-epoch during training rounds?`,
          options: [
            "Client Straggler & Dropout Problem.",
            "Vanishing Gradient Disruption.",
            "Deadlock Synchronization Crash.",
            "Zero-Day Buffer Overflow."
          ],
          answer: 0,
          explanation: "Edge nodes often experience power/connectivity loss, causing stragglers or missing updates that servers must accommodate gracefully."
        },
        {
          question: `Question 8: What is Knowledge Distillation in the context of edge model optimization?`,
          options: [
            "Training a compact 'student' model to mimic the predictions of a complex 'teacher' model.",
            "Extracting raw SQL queries directly from neural network attention layers.",
            "Compressing text logs into gzip archives before uploading to S3 buckets.",
            "Merging multiple database tables into a single denormalized schema."
          ],
          answer: 0,
          explanation: "Knowledge distillation transfers the learned representations of a large teacher network into a lightweight student model suitable for edge hardware."
        },
        {
          question: `Question 9: Which hardware accelerator is specifically engineered for low-power edge tensor computations?`,
          options: [
            "NPU (Neural Processing Unit) / Edge TPU",
            "SATA RAID Controller",
            "PCIe Ethernet Adapter",
            "Virtual Display Adapter"
          ],
          answer: 0,
          explanation: "NPUs and Edge TPUs provide hardware acceleration for matrix math while operating within tight thermal/power envelopes."
        },
        {
          question: `Question 10: How does Split Learning differ from standard Federated Learning?`,
          options: [
            "The neural network model is split across layers: client computes early layers, server computes deeper layers.",
            "Data is split into CSV columns and distributed across remote FTP servers.",
            "Training is divided evenly between day shifts and night shifts.",
            "Code files are split across separate GitHub repositories."
          ],
          answer: 0,
          explanation: "Split learning splits network architecture so the edge node only processes the first few layers and transmits activation vectors to the server."
        }
      ].slice(0, count);
    }

    // 3. PYTHON / BACKEND / CONCURRENCY / FRAMEWORKS
    if (['python', 'async', 'backend', 'api', 'fastapi', 'node', 'django', 'express'].some(k => topic_lower.includes(k))) {
      return [
        {
          question: `Question 1: In ${topic}, what is the fundamental difference between 'asyncio.create_task()' and directly awaiting a coroutine?`,
          options: [
            "create_task() schedules the coroutine to run concurrently in the event loop, returning a Task object.",
            "create_task() runs the coroutine in a separate OS process completely bypassing the GIL.",
            "awaiting directly converts the coroutine into synchronous C++ thread execution.",
            "create_task() permanently disables exception handling for that execution path."
          ],
          answer: 0,
          explanation: "asyncio.create_task wraps a coroutine into a Task and registers it for non-blocking concurrent execution in the event loop."
        },
        {
          question: `Question 2: What is the Python GIL (Global Interpreter Lock) and how does it impact multi-threaded CPU-bound programs?`,
          options: [
            "A mutex that prevents multiple native threads from executing Python bytecodes simultaneously.",
            "A database lock mechanism that prevents race conditions in PostgreSQL transactions.",
            "A memory garbage collector that frees unused RAM every 15 minutes.",
            "A security module that verifies API key JWT signatures."
          ],
          answer: 0,
          explanation: "The GIL ensures only one thread executes CPython bytecode at a time, making multiprocessing necessary for multi-core CPU-bound parallelism."
        },
        {
          question: `Question 3: How does FastAPI achieve high performance for asynchronous HTTP handlers?`,
          options: [
            "Built on Starlette and Pydantic utilizing Python asyncio event loops and ASGI web servers.",
            "By converting Python code into static Java bytecode at startup.",
            "By storing all API payloads in browser LocalStorage before rendering.",
            "By disabling TCP handshake validation on incoming client connections."
          ],
          answer: 0,
          explanation: "FastAPI relies on Starlette for high-speed ASGI async routing and Pydantic for fast JSON serialization/validation."
        },
        {
          question: `Question 4: What is the primary purpose of context managers (the 'with' statement) in backend code?`,
          options: [
            "Guarantees resource setup and teardown (e.g. closing files or DB sessions) even if exceptions occur.",
            "Automatically scales server CPU cores when memory usage exceeds 80%.",
            "Encrypts request parameters before sending responses across HTTP.",
            "Caches API responses in Redis memory for 24 hours."
          ],
          answer: 0,
          explanation: "Context managers use __enter__ and __exit__ methods to ensure setup and cleanup tasks execute deterministically."
        },
        {
          question: `Question 5: What occurs when an unhandled exception is raised inside an asyncio background Task?`,
          options: [
            "The exception is stored on the Task object and raised when awaited or logged when garbage collected.",
            "The entire operating system kernel halts immediately.",
            "The Python interpreter automatically retries the task 10 times.",
            "The database connection pool is dropped and re-initialized."
          ],
          answer: 0,
          explanation: "Unhandled task exceptions are held until task.result() or await task is called, or logged as 'Task exception was never retrieved'."
        },
        {
          question: `Question 6: Which HTTP status code represents a client request rate limit breach?`,
          options: [
            "429 Too Many Requests",
            "401 Unauthorized",
            "403 Forbidden",
            "502 Bad Gateway"
          ],
          answer: 0,
          explanation: "HTTP 429 Too Many Requests indicates the client has exceeded rate limits in a given time window."
        },
        {
          question: `Question 7: What is the difference between shallow copy and deep copy in Python?`,
          options: [
            "Shallow copy constructs a new object but inserts references to original nested objects; deep copy recursively copies everything.",
            "Shallow copy works on strings; deep copy works only on integers.",
            "Shallow copy writes to disk; deep copy stores in CPU cache.",
            "Shallow copy is async; deep copy is synchronous."
          ],
          answer: 0,
          explanation: "copy.copy() creates a shallow copy sharing nested child references; copy.deepcopy() recursively copies all nested objects."
        },
        {
          question: `Question 8: In RESTful API design, why is idempotency important for PUT and DELETE requests?`,
          options: [
            "Executing the identical request multiple times yields the exact same server state as a single invocation.",
            "It speeds up network packet transmission over TLS connections.",
            "It forces client browsers to refresh their HTML DOM tree.",
            "It prevents CORS headers from blocking cross-origin requests."
          ],
          answer: 0,
          explanation: "Idempotency ensures duplicate requests (e.g. retries after network disconnect) produce identical side effects."
        },
        {
          question: `Question 9: What is the function of dependency injection in FastAPI handlers?`,
          options: [
            "Allows reusable setup logic (like database sessions and security checks) to be injected automatically.",
            "Compiles Python functions into native assembly code.",
            "Translates JSON request bodies into XML formats.",
            "Deletes orphan temporary files from disk on every HTTP request."
          ],
          answer: 0,
          explanation: "Depends() allows FastAPI to resolve and pass dependencies like DB sessions and auth guards seamlessly to endpoint handlers."
        },
        {
          question: `Question 10: Which database connection strategy prevents connection creation overhead on every HTTP request?`,
          options: [
            "Database Connection Pooling",
            "Static File Mounting",
            "DNS Round-Robin",
            "B-Tree Indexing"
          ],
          answer: 0,
          explanation: "Connection pools maintain a warm pool of active database connections, reusing them across incoming HTTP requests."
        }
      ].slice(0, count);
    }

    // 4. REACT / FRONTEND / WEB DEVELOPMENT
    if (['react', 'frontend', 'js', 'javascript', 'css', 'dom', 'component', 'web'].some(k => topic_lower.includes(k))) {
      return [
        {
          question: `Question 1: In ${topic}, what is the main purpose of the 'useMemo' hook?`,
          options: [
            "Memoizes expensive calculated values between renders to avoid unnecessary re-computations.",
            "Forces immediate re-renders of parent components whenever state updates.",
            "Persists component data into browser IndexedDB storage automatically.",
            "Bypasses React virtual DOM diffing algorithm entirely."
          ],
          answer: 0,
          explanation: "useMemo caches the result of a calculation between renders until one of its dependencies changes."
        },
        {
          question: `Question 2: What causes an infinite re-render loop in a React component using 'useEffect'?`,
          options: [
            "Updating state inside useEffect without providing a dependency array or including the updated state in dependencies.",
            "Using inline CSS styles on JSX elements.",
            "Rendering more than 10 child components in a single JSX parent container.",
            "Wrapping component handlers inside useCallback."
          ],
          answer: 0,
          explanation: "Setting state in useEffect triggers a render, which re-executes useEffect if dependencies are missing or change on every render."
        },
        {
          question: `Question 3: How does React Virtual DOM improve browser UI performance?`,
          options: [
            "By computing minimum required DOM mutations using diffing algorithms before updating real DOM nodes.",
            "By running component JavaScript on web worker threads.",
            "By converting HTML tags directly into WebGL canvas objects.",
            "By caching CSS stylesheet rules inside LocalStorage."
          ],
          answer: 0,
          explanation: "The Virtual DOM computes the minimal set of changes (diffing) needed to bring the actual DOM into sync with updated state."
        },
        {
          question: `Question 4: What is the key advantage of React 19 Server Components?`,
          options: [
            "Render on the server before sending HTML to client, reducing client bundle size and initial load time.",
            "Eliminate the need for CSS styling files in web applications.",
            "Replace JavaScript with WebAssembly binaries in all browsers.",
            "Allow client components to read local file system directories directly."
          ],
          answer: 0,
          explanation: "Server Components execute on the server, avoiding sending component code to the client bundle."
        },
        {
          question: `Question 5: What is event delegation in modern web development?`,
          options: [
            "Attaching a single event listener to a parent element to handle events on descendant elements via event bubbling.",
            "Delegating API fetch calls to background service workers.",
            "Forwarding React props from parent to child components.",
            "Passing state mutations through Redux middleware."
          ],
          answer: 0,
          explanation: "Event delegation leverages event bubbling to handle events on multiple child nodes with a single parent listener."
        },
        {
          question: `Question 6: Which CSS layout module is optimized for two-dimensional grid layouts?`,
          options: [
            "CSS Grid Layout",
            "CSS Flexbox",
            "Float Layout",
            "Inline-Block Positioning"
          ],
          answer: 0,
          explanation: "CSS Grid is designed for 2D (rows and columns) layouts, whereas Flexbox is primarily 1D (rows OR columns)."
        },
        {
          question: `Question 7: What does the React 'key' prop do when rendering dynamic lists?`,
          options: [
            "Helps React identify which items have changed, been added, or removed during DOM reconciliation.",
            "Sets unique HTML element id attributes for CSS styling.",
            "Encrypts item text content for security compliance.",
            "Triggers automatic sorting of list elements in ascending order."
          ],
          answer: 0,
          explanation: "Unique keys enable React to track list item identity during reconciliation, preserving local state and DOM integrity."
        },
        {
          question: `Question 8: How does 'useCallback' differ from 'useMemo'?`,
          options: [
            "useCallback memoizes callback function instances; useMemo memoizes the returned result value of a function.",
            "useCallback runs on server; useMemo runs on client.",
            "useCallback handles state updates; useMemo handles API calls.",
            "useCallback returns a Promise; useMemo returns an object."
          ],
          answer: 0,
          explanation: "useCallback(fn, deps) is equivalent to useMemo(() => fn, deps), caching function references between renders."
        },
        {
          question: `Question 9: What is the purpose of the 'aria-label' attribute in accessible web applications?`,
          options: [
            "Provides an explicit text alternative for screen readers when visible text is absent.",
            "Specifies custom font families for elements.",
            "Controls element visibility during animations.",
            "Defines URL routing path parameters."
          ],
          answer: 0,
          explanation: "aria-label defines an accessible string for assistive technologies like screen readers."
        },
        {
          question: `Question 10: Which strategy prevents layout shifts (CLS) when loading web images dynamically?`,
          options: [
            "Specifying explicit width and height aspect-ratio attributes on image elements.",
            "Using JPEG format instead of PNG.",
            "Disabling image lazy loading.",
            "Applying CSS grayscale filters."
          ],
          answer: 0,
          explanation: "Providing explicit width and height dimensions allows the browser to reserve space before image assets load, preventing CLS."
        }
      ].slice(0, count);
    }

    // 5. DEFAULT / GENERAL TECH / SYSTEM DESIGN / OTHER TOPICS
    return [
      {
        question: `Question 1: In ${topic}, which architectural pattern decouples producers and consumers using asynchronous messaging?`,
        options: [
          "Event-Driven Architecture (Publish-Subscribe)",
          "Monolithic Synchronous Procedure Calls",
          "Hardcoded Direct Memory Pointers",
          "Polling Loop Architecture"
        ],
        answer: 0,
        explanation: `${topic} systems utilize event-driven pub-sub queues to ensure loose coupling, asynchronous resilience, and independent scalability.`
      },
      {
        question: `Question 2: What is the primary purpose of implementing a Circuit Breaker pattern in ${topic}?`,
        options: [
          "Prevents cascading failures by failing fast when a remote dependency is overloaded or unresponsive.",
          "Encrypts network payloads with 512-bit RSA public key pairs.",
          "Deletes temporary cache records every 60 seconds.",
          "Forces database queries to bypass indexed columns."
        ],
        answer: 0,
        explanation: "Circuit breakers intercept failing remote requests, preventing application thread pool exhaustion during downstream outages."
      },
      {
        question: `Question 3: In system design for ${topic}, what does the CAP Theorem state about distributed data stores?`,
        options: [
          "A system can guarantee at most two of Consistency, Availability, and Partition Tolerance simultaneously.",
          "CPU utilization, Memory usage, and Network bandwidth are always equal.",
          "All API endpoints must complete responses within 100 milliseconds.",
          "Database backup tables must be stored across three separate continents."
        ],
        answer: 0,
        explanation: "CAP Theorem proves that under a network partition, a distributed system must trade off between strict consistency and high availability."
      },
      {
        question: `Question 4: Which caching strategy updates the cache and underlying database simultaneously in write operations?`,
        options: [
          "Write-Through Caching",
          "Cache-Aside (Lazy Loading)",
          "Write-Behind (Write-Back)",
          "Refresh-Ahead Caching"
        ],
        answer: 0,
        explanation: "Write-Through caching writes data to the cache and database synchronously, guaranteeing consistency at the cost of write latency."
      },
      {
        question: `Question 5: What is database sharding and why is it applied to large scale ${topic} data architectures?`,
        options: [
          "Horizontal partitioning of database rows across multiple independent physical database instances.",
          "Compressing table data into ZIP archives on cloud object storage.",
          "Creating duplicate copies of secondary indexes on single SSD drives.",
          "Converting relational SQL tables into static CSV text files."
        ],
        answer: 0,
        explanation: "Sharding splits large database datasets horizontally across separate nodes to scale read/write throughput beyond single server limits."
      },
      {
        question: `Question 6: How does horizontal scaling (scaling out) differ from vertical scaling (scaling up)?`,
        options: [
          "Horizontal scaling adds more machine instances; vertical scaling adds CPU/RAM resources to an existing single machine.",
          "Horizontal scaling increases network cable thickness; vertical scaling upgrades disk firmware.",
          "Horizontal scaling applies to databases only; vertical scaling applies to frontends only.",
          "Horizontal scaling reduces server count; vertical scaling doubles machine count."
        ],
        answer: 0,
        explanation: "Horizontal scaling adds new nodes to a distributed pool, whereas vertical scaling upgrades the specs of an existing server."
      },
      {
        question: `Question 7: What role does a Reverse Proxy (e.g. NGINX) play in modern ${topic} infrastructures?`,
        options: [
          "Handles SSL/TLS termination, load balancing, compression, and request routing in front of backend servers.",
          "Compiles client React code into browser executable binaries.",
          "Monitors developer git commits for syntax errors.",
          "Generates automated user passwords upon registration."
        ],
        answer: 0,
        explanation: "Reverse proxies sit in front of application servers to handle SSL termination, load distribution, security filtering, and static caching."
      },
      {
        question: `Question 8: In API architecture, what is Rate Limiting used for?`,
        options: [
          "Protects backend services from denial-of-service attacks and resource exhaustion by capping request volume per client.",
          "Slows down database query execution to conserve electricity.",
          "Restricts user login attempts to daytime office hours only.",
          "Truncates long text strings in JSON API responses."
        ],
        answer: 0,
        explanation: "Rate limiting throttles incoming requests per IP/user to prevent system overload and ensure fair resource distribution."
      },
      {
        question: `Question 9: What is the main benefit of immutable infrastructure deployments in ${topic}?`,
        options: [
          "Servers are replaced with clean new images rather than modified in-place, eliminating configuration drift.",
          "Server IP addresses never change for the entire lifecycle of the company.",
          "Database passwords are hardcoded into compiled C libraries.",
          "Source code files are locked against edits by software engineers."
        ],
        answer: 0,
        explanation: "Immutable infrastructure deploys pre-tested, immutable container/VM images, making environments completely deterministic and reproducible."
      },
      {
        question: `Question 10: Which metric represents the 99th percentile (p99) latency of an application endpoint?`,
        options: [
          "The maximum response time experienced by 99% of requests (only 1% of requests were slower).",
          "The average response time calculated across 99 total web servers.",
          "The percentage of HTTP requests that resulted in 200 OK status codes.",
          "The time taken to run unit tests 99 times in CI pipelines."
        ],
        answer: 0,
        explanation: "p99 latency indicates the threshold under which 99% of requests complete, capturing tail latency experienced by worst-case requests."
      }
    ].slice(0, count);
  };

  const handleSelectOption = (optionIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQIndex]: optionIndex
    }));
  };

  const handleSubmitAssessment = () => {
    setTimerActive(false);
    setShowSubmitConfirm(false);
    if (tabCountdownIntervalRef.current) {
      clearInterval(tabCountdownIntervalRef.current);
      tabCountdownIntervalRef.current = null;
    }
    tabWarningActiveRef.current = false;
    setTabWarningActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    exitFullScreen();
    
    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correctCount++;
    });

    const passRate = Math.round((correctCount / questions.length) * 100);

    // Also submit result to backend DB so attempt & score are tracked
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/learning/submit-mock-result`;
      const token = localStorage.getItem('sf_token');
      if (token) {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            topic: topicInput,
            score: passRate,
            total_questions: questions.length
          })
        })
          .then(() => {
            if (onTestCompleted) onTestCompleted();
          })
          .catch(err => console.error("Error submitting mock result to backend:", err));
      }
    } catch (e) {}

    const newRecord = {
      id: Date.now(),
      topic: topicInput,
      difficulty: difficulty,
      score: `${correctCount}/10`,
      percentage: passRate,
      timeSpent: formatTime(elapsedSeconds),
      date: new Date().toLocaleDateString(),
      xpAwarded: passRate >= 60 ? 250 : 100
    };

    const updatedHistory = [newRecord, ...history].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('sf_topic_assessment_history', JSON.stringify(updatedHistory));
    setStep('report');
  };


  const currentQ = questions[currentQIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  // Score metrics for report screen
  const reportMetrics = useMemo(() => {
    if (step !== 'report' || !questions.length) return { correct: 0, percentage: 0, status: "Pending" };
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correct++;
    });
    const percentage = Math.round((correct / questions.length) * 100);
    let status = "Mastered";
    let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (percentage < 50) {
      status = "Fundamentals Gap";
      statusColor = "text-red-600 bg-red-50 border-red-200";
    } else if (percentage < 70) {
      status = "Needs Practice";
      statusColor = "text-amber-600 bg-amber-50 border-amber-200";
    } else if (percentage < 90) {
      status = "Proficient";
      statusColor = "text-blue-600 bg-blue-50 border-blue-200";
    }
    return { correct, percentage, status, statusColor };
  }, [step, questions, selectedAnswers]);

  return (
    <div className="topic-assessment-container flex-1 bg-slate-50 overflow-y-auto p-6 md:p-8 no-scrollbar">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* PHASE 1: TOPIC SELECTION & SETUP */}
        {step === 'setup' && (
          <div className="space-y-6 animate-in fade-in">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-navy transition-colors cursor-pointer bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
              >
                <ChevronLeft size={18} />
                <span>Back to Mock Tests</span>
              </button>
            )}
            
            {/* Hero Banner */}
            <div className="assessment-hero-gradient p-8 md:p-10 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-100 border border-white/20 text-xs font-extrabold uppercase tracking-wider">
                  <BookOpen size={14} className="text-blue-300" />
                  <span>Online Test Studio</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Test Your Mastery on Any Subject
                </h1>
                <p className="text-blue-100/90 text-sm md:text-base font-medium leading-relaxed">
                  Enter any topic—from Software Engineering & Cloud to Quantitative Aptitude, Logical Reasoning, or Mathematics. Our system will instantly generate 10 rigorous multiple-choice problems or questions complete with step-by-step solutions.
                </p>
              </div>
              <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 shadow-inner z-10">
                <Award size={44} className="text-blue-200" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-bold flex items-center gap-3 shadow-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Input & Difficulty Box */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-2">
                  1. Enter Test Topic or Subject
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="E.g., Quantitative Aptitude, Logical Reasoning, Probability & Maths, Python Asyncio, System Design..."
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleStartGeneration(); }}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-base font-semibold text-navy-900 focus:bg-white focus:outline-none focus:border-blue-600 transition-all shadow-inner"
                  />
                  {topicInput && (
                    <button onClick={() => setTopicInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-extrabold uppercase tracking-wider text-slate-700 mb-3">
                  2. Select Target Difficulty Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 ${
                        difficulty === diff
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        difficulty === diff
                          ? 'bg-white'
                          : diff === 'Beginner' ? 'bg-emerald-500' :
                            diff === 'Intermediate' ? 'bg-amber-500' :
                            diff === 'Advanced' ? 'bg-red-400' : 'bg-blue-400'
                      }`} />
                      <span>{diff}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleStartGeneration()}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 transform active:scale-[0.99]"
              >
                <BookOpen size={22} />
                <span>Start Test</span>
                <ArrowRight size={20} />
              </button>
            </div>

            {/* Suggested Popular Topics Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-navy-900 flex items-center gap-2">
                  <BookOpen size={20} className="text-blue-600" />
                  <span>Popular Industry Topics to Try</span>
                </h3>
                <span className="text-xs font-bold text-slate-400">Click any card to launch test</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SUGGESTED_TOPICS.map((item, idx) => {
                  const IconComp = item.icon;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleStartGeneration(item.title)}
                      className="topic-card"
                    >
                      <div className={`topic-icon-wrap ${item.bg} ${item.color}`}>
                        <IconComp size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">{item.category}</span>
                        <h4 className="font-extrabold text-navy-900 text-sm truncate">{item.title}</h4>
                      </div>
                      <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Past Test History Card */}
            {history.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-navy-900 text-lg flex items-center gap-2">
                  <Award size={20} className="text-amber-500" />
                  <span>Recent Test History ({history.length})</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                        <th className="py-2 px-3">Topic</th>
                        <th className="py-2 px-3">Level</th>
                        <th className="py-2 px-3">Score</th>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-navy-900">{h.topic}</td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700">{h.difficulty}</span>
                          </td>
                          <td className="py-3 px-3 font-extrabold text-blue-600">{h.score} ({h.percentage}%)</td>
                          <td className="py-3 px-3 text-slate-500">{h.timeSpent}</td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{h.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PHASE 2: LOADING GENERATION */}
        {step === 'loading' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-center gap-6 shadow-lg min-h-[450px] animate-in fade-in">
            <div className="w-20 h-20 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner animate-bounce">
              <BookOpen size={40} className="animate-pulse" />
            </div>
            <div className="space-y-2 max-w-md">
              <h2 className="text-2xl font-extrabold text-navy-900">Preparing Test</h2>
              <p className="text-slate-500 font-medium text-sm">
                Our system is formulating 10 rigorous multiple-choice test questions on <b className="text-blue-600">"{topicInput}"</b> at <b className="text-navy-900">{difficulty}</b> difficulty level...
              </p>
            </div>
            <div className="w-64 bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}

        {/* PHASE 3: TAKING LIVE TEST */}
        {step === 'taking' && currentQ && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Top Bar: Progress & Timer */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl font-bold">
                  <BookOpen size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-navy-900 text-base leading-tight">{topicInput}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                      {difficulty} Level
                    </span>
                    <button 
                      type="button"
                      onClick={enterFullScreen}
                      className="text-xs font-extrabold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                      title="Click to enforce Full Screen mode (hiding Chrome browser UI)"
                    >
                      <Maximize2 size={12} className="text-emerald-600" />
                      <span>Full Screen Proctored</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 text-sm font-extrabold text-navy-900 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-200/60" title="Total Elapsed Test Time">
                    <Clock size={16} className="text-blue-600 animate-pulse" />
                    <span>Total: {formatTime(elapsedSeconds)}</span>
                  </div>

                  <div className={`flex items-center gap-2 text-sm font-extrabold px-3.5 py-1.5 rounded-xl border transition-all ${
                    questionTimeLeft <= 15 
                      ? 'bg-red-600 text-white border-red-600 animate-pulse shadow-md' 
                      : 'bg-amber-50 text-amber-900 border-amber-200'
                  }`} title="1-Minute Timer for Current Question">
                    <Zap size={16} className={questionTimeLeft <= 15 ? 'text-white' : 'text-amber-600'} />
                    <span>Question Time: 00:{questionTimeLeft.toString().padStart(2, '0')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Question {currentQIndex + 1} of {totalQuestions}
                  </span>
                  <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all duration-300" 
                      style={{ width: `${((currentQIndex + 1) / totalQuestions) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Pagination Dots */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-center gap-2 flex-wrap">
              {questions.map((_, idx) => {
                const isAns = selectedAnswers[idx] !== undefined;
                const isCurr = idx === currentQIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`q-dot ${isCurr ? 'current' : isAns ? 'answered' : ''}`}
                    title={`Go to Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Main Question Card */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-md space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider">
                  Question #{currentQIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-400">
                  {selectedAnswers[currentQIndex] !== undefined ? "✅ Answer Selected" : "⏳ Awaiting Selection"}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-extrabold text-navy-900 leading-relaxed">
                {currentQ.question}
              </h2>

              <div className="space-y-3 pt-2">
                {currentQ.options?.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQIndex] === optIdx;
                  const optLetter = String.fromCharCode(65 + optIdx);
                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="option-badge">{optLetter}</span>
                        <span className="font-semibold text-slate-800 text-sm md:text-base leading-snug">{opt}</span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav Bar */}
            <div className="flex items-center justify-between pt-2 pb-16">
              <button
                onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQIndex === 0}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                  currentQIndex === 0 ? 'opacity-40 cursor-not-allowed bg-slate-200 text-slate-500' : 'bg-white hover:bg-slate-100 text-navy-900 border border-slate-200 shadow-sm'
                }`}
              >
                <ChevronLeft size={18} />
                <span>Previous Question</span>
              </button>

              {currentQIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => setCurrentQIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all"
                >
                  <span>Next Question</span>
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (answeredCount < totalQuestions) {
                      setShowSubmitConfirm(true);
                    } else {
                      handleSubmitAssessment();
                    }
                  }}
                  className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base rounded-2xl shadow-lg transition-all animate-pulse"
                >
                  <ShieldCheck size={20} />
                  <span>Submit Test ({answeredCount}/{totalQuestions})</span>
                </button>
              )}
            </div>

            {/* Unanswered Submit Confirmation Modal */}
            {showSubmitConfirm && (
              <div className="fixed inset-0 bg-navy-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5 text-center animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle size={30} />
                  </div>
                  <h3 className="text-xl font-extrabold text-navy-900">Unanswered Questions Left!</h3>
                  <p className="text-slate-600 text-sm font-medium">
                    You have answered <b className="text-navy-900">{answeredCount}</b> out of <b className="text-navy-900">{totalQuestions}</b> questions. Are you sure you want to submit your test now?
                  </p>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowSubmitConfirm(false)}
                      className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all"
                    >
                      Keep Reviewing
                    </button>
                    <button
                      onClick={handleSubmitAssessment}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                    >
                      Yes, Submit Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* FLOATING PROCTORING CAMERA & STATUS DOCK */}
            <div className={`proctor-camera-dock ${cameraMinimized ? 'minimized' : ''} ${
              liveStatusType === 'error' ? 'border-red-500 shadow-red-500/20' :
              liveStatusType === 'warning' ? 'border-amber-500 shadow-amber-500/20' :
              'border-emerald-500 shadow-emerald-500/20'
            }`}>
              <div className="proctor-dock-header flex items-center justify-between p-2.5 bg-slate-900 text-white rounded-t-xl text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full animate-ping ${
                    liveStatusType === 'error' ? 'bg-red-500' :
                    liveStatusType === 'warning' ? 'bg-amber-500' :
                    'bg-emerald-400'
                  }`} />
                  <span className="uppercase tracking-wider">AI Proctor Live</span>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setAudioEnabled(!audioEnabled)} 
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title={audioEnabled ? "Mute Warning Alerts" : "Unmute Warning Alerts"}
                  >
                    {audioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>
                  <button 
                    onClick={() => setCameraMinimized(!cameraMinimized)} 
                    className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                    title={cameraMinimized ? "Expand Camera" : "Minimize Camera"}
                  >
                    {cameraMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                  </button>
                </div>
              </div>

              {!cameraMinimized && (
                <div className="proctor-dock-body p-2 bg-slate-900/95 backdrop-blur rounded-b-xl space-y-2">
                  <div className="relative w-full h-36 bg-black rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100" 
                    />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    {cameraPermission === 'denied' && (
                      <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-2 text-center text-xs text-red-400 font-bold">
                        <AlertTriangle size={20} className="mb-1 text-red-500" />
                        <span>Camera Access Required for Proctored Assessment</span>
                      </div>
                    )}
                    {cameraPermission === 'granted' && (
                      <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-lg pointer-events-none flex items-center justify-center">
                        <div className="w-16 h-16 border border-emerald-400/40 rounded-full" />
                      </div>
                    )}
                  </div>

                  <div className={`p-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    liveStatusType === 'error' ? 'bg-red-950/80 text-red-300 border border-red-800' :
                    liveStatusType === 'warning' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                    'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  }`}>
                    {liveStatusType === 'error' ? <ShieldAlert size={14} className="shrink-0 text-red-400" /> :
                     liveStatusType === 'warning' ? <AlertTriangle size={14} className="shrink-0 text-amber-400" /> :
                     <ShieldCheck size={14} className="shrink-0 text-emerald-400" />}
                    <span className="truncate">{liveStatusMessage}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px] font-bold text-slate-400 border-t border-slate-800">
                    <div className="bg-slate-800/60 p-1 rounded">
                      <span className="block text-white font-extrabold text-xs">{tabSwitchCount}</span>
                      <span>Tabs</span>
                    </div>
                    <div className="bg-slate-800/60 p-1 rounded">
                      <span className="block text-white font-extrabold text-xs">{eyeWarningCount}</span>
                      <span>Eye Dev.</span>
                    </div>
                    <div className="bg-slate-800/60 p-1 rounded">
                      <span className="block text-white font-extrabold text-xs">{bodyWarningCount}</span>
                      <span>Out/Body</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5-SECOND TAB-SWITCH / BLUR WARNING MODAL */}
            {tabWarningActive && (
              <div 
                onClick={enterFullScreen}
                className="fixed inset-0 bg-red-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in cursor-pointer"
              >
                <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border-4 border-red-600 text-center space-y-6 animate-in zoom-in-95">
                  <div className="w-20 h-20 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto animate-bounce">
                    <ShieldAlert size={44} />
                  </div>
                  <div className="space-y-2">
                    <span className="px-3 py-1 bg-red-600 text-white rounded-full text-xs font-extrabold uppercase tracking-wider animate-pulse">
                      Critical Proctoring Alert
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-navy-900">
                      You Left Full Screen or Test Window!
                    </h2>
                    <p className="text-slate-600 text-sm font-semibold leading-relaxed">
                      Exiting full screen, switching browser tabs, opening other applications, or minimizing Chrome is strictly prohibited during this proctored assessment.
                    </p>
                  </div>

                  <div className="bg-red-50 border-2 border-red-200 p-6 rounded-2xl">
                    <span className="text-xs font-extrabold uppercase text-red-700 block mb-1">
                      Time Remaining to Return:
                    </span>
                    <div className="text-5xl font-black text-red-600 animate-pulse">
                      {tabWarningCountdown}s
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-2 block">
                      If timer reaches 0, your assessment will be auto-submitted immediately with a cheating penalty!
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={enterFullScreen}
                      className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-base rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                      <Maximize2 size={20} />
                      <span>Return to Full Screen & Resume Test</span>
                    </button>
                  </div>

                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                    Click anywhere or press the button above to resume test
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

        {/* PHASE 4: REPORT SCORE & CORRECTED ANSWER LIST */}
        {step === 'report' && (
          <div className="space-y-8 animate-in fade-in">
            
            {/* Hero Score Card */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-10 shadow-lg text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-10 -translate-y-10 w-48 h-48 bg-blue-50 rounded-full pointer-events-none" />
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold uppercase tracking-wider">
                <Award size={14} className="text-blue-600" />
                <span>Official Test Report</span>
              </div>

              <h1 className="text-3xl font-extrabold text-navy-900 leading-tight">
                Test Results: {topicInput}
              </h1>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
                {/* Score Circle Gauge */}
                <div className="w-36 h-36 rounded-full bg-slate-50 border-8 border-blue-100 flex flex-col items-center justify-center shadow-inner relative score-pulse">
                  <span className="text-3xl font-extrabold text-navy-900">{reportMetrics.correct}/{totalQuestions}</span>
                  <span className="text-xs font-extrabold text-blue-600 mt-0.5">{reportMetrics.percentage}% Score</span>
                </div>

                <div className="space-y-3 text-left max-w-sm">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-extrabold border ${reportMetrics.statusColor}`}>
                    <ShieldCheck size={18} />
                    <span>Mastery Level: {reportMetrics.status}</span>
                  </div>
                  <p className="text-slate-600 text-sm font-medium">
                    You completed the <b className="text-navy-900">{difficulty}</b> test in <b className="text-navy-900">{formatTime(elapsedSeconds)}</b>.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                    <Zap size={16} className="text-blue-600 fill-blue-600" />
                    <span>+{reportMetrics.percentage >= 60 ? '250' : '100'} XP Added to Your Profile Ledger</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-100">
                {onBack && (
                  <button
                    onClick={() => { exitFullScreen(); onBack(); }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                    <span>Back to Mock Tests</span>
                  </button>
                )}
                <button
                  onClick={() => handleStartGeneration(topicInput)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-900 font-extrabold text-sm rounded-xl transition-all"
                >
                  <RotateCcw size={16} />
                  <span>Retake This Topic</span>
                </button>
                <button
                  onClick={() => { exitFullScreen(); setStep('setup'); setTopicInput(''); }}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-sm rounded-xl shadow-md transition-all"
                >
                  <BookOpen size={16} />
                  <span>Test Another Topic</span>
                </button>
              </div>
            </div>

            {/* AI PROCTORING & INTEGRITY EVALUATION REPORT CARD */}
            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 md:p-10 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${
                    tabSwitchCount === 0 && eyeWarningCount === 0 && bodyWarningCount === 0
                      ? 'bg-emerald-100 text-emerald-600'
                      : (tabSwitchCount + eyeWarningCount + bodyWarningCount) <= 3
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-red-100 text-red-600'
                  }`}>
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
                      <span>AI Proctoring & Integrity Audit Report</span>
                    </h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      Session verified by real-time camera tracking and browser activity monitoring
                    </p>
                  </div>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-extrabold border ${
                  tabSwitchCount === 0 && eyeWarningCount === 0 && bodyWarningCount === 0
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm'
                    : (tabSwitchCount + eyeWarningCount + bodyWarningCount) <= 3
                    ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm'
                    : 'bg-red-50 text-red-800 border-red-200 shadow-sm'
                }`}>
                  <Activity size={18} />
                  <span>
                    Integrity Rating: {
                      tabSwitchCount === 0 && eyeWarningCount === 0 && bodyWarningCount === 0
                        ? '100% Verified Clean'
                        : `${Math.max(0, 100 - (tabSwitchCount * 25) - (eyeWarningCount * 5) - (bodyWarningCount * 10))}% (${
                            (tabSwitchCount + eyeWarningCount + bodyWarningCount) <= 3 ? 'Minor Warnings' : 'Cheating Suspected'
                          })`
                    }
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${tabSwitchCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-navy-900 block">{tabSwitchCount}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tab / Browser Switched</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${eyeWarningCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Eye size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-navy-900 block">{eyeWarningCount}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eye / Head Deviations</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${bodyWarningCount === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                    <UserCheck size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-navy-900 block">{bodyWarningCount}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Frame / Body Warns</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3.5">
                  <div className={`p-3 rounded-xl ${autoSkipCount === 0 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                    <Clock size={22} />
                  </div>
                  <div>
                    <span className="text-2xl font-extrabold text-navy-900 block">{autoSkipCount}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Timer Skips (1 Min/Q)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span>Proctoring Activity Audit Trail ({proctorLog.length} events)</span>
                </h4>

                {proctorLog.length === 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 font-bold text-sm flex items-center gap-3">
                    <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                    <span>Clean Test Session: No tab switches, eye deviations, or body absence warnings were triggered during this assessment!</span>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-200/80 rounded-2xl p-3 bg-slate-50/50">
                    {proctorLog.map((log) => (
                      <div key={log.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 text-xs">
                        <div className="flex items-start gap-2.5">
                          <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                            log.type === 'tab_violation' ? 'bg-red-100 text-red-600' :
                            log.type === 'tab' ? 'bg-purple-100 text-purple-600' :
                            log.type === 'body' ? 'bg-red-100 text-red-600' :
                            log.type === 'eye' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {log.type === 'tab' || log.type === 'tab_violation' ? <Layers size={14} /> :
                             log.type === 'body' ? <UserCheck size={14} /> :
                             log.type === 'eye' ? <Eye size={14} /> : <Clock size={14} />}
                          </span>
                          <div>
                            <span className="font-extrabold text-navy-900 uppercase block mb-0.5">
                              {log.type === 'tab_violation' ? 'Critical Violation' :
                               log.type === 'tab' ? 'Tab / Window Switch' :
                               log.type === 'body' ? 'Body / Frame Presence' :
                               log.type === 'eye' ? 'Eye / Head Deviation' : 'Timer Expired'}
                            </span>
                            <p className="text-slate-700 font-semibold leading-normal">{log.message}</p>
                          </div>
                        </div>
                        <span className="font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md shrink-0">
                          {log.time}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Corrected Answer List & Solutions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-extrabold text-navy-900 flex items-center gap-2">
                  <BookOpen size={22} className="text-blue-600" />
                  <span>Detailed Answer Review & Solutions ({totalQuestions})</span>
                </h3>
                <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  Reviewing all 10 items
                </span>
              </div>

              <div className="space-y-5">
                {questions.map((q, idx) => {
                  const safeAnswer = (typeof q.answer === 'number' && q.answer >= 0 && q.answer < (q.options?.length || 4)) ? q.answer : 0;
                  const userAns = selectedAnswers[idx];
                  const isCorrect = userAns === safeAnswer;
                  const userLetter = userAns !== undefined && userAns >= 0 ? String.fromCharCode(65 + userAns) : 'None';
                  const correctLetter = String.fromCharCode(65 + safeAnswer);
                  const correctOptionText = (q.options && q.options[safeAnswer]) ? q.options[safeAnswer] : `Option ${correctLetter}`;

                  return (
                    <div
                      key={idx}
                      className={`review-question-card p-6 md:p-8 space-y-5 ${isCorrect ? 'status-correct' : 'status-incorrect'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                          Question #{idx + 1}
                        </span>
                        {isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-center">
                            <CheckCircle size={14} className="text-emerald-600" />
                            <span>Correct (+10 pts)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-800 border border-red-200 self-start sm:self-center">
                            <AlertCircle size={14} className="text-red-600" />
                            <span>Incorrect (0 pts)</span>
                          </span>
                        )}
                      </div>

                      <h4 className="text-base md:text-lg font-extrabold text-navy-900 leading-relaxed">
                        {q.question}
                      </h4>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs md:text-sm font-semibold">
                        {q.options?.map((opt, optIdx) => {
                          const isThisCorrect = optIdx === safeAnswer;
                          const isThisSelected = optIdx === userAns;
                          const optLetter = String.fromCharCode(65 + optIdx);
                          
                          let bgStyle = "bg-slate-50 border-slate-200 text-slate-700";
                          if (isThisCorrect) bgStyle = "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold";
                          else if (isThisSelected && !isThisCorrect) bgStyle = "bg-red-50 border-red-300 text-red-900 line-through";

                          return (
                            <div key={optIdx} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${bgStyle}`}>
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-md bg-white border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0">
                                  {optLetter}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isThisCorrect && <span className="text-[10px] uppercase font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded">Correct</span>}
                              {isThisSelected && !isThisCorrect && <span className="text-[10px] uppercase font-extrabold bg-red-600 text-white px-2 py-0.5 rounded">Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>

                      {/* Answer Summary Badge */}
                      <div className="flex flex-wrap gap-4 text-xs font-bold pt-1">
                        <span className={`px-3 py-1.5 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                          Your Answer: <b>Option {userLetter}</b> {isCorrect ? '(Correct)' : '(Incorrect)'}
                        </span>
                        {!isCorrect && (
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800">
                            Correct Answer: <b>Option {correctLetter} ({correctOptionText})</b>
                          </span>
                        )}
                      </div>

                      {/* Explanation Callout Box */}
                      {q.explanation && (
                        <div className="explanation-callout space-y-1.5 text-xs md:text-sm text-slate-700 font-medium">
                          <span className="font-extrabold text-blue-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                            <BookOpen size={15} className="text-blue-600" />
                            <span>Solution & Explanation</span>
                          </span>
                          <p className="leading-relaxed">{q.explanation}</p>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default TopicAssessment;
