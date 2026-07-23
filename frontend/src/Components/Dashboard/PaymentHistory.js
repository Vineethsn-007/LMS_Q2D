import React, { useState, useEffect } from 'react';
import { CreditCard, Download, CheckCircle, RefreshCw, AlertCircle } from 'lucide-react';

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('sf_token');
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/payments/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch payment history');
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="animate-spin text-navy" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <CreditCard className="text-blue-500" /> Billing & Payment History
      </h2>

      {error && (
        <div className="p-4 bg-coral-50 text-coral-600 rounded-xl text-sm font-bold flex items-center gap-2 mb-6">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {history.length === 0 ? (
        <div className="text-center text-slate-500 py-8 italic">
          No payment history found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider font-bold bg-slate-50/50">
                <th className="p-4">Date</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Tier / Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600">
                    {new Date(record.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {record.gateway_order_id}
                  </td>
                  <td className="p-4 font-bold text-navy-900">
                    {record.target_tier} Access
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    {record.currency} {record.total_amount}
                  </td>
                  <td className="p-4">
                    {record.status === 'paid' || record.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-md border border-emerald-200">
                        <CheckCircle size={12} /> Paid
                      </span>
                    ) : record.status === 'created' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-md border border-amber-200">
                        <RefreshCw size={12} className="animate-spin" /> Pending
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-coral-50 text-coral-600 font-bold text-xs rounded-md border border-coral-200">
                        <AlertCircle size={12} /> Failed
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {record.status === 'paid' || record.status === 'success' ? (
                      <button 
                        onClick={() => {
                          const receiptHtml = `
                            <html>
                              <head><title>Payment Receipt - ${record.gateway_order_id}</title>
                              <style>
                                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
                                .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
                                .logo { font-size: 24px; font-weight: bold; color: #0f172a; }
                                .row { display: flex; justify-content: space-between; margin: 10px 0; }
                                .total { font-size: 18px; font-weight: bold; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 20px; }
                                .badge { background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
                              </style>
                              </head>
                              <body>
                                <div class="header">
                                  <div class="logo">SkillForge LMS</div>
                                  <p style="color: #64748b; margin: 5px 0 0 0;">Official Payment Receipt</p>
                                </div>
                                <div class="row"><span>Order ID:</span> <strong>${record.gateway_order_id || 'N/A'}</strong></div>
                                <div class="row"><span>Payment ID:</span> <strong>${record.gateway_payment_id || 'N/A'}</strong></div>
                                <div class="row"><span>Date:</span> <span>${new Date(record.created_at).toLocaleString()}</span></div>
                                <div class="row"><span>Status:</span> <span class="badge">PAID</span></div>
                                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
                                <div class="row"><span>Tier Access unlocked:</span> <strong>${record.target_tier} Level</strong></div>
                                <div class="row"><span>Base Amount:</span> <span>${record.currency} ${record.amount}</span></div>
                                <div class="row"><span>GST (18%):</span> <span>${record.currency} ${record.gst_amount}</span></div>
                                <div class="row total"><span>Total Amount Paid:</span> <span>${record.currency} ${record.total_amount}</span></div>
                                <p style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center;">Thank you for investing in your skills with SkillForge LMS!</p>
                              </body>
                            </html>
                          `;
                          const win = window.open('', '_blank');
                          win.document.write(receiptHtml);
                          win.document.close();
                          win.print();
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center justify-end gap-1 ml-auto cursor-pointer"
                      >
                        <Download size={14} /> Receipt
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
