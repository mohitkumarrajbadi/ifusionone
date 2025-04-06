import React, { useState } from 'react';

const Settings = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeQuery();
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>SQL Query Runner</h2>
      <textarea
        rows={6}
        style={{ width: '100%', fontSize: '16px', padding: '10px' }}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your SQL query here..."
      />
      <button
        style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}
        onClick={executeQuery}
      >
        Run Query
      </button>

      {error && <pre style={{ color: 'red' }}>{error}</pre>}

      {result.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4>Result:</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Settings;
