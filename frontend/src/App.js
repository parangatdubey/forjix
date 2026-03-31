import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Lock, Eye, EyeOff, ArrowRight, 
  Briefcase, Hash, UserCircle,
  MoreVertical, BookOpen, Code, FileText, MessageSquare, 
  Award, Globe, HelpCircle, LogOut, Calculator, 
  Database, Network, Binary, Cpu, Layers, Terminal, Sigma, 
  GitBranch, ChevronLeft, Divide, ShieldCheck, AlertCircle,
  Github, Chrome, Facebook, Sparkles, Zap, Command
} from 'lucide-react';

// Firebase Auth (Authentication Firebase se hogi, Data store MongoDB mein hoga)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider
} from 'firebase/auth';

/**
 * --- CONFIGURATION ---
 */
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || ""
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";

const hasFirebaseConfig = Object.values(firebaseConfig).every(Boolean);
const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const SESSION_STORAGE_KEY = 'forjix-session';

const readStoredSession = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

// --- Data Structures ---
const placementFolders = [
  { id: 1, title: 'Aptitude Master', desc: 'Quantitative & Reasoning Prep', icon: Hash, color: 'from-blue-500/20' },
  { id: 2, title: 'Coding Hub', desc: 'DSA & Competitive Coding', icon: Code, color: 'from-blue-500/20' },
  { id: 3, title: 'Technical Core', desc: 'OS, DBMS, Networks Core', icon: Cpu, color: 'from-indigo-500/20' },
  { id: 4, title: 'Resume Builder', desc: 'ATS Friendly Templates', icon: FileText, color: 'from-violet-500/20' },
  { id: 5, title: 'Mock Interviews', desc: 'AI-Powered Practice', icon: MessageSquare, color: 'from-sky-500/20' },
  { id: 6, title: 'Company Tracks', desc: 'TCS, Infosys, Amazon Prep', icon: Briefcase, color: 'from-blue-600/20' },
  { id: 7, title: 'Soft Skills', desc: 'HR & Communication Skills', icon: Award, color: 'from-purple-500/20' },
  { id: 8, title: 'Past Papers', desc: 'Previous Year Question Bank', icon: BookOpen, color: 'from-cyan-600/20' },
  { id: 9, title: 'GATE Prep Hub', desc: 'Official GATE CS/IT Resources', icon: Globe, color: 'from-indigo-600/20' },
];

const gateSubjects = [
  { id: 'g1', title: 'General Aptitude', icon: Calculator, color: 'from-blue-400/10' },
  { id: 'g2', title: 'Engineering Mathematics', icon: Divide, color: 'from-indigo-400/10' },
  { id: 'g3', title: 'C Programming', icon: Code, color: 'from-cyan-400/10' },
  { id: 'g4', title: 'Data Structures', icon: GitBranch, color: 'from-violet-400/10' },
  { id: 'g5', title: 'Algorithms', icon: Sigma, color: 'from-sky-400/10' },
  { id: 'g6', title: 'Operating System', icon: Cpu, color: 'from-blue-500/10' },
  { id: 'g7', title: 'DBMS', icon: Database, color: 'from-indigo-500/10' },
  { id: 'g8', title: 'Computer Networks', icon: Network, color: 'from-cyan-500/10' },
  { id: 'g9', title: 'Digital Logic', icon: Binary, color: 'from-violet-500/10' },
  { id: 'g10', title: 'COA', icon: Layers, color: 'from-sky-500/10' },
  { id: 'g11', title: 'TOC', icon: FileText, color: 'from-blue-600/10' },
  { id: 'g12', title: 'Compiler Design', icon: Terminal, color: 'from-indigo-600/10' },
];

const emptyProfileData = {
  fullName: '',
  fatherName: '',
  rollNo: '',
  regNo: '',
  mobile: '',
  collegeEmail: '',
  dob: '',
  address: ''
};

export default function App() {
  const storedSession = readStoredSession();
  const [view, setView] = useState('auth'); 
  const [authMode, setAuthMode] = useState('login');
  const [userRole, setUserRole] = useState('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState(null); 
  const [selectedSubCategory, setSelectedSubCategory] = useState(null); 
  const [isAdmin, setIsAdmin] = useState(Boolean(storedSession?.user?.isAdmin));
  const [materials, setMaterials] = useState([]);
  const [authToken, setAuthToken] = useState(storedSession?.token || '');
  const [sessionUser, setSessionUser] = useState(storedSession?.user || null);

  // Form Inputs
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileData, setProfileData] = useState(emptyProfileData);

  const [uploadData, setUploadData] = useState({
    category: 'Placement',
    subCategory: placementFolders[0].title,
    title: '',
    contentUrl: '',
    description: ''
  });

  const menuRef = useRef(null);

  const persistSession = (token, user) => {
    const session = { token, user };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    setAuthToken(token);
    setSessionUser(user);
    setIsAdmin(Boolean(user?.isAdmin));
  };

  const clearSession = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setAuthToken('');
    setSessionUser(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    if (uploadData.category === 'Placement') {
      setUploadData(prev => ({ ...prev, subCategory: placementFolders[0].title }));
    } else {
      setUploadData(prev => ({ ...prev, subCategory: gateSubjects[0].title }));
    }
  }, [uploadData.category]);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, () => {});
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  // MongoDB Fetch Logic
  useEffect(() => {
    if (!authToken) return;
    const fetchMaterials = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/materials`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (response.ok) {
          const data = await response.json();
          setMaterials(data);
        }
      } catch (err) {
        console.error("Backend connection offline.");
      }
    };
    fetchMaterials();
  }, [authToken]);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuRef]);

  useEffect(() => {
    if (view !== 'profileSetup') return;

    setProfileData(prev => ({
      ...emptyProfileData,
      fullName: prev.fullName || '',
      collegeEmail: prev.collegeEmail || ''
    }));
  }, [view]);

  const handleSocialLogin = async (providerName) => {
    if (!auth || !hasFirebaseConfig) {
      setError('Social login is not configured yet. Add Firebase env values before deploying.');
      return;
    }

    setIsLoading(true);
    setError(null);
    let provider;
    if (providerName === 'google') provider = new GoogleAuthProvider();
    else if (providerName === 'facebook') provider = new FacebookAuthProvider();
    else if (providerName === 'github') provider = new GithubAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userKey = (user.email || user.uid).split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      const res = await fetch(`${BACKEND_URL}/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userKey, uid: user.uid })
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Social login failed');
      }

      const data = await res.json();
      persistSession(data.token, data.user);
      setUsername(data.user.username);

      const pRes = await fetch(`${BACKEND_URL}/profiles/${userKey}`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      if (pRes.ok) {
        const pData = await pRes.json();
        setProfileData(pData);
        setView('dashboard');
      } else {
        setProfileData({
          ...emptyProfileData,
          fullName: user.displayName || '',
          collegeEmail: user.email || ''
        });
        setView('profileSetup');
      }
    } catch (err) {
      setError(err.message || "Matrix Link Interrupted. Verify Backend Status.");
    } finally { setIsLoading(false); }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'signup' && userRole === 'admin') {
      setError('Admin accounts cannot be created from the public signup form.');
      return;
    }

    setIsLoading(true);
    const userKey = username.trim().toLowerCase();
    
    try {
      const endpoint = authMode === 'signup' ? '/accounts' : '/login';
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userKey, password })
      });
      
      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || "Sequence Error");
      }
      
      const data = await res.json();
      persistSession(data.token, data.user);
      setUsername(data.user.username);
      
      if (authMode === 'signup') {
        setProfileData(emptyProfileData);
        setView('profileSetup');
      } else {
        const pRes = await fetch(`${BACKEND_URL}/profiles/${userKey}`, {
          headers: { Authorization: `Bearer ${data.token}` }
        });
        if (pRes.ok) {
          setProfileData(await pRes.json());
          setView('dashboard');
        } else {
          setView('profileSetup');
        }
      }
    } catch (err) {
      setError(err.message || "Synchronizer Offline.");
    } finally { setIsLoading(false); }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const userKey = (sessionUser?.username || username).toLowerCase();
    try {
      const res = await fetch(`${BACKEND_URL}/profiles/${userKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(profileData)
      });
      if (res.ok) setView('dashboard');
      else throw new Error();
    } catch { setError("Data sync failed."); } finally { setIsLoading(false); }
  };

  const handleAdminUpload = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ ...uploadData, uploadedBy: sessionUser?.username || username })
      });
      if (res.ok) {
        setUploadData({ ...uploadData, title: '', contentUrl: '', description: '' });
        alert("Node synchronized successfully.");
      }
    } catch { alert("Backend push error."); } finally { setIsLoading(false); }
  };

  const logout = () => {
    setMenuOpen(false); setUsername(''); setPassword(''); setView('auth');
    setActiveFolderId(null); setSelectedSubCategory(null);
    setProfileData(emptyProfileData);
    clearSession();
  };

  const getFilteredMaterials = () => materials.filter(m => m.subCategory === selectedSubCategory);

  const profileFields = [
    {label:'Full Name', name:'fullName', type:'text'},
    {label:"Father's Name", name:'fatherName', type:'text'},
    ...(!isAdmin ? [
      {label:'Roll Number', name:'rollNo', type:'text'},
      {label:'System ID', name:'regNo', type:'text'}
    ] : []),
    {label:'Secure Contact', name:'mobile', type:'tel'},
    {label:'Matrix Email', name:'collegeEmail', type:'email'},
    {label:'DOB', name:'dob', type:'date'}
  ];

  return (
    <div className="min-h-screen bg-[#020203] text-zinc-300 font-sans selection:bg-cyan-500/40 relative overflow-x-hidden">
      
      {/* Workstation Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] opacity-70"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[160px] opacity-70"></div>
        <div className="absolute top-[20%] right-[10%] w-[25%] h-[25%] bg-cyan-600/5 rounded-full blur-[120px]"></div>
      </div>

      {/* 1. AUTHENTICATION VIEW */}
      {view === 'auth' && (
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="max-w-5xl w-full bg-[#08080a]/90 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_0_120px_rgba(0,0,0,1)] border border-white/5 overflow-hidden flex flex-col md:flex-row min-h-[750px] animate-in fade-in zoom-in duration-1000">
            
            {/* Workstation Hero Restoration */}
            <div className="hidden md:flex md:w-5/12 bg-[#0a0a0f] p-12 flex-col justify-between relative overflow-hidden border-r border-white/5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/40 via-transparent to-transparent"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-20 group">
                  <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)] group-hover:rotate-[360deg] transition-all duration-700 p-0.5 shadow-2xl">
                     <div className="w-full h-full bg-[#0a0a0f] rounded-[14px] flex items-center justify-center">
                        <Command size={26} className="text-cyan-400" strokeWidth={3} />
                     </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white text-3xl font-black tracking-tighter leading-none uppercase italic">FORJIX</span>
                    <span className="text-cyan-400 text-[8px] font-black uppercase tracking-[0.5em] mt-2 opacity-90 italic">Intelligence</span>
                  </div>
                </div>
                
                <div className="space-y-12">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md shadow-inner">
                     <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Excellence Engineered</span>
                  </div>
                  <h1 className="text-6xl lg:text-[84px] font-black text-white leading-[0.85] uppercase tracking-tighter italic">
                    Shape Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Success.</span>
                  </h1>
                  <p className="text-zinc-500 text-lg leading-relaxed max-w-[280px] font-medium mt-6">Elevate your potential through architected knowledge systems.</p>
                </div>
              </div>
              
              <div className="relative z-10 flex items-center gap-3 text-[9px] text-zinc-600 uppercase tracking-[0.4em] font-black">
                 <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#22d3ee]"></div> SUCCESS FUEL
              </div>
            </div>

            {/* Premium Login Restored */}
            <div className="flex-1 p-8 md:p-16 flex flex-col bg-[#08080a] justify-center relative">
              <div className="mb-10">
                 <div className="grid grid-cols-2 gap-3 max-w-[320px] mb-12 p-1 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                    <button onClick={() => setUserRole('student')} className={`py-3.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${userRole === 'student' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}>Student</button>
                    <button onClick={() => setUserRole('admin')} className={`py-3.5 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest ${userRole === 'admin' ? 'bg-white/10 text-white shadow-lg border border-white/5' : 'text-zinc-600 hover:text-zinc-400'}`}>Admin</button>
                 </div>

                 {userRole === 'admin' && authMode === 'signup' && (
                   <div className="mb-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-300 text-xs font-bold">
                     Admin access is login-only. Public signup creates student accounts only.
                   </div>
                 )}

                 <div className="flex items-center gap-6 mb-8 px-1">
                   <button onClick={() => setAuthMode('login')} className={`text-2xl font-black transition-all ${authMode === 'login' ? 'text-white underline underline-offset-[12px] decoration-cyan-500 decoration-4' : 'text-zinc-700 hover:text-zinc-500'}`}>LOGIN</button>
                   <div className="w-1.5 h-1.5 rounded-full bg-zinc-800"></div>
                   <button onClick={() => setAuthMode('signup')} className={`text-2xl font-black transition-all ${authMode === 'signup' ? 'text-white underline underline-offset-[12px] decoration-cyan-500 decoration-4' : 'text-zinc-700 hover:text-zinc-500'}`}>SIGNUP</button>
                 </div>
              </div>

              {error && <div className="mb-8 p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold animate-shake"><AlertCircle size={18} /> {error}</div>}
              
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                <div className="relative group">
                  <User size={18} className="absolute left-6 top-6 text-zinc-700 group-focus-within:text-cyan-400 group-focus-within:scale-110 transition-all z-10" />
                  <input type="text" required placeholder="Member Identifier" className="w-full pl-16 pr-6 py-6 bg-white/[0.03] border border-white/5 rounded-2xl text-white outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all placeholder:text-zinc-800 text-sm shadow-inner relative" value={username} onChange={e=>setUsername(e.target.value)} />
                </div>
                <div className="relative group">
                  <Lock size={18} className="absolute left-6 top-6 text-zinc-700 group-focus-within:text-cyan-400 group-focus-within:scale-110 transition-all z-10" />
                  <input type={showPassword?"text":"password"} required placeholder="System Key" className="w-full pl-16 pr-14 py-6 bg-white/[0.03] border border-white/5 rounded-2xl text-white outline-none focus:border-cyan-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_30px_rgba(34,211,238,0.1)] transition-all placeholder:text-zinc-800 text-sm shadow-inner relative" value={password} onChange={e=>setPassword(e.target.value)} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-6 text-zinc-700 hover:text-white transition-colors z-10">{showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-6 bg-white text-black font-black rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:scale-[1.01] active:scale-[0.98] transition-all uppercase text-[10px] tracking-[0.3em] mt-6">
                  {isLoading ? "Synchronizing..." : 'Initialize Access'}
                </button>
              </form>

              <div className="mt-12">
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-white/5"></div>
                  <span className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Matrix Link Connect</span>
                  <div className="h-px flex-1 bg-white/5"></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                   <button onClick={() => handleSocialLogin('google')} className="flex items-center justify-center py-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group shadow-inner"><Chrome size={20} className="text-zinc-600 group-hover:text-white transition-colors" /></button>
                   <button onClick={() => handleSocialLogin('facebook')} className="flex items-center justify-center py-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group shadow-inner"><Facebook size={20} className="text-zinc-600 group-hover:text-blue-400 transition-colors" /></button>
                   <button onClick={() => handleSocialLogin('github')} className="flex items-center justify-center py-5 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 hover:border-white/20 transition-all group shadow-inner"><Github size={20} className="text-zinc-600 group-hover:text-white transition-colors" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PROFILE SETUP VIEW */}
      {view === 'profileSetup' && (
        <div className="min-h-screen flex items-center justify-center p-6 relative z-10">
          <div className="max-w-4xl w-full bg-[#08080a] rounded-[3.5rem] shadow-2xl border border-white/5 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
            <div className="bg-gradient-to-r from-blue-900/20 to-transparent p-12 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-8">
                <button onClick={() => setView('auth')} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 shadow-inner"><ChevronLeft size={24} /></button>
                <div><h2 className="text-5xl font-black tracking-tighter uppercase leading-none italic">Identity</h2><p className="text-cyan-400 text-[10px] uppercase tracking-[0.5em] font-black mt-4 opacity-80">Synchronizing node</p></div>
              </div>
            </div>
            <form onSubmit={handleProfileSubmit} className="p-16 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {profileFields.map(f=>(
                  <div key={f.name} className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 block ml-2">{f.label}</label>
                  <input name={f.name} required type={f.type} className="w-full px-8 py-6 bg-white/[0.03] border border-white/5 rounded-2xl text-white focus:border-cyan-500/50 outline-none transition-all text-sm shadow-inner" value={profileData[f.name] || ''} onChange={e=>setProfileData({...profileData, [e.target.name]: e.target.value})} /></div>
                ))}
              </div>
              <button type="submit" disabled={isLoading} className="w-full py-6 bg-white text-black font-black rounded-2xl shadow-xl transition-all uppercase text-[11px] tracking-[0.4em] active:scale-95 mt-4">Commit matrix integration</button>
            </form>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD VIEW */}
      {(view === 'dashboard' || view === 'admin') && (
        <div className="w-full max-w-7xl mx-auto flex flex-col h-full animate-in fade-in duration-1000 px-8 pt-10">
          <header className="flex items-center justify-between mb-24 bg-[#08080a]/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 sticky top-8 z-[50] shadow-2xl">
            <div className="flex items-center gap-6 cursor-pointer group" onClick={() => { setView('dashboard'); setActiveFolderId(null); setSelectedSubCategory(null); }}>
              <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl p-0.5">
                 <div className="w-full h-full bg-[#020203] rounded-[14px] flex items-center justify-center"><Command size={24} className="text-cyan-400" strokeWidth={3} /></div>
              </div>
              <div className="flex flex-col"><h2 className="text-3xl font-black text-white leading-none tracking-tighter uppercase italic">FORJIX</h2><span className="text-cyan-400 text-[9px] font-black tracking-[0.6em] uppercase mt-2 opacity-80 italic tracking-widest">Intelligence</span></div>
            </div>

            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenuOpen(!menuOpen)} className="w-14 h-14 rounded-2xl border border-white/5 flex items-center justify-center transition-all text-zinc-600 hover:text-white hover:bg-white/5 shadow-2xl bg-white/[0.02]"><MoreVertical size={24} /></button>
              {menuOpen && (
                <div className="absolute right-0 mt-6 w-80 bg-[#0a0a0f] border border-white/10 rounded-[3rem] shadow-[0_50px_120px_rgba(0,0,0,0.9)] p-4 z-[100] animate-in slide-in-from-top-6 duration-500 backdrop-blur-3xl">
                  <div className="p-8 border-b border-white/5 flex items-center gap-5 mb-4 bg-white/[0.02] rounded-t-[2.5rem]">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black border border-white/10 ${isAdmin ? 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg' : 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg'}`}>{isAdmin ? 'A' : (profileData.fullName?.charAt(0) || 'U')}</div>
                    <div className="flex flex-col overflow-hidden"><span className="text-white font-black truncate text-base leading-tight">{profileData.fullName || (isAdmin ? 'Admin' : 'Student')}</span><span className="text-cyan-500 text-[8px] truncate tracking-[0.4em] uppercase font-black mt-1">Matrix Active</span></div>
                  </div>
                  <div className="space-y-1.5 mt-3 text-left">
                    {isAdmin && <button onClick={() => { setView('admin'); setMenuOpen(false); }} className="w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] bg-cyan-600/10 text-[11px] font-black transition-all text-cyan-400 hover:bg-cyan-600/20 uppercase tracking-[0.2em]"><ShieldCheck size={18} /> Console</button>}
                    <button onClick={() => { setView('profileSetup'); setMenuOpen(false); }} className="w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] hover:bg-white/5 text-[11px] font-black transition-all text-zinc-300 hover:text-white uppercase tracking-[0.2em]"><UserCircle size={18} /> Credentials</button>
                    <div className="h-px bg-white/5 my-4 mx-6"></div>
                    <button className="w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] hover:bg-red-500/10 text-[11px] font-black transition-all text-red-500 uppercase tracking-[0.2em]" onClick={logout}><LogOut size={18} /> Terminate</button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <main className="min-h-[60vh] pb-48">
            {view === 'admin' ? (
              <div className="animate-in fade-in duration-1000 space-y-16">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-6"><div className="p-5 bg-cyan-500/10 rounded-[2rem] border border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.15)]"><ShieldCheck className="w-12 h-12 text-cyan-500" /></div><h1 className="text-[100px] font-black text-white tracking-tighter uppercase italic leading-none">Console</h1></div>
                  <button onClick={() => setView('dashboard')} className="flex items-center gap-4 px-12 py-5 bg-white text-black rounded-2xl text-[11px] font-black shadow-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.3em]"><ChevronLeft size={20} /> Back Hub</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="bg-[#08080a] border border-white/5 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[100px]"></div>
                    <h3 className="font-black text-cyan-400 mb-12 flex items-center gap-4 uppercase tracking-[0.5em] text-[11px]"><Zap size={18} fill="currentColor"/> Publish integration node</h3>
                    <form onSubmit={handleAdminUpload} className="space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <select className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm shadow-inner transition-all cursor-pointer" value={uploadData.category} onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}><option value="Placement">Placement Hub</option><option value="GATE">GATE Prep</option></select>
                        <select className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm shadow-inner transition-all cursor-pointer" value={uploadData.subCategory} onChange={(e) => setUploadData({ ...uploadData, subCategory: e.target.value })}>{uploadData.category === 'Placement' ? placementFolders.map(f => <option key={f.id} value={f.title}>{f.title}</option>) : gateSubjects.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}</select>
                      </div>
                      <input type="text" required placeholder="Resource Semantic Identifier" className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm shadow-inner" value={uploadData.title} onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })} />
                      <input type="text" required placeholder="Encrypted Link Location (URL)" className="w-full px-8 py-6 bg-white/[0.03] border border-white/10 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm shadow-inner" value={uploadData.contentUrl} onChange={(e) => setUploadData({ ...uploadData, contentUrl: e.target.value })} />
                      <button type="submit" disabled={isLoading} className="w-full py-6 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-4 tracking-[0.5em] uppercase text-[11px] shadow-2xl hover:bg-cyan-50 transition-all mt-6">Initialize node</button>
                    </form>
                  </div>
                </div>
              </div>
            ) : selectedSubCategory ? (
              <div className="animate-in slide-in-from-right-16 duration-1000 space-y-16">
                <div className="flex items-center gap-10 mb-20 px-2">
                  <button onClick={() => setSelectedSubCategory(null)} className="w-20 h-20 bg-[#08080a] rounded-[2rem] flex items-center justify-center hover:bg-white/5 transition-all border border-white/5 shadow-2xl group shadow-inner"><ChevronLeft size={36} className="text-zinc-600 group-hover:text-white group-hover:-translate-x-1 transition-all" /></button>
                  <div><h2 className="text-9xl font-black text-white uppercase tracking-tighter leading-none italic leading-[0.8]">{selectedSubCategory}</h2><p className="text-cyan-500 text-[11px] font-black uppercase tracking-[0.7em] mt-10 opacity-80">Verified Knowledge Node Active</p></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                  {getFilteredMaterials().length > 0 ? getFilteredMaterials().map((item) => (
                    <div key={item.id} className="bg-[#08080a] border border-white/5 rounded-[3.5rem] p-12 hover:border-cyan-500/40 hover:shadow-[0_60px_120px_rgba(34,211,238,0.2)] transition-all group relative overflow-hidden shadow-2xl">
                      <div className="absolute top-[-10%] right-[-10%] w-48 h-48 bg-cyan-500/[0.03] rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="w-16 h-16 bg-white/[0.02] rounded-2xl flex items-center justify-center mb-10 border border-white/5 group-hover:border-cyan-500/30 transition-all duration-500 shadow-inner"><FileText className="text-cyan-400 w-8 h-8" /></div>
                      <h4 className="text-3xl font-black text-white mb-6 leading-tight italic">{item.title}</h4>
                      <p className="text-zinc-600 text-sm mb-12 line-clamp-2 h-10 leading-relaxed font-medium tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{item.description || 'Knowledge Integration Node'}</p>
                      <a href={item.contentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-4 w-full py-6 bg-white text-black rounded-[2rem] text-[11px] font-black uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all shadow-2xl active:scale-95">Access Node</a>
                    </div>
                  )) : <div className="col-span-full py-56 text-center bg-[#08080a] rounded-[4rem] border border-dashed border-white/5 shadow-inner"><HelpCircle className="mx-auto mb-10 text-zinc-900" size={80}/><p className="text-zinc-800 text-[11px] font-black uppercase tracking-[0.8em]">Node Unpopulated</p></div>}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-32 flex flex-col md:flex-row md:items-end justify-between gap-10 px-4">
                  <div className="space-y-6">
                    <h1 className="text-[120px] lg:text-[140px] font-black text-white tracking-[-0.05em] uppercase leading-[0.75] italic leading-none">
                      {activeFolderId ? "Master" : `Welcome, ${profileData.fullName?.split(' ')[0] || (isAdmin ? 'Admin' : 'Student')}`}
                    </h1>
                    <div className="flex items-center gap-6">
                       <div className="h-0.5 w-24 bg-cyan-500/50 shadow-[0_0_20px_#22d3ee]"></div>
                       <p className="text-cyan-500/60 text-[11px] font-black uppercase tracking-[0.8em]">{activeFolderId ? "Neural Cluster Matrix" : "FORJIX Intelligence: Succcess Matrix Initialization"}</p>
                    </div>
                  </div>
                  {activeFolderId && <button onClick={() => setActiveFolderId(null)} className="flex items-center gap-4 px-12 py-6 bg-[#0a0a0f] hover:bg-white/5 text-white rounded-3xl text-[11px] font-black border border-white/10 transition-all uppercase tracking-[0.4em] shadow-2xl active:scale-95"><ChevronLeft size={20} /> Master Hub</button>}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 pb-40 animate-in fade-in duration-1000">
                  {(!activeFolderId ? placementFolders : gateSubjects).map((item) => {
                    const FolderIcon = item.icon;
                    return (
                      <div key={item.id} onClick={() => { if(item.id === 9) setActiveFolderId(9); else setSelectedSubCategory(item.title); }} className="group relative bg-[#08080a] border border-white/5 rounded-[4rem] p-14 flex flex-col items-start transition-all hover:border-cyan-500/40 hover:shadow-[0_60px_120px_rgba(30,58,138,0.4)] hover:-translate-y-6 cursor-pointer overflow-hidden shadow-2xl active:scale-[0.96]">
                        <div className={`absolute top-[-25%] right-[-25%] w-80 h-80 bg-gradient-to-br ${item.color || 'from-zinc-500/20'} rounded-full blur-[110px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000`}></div>
                        <div className="w-20 h-20 rounded-[2.25rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-12 shadow-inner group-hover:scale-110 group-hover:bg-white/10 group-hover:border-cyan-500/30 transition-all duration-700">
                          {FolderIcon && <FolderIcon className="w-10 h-10 text-cyan-500 group-hover:text-cyan-200 transition-colors" strokeWidth={1} />}
                        </div>
                        <h3 className="text-4xl font-black text-white mb-5 tracking-tighter uppercase leading-none italic group-hover:text-cyan-50 transition-all">{item.title}</h3>
                        <p className="text-zinc-600 text-sm h-16 line-clamp-2 mt-4 leading-relaxed opacity-60 group-hover:opacity-100 transition-all font-medium tracking-tight">{item.desc || 'Initialize subject knowledge node matrix.'}</p>
                        <div className="mt-16 flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.6em] text-cyan-600 group-hover:text-cyan-300 transition-all">INITIALIZE <ArrowRight size={16} strokeWidth={4} /></div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </main>

          <footer className="mt-auto pt-24 text-center border-t border-white/5 py-24 relative overflow-hidden">
            <div className="flex justify-center gap-6 mb-12">
               <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_25px_#22d3ee] animate-pulse"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_20px_#3b82f6] opacity-40"></div>
               <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_15px_#6366f1] opacity-30"></div>
            </div>
            <p className="text-[12px] text-zinc-900 font-black uppercase tracking-[1.6em] opacity-80 italic">FORJIX INTELLIGENCE MATRIX • SHAPE YOUR SUCCESS</p>
          </footer>
        </div>
      )}
    </div>
  );
}
