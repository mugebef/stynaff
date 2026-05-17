module.exports = {
  apps: [
    {
      name: 'stynaff',
      script: './server.ts',
      cwd: '/home/stynaff',
      interpreter: './node_modules/.bin/tsx',
      max_memory_restart: '1000M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
