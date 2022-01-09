<template>
  <a-layout class="file-upload">
    <a-layout-header>File Upload</a-layout-header>

    <a-list item-layout="horizontal" size="small" :data-source="fileList.data">
      <template #header>
        <div>文件列表</div>
      </template>
      <template #renderItem="{ item }">
        <a-list-item>{{ item }}</a-list-item>
      </template>
    </a-list>

    <a-divider />

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
import { reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { ext, createFileChunk } from '@/utils';
import { calculateHash, calculateHashIdle, calculateHashSample } from '@/utils/calculateHash';
import { file, check, upload, merge } from '@/api';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1M
let selectedFile = null;
let hash = null;
let chunks = [];

// 获取文件列表
const fileList = reactive({ data: [] });
const fetchFileList = async () => {
  const { data } = await file();
  fileList.data = data;
}

onMounted(() => {
  fetchFileList();
});

const handleFileChange = (e) => {
  const [file] = e.target.files;
  if (!file) return;
  selectedFile = file;
}

// 上传
const handleUpload = async () => {
  if (!selectedFile) {
    message.info('请选择文件');
    return;
  }

  chunks = createFileChunk(selectedFile);

  // 计算 hash 文件指纹标识
  // hash = await calculateHash(selectedFile);
  // web-worker 防止卡顿主线程（略）
  // requestIdleCallback
  // hash = await calculateHashIdle(chunks);

  // 抽样哈希，牺牲一定的准确率换来效率，hash 一样的不一定是同一个文件，但是不一样的一定不是
  hash = await calculateHashSample(selectedFile);

  const { uploaded, uploadedList } = await check({
    ext: ext(selectedFile.name),
    hash
  });

  if (uploaded) {
    return message.success('已存在，无需再次上传！');
  }

  chunks = chunks.map((chunk, index) => {
    // 每一个切片的名字
    const chunkName = `${hash}-${index}`;
    return {
      hash,
      chunk: chunk.file,
      name: chunkName,
      index,
      // 设置进度条
      progress: uploadedList.indexOf(chunkName) > -1 ? 100 : 0
    }
  });

  await uploadChunks(uploadedList);
}

// 慢上传
const handleSlowUpload = () => {

}

const uploadChunks = async (uploadedList = []) => {
  const list = chunks
    .filter(chunks => uploadedList.indexOf(chunks.name) == -1)
    .map(({ chunk, name, hash, index }) => {
      const form = new FormData();
      form.append('chunkname', name);
      form.append('ext', ext(selectedFile.name));
      form.append('hash', hash);
      form.append('file', chunk);
      return { form, index, error: 0 };
    });

  try {
    await sendRequest([...list], 4);
    if (uploadedList.length + list.length === chunks.length) {
      await mergeRequest();
      message.success('上传成功！');
      fetchFileList();
    }
  } catch (error) {
    message.error('上传似乎出了点问题～');
  }
}

const sendRequest = (chunks, limit = 4) => {
  return new Promise((resolve, reject) => {
    const len = chunks.length;
    let counter = 0;
    let isStop = false;

    const start = async () => {
      if (isStop) {
        return;
      }

      const task = chunks.shift();

      if (task) {
        const { form, index } = task;

        try {
          await upload(form);

          if (counter === len - 1) {
            resolve();
          } else {
            counter++;
            start();
          }
        } catch (error) {
          // 当前切片报错了
          // 尝试 3 次重试机制，重新 push 到数组中
          console.log('出错了');
          if (task.error < 3) {
            task.error++
            // 队首进去，准备重试
            chunks.unshift(task);
            start();
          } else {
            // 错误 3 次了，直接结束
            isStop = true;
            reject();
          }
        }
      }
    }


    while(limit > 0){
      setTimeout(() => {
        // 模拟延迟
        start();
      }, Math.random() * 2000);

      limit-=1;
    }
  });
}

const mergeRequest = async () => {
  await merge({
    ext: ext(selectedFile.name),
    size: CHUNK_SIZE,
    hash
  });
}
</script>

<style lang="less" scoped>
.ant-layout {
  text-align: center;
  background-color: #fff;

  .ant-layout-header {
    font-size: 20px;
    color: #fff;
    background: #7dbcea;
  }

  .ant-layout-content {
    padding-top: 50px;
    min-height: calc(100vh - 64px - 70px);
  }
}

.ant-list {
  margin-right: auto;
  margin-left: auto;
  width: 500px;
}
</style>
