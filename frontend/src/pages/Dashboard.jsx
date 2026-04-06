import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Lock, ArrowRight, LogOut, Clock, ChevronDown, User, Fingerprint } from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { AuthContext } from '../App';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useContext(AuthContext);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      return;
    }
    
    if (user) {
      fetchScanHistory();
    }
  }, [user, authLoading, navigate]);

  const fetchScanHistory = async () => {
    try {
      const response = await fetch(`${API}/scans/history`, {
        credentials: 'include'
      });

      if (response.status === 401) {
        navigate('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch scan history');
      }

      const data = await response.json();
      setScans(data.scans || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load scan history');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen cyber-grid-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen cyber-grid-bg relative">
      {/* Header */}
      <header className="relative z-20 px-6 py-4 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => navigate('/')}
          >
            <Fingerprint className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
              GetMyDigitalFootprint
            </span>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                  <span className="hidden md:inline">{user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem 
                  onClick={logout}
                  className="text-slate-300 hover:text-white cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-bold text-white font-['Outfit']">My Scans</h1>
            <p className="text-slate-400 mt-1">View your scan history and reports</p>
          </div>
          <Button 
            onClick={() => navigate('/')}
            className="btn-primary"
            data-testid="new-scan-button"
          >
            <Search className="w-4 h-4 mr-2" />
            New Scan
          </Button>
        </div>

        {scans.length === 0 ? (
          <div className="glass-card p-12 text-center animate-fade-in-up">
            <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No scans yet</h2>
            <p className="text-slate-400 mb-6">Start scanning usernames to see your history here</p>
            <Button onClick={() => navigate('/')} className="btn-primary">
              Start Your First Scan
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            {scans.map((scan, idx) => (
              <ScanCard key={scan.scan_id} scan={scan} index={idx} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ScanCard({ scan, index }) {
  const navigate = useNavigate();
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'text-emerald-400 bg-emerald-400/10';
      case 'medium': return 'text-amber-400 bg-amber-400/10';
      case 'high': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const handleClick = () => {
    if (scan.is_paid) {
      navigate(`/report/${scan.scan_id}`);
    } else {
      navigate(`/results/${scan.scan_id}`);
    }
  };

  const formattedDate = scan.created_at 
    ? new Date(scan.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Unknown date';

  return (
    <div 
      onClick={handleClick}
      className="glass-card glass-card-hover p-4 cursor-pointer animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
      data-testid={`scan-card-${scan.scan_id}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
            <span className="text-xl font-bold text-cyan-400 font-mono">
              {scan.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white font-mono">@{scan.username}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(scan.risk_level)}`}>
            {scan.risk_score}/100
          </div>
          
          {scan.is_paid ? (
            <div className="flex items-center gap-1 text-emerald-400 text-sm">
              <Eye className="w-4 h-4" />
              <span className="hidden md:inline">Full Report</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-sm">
              <Lock className="w-4 h-4" />
              <span className="hidden md:inline">Preview</span>
            </div>
          )}
          
          <ArrowRight className="w-5 h-5 text-slate-500" />
        </div>
      </div>
    </div>
  );
}
