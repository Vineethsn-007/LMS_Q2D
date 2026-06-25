import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, FileEdit, Trash2, Edit, Plus, Star, Clock,
  Shield, RefreshCw, X, Check, AlertTriangle, ShieldAlert
} from 'lucide-react';
import './AdminPanel.css';

export default function AdminPanel({ user }) {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data lists
  const [usersList, setUsersList] = useState([]);
  const [proposalsList, setProposalsList] = useState([]);

  // Modals & form state

  const [isUserRoleModalOpen, setIsUserRoleModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState(null);
  const [userRoleData, setUserRoleData] = useState('learner');

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addUserFormData, setAddUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'learner'
  });

  const token = localStorage.getItem('sf_token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsersList(data);
    } catch (err) {
      setError(err.message);
    }
  };


  const fetchProposals = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reviewer/proposals`, { headers });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('sf_token');
          localStorage.removeItem('sf_user');
          window.location.reload();
          return;
        }
        throw new Error('Failed to fetch proposals');
      }
      const data = await res.json();
      setProposalsList(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    if (activeTab === 'users') await fetchUsers();
    else if (activeTab === 'proposals') await fetchProposals();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Role Management
  const handleOpenRoleModal = (usr) => {
    setCurrentUserToEdit(usr);
    setUserRoleData(usr.role);
    setIsUserRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!currentUserToEdit) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${currentUserToEdit.id}/role`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ role: userRoleData })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setIsUserRoleModalOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        method: 'POST',
        headers,
        body: JSON.stringify(addUserFormData)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to add user');
      }
      setIsAddUserModalOpen(false);
      setAddUserFormData({ name: '', email: '', password: '', role: 'learner' });
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };



  // Proposal Management
  const handleDeleteProposal = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course proposal?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/proposals/${id}`, {
        method: 'DELETE',
        headers
      });
      if (!res.ok) throw new Error('Failed to delete proposal');
      fetchProposals();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProposalStatus = async (id, status) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/reviewer/proposals/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error('Failed to update proposal status');
      fetchProposals();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-panel-container">
      <div className="admin-header">
        <div className="admin-title-row">
          <ShieldAlert className="admin-icon-main" size={28} />
          <div>
            <h1 className="admin-title">Super Admin Control Panel</h1>
            <p className="admin-subtitle">Override system database entries and alter system-wide configurations</p>
          </div>
        </div>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} /> Users Management
          </button>
          <button
            className={`admin-tab ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            <FileEdit size={16} /> Proposals Archive
          </button>
        </div>
      </div>

      {error && <div className="admin-error-alert">{error}</div>}

      <div className="admin-content-card glass">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            {activeTab === 'users' && "Registered User Profiles"}
            {activeTab === 'proposals' && "All Proposals Logs"}
          </h2>

          <div className="admin-card-actions">
            <button className="admin-btn-action secondary" onClick={loadData}>
              <RefreshCw size={14} className={loading ? "spin" : ""} /> Reload
            </button>
            {activeTab === 'users' && (
              <button className="admin-btn-action primary" onClick={() => setIsAddUserModalOpen(true)}>
                <Plus size={14} /> Add User
              </button>
            )}

          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <RefreshCw className="spin" size={36} />
            <p>Loading database entries...</p>
          </div>
        ) : (
          <div className="admin-table-container">
            {activeTab === 'users' && (
              <>
                <h3 className="admin-section-title" style={{ marginTop: '0', marginBottom: '1rem', color: '#1e293b' }}>System Staff</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter(u => ['admin', 'reviewer', 'expert'].includes(u.role)).map(usr => (
                      <tr key={usr.id}>
                        <td><strong>{usr.name}</strong></td>
                        <td>{usr.email}</td>
                        <td>
                          <span className={`role-badge ${usr.role}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {usr.role !== 'admin' && (
                              <>
                                <button className="admin-row-btn edit" onClick={() => handleOpenRoleModal(usr)}>
                                  <Shield size={12} /> Edit Role
                                </button>
                                <button className="admin-row-btn delete" onClick={() => handleDeleteUser(usr.id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="admin-section-title" style={{ marginTop: '2.5rem', marginBottom: '1rem', color: '#1e293b' }}>Learners</h3>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.filter(u => u.role === 'learner').map(usr => (
                      <tr key={usr.id}>
                        <td><strong>{usr.name}</strong></td>
                        <td>{usr.email}</td>
                        <td>
                          <span className={`role-badge ${usr.role}`}>
                            {usr.role}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {usr.role !== 'admin' && (
                              <>
                                <button className="admin-row-btn edit" onClick={() => handleOpenRoleModal(usr)}>
                                  <Shield size={12} /> Edit Role
                                </button>
                                <button className="admin-row-btn delete" onClick={() => handleDeleteUser(usr.id)}>
                                  <Trash2 size={12} /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}


            {activeTab === 'proposals' && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Course Name</th>
                    <th>Proposer</th>
                    <th>AI Category</th>
                    <th>Risk</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {proposalsList.map(p => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td><strong>{p.course_name}</strong></td>
                      <td>{p.learner_name || 'Anonymous'}</td>
                      <td>{p.ai_category || 'Pending'}</td>
                      <td>
                        <span className={`risk-badge ${p.risk_level || 'unknown'}`}>
                          {p.risk_level || 'N/A'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${p.status}`}>
                          {p.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {p.status !== 'approved' && (
                            <button className="admin-row-btn approve" onClick={() => handleUpdateProposalStatus(p.id, 'approved')}>
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button className="admin-row-btn reject" onClick={() => handleUpdateProposalStatus(p.id, 'rejected')}>
                              <X size={12} /> Reject
                            </button>
                          )}
                          <button className="admin-row-btn delete" onClick={() => handleDeleteProposal(p.id)}>
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass">
            <div className="admin-modal-header">
              <h3>Add New User</h3>
              <button className="admin-modal-close" onClick={() => setIsAddUserModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="admin-modal-body grid">
                <div className="form-group span-2">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={addUserFormData.name}
                    onChange={e => setAddUserFormData({ ...addUserFormData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group span-2">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={addUserFormData.email}
                    onChange={e => setAddUserFormData({ ...addUserFormData, email: e.target.value })}
                    placeholder="e.g. john@example.com"
                  />
                </div>
                <div className="form-group span-2">
                  <label>Password</label>
                  <input
                    type="password"
                    required
                    value={addUserFormData.password}
                    onChange={e => setAddUserFormData({ ...addUserFormData, password: e.target.value })}
                    placeholder="Temporary password"
                  />
                </div>
                <div className="form-group span-2">
                  <label>System Role</label>
                  <select
                    className="admin-select"
                    value={addUserFormData.role}
                    onChange={e => setAddUserFormData({ ...addUserFormData, role: e.target.value })}
                  >
                    <option value="learner">Learner</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="expert">Expert</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn secondary" onClick={() => setIsAddUserModalOpen(false)}>Cancel</button>
                <button type="submit" className="admin-btn primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Role Modal */}
      {isUserRoleModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal glass">
            <div className="admin-modal-header">
              <h3>Change User Role</h3>
              <button className="admin-modal-close" onClick={() => setIsUserRoleModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p>Update system access permissions for <strong>{currentUserToEdit?.name}</strong> ({currentUserToEdit?.email}).</p>
              <div className="form-group">
                <label>System Role</label>
                <select
                  className="admin-select"
                  value={userRoleData}
                  onChange={e => setUserRoleData(e.target.value)}
                >
                  <option value="learner">Learner</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="admin">Super Admin</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn secondary" onClick={() => setIsUserRoleModalOpen(false)}>Cancel</button>
              <button className="admin-btn primary" onClick={handleUpdateRole}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
