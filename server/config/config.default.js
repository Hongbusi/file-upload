// config/config.default.js
const path = require('path');

module.exports = appInfo => {
  const config = {};
  config.keys = 'Hongbusi@!#file-upload!';
  config.multipart = {
    mode: 'file',
    whitelist: () => true
  };
  config.security = {
    csrf: {
      enable: false
    },
  }
  config.UPLOAD_DIR = path.resolve(__dirname, '..', 'app/public'); // 大文件存储目录

  return config;
};
