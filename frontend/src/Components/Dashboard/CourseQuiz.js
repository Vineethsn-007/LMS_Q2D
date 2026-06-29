import React, { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export default function CourseQuiz({ courseId, courseName, onComplete, onCancel }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [passed, setPassed] = useState(false);
  
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('sf_token');
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/courses/${courseId}/quiz`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch quiz');
        const data = await res.json();
        if (data && data.length > 0) {
          setQuestions(data);
        } else {
          // If Groq fails or returns empty, auto-pass
          onComplete();
        }
      } catch (err) {
        console.error("Quiz generation error:", err);
        // Fallback: if generation fails, we still let them complete the course
        onComplete();
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [courseId, onComplete]);

  const handleSelectAnswer = (index) => {
    if (showResults) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: index
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Calculate score
      let correct = 0;
      questions.forEach((q, i) => {
        if (selectedAnswers[i] === q.answer) correct++;
      });
      const isPassed = correct >= Math.ceil(questions.length * 0.6); // 60% to pass
      setPassed(isPassed);
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
    setPassed(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center flex flex-col items-center justify-center animate-in fade-in duration-300 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 mb-6">
          <Brain size={32} className="animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-navy-900 mb-2">Generating Final Quiz...</h3>
        <p className="text-slate-500 font-medium flex items-center justify-center gap-2">
          <Loader2 size={16} className="animate-spin text-blue-500" />
          Our AI is reading your course material to generate custom questions.
        </p>
      </div>
    );
  }

  if (questions.length === 0) return null;

  if (showResults) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 text-center animate-in zoom-in-95 duration-300">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? 'bg-emerald-50 text-emerald-500' : 'bg-coral-50 text-coral-500'}`}>
          {passed ? <CheckCircle size={40} /> : <XCircle size={40} />}
        </div>
        <h2 className="text-3xl font-bold text-navy-900 mb-3">{passed ? 'Congratulations!' : 'Keep Practicing'}</h2>
        <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
          {passed 
            ? "You've successfully demonstrated your understanding of the material. Your certificate is ready!" 
            : "You didn't quite pass the final assessment. Review the material and try again."}
        </p>
        
        <div className="flex gap-4 justify-center">
          {!passed ? (
            <button 
              onClick={handleRetry}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all"
            >
              Retry Quiz
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles size={20} /> Claim Certificate
            </button>
          )}
          <button 
            onClick={onCancel}
            className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];
  const hasSelected = selectedAnswers[currentQuestionIndex] !== undefined;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 animate-in slide-in-from-bottom-4 duration-300 max-w-3xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Brain size={20} />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-lg">Final Assessment</h3>
            <p className="text-xs font-semibold text-slate-500">{courseName}</p>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="mb-8">
        <h4 className="text-xl font-bold text-slate-800 mb-6 leading-snug">{currentQ.question}</h4>
        <div className="flex flex-col gap-3">
          {currentQ.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelectAnswer(i)}
              className={`w-full text-left px-6 py-4 rounded-xl border-2 font-medium transition-all ${
                selectedAnswers[currentQuestionIndex] === i 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
                  : 'border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswers[currentQuestionIndex] === i ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}>
                  {selectedAnswers[currentQuestionIndex] === i && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                {opt}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-6 border-t border-slate-100">
        <button 
          onClick={onCancel}
          className="text-slate-500 hover:text-slate-700 font-bold px-4 py-2"
        >
          Cancel
        </button>
        <button
          onClick={handleNext}
          disabled={!hasSelected}
          className="flex items-center gap-2 px-8 py-3 bg-navy hover:bg-navy-800 text-white font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
