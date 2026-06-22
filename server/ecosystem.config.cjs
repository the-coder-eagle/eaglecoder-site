// PM2 进程管理配置
module.exports = {
  apps: [{
    name: 'eaglecoder-oj',
    script: 'node_modules/.bin/tsx',
    args: 'src/index.ts',
    cwd: '/www/wwwroot/eaglecoder-repo/server',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      DB_HOST: '127.0.0.1',
      DB_USER: 'oj',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_NAME: 'eaglecoder_oj',
    },
    max_memory_restart: '200M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: '/www/wwwlogs/eaglecoder-oj-error.log',
    out_file: '/www/wwwlogs/eaglecoder-oj-out.log',
    autorestart: true,
    watch: false,
  }],
};
