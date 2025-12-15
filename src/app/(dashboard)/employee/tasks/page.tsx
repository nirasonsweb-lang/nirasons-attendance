'use client';

import { useState, useEffect } from 'react';
import { Button, Badge, Spinner, EmptyState } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export default function EmployeeTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (res.ok) {
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
        ));
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setUpdating(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      default: return 'default';
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'pending': return 'in_progress';
      case 'in_progress': return 'completed';
      default: return null;
    }
  };

  const getStatusButtonText = (status: string) => {
    switch (status) {
      case 'pending': return 'Start Task';
      case 'in_progress': return 'Complete';
      default: return null;
    }
  };

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">My Tasks</h1>
        <p className="text-dark-300 mt-1">Manage and track your assigned tasks</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Total Tasks</p>
          <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-gray-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">In Progress</p>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-dark-800 rounded-xl p-4">
          <p className="text-dark-400 text-sm">Completed</p>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats.completed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-accent text-dark-900'
                : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-dark-800 rounded-xl py-12">
          <EmptyState
            icon={
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            title="No tasks found"
            description={filter === 'all' ? "You don't have any assigned tasks yet" : `No ${filter.replace('_', ' ')} tasks`}
          />
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <div key={task.id} className="bg-dark-800 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <Badge variant={getPriorityColor(task.priority) as 'default' | 'success' | 'warning' | 'error'}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status) as 'default' | 'success' | 'warning' | 'error'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {task.description && (
                    <p className="text-dark-300 mt-2">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-4 text-sm text-dark-400">
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) && task.status !== 'completed' ? 'text-red-400' : ''}`}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Due: {formatDate(task.dueDate)}</span>
                        {isOverdue(task.dueDate) && task.status !== 'completed' && (
                          <span className="text-red-400 ml-1">(Overdue)</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Created: {formatDate(task.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                {getNextStatus(task.status) && (
                  <Button
                    onClick={() => updateTaskStatus(task.id, getNextStatus(task.status)!)}
                    disabled={updating === task.id}
                    size="sm"
                  >
                    {updating === task.id ? (
                      <Spinner size="sm" />
                    ) : (
                      getStatusButtonText(task.status)
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
