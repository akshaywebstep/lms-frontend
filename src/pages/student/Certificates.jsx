import { useEffect, useMemo, useState } from "react";
import {
  Award,
  Download,
  Search,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import api from "../../services/api";
import Pagination from "../../components/common/Pagination";
import { formatDate } from "../../utils/formatters";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get("/student/certificates")
      .then((res) => {
        if (alive) setCertificates(res.certificates || []);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return certificates.filter((cert) => {
      const title = cert.course?.title || "";
      const certNo = cert.certificateNo || "";
      const coach = cert.course?.coach?.name || "";
      return `${title} ${certNo} ${coach}`
        .toLowerCase()
        .includes(q.toLowerCase());
    });
  }, [certificates, q]);

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
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Award size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">My Certificates</h1>
            <p className="text-xs text-slate-500">
              Verified course completion certificates unlocked automatically at 100% progress
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Certificates Earned
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">{certificates.length}</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification Status
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">100% Verified</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Accreditation
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen size={20} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900">LearnFlow LMS</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-xs font-bold text-slate-700">
          Earned Certificates:{" "}
          <span className="text-amber-600 font-extrabold">{filtered.length}</span>
        </div>

        <div className="relative w-72">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
          <input
            type="text"
            placeholder="Search certificate by course or ID..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:border-amber-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Professional Certificates Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Certificate & Course</th>
                <th className="px-5 py-3.5">Instructor / Coach</th>
                <th className="px-5 py-3.5">Certificate Number</th>
                <th className="px-5 py-3.5">Issue Date</th>
                <th className="px-5 py-3.5">Verification</th>
                <th className="px-5 py-3.5 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    <p className="mt-2 text-xs font-semibold">Loading certificates...</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Award className="mx-auto mb-2 text-slate-300" size={32} />
                    <p className="text-xs font-bold text-slate-700">No certificates earned yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Complete 100% of any enrolled course to automatically unlock your certificate.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRows.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 font-bold text-amber-600">
                          <Award size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            {cert.course?.title || "Course Certificate"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Course ID: {cert.course?.id || cert.courseId || "-"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-slate-600 font-medium">
                      {cert.course?.coach?.name || "Platform Certified Coach"}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {cert.certificateNo || `LF-CERT-${cert.id?.slice(0, 6)}`}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-500 font-medium text-[11px]">
                      {cert.issuedAt ? formatDate(cert.issuedAt) : "-"}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {cert.fileUrl ? (
                        <a
                          href={cert.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                        >
                          <Download size={13} /> Download
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">
                          Auto-Generated
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
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
