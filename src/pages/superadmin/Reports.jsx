import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BookOpen,
  DollarSign,
  GraduationCap,
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency } from "../../utils/formatters";
import Pagination from "../../components/common/Pagination";

export default function Reports() {
  const [data, setData] = useState({ revenue: 0, courseSales: [] });
  const [stats, setStats] = useState({});
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/admin/reports"), api.get("/admin/stats")])
      .then(([r, s]) => {
        setData(r.reports || {});
        setStats(s.stats || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const courseSales = data.courseSales || [];

  const filtered = useMemo(() => {
    return courseSales.filter((row) => {
      const title = row.title || row.course?.title || "";
      const category = row.category || "";
      const coachName = row.coach?.name || "";
      return `${title} ${category} ${coachName}`
        .toLowerCase()
        .includes(q.toLowerCase());
    });
  }, [courseSales, q]);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Top Header Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Platform Reports</h1>
            <p className="text-xs text-slate-500">
              Overview of revenue generated, enrolled students, and sales per course
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(data.revenue || stats.revenue || 0),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-100",
          },
          {
            label: "Total Coaches",
            value: stats.coaches || 0,
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            border: "border-indigo-100",
          },
          {
            label: "Enrolled Students",
            value: stats.students || 0,
            icon: GraduationCap,
            color: "text-sky-600",
            bg: "bg-sky-50",
            border: "border-sky-100",
          },
          {
            label: "Course Sales",
            value: stats.enrollments || 0,
            icon: TrendingUp,
            color: "text-amber-600",
            bg: "bg-amber-50",
            border: "border-amber-100",
          },
        ].map((x) => {
          const Icon = x.icon;
          return (
            <div
              key={x.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {x.label}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${x.bg} ${x.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{x.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-bold text-slate-700">
          Course Sales Breakdown:{" "}
          <span className="text-indigo-600">{filtered.length} Courses</span>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search courses, coaches, categories..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Professional Courses Sales Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Course Name</th>
                <th className="px-5 py-3.5">Instructor / Coach</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Enrolled / Sales</th>
                <th className="px-5 py-3.5">Total Revenue</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-xs font-semibold">Loading report data...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <BookOpen className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-700">No course sales found</p>
                    <p className="text-[11px] text-slate-400">
                      Try searching with different keywords.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => {
                  const title = row.title || row.course?.title || "Untitled Course";
                  const coachName = row.coach?.name || "Platform Admin";
                  const category = row.category || "General";
                  const sales = row.sales ?? 0;
                  const revenue = row.revenue || row.course?.revenue || 0;
                  const status = row.status || "active";

                  return (
                    <tr
                      key={row.id || title}
                      className="hover:bg-slate-50/80 transition"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                            <BookOpen size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{title}</p>
                            <p className="text-[10px] text-slate-400">ID: {row.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {coachName}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                          {category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/50">
                          {sales} {sales === 1 ? "Sale" : "Sales"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-slate-900 text-sm">
                        {formatCurrency(revenue)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            status === "active" || status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {status === "active" || status === "published" ? (
                            <CheckCircle2 size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Unified Pagination Bar */}
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
