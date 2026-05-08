import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState(prev => ({
      errorCount: prev.errorCount + 1
    }));
    
    // Log to error tracking service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production') {
      // ErrorTrackingService.logError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.errorCount < 3) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
            
            <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#ef4444' }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{ 
              color: 'var(--color-text-muted)', 
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>

            <details style={{ 
              marginBottom: '1.5rem', 
              textAlign: 'left',
              padding: '1rem',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '8px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                Error Details
              </summary>
              <pre style={{
                overflowX: 'auto',
                fontSize: '0.8rem',
                margin: '0.5rem 0 0 0'
              }}>
                {this.state.error?.toString()}
              </pre>
            </details>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                onClick={this.resetError}
                className="btn btn-primary"
                style={{ padding: '0.7rem' }}
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="btn btn-outline"
                style={{ padding: '0.7rem' }}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If too many errors, show recovery page
    if (this.state.errorCount >= 3) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚨</div>
            
            <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#ef4444' }}>
              System Recovery
            </h1>
            
            <p style={{ 
              color: 'var(--color-text-muted)', 
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              The application encountered multiple errors. Please refresh the page or contact support.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
                style={{ padding: '0.7rem' }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = 'mailto:support@talentflow.io'}
                className="btn btn-outline"
                style={{ padding: '0.7rem' }}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
