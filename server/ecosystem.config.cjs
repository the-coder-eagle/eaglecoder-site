// PM2 进程管理配置
module.exports = {
  apps: [{
    name: 'eaglecoder-oj',
    script: 'dist/index.js',
    cwd: '/www/wwwroot/eaglecoder-repo/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    max_memory_restart: '200M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/www/wwwlogs/eaglecoder-oj-error.log',
    out_file: '/www/wwwlogs/eaglecoder-oj-out.log',
    autorestart: true,
    watch: false,
  }],
};
