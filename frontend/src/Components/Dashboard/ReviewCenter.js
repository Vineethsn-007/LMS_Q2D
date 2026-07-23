import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, RefreshCw, Award, Edit2, Save, FileText } from 'lucide-react';

const ReviewCenter = ({ user }) => {
  const [certificateIssues, setCertificateIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // States for inline editing certificate issues
  const [editingIssueId, setEditingIssueId] = useState(null);
  const [editForm, setEditForm] = useState({ learner_name: '', learner_email: '', course_name: '' });

  const fetchCertificateIssues = async () => {
    const token = localStorage.getItem('sf_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';

    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/reviewer/certificate-issues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const issues = await res.json();
        setCertificateIssues(issues);
      } else {
        const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
        setCertificateIssues(issues);
      }
    } catch (err) {
      const issues = JSON.parse(localStorage.getItem('sf_certificate_issues') || '[]');
      setCertificateIssues(issues);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificateIssues();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Just now';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleEditIssue = (issue) => {
    setEditingIssueId(issue.id);
    setEditForm({
      learner_name: issue.learner_name,
      learner_email: issue.learner_email,
      course_name: issue.course_name
    });
  };

  const handleSaveIssue = async (id) => {
    const token = localStorage.getItem('sf_token');
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    try {
      await fetch(`${apiUrl}/api/reviewer/certificate-issues/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          learner_name: editForm.learner_name,
          learner_email: editForm.learner_email,
          course_name: editForm.course_name,
          status: 'resolved'
        })
      });
      await fetchCertificateIssues();
    } catch (err) {
      console.error('Failed to update certificate issue:', err);
    } finally {
      setEditingIssueId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50 flex flex-col relative">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-3xl font-bold text-navy-900 leading-tight flex items-center gap-3">
              <CheckCircle className="text-blue-500" size={28} /> Review Center
            </h1>
            
            <div className="flex p-1 bg-slate-200/70 rounded-xl w-max">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-bold bg-white text-navy-900 shadow-sm"
              >
                Certificate Issues
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-coral-50 border border-coral-200 text-coral-600 rounded-xl text-sm font-bold flex items-center shadow-sm">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="animate-spin mb-4" size={32} />
            <p className="font-medium">Loading content...</p>
          </div>
        ) : certificateIssues.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <CheckCircle size={56} className="text-emerald-300 mb-4" />
            <h3 className="text-xl font-bold text-navy-900 mb-2">No Certificate Issues!</h3>
            <p className="text-slate-500 font-medium max-w-sm">There are no reported issues with certificates. Everything is running smoothly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {certificateIssues.map(issue => (
              <div key={issue.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-navy-900 mb-2">Certificate Details Issue</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Award size={14} className="text-blue-500" /> {issue.course_name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><Clock size={14} /> {formatDate(issue.created_at)}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-widest ${
                    issue.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                    {issue.status}
                  </span>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <strong className="text-xs font-bold text-navy-900 uppercase tracking-widest block mb-2 flex items-center gap-2">
                      <FileText size={14} className="text-blue-500"/> Learner Note
                    </strong>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed">
                      {issue.issue_description}
                    </p>
                  </div>
                  
                  {editingIssueId === issue.id ? (
                    <div className="flex flex-col gap-4 p-4 border border-blue-100 bg-blue-50/30 rounded-xl animate-in fade-in">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-navy-900">Learner Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          value={editForm.learner_name}
                          onChange={(e) => setEditForm({...editForm, learner_name: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-navy-900">Learner Email</label>
                        <input 
                          type="email" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          value={editForm.learner_email}
                          onChange={(e) => setEditForm({...editForm, learner_email: e.target.value})}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-navy-900">Course Name</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          value={editForm.course_name}
                          onChange={(e) => setEditForm({...editForm, course_name: e.target.value})}
                        />
                      </div>
                      <div className="flex gap-3 mt-2">
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors" onClick={() => handleSaveIssue(issue.id)}>
                          <Save size={16} /> Save & Resolve
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-colors" onClick={() => setEditingIssueId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[100px_1fr] gap-y-3 gap-x-2 text-sm">
                        <span className="font-semibold text-slate-400">Learner:</span>
                        <span className="font-medium text-navy-900">{issue.learner_name}</span>
                        <span className="font-semibold text-slate-400">Email:</span>
                        <span className="font-medium text-navy-900">{issue.learner_email}</span>
                        <span className="font-semibold text-slate-400">Course:</span>
                        <span className="font-medium text-navy-900">{issue.course_name}</span>
                      </div>
                      
                      {issue.status !== 'resolved' && (
                        <div className="pt-4 border-t border-slate-100">
                          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 hover:border-blue-200 hover:bg-blue-50 text-navy-900 text-sm font-bold rounded-xl transition-all" onClick={() => handleEditIssue(issue)}>
                            <Edit2 size={16} className="text-blue-500" /> Edit Details & Resolve
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewCenter;
