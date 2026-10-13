import { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  Layers3,
  Plus,
  Search,
  Trash2,
  X,
  BookOpen,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import Pagination from "../../components/common/Pagination";

const tabs = [
  { type: "category", key: "categories", label: "Categories" },
  { type: "difficulty", key: "difficulties", label: "Difficulty Levels" },
  { type: "language", key: "languages", label: "Languages" },
];

const emptyForm = { name: "", status: "active" };

export default function ManageMasterData() {
  const [activeTab, setActiveTab] = useState("category");
  const [data, setData] = useState({
    categories: [],
    difficulties: [],
    languages: [],
  });
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const active = tabs.find((tab) => tab.type === activeTab) || tabs[0];
  const rows = data[active.key] || [];

  // Reset page when switching tabs or search
  useEffect(() => {
    setPage(1);
  }, [activeTab, q]);

  // ─── Filtered rows with multi-field search ──────────────────────────────────
  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        const creatorName =
          typeof item.createdBy === "object"
            ? item.createdBy?.name || ""
            : item.creatorRole || "";
        return `${item.name} ${creatorName} ${item.creatorRole || ""} ${item.status}`
          .toLowerCase()
          .includes(q.toLowerCase());
      }),
    [rows, q],
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // ─── Top KPI Statistics ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = rows.length;
    const activeCount = rows.filter((r) => r.status === "active").length;
    const coachContributed = rows.filter(
      (r) => r.creatorRole === "coach" || (r.createdBy && typeof r.createdBy === "object"),
    ).length;
    const usedInCourses = rows.filter((r) => Number(r.usedCourses || 0) > 0).length;

    return { total, activeCount, coachContributed, usedInCourses };
  }, [rows]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/master-data");
      setData({
        categories: res.categories || [],
        difficulties: res.difficulties || [],
        languages: res.languages || [],
      });
    } catch (err) {
      toast.error(err?.message || "Failed to load master data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({ name: item.name || "", status: item.status || "active" });
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Name is required");
    setSaving(true);
    try {
      if (editing)
        await api.put(`/admin/master-data/${activeTab}/${editing.id}`, form);
      else await api.post(`/admin/master-data/${activeTab}`, form);
      toast.success(editing ? "Value updated successfully" : "Value created successfully");
      reset();
      await load();
    } catch (err) {
      toast.error(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // ─── Quick One-Click Status Toggle ──────────────────────────────────────────
  const toggleStatus = async (item) => {
    const nextStatus = item.status === "active" ? "inactive" : "active";
    setTogglingId(item.id);
    try {
      await api.put(`/admin/master-data/${activeTab}/${item.id}`, {
        name: item.name,
        status: nextStatus,
      });
      toast.success(`${item.name} set to ${nextStatus}`);
      await load();
    } catch (err) {
      toast.error(err?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const remove = async (item) => {
    if (
      !window.confirm(
        `Delete "${item.name}"? Existing courses will keep this text value.`,
      )
    )
      return;
    try {
      await api.delete(`/admin/master-data/${activeTab}/${item.id}`);
      toast.success("Value deleted successfully");
      await load();
      if (editing?.id === item.id) reset();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  // ─── Render Created By Badge Helper ─────────────────────────────────────────
  const renderCreatorBadge = (item) => {
    const creator = typeof item.createdBy === "object" ? item.createdBy : null;
    const isCoach = item.creatorRole === "coach" || Boolean(creator?.name);
    const isSystem = item.creatorRole === "system" && !creator?.name;

    if (creator?.name) {
      return (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-700 shadow-sm">
            {creator.name[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{creator.name}</p>
            <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-1.5 py-0.2 text-[10px] font-bold text-purple-700">
              <Sparkles size={10} /> Coach Created
            </span>
          </div>
        </div>
      );
    }

    if (isCoach) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 ring-1 ring-purple-200">
          <Users size={12} /> Coach Contributed
        </span>
      );
    }

    if (isSystem) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          <ShieldCheck size={12} className="text-slate-500" /> System Defaults
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
        <ShieldCheck size={12} /> Platform Admin
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ─── Header & Tab Switcher ────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Course Master Data
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage categories, difficulty levels, and languages used by courses.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.type}
              onClick={() => {
                setActiveTab(tab.type);
                reset();
              }}
              className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${activeTab === tab.type
                  ? "bg-slate-950 text-white shadow"
                  : "text-slate-500 hover:bg-slate-50"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Top KPI Statistics Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total {active.label}
          </p>
          <p className="mt-1.5 text-2xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Active Status
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-2xl font-black text-emerald-600">{stats.activeCount}</span>
            <span className="text-xs font-bold text-slate-400">
              / {stats.total - stats.activeCount} inactive
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Coach Created
          </p>
          <p className="mt-1.5 text-2xl font-black text-purple-600">
            {stats.coachContributed}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Used In Courses
          </p>
          <p className="mt-1.5 text-2xl font-black text-indigo-600">
            {stats.usedInCourses}
          </p>
        </div>
      </div>

      {/* ─── Add / Edit Master Data Form ──────────────────────────────────── */}
      <form
        onSubmit={save}
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-black text-slate-900">
            <Layers3 size={18} className="text-emerald-600" />{" "}
            {editing ? `Edit ${active.label}` : `Add New ${active.label}`}
          </h3>
          {editing && (
            <button
              type="button"
              onClick={reset}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Cancel Edit"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto] items-end">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              {active.label} Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={`Enter ${active.label.toLowerCase()} name (e.g. Full Stack, Python)...`}
              className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Publish Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            <Plus size={16} />{" "}
            {saving ? "Saving..." : editing ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {/* ─── Search Bar ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${active.label.toLowerCase()} by name, creator, or status...`}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ─── Master Data Table ────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm text-left table-fixed">
            <thead className="bg-slate-50 border-b border-slate-100 text-left">
              <tr>
                <th className="w-[23%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="w-[15%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="w-[25%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Created By
                </th>
                <th className="w-[16%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Used Courses
                </th>
                <th className="w-[13%] px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  Created Date
                </th>
                <th className="w-[8%] px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-left">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400 font-medium"
                  >
                    Loading master data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-400 font-medium"
                  >
                    <BookOpen size={28} className="mx-auto mb-2 opacity-30" />
                    No {active.label.toLowerCase()} found matching "{q}"
                  </td>
                </tr>
              ) : (
                paginatedRows.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="text-left px-5 py-3.5 font-black text-slate-900">
                      {item.name}
                    </td>
                    <td className="text-left px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        disabled={togglingId === item.id}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition hover:opacity-80 disabled:opacity-50 ${
                          item.status === "active"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
                        }`}
                      >
                        <CheckCircle2 size={11} />
                        {item.status === "active" ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="text-left px-5 py-3.5">
                      {renderCreatorBadge(item)}
                    </td>
                    <td className="text-left px-5 py-3.5 font-bold text-slate-700">
                      {Number(item.usedCourses || 0) > 0 ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200">
                          <BookOpen size={11} />
                          {item.usedCourses}{" "}
                          {item.usedCourses === 1 ? "Course" : "Courses"}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          0 Courses
                        </span>
                      )}
                    </td>
                    <td className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="text-right px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(item)}
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}