import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dietApi, AggregateResponse, ModuleGenerateResponse, ApiResponse, triggerDownload } from '../lib/api';
import mockData from '../mock/seed.json';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DietDashboardProps {
  mockMode: boolean;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DietDashboard({ mockMode, onToast }: DietDashboardProps) {
  const [data, setData] = useState<AggregateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [generatedModule, setGeneratedModule] = useState<ModuleGenerateResponse | null>(null);
  const [moduleForm, setModuleForm] = useState({ cluster: 'Cluster A', topic: 'subtraction-borrowing', template: 'activity', grade: '3', language: 'en' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<'7' | '30' | '90' | 'all'>('all');

  useEffect(() => {
    loadData();
  }, [selectedCluster, dateFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      let result: AggregateResponse;
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockAggregate = (mockData as any).aggregateData || mockData;
        result = mockAggregate as AggregateResponse;
      } else {
        const params: any = {};
        if (selectedCluster) params.cluster = selectedCluster;
        if (dateFilter !== 'all') {
          const daysAgo = new Date();
          daysAgo.setDate(daysAgo.getDate() - parseInt(dateFilter));
          params.date_from = daysAgo.toISOString().split('T')[0];
        }
        const apiResult = await dietApi.getAggregate(params);
        if (apiResult.ok && apiResult.data) {
          result = apiResult.data;
        } else {
          throw new Error(apiResult.error || 'Failed to load data');
        }
      }
      setData(result);
    } catch (err) {
      console.error('Failed to load aggregate data:', err);
      // Always fallback to mock data if available
      const mockAggregate = (mockData as any).aggregateData || mockData;
      if (mockAggregate && mockAggregate.total_queries !== undefined) {
        setData(mockAggregate as AggregateResponse);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBarClick = (topic: string) => {
    setSelectedTopic(topic);
    setShowTopicModal(true);
  };

  const handleGenerateModule = async () => {
    setModuleLoading(true);
    setGeneratedModule(null);
    try {
      let result: ModuleGenerateResponse;
      if (mockMode) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = {
          module_id: 'mock-module-1',
          pptx_link: `http://127.0.0.1:8000/templates/samples/${moduleForm.topic}-module.pptx`,
          title: `${moduleForm.topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} - Micro Module`,
        };
        setGeneratedModule(result);
      } else {
        const apiResult = await dietApi.generateModule(moduleForm);
        if (apiResult.ok && apiResult.data) {
          result = apiResult.data;
          setGeneratedModule(result);
          
          // Trigger download
          try {
            const blob = await dietApi.downloadFile(result.pptx_link || '');
            const filename = result.pptx_link?.split('/').pop() || 'module.pptx';
            triggerDownload(blob, filename);
            onToast?.('Module downloaded successfully!', 'success');
          } catch (downloadErr) {
            console.error('Download failed, but module generated:', downloadErr);
            onToast?.('Module generated! Click download link if auto-download failed.', 'info');
          }
        } else {
          throw new Error(apiResult.error || 'Failed to generate module');
        }
      }
    } catch (err: any) {
      console.error('Failed to generate module:', err);
      const errorMsg = err.message || 'Failed to generate module';
      setError(errorMsg);
      onToast?.(errorMsg, 'error');
    } finally {
      setModuleLoading(false);
    }
  };

  const filteredQueries = data?.sample_queries.filter(q => {
    if (searchQuery && !q.narrative_text.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (selectedTopic && q.topic_tag !== selectedTopic) return false;
    return true;
  }) || [];

  const topicQueries = selectedTopic ? data?.sample_queries.filter(q => q.topic_tag === selectedTopic) || [] : [];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card h-64"></div>
          <div className="card h-64"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    // Show error state instead of null
    return (
      <div className="card bg-red-50 border-2 border-red-200">
        <p className="text-red-700 font-semibold">Failed to load dashboard data</p>
        <p className="text-red-600 text-sm mt-2">
          {mockMode ? 'Mock data not available. Check src/mock/seed.json' : 'Backend not available. Enable Mock Mode in Settings.'}
        </p>
        <button
          onClick={loadData}
          className="btn-primary mt-4"
        >
          Retry
        </button>
      </div>
    );
  }

  const topicChartData = {
    labels: Object.keys(data.by_topic),
    datasets: [
      {
        label: 'Queries by Topic',
        data: Object.values(data.by_topic),
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
      },
    ],
  };

  const clusterChartData = {
    labels: Object.keys(data.by_cluster),
    datasets: [
      {
        label: 'Queries by Cluster',
        data: Object.values(data.by_cluster),
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(20, 184, 166, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
      },
    ],
  };

  // Trend data (mock for now)
  const trendData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Queries',
        data: [12, 19, 15, 18],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header with Mock Badge */}
      <div className="card bg-gradient-to-r from-primary-50 to-accent-50 border-2 border-primary-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">DIET Dashboard</h2>
            <p className="text-gray-600">Aggregated statistics and module generation</p>
          </div>
          {mockMode && (
            <span className="px-4 py-2 bg-accent-500/20 text-accent-800 text-sm font-semibold rounded-full border border-accent-400">
              🧪 MOCK DATA — Backend Offline
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Queries</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              placeholder="Search by text..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Cluster</label>
            <select
              value={selectedCluster || ''}
              onChange={(e) => setSelectedCluster(e.target.value || null)}
              className="input-field"
            >
              <option value="">All Clusters</option>
              {Object.keys(data.by_cluster).map(cluster => (
                <option key={cluster} value={cluster}>{cluster}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="input-field"
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white"
        >
          <p className="text-sm text-primary-100 mb-1">Total Queries</p>
          <p className="text-4xl font-bold">{data.total_queries}</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white"
        >
          <p className="text-sm text-accent-100 mb-1">Topics</p>
          <p className="text-4xl font-bold">{Object.keys(data.by_topic).length}</p>
        </motion.div>
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white"
        >
          <p className="text-sm text-purple-100 mb-1">Clusters</p>
          <p className="text-4xl font-bold">{Object.keys(data.by_cluster).length}</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics Bar Chart - Clickable */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Queries by Topic</h3>
          <div style={{ cursor: 'pointer' }}>
            <Bar
              data={topicChartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                onClick: (_e, elements) => {
                  if (elements.length > 0) {
                    const index = elements[0].index;
                    const topic = Object.keys(data.by_topic)[index];
                    handleBarClick(topic);
                  }
                },
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      afterLabel: () => 'Click to see queries',
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Cluster Doughnut */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Queries by Cluster</h3>
          <Doughnut
            data={clusterChartData}
            options={{ responsive: true, maintainAspectRatio: true }}
          />
        </div>
      </div>

      {/* Trends Line Chart */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Query Trends (Last 4 Weeks)</h3>
        <Line data={trendData} options={{ responsive: true, maintainAspectRatio: true }} />
      </div>

      {/* Clusters List & Recent Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clusters List */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Clusters</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(data.by_cluster).map(([cluster, count]) => (
              <button
                key={cluster}
                onClick={() => setSelectedCluster(cluster === selectedCluster ? null : cluster)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCluster === cluster
                    ? 'bg-primary-100 border-2 border-primary-500'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{cluster}</span>
                  <span className="text-sm font-bold text-primary-600">{count}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Queries Feed */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Recent Queries</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredQueries.slice(0, 10).map((query) => (
              <motion.div
                key={query.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 rounded-r-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2 py-1 rounded">
                    {query.topic_tag}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(query.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-900 text-sm">{query.narrative_text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Module Button */}
      <div className="card">
        <button
          onClick={() => setShowModuleModal(true)}
          className="btn-primary w-full text-lg py-4"
        >
          📚 Generate Module
        </button>
      </div>

      {/* Topic Modal */}
      <AnimatePresence>
        {showTopicModal && selectedTopic && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-4">
                Queries for: {selectedTopic.replace('-', ' ')}
              </h3>
              <div className="space-y-3 mb-6">
                {topicQueries.map((query) => (
                  <div key={query.id} className="border-l-4 border-primary-500 pl-4 py-2 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">{query.narrative_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(query.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setModuleForm({ ...moduleForm, topic: selectedTopic });
                    setShowTopicModal(false);
                    setShowModuleModal(true);
                  }}
                  className="btn-primary flex-1"
                >
                  Generate Module for This Topic
                </button>
                <button
                  onClick={() => {
                    setShowTopicModal(false);
                    setSelectedTopic(null);
                  }}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generate Module Modal */}
      <AnimatePresence>
        {showModuleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              <h3 className="text-xl font-bold mb-4">Generate Micro-Module</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cluster</label>
                  <select
                    value={moduleForm.cluster}
                    onChange={(e) => setModuleForm({ ...moduleForm, cluster: e.target.value })}
                    className="input-field"
                  >
                    {Object.keys(data.by_cluster).map(cluster => (
                      <option key={cluster} value={cluster}>{cluster}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                  <select
                    value={moduleForm.topic}
                    onChange={(e) => setModuleForm({ ...moduleForm, topic: e.target.value })}
                    className="input-field"
                  >
                    {Object.keys(data.by_topic).map((topic) => (
                      <option key={topic} value={topic}>
                        {topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
                  <select
                    value={moduleForm.template}
                    onChange={(e) => setModuleForm({ ...moduleForm, template: e.target.value })}
                    className="input-field"
                  >
                    <option value="activity">Activity-Based</option>
                    <option value="parent">Parent Engagement</option>
                    <option value="micro">Micro-Teaching</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                    <select
                      value={moduleForm.grade}
                      onChange={(e) => setModuleForm({ ...moduleForm, grade: e.target.value })}
                      className="input-field"
                    >
                      {[1, 2, 3, 4, 5].map(g => (
                        <option key={g} value={g.toString()}>Grade {g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    <select
                      value={moduleForm.language}
                      onChange={(e) => setModuleForm({ ...moduleForm, language: e.target.value })}
                      className="input-field"
                    >
                      <option value="en">English</option>
                      <option value="hi">Hindi</option>
                      <option value="te">Telugu</option>
                    </select>
                  </div>
                </div>

                {generatedModule && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 border-2 border-green-200 rounded-xl p-4"
                  >
                    <p className="text-sm text-green-800 font-semibold mb-2">✅ Module generated successfully!</p>
                    <a
                      href={generatedModule.pptx_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm inline-block mb-2"
                    >
                      📥 Download PPTX
                    </a>
                    <button
                      onClick={() => {
                        // Mock email link
                        alert('Email link sent! (Mock - no actual email sent)');
                      }}
                      className="btn-secondary text-sm ml-2"
                    >
                      📧 Email Link
                    </button>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleGenerateModule}
                    disabled={moduleLoading}
                    className="btn-primary flex-1"
                  >
                    {moduleLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      'Generate'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowModuleModal(false);
                      setGeneratedModule(null);
                    }}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
