import React, { useState, useEffect } from 'react';
import { 
  Upload, Plus, Trash2, List, FileText, CheckCircle, AlertCircle, RefreshCw, 
  Search, Check, HelpCircle, Eye, ChevronLeft, ChevronRight, Layers, Tag 
} from 'lucide-react';

const QuestionBankManager = () => {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newBank, setNewBank] = useState({ subject_id: '', level: 'District', name: '', is_active: true });
  
  const [selectedBank, setSelectedBank] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  
  const [subjects, setSubjects] = useState([]);

  // Questions Verification State
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchBanks();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (selectedBank) {
      fetchQuestions(selectedBank.id);
      setSearchQuery('');
      setCurrentPage(1);
    } else {
      setQuestions([]);
    }
  }, [selectedBank]);

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/subadmins/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    }
  };

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBanks(data);
      } else {
        throw new Error('Failed to fetch question banks');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestions = async (bankId) => {
    setQuestionsLoading(true);
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/${bankId}/questions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions(data || []);
      } else {
        console.error('Failed to fetch questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleCreateBank = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('sf_token');
      const payload = {
        ...newBank,
        subject_id: parseInt(newBank.subject_id) || 1
      };
      
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowCreate(false);
        setNewBank({ subject_id: '', level: 'District', name: '', is_active: true });
        fetchBanks();
      } else {
        throw new Error('Failed to create question bank');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !selectedBank) return;
    
    setUploadStatus({ type: 'loading', message: 'Processing file...' });
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        let questionsList = JSON.parse(content);
        
        // Normalize correct_answer to be an integer
        questionsList = questionsList.map(q => {
          let ans = q.correct_answer;
          if (typeof ans === 'string') {
            const upper = ans.trim().toUpperCase();
            if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
              ans = upper.charCodeAt(0) - 65;
            } else {
              ans = parseInt(ans, 10);
            }
          }
          return {
            ...q,
            correct_answer: isNaN(ans) ? 0 : ans
          };
        });
        
        const token = localStorage.getItem('sf_token');
        const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/${selectedBank.id}/questions/upload`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify(questionsList)
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          setUploadStatus({ type: 'success', message: `Successfully imported ${data.imported_count} questions.`, errors: data.errors });
          setUploadFile(null);
          fetchQuestions(selectedBank.id);
        } else {
          let errs = data.errors || [];
          if (data.detail && Array.isArray(data.detail)) {
            errs = data.detail.map(e => `${e.loc.join('.')}: ${e.msg}`);
          } else if (data.detail && typeof data.detail === 'string') {
            errs = [data.detail];
          }
          if (errs.length === 0) errs = ['Failed to upload (Invalid JSON structure or server error)'];
          
          setUploadStatus({ type: 'error', message: 'Upload completed with errors.', errors: errs });
          if (data.imported_count > 0) {
            fetchQuestions(selectedBank.id);
          }
        }
      } catch (err) {
        setUploadStatus({ type: 'error', message: `Parse Error: ${err.message}` });
      }
    };
    reader.readAsText(uploadFile);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to remove this question?')) return;
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/${selectedBank.id}/questions/${questionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
      } else {
        alert('Failed to delete question');
      }
    } catch (err) {
      alert('Error deleting question: ' + err.message);
    }
  };

  const handleClearAllQuestions = async () => {
    if (!window.confirm(`Are you sure you want to clear all ${questions.length} questions from "${selectedBank.name}"?`)) return;
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/${selectedBank.id}/questions`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setQuestions([]);
      } else {
        alert('Failed to clear questions');
      }
    } catch (err) {
      alert('Error clearing questions: ' + err.message);
    }
  };

  const handleDeleteBank = async (bankId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this entire question bank and all associated questions?')) return;
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/exam-banks/${bankId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (selectedBank && selectedBank.id === bankId) {
          setSelectedBank(null);
        }
        fetchBanks();
      } else {
        alert('Failed to delete question bank');
      }
    } catch (err) {
      alert('Error deleting question bank: ' + err.message);
    }
  };

  const filteredQuestions = questions.filter(q => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchesText = q.text && q.text.toLowerCase().includes(query);
    const matchesOptions = q.options && Array.isArray(q.options) && q.options.some(opt => typeof opt === 'string' && opt.toLowerCase().includes(query));
    const matchesExplanation = q.explanation && q.explanation.toLowerCase().includes(query);
    const matchesTopic = q.topic_tag && q.topic_tag.toLowerCase().includes(query);
    return matchesText || matchesOptions || matchesExplanation || matchesTopic;
  });

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2.5">
            <List className="text-indigo-600" size={28} /> Question Bank & Verification Manager
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Create question repositories, upload question sets, and verify questions & answers in real time.
          </p>
        </div>
        <button 
          onClick={() => setShowCreate(!showCreate)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus size={18} /> New Question Bank
        </button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium flex items-center gap-2 shadow-sm">
          <AlertCircle size={20} className="shrink-0" /> {error}
        </div>
      )}

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3">Create New Question Bank</h3>
          <form onSubmit={handleCreateBank} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject</label>
              <select 
                required
                value={newBank.subject_id} onChange={e => setNewBank({...newBank, subject_id: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="">Select a subject...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Name</label>
              <input 
                required type="text" 
                value={newBank.name} onChange={e => setNewBank({...newBank, name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                placeholder="e.g. Python Advanced Q1 Set"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Level</label>
              <select 
                value={newBank.level} onChange={e => setNewBank({...newBank, level: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl shadow-sm p-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="Institution">Institution</option>
                <option value="District">District</option>
                <option value="State">State</option>
                <option value="National">National</option>
              </select>
            </div>
            <div className="col-span-full flex justify-end pt-2">
              <button type="submit" disabled={loading} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-700 shadow-sm transition-all">
                {loading ? 'Creating...' : 'Create Bank'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Existing Question Banks */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[750px]">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" /> Existing Banks
            </h3>
            <span className="px-2.5 py-0.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-full">
              {banks.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100 flex-1 overflow-y-auto custom-scrollbar">
            {banks.length === 0 ? (
              <div className="p-8 text-slate-400 text-center flex flex-col items-center justify-center gap-2">
                <HelpCircle size={32} />
                <span className="font-medium text-sm">No question banks found.</span>
              </div>
            ) : (
              banks.map(bank => {
                const isSelected = selectedBank?.id === bank.id;
                return (
                  <div 
                    key={bank.id} 
                    onClick={() => { setSelectedBank(bank); setUploadStatus(null); }}
                    className={`p-4 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-800 text-sm leading-snug">{bank.name}</div>
                      <button
                        onClick={(e) => handleDeleteBank(bank.id, e)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete question bank"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 mt-2 flex items-center justify-between font-medium">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md text-slate-700 font-bold">{bank.level}</span>
                      <span className={bank.is_active ? "text-emerald-600 font-bold flex items-center gap-1" : "text-rose-600 font-bold flex items-center gap-1"}>
                        <span className={`w-1.5 h-1.5 rounded-full ${bank.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {bank.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Upload & Question Verification Display */}
        <div className="lg:col-span-2 space-y-6">
          {selectedBank ? (
            <>
              {/* Bank Header & Upload Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-slate-800">{selectedBank.name}</h3>
                      <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase rounded-full tracking-wider">
                        {selectedBank.level} Level
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedBank.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                        {selectedBank.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Verify uploaded questions, review answer keys, and manage question bank content.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchQuestions(selectedBank.id)}
                      disabled={questionsLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
                      title="Refresh question list"
                    >
                      <RefreshCw size={14} className={questionsLoading ? "animate-spin text-indigo-600" : ""} />
                      Refresh
                    </button>
                    {questions.length > 0 && (
                      <button
                        onClick={handleClearAllQuestions}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        <Trash2 size={14} /> Clear All ({questions.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Upload Box */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-xl border border-slate-200 border-dashed transition-all hover:border-indigo-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100/80 text-indigo-600 rounded-xl shrink-0">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">Upload / Append Questions Set</h4>
                        <p className="text-xs text-slate-500 mt-0.5 max-w-md leading-relaxed">
                          Upload a JSON file containing an array of question objects (`text`, `options[]`, `correct_answer`, and optional `explanation`).
                        </p>
                      </div>
                    </div>
                    
                    <form onSubmit={handleFileUpload} className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer">
                        <input 
                          type="file" 
                          accept=".json"
                          onChange={(e) => { setUploadFile(e.target.files[0]); setUploadStatus(null); }}
                          className="hidden"
                        />
                        <span className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all inline-flex items-center gap-2 shadow-sm">
                          <Layers size={14} className="text-indigo-600" />
                          {uploadFile ? uploadFile.name : 'Choose JSON File'}
                        </span>
                      </label>
                      <button 
                        type="submit" 
                        disabled={!uploadFile || uploadStatus?.type === 'loading'}
                        className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-sm shadow-indigo-200"
                      >
                        {uploadStatus?.type === 'loading' ? <RefreshCw className="animate-spin" size={14} /> : <Upload size={14} />}
                        {uploadStatus?.type === 'loading' ? 'Processing...' : 'Upload & Import'}
                      </button>
                    </form>
                  </div>

                  {uploadStatus && (
                    <div className={`mt-4 p-4 rounded-xl border text-sm font-medium ${uploadStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : uploadStatus.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                      <div className="flex items-center gap-2 font-bold">
                        {uploadStatus.type === 'success' ? <CheckCircle size={18} className="text-emerald-600 shrink-0" /> : <AlertCircle size={18} className="text-rose-600 shrink-0" />}
                        <span>{uploadStatus.message}</span>
                      </div>
                      {uploadStatus.errors && uploadStatus.errors.length > 0 && (
                        <div className="mt-2 text-xs text-rose-600 bg-white/80 p-3 rounded-lg border border-rose-200 max-h-36 overflow-y-auto">
                          <p className="font-bold mb-1">Import Errors / Warnings:</p>
                          <ul className="list-disc list-inside space-y-1 font-normal">
                            {uploadStatus.errors.map((err, i) => <li key={i}>{err}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Questions Verification & Preview Section */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle className="text-emerald-600" size={22} />
                      Questions & Answers Verification
                    </h3>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                      {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {questions.length > 0 && (
                      <>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                          <input
                            type="text"
                            placeholder="Search questions or options..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all w-60"
                          />
                        </div>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                          <option value={5}>5 / page</option>
                          <option value={10}>10 / page</option>
                          <option value={25}>25 / page</option>
                          <option value={50}>50 / page</option>
                        </select>
                      </>
                    )}
                  </div>
                </div>

                {questionsLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                    <RefreshCw className="animate-spin text-indigo-600" size={32} />
                    <p className="text-sm font-medium">Loading questions for verification...</p>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="py-16 flex flex-col items-center justify-center text-center bg-slate-50/60 rounded-xl border border-slate-200 border-dashed p-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                      <HelpCircle size={32} />
                    </div>
                    <h4 className="text-base font-bold text-slate-800 mb-1">No Questions in This Bank</h4>
                    <p className="text-xs text-slate-500 max-w-md mb-6 leading-relaxed">
                      There are no questions currently stored in <strong className="text-slate-700">{selectedBank.name}</strong>. Use the upload box above to import questions from a JSON file for instant verification.
                    </p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm font-medium">
                    No questions match your search query "{searchQuery}".
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-5">
                      {paginatedQuestions.map((q, idx) => {
                        const absoluteIndex = startIndex + idx + 1;
                        return (
                          <div 
                            key={q.id} 
                            className="bg-white rounded-xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all overflow-hidden"
                          >
                            {/* Question Header Bar */}
                            <div className="bg-slate-50/90 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="px-2.5 py-1 bg-indigo-600 text-white font-bold text-xs rounded-lg flex items-center justify-center shadow-sm">
                                  #{absoluteIndex}
                                </span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                  ID: #{q.id}
                                </span>
                                {q.topic_tag && q.topic_tag !== 'General' && (
                                  <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-200/60 text-indigo-700 rounded-md text-[11px] font-bold flex items-center gap-1">
                                    <Tag size={11} /> {q.topic_tag}
                                  </span>
                                )}
                              </div>
                              
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                                title="Delete this question"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>

                            {/* Question Body */}
                            <div className="p-5 space-y-4">
                              <div className="text-base font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {q.text}
                              </div>

                              {/* Options Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                {q.options && Array.isArray(q.options) && q.options.map((opt, optIndex) => {
                                  const isCorrect = q.correct_answer === optIndex;
                                  const optionLetter = String.fromCharCode(65 + optIndex);
                                  return (
                                    <div
                                      key={optIndex}
                                      className={`p-3.5 rounded-xl border text-sm flex items-start justify-between gap-3 transition-all ${
                                        isCorrect
                                          ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-semibold shadow-sm ring-1 ring-emerald-400/30'
                                          : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/50'
                                      }`}
                                    >
                                      <div className="flex items-start gap-3">
                                        <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                                          isCorrect 
                                            ? 'bg-emerald-600 text-white shadow-sm' 
                                            : 'bg-slate-200 text-slate-700'
                                        }`}>
                                          {optionLetter}
                                        </span>
                                        <span className="leading-snug break-words">{typeof opt === 'string' ? opt : JSON.stringify(opt)}</span>
                                      </div>

                                      {isCorrect && (
                                        <span className="shrink-0 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold uppercase rounded-md tracking-wider flex items-center gap-1 shadow-sm">
                                          <CheckCircle size={12} /> Correct
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Explanation Box if present */}
                              {q.explanation && q.explanation.trim() !== '' && (
                                <div className="mt-4 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
                                  <HelpCircle size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-bold text-indigo-900 block mb-0.5">Answer Explanation & Rationale:</span>
                                    <span className="text-slate-700 leading-relaxed">{q.explanation}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs font-bold text-slate-600">
                        <div>
                          Showing <span className="text-slate-900">{startIndex + 1}</span> to <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, filteredQuestions.length)}</span> of <span className="text-slate-900">{filteredQuestions.length}</span> verified questions
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 transition-all"
                          >
                            <ChevronLeft size={14} /> Prev
                          </button>
                          <span className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800">
                            Page {currentPage} of {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-1 transition-all"
                          >
                            Next <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 flex flex-col items-center justify-center text-slate-500 h-[750px]">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                <List size={40} />
              </div>
              <h4 className="text-lg font-bold text-slate-700 mb-1">No Question Bank Selected</h4>
              <p className="text-sm text-slate-400 max-w-sm text-center">
                Select an existing question bank from the left panel, or create a new one to begin managing and verifying questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionBankManager;

