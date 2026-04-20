/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, signInWithGoogle } from './lib/firebase';
import { UserProfile, UserRole } from './types';
import FacultyDashboard from './components/faculty/FacultyDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data() as UserProfile);
        } else {
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleRoleSelection = async (role: UserRole) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      name: user.displayName || 'Anonymous',
      role,
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', user.uid), {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    setUserProfile(newProfile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0B0E]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={signInWithGoogle} />;
  }

  if (!userProfile) {
    return <RoleSelection onSelect={handleRoleSelection} />;
  }

  return (
    <div className="flex min-h-screen bg-[#0A0B0E] text-slate-300">
      <Sidebar user={userProfile} onLogout={() => auth.signOut()} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-10">
          {userProfile.role === 'faculty' ? (
            <FacultyDashboard user={userProfile} />
          ) : (
            <StudentDashboard user={userProfile} />
          )}
        </div>
      </main>
    </div>
  );
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-2xl px-4 z-10"
      >
        <h1 className="text-6xl font-serif text-white italic tracking-tight mb-6">AcademiaSync</h1>
        <p className="text-xl mb-10 text-slate-400 font-light leading-relaxed">
          Elevate academic collaboration with sophisticated project management and real-time synchronization.
        </p>
        <button
          onClick={onLogin}
          className="px-10 py-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
        >
          Sign in with Google
        </button>
      </motion.div>
    </div>
  );
}

function RoleSelection({ onSelect }: { onSelect: (role: UserRole) => void }) {
  return (
    <div className="min-h-screen bg-[#0A0B0E] flex flex-col items-center justify-center p-4">
      <h2 className="text-4xl font-serif text-white mb-10">Select Your Path</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        <button
          onClick={() => onSelect('faculty')}
          className="p-10 glass rounded-2xl hover:border-indigo-500/50 transition-all text-left group"
        >
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h3 className="text-2xl font-serif text-white mb-3">Faculty</h3>
          <p className="text-slate-400 font-light">Architect academic success by managing projects and mentoring student teams.</p>
        </button>
        <button
          onClick={() => onSelect('student')}
          className="p-10 glass rounded-2xl hover:border-indigo-500/50 transition-all text-left group"
        >
          <div className="w-14 h-14 bg-indigo-500/10 border border-indigo-500/30 rounded-xl flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="text-2xl font-serif text-white mb-3">Student</h3>
          <p className="text-slate-400 font-light">Join your peers and drive projects forward with real-time tracking and sync.</p>
        </button>
      </div>
    </div>
  );
}

function Sidebar({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  return (
    <aside className="w-72 bg-[#0D0F14] border-r border-white/5 flex flex-col shrink-0">
      <div className="p-8">
        <h1 className="font-serif text-2xl text-white italic tracking-wide">AcademiaSync</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 mt-1 font-semibold">
          {user.role} workspace
        </p>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <div className="px-4 py-3 bg-white/5 rounded-xl text-white flex items-center space-x-3">
          <div className="w-1 h-4 bg-indigo-500 rounded-full" />
          <span className="text-sm font-medium tracking-wide">Dashboard</span>
        </div>
      </nav>

      <div className="p-6 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Academic Portal</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
