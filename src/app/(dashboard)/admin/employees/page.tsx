'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Input, Modal, Badge, Spinner, EmptyState } from '@/components/ui';
import type { User } from '@/types';

interface EmployeeWithStats extends User {
  _count?: { attendances: number };
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeWithStats | null>(null);
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    department: '',
    position: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees');
      const data = await res.json();
      if (res.ok) {
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const url = editingEmployee
        ? `/api/employees/${editingEmployee.id}`
        : '/api/employees';
      const method = editingEmployee ? 'PATCH' : 'POST';

      const body = editingEmployee
        ? { name: formData.name, phone: formData.phone, department: formData.department, position: formData.position }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      setShowModal(false);
      setFormData({ email: '', password: '', name: '', phone: '', department: '', position: '' });
      setEditingEmployee(null);
      fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (employee: EmployeeWithStats) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: '',
      name: employee.name,
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
    });
    setShowModal(true);
  };

  const handleToggleActive = async (employee: EmployeeWithStats) => {
    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !employee.isActive }),
      });

      if (res.ok) {
        fetchEmployees();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Employees</h1>
          <p className="text-gray-400">Manage your organization&apos;s employees</p>
        </div>
        <Button onClick={() => { setEditingEmployee(null); setFormData({ email: '', password: '', name: '', phone: '', department: '', position: '' }); setShowModal(true); }}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </Button>
      </div>

      {/* Search */}
      <Card>
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-500">
                  <th className="table-header pb-3 pl-0">Employee</th>
                  <th className="table-header pb-3">Department</th>
                  <th className="table-header pb-3">Position</th>
                  <th className="table-header pb-3">Phone</th>
                  <th className="table-header pb-3">Status</th>
                  <th className="table-header pb-3 pr-0 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-dark-600 last:border-0 hover:bg-dark-600/50 transition-colors">
                    <td className="table-cell pl-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-medium">
                          {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-white">{employee.name}</p>
                          <p className="text-xs text-gray-500">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">{employee.department || '-'}</td>
                    <td className="table-cell">{employee.position || '-'}</td>
                    <td className="table-cell">{employee.phone || '-'}</td>
                    <td className="table-cell">
                      <Badge variant={employee.isActive ? 'success' : 'error'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="table-cell pr-0">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/admin/employees/${employee.id}`)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-dark-500 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="p-2 text-gray-400 hover:text-accent-primary hover:bg-dark-500 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(employee)}
                          className={`p-2 rounded-lg transition-colors ${employee.isActive ? 'text-gray-400 hover:text-status-error hover:bg-dark-500' : 'text-gray-400 hover:text-status-success hover:bg-dark-500'}`}
                          title={employee.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {employee.isActive ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No employees found"
            description="Get started by adding your first employee"
            icon={
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            action={
              <Button onClick={() => setShowModal(true)}>Add Employee</Button>
            }
          />
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEmployee(null); setError(''); }}
        title={editingEmployee ? 'Edit Employee' : 'Add New Employee'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          {!editingEmployee && (
            <>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
            <Input
              label="Position"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {error && (
            <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => { setShowModal(false); setEditingEmployee(null); }}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingEmployee ? 'Update' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
