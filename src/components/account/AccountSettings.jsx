import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Camera,
  Eye,
  EyeOff,
  Lock,
  Save,
  Trash2,
  User,
  Shield,
  CheckCircle2,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  MapPin,
  Clock,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { formatDateTime } from '../../utils/formatters'
import { resolveMediaUrl } from '../../utils/media'
import LocationSelector from '../common/LocationSelector'
import Pagination from '../common/Pagination'

const tabs = [
  { id: 'profile', label: 'Profile Details', icon: User, desc: 'Personal info & address' },
  { id: 'security', label: 'Password & Security', icon: Lock, desc: 'Login credentials' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Alerts & updates' },
]

export default function AccountSettings({
  title = 'Account Settings',
  subtitle = 'Manage your profile credentials, address details, and security preferences.',
}) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <div className="w-full text-left space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 capitalize border border-indigo-200/60">
                {user?.role || 'User'}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
              >
                <Icon size={16} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'profile' && <ProfileTab user={user} />}
      {activeTab === 'security' && <SecurityTab />}
      {activeTab === 'notifications' && <NotificationsTab />}
    </div>
  )
}

function ProfileTab({ user }) {
  const { updateUser } = useAuth()
  const inputRef = useRef(null)
  const [form, setForm] = useState({
    name: user?.name || '',
    title: user?.title || '',
    phone: user?.profile?.phone || '',
    country: user?.profile?.country || 'India',
    state: user?.profile?.state || '',
    city: user?.profile?.city || '',
    addressLine1: user?.profile?.addressLine1 || '',
    pincode: user?.profile?.pincode || '',
    bio: user?.profile?.bio || '',
    expertise: user?.profile?.expertise || '',
    education: user?.profile?.education || '',
  })
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [avatarFile, setAvatarFile] = useState(null)
  const [preview, setPreview] = useState(resolveMediaUrl(user?.avatar))
  const [saving, setSaving] = useState(false)
  const photoLocked = user?.role === 'student'

  useEffect(() => {
    setAvatar(user?.avatar || '')
    setPreview(resolveMediaUrl(user?.avatar))
  }, [user?.avatar])

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const handleLocationChange = ({ country, state, city }) => {
    setForm((p) => ({
      ...p,
      country,
      state,
      city,
    }))
  }

  const chooseAvatar = (e) => {
    if (photoLocked) {
      return toast.error('Student face photo can only be updated through support or coach approval')
    }
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select a valid image file')
    setAvatarFile(file)
    setAvatar('')
    setPreview(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    if (photoLocked) {
      return toast.error('Student face photo cannot be removed from this panel')
    }
    setAvatarFile(null)
    setAvatar(null)
    setPreview('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const uploadAvatar = async () => {
    if (!avatarFile) return avatar
    const data = new FormData()
    data.append('file', avatarFile)
    const res = await api.post('/upload/image', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.upload?.url || res.material?.url || ''
  }

  const save = async () => {
    setSaving(true)
    try {
      const avatarUrl = await uploadAvatar()
      const payload = {
        name: form.name,
        title: form.title,
        avatar: photoLocked ? user?.avatar || null : avatarUrl || null,
        profile: {
          phone: form.phone,
          country: form.country,
          state: form.state,
          city: form.city,
          addressLine1: form.addressLine1,
          pincode: form.pincode,
          bio: form.bio,
          expertise: form.expertise,
          education: form.education,
        },
      }
      const res = await api.put('/profile', payload)
      updateUser(res.user)
      setAvatarFile(null)
      setAvatar(res.user?.avatar || '')
      setPreview(resolveMediaUrl(res.user?.avatar))
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error(err?.message || 'Profile update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 text-left">
      {/* Avatar & Basic Identity Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md ring-4 ring-indigo-50">
            {preview ? (
              <img
                src={preview}
                alt={form.name || 'Profile'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-black tracking-wider">
                {(form.name || 'U')[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">{form.name || user?.email}</h3>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/60 capitalize">
                ● {user?.role || 'active'}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-slate-500">
              <Mail size={14} className="text-slate-400" />
              {user?.email}
            </p>

            <div className="pt-2">
              {photoLocked ? (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800 border border-amber-200/60">
                  <AlertCircle size={15} className="shrink-0 text-amber-600" />
                  <span>Student face photo is locked. Contact support or your coach to request an update.</span>
                </div>
              ) : (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Camera size={14} className="text-slate-500" />
                      {preview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    <button
                      type="button"
                      onClick={removeAvatar}
                      disabled={!preview && !avatarFile}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/50 px-3.5 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100/70 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={chooseAvatar}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Basic Profile Details */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-bold text-slate-900">Personal Information</h4>
          <p className="text-xs text-slate-500">Basic details about your account identity</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            name="name"
            icon={User}
            placeholder="John Doe"
            value={form.name}
            onChange={change}
          />
          <Field
            label="Title / Occupation"
            name="title"
            icon={Briefcase}
            placeholder="e.g. Senior Software Architect"
            value={form.title}
            onChange={change}
          />
          <Field
            label="Phone Number"
            name="phone"
            icon={Phone}
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={change}
          />

          {user?.role === 'coach' && (
            <>
              <Field
                label="Expertise / Domain"
                name="expertise"
                icon={Sparkles}
                placeholder="e.g. React, Node.js, Cloud"
                value={form.expertise}
                onChange={change}
              />
              <Field
                label="Education / Qualification"
                name="education"
                icon={GraduationCap}
                placeholder="e.g. B.Tech Computer Science"
                value={form.education}
                onChange={change}
              />
            </>
          )}
        </div>
      </div>

      {/* Dynamic Location Details */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-bold text-slate-900">Location & Address</h4>
          <p className="text-xs text-slate-500">Where you are currently based</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <LocationSelector
            country={form.country}
            state={form.state}
            city={form.city}
            onChange={handleLocationChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Field
              label="Street Address / House No."
              name="addressLine1"
              icon={MapPin}
              placeholder="e.g. 104, Tech Park Avenue"
              value={form.addressLine1}
              onChange={change}
            />
          </div>
          <div>
            <Field
              label="Pincode / Postal Code"
              name="pincode"
              placeholder="e.g. 110001"
              value={form.pincode}
              onChange={change}
            />
          </div>
        </div>
      </div>

      {/* Bio / Summary */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-3">
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-base font-bold text-slate-900">About / Biography</h4>
          <p className="text-xs text-slate-500">Brief summary displayed across the LMS</p>
        </div>

        <textarea
          name="bio"
          value={form.bio}
          onChange={change}
          rows={4}
          placeholder="Write a brief overview about yourself, your goals, or teaching background..."
          className="w-full resize-none rounded-xl border border-slate-300 px-3.5 py-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
        />
      </div>

      {/* Action Footer */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? 'Saving changes...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

function SecurityTab() {
  const [show, setShow] = useState({ old: false, new: false, confirm: false })
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)

  const toggle = (key) => setShow((p) => ({ ...p, [key]: !p[key] }))
  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const submit = async () => {
    if (!form.oldPassword || !form.newPassword) return toast.error('Old and new password required')
    if (form.newPassword !== form.confirmPassword) return toast.error('Confirm password does not match')
    setSaving(true)
    try {
      await api.post('/auth/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      })
      setForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('Password updated successfully')
    } catch (err) {
      toast.error(err?.message || 'Password update failed')
    } finally {
      setSaving(false)
    }
  }

  const fields = [
    { label: 'Current Password', key: 'old', name: 'oldPassword', placeholder: 'Enter your existing password' },
    { label: 'New Password', key: 'new', name: 'newPassword', placeholder: 'At least 8 characters' },
    { label: 'Confirm New Password', key: 'confirm', name: 'confirmPassword', placeholder: 'Re-enter new password' },
  ]

  return (
    <div className="space-y-6 text-left">
      <div className="max-w-2xl rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Update Password</h3>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ensure your account is using a long, random password to stay secure.
          </p>
        </div>

        <div className="space-y-4">
          {fields.map(({ label, key, name, placeholder }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                {label}
              </label>
              <div className="relative">
                <input
                  name={name}
                  value={form[name]}
                  onChange={change}
                  type={show[key] ? 'text' : 'password'}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-700">Password Requirements:</p>
          <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
            <li>Minimum 8 characters</li>
            <li>Should not match your old password</li>
            <li>Recommended to combine letters, numbers, and symbols</li>
          </ul>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            <Save size={16} />
            {saving ? 'Updating password...' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await api.get('/notifications')
      setItems(res.notifications || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = setInterval(load, 5000)
    return () => clearInterval(timer)
  }, [])

  const totalPages = Math.ceil(items.length / pageSize) || 1
  const paginatedItems = items.slice((page - 1) * pageSize, page * pageSize)

  const markSingle = async (id, e) => {
    if (e) e.stopPropagation()
    try {
      await api.patch(`/notifications/${id}/read`)
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true, isRead: true } : item))
      )
      toast.success('Marked as read')
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all')
      setItems((prev) =>
        prev.map((item) => ({ ...item, is_read: true, isRead: true }))
      )
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const unreadCount = items.filter((i) => !i.is_read && !i.isRead).length

  return (
    <div className="space-y-6 text-left">
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Activity & Alerts</h3>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-200">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
              {/* <p className="mt-1 text-xs text-slate-500">
                Live alerts updating automatically every 5 seconds
              </p> */}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAll}
                  className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                >
                  Mark All as Read
                </button>
              )}
              {items.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                  {items.length} Total
                </span>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading notifications...</div>
        ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                <Bell size={22} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">No notifications yet</p>
              <p className="text-xs text-slate-400">You're all caught up with your platform updates.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedItems.map((item) => {
                const isUnread = !item.is_read && !item.isRead
                return (
                  <div
                    key={item.id}
                    onClick={() => isUnread && markSingle(item.id)}
                    className={`p-5 transition hover:bg-slate-50/70 cursor-pointer ${isUnread ? 'bg-indigo-50/25' : ''
                      }`}
                  >
                      <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isUnread
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-indigo-50 text-indigo-600'
                          }`}
                      >
                        <Bell size={15} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                          )}
                          <p
                            className={`text-sm ${isUnread
                                ? 'font-bold text-slate-950'
                                : 'font-semibold text-slate-800'
                              }`}
                          >
                            {item.title}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                          {item.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Clock size={12} />
                        {item.created_at ? formatDateTime(item.created_at) : ''}
                      </span>
                      {isUnread && (
                        <button
                          type="button"
                          onClick={(e) => markSingle(item.id, e)}
                          className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 transition shadow-xs"
                        >
                          Mark Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={items.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}

function Field({ label, icon: Icon, ...props }) {
  return (
    <label className="block text-left">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
      </span>
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        )}
        <input
          {...props}
          className={`w-full rounded-xl border border-slate-300 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-100 ${Icon ? 'pl-10 pr-3.5' : 'px-3.5'
            }`}
        />
      </div>
    </label>
  )
}