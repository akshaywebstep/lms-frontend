import { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Search,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
  User,
  TrendingUp,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency, formatDateTime } from "../../utils/formatters";
import Pagination from "../../components/common/Pagination";

export default function ManagePayments() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/payments")
      .then((r) => setRows(r.payments || []))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = rows
      .filter((r) => r.status === "completed" || r.status === "success")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const successfulCount = rows.filter(
      (r) => r.status === "completed" || r.status === "success"
    ).length;
    const pendingCount = rows.filter((r) => r.status === "pending").length;
    return { totalRevenue, total: rows.length, successfulCount, pendingCount };
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      const matchSearch =
        `${p.order_id || ""} ${p.student?.name || ""} ${p.student?.email || ""} ${p.coach?.name || ""} ${p.course?.title || ""}`
          .toLowerCase()
          .includes(q.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "success"
          ? p.status === "completed" || p.status === "success"
          : p.status === statusFilter);
      return matchSearch && matchStatus;
    });
  }, [rows, q, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <CreditCard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Manage Payments</h1>
            <p className="text-xs text-slate-500">
              Track student enrollment purchases, transaction orders, and revenue payouts
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total Collected",
            value: formatCurrency(stats.totalRevenue),
            icon: DollarSign,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Total Orders",
            value: stats.total,
            icon: CreditCard,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Successful Payments",
            value: stats.successfulCount,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Pending / Processing",
            value: stats.pendingCount,
            icon: Clock,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {c.label}
                </span>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg} ${c.color}`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900">{c.value}</p>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-bold text-slate-700 mr-2">
            Total Transactions:{" "}
            <span className="text-indigo-600 font-extrabold">{filtered.length}</span>
          </div>
          <div className="flex gap-1">
            {[
              { id: "all", label: "All Status" },
              { id: "success", label: "Completed" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: "Failed" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  statusFilter === tab.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search by order ID, student, coach..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-indigo-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Payments Table matching Student / Coach layout */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order / Transaction ID</th>
                <th className="px-5 py-3.5">Student Learner</th>
                <th className="px-5 py-3.5">Course Purchased</th>
                <th className="px-5 py-3.5">Instructor / Coach</th>
                <th className="px-5 py-3.5">Amount Paid</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                    <p className="mt-2 text-xs font-semibold">Loading transactions...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <CreditCard className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-700">No transactions found</p>
                    <p className="text-[11px] text-slate-400">
                      Purchases made by students will automatically reflect here.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((p) => {
                  const isSuccess =
                    p.status === "completed" || p.status === "success";
                  const isPending = p.status === "pending";

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                            <CreditCard size={16} />
                          </div>
                          <div>
                            <p className="font-mono font-bold text-slate-900">
                              {p.order_id || p.id}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Ref: {p.id?.slice(0, 14)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-600 text-xs">
                            {(p.student?.name || "S")[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              {p.student?.name || "Guest Student"}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {p.student?.email || "-"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <BookOpen size={13} className="text-slate-400 shrink-0" />
                          <span className="line-clamp-1 max-w-[200px] font-semibold text-slate-800">
                            {p.course?.title || "Course Enrollment"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {p.coach?.name || "Platform Admin"}
                      </td>

                      <td className="px-5 py-3.5 font-black text-slate-900 text-sm">
                        {formatCurrency(p.amount || 0, p.currency || "INR")}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700"
                              : isPending
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 size={11} />
                          ) : isPending ? (
                            <Clock size={11} />
                          ) : (
                            <XCircle size={11} />
                          )}
                          <span className="capitalize">{p.status || "completed"}</span>
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-medium text-[11px]">
                        {p.created_at ? formatDateTime(p.created_at) : "-"}
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
