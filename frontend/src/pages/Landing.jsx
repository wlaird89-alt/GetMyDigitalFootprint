import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Shield, Lock, Eye, AlertTriangle, ChevronDown, User, LogOut } from 'lucide-react';
import { FaInstagram, FaTwitter, FaTiktok, FaGithub, FaLinkedin, FaYoutube } from 'react-icons/fa';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { toast } from 'sonner';
import { AuthContext } from '../App';
import ScanningAnimation from '../components/ScanningAnimation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Landing() {
  const [username, setUsername] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [isScanning, setIsScanning] = useState(false);
  const navigate = useNavigate();
  const { user, login, logout, loading } = useContext(AuthContext);

  const handleScan = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username to scan');
      return;
    }

    if (username.length < 2 || username.length > 50) {
      toast.error('Username must be 2-50 characters');
      return;
    }

    setIsScanning(true);

    try {
      const response = await fetch(`${API}/scan/username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          platform_filter: platformFilter
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Scan failed');
      }

      const data = await response.json();
      
      // Short delay to show scanning animation
      setTimeout(() => {
        setIsScanning(false);
        navigate(`/results/${data.scan_id}`);
      }, 2500);

    } catch (error) {
      setIsScanning(false);
      toast.error(error.message || 'Failed to scan username');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleScan();
    }
  };

  if (isScanning) {
    return <ScanningAnimation username={username} />;
  }

  return (
    <div className="min-h-screen cyber-grid-bg relative overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">
              Instagoogleface<span className="text-cyan-400">.com</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {loading ? (
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
                    <span className="hidden md:inline">{user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="text-slate-300 hover:text-white cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
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
                data-testid="login-button"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-24">
        <div className="text-center max-w-4xl mx-auto mb-12 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 font-['Outfit']">
            <span className="text-white">Discover Your</span>
            <br />
            <span className="text-cyan-400">Digital Footprint</span>
          </h1>
          <p className="text-base lg:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enter any username to uncover their presence across social media platforms, 
            analyze exposure risks, and get actionable privacy recommendations.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full max-w-2xl mx-auto animate-fade-in-up stagger-2" style={{ opacity: 0 }}>
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="tracer-input flex items-center px-4 py-3">
                  <Search className="w-5 h-5 text-slate-500 mr-3" />
                  <Input
                    type="text"
                    placeholder="Enter username..."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-0 bg-transparent text-white placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 font-mono"
                    data-testid="username-input"
                  />
                </div>
              </div>

              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger 
                  className="w-full md:w-44 bg-slate-800/50 border-slate-700 text-slate-300"
                  data-testid="platform-filter"
                >
                  <SelectValue placeholder="All Platforms" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all" className="text-slate-300">All Platforms</SelectItem>
                  <SelectItem value="instagram" className="text-slate-300">Instagram</SelectItem>
                  <SelectItem value="twitter" className="text-slate-300">Twitter/X</SelectItem>
                  <SelectItem value="tiktok" className="text-slate-300">TikTok</SelectItem>
                  <SelectItem value="youtube" className="text-slate-300">YouTube</SelectItem>
                  <SelectItem value="linkedin" className="text-slate-300">LinkedIn</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleScan}
                className="btn-primary whitespace-nowrap"
                data-testid="scan-button"
              >
                <Search className="w-4 h-4 mr-2" />
                Scan Username
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16 animate-fade-in-up stagger-3" style={{ opacity: 0 }}>
          <FeatureCard 
            icon={<Eye className="w-6 h-6 text-cyan-400" />}
            title="Platform Discovery"
            description="Scan 12+ major platforms to find where a username is registered"
          />
          <FeatureCard 
            icon={<AlertTriangle className="w-6 h-6 text-amber-400" />}
            title="Risk Assessment"
            description="Get a comprehensive risk score based on digital exposure"
          />
          <FeatureCard 
            icon={<Lock className="w-6 h-6 text-emerald-400" />}
            title="Privacy Insights"
            description="Receive actionable recommendations to protect your identity"
          />
        </div>

        {/* Supported Platforms */}
        <div className="mt-16 text-center animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
          <p className="text-slate-500 text-sm mb-4">Supported Platforms</p>
          <div className="flex flex-wrap justify-center gap-4">
            <PlatformIcon Icon={FaInstagram} name="Instagram" color="text-pink-400" />
            <PlatformIcon Icon={FaTwitter} name="Twitter" color="text-sky-400" />
            <PlatformIcon Icon={FaTiktok} name="TikTok" color="text-white" />
            <PlatformIcon Icon={FaGithub} name="GitHub" color="text-slate-300" />
            <PlatformIcon Icon={FaLinkedin} name="LinkedIn" color="text-blue-400" />
            <PlatformIcon Icon={FaYoutube} name="YouTube" color="text-red-400" />
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 max-w-3xl mx-auto text-center animate-fade-in-up stagger-5" style={{ opacity: 0 }}>
          <p className="disclaimer-text">
            This tool analyzes publicly available information and provides general insights for informational purposes only. 
            It does not provide legal or professional advice. Nor is this site affiliated with or endorsed by any social media company 
            or search engine, the name provided is for entertainment purposes only.
          </p>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="glass-card glass-card-hover p-6">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2 font-['Outfit']">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}

function PlatformIcon({ Icon, name, color }) {
  return (
    <div className="platform-badge flex items-center gap-2" title={name}>
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-slate-400">{name}</span>
    </div>
  );
}
