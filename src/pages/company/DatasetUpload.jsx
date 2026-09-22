import { useState, useCallback, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { generateAIAnalysis } from '../../data/mockData';
import { PriorityBadge, EmotionBadge } from '../../components/Badges';
import {
  Upload, FileText, X, ChevronRight, ChevronDown, ArrowRight, Brain, Sparkles, Download,
  CheckCircle, AlertTriangle, BarChart3, Gauge, Search, Filter, Plus, Trash2, Table, LayoutGrid
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#f97316', '#10b981', '#ef4444'];

// CSV parser
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  
  // Simple CSV parser handling quoted fields
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v.trim() !== ''));
  
  return { headers, rows };
}

// Mini confidence ring
function MiniConfRing({ score, size = 36 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="#f3f4f6" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

// Mini risk ring
function MiniRiskRing({ score, size = 36 }) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;
  const color = score >= 81 ? '#ef4444' : score >= 61 ? '#f97316' : score >= 31 ? '#eab308' : '#10b981';

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} strokeWidth={strokeWidth} fill="none" stroke="#f3f4f6" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

const REQUIRED_FIELDS = [
  { key: 'subject', label: 'Subject / Title', required: true, description: 'The ticket subject or title' },
  { key: 'description', label: 'Description / Body', required: true, description: 'The main complaint text' },
  { key: 'customerName', label: 'Customer Name', required: false, description: 'Name of the customer' },
  { key: 'customerId', label: 'Customer ID', required: false, description: 'ID of the customer' },
  { key: 'category', label: 'Category', required: false, description: 'Ticket category (if known)' },
  { key: 'orderId', label: 'Order ID', required: false, description: 'Related order ID' },
];

export default function DatasetUpload() {
  const { tickets, addToast } = useApp();
  const fileInputRef = useRef(null);

  // State machine: 'idle' -> 'mapping' -> 'analyzing' -> 'results'
  const [stage, setStage] = useState('idle');
  const [fileName, setFileName] = useState('');
  const [fileData, setFileData] = useState({ headers: [], rows: [] });
  const [columnMapping, setColumnMapping] = useState({});
  const [analyzedData, setAnalyzedData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Handle file reading
  const processFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        if (ext === 'json') {
          const json = JSON.parse(text);
          const rows = Array.isArray(json) ? json : [json];
          if (rows.length === 0) { addToast('JSON file is empty', 'error'); return; }
          const headers = Object.keys(rows[0]);
          setFileData({ headers, rows });
        } else if (ext === 'csv') {
          const { headers, rows } = parseCSV(text);
          if (rows.length === 0) { addToast('CSV file is empty', 'error'); return; }
          setFileData({ headers, rows });
        } else {
          addToast('Please upload a CSV or JSON file', 'error');
          return;
        }

        // Auto-map columns with exact or partial name matching
        const autoMap = {};
        REQUIRED_FIELDS.forEach(field => {
          const headers_list = ext === 'json' ? Object.keys((Array.isArray(JSON.parse(text)) ? JSON.parse(text) : [JSON.parse(text)])[0]) :
            parseCSV(text).headers;
          const exact = headers_list.find(h => h.toLowerCase() === field.key.toLowerCase());
          if (exact) { autoMap[field.key] = exact; return; }
          const partial = headers_list.find(h =>
            h.toLowerCase().includes(field.key.toLowerCase()) ||
            field.key.toLowerCase().includes(h.toLowerCase()) ||
            (field.key === 'description' && h.toLowerCase().includes('body')) ||
            (field.key === 'description' && h.toLowerCase().includes('complaint')) ||
            (field.key === 'description' && h.toLowerCase().includes('text')) ||
            (field.key === 'description' && h.toLowerCase().includes('message')) ||
            (field.key === 'subject' && h.toLowerCase().includes('title')) ||
            (field.key === 'subject' && h.toLowerCase().includes('issue')) ||
            (field.key === 'customerName' && h.toLowerCase().includes('name')) ||
            (field.key === 'customerId' && h.toLowerCase().includes('id'))
          );
          if (partial) autoMap[field.key] = partial;
        });
        setColumnMapping(autoMap);
        setStage('mapping');
        addToast(`File loaded: ${file.name}`, 'success');
      } catch (err) {
        addToast('Error parsing file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }, [addToast]);

  // Drag and drop
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); processFile(e.dataTransfer.files[0]); };
  const handleFileSelect = (e) => processFile(e.target.files[0]);

  // Run AI analysis
  const runAnalysis = () => {
    if (!columnMapping.subject && !columnMapping.description) {
      addToast('Please map at least Subject or Description column', 'error');
      return;
    }

    setStage('analyzing');

    // Simulate slight delay for UX
    setTimeout(() => {
      const results = fileData.rows.map((row, index) => {
        const ticket = {
          id: `DS-${String(index + 1).padStart(4, '0')}`,
          subject: row[columnMapping.subject] || row[columnMapping.description] || 'No subject',
          description: row[columnMapping.description] || row[columnMapping.subject] || '',
          customerName: row[columnMapping.customerName] || 'Unknown',
          customerId: row[columnMapping.customerId] || `UPLOAD-${index}`,
          category: row[columnMapping.category] || null,
          orderId: row[columnMapping.orderId] || null,
        };

        const analysis = generateAIAnalysis(ticket, tickets);
        return { ...ticket, aiAnalysis: analysis, originalRow: row };
      });

      setAnalyzedData(results);
      setStage('results');
      addToast(`Analysis complete! ${results.length} records processed`, 'success');
    }, 800);
  };

  // Export results
  const exportResults = () => {
    const exportData = analyzedData.map(item => ({
      id: item.id,
      subject: item.subject,
      description: item.description,
      customerName: item.customerName,
      category: item.aiAnalysis.category,
      priority: item.aiAnalysis.priority,
      emotion: item.aiAnalysis.emotion,
      riskScore: item.aiAnalysis.riskScore.total,
      businessImpact: item.aiAnalysis.businessImpact,
      isRepeat: item.aiAnalysis.isRepeat,
      confidence: item.aiAnalysis.confidence.overall,
      categoryConfidence: item.aiAnalysis.confidence.category,
      priorityConfidence: item.aiAnalysis.confidence.priority,
      emotionConfidence: item.aiAnalysis.confidence.emotion,
      rootCause: item.aiAnalysis.rootCause,
      recommendedAction: item.aiAnalysis.recommendedAction,
      recommendedTeam: item.aiAnalysis.recommendedTeam,
      keywords: item.aiAnalysis.keywords.map(k => k.word).join(', '),
    }));

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ai_analysis_results_${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
    addToast('Results exported successfully!', 'success');
  };

  // Reset
  const resetAll = () => {
    setStage('idle');
    setFileName('');
    setFileData({ headers: [], rows: [] });
    setColumnMapping({});
    setAnalyzedData([]);
    setSearchQuery('');
    setFilterCategory('All');
    setFilterPriority('All');
    setExpandedRow(null);
  };

  // Computed stats for results
  const stats = analyzedData.length > 0 ? {
    total: analyzedData.length,
    critical: analyzedData.filter(d => d.aiAnalysis.priority === 'Critical').length,
    high: analyzedData.filter(d => d.aiAnalysis.priority === 'High').length,
    medium: analyzedData.filter(d => d.aiAnalysis.priority === 'Medium').length,
    low: analyzedData.filter(d => d.aiAnalysis.priority === 'Low').length,
    avgRisk: Math.round(analyzedData.reduce((s, d) => s + d.aiAnalysis.riskScore.total, 0) / analyzedData.length),
    avgConfidence: Math.round(analyzedData.reduce((s, d) => s + d.aiAnalysis.confidence.overall, 0) / analyzedData.length),
    repeats: analyzedData.filter(d => d.aiAnalysis.isRepeat).length,
  } : null;

  const categoryDistribution = {};
  analyzedData.forEach(d => {
    const cat = d.aiAnalysis.category;
    categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
  });
  const catPieData = Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }));

  // Filter results
  const filteredResults = analyzedData.filter(d => {
    const matchSearch = !searchQuery ||
      d.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'All' || d.aiAnalysis.category === filterCategory;
    const matchPriority = filterPriority === 'All' || d.aiAnalysis.priority === filterPriority;
    return matchSearch && matchCategory && matchPriority;
  });

  const allCategories = [...new Set(analyzedData.map(d => d.aiAnalysis.category))];
  const allPriorities = ['Critical', 'High', 'Medium', 'Low'];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Upload className="w-6 h-6 text-brand-500" /> Dataset Upload & Analysis
          </h1>
          <p className="text-sm text-gray-500 mt-1">Upload a CSV or JSON dataset to bulk-analyze tickets with AI</p>
        </div>
        {stage !== 'idle' && (
          <button onClick={resetAll} className="px-4 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Reset
          </button>
        )}
      </div>

      {/* Stage indicator */}
      {stage !== 'idle' && (
        <div className="flex items-center gap-2 mb-6 px-1">
          {[
            { key: 'mapping', label: 'Map Columns', num: 1 },
            { key: 'analyzing', label: 'Analyze', num: 2 },
            { key: 'results', label: 'Results', num: 3 },
          ].map((step, i) => (
            <div key={step.key} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${['analyzing', 'results'].includes(stage) && i <= (['results'].includes(stage) ? 2 : 1) ? 'bg-brand-400' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                stage === step.key ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300' :
                (step.key === 'mapping' && stage !== 'idle') || (step.key === 'analyzing' && stage === 'results') ? 'bg-emerald-100 text-emerald-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {(step.key === 'mapping' && stage !== 'mapping') || (step.key === 'analyzing' && stage === 'results')
                  ? <CheckCircle className="w-3.5 h-3.5" />
                  : <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px] font-bold">{step.num}</span>
                }
                {step.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STAGE: IDLE — Upload */}
      {stage === 'idle' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative cursor-pointer border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
            isDragging
              ? 'border-brand-400 bg-brand-50 scale-[1.01]'
              : 'border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50/30'
          }`}
        >
          <input ref={fileInputRef} type="file" accept=".csv,.json" onChange={handleFileSelect} className="hidden" />
          <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 transition-all ${
            isDragging ? 'bg-brand-100 scale-110' : 'bg-gradient-to-br from-brand-100 to-cyan-100'
          }`}>
            <Upload className={`w-9 h-9 transition-colors ${isDragging ? 'text-brand-600' : 'text-brand-500'}`} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {isDragging ? 'Drop your file here!' : 'Upload your dataset'}
          </h3>
          <p className="text-sm text-gray-500 mb-4">Drag and drop a CSV or JSON file, or click to browse</p>
          <div className="flex items-center justify-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
              <FileText className="w-3.5 h-3.5" /> .csv
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium">
              <FileText className="w-3.5 h-3.5" /> .json
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-4">Required: at least a subject or description column</p>
        </div>
      )}

      {/* STAGE: MAPPING — Column Mapper */}
      {stage === 'mapping' && (
        <div className="space-y-6">
          {/* File info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{fileName}</div>
                <div className="text-xs text-gray-500">{fileData.rows.length} rows · {fileData.headers.length} columns</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Table className="w-4 h-4" />
              Columns: {fileData.headers.join(', ')}
            </div>
          </div>

          {/* Column Mapping */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-card">
            <h2 className="text-sm font-semibold text-gray-800 mb-1 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-brand-500" /> Map Your Columns
            </h2>
            <p className="text-xs text-gray-500 mb-5">Select which column from your file maps to each field. Required fields are marked with *</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REQUIRED_FIELDS.map(field => (
                <div key={field.key} className={`rounded-xl border p-4 transition-all ${
                  columnMapping[field.key]
                    ? 'border-emerald-200 bg-emerald-50/50'
                    : field.required ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                }`}>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <p className="text-[10px] text-gray-400 mb-2">{field.description}</p>
                  <select
                    value={columnMapping[field.key] || ''}
                    onChange={(e) => setColumnMapping(prev => ({ ...prev, [field.key]: e.target.value || undefined }))}
                    className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                      columnMapping[field.key] ? 'border-emerald-300 bg-white' : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <option value="">— Select column —</option>
                    {fileData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  {columnMapping[field.key] && (
                    <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600 font-medium">
                      <CheckCircle className="w-3 h-3" /> Mapped to "{columnMapping[field.key]}"
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Data Preview */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-gray-600 mb-2">Data Preview (first 3 rows)</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {fileData.headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fileData.rows.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-t border-gray-50">
                        {fileData.headers.map(h => (
                          <td key={h} className="px-3 py-2 text-gray-700 max-w-[200px] truncate whitespace-nowrap">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={runAnalysis}
                disabled={!columnMapping.subject && !columnMapping.description}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all ${
                  columnMapping.subject || columnMapping.description
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white hover:shadow-lg hover:shadow-brand-300/30 hover:scale-[1.02]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Brain className="w-4 h-4" /> Run AI Analysis <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAGE: ANALYZING */}
      {stage === 'analyzing' && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-100 to-cyan-100 flex items-center justify-center mb-6 animate-pulse">
            <Brain className="w-10 h-10 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Analyzing your dataset...</h3>
          <p className="text-sm text-gray-500">Running AI analysis on {fileData.rows.length} records</p>
          <div className="mt-6 w-64 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-400 to-cyan-400 rounded-full" style={{ animation: 'shimmer 1.5s infinite', width: '60%' }} />
          </div>
        </div>
      )}

      {/* STAGE: RESULTS */}
      {stage === 'results' && stats && (
        <div className="space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            {[
              { label: 'Total', value: stats.total, bg: 'from-brand-500 to-brand-600', icon: <FileText className="w-4 h-4" /> },
              { label: 'Critical', value: stats.critical, bg: 'from-red-500 to-red-600', icon: <AlertTriangle className="w-4 h-4" /> },
              { label: 'High', value: stats.high, bg: 'from-orange-500 to-orange-600', icon: <AlertTriangle className="w-4 h-4" /> },
              { label: 'Medium', value: stats.medium, bg: 'from-amber-500 to-amber-600', icon: <BarChart3 className="w-4 h-4" /> },
              { label: 'Low', value: stats.low, bg: 'from-emerald-500 to-emerald-600', icon: <CheckCircle className="w-4 h-4" /> },
              { label: 'Avg Risk', value: stats.avgRisk, bg: 'from-pink-500 to-pink-600', icon: <Gauge className="w-4 h-4" /> },
              { label: 'Avg Confidence', value: `${stats.avgConfidence}%`, bg: 'from-indigo-500 to-indigo-600', icon: <Sparkles className="w-4 h-4" /> },
              { label: 'Repeats', value: stats.repeats, bg: 'from-violet-500 to-violet-600', icon: <Brain className="w-4 h-4" /> },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.bg} rounded-xl p-3 text-white shadow-lg`}>
                <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-1">{s.icon} {s.label}</div>
                <div className="text-xl font-bold">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Category chart + actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Category Distribution</h3>
              <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={catPieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={3} dataKey="value">
                      {catPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {catPieData.map((entry, i) => (
                  <span key={entry.name} className="flex items-center gap-1 text-[10px] text-gray-600">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                    {entry.name} ({entry.value})
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={exportResults}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Download className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Export Results</div>
                    <div className="text-xs text-gray-500">Download as JSON with all AI features</div>
                  </div>
                </button>
                <button
                  onClick={resetAll}
                  className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-800">Upload New</div>
                    <div className="text-xs text-gray-500">Start fresh with a different dataset</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Search + Filter bar */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-card flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search results..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="All">All Categories</option>
              {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="All">All Priorities</option>
              {allPriorities.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="text-xs text-gray-400">{filteredResults.length} of {analyzedData.length}</span>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-8"></th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Subject</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Emotion</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Risk</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500">Confidence</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Impact</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">Keywords</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((item, idx) => (
                    <>
                      <tr
                        key={item.id}
                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                        className={`border-b border-gray-50 cursor-pointer transition-colors ${
                          expandedRow === idx ? 'bg-brand-50/30' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandedRow === idx ? 'rotate-90' : ''}`} />
                        </td>
                        <td className="px-4 py-3 font-semibold text-brand-600 text-xs whitespace-nowrap">{item.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px] truncate">{item.subject}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-xs font-medium">{item.aiAnalysis.category}</span>
                            <span className="text-[9px] text-indigo-500 font-bold">{item.aiAnalysis.confidence.category}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><PriorityBadge priority={item.aiAnalysis.priority} /></td>
                        <td className="px-4 py-3"><EmotionBadge emotion={item.aiAnalysis.emotion} /></td>
                        <td className="px-4 py-3 text-center"><MiniRiskRing score={item.aiAnalysis.riskScore.total} /></td>
                        <td className="px-4 py-3 text-center"><MiniConfRing score={item.aiAnalysis.confidence.overall} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold ${
                            item.aiAnalysis.businessImpact === 'High' ? 'text-red-600' :
                            item.aiAnalysis.businessImpact === 'Medium' ? 'text-amber-600' : 'text-green-600'
                          }`}>{item.aiAnalysis.businessImpact}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {item.aiAnalysis.keywords.slice(0, 3).map((kw, ki) => (
                              <span key={ki} className="px-1.5 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-medium">{kw.word}</span>
                            ))}
                            {item.aiAnalysis.keywords.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{item.aiAnalysis.keywords.length - 3}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Row */}
                      {expandedRow === idx && (
                        <tr key={`${item.id}-expanded`}>
                          <td colSpan="10" className="px-4 py-4 bg-gradient-to-br from-brand-50/30 to-cyan-50/30 border-b border-brand-100">
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-2">Description</h4>
                                <p className="text-xs text-gray-700 bg-white rounded-lg p-3 border border-gray-100">{item.description || 'N/A'}</p>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-2">AI Insights</h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="text-gray-500">Root Cause</span>
                                    <span className="font-medium text-gray-700">{item.aiAnalysis.rootCause}</span>
                                  </div>
                                  <div className="flex justify-between bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="text-gray-500">Recommended Team</span>
                                    <span className="font-medium text-gray-700">{item.aiAnalysis.recommendedTeam}</span>
                                  </div>
                                  <div className="flex justify-between bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="text-gray-500">Action</span>
                                    <span className="font-medium text-gray-700">{item.aiAnalysis.recommendedAction}</span>
                                  </div>
                                  <div className="flex justify-between bg-white rounded-lg p-2 border border-gray-100">
                                    <span className="text-gray-500">Repeat</span>
                                    <span className={`font-semibold ${item.aiAnalysis.isRepeat ? 'text-red-600' : 'text-green-600'}`}>{item.aiAnalysis.isRepeat ? '⚠ Yes' : '✓ No'}</span>
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-600 mb-2">Confidence Breakdown</h4>
                                <div className="space-y-2">
                                  {[
                                    { label: 'Category', value: item.aiAnalysis.confidence.category },
                                    { label: 'Priority', value: item.aiAnalysis.confidence.priority },
                                    { label: 'Emotion', value: item.aiAnalysis.confidence.emotion },
                                    { label: 'Overall', value: item.aiAnalysis.confidence.overall },
                                  ].map(c => (
                                    <div key={c.label}>
                                      <div className="flex justify-between text-[10px] mb-0.5">
                                        <span className="text-gray-500">{c.label}</span>
                                        <span className={`font-bold ${c.value >= 70 ? 'text-emerald-600' : c.value >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{c.value}%</span>
                                      </div>
                                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-500 ${
                                          c.value >= 70 ? 'bg-emerald-400' : c.value >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                        }`} style={{ width: `${c.value}%` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <div className="mt-3">
                                  <h4 className="text-xs font-semibold text-gray-600 mb-1">All Keywords</h4>
                                  <div className="flex flex-wrap gap-1">
                                    {item.aiAnalysis.keywords.map((kw, ki) => (
                                      <span key={ki} className="group relative px-2 py-1 rounded-lg bg-white border border-brand-200 text-brand-700 text-[10px] font-semibold cursor-help">
                                        {kw.word}
                                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[9px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                          {kw.reason}
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredResults.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results match your filters</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
