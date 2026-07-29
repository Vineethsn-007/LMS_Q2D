import React, { useState, useEffect } from 'react';
import {
  Brain, Clock, RefreshCw, AlertCircle, Play, BarChart3
} from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function MockTests({ user, onStartTest, onTestCompleted }) {
  const [subjects, setSubjects] = useState([]);
  const [mockResults, setMockResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('sf_token');
  const headers = { 'Authorization': `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subjectsRes, resultsRes] = await Promise.all([
        fetch(`${API}/api/learning/subjects`, { headers }),
        fetch(`${API}/api/learning/my-mock-results`, { headers })
      ]);

      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(Array.isArray(data) ? data : []);
      } else {
        setError('Failed to load subjects');
      }

      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setMockResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate attempts per subject from results (filtered for TODAY's date)
  const getAttemptsForSubject = (subjectName) => {
    const todayStr = new Date().toISOString().split('T')[0];
    return mockResults.filter(r => {
      if (!r.topic || r.topic.toLowerCase() !== subjectName.toLowerCase()) return false;
      if (!r.attempt_date) return true; // count if date missing
      try {
        const attemptDateStr = new Date(r.attempt_date).toISOString().split('T')[0];
        return attemptDateStr === todayStr;
      } catch (e) {
        return true;
      }
    });
  };

  const getAllSubjectAttempts = (subjectName) => {
    return mockResults.filter(r =>
      r.topic?.toLowerCase() === subjectName.toLowerCase()
    );
  };

  const getLatestScore = (subjectName) => {
    const attempts = getAllSubjectAttempts(subjectName);
    if (attempts.length === 0) return null;
    return attempts[0].score;
  };

  const getAttemptsCount = (subjectName) => {
    return getAttemptsForSubject(subjectName).length;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100 uppercase tracking-wider w-max">
            <Brain size={14} /> Mock Tests
          </div>
          <h1 className="text-3xl font-bold text-navy-900">AI-Powered Mock Tests</h1>
          <p className="text-slate-500">Select a subject below to start an AI-generated mock test. Daily attempt limits apply.</p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-bold flex items-center gap-3">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4" />
            <p className="font-medium">Loading mock tests...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
            <Brain size={48} className="mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-700 mb-2">No subjects available</h3>
            <p className="text-sm text-slate-500">Subjects with mock tests will appear here once assigned by your institution.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {subjects.map(subject => {
              const attemptsCount = getAttemptsCount(subject.name);
              const latestScore = getLatestScore(subject.name);
              const dailyLimit = subject.daily_mock_attempts_limit || 3;
              const isAiEnabled = subject.ai_mock_exams_enabled !== false;

              return (
                <div
                  key={subject.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Brain size={20} />
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        isAiEnabled
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {isAiEnabled ? 'AI Enabled' : 'AI Disabled'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-1">{subject.name}</h3>
                    {subject.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{subject.description}</p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-3 border-t border-slate-100 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Attempts</div>
                      <div className="text-base font-bold text-navy-900">{attemptsCount}/{dailyLimit}</div>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Best</div>
                      <div className={`text-base font-bold ${latestScore !== null ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {latestScore !== null ? `${latestScore}%` : '—'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tests</div>
                      <div className="text-base font-bold text-navy-900">{mockResults.length}</div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="p-5 pt-3 mt-auto">
                    <button
                      onClick={() => onStartTest && onStartTest(subject.name)}
                      disabled={!isAiEnabled}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        isAiEnabled
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {isAiEnabled ? (
                        <><Play size={16} fill="currentColor" /> Start Mock Test</>
                      ) : (
                        <><Clock size={16} /> AI Tests Disabled</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Attempt History */}
        {mockResults.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-4">
            <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-600" /> Recent Test History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Subject</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3 text-right">Score</th>
                    <th className="py-3 px-3 text-right">Questions</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {mockResults.slice(0, 10).map(attempt => (
                    <tr key={attempt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-bold text-navy-900">{attempt.topic || 'General'}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {attempt.attempt_date ? new Date(attempt.attempt_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-700">
                        {attempt.score !== null ? `${attempt.score}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {attempt.total_questions || '—'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          attempt.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : attempt.status === 'in_progress'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {attempt.status || 'Unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
