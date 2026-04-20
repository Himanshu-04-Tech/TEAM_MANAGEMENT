import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc,
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Project, Team, Task, UserProfile } from '../../types';
import { Plus, Users, Folder, TrendingUp, AlertTriangle, Clock, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

export default function FacultyDashboard({ user }: { user: UserProfile }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'projects'), where('facultyId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project)));
    });
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    if (selectedProjectId) {
      const q = query(collection(db, 'teams'), where('projectId', '==', selectedProjectId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)));
      });
      return () => unsubscribe();
    } else {
      setTeams([]);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (selectedProjectId) {
      const q = query(collection(db, 'tasks'), where('projectId', '==', selectedProjectId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });
      return () => unsubscribe();
    } else {
      setTasks([]);
    }
  }, [selectedProjectId]);

  const stats = teams.map(team => {
    const teamTasks = tasks.filter(t => t.teamId === team.id);
    const completed = teamTasks.filter(t => t.status === 'completed').length;
    const total = teamTasks.length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { name: team.name, progress, risk: team.riskLevel };
  });

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-serif text-white italic">Project Overview</h1>
          <p className="text-slate-500 mt-2 font-light">Academic Portfolio &bull; Senior Design Tracking</p>
        </div>
        <button
          onClick={() => setIsProjectModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Initiate New Project
        </button>
      </header>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map(project => (
          <button
            key={project.id}
            onClick={() => setSelectedProjectId(project.id)}
            className={cn(
              "p-8 glass rounded-2xl border-l-[3px] transition-all text-left card-hover",
              selectedProjectId === project.id ? "border-indigo-500 bg-slate-900/60 shadow-xl shadow-indigo-500/5" : "border-white/5"
            )}
          >
            <Folder className="w-8 h-8 text-indigo-400 mb-6 opacity-80" />
            <h3 className="text-2xl font-serif text-white mb-2">{project.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-2 font-light leading-relaxed">{project.description}</p>
          </button>
        ))}
      </div>

      {selectedProjectId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass p-6 rounded-2xl flex flex-col justify-between h-32">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Active Teams</p>
              <p className="text-4xl font-serif text-white">{teams.length}</p>
            </div>
            <div className="glass p-6 rounded-2xl flex flex-col justify-between h-32">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Avg. Progress</p>
              <p className="text-4xl font-serif text-white">
                {stats.length > 0 ? Math.round(stats.reduce((a, b) => a + b.progress, 0) / stats.length) : 0}%
              </p>
            </div>
            <div className="glass p-6 rounded-2xl flex flex-col justify-between h-32">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Risk Alerts</p>
              <p className="text-4xl font-serif text-amber-500">{teams.filter(t => t.riskLevel === 'high').length}</p>
            </div>
            <div className="glass p-6 rounded-2xl flex flex-col justify-between h-32">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Student Pool</p>
              <p className="text-4xl font-serif text-white">{teams.reduce((a, b) => a + b.studentIds.length, 0)}</p>
            </div>
          </div>

          {/* Project Details & Teams */}
          <section className="glass rounded-3xl overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif italic text-white">Project Performance</h2>
                <p className="text-slate-500 text-xs mt-1 font-light tracking-wide">Real-time telemetry from student groups.</p>
              </div>
              <button
                onClick={() => setIsTeamModalOpen(true)}
                className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors text-xs font-semibold uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" />
                Add Team Fleet
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 h-[400px] border-r border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', fontSize: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="progress" fill="#6366f1" radius={[6, 6, 0, 0]} className="progress-glow" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex flex-col min-h-0 bg-white/[0.01]">
                <div className="overflow-y-auto max-h-[400px] divide-y divide-white/5">
                  {teams.map(team => {
                    const teamTasks = tasks.filter(t => t.teamId === team.id);
                    const progress = teamTasks.length === 0 ? 0 : (teamTasks.filter(t => t.status === 'completed').length / teamTasks.length) * 100;
                    
                    return (
                      <div key={team.id} className="p-6 transition-colors hover:bg-white/[0.02]">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center border-white/5">
                              <Users className="w-5 h-5 text-indigo-400 opacity-80" />
                            </div>
                            <div>
                              <h4 className="font-serif text-lg text-white">{team.name}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                                  KEY &bull; <span className="text-indigo-400 font-bold">{team.joinCode}</span>
                                </span>
                                <span className={cn(
                                  "text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-full border",
                                  team.riskLevel === 'high' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                                  team.riskLevel === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                )}>
                                  {team.riskLevel} risk
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-serif text-indigo-400">{Math.round(progress)}%</p>
                            <div className="w-24 bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                              <div className="bg-indigo-400 h-full transition-all progress-glow" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {teams.length === 0 && (
                    <div className="p-20 text-center text-slate-500 italic text-sm font-light">
                      No teams deployed yet for this project portfolio.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {isProjectModalOpen && (
          <CreateProjectModal 
            facultyId={user.uid} 
            onClose={() => setIsProjectModalOpen(false)} 
          />
        )}
        {isTeamModalOpen && selectedProjectId && (
          <CreateTeamModal 
            facultyId={user.uid}
            projectId={selectedProjectId} 
            onClose={() => setIsTeamModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateProjectModal({ facultyId, onClose }: { facultyId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectRef = doc(collection(db, 'projects'));
    await setDoc(projectRef, {
      id: projectRef.id,
      name,
      description,
      facultyId,
      createdAt: serverTimestamp()
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0D0F14] border border-white/5 rounded-3xl w-full max-w-md p-10 shadow-2xl"
      >
        <h2 className="text-3xl font-serif text-white mb-8">Establish Project</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Title</label>
            <input 
              required
              className="w-full px-5 py-3 bg-white/5 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Thesis A: Applied AI"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Brief</label>
            <textarea 
              className="w-full px-5 py-3 bg-white/5 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Outline project horizons..."
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 text-slate-400 rounded-xl font-medium hover:text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
            >
              Authorize
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function CreateTeamModal({ facultyId, projectId, onClose }: { facultyId: string; projectId: string; onClose: () => void }) {
  const [name, setName] = useState('');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [effort, setEffort] = useState(0);

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamRef = doc(collection(db, 'teams'));
    await setDoc(teamRef, {
      id: teamRef.id,
      name,
      projectId,
      facultyId,
      joinCode: generateJoinCode(),
      studentIds: [],
      riskLevel,
      riskDescription: '',
      effortEstimation: effort,
      createdAt: serverTimestamp()
    });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0D0F14] border border-white/5 rounded-3xl w-full max-w-md p-10 shadow-2xl"
      >
        <h2 className="text-3xl font-serif text-white mb-8">Deploy Team</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Nomenclature</label>
            <input 
              required
              className="w-full px-5 py-3 bg-white/5 border border-white/5 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Project Orion"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Risk Profile</label>
              <select
                className="w-full px-5 py-3 bg-white/5 border border-white/5 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
                value={riskLevel}
                onChange={e => setRiskLevel(e.target.value as any)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold ml-1">Target Hours</label>
              <input 
                type="number"
                className="w-full px-5 py-3 bg-white/5 border border-white/5 text-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={effort}
                onChange={e => setEffort(parseInt(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 text-slate-400 rounded-xl font-medium hover:text-white transition-all hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all"
            >
              Authorize
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
