import { useEffect, useState } from 'react';
import { LayoutDashboard, BarChart3, CalendarRange, Target, Flame, Users, Terminal, LogOut, ChevronRight, BookOpen, Shield, Activity, Layers, CheckCircle, Trash2, Menu, X } from 'lucide-react';
import axios from 'axios';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import Analytics from './components/Analytics';
import Goals from './components/Goals';
import ContestTracker from './components/ContestTracker';
import Leaderboard from './components/Leaderboard';

import ContestSimulator from './components/ContestSimulator';
import Potd from './components/Potd';
import TopicwiseSheet from './components/TopicwiseSheet';
import Cp31Sheet from './components/Cp31Sheet';
import StriverSheet from './components/StriverSheet';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export default function App() {
  const [allUsers, setAllUsers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [stats, setStats] = useState([]);
  const [goals, setGoals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [connError, setConnError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Lock strictly to light mode
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', 'light');
    localStorage.setItem('cp_tracker_mode', 'light');
    root.classList.add('light');
    root.classList.remove('dark');
  }, []);

  // Fetch initial users list for leaderboard stand
  const fetchUsers = async () => {
    try {
      setConnError(false);
      const res = await axios.get(`${BACKEND_URL}/users`);
      setAllUsers(res.data);
    } catch (err) {
      console.error('Backend connection failed:', err.message);
      setConnError(true);
    }
  };

  useEffect(() => {
    const cachedAccountsStr = localStorage.getItem('cp_tracker_accounts');
    const cachedActiveId = localStorage.getItem('cp_tracker_active_id');
    
    if (cachedAccountsStr) {
      try {
        const parsedAccounts = JSON.parse(cachedAccountsStr);
        // eslint-disable-next-line
        setAccounts(parsedAccounts);
        
        if (parsedAccounts.length > 0) {
          const activeUser = parsedAccounts.find(acc => acc._id === cachedActiveId) || parsedAccounts[0];
          setCurrentUser(activeUser);
          localStorage.setItem('cp_tracker_active_id', activeUser._id);
          
          // Verify user account sync directly
          axios.get(`${BACKEND_URL}/users/${activeUser.username}`).then(res => {
            const updatedUser = res.data;
            setCurrentUser(updatedUser);
            const updatedAccounts = parsedAccounts.map(acc => acc.username === updatedUser.username ? updatedUser : acc);
            setAccounts(updatedAccounts);
            localStorage.setItem('cp_tracker_accounts', JSON.stringify(updatedAccounts));
            localStorage.setItem('cp_tracker_active_id', updatedUser._id);
          }).catch((err) => {
            if (err.response && err.response.status === 404) {
              console.warn('Active user not found on backend. Clearing stale account.');
              const updatedAccounts = parsedAccounts.filter(acc => acc._id !== activeUser._id);
              setAccounts(updatedAccounts);
              localStorage.setItem('cp_tracker_accounts', JSON.stringify(updatedAccounts));
              if (updatedAccounts.length > 0) {
                setCurrentUser(updatedAccounts[0]);
                localStorage.setItem('cp_tracker_active_id', updatedAccounts[0]._id);
              } else {
                setCurrentUser(null);
                localStorage.removeItem('cp_tracker_active_id');
              }
            }
          });
        }
      } catch (err) {
        console.warn('Failed to parse cached accounts.', err);
      }
    } else {
      // Migrate from old single-user schema if it exists
      const legacyUserStr = localStorage.getItem('cp_tracker_user');
      if (legacyUserStr) {
        try {
          const parsed = JSON.parse(legacyUserStr);
          setAccounts([parsed]);
          setCurrentUser(parsed);
          localStorage.setItem('cp_tracker_accounts', JSON.stringify([parsed]));
          localStorage.setItem('cp_tracker_active_id', parsed._id);
          localStorage.removeItem('cp_tracker_user');
        } catch (err) { console.warn(err); }
      }
    }
    fetchUsers();
  }, []);

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/users/${currentUser._id}`);
      setShowDeleteConfirm(false);
      handleLogout();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete account");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = () => {
    if (!currentUser) return;
    const remainingAccounts = accounts.filter(acc => acc._id !== currentUser._id);
    setAccounts(remainingAccounts);
    localStorage.setItem('cp_tracker_accounts', JSON.stringify(remainingAccounts));
    
    if (remainingAccounts.length > 0) {
      const nextUser = remainingAccounts[0];
      setCurrentUser(nextUser);
      localStorage.setItem('cp_tracker_active_id', nextUser._id);
    } else {
      setCurrentUser(null);
      localStorage.removeItem('cp_tracker_active_id');
      setStats([]);
      setGoals([]);
      setLeaderboard([]);
    }
  };

  // Fetch data whenever user selection updates
  useEffect(() => {
    if (!currentUser) return;
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, goalsRes, leadRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/stats/${currentUser._id}`),
          axios.get(`${BACKEND_URL}/goals/${currentUser._id}`),
          axios.get(`${BACKEND_URL}/stats/leaderboard/${currentUser._id}`)
        ]);
        setStats(statsRes.data);
        setGoals(goalsRes.data);
        setLeaderboard(leadRes.data);
      } catch (err) {
        console.error('Failed to load user statistics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [currentUser]);

  // Sync user profiles
  const handleSync = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/stats/${currentUser._id}/sync`);
      setStats(res.data);
      // Re-fetch goals and leaderboard since sync can complete milestones or rating entries
      const [goalsRes, leadRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/goals/${currentUser._id}`),
        axios.get(`${BACKEND_URL}/stats/leaderboard/${currentUser._id}`)
      ]);
      setGoals(goalsRes.data);
      setLeaderboard(leadRes.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Profile synchronization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (userId) => {
    const selected = accounts.find(u => u._id === userId);
    if (selected) {
      setCurrentUser(selected);
      localStorage.setItem('cp_tracker_active_id', selected._id);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
    setAllUsers(allUsers.map(u => u._id === updatedUser._id ? updatedUser : u));
    const updatedAccounts = accounts.map(acc => acc._id === updatedUser._id ? updatedUser : acc);
    setAccounts(updatedAccounts);
    localStorage.setItem('cp_tracker_accounts', JSON.stringify(updatedAccounts));
  };


  const handleGoalAdd = (newGoal) => {
    setGoals([...goals, newGoal]);
    // Refresh leaderboard since goal addition can trigger updates
    axios.get(`${BACKEND_URL}/stats/leaderboard/${currentUser._id}`).then(res => setLeaderboard(res.data));
  };

  const handleGoalDelete = async (goalId) => {
    try {
      await axios.delete(`${BACKEND_URL}/goals/${goalId}`);
      setGoals(goals.filter(g => g._id !== goalId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendAdd = (updatedUserObj) => {
    // Update local currentUser to show added friends list
    setCurrentUser(updatedUserObj);
    // Update it in allUsers list too
    setAllUsers(allUsers.map(u => u._id === updatedUserObj._id ? updatedUserObj : u));
    // Re-fetch leaderboard stand
    axios.get(`${BACKEND_URL}/stats/leaderboard/${currentUser._id}`).then(res => setLeaderboard(res.data));
  };

  const handleFriendRemove = async (friendUsername) => {
    try {
      const res = await axios.delete(`${BACKEND_URL}/users/${currentUser._id}/friends/${friendUsername}`);
      setCurrentUser(res.data);
      setAllUsers(allUsers.map(u => u._id === res.data._id ? res.data : u));
      axios.get(`${BACKEND_URL}/stats/leaderboard/${currentUser._id}`).then(lRes => setLeaderboard(lRes.data));
    } catch (err) {
      console.error(err);
    }
  };

  // Render sub panels
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            currentUser={currentUser} 
            stats={stats} 
            goals={goals} 
            onSync={handleSync} 
            isLoading={isLoading} 
            allUsers={accounts}
            onUserSelect={handleUserSelect}
            onUserUpdate={handleUserUpdate}
            onAddAccount={() => setIsAddingAccount(true)}
          />
        );
      case 'analytics':
        return <Analytics stats={stats} />;
      case 'goals':
        return (
          <Goals 
            currentUser={currentUser} 
            goals={goals} 
            onGoalAdd={handleGoalAdd} 
            onGoalDelete={handleGoalDelete} 
          />
        );
      case 'contests':
        return <ContestTracker stats={stats} currentUser={currentUser} />;
      case 'leaderboard':
        return (
          <Leaderboard 
            currentUser={currentUser} 
            leaderboard={leaderboard} 
            onFriendAdd={handleFriendAdd} 
            onFriendRemove={handleFriendRemove} 
          />
        );
      case 'simulator':
        return <ContestSimulator currentUser={currentUser} />;
      case 'striver':
        return <StriverSheet currentUser={currentUser} />;
      case 'topics':
        return <TopicwiseSheet currentUser={currentUser} />;
      case 'cp31':
        return <Cp31Sheet />;
      case 'potd':
        return <Potd currentUser={currentUser} />;
      default:
        return <div className="text-slate-400">Section not found.</div>;
    }
  };

  if (!currentUser || isAddingAccount) {
    return (
      <AuthPage 
        onAuthSuccess={(user) => {
          const exists = accounts.find(acc => acc._id === user._id);
          let updatedAccounts = [...accounts];
          if (!exists) {
            updatedAccounts.push(user);
          } else {
            updatedAccounts = updatedAccounts.map(acc => acc._id === user._id ? user : acc);
          }
          setAccounts(updatedAccounts);
          localStorage.setItem('cp_tracker_accounts', JSON.stringify(updatedAccounts));
          localStorage.setItem('cp_tracker_active_id', user._id);
          setCurrentUser(user);
          setIsAddingAccount(false);
          fetchUsers();
        }}
        connError={connError}
        onRetryConnection={fetchUsers}
        isCancelable={accounts.length > 0}
        onCancel={() => setIsAddingAccount(false)}
      />
    );
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-dark-950 font-sans transition-colors duration-300">
      {/* Background Elements for Glassmorphic Glow */}
      <div className="hidden"></div>
      {/* Sidebar Navigation */}
      {isSidebarOpen && (<div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />)}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-50 w-64 border-r border-slate-800/80 bg-white dark:bg-[#0b1120] shrink-0 flex flex-col justify-between p-6 transition-all duration-300 ease-in-out shadow-2xl overflow-y-auto ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'}`}>
        <div className="space-y-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative p-2 bg-brand-cyan rounded-xl text-slate-900">
                <Shield className="w-6 h-6" />
                <Activity className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg leading-tight tracking-wide">CP Pulse</h2>
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-slate-700/60 px-1.5 py-0.5 rounded-md">V1.0.0</span>
              </div>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition bg-slate-50 dark:bg-slate-800/50 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'contests', label: 'Contest', icon: Flame },
              { id: 'potd', label: 'Problem of the day', icon: CalendarRange },
              { id: 'topics', label: 'Topicwise Problems', icon: Layers },
              { id: 'cp31', label: 'CP-31 Sheet', icon: CheckCircle },
              { id: 'striver', label: "Striver's A2Z Sheet", icon: BookOpen },
              { id: 'simulator', label: 'Virtual Contest', icon: Terminal },
              { id: 'goals', label: 'Target Goals', icon: Target },
              { id: 'leaderboard', label: 'Leaderboard', icon: Users },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${isActive ? 'bg-[#FAF3E0] text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-900 hover:bg-[#FAF3E0]'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-900'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-900" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer info showing connection health and logout option */}
        <div className="pt-4 border-t border-slate-800/50 space-y-3">

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/10 hover:bg-red-950/20 border border-red-900/10 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:text-red-400 bg-red-950/20 hover:bg-red-950/30 border border-red-900/20 transition mt-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>

          <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
            <p className="flex items-center gap-2 font-medium">
              <span className={`w-2 h-2 rounded-full inline-block ${connError ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`} />
              {connError ? 'Offline Mode' : 'Server Online'}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>User: {currentUser.username}</p>
          </div>
        </div>
      </aside>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#110e1b] border border-red-900/30 p-6 rounded-2xl max-w-md w-full shadow-2xl shadow-red-900/20 text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">Delete Account?</h2>
            <p className="text-sm text-slate-400">
              Are you sure you want to permanently delete your account? All your statistics, goals, and history will be wiped. This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-4 border-t border-slate-800/80">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition shadow-lg shadow-red-900/20 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen relative transition-all duration-300 ease-in-out">
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-dark-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60 px-4 py-3 flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500 hover:text-brand-indigo hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg tracking-wide hidden sm:block">CP Pulse</h1>
        </div>
        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto w-full">
        {/* Backend offline warning banner */}
        {connError && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-300 text-xs font-semibold">
            <span>The local backend Express server seems to be offline. Please run the server in another terminal (`node src/server.js` or `npm run dev` in `/backend`).</span>
            <button 
              onClick={fetchUsers}
              className="px-3 py-1 bg-amber-500 text-blue-950 font-bold rounded-lg hover:opacity-90"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Loader Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-dark-950/45 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="p-4 bg-dark-900 border border-slate-700/60 rounded-2xl flex items-center gap-3 shadow-2xl animate-pulse">
              <div className="w-5 h-5 rounded-full border-2 border-brand-cyan border-t-transparent animate-spin"></div>
              <span className="text-xs text-slate-200 font-semibold">Synchronizing CP profiles...</span>
            </div>
          </div>
        )}

        {renderContent()}
        </div>
      </main>
    </div>
  );
}
