module.exports = {
  apps: [{
    name: 'thepropertygateway',
    script: 'node_modules/.bin/next',
    args: 'start -p 3003',
    cwd: '/var/www/thepropertygateway.com/E-Agent',
    env: {
      NODE_ENV: 'production',
      PORT: 3003
    },
    error_file: '/root/.pm2/logs/thepropertygateway-error.log',
    out_file: '/root/.pm2/logs/thepropertygateway-out.log'
  }]
};

