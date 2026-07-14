import { useEffect, useState } from 'react'

// Safelist classes to force Tailwind CSS compiler to generate styles for dynamic HTML from DB
export const _tailwindSafelist = [
  'flex', 'flex-1', 'flex-row', 'flex-col', 'items-center', 'justify-center',
  'py-2', 'px-4', 'p-0', 'p-4', 'border', 'border-gray-300', 'border-slate-200', 'border-slate-300',
  'bg-gray-200', 'bg-gray-100', 'bg-slate-100', 'bg-slate-200', 'bg-white',
  'shadow-lg', 'w-full', 'h-full', 'text-center', 'text-left', 'font-bold', 'font-semibold', 'bg-[#1C63C2]'
];

// Helper function to remove template editor controls (Edit / Remove Header buttons) from HTML
const cleanHtml = (html: string) => {
  if (!html) return '';
  const pattern = /<div style="position:\s*absolute;\s*top:\s*0px;\s*right:\s*0px;\s*display:\s*flex;\s*gap:\s*4px;\s*z-index:\s*1000;">\s*<div[^>]*>✏️\s*Edit<\/div>\s*<div[^>]*>🗑️\s*Remove Header<\/div>\s*<\/div>/gi;
  let cleaned = html.replace(pattern, '');
  // Replace class bg-[#EBEBEB] with bg-[#1C63C2] case-insensitively
  cleaned = cleaned.replace(/bg-\[#EBEBEB\]/gi, 'bg-[#1C63C2]');
  return cleaned;
};

interface StatusInfo {
  status: string;
  database: string;
  postgresVersion?: string;
  serverTime?: string;
  error?: string;
}

interface Participant {
  peserta_id: number;
  id_user: number;
  email: string;
  nama: string;
  status_test: string;
  status_download_pdf?: number | string | null;
}

interface ReportItem {
  namafile: string;
  html: string;
}

function App() {
  const [dbStatus, setDbStatus] = useState<StatusInfo | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  // Reporting States
  const [selectedUser, setSelectedUser] = useState<Participant | null>(null)
  const [reportingData, setReportingData] = useState<ReportItem[] | null>(null)
  const [pdfPaths, setPdfPaths] = useState<{ wawasanKebangsaan: string | null; corporateValue: string | null } | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  // Batch download states
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [activeBatch, setActiveBatch] = useState<number | null>(null)
  const [batchProgress, setBatchProgress] = useState<{
    batchNumber: number;
    current: number;
    total: number;
    currentUser: string;
  } | null>(null)

  const [batchStatuses, setBatchStatuses] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('mini_engine_batches');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        const flat: Record<string, string> = {};
        if (Array.isArray(arr)) {
          arr.forEach((item) => {
            Object.entries(item).forEach(([key, val]) => {
              flat[key] = String(val);
            });
          });
        }
        return flat;
      } catch (e) {
        console.error(e);
      }
    }
    return {};
  });

  // Initialize batch statuses when participant list loads
  useEffect(() => {
    if (participants.length > 0) {
      const totalB = Math.ceil(participants.length / 100);
      setBatchStatuses((prev) => {
        const next = { ...prev };
        let updated = false;
        for (let i = 1; i <= totalB; i++) {
          const key = `batch${i}`;
          if (!next[key]) {
            next[key] = 'draft';
            updated = true;
          }
        }
        if (updated) {
          const arrFormat = Object.entries(next).map(([k, v]) => ({ [k]: v }));
          localStorage.setItem('mini_engine_batches', JSON.stringify(arrFormat));
        }
        return next;
      });
    }
  }, [participants]);

  useEffect(() => {
    // Check DB status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch((err) => console.error('Failed to get database status:', err))

    // Fetch participant list
    fetch('/api/get_list_peserta')
      .then((res) => {
        if (!res.ok) throw new Error('API server returned error')
        return res.json()
      })
      .then((data) => {
        setParticipants(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Failed to load participants:', err)
        setLoading(false)
      })
  }, [])

  // Filter participants based on search query
  const filteredParticipants = participants.filter((p) => {
    const nameMatch = p.nama?.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    return nameMatch || emailMatch
  })

  // Load report data from backend API
  const handleViewReport = (p: Participant) => {
    setSelectedUser(p)
    setLoadingReport(true)
    setReportingData(null)
    setPdfPaths(null)

    fetch(`/api/get_reporting?id_user=${p.id_user}`)
      .then((res) => {
        if (!res.ok) throw new Error('API server returned error')
        return res.json()
      })
      .then((data) => {
        setReportingData(Array.isArray(data.reports) ? data.reports : [])
        setPdfPaths(data.pdfPaths)
        setLoadingReport(false)
      })
      .catch((err) => {
        console.error('Failed to load report:', err)
        setReportingData([])
        setLoadingReport(false)
      })
  }

  const handleDownloadAll = () => {
    if (!selectedUser || !pdfPaths) return;

    // Call update API (generates on backend and updates download status in database, no browser file download popup)
    fetch(`/api/update_download_status?peserta_id=${selectedUser.peserta_id}`, {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // Update status in the participants list immediately
          setParticipants((prevList) =>
            prevList.map((p) =>
              p.peserta_id === selectedUser.peserta_id
                ? { ...p, status_download_pdf: 1 }
                : p
            )
          );
          // Update selected user local status
          setSelectedUser((prev) => (prev ? { ...prev, status_download_pdf: 1 } : null));
        }
      })
      .catch((err) => console.error('Failed to update download status:', err));
  };

  const handleStartBatch = async (batchNum: number) => {
    setIsProcessingBatch(true);
    setActiveBatch(batchNum);

    // Calculate indices for this batch (100 participants per batch)
    const startIndex = (batchNum - 1) * 100;
    const endIndex = Math.min(startIndex + 100, participants.length);
    const batchUsers = participants.slice(startIndex, endIndex);

    setBatchProgress({
      batchNumber: batchNum,
      current: 0,
      total: batchUsers.length,
      currentUser: ''
    });

    // Process each participant in the batch serially (generate on backend only)
    for (let i = 0; i < batchUsers.length; i++) {
      const user = batchUsers[i];

      setBatchProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentUser: user.nama
      } : null);

      try {
        // Step 1: Call API to generate PDFs on backend (saves them to public folder if missing)
        const response = await fetch(`/api/get_reporting?id_user=${user.id_user}`);
        if (!response.ok) throw new Error(`API error for user ${user.id_user}`);

        // Step 2: Call API to update status in the database
        const updateRes = await fetch(`/api/update_download_status?peserta_id=${user.peserta_id}`, {
          method: 'POST'
        });
        const updateData = await updateRes.json();

        if (updateData.success) {
          // Update local participants array state to reflect status changes
          setParticipants((prevList) =>
            prevList.map((p) =>
              p.peserta_id === user.peserta_id
                ? { ...p, status_download_pdf: 1 }
                : p
            )
          );
          // If the processed user is currently open, sync active view
          setSelectedUser((prev) => {
            if (prev && prev.peserta_id === user.peserta_id) {
              return { ...prev, status_download_pdf: 1 };
            }
            return prev;
          });
        }
      } catch (err) {
        console.error(`Error processing batch participant ${user.nama}:`, err);
      }

      // 1.5 seconds delay between participants to let browser downloads complete cleanly
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Save completion status to localStorage
    setBatchStatuses(prev => {
      const next = { ...prev, [`batch${batchNum}`]: 'done' };
      const arrFormat = Object.entries(next).map(([k, v]) => ({ [k]: v }));
      localStorage.setItem('mini_engine_batches', JSON.stringify(arrFormat));
      return next;
    });

    setIsProcessingBatch(false);
    setActiveBatch(null);
    setBatchProgress(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'draft':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'progress':
      case 'working':
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
    }
  }

  return (
    <div className="h-screen w-screen flex bg-white text-slate-800 font-sans overflow-hidden antialiased">

      {/* LEFT SECTION (30% Width): User List with Search */}
      <aside className="w-[30%] min-w-[320px] max-w-[450px] border-r border-slate-200 flex flex-col h-full bg-slate-50/50 shrink-0">

        {/* Header Block with Search */}
        <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight m-0">
              Daftar Peserta
            </h1>

            {/* Database indicator light */}
            <div className="flex items-center gap-1.5" title={dbStatus?.database === 'connected' ? 'PostgreSQL Connected' : 'Database Offline'}>
              <span className={`w-2 h-2 rounded-full ${dbStatus?.database === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                {dbStatus?.database === 'connected' ? 'DB Connected' : 'DB Offline'}
              </span>
            </div>
          </div>

          {/* Search Input field */}
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-purple-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>

          {/* Batch Download Buttons Grid */}
          <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-purple-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Batch Download (100 Peserta/Batch)
            </div>
            <div className="grid grid-cols-5 gap-1.5 p-0.5">
              {Array.from({ length: Math.ceil(participants.length / 100) }).map((_, i) => {
                const batchKey = `batch${i + 1}`;
                const status = batchStatuses[batchKey] || 'draft';
                const isDone = status === 'done';
                return (
                  <button
                    key={i}
                    disabled={isProcessingBatch}
                    onClick={() => handleStartBatch(i + 1)}
                    className={`cursor-pointer text-[11px] font-semibold py-1 px-1 rounded-md border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                      isProcessingBatch
                        ? 'bg-slate-100 text-slate-400 border-slate-100 cursor-not-allowed'
                        : activeBatch === i + 1
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm animate-pulse'
                        : isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300 hover:bg-purple-50/10'
                    }`}
                  >
                    <span>#{i + 1}</span>
                    <span className={`text-[8px] uppercase tracking-wider font-mono font-bold ${
                      activeBatch === i + 1 ? 'text-purple-200' : isDone ? 'text-emerald-600' : 'text-slate-400'
                    }`}>
                      {status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Batch Progress Indicator */}
          {batchProgress && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-purple-800">
                  Memproses Batch {batchProgress.batchNumber}...
                </span>
                <span className="font-mono text-purple-600 font-semibold">
                  {batchProgress.current} / {batchProgress.total}
                </span>
              </div>
              <div className="w-full bg-purple-200/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-600 h-1.5 transition-all duration-300"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 truncate leading-none mt-0.5">
                Sedang memproses: {batchProgress.currentUser}
              </span>
            </div>
          )}

          {/* Counter info */}
          <div className="flex justify-between items-center text-[11px] text-slate-500">
            <span>Menampilkan {filteredParticipants.length} user_real</span>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-purple-600 hover:text-purple-700 font-semibold"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs text-slate-500 font-mono">Loading records...</span>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-12 italic">
              Tidak ada peserta yang cocok.
            </div>
          ) : (
            filteredParticipants.map((p, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-2 relative group ${selectedUser?.id_user === p.id_user
                  ? 'border-purple-200 bg-purple-50/20 shadow-sm'
                  : 'border-slate-200/60 bg-white hover:border-slate-300'
                  }`}
              >
                {/* Index counter top right */}
                <span className="absolute top-2 right-3 text-[10px] font-mono text-slate-300 font-semibold">
                  #{idx + 1}
                </span>

                {/* Name */}
                <h2 className="text-sm font-bold text-slate-900 leading-snug pr-6 truncate">
                  {p.nama}
                </h2>

                {/* Email */}
                <p className="text-[11px] font-mono text-slate-500 truncate leading-none">
                  {p.email}
                </p>

                {/* Badges / Meta Info */}
                <div className="flex flex-wrap gap-2 pt-1 items-center justify-between">
                  <div className="flex gap-1.5">
                    {/* Status test */}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(p.status_test)}`}>
                      {p.status_test || 'N/A'}
                    </span>

                    {/* status_download_pdf rendering */}
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 font-mono">
                      PDF: {p.status_download_pdf === 1 || String(p.status_download_pdf) === '1' ? '1' : 'null'}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 font-medium">
                    ID: {p.id_user}
                  </span>
                </div>

                {/* Report Action Button */}
                <button
                  onClick={() => handleViewReport(p)}
                  className={`mt-1 cursor-pointer w-full text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all duration-200 active:scale-[0.98] ${selectedUser?.id_user === p.id_user
                    ? 'bg-purple-600 border-purple-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                >
                  Report
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* RIGHT SECTION (70% Width): Empty Page / Loaded HTML Report */}
      {!selectedUser ? (
        <main className="flex-1 h-full bg-slate-50/50 flex items-center justify-center p-8 text-center">
          <div className="max-w-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">Tidak ada laporan dipilih</h3>
            <p className="text-xs text-slate-400">Pilih peserta di panel kiri dan klik tombol "Report" untuk memuat hasil laporan.</p>
          </div>
        </main>
      ) : loadingReport ? (
        <main className="flex-1 h-full bg-slate-50/50 flex flex-col items-center justify-center p-8">
          <svg className="animate-spin h-7 w-7 text-purple-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-xs text-slate-500 font-mono">Memuat laporan: {selectedUser.nama}...</span>
        </main>
      ) : (
        <main className="flex-1 h-full flex flex-col bg-slate-50/50 overflow-hidden">
          {/* Header Panel */}
          <div className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex items-center justify-between shadow-sm relative z-10">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold">
                PERSONAL REPORT TELEMETRY
              </span>
              <h2 className="text-lg font-bold text-slate-900 leading-none">
                {selectedUser.nama}
              </h2>
              <div className="flex gap-4 items-center text-xs text-slate-500 font-mono mt-1">
                <span>User ID: {selectedUser.id_user}</span>
                <span>•</span>
                <span>Email: {selectedUser.email}</span>
              </div>
            </div>

            {/* Generate Button */}
            {pdfPaths && (
              <button
                onClick={handleDownloadAll}
                className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-2.5 px-4.5 rounded-lg shadow-sm border border-purple-600 transition-all flex items-center gap-1.5 active:scale-95 animate-fade-in"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate & Set Done
              </button>
            )}
          </div>

          {/* Scrollable Report Content Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {!reportingData || reportingData.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/60 p-12 text-center shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-slate-300 mx-auto mb-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-sm font-semibold text-slate-800">Laporan Kosong</p>
                <p className="text-xs text-slate-400 mt-1">Tidak ada data personal_report yang ditemukan untuk peserta ini.</p>
              </div>
            ) : (
              reportingData.map((item, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

                  {/* Test Title Header */}
                  <div className="bg-slate-50/50 border-b border-slate-200 px-6 py-4 flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-purple-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.1 1.698m-14.7 3v12.75A2.25 2.25 0 0 0 4.75 22h.75m-.5-6h2.25m-2.25-3h2.25M3.75 6H18M4 5h16" />
                    </svg>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      {item.namafile || (item as any).namaFile}
                    </h3>
                  </div>

                  {/* Rendered HTML Area */}
                  <div className="p-6 overflow-x-auto bg-white text-[14px]">
                    <div
                      dangerouslySetInnerHTML={{ __html: cleanHtml(item.html) }}
                      className="report-html-output"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      )}

    </div>
  )
}

export default App
