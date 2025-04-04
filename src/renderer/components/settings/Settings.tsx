import React, { useState } from 'react';

const Settings = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Query cannot be empty.');
      return;
    }
    try {
      const res = await window.electron.runSqlCommand(query);
      setResult(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred.');
      setResult([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>SQL Query Runner</h2>
      <textarea
        rows={6}
        style={{
          width: '100%',
          fontSize: '16px',
          padding: '10px',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
          borderRadius: '5px',
        }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your SQL query here..."
      />
      <button
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          cursor: 'pointer',
          background: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
        }}
        onClick={executeQuery}
      >
        Run Query
      </button>

      {error && <pre style={{ color: 'red', marginTop: '10px' }}>{error}</pre>}

      {result.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Result:</h4>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '10px',
              border: '1px solid #ddd',
            }}
          >
            <thead>
              <tr>
                {Object.keys(result[0] || {}).map((key) => (
                  <th
                    key={key}
                    style={{
                      border: '1px solid #ddd',
                      padding: '8px',
                    }}
                  >
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, idx) => (
                    <td
                      key={idx}
                      style={{ border: '1px solid #ddd', padding: '8px' }}
                    >
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Settings;
