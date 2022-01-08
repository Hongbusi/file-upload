<template>
  <a-layout class="file-upload">
    <a-layout-header>File Upload</a-layout-header>
    <a-layout-content>
      <input type="file" name="file" @change="handleFileChange" />
      <a-space>
        <a-button type="primary" @click="handleUpload">上传</a-button>
        <a-button type="primary" @click="handleSlowUpload">慢启动上传</a-button>
      </a-space>
    </a-layout-content>
    <a-layout-footer>Copyright © 2021-present Hongbusi</a-layout-footer>
  </a-layout>
</template>

<script setup>
// import service from '@/utils/request';

// service.get('/').then(res => {
//   console.log(res);
// })
let selectedFile = null;

const handleFileChange = (e) => {
  const [file] = e.target.files;
  if (!file) return;
  selectedFile = file;
}

const blobToData = (blob) => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    }
    reader.readAsBinaryString(blob);
  });
}

// 上传
const handleUpload = () => {

}

// 慢上传
const handleSlowUpload = () => {

}
</script>

<style lang="less" scoped>
.ant-layout {
  text-align: center;

  .ant-layout-header {
    font-size: 20px;
    color: #fff;
    background: #7dbcea;
  }

  .ant-layout-content {
    margin-top: 50px;
    min-height: calc(100vh - 64px - 70px);
  }
}
</style>
