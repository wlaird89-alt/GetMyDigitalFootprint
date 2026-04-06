import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Lock, AlertTriangle, CheckCircle, XCircle, HelpCircle, User, LogOut, ChevronDown, Fingerprint } from 'lucide-react';
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
import PaywallOverlay from '../components/PaywallOverlay';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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

export default function Results() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { user, login, logout, loading: authLoading } = useContext(AuthContext);
  const [scanData, setScanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    fetchScanData();
  }, [scanId]);

  const fetchScanData = async () => {
    try {
      const response = await fetch(`${API}/scan/${scanId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Scan not found');
      }

      const data = await response.json();
      setScanData(data);
      setShowPaywall(!data.is_paid);
    } catch (error) {
      toast.error(error.message || 'Failed to load scan results');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    setIsProcessingPayment(true);
    try {
      const response = await fetch(`${API}/payments/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scan_id: scanId,
          origin_url: window.location.origin
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Payment failed. Please try again.');
      }

      const data = await response.json();
      window.location.href = data.checkout_url;
    } catch (error) {
      setIsProcessingPayment(false);
      toast.error(error.message || 'Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen cyber-grid-bg flex items-center justify-center">
        <div className="glass-card p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return null;
  }

  const platformsFound = scanData.platforms?.filter(p => p.status === 'found').length || 0;
  const totalPlatforms = scanData.platforms?.length || 0;

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
              data-testid="back-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Scan
            </Button>
            <div className="hidden md:flex items-center gap-2">
              <Fingerprint className="w-6 h-6 text-cyan-400" />
              <span className="text-lg font-bold text-white font-['Outfit']">
                GetMyDigitalFootprint
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
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
        {/* Username Header */}
        <div className="mb-8 animate-fade-in-up">
          <p className="text-slate-500 text-sm mb-1">Your Digital Footprint Report</p>
          <h1 className="text-3xl font-bold text-white font-mono" data-testid="scanned-username">
            @{scanData.username}
          </h1>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Risk Score Card */}
          <div className="md:col-span-4 glass-card p-6 animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
            <h2 className="text-lg font-semibold text-white mb-4 font-['Outfit']">Digital Footprint Risk Score</h2>
            <div className="flex flex-col items-center">
              <CircularRiskScore score={scanData.risk_score} level={scanData.risk_level} />
              <p className={`mt-4 text-lg font-semibold capitalize ${
                scanData.risk_level === 'low' ? 'text-emerald-400' :
                scanData.risk_level === 'medium' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {scanData.risk_level} Risk
              </p>
            </div>
            
            {scanData.risk_factors && (
              <div className="mt-6 space-y-2 text-sm">
                <RiskFactor label="Platforms Found" value={scanData.risk_factors.platforms_found} />
                <RiskFactor label="Total Mentions" value={scanData.risk_factors.total_mentions} />
                <RiskFactor label="Personal Info Exposed" value={scanData.risk_factors.has_personal_identifiers ? 'Yes' : 'No'} warning={scanData.risk_factors.has_personal_identifiers} />
                <RiskFactor label="Contact Patterns" value={scanData.risk_factors.has_contact_patterns ? 'Found' : 'None'} warning={scanData.risk_factors.has_contact_patterns} />
              </div>
            )}
          </div>

          {/* Platform Overview */}
          <div className="md:col-span-8 glass-card p-6 animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white font-['Outfit']">Platform Discovery</h2>
              <span className="text-sm text-slate-400">
                Found on <span className="text-cyan-400 font-mono">{platformsFound}</span> of {totalPlatforms} platforms
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {scanData.platforms?.map((platform, idx) => (
                <PlatformBadge key={idx} platform={platform} />
              ))}
            </div>
          </div>

          {/* Search Results Section */}
          <div className="md:col-span-12 relative animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white font-['Outfit']">Search Results</h2>
                {!scanData.serpapi_available && (
                  <span className="text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                    Live search results unavailable — API key required
                  </span>
                )}
                {scanData.serpapi_available && (
                  <span className="text-sm text-slate-400">
                    <span className="text-cyan-400 font-mono">{scanData.total_search_results || 0}</span> results found
                  </span>
                )}
              </div>

              {/* Preview Results */}
              <div className="space-y-3 mb-4">
                {scanData.search_results_preview?.map((result, idx) => (
                  <SearchResultItem key={idx} result={result} />
                ))}
                
                {(!scanData.search_results_preview || scanData.search_results_preview.length === 0) && (
                  <div className="text-center py-8 text-slate-500">
                    {scanData.serpapi_available 
                      ? 'No search results found for this username'
                      : 'Configure SerpAPI key to enable live search results'
                    }
                  </div>
                )}
              </div>

              {/* Blurred Premium Results */}
              {showPaywall && scanData.total_search_results > 3 && (
                <div className="relative">
                  <div className="paywall-blur space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-800/30 rounded-lg p-4">
                        <div className="h-4 bg-slate-700/50 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-700/30 rounded w-full mb-1"></div>
                        <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Paywall Overlay */}
            {showPaywall && (
              <PaywallOverlay 
                onUnlock={handleUnlock}
                totalResults={scanData.total_search_results}
                platformsFound={platformsFound}
                isLoading={isProcessingPayment}
              />
            )}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
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

function RiskFactor({ label, value, warning }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">{label}</span>
      <span className={warning ? 'text-amber-400' : 'text-slate-300'}>{value}</span>
    </div>
  );
}

function PlatformBadge({ platform }) {
  const Icon = platformIcons[platform.name] || HelpCircle;
  const color = platformColors[platform.name] || 'text-slate-400';
  
  const statusIcon = platform.status === 'found' 
    ? <CheckCircle className="w-3 h-3 text-emerald-400" />
    : platform.status === 'not_found'
    ? <XCircle className="w-3 h-3 text-slate-500" />
    : <HelpCircle className="w-3 h-3 text-amber-400" />;

  return (
    <a 
      href={platform.url} 
      target="_blank" 
      rel="noopener noreferrer"
      className={`platform-badge flex items-center gap-2 ${
        platform.status === 'found' ? 'border-emerald-500/30 bg-emerald-500/10' : ''
      }`}
      data-testid={`platform-badge-${platform.name.toLowerCase().replace(/\//g, '-')}`}
    >
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-slate-300 flex-1 truncate">{platform.name}</span>
      {statusIcon}
    </a>
  );
}

function SearchResultItem({ result }) {
  const Icon = platformIcons[result.platform] || HelpCircle;
  const color = platformColors[result.platform] || 'text-slate-400';

  return (
    <div className="bg-slate-800/30 rounded-lg p-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`mt-1 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-cyan-400 font-mono">{result.platform}</span>
          </div>
          <h3 className="text-white font-medium truncate mb-1">{result.title}</h3>
          <p className="text-slate-400 text-sm line-clamp-2">{result.snippet}</p>
        </div>
        <a 
          href={result.link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
