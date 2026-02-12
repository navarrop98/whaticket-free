module.exports = {
  apps: [{
    name: 'whaticket-frontend',
    script: 'serve',
    args: ['-s', 'build', '-l', '3000', '--cors', '--no-clipboard'],
    cwd: '/home/whaticketapp/whaticket-free/frontend',
    interpreter: 'none',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      PM2_SERVE_PATH: './build',
      PM2_SERVE_PORT: 3000,
      PM2_SERVE_SPA: 'true',
      PM2_SERVE_HOMEPAGE: '/index.html'
    },
    error_file: '/home/whaticketapp/logs/frontend-error.log',
    out_file: '/home/whaticketapp/logs/frontend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    time: true
  }]
};
