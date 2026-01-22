import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { getAggregatedData, generateModule } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cluster: '',
    topic: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedModule, setGeneratedModule] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAggregatedData(filters);
      setStats(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    fetchData();
  };

  const handleGenerateModule = async () => {
    if (!filters.cluster || !filters.topic) {
      alert('Please select both cluster and topic filters first');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateModule({
        cluster: filters.cluster,
        topic: filters.topic,
        template: 'default'
      });
      setGeneratedModule(result);
      alert('Module generated successfully!');
    } catch (error) {
      console.error('Error generating module:', error);
      alert('Failed to generate module');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading dashboard...</div>;
  }

  // Prepare chart data
  const topicData = {
    labels: Object.keys(stats.by_topic),
    datasets: [{
      data: Object.values(stats.by_topic),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ],
    }],
  };

  const clusterData = {
    labels: Object.keys(stats.by_cluster),
    datasets: [{
      label: 'Queries by Cluster',
      data: Object.values(stats.by_cluster),
      backgroundColor: '#36A2EB',
    }],
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>DIET Dashboard</h2>
        <p>Aggregated Teacher Support Analytics</p>
      </div>

      {/* Filters */}
      <div style={styles.filterPanel}>
        <div style={styles.filterGroup}>
          <label style={styles.label}>Cluster:</label>
          <select
            value={filters.cluster}
            onChange={(e) => handleFilterChange('cluster', e.target.value)}
            style={styles.select}
          >
            <option value="">All Clusters</option>
            {Object.keys(stats.by_cluster).map(cluster => (
              <option key={cluster} value={cluster}>{cluster}</option>
            ))}
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.label}>Topic:</label>
          <select
            value={filters.topic}
            onChange={(e) => handleFilterChange('topic', e.target.value)}
            style={styles.select}
          >
            <option value="">All Topics</option>
            {Object.keys(stats.by_topic).map(topic => (
              <option key={topic} value={topic}>
                {topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
        </div>

        <button onClick={handleApplyFilters} style={styles.filterButton}>
          Apply Filters
        </button>

        <button
          onClick={handleGenerateModule}
          style={{...styles.filterButton, ...styles.generateButton}}
          disabled={generating || !filters.cluster || !filters.topic}
        >
          {generating ? 'Generating...' : '📄 Generate Module'}
        </button>
      </div>

      {/* Stats Summary */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{stats.total_queries}</h3>
          <p style={styles.statLabel}>Total Queries</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{Object.keys(stats.by_topic).length}</h3>
          <p style={styles.statLabel}>Active Topics</p>
        </div>
        <div style={styles.statCard}>
          <h3 style={styles.statNumber}>{Object.keys(stats.by_cluster).length}</h3>
          <p style={styles.statLabel}>Clusters</p>
        </div>
      </div>

      {/* Generated Module Info */}
      {generatedModule && (
        <div style={styles.moduleAlert}>
          <strong>✅ Module Generated!</strong>
          <a
            href={`http://localhost:8000${generatedModule.pptx_link}`}
            download
            style={styles.downloadLink}
          >
            📥 Download {generatedModule.title}
          </a>
        </div>
      )}

      {/* Charts */}
      <div style={styles.chartsGrid}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Queries by Topic</h3>
          <div style={styles.chartContainer}>
            <Pie data={topicData} options={{ maintainAspectRatio: false }} />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Queries by Cluster</h3>
          <div style={styles.chartContainer}>
            <Bar
              data={clusterData}
              options={{
                maintainAspectRatio: false,
                scales: {
                  y: { beginAtZero: true }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Sample Queries Table */}
      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>Recent Queries</h3>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Topic</th>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.sample_queries.map((query, idx) => (
                <tr key={idx} style={idx % 2 === 0 ? styles.evenRow : styles.oddRow}>
                  <td style={styles.td}>
                    {new Date(query.created_at).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <span style={styles.topicBadge}>
                      {query.topic_tag.replace('-', ' ')}
                    </span>
                  </td>
                  <td style={styles.td}>{query.narrative_text}</td>
                  <td style={styles.td}>
                    {query.resolved ? (
                      <span style={{...styles.badge, ...styles.resolvedBadge}}>Resolved</span>
                    ) : (
                      <span style={{...styles.badge, ...styles.pendingBadge}}>Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
  },
  filterPanel: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minWidth: '200px',
  },
  label: {
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  },
  filterButton: {
    padding: '10px 20px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  statNumber: {
    fontSize: '36px',
    margin: '0 0 10px 0',
    color: '#2196F3',
  },
  statLabel: {
    margin: 0,
    color: '#666',
    fontSize: '14px',
  },
  moduleAlert: {
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  downloadLink: {
    color: 'white',
    textDecoration: 'underline',
    fontWeight: 'bold',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  chartCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
  },
  chartContainer: {
    height: '300px',
    position: 'relative',
  },
  tableCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  tableTitle: {
    marginTop: 0,
    marginBottom: '15px',
    fontSize: '18px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #ddd',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
  },
  evenRow: {
    backgroundColor: 'white',
  },
  oddRow: {
    backgroundColor: '#fafafa',
  },
  topicBadge: {
    backgroundColor: '#E3F2FD',
    color: '#1976D2',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    textTransform: 'capitalize',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  resolvedBadge: {
    backgroundColor: '#C8E6C9',
    color: '#2E7D32',
  },
  pendingBadge: {
    backgroundColor: '#FFF9C4',
    color: '#F57F17',
  },
};

export default Dashboard;