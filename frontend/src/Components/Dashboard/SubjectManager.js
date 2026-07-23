import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, CheckCircle, AlertCircle, Save, X, BookOpen, Layers, Check, Ban } from 'lucide-react';

export default function SubjectManager({ user, institutionsList }) {
  const [activeSubTab, setActiveSubTab] = useState('subjects'); // 'subjects' | 'specializations'

  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Specializations state
  const [specializations, setSpecializations] = useState([]);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Subject Modal State
  const [subjectModalOpen, setSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    description: '',
    specialization_id: '',
    institution_id: ''
  });

  // Specialization Modal State
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState(null);
  const [specForm, setSpecForm] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  });

  const token = localStorage.getItem('sf_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Fetch Specializations
  const fetchSpecializations = async () => {
    setLoadingSpecs(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/students/specializations`, { headers });
      if (res.ok) {
        const data = await res.json();
        setSpecializations(data);
        if (data.length > 0 && !subjectForm.specialization_id) {
          setSubjectForm(prev => ({ ...prev, specialization_id: data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch specializations', err);
    } finally {
      setLoadingSpecs(false);
    }
  };

  // Fetch Subjects
  const fetchSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/subadmins/subjects`, { headers });
      if (res.ok) setSubjects(await res.json());
      else throw new Error('Failed to load subjects');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSubjects(false);
    }
  };

  useEffect(() => {
    fetchSpecializations();
    fetchSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- SUBJECT HANDLERS ---
  const handleOpenSubjectModal = (subj = null) => {
    if (subj) {
      setEditingSubject(subj);
      setSubjectForm({
        name: subj.name || '',
        code: subj.code || '',
        description: subj.description || '',
        specialization_id: subj.specialization_id || (specializations[0]?.id || ''),
        institution_id: subj.institution_id || ''
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        name: '',
        code: '',
        description: '',
        specialization_id: specializations[0]?.id || '',
        institution_id: ''
      });
    }
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async (e) => {
    e.preventDefault();
    try {
      const url = editingSubject
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/subadmins/subjects/${editingSubject.id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/subadmins/subjects`;
      const method = editingSubject ? 'PUT' : 'POST';

      const payload = { ...subjectForm };
      payload.institution_id = payload.institution_id === '' ? null : parseInt(payload.institution_id);
      payload.specialization_id = parseInt(payload.specialization_id);

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to save subject');
      }
      setSubjectModalOpen(false);
      showSuccess(editingSubject ? 'Subject updated' : 'Subject created');
      fetchSubjects();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/subadmins/subjects/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showSuccess('Subject deleted');
        fetchSubjects();
      } else {
        throw new Error('Failed to delete subject');
      }
    } catch (err) { setError(err.message); }
  };

  // --- SPECIALIZATION HANDLERS ---
  const handleOpenSpecModal = (spec = null) => {
    if (spec) {
      setEditingSpec(spec);
      setSpecForm({
        name: spec.name || '',
        code: spec.code || '',
        description: spec.description || '',
        is_active: spec.is_active ?? true
      });
    } else {
      setEditingSpec(null);
      setSpecForm({
        name: '',
        code: '',
        description: '',
        is_active: true
      });
    }
    setSpecModalOpen(true);
  };

  const handleSaveSpec = async (e) => {
    e.preventDefault();
    try {
      const url = editingSpec
        ? `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/students/specializations/${editingSpec.id}`
        : `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/students/specializations`;
      const method = editingSpec ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(specForm) });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || 'Failed to save specialization');
      }
      setSpecModalOpen(false);
      showSuccess(editingSpec ? 'Specialization updated' : 'Specialization created');
      fetchSpecializations();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteSpec = async (id) => {
    if (!window.confirm('Are you sure you want to delete this specialization?')) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/students/specializations/${id}`, { method: 'DELETE', headers });
      if (res.ok) {
        showSuccess('Specialization deleted');
        fetchSpecializations();
      } else {
        throw new Error('Failed to delete specialization');
      }
    } catch (err) { setError(err.message); }
  };

  const handleToggleSpecActive = async (spec) => {
    try {
      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/admin/students/specializations/${spec.id}`;
      const payload = {
        name: spec.name,
        code: spec.code,
        description: spec.description,
        is_active: !spec.is_active
      };
      const res = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(payload) });
      if (res.ok) {
        showSuccess(`Specialization status changed to ${!spec.is_active ? 'Active' : 'Inactive'}`);
        fetchSpecializations();
      }
    } catch (err) { setError(err.message); }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col gap-6">
      {/* Header & Sub-Tab Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
        <div>
          <h2 className="text-xl font-bold text-navy-900">Academic Curriculum & Specializations</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage specializations and subject repositories linked to institutions.</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl shrink-0">
          <button
            onClick={() => setActiveSubTab('subjects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'subjects'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <BookOpen size={15} /> Subjects Repository ({subjects.length})
          </button>
          <button
            onClick={() => setActiveSubTab('specializations')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'specializations'
                ? 'bg-white text-navy-900 shadow-sm'
                : 'text-slate-500 hover:text-navy-900'
            }`}
          >
            <Layers size={15} /> Specializations ({specializations.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-coral-50 border border-coral-200 text-coral-600 rounded-xl text-sm font-bold flex items-center gap-3">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-3">
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* SUB-TAB 1: SUBJECTS */}
      {activeSubTab === 'subjects' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Subject Catalog</span>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus size={15} /> Create Subject
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Subject Name & Code</th>
                  <th className="py-3 px-4">Linked Specialization</th>
                  <th className="py-3 px-4">Institution Scope</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingSubjects ? (
                  <tr><td colSpan="4" className="py-8 text-center text-slate-400 font-medium">Loading subjects...</td></tr>
                ) : subjects.length === 0 ? (
                  <tr><td colSpan="4" className="py-8 text-center text-slate-400 font-medium">No subjects found.</td></tr>
                ) : (
                  subjects.map(subj => {
                    const inst = subj.institution_id ? (institutionsList || []).find(i => i.id === subj.institution_id) : null;
                    const spec = specializations.find(s => s.id === subj.specialization_id);
                    return (
                      <tr key={subj.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-navy-900">{subj.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{subj.code || 'NO-CODE'}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-bold rounded border border-purple-200">
                            {spec ? spec.name : `Spec ID ${subj.specialization_id}`}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {subj.institution_id === null ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase rounded border border-slate-200">Global</span>
                          ) : (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase rounded border border-emerald-200">
                              {inst ? inst.code || inst.name : `Inst ID ${subj.institution_id}`}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenSubjectModal(subj)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition-colors flex items-center gap-1">
                              <Edit size={13} /> Edit
                            </button>
                            <button onClick={() => handleDeleteSubject(subj.id)} className="px-3 py-1.5 bg-coral-50 text-coral-600 hover:bg-coral-100 font-bold rounded-lg text-xs transition-colors flex items-center gap-1">
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SPECIALIZATIONS */}
      {activeSubTab === 'specializations' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Specializations Roster</span>
            <button
              onClick={() => handleOpenSpecModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus size={15} /> Add Specialization
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Specialization Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {loadingSpecs ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-400 font-medium">Loading specializations...</td></tr>
                ) : specializations.length === 0 ? (
                  <tr><td colSpan="5" className="py-8 text-center text-slate-400 font-medium">No specializations found. Click "Add Specialization" above to create one.</td></tr>
                ) : (
                  specializations.map(spec => (
                    <tr key={spec.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 font-bold text-navy-900">{spec.name}</td>
                      <td className="py-4 px-4 font-mono text-xs text-slate-600">{spec.code || '-'}</td>
                      <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate">{spec.description || 'No description provided.'}</td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleSpecActive(spec)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                            spec.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {spec.is_active ? <><Check size={12} /> Active</> : <><Ban size={12} /> Inactive</>}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenSpecModal(spec)} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition-colors flex items-center gap-1">
                            <Edit size={13} /> Edit
                          </button>
                          <button onClick={() => handleDeleteSpec(spec.id)} className="px-3 py-1.5 bg-coral-50 text-coral-600 hover:bg-coral-100 font-bold rounded-lg text-xs transition-colors flex items-center gap-1">
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBJECT MODAL */}
      {subjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-navy-900">{editingSubject ? 'Edit Subject' : 'Create Subject'}</h3>
              <button onClick={() => setSubjectModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveSubject} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Subject Name</label>
                  <input
                    type="text" required value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. Advanced AI Frameworks"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Code</label>
                  <input
                    type="text" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. AI-401"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                  <textarea
                    value={subjectForm.description} onChange={e => setSubjectForm({...subjectForm, description: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Brief description..." rows={2}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Institution Scope</label>
                  <select
                    value={subjectForm.institution_id} onChange={e => setSubjectForm({...subjectForm, institution_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  >
                    {user?.role === 'admin' && <option value="">Global (All Institutions)</option>}
                    {(institutionsList || []).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Linked Specialization</label>
                  <select
                    value={subjectForm.specialization_id} onChange={e => setSubjectForm({...subjectForm, specialization_id: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    required
                  >
                    {specializations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSubjectModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
                    <Save size={16} /> Save Subject
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SPECIALIZATION MODAL */}
      {specModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-navy-900">{editingSpec ? 'Edit Specialization' : 'Create Specialization'}</h3>
              <button onClick={() => setSpecModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSaveSpec} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Specialization Name</label>
                  <input
                    type="text" required value={specForm.name} onChange={e => setSpecForm({...specForm, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. Data Science & Analytics"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Code</label>
                  <input
                    type="text" value={specForm.code} onChange={e => setSpecForm({...specForm, code: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="e.g. DATA_SCI"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase">Description</label>
                  <textarea
                    value={specForm.description} onChange={e => setSpecForm({...specForm, description: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    placeholder="Brief description of this specialization track..." rows={2}
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="spec-active-checkbox"
                    checked={specForm.is_active}
                    onChange={e => setSpecForm({...specForm, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="spec-active-checkbox" className="text-sm font-bold text-navy-900 cursor-pointer">
                    Active (Visible for student allocation & subjects)
                  </label>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setSpecModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
                    <Save size={16} /> Save Specialization
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
