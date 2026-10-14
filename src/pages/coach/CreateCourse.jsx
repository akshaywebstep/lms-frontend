import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, ChevronRight, Film, ImageIcon, Info, Link as LinkIcon, Plus, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import CourseMedia from "../../components/common/CourseMedia";
import RichTextEditor from "../../components/common/RichTextEditor";
import { resolveMediaUrl } from "../../utils/media";
import { isRichTextEmpty, sanitizeRichText } from "../../utils/richText";
import { getVideoEmbedUrl, isDirectVideoUrl } from "../../utils/video";

const fallbackMaster = {
  categories: [{ name: "Web Development" }, { name: "Backend" }, { name: "Design" }, { name: "Database" }, { name: "Mobile" }, { name: "Data Science" }, { name: "DevOps" }],
  difficulties: [{ name: "Beginner" }, { name: "Intermediate" }, { name: "Advanced" }],
  languages: [{ name: "Hindi" }, { name: "English" }, { name: "Hinglish" }],
};

const initialForm = {
  title: "",
  category: "",
  difficulty: "Beginner",
  language: "Hinglish",
  description: "",
  price: "999",
  status: "published",
  thumbnail: null,
  promoVideoFile: null,
  promoVideo: "",
  requirements: "",
  outcomes: "",
};

const optionNames = (items, fallbackItems) => {
  const names = (items?.length ? items : fallbackItems).map((item) => item.name || item).filter(Boolean);
  return [...new Set(names)];
};

const canPreviewVideo = (url) => Boolean(url && (isDirectVideoUrl(url) || getVideoEmbedUrl(url)));

export default function CreateCourse() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(Boolean(id));
  const [masterData, setMasterData] = useState(fallbackMaster);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    let alive = true;
    api.get("/master-data").then((res) => {
      if (!alive) return;
      setMasterData({
        categories: res.categories?.length ? res.categories : fallbackMaster.categories,
        difficulties: res.difficulties?.length ? res.difficulties : fallbackMaster.difficulties,
        languages: res.languages?.length ? res.languages : fallbackMaster.languages,
      });
    }).catch(() => setMasterData(fallbackMaster));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    setLoadingCourse(true);
    api.get(`/coach/courses/${id}`).then((res) => {
      if (!alive) return;
      const course = res.course || {};
      setForm({
        ...initialForm,
        title: course.title || "",
        category: course.category || "",
        difficulty: course.difficulty || "Beginner",
        language: course.language || "Hinglish",
        description: course.description || "",
        price: String(course.price ?? "999"),
        status: course.status || "published",
        promoVideo: course.promoVideo || "",
        requirements: (course.requirements || []).join("\n"),
        outcomes: (course.outcomes || []).join("\n"),
      });
      setPreview(resolveMediaUrl(course.thumbnailUrl) || null);
      setVideoPreview(resolveMediaUrl(course.promoVideo) || course.promoVideo || "");
    }).catch((err) => {
      toast.error(err?.message || "Failed to load course");
      navigate("/coach/my-courses");
    }).finally(() => { if (alive) setLoadingCourse(false); });
    return () => { alive = false; };
  }, [id, navigate]);

  const categories = useMemo(() => optionNames(masterData.categories, fallbackMaster.categories), [masterData.categories]);
  const difficulties = useMemo(() => optionNames(masterData.difficulties, fallbackMaster.difficulties), [masterData.difficulties]);
  const languages = useMemo(() => optionNames(masterData.languages, fallbackMaster.languages), [masterData.languages]);

  const change = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "promoVideo" && !form.promoVideoFile) setVideoPreview(value);
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleThumb = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, thumbnail: file, removeThumbnail: false }));
    setPreview(URL.createObjectURL(file));
    if (errors.thumbnail) setErrors((p) => ({ ...p, thumbnail: "" }));
  };

  const removeThumb = () => {
    setForm((p) => ({ ...p, thumbnail: null, removeThumbnail: true }));
    setPreview(null);
  };

  const handleVideo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, promoVideoFile: file, promoVideo: "", removePromoVideo: false }));
    setVideoPreview(URL.createObjectURL(file));
    if (errors.promoVideo) setErrors((p) => ({ ...p, promoVideo: "" }));
  };

  const removeVideo = () => {
    setForm((p) => ({ ...p, promoVideoFile: null, promoVideo: "", removePromoVideo: true }));
    setVideoPreview("");
  };

  const uploadFile = async (file, endpoint) => {
    if (!file) return "";
    const data = new FormData();
    data.append("file", file);
    const res = await api.post(endpoint, data, { headers: { "Content-Type": "multipart/form-data" } });
    return res.upload?.url || res.material?.url || "";
  };

  const addCategory = async () => {
    const name = newCategory.trim();
    if (!name) return toast.error("Category name is required");
    setAddingCategory(true);
    try {
      const res = await api.post("/coach/categories", { name });
      const category = res.category || { name };
      setMasterData((p) => ({ ...p, categories: [...(p.categories || []), category] }));
      setForm((p) => ({ ...p, category: category.name || name }));
      setNewCategory("");
      setShowCategoryForm(false);
      toast.success(res.existing ? "Category already exists" : "Category added");
      if (errors.category) setErrors((p) => ({ ...p, category: "" }));
    } catch (err) {
      toast.error(err?.message || "Failed to add category");
    } finally {
      setAddingCategory(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Course title is required";
    if (!form.category) e.category = "Please select a category";
    if (isRichTextEmpty(form.description)) e.description = "Description is required";
    if (Number(form.price) < 0) e.price = "Price cannot be negative";
    if (form.thumbnail && !form.thumbnail.type?.startsWith("image/")) e.thumbnail = "Please select a valid image file";
    if (form.promoVideoFile && !form.promoVideoFile.type?.startsWith("video/")) e.promoVideo = "Please select a valid video file";
    if (form.promoVideo && !canPreviewVideo(form.promoVideo)) e.promoVideo = "Use a direct MP4/WebM/Ogg video URL, YouTube URL, or Vimeo URL";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const [uploadedThumbnailUrl, uploadedVideoUrl] = await Promise.all([
        uploadFile(form.thumbnail, "/upload/image"),
        uploadFile(form.promoVideoFile, "/upload/video"),
      ]);
      const payload = {
        title: form.title,
        category: form.category,
        difficulty: form.difficulty,
        language: form.language,
        description: sanitizeRichText(form.description),
        price: Number(form.price || 0),
        status: form.status,
        promoVideo: uploadedVideoUrl || (form.removePromoVideo ? "" : form.promoVideo),
        requirements: form.requirements,
        outcomes: form.outcomes,
        ...(uploadedThumbnailUrl
          ? { thumbnailUrl: uploadedThumbnailUrl }
          : form.removeThumbnail
          ? { thumbnailUrl: "" }
          : {}),
      };
      if (editing) await api.put(`/coach/courses/${id}`, payload);
      else await api.post("/coach/courses", payload);
      toast.success(editing ? "Course updated" : "Course created");
      navigate("/coach/my-courses");
    } catch (err) {
      toast.error(err?.message || (editing ? "Failed to update course" : "Failed to create course"));
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourse) return <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">Loading course...</div>;


  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{editing ? "Edit Course" : "Create New Course"}</h2>
        <p className="mt-1 text-sm text-gray-500">{editing ? "Update course details, media, and publishing settings." : "Fill in the details below to create your course."}</p>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500"><span className="font-medium text-indigo-600">Basic Info</span><ChevronRight size={14} /><span>Media</span><ChevronRight size={14} /><span>Publish</span></div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700"><BookOpen size={18} className="text-indigo-500" /> Course Details</h3>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Course Title <span className="text-red-500">*</span></label><input name="title" value={form.title} onChange={change} placeholder="e.g. React Masterclass 2026" className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.title ? "border-red-400" : ""}`} />{errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><div className="mb-1 flex items-center justify-between gap-2"><label className="block text-sm font-medium text-gray-700">Category <span className="text-red-500">*</span></label><button type="button" onClick={() => setShowCategoryForm((v) => !v)} className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"><Plus size={13} /> Add More</button></div><select name="category" value={form.category} onChange={change} className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${errors.category ? "border-red-400" : ""}`}><option value="">Select category</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>{errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}{showCategoryForm && <div className="mt-2 flex gap-2 rounded-lg border border-indigo-100 bg-indigo-50 p-2"><input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" className="min-w-0 flex-1 rounded-md border px-3 py-2 text-sm" /><button type="button" onClick={addCategory} disabled={addingCategory} className="rounded-md bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60">{addingCategory ? "Adding..." : "Add"}</button><button type="button" onClick={() => setShowCategoryForm(false)} className="rounded-md bg-white p-2 text-slate-500"><X size={14} /></button></div>}</div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Difficulty Level</label><select name="difficulty" value={form.difficulty} onChange={change} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">{difficulties.map((d) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Language</label><select name="language" value={form.language} onChange={change} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">{languages.map((l) => <option key={l}>{l}</option>)}</select></div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Price</label><input name="price" type="number" value={form.price} onChange={change} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />{errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}</div>
            <div><label className="mb-1 block text-sm font-medium text-gray-700">Status</label><select name="status" value={form.status} onChange={change} className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"><option value="published">Published</option><option value="draft">Draft</option></select></div>
          </div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Description <span className="text-red-500">*</span></label><RichTextEditor value={form.description} onChange={(description) => { setForm((p) => ({ ...p, description })); if (errors.description) setErrors((p) => ({ ...p, description: "" })); }} placeholder="Describe what students will learn in this course..." error={Boolean(errors.description)} />{errors.description && <p className="mt-1 text-xs text-red-500">{errors.description}</p>}</div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <div>
            <h3 className="flex items-center gap-2 font-semibold text-gray-700">
              <ImageIcon size={18} className="text-indigo-500" /> Course Media
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Manage your course cover thumbnail (used in catalog and card lists) and promotional preview video.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Thumbnail Section */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-indigo-600" /> Course Thumbnail
                </span>
                {preview && (
                  <button
                    type="button"
                    onClick={removeThumb}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              {preview ? (
                <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 aspect-video shadow-inner">
                  <img
                    src={preview}
                    alt="Course Thumbnail Preview"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
                    <label className="cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-800 shadow backdrop-blur hover:bg-white transition flex items-center gap-1.5">
                      <Upload size={13} /> Change Image
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                    </label>
                  </div>
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                    Cover Preview
                  </span>
                </div>
              ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40">
                  <Upload size={28} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-sm font-bold text-gray-700">Upload thumbnail</p>
                  <p className="mt-1 text-xs text-gray-400">JPG, PNG, WEBP (16:9 recommended)</p>
                  <input type="file" accept="image/*" className="hidden" onChange={handleThumb} />
                </label>
              )}
              {errors.thumbnail && <p className="mt-2 text-xs text-red-500">{errors.thumbnail}</p>}
            </div>

            {/* Promo Video Section */}
            <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                  <Film size={16} className="text-indigo-600" /> Promo Video (Optional)
                </span>
                {(videoPreview || form.promoVideo) && (
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>

              {(videoPreview || form.promoVideo) ? (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 aspect-video shadow-inner">
                  <CourseMedia course={{ title: form.title || "Preview", promoVideo: videoPreview || form.promoVideo }} />
                </div>
              ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-center transition-colors hover:border-indigo-400 hover:bg-indigo-50/40">
                  <Film size={28} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-sm font-bold text-gray-700">Upload promo video file</p>
                  <p className="mt-1 text-xs text-gray-400">MP4, WEBM, OGG (Max 100 MB)</p>
                  <input type="file" accept="video/mp4,video/webm,video/ogg,video/*" className="hidden" onChange={handleVideo} />
                </label>
              )}

              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-2.5">
                <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <LinkIcon size={13} /> Or embed from YouTube / Vimeo / Direct URL
                </label>
                <input
                  name="promoVideo"
                  value={form.promoVideo}
                  onChange={change}
                  disabled={Boolean(form.promoVideoFile)}
                  placeholder="e.g. https://www.youtube.com/watch?v=..."
                  className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              {errors.promoVideo && <p className="mt-2 text-xs text-red-500">{errors.promoVideo}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-semibold text-gray-700"><Info size={18} className="text-indigo-500" /> Requirements & Outcomes</h3>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Requirements</label><textarea name="requirements" value={form.requirements} onChange={change} rows={3} placeholder="One per line" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
          <div><label className="mb-1 block text-sm font-medium text-gray-700">Learning Outcomes</label><textarea name="outcomes" value={form.outcomes} onChange={change} rows={3} placeholder="One per line" className="w-full resize-none rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" /></div>
        </div>
        <div className="flex items-center gap-3 pb-6"><button type="button" onClick={() => navigate("/coach/my-courses")} className="rounded-xl border px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving} className="ml-auto flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60">{saving ? "Uploading & saving..." : editing ? "Update Course" : "Save Course"} <ChevronRight size={16} /></button></div>
      </form>
    </div>
  );
}