// API 配置
// 注意：这里使用你本地网络 IP，确保前端能访问到后端
const API_BASE_URL = 'https://nl2sql-backend-amok.onrender.com/api/query'; 

// 设置请求超时
const TIMEOUT = 30000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

// 1. 检查后端健康状态
export async function checkHealth() {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/health`);
    return response;
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 2. 自然语言转 SQL
export async function convertNLToSQL(naturalLanguage) {
  try {
    console.log('📤 Converting:', naturalLanguage);
    const response = await fetchWithTimeout(`${API_BASE_URL}/nl-to-sql`, {
      method: 'POST',
      body: JSON.stringify({ natural_language: naturalLanguage }),
    });
    console.log('✅ Converted:', response.sql);
    return response;
  } catch (error) {
    console.error('❌ Conversion failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 3. 执行 SQL 查询
export async function executeSQL(sql) {
  try {
    console.log('⚙️ Executing:', sql);
    const response = await fetchWithTimeout(`${API_BASE_URL}/execute`, {
      method: 'POST',
      body: JSON.stringify({ sql }),
    });
    console.log('✅ Results:', response.results);
    return response;
  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    return { success: false, error: error.message };
  }
}

// 4. 一键转换并执行
export async function executeNL(naturalLanguage) {
  try {
    console.log('🚀 Executing NL query:', naturalLanguage);
    const response = await fetchWithTimeout(`${API_BASE_URL}/nl-execute`, {
      method: 'POST',
      body: JSON.stringify({ natural_language: naturalLanguage }),
    });
    console.log('✅ Full execution complete');
    return response;
  } catch (error) {
    console.error('❌ NL execution failed:', error.message);
    return { success: false, error: error.message };
  }
}

export default {
  checkHealth,
  convertNLToSQL,
  executeSQL,
  executeNL,
};