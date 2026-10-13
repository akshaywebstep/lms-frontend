import { useEffect, useMemo, useState } from "react";
import { Edit2, Plus, Save, Tag, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { confirmDialog } from "../../utils/dialogs";

export default function ManageTopics() {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [topics, setTopics] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [courseRes, lessonRes, topicRes] = await Promise.all([api.get("/coach/courses"), api.get("/coach/lessons"), api.get("/coach/topics")]);
      setCourses(courseRes.courses || []);
      setLessons(lessonRes.lessons || []);
      setTopics(topicRes.topics || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load topics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filteredLessons = useMemo(() => selectedCourse === "All" ? lessons : lessons.filter((lesson) => lesson.courseId === selectedCourse), [lessons, selectedCourse]);
  const filteredTopics = useMemo(() => selectedCourse === "All" ? topics : topics.filter((topic) => topic.course?.id === selectedCourse), [topics, selectedCourse]);

  const remove = async (id) => {
    const ok = await confirmDialog({ title: "Delete topic?", message: "This topic will be removed from the lesson.", confirmText: "Delete Topic", tone: "danger" });
    if (!ok) return;
    try {
      await api.delete(`/coach/topics/${id}`);
      toast.success("Topic deleted");
      load();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><h2 className="text-2xl font-bold text-gray-800">Manage Topics</h2><p className="mt-1 text-sm text-gray-500">{loading ? "Loading topics..." : `${filteredTopics.length} topic(s) found`}</p></div><button onClick={() => { setEditing(null); setShowModal(true); }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"><Plus size={18} /> Add Topic</button></div>
      <div className="rounded-2xl bg-white p-4 shadow-sm"><select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="All">All Courses</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select></div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm"><table className="w-full text-sm"><thead className="bg-gray-50 text-left text-xs font-bold uppercase text-gray-500"><tr><th className="px-5 py-3">Topic</th><th className="px-5 py-3">Lesson</th><th className="px-5 py-3">Course</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Actions</th></tr></thead><tbody className="divide-y divide-gray-100">{loading ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">Loading...</td></tr> : filteredTopics.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-gray-400">No topics found</td></tr> : filteredTopics.map((topic) => <tr key={topic.id} className="hover:bg-gray-50"><td className="px-5 py-3"><div className="flex items-center gap-2"><Tag size={15} className="text-indigo-500" /><span className="font-semibold text-gray-800">{topic.title}</span></div></td><td className="px-5 py-3 text-gray-600">{topic.lesson?.title || "-"}</td><td className="px-5 py-3 text-gray-600">{topic.course?.title || "-"}</td><td className="px-5 py-3 text-gray-600">{topic.sortOrder || 0}</td><td className="px-5 py-3"><div className="flex gap-1"><button onClick={() => { setEditing(topic); setShowModal(true); }} className="rounded-lg p-1.5 hover:bg-indigo-50"><Edit2 size={14} className="text-indigo-500" /></button><button onClick={() => remove(topic.id)} className="rounded-lg p-1.5 hover:bg-red-50"><Trash2 size={14} className="text-red-500" /></button></div></td></tr>)}</tbody></table></div>
      {showModal && <TopicModal lessons={filteredLessons.length ? filteredLessons : lessons} topic={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />}
    </div>
  );
}

function TopicModal({ lessons, topic, onClose, onSaved }) {
  const [form, setForm] = useState(() => topic ? { lessonId: topic.lessonId, title: topic.title, body: topic.body || "", sortOrder: String(topic.sortOrder || 0) } : { lessonId: lessons[0]?.id || "", title: "", body: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);
  const change = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const submit = async () => {
    if (!form.lessonId || !form.title.trim()) return toast.error("Lesson and topic title required");
    setSaving(true);
    try {
      const payload = { ...form, sortOrder: Number(form.sortOrder || 0) };
      if (topic) await api.put(`/coach/topics/${topic.id}`, payload); else await api.post("/coach/topics", payload);
      toast.success(topic ? "Topic updated" : "Topic created");
      onSaved();
    } catch (err) {
      toast.error(err?.message || "Topic save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm text-left">
      <div className="flex flex-col max-h-[86vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0 bg-white">
          <h3 className="font-bold text-slate-900 text-base">
            {topic ? "Edit Topic" : "Add Topic"}
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 p-6">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Select Lesson <span className="text-red-500">*</span>
            </label>
            <select
              name="lessonId"
              value={form.lessonId}
              onChange={change}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">Select lesson...</option>
              {lessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.course?.title ? `${lesson.course.title} - ` : ""}
                  {lesson.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Topic Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={change}
              placeholder="e.g. Sub-concept: Props Destructuring"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">
              Topic Notes / Explanation
            </label>
            <textarea
              name="body"
              value={form.body}
              onChange={change}
              rows={4}
              placeholder="Topic explanation, notes, or bullet points..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
        </div>

        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-sm"
          >
            <Save size={15} /> {saving ? "Saving..." : "Save Topic"}
          </button>
        </div>
      </div>
    </div>
  );
}
