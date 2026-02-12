module.exports = {
  apps: [{
    name: 'whaticket-frontend',
    script: 'server.js',
    cwd: '/home/whaticketapp/whaticket-free/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--openssl-legacy-provider'
    },
    error_file: '/home/whaticketapp/logs/frontend-error.log',
    out_file: '/home/whaticketapp/logs/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
