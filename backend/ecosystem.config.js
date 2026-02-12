module.exports = {
  apps: [{
    name: "whaticket-backend",
    script: "src/server.ts",
    interpreter: "node",
    interpreter_args: "-r ts-node/register",
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "1G",
    env: {
      NODE_ENV: "production",
      PORT: 8080
    },
    error_file: "/home/whaticketapp/.pm2/logs/whaticket-backend-err.log",
    out_file: "/home/whaticketapp/.pm2/logs/whaticket-backend-out.log",
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
}
