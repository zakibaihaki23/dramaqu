// ecosystem.config.cjs (CommonJS format)
module.exports = {
  apps: [
    {
      name: "dramaqu-bot",
      script: "server/telegram-bot.js",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
      // Load environment variables from .env file
      env_file: ".env",
    },
  ],
}
