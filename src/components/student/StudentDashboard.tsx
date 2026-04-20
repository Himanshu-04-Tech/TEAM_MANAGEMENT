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
  getDocs,
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Team, Task, UserProfile, Project } from '../../types';
import { CheckCircle2, Circle, Clock, Plus, Hash, Send, ChevronRight, Layout, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function StudentDashboard({ user }: { user: UserProfile }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Find user's team
  useEffect(() => {
    const q = query(collection(db, 'teams'), where('studentIds', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const teamData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Team;
        setTeam(teamData);
      } else {
        setTeam(null);
      }
    });
    return () => unsubscribe();
  }, [user.uid]);

  // If in team, get tasks and project
  useEffect(() => {
    if (team) {
      const q = query(collection(db, 'tasks'), where('teamId', '==', team.id));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
      });

      const getProject = async () => {
        const qProj = query(collection(db, 'projects'), where('id', '==', team.projectId));
        const snapshot = await getDocs(qProj);
        if (!snapshot.empty) {
          setProject({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Project);
        }
      };
      getProject();

      return () => unsubscribe();
    }
  }, [team]);

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      const q = query(collection(db, 'teams'), where('joinCode', '==', joinCode.toUpperCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        alert('Invalid join code');
        return;
      }

      const teamId = snapshot.docs[0].id;
      await updateDoc(doc(db, 'teams', teamId), {
        studentIds: arrayUnion(user.uid)
      });
    } catch (error) {
      console.error(error);
      alert('Error joining team');
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !newTaskTitle.trim()) return;
    
    const taskRef = doc(collection(db, 'tasks'));
    await setDoc(taskRef, {
      id: taskRef.id,
      teamId: team.id,
      projectId: team.projectId,
      title: newTaskTitle,
      description: '',
      status: 'todo',
      effortHours: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assignedTo: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setNewTaskTitle('');
  };

  const toggleTaskStatus = async (task: Task) => {
    const statusMap: Record<string, 'todo' | 'in-progress' | 'completed'> = {
      'todo': 'in-progress',
      'in-progress': 'completed',
      'completed': 'todo'
    };
    await updateDoc(doc(db, 'tasks', task.id), {
      status: statusMap[task.status],
      updatedAt: serverTimestamp()
    });
  };

  if (!team) {
    return (
      <div className="max-w-md mx-auto mt-20 p-10 glass rounded-3xl shadow-2xl border border-white/5">
        <h2 className="text-3xl font-serif text-white mb-3">Join Your Unit</h2>
        <p className="text-slate-500 mb-8 text-sm font-light leading-relaxed">Access your collaborative workspace by providing the unique project team key.</p>
        <form onSubmit={handleJoinTeam} className="space-y-6">
          <div className="relative">
            <Hash className="absolute left-4 top-4 w-5 h-5 text-indigo-400 opacity-50" />
            <input 
              className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 text-white rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-[0.3em] uppercase text-center transition-all placeholder:text-slate-700"
              placeholder="SECRET-KEY"
              maxLength={6}
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              required
            />
          </div>
          <button
            disabled={isJoining}
            className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 active:scale-[0.98]"
          >
            {isJoining ? 'Verifying...' : 'Authenticate Access'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Left Column: Team info & New Task */}
      <div className="space-y-8">
        <div className="glass p-8 rounded-3xl border border-white/5 shadow-xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold">{project?.name || 'Academic Core'}</p>
              <h3 className="text-2xl font-serif text-white">{team.name}</h3>
            </div>
          </div>
          
          <div className="space-y-4 pt-6 border-t border-white/5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-light italic">Condition</span>
              <span className={cn(
                "font-bold uppercase text-[9px] tracking-widest px-3 py-1 rounded-full border",
                team.riskLevel === 'high' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : 
                team.riskLevel === 'medium' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
              )}>{team.riskLevel} Risk</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-light italic">Effort Quota</span>
              <span className="font-mono text-indigo-400 font-bold">{team.effortEstimation}h</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreateTask} className="glass p-8 rounded-3xl border border-white/5 shadow-xl">
          <h4 className="text-white font-serif italic text-lg mb-6 flex items-center gap-3">
            <Plus className="w-4 h-4 text-indigo-400" />
            Commit Task
          </h4>
          <div className="flex gap-2">
            <input 
              className="flex-1 px-5 py-3 bg-white/5 text-white rounded-xl outline-none border border-white/5 focus:border-indigo-500 transition-all font-light placeholder:text-slate-600"
              placeholder="Actionable item..."
              value={newTaskTitle}
              onChange={e => setNewTaskTitle(e.target.value)}
            />
            <button className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Main Column: Task List */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-4xl font-serif text-white italic">Mission Track</h2>
          <div className="flex gap-3 text-[9px] uppercase tracking-widest font-bold">
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> {tasks.filter(t => t.status === 'todo').length} Pending
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 progress-glow" /> {tasks.filter(t => t.status === 'in-progress').length} Active
            </div>
            <div className="flex items-center gap-2 px-4 py-2 glass rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {tasks.filter(t => t.status === 'completed').length} Synced
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {tasks.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="group flex items-center justify-between glass p-6 rounded-2xl card-hover cursor-pointer"
                onClick={() => toggleTaskStatus(task)}
              >
                <div className="flex items-center gap-6">
                  {task.status === 'completed' ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  ) : task.status === 'in-progress' ? (
                    <Clock className="w-7 h-7 text-indigo-400 animate-pulse" />
                  ) : (
                    <Circle className="w-7 h-7 text-white/10" />
                  )}
                  <div>
                    <h5 className={cn(
                      "text-lg font-serif text-white transition-all",
                      task.status === 'completed' && "line-through opacity-30 italic"
                    )}>{task.title}</h5>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-2 uppercase tracking-tight">
                        <Clock className="w-3 h-3 opacity-50" />
                        Target: {format(new Date(task.deadline), 'MMM dd')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-5 h-5 text-indigo-400" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 glass rounded-3xl border-dashed border-white/5">
              <Layout className="w-12 h-12 mb-6 text-white/5" />
              <p className="text-slate-500 font-light italic">Task horizon is currently empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
