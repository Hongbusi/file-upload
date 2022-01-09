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
import { ref } from 'vue';
import sparkMd5 from 'spark-md5';
import { message } from 'ant-design-vue';
import { check, upload } from '@/api';

const CHUNK_SIZE = 1 * 1024 * 1024; // 1M
let selectedFile = null;
let chunks = [];
let hashProgress = ref(0);

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

const createFileChunk = (file, size = CHUNK_SIZE) => {
  // 生成文件块 Blob.slice 语法
  const chunks = [];
  let cur = 0;
  while (cur < file.size) {
    chunks.push({ index: cur, file: file.slice(cur, cur + size) });
    cur += size;
  }
  return chunks;
}

// 直接计算 md5，大文件会卡顿
const calculateHash = async file => {
  const data = await blobToData(file);
  return sparkMd5.hash(data);
}

const calculateHashIdle = async chunks => {
  return new Promise(resolve => {
    const spark = new sparkMd5.ArrayBuffer();
    let count = 0;
    const appendToSpark = file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = e => {
          spark.append(e.target.result);
          resolve();
        }
      });
    }

    const workLoop = async deadline => {
      while (count < chunks.length && deadline.timeRemaining() > 1) {
        await appendToSpark(chunks[count].file)
        count++;
        if (count < chunks.length) {
          hashProgress.value = Number(((100 * count) / chunks.length).toFixed(2));
        } else {
          hashProgress.value = 100;
          resolve(spark.end());
        }
      }
      console.log(`浏览器有任务了，开始计算${count}个，等待下次浏览器空闲`);
      window.requestIdleCallback(workLoop);
    }
    window.requestIdleCallback(workLoop);
  });
}

const calculateHashSample = file => {
  return new Promise(resolve => {
    const spark = new sparkMd5.ArrayBuffer();
    const reader = new FileReader();
    // 文件大小
    const size = file.size;
    let offset = 2 * 1024 * 1024;

    let chunks = [file.slice[0, offset]];

    let cur = offset;

    while (cur < size) {
      if (cur + offset >= size) {
        chunks.push(file.slice(cur, cur + offset));
      } else {
        // 中间的：前中后取两个字节
        const mid = cur + offset / 2;
        const end = cur + offset;
        chunks.push(file.slice(cur, cur + 2));
        chunks.push(file.slice(mid, mid + 2));
        chunks.push(file.slice(end - 2, end));
      }
      cur += offset;
    }

    // 拼接
    reader.readAsArrayBuffer(new Blob(chunks));
    reader.onload = e => {
      spark.append(e.target.result);
      hashProgress.value = 100;
      resolve(spark.end());
    }
  });
}

// 返回文件后缀名
const ext = filename => {
  return filename.split('.').pop();
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
  } catch (error) {
    message.error('上传似乎出了点问题～');
  }
}

// 上传
const handleUpload = async () => {
  if (!selectedFile) {
    message.info('请选择文件');
    return;
  }

  chunks = createFileChunk(selectedFile);

  // 计算 hash 文件指纹标识
  // let hash = await calculateHash(selectedFile);
  // web-worker 防止卡顿主线程（略）
  // requestIdleCallback
  // let hash = await calculateHashIdle(chunks);

  // 抽样哈希，牺牲一定的准确率换来效率，hash 一样的不一定是同一个文件，但是不一样的一定不是
  let hash = await calculateHashSample(selectedFile);

  const { uploaded, uploadedList } = await check({
    ext: ext(selectedFile.name),
    hash
  });

  if (uploaded) {
    return message.success('秒传：上传成功！')
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
