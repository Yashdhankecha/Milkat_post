module.exports = {
  apps: [
    {
      name: "milkatpost",
      script: "./server/server.js",
      watch: true,
      env: {
        NODE_ENV: "production",
        PORT: 5000
      }
    }
  ]
};

