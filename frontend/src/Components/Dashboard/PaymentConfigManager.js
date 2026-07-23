import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Edit3, Save, RefreshCw, CheckCircle2, AlertCircle, TrendingUp, Search, Filter } from 'lucide-react';

export default function PaymentConfigManager() {
  const [pricingMap, setPricingMap] = useState({
    State: { base_amount: 1500, gst_rate: 0.18, gst_amount: 270, total_amount: 1770, required_district_score: 50 },
    National: { base_amount: 2000, gst_rate: 0.18, gst_amount: 360, total_amount: 2360, required_state_score: 60 }
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTier, setSavingTier] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('pricing');
  const [statusFilter, setStatusFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state for form inputs
  const [editForm, setEditForm] = useState({
    State: { base_amount: 1500, required_score: 50 },
    National: { base_amount: 2000, required_score: 60 }
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  const token = localStorage.getItem('sf_token') || localStorage.getItem('token');
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pricingRes, historyRes] = await Promise.all([
        fetch(`${API_URL}/api/payments/admin/pricing`, { headers }),
        fetch(`${API_URL}/api/payments/admin/history`, { headers })
      ]);

      if (pricingRes.ok) {
        const pData = await pricingRes.json();
        if (pData && pData.State && pData.National) {
          setPricingMap(pData);
          setEditForm({
            State: {
              base_amount: pData.State.base_amount || 1500,
              required_score: pData.State.required_district_score || 50
            },
            National: {
              base_amount: pData.National.base_amount || 2000,
              required_score: pData.National.required_state_score || 60
            }
          });
        }
      }

      if (historyRes.ok) {
        const hData = await historyRes.json();
        setPaymentHistory(hData || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSavePricing = async (tierName) => {
    setSavingTier(tierName);
    setMessage(null);
    setError(null);
    try {
      const formData = editForm[tierName];
      const res = await fetch(`${API_URL}/api/payments/admin/pricing/${tierName}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          base_amount: parseFloat(formData.base_amount),
          gst_rate: 0.18,
          required_score: parseFloat(formData.required_score)
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || `Failed to update ${tierName} tier pricing`);
      }

      const updated = await res.json();
      setMessage(`Successfully updated ${tierName} tier pricing (Total: ₹${updated.total_amount})`);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingTier(null);
    }
  };

  // Filtered History
  const filteredHistory = paymentHistory.filter(item => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (tierFilter && item.target_tier !== tierFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const nameMatch = (item.user_name || '').toLowerCase().includes(q);
      const emailMatch = (item.user_email || '').toLowerCase().includes(q);
      const orderMatch = (item.gateway_order_id || '').toLowerCase().includes(q);
      if (!nameMatch && !emailMatch && !orderMatch) return false;
    }
    return true;
  });

  // Analytics Metrics
  const totalRevenue = paymentHistory
    .filter(i => i.status === 'paid' || i.status === 'success')
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const paidCount = paymentHistory.filter(i => i.status === 'paid' || i.status === 'success').length;
  const pendingCount = paymentHistory.filter(i => i.status === 'created').length;
  const failedCount = paymentHistory.filter(i => i.status === 'failed').length;

  return (
    <div className="flex flex-col gap-6">
      {/* Sub tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'pricing' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign size={16} /> Dynamic Tier Pricing Config
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'history' ? 'bg-navy text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={16} /> All Transactions & Revenue Audit ({paymentHistory.length})
          </button>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Reload Data
        </button>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold flex items-center gap-2">
          <CheckCircle2 size={18} className="shrink-0" /> {message}
        </div>
      )}

      {error && (
        <div className="p-4 bg-coral-50 border border-coral-200 text-coral-600 rounded-xl text-sm font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" /> {error}
        </div>
      )}

      {activeSubTab === 'pricing' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* State Tier Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs uppercase rounded-md tracking-wider">
                  State Level Exam Fee
                </span>
                <h3 className="text-xl font-bold text-navy-900 mt-1">State Certification Tier</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase block">Current Total</span>
                <span className="text-2xl font-bold text-coral">₹{(pricingMap.State?.total_amount || 1770).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Base Fee Amount (₹ INR)</label>
                <input
                  type="number"
                  step="50"
                  value={editForm.State.base_amount}
                  onChange={e => setEditForm({
                    ...editForm,
                    State: { ...editForm.State, base_amount: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <span className="text-[11px] text-slate-400">
                  + 18% GST (₹{round(editForm.State.base_amount * 0.18, 2)}) = Total: ₹{round(parseFloat(editForm.State.base_amount || 0) * 1.18, 2)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required District Passing Score (%)</label>
                <input
                  type="number"
                  step="5"
                  value={editForm.State.required_score}
                  onChange={e => setEditForm({
                    ...editForm,
                    State: { ...editForm.State, required_score: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <span className="text-[11px] text-slate-400">
                  Learners must achieve ≥ this percentage in District Exam to unlock checkout.
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSavePricing('State')}
              disabled={savingTier === 'State'}
              className="mt-2 w-full py-3 bg-navy hover:bg-navy-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {savingTier === 'State' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save State Tier Pricing
            </button>
          </div>

          {/* National Tier Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs uppercase rounded-md tracking-wider">
                  National Level Exam Fee
                </span>
                <h3 className="text-xl font-bold text-navy-900 mt-1">National Certification Tier</h3>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-bold uppercase block">Current Total</span>
                <span className="text-2xl font-bold text-coral">₹{(pricingMap.National?.total_amount || 2360).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Base Fee Amount (₹ INR)</label>
                <input
                  type="number"
                  step="50"
                  value={editForm.National.base_amount}
                  onChange={e => setEditForm({
                    ...editForm,
                    National: { ...editForm.National, base_amount: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <span className="text-[11px] text-slate-400">
                  + 18% GST (₹{round(editForm.National.base_amount * 0.18, 2)}) = Total: ₹{round(parseFloat(editForm.National.base_amount || 0) * 1.18, 2)}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Required State Passing Score (%)</label>
                <input
                  type="number"
                  step="5"
                  value={editForm.National.required_score}
                  onChange={e => setEditForm({
                    ...editForm,
                    National: { ...editForm.National, required_score: e.target.value }
                  })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                <span className="text-[11px] text-slate-400">
                  Learners must achieve ≥ this percentage in State Exam to unlock checkout.
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSavePricing('National')}
              disabled={savingTier === 'National'}
              className="mt-2 w-full py-3 bg-navy hover:bg-navy-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {savingTier === 'National' ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              Save National Tier Pricing
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
                <span className="text-2xl font-bold text-navy-900">₹{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Paid Transactions</span>
                <span className="text-2xl font-bold text-emerald-600">{paidCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending / Checkout</span>
                <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <RefreshCw size={20} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Failed Payments</span>
                <span className="text-2xl font-bold text-coral-600">{failedCount}</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-[260px]">
              <Search className="text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search by student name, email, or Order ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-transparent text-sm font-medium text-navy-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="success">Success</option>
                  <option value="created">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="">All Tiers</option>
                <option value="State">State</option>
                <option value="National">National</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="p-4">Date</th>
                    <th className="p-4">Student Info</th>
                    <th className="p-4">Gateway Order ID</th>
                    <th className="p-4">Target Tier</th>
                    <th className="p-4">Total Amount</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500 italic">
                        No payment records match your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-xs text-slate-500">
                          {new Date(record.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-navy-900 text-sm">{record.user_name || `User #${record.user_id}`}</div>
                          <div className="text-xs text-slate-400 font-medium">{record.user_email || '—'}</div>
                        </td>
                        <td className="p-4 font-mono text-xs text-slate-600">
                          {record.gateway_order_id || '—'}
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-navy-900">{record.target_tier}</span>
                        </td>
                        <td className="p-4 font-bold text-slate-800">
                          {record.currency} {record.total_amount?.toLocaleString()}
                        </td>
                        <td className="p-4">
                          {record.status === 'paid' || record.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded border border-emerald-200">
                              <CheckCircle2 size={12} /> Paid
                            </span>
                          ) : record.status === 'created' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 font-bold text-[11px] rounded border border-amber-200">
                              <RefreshCw size={12} className="animate-spin" /> Pending
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral-50 text-coral-600 font-bold text-[11px] rounded border border-coral-200">
                              <AlertCircle size={12} /> Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function round(val, decimals = 2) {
  const num = parseFloat(val) || 0;
  return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals);
}
