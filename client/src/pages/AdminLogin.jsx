import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

function AdminLogin() {
  const navigate = useNavigate();
  const adminLogin = useAdminStore(state => state.adminLogin);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = adminLogin(password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  return (
    <div className="container fade-in" style={{ marginTop: '15vh' }}>
      <div className="card" style={{ maxWidth: '420px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: '1.5rem'
          }}>🔒</div>
          <h2 style={{ marginBottom: '0.5rem' }}>Admin Panel</h2>
          <p className="text-muted">TalentFlow AI - HR Dashboard</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '1rem' }}>{error}</p>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.9rem', marginTop: '0.5rem' }}>
            Sign In
          </button>
        </form>

        <div style={{ position: 'relative', margin: '2rem 0', textAlign: 'center' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'var(--color-bg-card)', padding: '0 10px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>OR</span>
        </div>

        <button 
          className="btn btn-outline" 
          onClick={() => { adminLogin('concreto2025'); navigate('/admin'); }}
          style={{ width: '100%', padding: '0.9rem', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
        >
          🚀 Try Demo Mode
        </button>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button className="btn btn-outline" onClick={() => navigate('/')} style={{ fontSize: '0.85rem', padding: '0.5rem 1.2rem', border: 'none' }}>
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
