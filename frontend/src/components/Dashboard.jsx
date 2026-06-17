import { useState, useEffect } from 'react';
import { RefreshCw, UserCheck, Flame, BookOpen, Award, Target, Plus, ShieldCheck, MapPin, GraduationCap, Edit, Key, HelpCircle, User } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function Dashboard({ currentUser, stats, goals, onSync, isLoading, allUsers, onUserSelect, onUserUpdate, onAddAccount }) {
  const [error, setError] = useState('');
  const [syncCooldown, setSyncCooldown] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Timer for sync cooldown
  useEffect(() => {
    let timer;
    if (syncCooldown > 0) {
      timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [syncCooldown]);

  // Editing state for active profiles handles
  const [showMyProfileModal, setShowMyProfileModal] = useState(false);
  const [showEditHandles, setShowEditHandles] = useState(false);
  const [editCfHandle, setEditCfHandle] = useState('');
  const [editCcHandle, setEditCcHandle] = useState('');
  const [editLcHandle, setEditLcHandle] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editCollege, setEditCollege] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editGraduationYear, setEditGraduationYear] = useState('');
  const [editCgpa, setEditCgpa] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editCountryCode, setEditCountryCode] = useState('+91');
  const [editPhone, setEditPhone] = useState('');
  const [isSavingHandles, setIsSavingHandles] = useState(false);

  // States for simulated secure authentication linking
  const [activeLinkTab, setActiveLinkTab] = useState('quick'); // 'quick' or 'secure'
  const [securePlatform, setSecurePlatform] = useState('Codeforces');
  const [secureHandle, setSecureHandle] = useState('');
  const [securePassword, setSecurePassword] = useState('');
  const [isAuthing, setIsAuthing] = useState(false);
  const [authStep, setAuthStep] = useState('');
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, error: null, success: false });

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ loading: false, error: "New passwords don't match.", success: false });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ loading: false, error: "New password must be at least 6 characters.", success: false });
      return;
    }
    
    setPasswordStatus({ loading: true, error: null, success: false });
    try {
      await axios.put(`${BACKEND_URL}/users/${currentUser.username}/password`, {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordStatus({ loading: false, error: null, success: true });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus({ loading: false, error: null, success: false });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }, 1500);
    } catch (err) {
      setPasswordStatus({ 
        loading: false, 
        error: err.response?.data?.error || "Failed to update password", 
        success: false 
      });
    }
  };  // Calculate totals
  const totalSolved = stats.reduce((sum, s) => sum + (s.solvedCount || 0), 0);
  const cfRating = stats.find(s => s.platform === 'Codeforces')?.currentRating || 0;
  const ccRating = stats.find(s => s.platform === 'CodeChef')?.currentRating || 0;
  const lcSolved = stats.find(s => s.platform === 'LeetCode')?.solvedCount || 0;
  const lcRating = stats.find(s => s.platform === 'LeetCode')?.currentRating || 0;


  // Streak calculations (based on submissions list)
  const calculateStreakPerPlatform = () => {
    const toLocalDateStr = (dateInput) => {
      const date = new Date(dateInput);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const getDayDiff = (d1, d2) => {
      const t1 = Date.parse(d1 + 'T00:00:00Z');
      const t2 = Date.parse(d2 + 'T00:00:00Z');
      return Math.round(Math.abs(t1 - t2) / (1000 * 60 * 60 * 24));
    };

    // Core streak engine — works on any array of submissions
    const computeStreaks = (submissions) => {
      const activityMap = {};
      (submissions || []).forEach(sub => {
        if (sub.verdict === 'OK' || sub.verdict === 'Accepted') {
          const dateStr = toLocalDateStr(sub.submittedAt);
          activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
        }
      });

      const dates = Object.keys(activityMap).sort((a, b) => new Date(a) - new Date(b));
      if (dates.length === 0) return { current: 0, longest: 0 };

      // Longest (max) streak
      let temp = 1;
      let longest = 1;
      for (let i = 1; i < dates.length; i++) {
        const diff = getDayDiff(dates[i], dates[i - 1]);
        if (diff === 1) {
          temp++;
        } else if (diff > 1) {
          longest = Math.max(longest, temp);
          temp = 1;
        }
      }
      longest = Math.max(longest, temp);

      // Current active streak
      const todayStr = toLocalDateStr(new Date());
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toLocalDateStr(yesterday);

      let current = 0;
      const hasToday = !!activityMap[todayStr];
      const hasYesterday = !!activityMap[yesterdayStr];

      if (hasToday || hasYesterday) {
        current = 1;
        let check = hasToday ? todayStr : yesterdayStr;
        while (true) {
          const d = new Date(check + 'T00:00:00Z');
          d.setUTCDate(d.getUTCDate() - 1);
          const prev = d.toISOString().split('T')[0];
          if (activityMap[prev]) {
            current++;
            check = prev;
          } else break;
        }
      }

      return { current, longest: Math.max(longest, current) };
    };

    // Calculate per-platform streaks independently
    const perPlatform = stats.map(s => ({
      platform: s.platform,
      ...computeStreaks(s.recentSubmissions || [])
    }));

    // Platform with the highest ACTIVE (current) streak
    const bestCurrent = perPlatform.reduce(
      (best, p) => p.current > best.current ? p : best,
      { platform: '', current: 0, longest: 0 }
    );

    // Platform with the highest EVER (longest) streak
    const bestLongest = perPlatform.reduce(
      (best, p) => p.longest > best.longest ? p : best,
      { platform: '', current: 0, longest: 0 }
    );

    return { perPlatform, bestCurrent, bestLongest };
  };

  const streakData = calculateStreakPerPlatform();



  const handleStartEdit = () => {
    setEditCfHandle(currentUser?.codeforcesHandle || '');
    setEditCcHandle(currentUser?.codechefHandle || '');
    setEditLcHandle(currentUser?.leetcodeHandle || '');
    setEditUsername(currentUser?.username || '');
    setEditFullName(currentUser?.fullName || '');
    setEditLocation(currentUser?.location || '');
    setEditCollege(currentUser?.college || '');
    setEditBranch(currentUser?.branch || '');
    setEditGraduationYear(currentUser?.graduationYear || '');
    setEditCgpa(currentUser?.cgpa || '');
    setEditEmail(currentUser?.email || '');
    let cCode = '+91';
    let pNum = currentUser?.phone || '';
    if (pNum && pNum.includes(' ')) {
      const parts = pNum.split(' ');
      cCode = parts[0];
      pNum = parts.slice(1).join(' ');
    }
    setEditCountryCode(cCode);
    setEditPhone(pNum);
    setError('');
    setShowMyProfileModal(false);
    setShowPasswordModal(false);
    setShowEditHandles(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSavingHandles(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/users/${currentUser._id}`, {
        username: editUsername.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() ? `${editCountryCode} ${editPhone.trim()}` : '',
        fullName: editFullName.trim(),
        location: editLocation.trim(),
        college: editCollege.trim(),
        branch: editBranch.trim(),
        graduationYear: editGraduationYear.trim(),
        cgpa: editCgpa.trim(),
        codeforcesHandle: editCfHandle.trim(),
        codechefHandle: editCcHandle.trim(),
        leetcodeHandle: editLcHandle.trim()
      });
      onUserUpdate(res.data);
      setShowEditHandles(false);
      // Auto trigger stats update
      setTimeout(() => {
        onSync();
      }, 300);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update handles');
    } finally {
      setIsSavingHandles(false);
    }
  };

  const handleSecureSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!secureHandle.trim() || !securePassword.trim()) {
      setError('Username/Handle and Password are required for secure linkage.');
      return;
    }
    
    setIsAuthing(true);
    setAuthStep(`Connecting to ${securePlatform} secure gateway...`);
    
    // Step 2
    setTimeout(() => {
      setAuthStep('Bypassing verification CAPTCHA cloud shield...');
    }, 900);
    
    // Step 3
    setTimeout(() => {
      setAuthStep('Decrypting credentials & extracting platform authentication token...');
    }, 1800);
    
    // Step 4: Finalize
    setTimeout(async () => {
      try {
        const res = await axios.post(`${BACKEND_URL}/users/${currentUser._id}/credentials`, {
          platform: securePlatform,
          handle: secureHandle.trim(),
          password: securePassword.trim()
        });
        onUserUpdate(res.data);
        setIsAuthing(false);
        setAuthStep('');
        setShowEditHandles(false);
        setSecureHandle('');
        setSecurePassword('');
        // Trigger sync
        setTimeout(() => {
          onSync();
        }, 300);
      } catch (err) {
        setError(err.response?.data?.error || 'Simulated gateway handshake failed. Check your handles and credentials.');
        setIsAuthing(false);
        setAuthStep('');
      }
    }, 2800);
  };



  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Upper Navigation and User selection */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {!currentUser ? (
            <>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-100 ">
                Developer Dashboard
              </h1>
              <p className="text-slate-500 mt-1">
                Track and optimize your competitive programming handles.
              </p>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4 sm:gap-6 text-center sm:text-left">
              {/* Profile Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-brand-indigo flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {(currentUser.fullName || currentUser.username || '??').substring(0, 2).toUpperCase()}
              </div>
              
              {/* Profile Details */}
              <div className="space-y-1.5">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-3">
                  {currentUser.fullName || currentUser.username}
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-sm">
                  <span className="font-semibold text-brand-indigo">@{currentUser.username}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Icons Panel */}
        <div className="flex items-center gap-3 relative">
          
          {currentUser && (
            <button
              onClick={() => {
                onSync();
                setSyncCooldown(30); // 30 seconds delay/cooldown
              }}
              disabled={isLoading || syncCooldown > 0}
              className="flex items-center justify-center bg-[#110e1b] border border-slate-800/80 hover:border-brand-cyan/40 text-slate-400 hover:text-brand-cyan w-10 h-10 rounded-xl transition disabled:opacity-50 relative"
              title="Sync Live Profiles"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin text-brand-cyan' : ''}`} />
              {syncCooldown > 0 && <span className="absolute -top-2 -right-2 bg-brand-cyan text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{syncCooldown}</span>}
            </button>
          )}

          <button
            onClick={() => setShowGuidelinesModal(true)}
            className="flex items-center justify-center bg-[#110e1b] border border-slate-800/80 hover:border-brand-indigo/20 text-slate-400 hover:text-brand-indigo w-10 h-10 rounded-xl transition"
            title="Guidelines"
          >
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center justify-center bg-brand-indigo hover:opacity-90 text-slate-100 w-10 h-10 rounded-xl transition relative shadow-lg shadow-brand-indigo/20"
            title="Profile Menu"
          >
            <User className="w-5 h-5" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-64 bg-[#110e1b] border border-slate-800/80 rounded-2xl shadow-xl shadow-black/50 overflow-hidden z-50 animate-fadeIn">
              <div className="p-4 border-b border-slate-800/80 bg-slate-800/20">
                <p className="text-xs text-slate-500 font-semibold mb-2 uppercase tracking-wider">Switch Account</p>
                <div className="flex items-center gap-2 bg-[#110e1b] border border-slate-700 px-3 py-2 rounded-lg">
                  <UserCheck className="w-4 h-4 text-brand-indigo" />
                  <select 
                    value={currentUser?._id || ''} 
                    onChange={(e) => {
                      onUserSelect(e.target.value);
                      setShowProfileMenu(false);
                    }}
                    className="bg-transparent text-slate-100 outline-none border-none cursor-pointer text-sm font-medium w-full"
                  >
                    {allUsers.length === 0 ? (
                      <option value="">No Users</option>
                    ) : (
                      allUsers.map(u => (
                        <option key={u._id} value={u._id} className="bg-[#110e1b] text-slate-100">
                          {u.username}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="p-2 flex flex-col gap-1">
                {currentUser && (
                  <>
                    <button
                      onClick={() => {
                        setShowEditHandles(false);
                        setShowPasswordModal(false);
                        setShowMyProfileModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-3 text-slate-300 hover:bg-[#FAF3E0] hover:text-slate-900 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      <User className="w-4 h-4" /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        handleStartEdit();
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-3 text-slate-300 hover:bg-[#FAF3E0] hover:text-slate-900 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      <Edit className="w-4 h-4" /> Edit Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowMyProfileModal(false);
                        setShowEditHandles(false);
                        setShowPasswordModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-3 text-slate-300 hover:bg-[#FAF3E0] hover:text-slate-900 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                    >
                      <Key className="w-4 h-4" /> Change Password
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    onAddAccount();
                    setShowProfileMenu(false);
                  }}
                  className="flex items-center gap-3 text-slate-300 hover:bg-[#FAF3E0] hover:text-slate-900 w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition"
                >
                  <Plus className="w-4 h-4" /> Add New Account
                </button>
              </div>
            </div>
          )}

          {/* Overlay to close menu when clicking outside */}
          {showProfileMenu && (
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setShowProfileMenu(false)}
            />
          )}
        </div>
      </div>

      {/* My Profile modal */}
      {showMyProfileModal && currentUser && (
        <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl max-w-2xl mx-auto space-y-5 shadow-sm mb-6 animate-fadeIn">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2"><User className="w-5 h-5 text-brand-indigo"/> My Profile</h2>
            <button
              onClick={() => setShowMyProfileModal(false)}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              Close
            </button>
          </div>
          <div className="space-y-4">
            <div className="bg-slate-800/20 p-4 rounded-xl border border-slate-800/50">
              <p className="text-xs font-bold text-brand-indigo uppercase tracking-wider mb-3">Personal Details</p>
              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">Name</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.fullName || currentUser.username || '—'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">Username</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.username || '—'}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-800/50 pb-3">
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start">
                    <span className="text-slate-500 text-sm pt-0.5">Branch</span>
                    <span className="text-slate-200 font-medium break-words">{currentUser.branch || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start">
                    <span className="text-slate-500 text-sm pt-0.5">CGPA</span>
                    <span className="text-slate-200 font-medium break-words">{currentUser.cgpa || '—'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">College</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.college || '—'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">Grad Year</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.graduationYear || '—'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">Email</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.email || '—'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start border-b border-slate-800/50 pb-3">
                  <span className="text-slate-500 text-sm pt-0.5">Phone</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.phone || '—'}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] gap-4 items-start">
                  <span className="text-slate-500 text-sm pt-0.5">Location</span>
                  <span className="text-slate-200 font-medium break-words">{currentUser.location || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit handles modal/form */}
      {showEditHandles && (
        <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 max-w-xl mx-auto space-y-5 shadow-sm">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-100">Edit Profile & Platforms</h2>
          </div>

          {error && <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl text-red-300 text-sm">{error}</div>}
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-4">
                <p className="text-xs font-bold text-brand-indigo uppercase tracking-wider border-b border-slate-800/80 pb-2">Personal Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Username</label>
                    <input 
                      type="text" 
                      value={editUsername} 
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Full Name</label>
                    <input 
                      type="text" 
                      value={editFullName} 
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Location</label>
                    <input 
                      type="text" 
                      value={editLocation} 
                      onChange={(e) => setEditLocation(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">College</label>
                    <input 
                      type="text" 
                      value={editCollege} 
                      onChange={(e) => setEditCollege(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Email Address</label>
                    <input 
                      type="email" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                    <div className="flex gap-2">
                      <select
                        value={editCountryCode}
                        onChange={(e) => setEditCountryCode(e.target.value)}
                        className="w-1/3 bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20 appearance-none"
                      >
                        <option value="+91">+91 (India)</option>
                        <option value="+1">+1 (USA/CAN)</option>
                        <option value="+44">+44 (UK)</option>
                        <option value="+61">+61 (AUS)</option>
                        <option value="+86">+86 (CN)</option>
                        <option value="+81">+81 (JP)</option>
                      </select>
                      <input 
                        type="tel" 
                        value={editPhone} 
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-2/3 bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Branch</label>
                    <select 
                      value={editBranch && !["", "Computer Science Engineering", "Information Technology", "AI/ML", "Electronics and Communication Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Civil Engineering"].includes(editBranch) ? "Other" : editBranch}
                      onChange={(e) => setEditBranch(e.target.value === "Other" ? "Other" : e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20 appearance-none"
                    >
                      <option value="" disabled>Select Branch</option>
                      <option value="Computer Science Engineering">Computer Science Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="AI/ML">AI/ML</option>
                      <option value="Electronics and Communication Engineering">Electronics and Communication Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Other">Other (Please specify)</option>
                    </select>
                    {editBranch === "Other" || (editBranch && !["", "Computer Science Engineering", "Information Technology", "AI/ML", "Electronics and Communication Engineering", "Electrical Engineering", "Mechanical Engineering", "Chemical Engineering", "Civil Engineering"].includes(editBranch)) ? (
                      <input 
                        type="text" 
                        value={editBranch === "Other" ? "" : editBranch} 
                        onChange={(e) => setEditBranch(e.target.value)}
                        placeholder="Type your branch here"
                        className="w-full mt-2 bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                      />
                    ) : null}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">Graduation Year</label>
                    <select 
                      value={editGraduationYear} 
                      onChange={(e) => setEditGraduationYear(e.target.value)}
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20 appearance-none"
                    >
                      <option value="" disabled>Select Year</option>
                      {Array.from({length: 6}, (_, i) => new Date().getFullYear() + i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500">CGPA</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={editCgpa} 
                      onChange={(e) => setEditCgpa(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                    />
                  </div>
                </div>

                <p className="text-xs font-bold text-brand-indigo uppercase tracking-wider border-b border-slate-800/80 pb-2 mt-4">Platform Handles</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">Codeforces Handle</label>
                  <input 
                    type="text" 
                    value={editCfHandle} 
                    onChange={(e) => setEditCfHandle(e.target.value)}
                    placeholder="e.g. Tourist"
                    className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">CodeChef Handle</label>
                  <input 
                    type="text" 
                    value={editCcHandle} 
                    onChange={(e) => setEditCcHandle(e.target.value)}
                    placeholder="e.g. genghis_khan"
                    className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-brand-indigo/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500">LeetCode Handle</label>
                  <input 
                    type="text" 
                    value={editLcHandle} 
                    onChange={(e) => setEditLcHandle(e.target.value)}
                    placeholder="e.g. aradhya_1"
                    className="w-full bg-[#110e1b] border border-slate-800/80 px-3 py-2 rounded-lg text-slate-100 outline-none focus:border-royal/20"
                  />
                </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800/80">
                <button 
                  type="button" 
                  onClick={() => setShowEditHandles(false)}
                  className="px-4 py-2 border border-slate-800/80 rounded-lg text-slate-500 text-sm hover:bg-[#110e1b] transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingHandles}
                  className="px-4 py-2 bg-brand-indigo text-white rounded-lg text-slate-100 text-sm font-semibold transition hover:opacity-95 disabled:opacity-50"
                >
                  {isSavingHandles ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

        </div>
      )}

      {/* Edit Password Modal */}
      {showPasswordModal && (
        <div className="bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 p-6 rounded-2xl max-w-xl mx-auto space-y-5 shadow-sm mb-8">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Change Password</h2>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xl"
            >
              &times;
            </button>
          </div>

          {passwordStatus.error && <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/40 rounded-xl text-red-600 dark:text-red-300 text-sm">{passwordStatus.error}</div>}
          {passwordStatus.success && <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm">Password updated successfully!</div>}

          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
              <input
                type="password"
                required
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-[#0f0c18] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-indigo transition"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-[#0f0c18] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-indigo transition"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                autoComplete="new-password"
                className="w-full bg-slate-50 dark:bg-[#0f0c18] border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-brand-indigo transition"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={passwordStatus.loading || passwordStatus.success}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-indigo hover:opacity-90 transition shadow-md disabled:opacity-50"
              >
                {passwordStatus.loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="bg-[#110e1b] border border-slate-200 dark:border-slate-800/80 p-8 rounded-2xl max-w-2xl mx-auto space-y-6 shadow-sm mb-8 text-slate-800 dark:text-slate-100">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <h2 className="text-2xl font-bold">CP Tracker Guidelines</h2>
            <button
              onClick={() => setShowGuidelinesModal(false)}
              className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-2xl"
            >
              &times;
            </button>
          </div>
          
          <div className="space-y-6 text-sm leading-relaxed">
            <div>
              <h3 className="text-lg font-bold text-brand-indigo mb-2">Profile Linking</h3>
              <p className="mb-2">You need to link your:</p>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                <li>CodeChef ID</li>
                <li>Codeforces ID</li>
                <li>LeetCode ID</li>
              </ul>
              
              <p className="font-bold mb-2">Steps to Link Your Profiles:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Click on <strong>Edit Profile</strong>.</li>
                <li>Add your respective platform IDs and save the changes.</li>
              </ol>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-4">
              <h3 className="text-lg font-bold text-brand-indigo mb-2">Features of the Platform</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Track your coding performance across multiple platforms in one place.</li>
                <li>Access the Daily <strong>Problem of the Day (POTD)</strong> with direct links to LeetCode and GeeksforGeeks.</li>
                <li>Practice problems <strong>topic-wise</strong> as well as <strong>rating-wise</strong> to strengthen your problem-solving skills.</li>
                <li>Learn Data Structures and Algorithms through curated content, including access to the popular <strong>Striver's DSA Course</strong>.</li>
                <li>Add, organize, and manage your personal tasks efficiently.</li>
                <li>Join the <strong>Leaderboard</strong> and compete with coders using this platform.</li>
                <li>Get timely updates and reminders about upcoming coding contests.</li>
                <li>Participate in <strong>virtual contests</strong> by selecting your preferred rating range and number of questions.</li>
                <li>Stay motivated with daily coding insights and achievement tracking.</li>
              </ul>
            </div>
            
            <div className="pt-4 pb-2">
              <p className="font-medium text-slate-500 dark:text-slate-400 italic">
                Start by linking your profiles and explore the features to make your competitive programming journey more structured and productive.
                <br /><br />
                <span className="font-bold block mt-2">All the Best</span>
                <span className="font-bold">-Aradhya Gupta</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {currentUser ? (
        <>
          {/* Main Key Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#110e1b] border border-slate-800/80 hover:shadow-md transition-shadow p-6 rounded-2xl flex items-center gap-5 border border-slate-800/80 shadow-sm">
              <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Solved</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">{totalSolved}</h3>
                <p className="text-xs text-brand-indigo mt-1 font-medium">Across platforms</p>
              </div>
            </div>

            <div className="bg-[#110e1b] border border-slate-800/80 hover:shadow-md transition-shadow p-6 rounded-2xl border border-slate-800/80 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-indigo/10 rounded-xl text-brand-indigo shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Ratings</p>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-medium">Codeforces:</span>
                  <span className="text-sm font-extrabold text-brand-indigo">
                    {cfRating > 0 ? cfRating : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/80 pt-1.5">
                  <span className="text-xs text-slate-500 font-medium">CodeChef:</span>
                  <span className="text-sm font-extrabold text-slate-100">
                    {ccRating > 0 ? `${ccRating} ★` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/80 pt-1.5">
                  <span className="text-xs text-slate-500 font-medium">LeetCode:</span>
                  <span className="text-sm font-extrabold text-brand-indigo">
                    {lcRating > 0 ? lcRating : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#110e1b] border border-slate-800/80 hover:shadow-md transition-shadow p-6 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-brand-indigo/10 rounded-xl text-slate-100 shrink-0">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coding Streaks</p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Active Streak</p>
                  <h3 className="text-2xl font-extrabold text-slate-100">
                    {streakData.bestCurrent.current}
                    <span className="text-sm font-semibold text-slate-500 ml-1">days</span>
                  </h3>
                  <p className="text-[10px] font-bold text-slate-100 mt-1">
                    {streakData.bestCurrent.current > 0 ? streakData.bestCurrent.platform : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Max Streak</p>
                  <h3 className="text-2xl font-extrabold text-slate-100">
                    {streakData.bestLongest.longest}
                    <span className="text-sm font-semibold text-slate-500 ml-1">days</span>
                  </h3>
                  <p className="text-[10px] font-bold text-brand-indigo mt-1">
                    {streakData.bestLongest.longest > 0 ? streakData.bestLongest.platform : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#110e1b] border border-slate-800/80 hover:shadow-md transition-shadow p-6 rounded-2xl flex items-center gap-5 border border-slate-800/80">
              <div className="p-3 bg-brand-indigo/10 rounded-xl text-brand-indigo">
                <Target className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Target Goals</p>
                <h3 className="text-3xl font-extrabold text-slate-100 mt-1">
                  {goals.length}
                </h3>
                <p className="text-xs text-brand-indigo mt-1 font-medium">
                  Completed: {goals.filter(g => g.isCompleted).length} / {goals.length}
                </p>
              </div>
            </div>
          </div>

          {/* Platform Profiles Details */}
          <div>
            <h2 className="text-2xl font-bold text-slate-100 mb-6">Linked Handles Breakdown</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Codeforces Panel */}
              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-indigo/10 border border-royal/20 text-brand-indigo rounded-full">
                      Codeforces
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.codeforcesHandle ? `@${currentUser.codeforcesHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.codeforcesHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Rating</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.currentRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Max Rating</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.maxRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Contests</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.contestsCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'Codeforces')?.solvedCount || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-500">Link your Codeforces handle to synchronize solved counts, rank badges, and rating graphs.</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-indigo/10 border border-royal/20 rounded-xl text-brand-indigo font-bold text-xs hover:bg-brand-indigo/10 transition"
                    >
                      Configure Codeforces Account
                    </button>
                  </div>
                )}
              </div>

              {/* CodeChef Panel */}
              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-indigo/10 border border-brand-indigo/20 text-slate-100 rounded-full">
                      CodeChef
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.codechefHandle ? `@${currentUser.codechefHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.codechefHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Rating</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.currentRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Max Rating</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.maxRating || 'Unrated'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Contests</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.contestsCount || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {stats.find(s => s.platform === 'CodeChef')?.solvedCount || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-500">Link your CodeChef handle to track star rankings, global ranks, and solve rates.</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-indigo/10 border border-brand-indigo/20 rounded-xl text-slate-100 font-bold text-xs hover:bg-brand-indigo/20 transition"
                    >
                      Configure CodeChef Account
                    </button>
                  </div>
                )}
              </div>

              {/* LeetCode Panel */}
              <div className="bg-[#110e1b] border border-slate-800/80 p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-indigo/10 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-brand-indigo/10 border border-royal/20 text-brand-indigo rounded-full">
                      LeetCode
                    </span>
                    <h3 className="text-xl font-bold text-slate-100 mt-3">
                      {currentUser.leetcodeHandle ? `@${currentUser.leetcodeHandle}` : 'Not Linked'}
                    </h3>
                  </div>
                </div>
                {currentUser.leetcodeHandle ? (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800/80">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Solved Count</p>
                      <p className="text-lg font-bold text-slate-100 mt-1">
                        {lcSolved}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Easy Solved</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1 text-emerald-400">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Easy || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Medium Solved</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1 text-amber-400">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Medium || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Hard Solved</p>
                      <p className="text-sm font-semibold text-slate-100 mt-1 text-rose-500">
                        {stats.find(s => s.platform === 'LeetCode')?.difficultyDistribution?.Hard || 0}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 space-y-4">
                    <p className="text-xs text-slate-500">Link your LeetCode handle to synchronize acceptance distribution (Easy/Medium/Hard).</p>
                    <button
                      type="button"
                      onClick={handleStartEdit}
                      className="w-full text-center py-2 bg-brand-indigo/10 border border-royal/20 rounded-xl text-brand-indigo font-bold text-xs hover:bg-brand-indigo/10 transition"
                    >
                      Configure LeetCode Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#110e1b] border border-slate-800/80 p-12 rounded-2xl border border-slate-800/80 text-center space-y-4">
          <ShieldCheck className="w-16 h-16 text-brand-indigo mx-auto animate-pulse-slow" />
          <h2 className="text-2xl font-bold text-slate-100">Welcome to CP Pulse</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            Please register a new competitive programming profile or select an existing one to begin aggregating statistics, syncing history, and analyzing code performance.
          </p>
          <button
            onClick={onAddAccount}
            className="bg-brand-indigo text-white hover:opacity-95 text-slate-100 px-6 py-2.5 rounded-xl font-bold transition inline-block"
          >
            Create Profile Handle
          </button>
        </div>
      )}
    </div>
  );
}
