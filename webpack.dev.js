/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { stylePaths } = require('./stylePaths');
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || '9000';

function jiraProxyPortFromEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  if (!fs.existsSync(envPath)) return null;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = /^JIRA_PROXY_PORT\s*=\s*"?(\d+)"?\s*$/.exec(t);
    if (m) return m[1];
  }
  return null;
}

const JIRA_PROXY_PORT = process.env.JIRA_PROXY_PORT || jiraProxyPortFromEnvFile() || '3848';

module.exports = merge(common('development'), {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    host: HOST,
    port: PORT,
    historyApiFallback: true,
    open: true,
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    client: {
      overlay: true,
    },
    proxy: [
      {
        context: ['/api/jira'],
        target: `http://127.0.0.1:${JIRA_PROXY_PORT}`,
        changeOrigin: true,
        onProxyRes(proxyRes, _req, res) {
          const v = proxyRes.headers['x-hcc-jira-proxy'];
          if (v) {
            res.setHeader('X-Hcc-Jira-Proxy', Array.isArray(v) ? v[0] : String(v));
          }
        },
      },
    ],
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        include: [...stylePaths],
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
});
