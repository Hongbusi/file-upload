<template>
  <a-button type="primary">file upload client</a-button>
</template>

<script lang="ts" setup>
import service from '@/utils/request';

service.get('/').then(res => {
  console.log(res);
})
</script>
