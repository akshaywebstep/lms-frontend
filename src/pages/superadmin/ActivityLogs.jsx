import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ScrollText,
  Search,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Shield,
  GraduationCap,
  UserCheck,
  Globe,
  Clock,
  Laptop,
  Layers,
  X,
  FileCode,
} from 'lucide-react'
import api from '../../services/api'
import Pagination from '../../components/common/Pagination'
import { formatDate } from '../../utils/formatters'

export default function ActivityLogs() {
  const [logs, setLogs] = useState([])
  const [availableModules, setAvailableModules] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState(null)

  // Filters
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.append('page', page)
      params.append('limit', 15)
      if (roleFilter !== 'all') params.append('role', roleFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (moduleFilter !== 'all') params.append('module', moduleFilter)
      if (search.trim()) params.append('search', search.trim())

      const res = await api.get(`/admin/activity-logs?${params.toString()}`)
      const data = res?.data || res
      setLogs(data?.logs || [])
      if (data?.modules && Array.isArray(data.modules)) {
        setAvailableModules(data.modules)
      }
      if (data?.pagination) {
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error('Failed to load activity logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, statusFilter, moduleFilter, search])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Count stats
  const stats = useMemo(() => {
    let adminCount = 0
    let coachCount = 0
    let studentCount = 0
    let failedCount = 0
    logs.forEach((l) => {
      const r = (l.role || '').toLowerCase()
      if (r === 'superadmin' || r === 'admin') adminCount++
      else if (r === 'coach') coachCount++
      else if (r === 'student') studentCount++
      if (l.status === 'failed') failedCount++
    })
    return { adminCount, coachCount, studentCount, failedCount }
  }, [logs])

  const getRoleBadge = (role) => {
    const r = (role || '').toLowerCase()
    switch (r) {
      case 'superadmin':
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield size={12} className="text-purple-600" />
            Admin
          </span>
        )
      case 'coach':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck size={12} className="text-emerald-600" />
            Coach
          </span>
        )
      case 'student':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <GraduationCap size={12} className="text-blue-600" />
            Student
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Globe size={12} />
            {role || 'Guest'}
          </span>
        )
    }
  }

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase()
    if (s === 'success') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <CheckCircle2 size={12} />
          Success
        </span>
      )
    }
    if (s === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <AlertTriangle size={12} />
          Warning
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
        <XCircle size={12} />
        Failed
      </span>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ScrollText size={24} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Activity & Audit Logs</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time tracking of all actions taken across the platform by Admins, Coaches, and Students.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Logs</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{pagination.total || 0}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Layers size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Admin Actions</p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{stats.adminCount}</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Shield size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Coach Actions</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{stats.coachCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <UserCheck size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Student Actions</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{stats.studentCount}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <GraduationCap size={20} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action, description, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Roles</option>
              <option value="superadmin">Admin / Super Admin</option>
              <option value="coach">Coach</option>
              <option value="student">Student</option>
              <option value="guest">Guest / Public</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="failed">Failed</option>
            </select>

            {/* Module Filter (Fully Dynamic) */}
            <select
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-medium text-slate-700 capitalize"
            >
              <option value="all">All Modules</option>
              {availableModules.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/[-_]/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500 tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Action & Module</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading activity logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-12 text-center text-slate-400">
                    <ScrollText size={32} className="mx-auto mb-2 text-slate-300" />
                    No activity logs found matching the selected filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const user = log.user
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Column */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {user?.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase">
                              {(user?.name || user?.email || log.role || 'U').slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 leading-tight">
                              {user?.name || (log.user_id ? log.user_id.slice(0, 14) + '...' : 'System / Guest')}
                            </p>
                            <p className="text-xs text-slate-400 leading-tight mt-0.5">
                              {user?.email || '—'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">{getRoleBadge(log.role)}</td>

                      {/* Action & Module */}
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {log.action}
                          </span>
                          <p className="text-xs text-slate-400 mt-1 capitalize font-medium">{log.module}</p>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5 max-w-xs truncate" title={log.description}>
                        <span className="text-slate-800 text-xs font-normal">
                          {log.description || 'No description provided'}
                        </span>
                      </td>

                      {/* IP */}
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-500">
                        {log.ip_address || '—'}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">{getStatusBadge(log.status)}</td>

                      {/* Time */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock size={12} className="text-slate-400" />
                          <span>{formatDate(log.createdAt || log.created_at)}</span>
                        </div>
                      </td>

                      {/* Details View Button */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(p) => setPage(p)}
          loading={loading}
        />
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode size={20} className="text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Activity Log Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">Log ID</span>
                  <p className="font-mono text-slate-800 font-semibold">{selectedLog.id}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">Action</span>
                  <p className="font-mono text-slate-800 font-semibold">{selectedLog.action}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">User Role</span>
                  <div className="mt-0.5">{getRoleBadge(selectedLog.role)}</div>
                </div>
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">Status</span>
                  <div className="mt-0.5">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">IP Address</span>
                  <p className="font-mono text-slate-700">{selectedLog.ip_address || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-400 uppercase text-[10px]">Timestamp</span>
                  <p className="text-slate-700">{new Date(selectedLog.createdAt || selectedLog.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div>
                <span className="font-medium text-slate-500 uppercase text-[10px]">Description</span>
                <p className="mt-1 text-sm text-slate-800 p-3 bg-white border border-slate-200 rounded-lg">
                  {selectedLog.description || 'No description'}
                </p>
              </div>

              {selectedLog.user_agent && (
                <div>
                  <span className="font-medium text-slate-500 uppercase text-[10px]">User Agent</span>
                  <p className="mt-1 text-xs text-slate-600 font-mono break-all p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}

              <div>
                <span className="font-medium text-slate-500 uppercase text-[10px]">Metadata & Payload</span>
                <pre className="mt-1 p-3 bg-slate-900 text-emerald-400 rounded-lg font-mono text-xs overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.metadata, null, 2) || '{}'}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
