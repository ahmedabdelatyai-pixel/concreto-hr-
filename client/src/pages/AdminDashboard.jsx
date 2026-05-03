import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import axios from 'axios';

function AdminDashboard() {
  const navigate = useNavigate();
  const reportRef = useRef(null);
  const isAdminLoggedIn = useAdminStore(state => state.isAdminLoggedIn);
  const adminLogout = useAdminStore(state => state.adminLogout);
  const jobs = useAdminStore(state => state.jobs);
  const addJob = useAdminStore(state => state.addJob);
  const deleteJob = useAdminStore(state => state.deleteJob);
  const applicants = useAdminStore(state => state.applicants);
  const fetchJobs = useAdminStore(state => state.fetchJobs);
  const fetchApplicants = useAdminStore(state => state.fetchApplicants);
  const clearApplicants = useAdminStore(state => state.clearApplicants);

  const [activeTab, setActiveTab] = useState('analytics');
  const [showAddJob, setShowAddJob] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [newJob, setNewJob] = useState({ title_en: '', title_ar: '', department: '' });
  const [serverStatus, setServerStatus] = useState('checking');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterJob, setFilterJob] = useState('all');

  useEffect(() => {
    const checkServer = async () => {
      try {
        await axios.get('http://localhost:5000/');
        setServerStatus('online');
      } catch (e) {
        setServerStatus('offline');
      }
    };
    checkServer();
  }, []);

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchJobs();
      fetchApplicants();
    }
  }, [isAdminLoggedIn, fetchJobs, fetchApplicants]);

  const handleDownloadPDF = () => {
    const element = reportRef.current;
    if (!element) return;

    const opt = {
      margin: 10,
      filename: `Concreto_Report_${selectedApplicant.candidate.name.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf (loaded via CDN in index.html)
    window.html2pdf().from(element).set(opt).save();
  };

  const handleDownloadCV = () => {
    if (selectedApplicant?.cvFile?.data) {
      const a = document.createElement('a');
      a.href = selectedApplicant.cvFile.data;
      a.download = selectedApplicant.cvFile.name || 'Candidate_CV';
      a.click();
    } else {
      alert('No CV file available for this applicant.');
    }
  };

  // Redirect if not logged in
  if (!isAdminLoggedIn) {
    navigate('/admin/login');
    return null;
  }

  const handleAddJob = (e) => {
    e.preventDefault();
    addJob(newJob);
    setNewJob({ title_en: '', title_ar: '', department: '' });
    setShowAddJob(false);
  };

  const handleLogout = () => {
    adminLogout();
    navigate('/');
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find(j => j._id === jobId);
    return job ? job.title_en : 'Unknown';
  };

  const getStatusBadge = (rec) => {
    const colors = {
      'Strong Fit': { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' },
      'Potential Fit': { bg: 'rgba(252, 163, 17, 0.15)', color: '#fca311' },
      'Not Fit': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
      'Invalid Answers': { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' },
    };
    const style = colors[rec] || colors['Not Fit'];
    return (
      <span style={{
        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: '600',
        backgroundColor: style.bg, color: style.color,
      }}>{rec}</span>
    );
  };

  // ─── Analytics Stats ───────────────────────────────────
  const totalApplicants = applicants.length;
  const strongFit = applicants.filter(a => a.evaluation?.recommendation === 'Strong Fit').length;
  const potentialFit = applicants.filter(a => a.evaluation?.recommendation === 'Potential Fit').length;
  const notFit = applicants.filter(a => ['Not Fit', 'Invalid Answers'].includes(a.evaluation?.recommendation)).length;
  const avgScore = totalApplicants > 0
    ? Math.round(applicants.reduce((sum, a) => sum + (a.evaluation?.total_score || 0), 0) / totalApplicants)
    : 0;
  const topJob = jobs.reduce((top, job) => {
    const count = applicants.filter(a => a.jobId === job._id).length;
    return count > (top.count || 0) ? { title: job.title_en, count } : top;
  }, {});
  const thisWeek = applicants.filter(a => {
    const d = new Date(a.appliedAt);
    const now = new Date();
    return (now - d) / (1000 * 60 * 60 * 24) <= 7;
  }).length;

  // ─── Filtered Applicants ──────────────────────────────
  const filteredApplicants = applicants.filter(app => {
    const matchSearch = !searchQuery ||
      app.candidate?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.candidate?.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || app.evaluation?.recommendation === filterStatus;
    const matchJob = filterJob === 'all' || app.jobId === filterJob;
    return matchSearch && matchStatus && matchJob;
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)' }}>
      {/* Top Navbar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', backgroundColor: 'var(--color-card)',
        borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <h2 style={{ margin: 0, fontSize: '1.3rem' }}>
          <span style={{ color: 'var(--color-primary)' }}>Concreto</span> HR Dashboard
        </h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>👤 Admin</span>
          <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
          <button
            onClick={() => { setActiveTab('analytics'); setSelectedApplicant(null); }}
            className={activeTab === 'analytics' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            📊 Analytics
          </button>
          <button
            onClick={() => { setActiveTab('applicants'); setSelectedApplicant(null); }}
            className={activeTab === 'applicants' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            👥 Applicants ({applicants.length})
          </button>
          <button
            onClick={() => { setActiveTab('jobs'); setSelectedApplicant(null); }}
            className={activeTab === 'jobs' ? 'btn btn-primary' : 'btn btn-outline'}
            style={{ padding: '0.6rem 1.5rem' }}
          >
            📋 Jobs ({jobs.length})
          </button>
        </div>

        {/* ========== ANALYTICS TAB ========== */}
        {activeTab === 'analytics' && (
          <div className="fade-in">
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Applicants', value: totalApplicants, icon: '👥', color: '#3b82f6' },
                { label: 'Avg. Score', value: `${avgScore}/100`, icon: '⭐', color: '#fca311' },
                { label: 'Strong Fit', value: strongFit, icon: '✅', color: '#10b981' },
                { label: 'This Week', value: thisWeek, icon: '📅', color: '#8b5cf6' },
              ].map((kpi, i) => (
                <div key={i} className="card" style={{ padding: '1.5rem', borderLeft: `4px solid ${kpi.color}`, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{kpi.icon}</div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: kpi.color }}>{kpi.value}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{kpi.label}</div>
                  <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '5rem', opacity: 0.05 }}>{kpi.icon}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Recommendation Breakdown Chart */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Recommendation Breakdown</h3>
                {totalApplicants === 0 ? (
                  <p className="text-muted">No applicants yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: 'Strong Fit', count: strongFit, color: '#10b981' },
                      { label: 'Potential Fit', count: potentialFit, color: '#fca311' },
                      { label: 'Not Fit / Invalid', count: notFit, color: '#ef4444' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                          <span style={{ fontWeight: '700', color: item.color }}>{item.count} ({totalApplicants > 0 ? Math.round(item.count / totalApplicants * 100) : 0}%)</span>
                        </div>
                        <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${totalApplicants > 0 ? (item.count / totalApplicants) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Applicants per Job */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Applicants per Job</h3>
                {jobs.length === 0 ? (
                  <p className="text-muted">No jobs yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {jobs.slice(0, 6).map((job) => {
                      const count = applicants.filter(a => a.jobId === job._id).length;
                      const maxCount = Math.max(...jobs.map(j => applicants.filter(a => a.jobId === j._id).length), 1);
                      return (
                        <div key={job._id}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title_en}</span>
                            <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{count}</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))', borderRadius: '999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score Distribution */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Score Distribution</h3>
                {totalApplicants === 0 ? <p className="text-muted">No data.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { label: '80–100 (Excellent)', range: [80, 100], color: '#10b981' },
                      { label: '60–79 (Good)', range: [60, 79], color: '#fca311' },
                      { label: '40–59 (Average)', range: [40, 59], color: '#f97316' },
                      { label: '0–39 (Poor)', range: [0, 39], color: '#ef4444' },
                    ].map((tier, i) => {
                      const count = applicants.filter(a => {
                        const s = a.evaluation?.total_score || 0;
                        return s >= tier.range[0] && s <= tier.range[1];
                      }).length;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                            <span style={{ fontSize: '0.85rem' }}>{tier.label}</span>
                            <span style={{ fontWeight: '700', color: tier.color }}>{count}</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ width: `${(count / totalApplicants) * 100}%`, height: '100%', background: tier.color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Summary */}
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem' }}>Quick Summary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {[
                    { label: 'Most Popular Job', value: topJob.title ? `${topJob.title} (${topJob.count})` : 'N/A', icon: '🏆' },
                    { label: 'Acceptance Rate', value: totalApplicants > 0 ? `${Math.round(strongFit / totalApplicants * 100)}%` : '0%', icon: '📈' },
                    { label: 'Rejection Rate', value: totalApplicants > 0 ? `${Math.round(notFit / totalApplicants * 100)}%` : '0%', icon: '📉' },
                    { label: 'Under Review', value: potentialFit, icon: '🔍' },
                    { label: 'Total Open Positions', value: jobs.length, icon: '💼' },
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.icon} {item.label}</span>
                      <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}


        {activeTab === 'jobs' && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Active Job Positions</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-outline" onClick={() => { if(confirm('Clear all applicants?')) { clearApplicants(); } }} style={{ padding: '0.5rem 1rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
                  🗑 Clear All Applicants
                </button>
                <button className="btn btn-primary" onClick={() => setShowAddJob(!showAddJob)} style={{ padding: '0.5rem 1rem' }}>
                  {showAddJob ? '✕ Cancel' : '+ Add Job'}
                </button>
              </div>
            </div>

            {/* Add Job Form */}
            {showAddJob && (
              <div className="card fade-in" style={{ marginBottom: '1.5rem', border: '1px solid var(--color-primary)' }}>
                <h4 style={{ marginBottom: '1rem' }}>New Job Position</h4>
                <form onSubmit={handleAddJob}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Title (English)</label>
                      <input type="text" className="form-control" required
                        value={newJob.title_en} onChange={(e) => setNewJob({ ...newJob, title_en: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title (Arabic)</label>
                      <input type="text" className="form-control" required dir="rtl"
                        value={newJob.title_ar} onChange={(e) => setNewJob({ ...newJob, title_ar: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input type="text" className="form-control" required
                        value={newJob.department} onChange={(e) => setNewJob({ ...newJob, department: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', padding: '0.6rem 2rem' }}>
                    Save Job
                  </button>
                </form>
              </div>
            )}

            {/* Jobs List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
              {jobs.map(job => {
                const jobApplicants = applicants.filter(a => a.jobId === job._id);
                return (
                  <div className="card" key={job._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, marginBottom: '0.3rem' }}>{job.title_en}</h4>
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>{job.title_ar} · {job.department}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{jobApplicants.length}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Applicants</div>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600',
                        backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981',
                      }}>Active</span>
                      <button className="btn btn-outline" onClick={() => deleteJob(job._id)}
                        style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== APPLICANTS TAB ========== */}
        {activeTab === 'applicants' && !selectedApplicant && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0 }}>
                All Applicants
                <span className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  ({filteredApplicants.length} of {applicants.length})
                </span>
              </h3>
              <button className="btn btn-outline" onClick={() => { if(window.confirm('Clear all applicants?')) clearApplicants(); }}
                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                🗑 Clear All
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Search by name, email or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ flex: '2', minWidth: '200px' }}
              />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="form-control"
                style={{ flex: '1', minWidth: '160px' }}
              >
                <option value="all">All Statuses</option>
                <option value="Strong Fit">✅ Strong Fit</option>
                <option value="Potential Fit">🔶 Potential Fit</option>
                <option value="Not Fit">❌ Not Fit</option>
                <option value="Invalid Answers">⚠️ Invalid Answers</option>
              </select>
              <select
                value={filterJob}
                onChange={e => setFilterJob(e.target.value)}
                className="form-control"
                style={{ flex: '1', minWidth: '160px' }}
              >
                <option value="all">All Jobs</option>
                {jobs.map(j => <option key={j._id} value={j._id}>{j.title_en}</option>)}
              </select>
              {(searchQuery || filterStatus !== 'all' || filterJob !== 'all') && (
                <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterJob('all'); }}
                  style={{ padding: '0.5rem 1rem' }}>✕ Clear</button>
              )}
            </div>

            {filteredApplicants.length === 0 ? (
              <div className="card text-center" style={{ padding: '3rem' }}>
                <p className="text-muted" style={{ fontSize: '1.1rem' }}>
                  {applicants.length === 0 ? 'No applicants yet.' : 'No results match your search/filter.'}
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Applied Role</th>
                      <th style={thStyle}>Score</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplicants.map((app, idx) => (
                      <tr key={app._id} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{...tdStyle, color: 'var(--color-text-muted)', fontSize: '0.8rem'}}>{idx + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: '600' }}>{app.candidate?.name}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>{app.candidate?.email}</div>
                        </td>
                        <td style={tdStyle}>{app.candidate?.jobTitle || getJobTitle(app.jobId)}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 'bold', color: (app.evaluation?.total_score || 0) >= 60 ? '#10b981' : '#ef4444' }}>
                            {app.evaluation?.total_score || 0} / 100
                          </span>
                        </td>
                        <td style={tdStyle}>{getStatusBadge(app.evaluation?.recommendation || 'Not Fit')}</td>
                        <td style={{...tdStyle, fontSize: '0.8rem', color: 'var(--color-text-muted)'}}>
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>
                          <button className="btn btn-outline" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                            onClick={() => setSelectedApplicant(app)}>
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}


        {/* ========== APPLICANT DETAIL VIEW ========== */}
        {activeTab === 'applicants' && selectedApplicant && (
          <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <button className="btn btn-outline" onClick={() => setSelectedApplicant(null)}
                style={{ padding: '0.5rem 1rem' }}>
                ← Back to Applicants
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {selectedApplicant?.cvFile && (
                  <button className="btn btn-outline" onClick={handleDownloadCV} style={{ padding: '0.5rem 1rem', borderColor: 'var(--color-info)', color: 'var(--color-info)' }}>
                    📄 Download Original CV
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleDownloadPDF} style={{ padding: '0.5rem 1rem' }}>
                  📥 Download PDF Report
                </button>
              </div>
            </div>
            <div ref={reportRef} style={{ padding: '10px' }}>
              <div style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #fca311', paddingBottom: '10px' }} className="pdf-only">
                <h1 style={{ color: '#000', margin: 0 }}>Concreto Ready Mix</h1>
                <p style={{ color: '#666', margin: 0 }}>AI Recruitment Report</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>Candidate Information</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <InfoRow label="Name" value={selectedApplicant.candidate.name} />
                      <InfoRow label="Email" value={selectedApplicant.candidate.email} />
                      <InfoRow label="Applied Role" value={selectedApplicant.candidate.jobTitle || 'N/A'} />
                      <InfoRow label="Applied Date" value={new Date(selectedApplicant.appliedAt).toLocaleDateString()} />
                    </div>
                  </div>

                  {selectedApplicant.cvData && (
                    <div className="card" style={{ borderLeft: '4px solid var(--color-info)' }}>
                      <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        📄 CV AI Analysis
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--color-bg)', color: 'var(--color-info)' }}>
                          {selectedApplicant.cvData.technical_match}% Match
                        </span>
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--color-text)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                        {selectedApplicant.cvData.summary}
                      </p>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Education</label>
                          <div style={{ fontSize: '0.9rem' }}>{selectedApplicant.cvData.education}</div>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Experience</label>
                          <div style={{ fontSize: '0.9rem' }}>{selectedApplicant.cvData.experience_years} Years</div>
                        </div>
                      </div>

                      <div>
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Extracted Skills</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {selectedApplicant.cvData.skills.map((skill, i) => (
                            <span key={i} style={{
                              padding: '0.2rem 0.6rem', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                              color: 'var(--color-info)', fontSize: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.2)'
                            }}>{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="card">
                    <h3 style={{ marginBottom: '1.5rem' }}>AI Evaluation Scores</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      <ScoreBar label="Behavioral Score" score={selectedApplicant.evaluation?.scores?.behavior || 0} max={10} color="#10b981" />
                      <ScoreBar label="Attitude Score" score={selectedApplicant.evaluation?.scores?.attitude || 0} max={10} color="#fca311" />
                      <ScoreBar label="Personality Fit" score={selectedApplicant.evaluation?.scores?.personality || 0} max={10} color="#3b82f6" />
                      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Overall Rating</div>
                          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                            {selectedApplicant.evaluation?.total_score || 0} / 100
                          </span>
                        </div>
                        {getStatusBadge(selectedApplicant.evaluation?.recommendation || 'Not Fit')}
                      </div>
                    </div>
                  </div>

                  {selectedApplicant.evaluation?.disc && (
                    <div className="card">
                      <h3 style={{ marginBottom: '1.5rem' }}>DISC Profile</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <ScoreBar label="Dominance (D)" score={selectedApplicant.evaluation.disc.d || 0} max={100} color="#ef4444" suffix="%" />
                        <ScoreBar label="Influence (I)" score={selectedApplicant.evaluation.disc.i || 0} max={100} color="#fca311" suffix="%" />
                        <ScoreBar label="Steadiness (S)" score={selectedApplicant.evaluation.disc.s || 0} max={100} color="#10b981" suffix="%" />
                        <ScoreBar label="Conscientiousness (C)" score={selectedApplicant.evaluation.disc.c || 0} max={100} color="#3b82f6" suffix="%" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>AI Insights & Strengths</h3>
                {selectedApplicant.evaluation?.strengths?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ color: '#10b981', marginBottom: '0.75rem' }}>✅ Strengths</h4>
                    <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                      {selectedApplicant.evaluation.strengths.map((s, i) => (
                        <li key={i} style={{ marginBottom: '0.4rem' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {selectedApplicant.answers?.length > 0 && (
                <div className="card" style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1.5rem' }}>Interview Answers</h3>
                  {selectedApplicant.answers.map((a, i) => (
                    <div key={i} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: i < selectedApplicant.answers.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                      <p style={{ fontWeight: '600', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>Q{i + 1}: {a.question}</p>
                      <p style={{ color: 'var(--color-text)', lineHeight: '1.6', margin: 0 }}>{a.answer}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Server Status Indicator */}
      <div style={{
        position: 'fixed', bottom: '20px', right: '20px', padding: '8px 12px',
        backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '20px', fontSize: '0.7rem',
        display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000,
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: serverStatus === 'online' ? '#10b981' : (serverStatus === 'offline' ? '#ef4444' : '#fca311')
        }}></div>
        <span style={{ color: '#fff' }}>Server: {serverStatus.toUpperCase()}</span>
      </div>
    </div>
  );
}

// Helper components
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
    <span className="text-muted">{label}</span>
    <span style={{ fontWeight: '500' }}>{value}</span>
  </div>
);

const ScoreBar = ({ label, score, max, color, suffix = '' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
      <span style={{ fontSize: '0.9rem' }}>{label}</span>
      <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{score}{suffix} / {max}{suffix}</span>
    </div>
    <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
      <div style={{ width: `${(score / max) * 100}%`, height: '100%', backgroundColor: color, borderRadius: '3px', transition: 'width 0.5s ease' }}></div>
    </div>
  </div>
);

const thStyle = { textAlign: 'left', padding: '0.9rem 1rem', fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const tdStyle = { padding: '0.9rem 1rem', fontSize: '0.9rem' };

export default AdminDashboard;
