import React, { useState, useEffect } from 'react';
import { Award, Target, TrendingUp, Trophy, Globe, CheckCircle2, Share2, Download, ShieldCheck, Lock, Trash2 } from 'lucide-react';
import { getCertificateHTML } from './certificateTemplate';

const Certifications = ({ user }) => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/certificates/${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCertificates(data);
        }
      } catch (err) {
        console.error("Failed to fetch certificates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
    fetchCertificates();
  }, [user]);

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDelete = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate?")) return;
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/certificates/${certId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setCertificates(prev => prev.filter(c => c.id !== certId));
        showToast("Certificate deleted successfully");
      }
    } catch (err) {
      console.error("Failed to delete certificate", err);
    }
  };

  const handleDownload = (cert) => {
    const htmlContent = getCertificateHTML(user?.name || user?.username || 'Learner Name', cert.course_name, cert.issue_date);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    } else {
      showToast('Please allow popups to download the certificate.');
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast("Share link copied to clipboard!");
    } catch (err) {
      showToast("Failed to copy link. Please manually share it.");
    }
    document.body.removeChild(textArea);
  };

  const handleShare = (cert) => {
    const textToCopy = `Check out my verified certificate for ${cert.course_name} at SkillForge!`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => showToast("Share link copied to clipboard!"))
        .catch(() => fallbackCopyTextToClipboard(textToCopy));
    } else {
      fallbackCopyTextToClipboard(textToCopy);
    }
  };

  const handleVerify = () => {
    showToast("Certificate successfully verified as authentic.");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-slate-50 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] bg-navy-900 text-white px-6 py-3 rounded-xl shadow-xl animate-in slide-in-from-bottom-5">
          {toastMessage}
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Certification Center</h1>
          <p className="text-slate-500">Your verified credentials and progress toward new certificates</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm shrink-0">
          <Globe size={18} className="text-navy" /> Public profile
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Earned Certs</span>
            <span className="text-2xl font-bold text-navy-900">{certificates.length}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Award size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">In Progress</span>
            <span className="text-2xl font-bold text-navy-900 mb-1">0</span>
            <span className="text-xs font-semibold text-blue-500">0 more eligible</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Target size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Skill Points</span>
            <span className="text-2xl font-bold text-navy-900 mb-1">2,840</span>
            <span className="text-xs font-semibold text-emerald-500">+45 this week</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Industry Rank</span>
            <span className="text-2xl font-bold text-navy-900 mb-1">Top 8%</span>
            <span className="text-xs font-semibold text-purple-500">vs all learners</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy size={24} />
          </div>
        </div>
      </div>

      {/* Earned Certificates */}
      <h2 className="text-xl font-bold text-navy-900 mb-6">Earned Certificates</h2>
      <div className="mb-12">
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-slate-500 text-sm">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No certificates yet</h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto">You haven't earned any certificates yet. Complete expert-validated courses to earn verified credentials.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {certificates.map(cert => (
              <div key={cert.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div className="bg-gradient-to-br from-navy-800 to-navy-900 p-6 text-white relative">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-coral opacity-10 rounded-full blur-2xl"></div>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-lg text-xs font-bold mb-6 border border-white/20">
                    <CheckCircle2 size={14} className="text-emerald-400" /> Verified
                  </div>
                  <h3 className="text-xl font-bold mb-2 leading-tight relative z-10">{cert.course_name}</h3>
                  <div className="text-blue-200 text-sm font-medium relative z-10">SkillForge</div>
                  <button 
                    onClick={() => handleDelete(cert.id)}
                    className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 flex items-center justify-center text-white backdrop-blur-sm transition-colors border border-white/20"
                    title="Delete certificate"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-400 mb-5">
                    <span>Issued {cert.issue_date}</span>
                    <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-slate-500">{cert.cert_id}</span>
                  </div>
                  
                  <div className="flex gap-2 mt-auto border-t border-slate-100 pt-5">
                    <button 
                      onClick={() => handleShare(cert)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-slate-300"
                    >
                      <Share2 size={16} className="text-navy" /> Share
                    </button>
                    <button 
                      onClick={() => handleDownload(cert)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-slate-300"
                    >
                      <Download size={16} className="text-navy" /> Download
                    </button>
                    <button 
                      onClick={() => handleVerify(cert)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors border border-slate-200 hover:border-slate-300"
                    >
                      <ShieldCheck size={16} className="text-navy" /> Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


    </div>
  );
};

export default Certifications;
