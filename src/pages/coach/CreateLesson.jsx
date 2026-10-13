import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../services/api";

export default function CreateLesson() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ courseId: "", title: "", description: "", contentType: "video", contentUrl: "", durationMinutes: "0", sortOrder: "0", dripDays: "0", status: "published", isPreview: false });

  useEffect(() => {
    let alive = true;
    api.get("/coach/courses").then((res) => {
      if (!alive) return;
      const list = res.courses || [];
      setCourses(list);
      setForm((prev) => ({ ...prev, courseId: prev.courseId || list[0]?.id || "" }));
    }).catch((err) => toast.error(err?.message || "Failed to load courses"));
    return () => { alive = false; };
  }, []);

  const change = (e) => { const { name, value, type, checked } = e.target; setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value })); };

  const submit = async (status = form.status) => {
    if (!form.courseId || !form.title.trim()) return toast.error("Course and lesson title required");
    setSaving(true);
    try {
      await api.post("/coach/lessons", { ...form, status, durationMinutes: Number(form.durationMinutes || 0), sortOrder: Number(form.sortOrder || 0), dripDays: Number(form.dripDays || 0) });
      toast.success(status === "published" ? "Lesson published" : "Lesson saved as draft");
      navigate("/coach/manage-lessons");
    } catch (err) {
      toast.error(err?.message || "Lesson save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20 pt-6 text-left">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Add New Lesson</h1>
        <p className="mt-1 text-sm text-gray-500">Create content for your course</p>
      </div>

      <div className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Select Course <span className="text-red-500">*</span>
          </label>
          <select
            name="courseId"
            value={form.courseId}
            onChange={change}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select a Course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={change}
            placeholder="e.g. Chapter 1: Introduction to Framework"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Lesson Summary / Instructions
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={change}
            placeholder="Short description or lesson overview..."
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Content Type
            </label>
            <select
              name="contentType"
              value={form.contentType}
              onChange={change}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="video">Video</option>
              <option value="document">Document</option>
              <option value="link">External Link</option>
              <option value="text">Text Lesson</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Duration (Min)
            </label>
            <input
              name="durationMinutes"
              type="number"
              min="0"
              value={form.durationMinutes}
              onChange={change}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Sort Order
            </label>
            <input
              name="sortOrder"
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={change}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-bold text-slate-700"
              title="Unlock days after enrollment (0 = immediate)"
            >
              Drip Days
            </label>
            <input
              name="dripDays"
              type="number"
              min="0"
              value={form.dripDays}
              onChange={change}
              placeholder="0"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Content URL / Stream Link
          </label>
          <input
            name="contentUrl"
            value={form.contentUrl}
            onChange={change}
            placeholder="Video / document / resource link URL"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Access Permission
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 transition">
            <input
              name="isPreview"
              type="checkbox"
              checked={form.isPreview}
              onChange={change}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
            />{" "}
            Allow free preview for enrolled / guest learners
          </label>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => submit("draft")}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition"
        >
          Save Draft
        </button>
        <button
          onClick={() => submit("published")}
          disabled={saving}
          className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
        >
          <Save size={16} /> {saving ? "Saving..." : "Publish Lesson"}
        </button>
      </div>
    </div>
  );
}
