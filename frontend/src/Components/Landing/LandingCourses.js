import React, { useState } from 'react';
import { ArrowRight, Clock, Users, Sparkles, Send, GraduationCap } from 'lucide-react';

const LandingCourses = ({ courses, activeCategory, setActiveCategory, searchQuery, setSearchQuery, onEnrollCourse }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const filteredCourses = courses.filter(course => {
    if (activeCategory && activeCategory !== 'All' && course.category !== activeCategory) return false;
    if (searchQuery && !course.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(course.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Show up to 6 courses on default view, but show all if filtering or searching
  const displayedCourses = (searchQuery || activeCategory !== 'All') ? filteredCourses : filteredCourses.slice(0, 6);

  const handleAskAI = async (queryText) => {
    const textToAsk = queryText || aiPrompt;
    if (!textToAsk.trim()) return;
    setAiLoading(true);
    setAiResponse(null);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: textToAsk }],
          context: "Public Course Catalog Advisor. Recommend specific SkillForge courses based on the user's career or skill goals."
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.response);
      } else {
        setAiResponse("Our AI advisor is currently experiencing high demand. Please browse the catalog below!");
      }
    } catch (err) {
      setAiResponse("Could not reach our AI advisor server right now. Feel free to browse or search courses manually below!");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <section id="courses" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Groq AI Course Advisor Banner */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 rounded-3xl p-6 md:p-8 mb-16 text-white shadow-xl border border-navy-700">
          <div className="flex items-center gap-2 text-coral text-sm font-bold uppercase tracking-wider mb-2">
            <Sparkles size={18} /> Groq AI Course Advisor
          </div>
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Not sure where to start? Ask our AI Guide</h3>
          <p className="text-slate-300 text-sm md:text-base mb-6 max-w-2xl">
            Tell our Groq-powered mentor about your background or career goals, and get instant recommendations from our expert-validated catalog.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mb-4">
            <input
              type="text"
              placeholder="e.g. I know basic HTML/CSS and want to become a full stack developer..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
              className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral text-sm backdrop-blur-sm"
            />
            <button
              onClick={() => handleAskAI()}
              disabled={aiLoading || !aiPrompt.trim()}
              className="px-6 py-3.5 bg-coral hover:bg-coral-hover disabled:opacity-50 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shrink-0 shadow-lg shadow-coral/20"
            >
              {aiLoading ? (
                <span>Thinking...</span>
              ) : (
                <>
                  <Send size={16} /> Ask AI
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {["Best AI course for Python developers", "How do I start learning Data Science?", "Full stack web development path"].map(q => (
              <button
                key={q}
                onClick={() => { setAiPrompt(q); handleAskAI(q); }}
                className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-slate-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {aiResponse && (
            <div className="mt-6 p-5 bg-white/10 rounded-2xl border border-white/15 text-slate-100 text-sm leading-relaxed animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-2 font-bold text-coral mb-2">
                <GraduationCap size={18} /> SkillForge AI Recommendation:
              </div>
              <div className="whitespace-pre-line">{aiResponse}</div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-coral font-medium tracking-wider uppercase text-sm">Our Courses</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-navy-900">
              Find the right path for you
            </h2>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
             <div className="flex overflow-x-auto bg-slate-100 p-1 rounded-lg w-full max-w-full">
                {['All', 'Software Engineering', 'AI & Machine Learning', 'Data Science & Databases'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      activeCategory === cat 
                        ? 'bg-white text-navy-900 shadow-sm' 
                        : 'text-slate-500 hover:text-navy-900'
                    }`}
                  >
                    {cat === 'All' ? 'All Courses' : cat}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <input
            type="text"
            placeholder="Search courses by skill or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-96 px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
          />
        </div>

        {displayedCourses.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-lg font-semibold text-navy-900 mb-1">No matching courses found</h3>
            <p className="text-slate-500 text-sm">Try choosing another filter or searching for a different keyword.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedCourses.map(course => (
              <div key={course.id} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-48 overflow-hidden relative">
                  {course.is_expert_validated && (
                    <span className="absolute top-4 right-4 bg-navy text-white text-xs font-semibold px-2 py-1 rounded">
                      Expert Validated
                    </span>
                  )}
                  <img 
                    src={course.image_url ? (course.image_url.startsWith('http') ? course.image_url : `${process.env.REACT_APP_API_URL || ''}${course.image_url}`) : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'} 
                    alt={course.title} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-semibold text-navy-900 mb-2 tracking-tight">{course.title}</h3>
                  <p className="text-slate-500 text-base mb-6 flex-1 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {course.hours} Hours
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" /> {course.students_count?.toLocaleString()} Students
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                    <span className="text-2xl font-semibold text-navy-900">
                      ⭐ {course.rating}
                    </span>
                    <button 
                      onClick={() => onEnrollCourse(course)}
                      className="text-coral font-medium hover:text-coral-hover flex items-center gap-1 group"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LandingCourses;
