import sparkMd5 from 'spark-md5';

const blobToData = (blob) => {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = function() {
      resolve(reader.result);
    }
    reader.readAsBinaryString(blob);
  });
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
          // hashProgress.value = Number(((100 * count) / chunks.length).toFixed(2));
        } else {
          // hashProgress.value = 100;
          resolve(spark.end());
        }
      }
      console.log(`浏览器有任务了，开始计算${count}个，等待下次浏览器空闲`);
      window.requestIdleCallback(workLoop);
    }
    window.requestIdleCallback(workLoop);
  });
}

const calculateHashSample = async file => {
  return new Promise(resolve => {
    const spark = new sparkMd5.ArrayBuffer();
    const reader = new FileReader();
    // 文件大小
    const size = file.size;
    let offset = 2 * 1024 * 1024;

    let chunks = [file.slice(0, offset)];

    let cur = offset;

    while (cur < size) {
      // 最后一块全部加进来
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
      resolve(spark.end());
    }
  });
}

export {
  calculateHash,
  calculateHashIdle,
  calculateHashSample
}
