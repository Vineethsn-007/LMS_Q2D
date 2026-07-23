import React, { useState, useEffect } from 'react';
import { Play, Award, Clock, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';
import useDynamicGreeting from '../../utils/useDynamicGreeting';

const activityData = [
  { name: 'W1', hours: 2 },
  { name: 'W2', hours: 4 },
  { name: 'W3', hours: 3 },
  { name: 'W4', hours: 8 },
  { name: 'W5', hours: 6 },
  { name: 'W6', hours: 9 },
  { name: 'W7', hours: 7 },
  { name: 'W8', hours: 10 },
];

const skillData = [
  { subject: 'District Tier', A: 90, fullMark: 100 },
  { subject: 'State Tier', A: 80, fullMark: 100 },
  { subject: 'National Tier', A: 65, fullMark: 100 },
  { subject: 'AI Mock Tests', A: 85, fullMark: 100 },
  { subject: 'Proctored Exams', A: 75, fullMark: 100 },
];

const DashboardContent = ({ user, onStartCourse }) => {
  const greeting = useDynamicGreeting();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [progressTick, setProgressTick] = useState(0);
  const [stats, setStats] = useState(null);
  const [activityChartData, setActivityChartData] = useState(activityData);
  const [skillRadarData, setSkillRadarData] = useState(skillData);

  useEffect(() => {
    const handleProgressChange = () => {
      const saved = JSON.parse(localStorage.getItem('sf_completed_courses') || '[]');
      setCompletedCourses(saved);
      setProgressTick(t => t + 1);
    };
    handleProgressChange();
    window.addEventListener('progress_updated', handleProgressChange);
    window.addEventListener('storage', handleProgressChange);
    return () => {
      window.removeEventListener('progress_updated', handleProgressChange);
      window.removeEventListener('storage', handleProgressChange);
    };
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/courses`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        console.error("Error fetching dashboard courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('sf_token');
        if (!token) return;
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/learning/dashboard-stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          if (data.activity_data && data.activity_data.length > 0) setActivityChartData(data.activity_data);
          if (data.skill_data && data.skill_data.length > 0) setSkillRadarData(data.skill_data);
        }
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      }
    };
    fetchStats();
  }, [progressTick]);

  const continueLearningCourses = [...courses].slice(0, 3);
  const enrolledCount = courses.length;
  const completedCount = completedCourses.length;
  const totalHours = courses.reduce((acc, c) => acc + (c.hours || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2/3 width on LG) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Banner */}
          <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl p-8 text-white overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-coral opacity-10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-blue-200 mb-4 backdrop-blur-sm border border-white/10">
                  <span>🎓</span> SkillForge Academic Portal
                </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{greeting.text}, {user?.name?.split(' ')[0] || 'Learner'} {greeting.emoji}</h1>
                <p className="text-blue-100 font-light max-w-md">Access your registered subjects, complete mock assessments, and manage your proctored exam bookings.</p>
              </div>

              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-xl shrink-0">
                <div className="text-2xl font-bold text-white mb-1">Tier Portal</div>
                <div className="text-xs text-blue-200 font-semibold uppercase tracking-wider mb-2">District / State / National</div>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Play size={18} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assigned Courses</span>
              </div>
              <div className="text-2xl font-bold text-navy-900 mb-1">{enrolledCount}</div>
              <div className="text-xs text-slate-500 font-medium">Curriculum syllabus</div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <Award size={18} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Completed Modules</span>
              </div>
              <div className="text-2xl font-bold text-navy-900 mb-1">{completedCount}</div>
              <div className="text-xs text-slate-500 font-medium">Verified modules</div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Syllabus</span>
              </div>
              <div className="text-2xl font-bold text-navy-900 mb-1">{totalHours}h</div>
              <div className="text-xs text-slate-500 font-medium">Learning material</div>
            </div>
          </div>

          {/* Continue Learning */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy-900">Subject Courses</h2>
              <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Curriculum</span>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="py-8 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              ) : continueLearningCourses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm font-medium">
                  No subject courses currently assigned.
                </div>
              ) : (
                continueLearningCourses.map(course => {
                  return (
                    <div key={course.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all group">
                      <div className="w-12 h-12 rounded-lg bg-navy-50 text-navy flex items-center justify-center shrink-0 group-hover:bg-navy group-hover:text-white transition-colors">
                        <Play fill="currentColor" size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-navy-900 mb-1">{course.title}</div>
                        <div className="text-xs text-slate-500 font-medium">{course.description}</div>
                      </div>
                      <button 
                        onClick={() => onStartCourse && onStartCourse(course)}
                        className="mt-3 sm:mt-0 w-full sm:w-auto px-5 py-2.5 bg-slate-50 text-navy-900 font-semibold text-sm rounded-lg hover:bg-navy hover:text-white transition-colors border border-slate-200 hover:border-navy"
                      >
                        Start Learning
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Learning Activity Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-navy-900">Study Activity</h2>
              <span className="text-xs font-semibold text-slate-500 uppercase">Recent weeks</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#0B3D91" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6, fill: '#E94E4E', stroke: 'none' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column (1/3 width on LG) */}
        <div className="space-y-8">
          {/* Skill Radar */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-base font-bold text-navy-900 mb-6">Tier Competency Radar</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillRadarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Skills" dataKey="A" stroke="#0B3D91" fill="#0B3D91" fillOpacity={0.15} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
