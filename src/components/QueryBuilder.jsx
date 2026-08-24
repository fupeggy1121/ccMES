import React, { useState, useEffect } from 'react';
import { convertNLToSQL, executeNL, checkHealth } from '../services/api';
import './QueryBuilder.css';

export default function QueryBuilder() {
  const [nlQuery, setNlQuery] = useState('');
  const [sql, setSql] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);

  // 检查后端连接
  useEffect(() => {
    const checkConnection = async () => {
      const health = await checkHealth();
      setBackendConnected(health.success);
    };
    checkConnection();
  }, []);

  // 只转换为 SQL（不执行）
  const handleConvert = async () => {
    if (!nlQuery.trim()) {
      setError('请输入自然语言查询');
      return;
    }

    setLoading(true);
    setError(null);
    setSql('');
    setResults(null);

    try {
      const response = await convertNLToSQL(nlQuery);
      if (response.success) {
        setSql(response.sql);
      } else {
        setError(response.error || 'Conversion failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 转换并执行
  const handleExecute = async () => {
    if (!nlQuery.trim()) {
      setError('请输入自然语言查询');
      return;
    }

    setLoading(true);
    setError(null);
    setSql('');
    setResults(null);

    try {
      const response = await executeNL(nlQuery);
      if (response.success) {
        setSql(response.sql);
        setResults(response.results);
      } else {
        setError(response.error || 'Execution failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="query-builder">
      <div className="header">
        <h1>🤖 NL2SQL 查询工具</h1>
        <div className={`status ${backendConnected ? 'connected' : 'disconnected'}`}>
          {backendConnected ? '✅ 后端已连接' : '❌ 后端未连接'}
        </div>
      </div>

      {/* 输入框 */}
      <div className="input-section">
        <label>输入自然语言查询：</label>
        <textarea
          placeholder="例如：查询所有用户的名字和邮箱&#10;或：显示销售额最高的前5个产品"
          value={nlQuery}
          onChange={(e) => setNlQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              handleExecute();
            }
          }}
          disabled={loading}
          rows={4}
        />
        <small>💡 提示：按 Ctrl+Enter 快速执行</small>
      </div>

      {/* 按钮组 */}
      <div className="button-group">
        <button 
          onClick={handleConvert}
          disabled={loading || !backendConnected}
          className="btn btn-convert"
        >
          {loading ? '处理中...' : '转换为 SQL'}
        </button>
        <button 
          onClick={handleExecute}
          disabled={loading || !backendConnected}
          className="btn btn-execute"
        >
          {loading ? '处理中...' : '转换并执行'}
        </button>
      </div>

      {/* SQL 显示 */}
      {sql && (
        <div className="result-section sql-section">
          <h3>📝 生成的 SQL：</h3>
          <pre>{sql}</pre>
          <button 
            onClick={() => navigator.clipboard.writeText(sql)}
            className="btn btn-small"
          >
            复制 SQL
          </button>
        </div>
      )}

      {/* 查询结果 */}
      {results && (
        <div className="result-section">
          <h3>📊 查询结果：</h3>
          {Array.isArray(results) ? (
            <table className="result-table">
              <thead>
                <tr>
                  {Object.keys(results[0] || {}).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((val, i) => (
                      <td key={i}>{String(val)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre>{JSON.stringify(results, null, 2)}</pre>
          )}
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div className="error-message">
          <strong>⚠️ 错误：</strong> {error}
        </div>
      )}
    </div>
  );
}