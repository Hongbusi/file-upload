// app/router.js
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/check', controller.home.check);
  router.post('/upload', controller.home.upload);
  router.post('/merge', controller.home.merge);

  router.get('/file', controller.file.fileList);
};
