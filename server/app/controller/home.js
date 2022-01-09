// app/controller/home.js
const path = require('path');
const fse = require('fs-extra');

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    this.ctx.body = 'Hello world';
  }

  async fileList() {
    const { ctx, config  } = this;

    if (!fse.existsSync(config.UPLOAD_DIR)) {
      return ctx.body = {
        data: []
      }
    }

    let data = await fse.readdir(config.UPLOAD_DIR);
    ctx.body = {
      data
    }
  }

  async getUploadList(dirPath) {
    // 过滤诡异文件的隐藏文件，比如 .DS_sotre
    return fse.existsSync(dirPath) ? (await fse.readdir(dirPath)).filter(name => name[0] !== '.') : [];
  }

  async check() {
    const { ext, hash } = this.ctx.request.body;
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    let uploaded = false;
    let uploadedList = [];

    if (fse.existsSync(filePath)) {
      uploaded = true;
    } else {
      // 文件没有完全上传完毕，但是可能存在的部分切片上传完毕了
      uploadedList = await this.getUploadList(path.resolve(this.config.UPLOAD_DIR, hash));
    }

    this.ctx.body = {
      code: 0,
      uploaded,
      uploadedList
    };
  }

  async merge() {
    const { ext, size, hash } = this.ctx.request.body;
    const filePath = path.resolve(this.config.UPLOAD_DIR, `${hash}.${ext}`);
    await this.ctx.service.upload.mergeFileChunk(filePath, hash, size);
    this.ctx.body = {
      code: 0,
      message: '合并成功'
    };
  }

  async upload() {
    const { ctx } = this;

    // 随机报个错
    if (Math.random() < 0.5) {
      return ctx.status = 500;
    }

    const file = ctx.request.files[0];
    const { chunkname, ext, hash } = ctx.request.body;

    const filename = `${hash}.${ext}`;
    // 最终文件存储位置，根据 chunkname 获取后缀，名字用 hash
    const filePath = path.resolve(this.config.UPLOAD_DIR, filename);

    // 碎片文件夹，用 hash 命名
    const chunkPath = path.resolve(this.config.UPLOAD_DIR, hash);

    // 文件存在直接返回
    if (fse.existsSync(filePath)) {
      return ctx.body = {
        code: -1,
        message: '文件存在',
        url: `/public/${filePath}`
      };
    }

    if (!fse.existsSync(this.config.UPLOAD_DIR)) {
      await fse.mkdirs(this.config.UPLOAD_DIR);
    }

    await fse.move(file.filepath, `${chunkPath}/${chunkname}`);
    ctx.body = {
      code: 0,
      message: '上传成功',
      url: `/public/${filename}`
    }
  }
}

module.exports = HomeController;
