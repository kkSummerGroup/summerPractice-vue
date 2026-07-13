<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="uploadFile">上传到阿里云服务器</button>
  </div>
</template>

<script>
import axios from 'axios';
import {API_BASE_URL} from "@/tool/config";

export default {
  data() {
    return {
      file: null,
    };
  },
  methods: {
    handleFileChange(event) {
      this.file = event.target.files[0];
    },
    async uploadFile() {
      if (!this.file) {
        alert('请选择一个文件');
        return;
      }

      const formData = new FormData();
      formData.append('file', this.file);

      try {
        const response = await axios.post(`${API_BASE_URL}/file/upload-to-aliyun`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(percentCompleted);
          },
        });
        console.log('文件上传成功:', response.data);
      } catch (error) {
        console.error('文件上传失败:', error);
      }
    },
  },
};
</script>
