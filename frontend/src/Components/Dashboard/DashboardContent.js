import React from 'react';
import { Play, Award, Clock, TrendingUp, Sparkles } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

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
  { subject: 'React', A: 90, fullMark: 100 },
  { subject: 'Node.js', A: 80, fullMark: 100 },
  { subject: 'Python', A: 65, fullMark: 100 },
  { subject: 'ML/AI', A: 40, fullMark: 100 },
  { subject: 'DevOps', A: 70, fullMark: 100 },
  { subject: 'Sys. Design', A: 85, fullMark: 100 },
];

const DashboardContent = ({ user }) => {
  return (
    <div className="dashboard-content-scroll">
      <div className="dashboard-grid">
        
        {/* Left Column */}
        <div className="dashboard-col-left">
          
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="banner-streak">
              <span className="fire-icon">🔥</span> 12-day streak!
            </div>
            <h1 className="welcome-title">Good morning, {user?.name?.split(' ')[0] || 'Alex'} 👋</h1>
            <p className="welcome-subtitle">You're 68% through your React Mastery path. Keep it up!</p>
            
            <div style={{ maxWidth: '400px' }}>
              <div className="progress-info">
                <span>Weekly goal: 8 hrs</span>
                <span>6.5 / 8 hrs</span>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill" style={{ width: '81.25%' }}></div>
              </div>
            </div>

            <div className="xp-badge">
              <div className="xp-amount">2,840</div>
              <div className="xp-label">XP Points</div>
              <div className="xp-rank">🏆 Top 8% this month</div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Courses Enrolled</span>
                <div className="stat-icon blue"><Play size={16} /></div>
              </div>
              <div className="stat-value">7</div>
              <div className="stat-change">+2 this month</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Completed</span>
                <div className="stat-icon green"><Award size={16} /></div>
              </div>
              <div className="stat-value">4</div>
              <div className="stat-change">3 certs earned</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Hours Learned</span>
                <div className="stat-icon purple"><Clock size={16} /></div>
              </div>
              <div className="stat-value">142</div>
              <div className="stat-change">+12 this week</div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <span className="stat-title">Skill Score</span>
                <div className="stat-icon orange"><TrendingUp size={16} /></div>
              </div>
              <div className="stat-value">840</div>
              <div className="stat-change">+45 points</div>
            </div>
          </div>

          {/* Continue Learning */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Continue Learning</h2>
              <a href="#" className="section-link">View all →</a>
            </div>
            
            <div className="course-list">
              <div className="course-item">
                <div className="course-icon"><Play fill="currentColor" size={24} /></div>
                <div className="course-info">
                  <div className="course-title">Advanced React Patterns & Architecture</div>
                  <div className="course-lesson">Lesson 14: Custom Hooks Deep Dive</div>
                  <div className="course-progress-wrap">
                    <span className="course-progress-text" style={{ width: 'auto' }}>Progress</span>
                    <div className="course-progress-bg">
                      <div className="course-progress-fill" style={{ width: '68%' }}></div>
                    </div>
                    <span className="course-progress-text" style={{ color: '#0ea5e9' }}>68%</span>
                  </div>
                </div>
                <button className="resume-btn">Resume</button>
              </div>

              <div className="course-item">
                <div className="course-icon"><Play fill="currentColor" size={24} /></div>
                <div className="course-info">
                  <div className="course-title">System Design for Senior Engineers</div>
                  <div className="course-lesson">Lesson 5: Distributed Caching</div>
                  <div className="course-progress-wrap">
                    <span className="course-progress-text" style={{ width: 'auto' }}>Progress</span>
                    <div className="course-progress-bg">
                      <div className="course-progress-fill" style={{ width: '32%' }}></div>
                    </div>
                    <span className="course-progress-text" style={{ color: '#0ea5e9' }}>32%</span>
                  </div>
                </div>
                <button className="resume-btn">Resume</button>
              </div>

              <div className="course-item">
                <div className="course-icon"><Play fill="currentColor" size={24} /></div>
                <div className="course-info">
                  <div className="course-title">Machine Learning Fundamentals</div>
                  <div className="course-lesson">Lesson 2: Linear Regression</div>
                  <div className="course-progress-wrap">
                    <span className="course-progress-text" style={{ width: 'auto' }}>Progress</span>
                    <div className="course-progress-bg">
                      <div className="course-progress-fill" style={{ width: '15%' }}></div>
                    </div>
                    <span className="course-progress-text" style={{ color: '#0ea5e9' }}>15%</span>
                  </div>
                </div>
                <button className="resume-btn">Resume</button>
              </div>
            </div>
          </div>

          {/* Learning Activity Chart */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Learning Activity</h2>
              <span className="stat-title">Last 8 weeks</span>
            </div>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="dashboard-col-right">
          
          {/* AI Recommendations */}
          <div className="section-card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <div className="recommendations-title-wrap">
                <div className="ai-icon"><Sparkles size={16} /></div>
                <h2 className="section-title" style={{ fontSize: '1rem' }}>AI Recommendations</h2>
              </div>
            </div>
            
            <div className="rec-list">
              <div className="rec-item">
                <span className="rec-name">TypeScript Advanced Types</span>
                <span className="rec-match">97%</span>
              </div>
              <div className="rec-item">
                <span className="rec-name">Next.js 14 App Router</span>
                <span className="rec-match">94%</span>
              </div>
              <div className="rec-item">
                <span className="rec-name">Rust for Systems Dev</span>
                <span className="rec-match">88%</span>
              </div>
            </div>
          </div>

          {/* Skill Radar */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title" style={{ fontSize: '1rem' }}>Skill Radar</h2>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Radar name="Skills" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="section-card">
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <h2 className="section-title" style={{ fontSize: '1rem' }}>Upcoming Deadlines</h2>
            </div>
            
            <div className="deadline-list">
              <div className="deadline-item">
                <span className="deadline-title">React Final Project</span>
                <span className="deadline-date">Jun 22</span>
              </div>
              <div className="deadline-item">
                <span className="deadline-title">ML Quiz 3</span>
                <span className="deadline-date">Jun 28</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
