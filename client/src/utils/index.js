// 返回文件后缀名
const ext = filename => {
  return filename.split('.').pop();
}

const CHUNK_SIZE = 1 * 1024 * 1024;
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

export {
  ext,
  createFileChunk
}
