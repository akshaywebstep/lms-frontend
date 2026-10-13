import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Users,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  CreditCard,
  Percent,
} from "lucide-react";
import api from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatters";
import Pagination from "../../components/common/Pagination";

const DEFAULT_EARNINGS = {
  grossRevenue: 0,
  platformFee: 0,
  netRevenue: 0,
  history: [],
};

export default function CoachEarnings() {
  const [earnings, setEarnings] = useState(DEFAULT_EARNINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get("/coach/earnings");
        if (alive) setEarnings(res.earnings || DEFAULT_EARNINGS);
      } catch (err) {
        if (alive) setError(err?.message || "Failed to load earnings");
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, []);

  const transactions = useMemo(() => earnings.history || [], [earnings.history]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch = `${t.student?.name || ""} ${t.course?.title || ""} ${
        t.id || ""
      }`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        t.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchSearch && matchStatus;
    });
  }, [transactions, search, statusFilter]);

  const paidUsers = useMemo(
    () =>
      new Set(
        transactions
          .filter((t) => t.status === "success")
          .map((t) => t.studentId)
      ).size,
    [transactions]
  );

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
              Earnings & Revenue Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Track course sales, payouts, platform commission, and student transactions
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            const csv = [
              ["ID", "Student", "Course", "Amount", "Status", "Date"].join(","),
              ...filtered.map((t) =>
                [
                  t.id,
                  `"${t.student?.name || ""}"`,
                  `"${t.course?.title || ""}"`,
                  t.amount || 0,
                  t.status,
                  t.createdAt || "",
                ].join(",")
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `coach_earnings_${Date.now()}.csv`;
            a.click();
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <Download size={15} /> Export Transactions CSV
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Gross Revenue",
            value: formatCurrency(earnings.grossRevenue || 0),
            sub: "Total course sales",
            icon: CreditCard,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
          },
          {
            label: "Net Earnings",
            value: formatCurrency(earnings.netRevenue || 0),
            sub: "Take-home amount",
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Platform Commission",
            value: formatCurrency(earnings.platformFee || 0),
            sub: "Platform fee",
            icon: Percent,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Paying Students",
            value: paidUsers,
            sub: `${transactions.length} total orders`,
            icon: Users,
            color: "text-sky-600",
            bg: "bg-sky-50",
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
              <p className="mt-1 text-xs font-semibold text-slate-400">{x.sub}</p>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Transaction History Table */}
      <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search student or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-xs font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-2.5 py-1.5 text-xs text-slate-600">
              <Filter size={13} className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-700 outline-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading transactions...
                  </td>
                </tr>
              ) : paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <DollarSign size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No transactions recorded
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Revenue will automatically appear here when students enroll.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-500">
                      #{String(t.id).slice(-8)}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">
                        {t.student?.name || "Student"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {t.student?.email || "-"}
                      </p>
                    </td>

                    <td className="py-3 px-4">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                        {t.course?.title || "-"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-black text-slate-900">
                      {formatCurrency(t.amount || 0, t.currency || "INR")}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {t.createdAt ? formatDate(t.createdAt) : "-"}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          t.status === "success"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50"
                            : t.status === "pending"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200/50"
                            : "bg-rose-50 text-rose-700 ring-1 ring-rose-200/50"
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Always Visible */}
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      </div>
    </div>
  );
}