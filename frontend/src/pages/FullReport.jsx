import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, ExternalLink, CheckCircle, XCircle, HelpCircle, Download, User, LogOut, ChevronDown, AlertTriangle, ShieldCheck, Eye, UserX } from 'lucide-react';
import { FaInstagram, FaTwitter, FaTiktok, FaGithub, FaLinkedin, FaYoutube, FaReddit, FaPinterest, FaTwitch, FaSnapchat, FaMedium, FaTumblr } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { AuthContext } from '../App';
import CircularRiskScore from '../components/CircularRiskScore';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const platformIcons = {
  'Instagram': FaInstagram,
  'Twitter/X': FaTwitter,
  'TikTok': FaTiktok,
  'GitHub': FaGithub,
  'LinkedIn': FaLinkedin,
  'YouTube': FaYoutube,
  'Reddit': FaReddit,
  'Pinterest': FaPinterest,
  'Twitch': FaTwitch,
  'Snapchat': FaSnapchat,
  'Medium': FaMedium,
  'Tumblr': FaTumblr,
};

const platformColors = {
  'Instagram': 'text-pink-400',
  'Twitter/X': 'text-sky-400',
  'TikTok': 'text-white',
  'GitHub': 'text-slate-300',
  'LinkedIn': 'text-blue-400',
  'YouTube': 'text-red-400',
  'Reddit': 'text-orange-400',
  'Pinterest': 'text-red-500',
  'Twitch': 'text-purple-400',
  'Snapchat': 'text-yellow-400',
  'Medium': 'text-slate-300',
  'Tumblr': 'text-blue-300',
  'Web': 'text-slate-400',
};

export default function FullReport() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { user, login, logout, loading: authLoading } = useContext(AuthContext);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFullReport();
  }, [scanId]);

  const fetchFullReport = async () => {
    try {
      const response = await fetch(`${API}/scan/${scanId}/full`, {
        credentials: 'include'
      });

      if (response.status === 402) {
        toast.error('Payment required to view full report');
        navigate(`/results/${scanId}`);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to load report');
      }

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      toast.error(error.message || 'Failed to load report');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading full report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return null;
  }

  const platformsFound = reportData.platforms?.filter(p => p.status === 'found').length || 0;

  return (
    <div className="min-h-screen cyber-grid-bg relative">
      {/* Header */}
      <header className="relative z-20 px-6 py-4 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Scan
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-bold text-white font-['Outfit']">
                Instagoogleface<span className="text-cyan-400">.com</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">Premium Report</span>
            </div>
            
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    My Scans
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={logout}
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={login}
                variant="outline" 
                className="border-slate-700 text-slate-300 hover:text-white hover:border-cyan-500/50"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-6 py-8 max-w-7xl mx-auto">
        {/* Report Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center gap-2 text-emerald-400 text-sm mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Full Digital Footprint Report</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-mono" data-testid="report-username">
            @{reportData.username}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Generated on {new Date(reportData.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Risk Score */}
          <div className="md:col-span-4 glass-card p-6 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-white mb-4 font-['Outfit']">Risk Assessment</h2>
            <div className="flex flex-col items-center">
              <CircularRiskScore score={reportData.risk_score} level={reportData.risk_level} size="large" />
              <p className={`mt-4 text-lg font-semibold capitalize ${
                reportData.risk_level === 'low' ? 'text-emerald-400' :
                reportData.risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {reportData.risk_level} Risk
              </p>
            </div>
            
            {reportData.risk_factors && (
              <div className="mt-6 space-y-3">
                <RiskFactorItem 
                  icon={<Eye className="w-4 h-4" />}
                  label="Platforms Found"
                  value={reportData.risk_factors.platforms_found}
                  severity={reportData.risk_factors.platforms_found > 5 ? 'high' : 'low'}
                />
                <RiskFactorItem 
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="Total Mentions"
                  value={reportData.risk_factors.total_mentions}
                  severity={reportData.risk_factors.total_mentions > 10 ? 'high' : 'low'}
                />
                <RiskFactorItem 
                  icon={<UserX className="w-4 h-4" />}
                  label="Personal Info"
                  value={reportData.risk_factors.has_personal_identifiers ? 'Exposed' : 'Protected'}
                  severity={reportData.risk_factors.has_personal_identifiers ? 'high' : 'low'}
                />
              </div>
            )}
          </div>

          {/* Recommendations */}
          <div className="md:col-span-8 glass-card p-6 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-white mb-4 font-['Outfit']">Privacy Recommendations</h2>
            <div className="space-y-3">
              {reportData.recommendations?.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/30">
                  <div className="mt-0.5">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </div>
                  <p className="text-slate-300">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* All Platforms */}
          <div className="md:col-span-6 glass-card p-6 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white font-['Outfit']">All Platforms</h2>
              <span className="text-sm text-slate-400">
                <span className="text-cyan-400 font-mono">{platformsFound}</span> found
              </span>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {reportData.platforms?.map((platform, idx) => (
                <PlatformRow key={idx} platform={platform} />
              ))}
            </div>
          </div>

          {/* All Search Results */}
          <div className="md:col-span-6 glass-card p-6 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white font-['Outfit']">All Search Results</h2>
              <span className="text-sm text-slate-400">
                <span className="text-cyan-400 font-mono">{reportData.search_results?.length || 0}</span> results
              </span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {reportData.search_results?.map((result, idx) => (
                <SearchResultRow key={idx} result={result} />
              ))}
              
              {(!reportData.search_results || reportData.search_results.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No search results found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <p className="disclaimer-text max-w-3xl mx-auto">
            This tool analyzes publicly available information and provides general insights for informational purposes only. 
            It does not provide legal or professional advice. Nor is this site affiliated with or endorsed by any social media company 
            or search engine, the name provided is for entertainment purposes only.
          </p>
        </div>
      </main>
    </div>
  );
}

function RiskFactorItem({ icon, label, value, severity }) {
  const severityColor = severity === 'high' ? 'text-amber-400' : 'text-emerald-400';
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/30">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`font-mono ${severityColor}`}>{value}</span>
    </div>
  );
}

function PlatformRow({ platform }) {
  const Icon = platformIcons[platform.name] || HelpCircle;
  const color = platformColors[platform.name] || 'text-slate-400';
  
  const statusIcon = platform.status === 'found' 
    ? <CheckCircle className="w-4 h-4 text-emerald-400" />
    : platform.status === 'not_found'
    ? <XCircle className="w-4 h-4 text-slate-500" />
    : <HelpCircle className="w-4 h-4 text-amber-400" />;

  const statusText = platform.status === 'found' 
    ? 'Found' 
    : platform.status === 'not_found' 
    ? 'Not Found' 
    : 'Unknown';

  return (
    <a 
      href={platform.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-800/50 transition-colors ${
        platform.status === 'found' ? 'bg-emerald-500/5' : 'bg-slate-800/20'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-slate-300">{platform.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs ${platform.status === 'found' ? 'text-emerald-400' : 'text-slate-500'}`}>
          {statusText}
        </span>
        {statusIcon}
        <ExternalLink className="w-4 h-4 text-slate-500" />
      </div>
    </a>
  );
}

function SearchResultRow({ result }) {
  const Icon = platformIcons[result.platform] || HelpCircle;
  const color = platformColors[result.platform] || 'text-slate-400';

  return (
    <a 
      href={result.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-cyan-400 font-mono">{result.platform}</span>
      </div>
      <h4 className="text-white text-sm font-medium truncate">{result.title}</h4>
      <p className="text-slate-400 text-xs line-clamp-2 mt-1">{result.snippet}</p>
    </a>
  );
}
