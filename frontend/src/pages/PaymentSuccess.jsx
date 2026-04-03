import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Fingerprint } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [scanId, setScanId] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    pollPaymentStatus(sessionId);
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, currentAttempt = 0) => {
    const maxAttempts = 10;
    const pollInterval = 2000;

    if (currentAttempt >= maxAttempts) {
      setStatus('error');
      toast.error('Payment verification timed out. Please contact support.');
      return;
    }

    setAttempts(currentAttempt + 1);

    try {
      const response = await fetch(`${API}/payments/status/${sessionId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data = await response.json();

      if (data.status === 'paid') {
        setStatus('success');
        setScanId(data.scan_id);
        toast.success('Payment successful! Your full report is ready.');
        return;
      } else if (data.status === 'expired' || data.status === 'failed') {
        setStatus('error');
        toast.error('Payment was not completed. Please try again.');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sessionId, currentAttempt + 1), pollInterval);
    } catch (error) {
      console.error('Payment status check error:', error);
      
      if (currentAttempt < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sessionId, currentAttempt + 1), pollInterval);
      } else {
        setStatus('error');
      }
    }
  };

  const handleViewReport = () => {
    if (scanId) {
      navigate(`/report/${scanId}`);
    }
  };

  const handleRetry = () => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      setStatus('checking');
      setAttempts(0);
      pollPaymentStatus(sessionId);
    }
  };

  return (
    <div className="min-h-screen cyber-grid-bg flex items-center justify-center px-6">
      <div className="glass-card p-8 max-w-md w-full text-center animate-fade-in-up">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Fingerprint className="w-8 h-8 text-cyan-400" />
          <span className="text-xl font-bold text-white font-['Outfit']">
            GetMyDigitalFootprint
          </span>
        </div>

        {status === 'checking' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">
              Verifying Payment
            </h1>
            <p className="text-slate-400 mb-4">
              Please wait while we confirm your payment...
            </p>
            <div className="text-sm text-slate-500">
              Attempt {attempts} of 10
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">
              Payment Successful!
            </h1>
            <p className="text-slate-400 mb-6">
              Your full digital footprint report is now unlocked.
            </p>
            <Button 
              onClick={handleViewReport}
              className="btn-premium w-full"
              data-testid="view-report-button"
            >
              View Full Report
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 font-['Outfit']">
              Payment Issue
            </h1>
            <p className="text-slate-400 mb-6">
              We couldn't verify your payment. This could be temporary.
            </p>
            <div className="space-y-3">
              <Button 
                onClick={handleRetry}
                className="btn-secondary w-full"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => navigate('/')}
                variant="ghost"
                className="w-full text-slate-400 hover:text-white"
              >
                Return Home
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
