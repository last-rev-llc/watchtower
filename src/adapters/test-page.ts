/**
 * Generates the healthcheck test page HTML
 */

export function generateTestPage(healthcheckEndpoint: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Healthcheck Test</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 900px;
      width: 100%;
      padding: 30px;
    }

    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .token-section {
      margin-bottom: 20px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .token-input-group {
      display: flex;
      gap: 10px;
      margin-top: 10px;
    }

    input[type="password"],
    input[type="text"] {
      flex: 1;
      padding: 12px;
      border: 2px solid #dee2e6;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.2s;
    }

    input[type="password"]:focus,
    input[type="text"]:focus {
      outline: none;
      border-color: #667eea;
    }

    button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    button:hover {
      background: #5568d3;
    }

    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .toggle-visibility {
      padding: 12px 16px;
      background: #6c757d;
      font-size: 12px;
    }

    .toggle-visibility:hover {
      background: #5a6268;
    }

    .status-section {
      margin-top: 30px;
    }

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-up {
      background: #d4edda;
      color: #155724;
    }

    .status-down {
      background: #f8d7da;
      color: #721c24;
    }

    .status-partial {
      background: #fff3cd;
      color: #856404;
    }

    .status-unknown {
      background: #e2e3e5;
      color: #383d41;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error {
      padding: 15px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 6px;
      margin-bottom: 20px;
      border: 1px solid #f5c6cb;
    }

    .error-label {
      font-weight: 600;
    }

    .result-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      border: 1px solid #e9ecef;
    }

    pre {
      background: #282c34;
      color: #abb2bf;
      padding: 20px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    }

    .info {
      margin-top: 20px;
      padding: 15px;
      background: #e7f3ff;
      border-left: 4px solid #2196F3;
      border-radius: 4px;
      font-size: 13px;
      color: #0c5460;
    }

    .timestamp {
      color: #666;
      font-size: 12px;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏥 Healthcheck Status</h1>
    <p class="subtitle">Test your healthcheck endpoint securely</p>

    <div class="token-section">
      <label for="token" style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
        Authentication Token
      </label>
      <div class="token-input-group">
        <input 
          type="password" 
          id="token" 
          placeholder="Enter your HEALTHCHECK_TOKEN"
          autocomplete="off"
        >
        <button class="toggle-visibility" onclick="toggleVisibility()">👁️ Show</button>
        <button onclick="checkHealth()" id="checkBtn">Check Health</button>
      </div>
      <p style="margin-top: 10px; font-size: 12px; color: #666;">
        Token is stored in session storage for this browser session only
      </p>
    </div>

    <div id="error" style="display: none;"></div>

    <div class="status-section" id="statusSection" style="display: none;">
      <div class="status-header">
        <h2 style="font-size: 20px; color: #333;">Health Status</h2>
        <span id="statusBadge" class="status-badge"></span>
      </div>
      <div class="result-container">
        <pre id="result"></pre>
      </div>
      <p class="timestamp" id="timestamp"></p>
      <button onclick="checkHealth()" style="margin-top: 15px;">🔄 Refresh</button>
    </div>

    <div id="loading" class="loading" style="display: none;">
      <div class="spinner"></div>
      <p>Checking health status...</p>
    </div>

    <div class="info">
      <strong>ℹ️ Security Note:</strong> This page uses secure header-based authentication. 
      Your token is never exposed in the URL or browser history. Token is stored in session storage 
      and cleared when you close the browser tab.
    </div>
  </div>

  <script>
    const HEALTHCHECK_ENDPOINT = ${JSON.stringify(healthcheckEndpoint)};

    // Load token from sessionStorage on page load
    window.addEventListener('DOMContentLoaded', () => {
      const savedToken = sessionStorage.getItem('healthcheck_token');
      if (savedToken) {
        document.getElementById('token').value = savedToken;
        document.getElementById('token').type = 'password';
      }
    });

    function toggleVisibility() {
      const input = document.getElementById('token');
      const button = document.querySelector('.toggle-visibility');
      if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈 Hide';
      } else {
        input.type = 'password';
        button.textContent = '👁️ Show';
      }
    }

    async function checkHealth() {
      const token = document.getElementById('token').value.trim();
      const errorDiv = document.getElementById('error');
      const statusSection = document.getElementById('statusSection');
      const loading = document.getElementById('loading');
      const checkBtn = document.getElementById('checkBtn');

      // Hide previous results
      errorDiv.style.display = 'none';
      statusSection.style.display = 'none';

      if (!token) {
        errorDiv.style.display = 'block';
        errorDiv.className = 'error';
        // Clear any previous content
        errorDiv.textContent = '';
        // Create label with bold styling
        const label = document.createElement('span');
        label.className = 'error-label';
        label.textContent = 'Error: ';
        errorDiv.appendChild(label);
        // Add error message (safely escaped via textContent)
        errorDiv.appendChild(document.createTextNode('Please enter your authentication token'));
        return;
      }

      // Save token to sessionStorage
      sessionStorage.setItem('healthcheck_token', token);

      // Show loading
      loading.style.display = 'block';
      checkBtn.disabled = true;

      try {
        const response = await fetch(HEALTHCHECK_ENDPOINT, {
          headers: {
            'Authorization': \`Bearer \${token}\`
          }
        });

        const data = await response.json();

        // Hide loading
        loading.style.display = 'none';
        checkBtn.disabled = false;

        if (!response.ok) {
          // Handle error response
          errorDiv.style.display = 'block';
          errorDiv.className = 'error';
          // Clear any previous content
          errorDiv.textContent = '';
          // Create label with bold styling
          const label = document.createElement('span');
          label.className = 'error-label';
          label.textContent = \`Error \${response.status}: \`;
          errorDiv.appendChild(label);
          // Add error message (safely escaped via textContent)
          errorDiv.appendChild(document.createTextNode(data.error || 'Unauthorized'));
          return;
        }

        // Display results
        const statusBadge = document.getElementById('statusBadge');
        const status = data.status || 'Unknown';
        
        statusBadge.textContent = status;
        // Sanitize status for CSS class name (only allow alphanumeric, hyphen, underscore)
        const sanitizedStatus = String(status).toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'unknown';
        statusBadge.className = \`status-badge status-\${sanitizedStatus}\`;

        document.getElementById('result').textContent = JSON.stringify(data, null, 2);
        document.getElementById('timestamp').textContent = \`Last checked: \${new Date().toLocaleString()}\`;
        statusSection.style.display = 'block';

      } catch (error) {
        loading.style.display = 'none';
        checkBtn.disabled = false;
        errorDiv.style.display = 'block';
        errorDiv.className = 'error';
        // Clear any previous content
        errorDiv.textContent = '';
        // Create label with bold styling
        const label = document.createElement('span');
        label.className = 'error-label';
        label.textContent = 'Error: ';
        errorDiv.appendChild(label);
        // Add error message (safely escaped via textContent)
        errorDiv.appendChild(document.createTextNode((error as Error)?.message || 'Unknown error'));
      }
    }

    // Allow Enter key to trigger check
    document.getElementById('token').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        checkHealth();
      }
    });
  </script>
</body>
</html>`;
}
