import { useState, useEffect } from 'react'
import {
  Mail,
  Plus,
  Search,
  Settings,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowLeft,
  X,
  Server,
  RefreshCw,
  ShieldCheck,
  Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import EmailBuilder from '../../components/email/EmailBuilder'
import Pagination from '../../components/common/Pagination'

export default function EmailTemplates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeModule, setActiveModule] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 9
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [smtpModal, setSmtpModal] = useState(false)
  const [newTemplateModal, setNewTemplateModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [smtpConfig, setSmtpConfig] = useState({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_username: 'kapilakshu848@gmail.com',
    smtp_password: '',
    from_email: 'kapilakshu848@gmail.com',
    from_name: 'LearnFlow',
  })

  const [newTemplateData, setNewTemplateData] = useState({
    module: 'student',
    action: '',
    subject: '',
    variables: ['name', 'appName', 'loginUrl'],
  })

  const applyPreset = (preset) => {
    if (preset === 'gmail') {
      setSmtpConfig((prev) => ({
        ...prev,
        smtp_host: 'smtp.gmail.com',
        smtp_port: 465,
        smtp_secure: true,
      }))
    } else if (preset === 'outlook') {
      setSmtpConfig((prev) => ({
        ...prev,
        smtp_host: 'smtp.office365.com',
        smtp_port: 587,
        smtp_secure: false,
      }))
    }
  }

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/email-templates?module=${activeModule}`)
      setTemplates(res.templates || [])
      if (res.templates && res.templates.length > 0) {
        const first = res.templates[0]
        setSmtpConfig({
          smtp_host: first.smtp_host || 'smtp.gmail.com',
          smtp_port: first.smtp_port || 465,
          smtp_secure: Boolean(first.smtp_secure),
          smtp_username: first.smtp_username || '',
          smtp_password: first.smtp_password || '',
          from_email: first.from_email || '',
          from_name: first.from_name || 'LearnFlow',
        })
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [activeModule])

  const handleEdit = (tmpl) => {
    setSelectedTemplate(tmpl)
    setIsEditing(true)
  }

  const handleSaveTemplate = async ({ subject, html_template }) => {
    if (!selectedTemplate) return
    setIsSaving(true)
    try {
      await api.put(`/email-templates/${selectedTemplate.id}`, {
        subject,
        html_template,
      })
      toast.success('Email template saved successfully')
      setIsEditing(false)
      fetchTemplates()
    } catch (err) {
      toast.error(err?.message || 'Failed to save email template')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestSend = async (toEmail, draftData = {}) => {
    if (!selectedTemplate) return
    await api.post(`/email-templates/${selectedTemplate.id}/test-send`, {
      to: toEmail,
      subject: draftData.subject,
      html_template: draftData.html_template,
    })
  }

  const handleToggleStatus = async (tmpl) => {
    try {
      const newStatus = tmpl.status === 1 ? 0 : 1
      await api.put(`/email-templates/${tmpl.id}`, { status: newStatus })
      setTemplates((prev) =>
        prev.map((t) => (t.id === tmpl.id ? { ...t, status: newStatus } : t))
      )
      toast.success(`Template ${newStatus === 1 ? 'Enabled' : 'Disabled'}`)
    } catch (err) {
      toast.error(err?.message || 'Failed to update template status')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) return
    try {
      await api.delete(`/email-templates/${id}`)
      toast.success('Email template deleted')
      fetchTemplates()
    } catch (err) {
      toast.error(err?.message || 'Failed to delete template')
    }
  }

  const handleSaveSmtp = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // Update all templates with new SMTP settings
      await Promise.all(
        templates.map((t) =>
          api.put(`/email-templates/${t.id}`, {
            smtp_host: smtpConfig.smtp_host,
            smtp_port: Number(smtpConfig.smtp_port),
            smtp_secure: smtpConfig.smtp_secure,
            smtp_username: smtpConfig.smtp_username,
            smtp_password: smtpConfig.smtp_password,
            from_email: smtpConfig.from_email,
            from_name: smtpConfig.from_name,
          })
        )
      )
      toast.success('SMTP Configuration applied to all templates')
      setSmtpModal(false)
      fetchTemplates()
    } catch (err) {
      toast.error(err?.message || 'Failed to update SMTP settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCreateNewTemplate = async (e) => {
    e.preventDefault()
    if (!newTemplateData.action || !newTemplateData.subject) {
      return toast.error('Action identifier and subject are required')
    }
    try {
      const res = await api.post('/email-templates', newTemplateData)
      toast.success('New email template created')
      setNewTemplateModal(false)
      fetchTemplates()
      if (res?.template) {
        handleEdit(res.template)
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to create email template')
    }
  }

  const filteredTemplates = templates.filter((t) => {
    const matchesModule = activeModule === 'all' || t.module === activeModule
    const matchesSearch =
      (t.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.action || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesModule && matchesSearch
  })

  useEffect(() => {
    setPage(1)
  }, [activeModule, searchQuery])

  const totalPages = Math.ceil(filteredTemplates.length / pageSize) || 1
  const paginatedTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize)

  // If editing a template in builder
  if (isEditing && selectedTemplate) {
    return (
      <div className="space-y-4">
        {/* Navigation Breadcrumb & Back Action */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100 hover:text-emerald-600"
            >
              <ArrowLeft size={14} /> Back to Templates List
            </button>
            <span className="text-slate-300">/</span>
            <span className="capitalize text-slate-700">{selectedTemplate.module} Module</span>
            <span className="text-slate-300">/</span>
            <span className="font-mono text-emerald-600">{selectedTemplate.action}</span>
          </div>
        </div>

        {/* Visual Builder Container */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[780px]">
          <EmailBuilder
            title={`Edit Template: ${selectedTemplate.action}`}
            action={selectedTemplate.action}
            initialSubject={selectedTemplate.subject}
            initialHtml={selectedTemplate.html_template}
            initialVariables={selectedTemplate.variables || []}
            onSave={handleSaveTemplate}
            onTestSend={handleTestSend}
            isSaving={isSaving}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Mail size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Email Templates & Automation</h1>
            <p className="text-xs text-slate-500">
              Design, customize, and test automated emails with visual drag & drop builder
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSmtpModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition"
          >
            <Server size={14} className="text-emerald-600" /> SMTP Settings
          </button>
          <button
            onClick={() => setNewTemplateModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 transition"
          >
            <Plus size={14} /> Create Template
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'student', label: 'Student Emails' },
            { id: 'coach', label: 'Coach Emails' },
            { id: 'admin', label: 'Admin Notifications' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                activeModule === tab.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3.5 text-xs text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="mt-3 text-xs font-semibold">Loading templates...</p>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Mail className="mx-auto text-slate-300" size={40} />
          <h3 className="mt-3 text-sm font-bold text-slate-800">No Email Templates Found</h3>
          <p className="mt-1 text-xs text-slate-500">Create a new template to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedTemplates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          tmpl.module === 'student'
                            ? 'bg-emerald-50 text-emerald-700'
                            : tmpl.module === 'coach'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-purple-50 text-purple-700'
                        }`}
                      >
                        {tmpl.module}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-700">{tmpl.action}</span>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(tmpl)}
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        tmpl.status === 1
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {tmpl.status === 1 ? (
                        <>
                          <CheckCircle2 size={11} /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={11} /> Disabled
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-3">
                    <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{tmpl.subject}</h3>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(Array.isArray(tmpl.variables) ? tmpl.variables : []).slice(0, 3).map((v) => (
                      <span
                        key={v}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                    {(Array.isArray(tmpl.variables) ? tmpl.variables : []).length > 3 && (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                        +{(Array.isArray(tmpl.variables) ? tmpl.variables : []).length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={() => handleEdit(tmpl)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <Edit size={13} /> Visual Builder
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedTemplate(tmpl)
                        setIsEditing(true)
                      }}
                      title="Preview"
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(tmpl.id)}
                      title="Delete Template"
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredTemplates.length}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      {/* SMTP Configuration Drawer / Modal */}
      {smtpModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col max-h-[92vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/80">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                  <Server size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Platform SMTP Server Settings</h3>
                  <p className="text-xs text-slate-500">Configure outbound email credentials for system notifications</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmtpModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-emerald-50/30 px-6 py-2.5">
              <span className="text-xs font-semibold text-slate-600">Quick Provider Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('gmail')}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shadow-xs"
                >
                  Gmail (465 SSL)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('outlook')}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition shadow-xs"
                >
                  Outlook / Office 365
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveSmtp} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(92vh-180px)]">
                {/* Host & Port */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      SMTP Host <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. smtp.gmail.com"
                      value={smtpConfig.smtp_host}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_host: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Port <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="465 or 587"
                      value={smtpConfig.smtp_port}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_port: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    SMTP Username / Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. your-account@gmail.com"
                    value={smtpConfig.smtp_username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_username: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                {/* Password / App Key */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      SMTP Password / App Key
                    </label>
                    <span className="text-[11px] text-slate-400">For Gmail, use 16-character App Password</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={smtpConfig.smtp_password}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_password: e.target.value })}
                      placeholder="Enter SMTP App Password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Sender Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Sender Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g. LearnFlow"
                      value={smtpConfig.from_name}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, from_name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">Sender Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. notifications@learnflow.com"
                      value={smtpConfig.from_email}
                      onChange={(e) => setSmtpConfig({ ...smtpConfig, from_email: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>
                </div>

                {/* SSL / TLS Checkbox */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 cursor-pointer hover:bg-slate-100/60 transition">
                  <input
                    type="checkbox"
                    id="smtp_secure"
                    checked={smtpConfig.smtp_secure}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, smtp_secure: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Enable SSL / TLS Secure Connection
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check this when using Port 465 (SSL). For Port 587, leave unchecked for STARTTLS upgrade.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setSmtpModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-sm shadow-emerald-600/20 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Apply SMTP Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Template Modal */}
      {newTemplateModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/70 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex flex-col max-h-[86vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200/80">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Create New Email Template</h3>
                  <p className="text-xs text-slate-500">Define template identifier, subject, and audience module</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewTemplateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTemplate} className="flex flex-col flex-1">
              <div className="p-6 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">Target Module</label>
                  <select
                    value={newTemplateData.module}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, module: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 capitalize"
                  >
                    <option value="student">Student</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Action Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. course-completed, invoice-generated"
                    value={newTemplateData.action}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, action: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Unique slug used in code to trigger this template</p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Email Subject <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Congratulations! You completed {{courseName}}"
                    value={newTemplateData.subject}
                    onChange={(e) => setNewTemplateData({ ...newTemplateData, subject: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setNewTemplateModal(false)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Sparkles size={14} /> Create & Launch Builder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
