const fse = require('fs-extra');
const Controller = require('egg').Controller;

class FileController extends Controller {
  async fileList() {
    const { ctx, config  } = this;
    const data = await fse.readdir(config.UPLOAD_DIR);
    ctx.body = {
      data
    }
  }
}

module.exports = FileController;
