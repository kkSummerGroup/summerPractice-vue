<template>
  <div class="container">
    <el-button class="button" type="primary" @click="getAllMedData()">查询</el-button>
    <el-divider></el-divider>
    <div class="medicine-container">
      <div v-for="(item, index) in allMedData" :key="index" class="medicine-box">
        <!-- 点击图片触发预览 -->
        <img
          :src="item.medPic"
          alt="药品"
          class="medicine-image"
          @click="openPreview(item)"
        >
        <div class="medicine-name" v-if="!item.medName">{{ item.medNumber }}</div>
        <div class="medicine-name" v-if="!item.medNumber">{{ item.medName }}</div>

        <div class="medicine-type">{{ item.medType }}</div>
      </div>

      <!-- 放大预览的弹窗 -->
      <el-dialog :visible.sync="previewVisible" width="50%">
        <img :src="previewMedImage" style="width: 50%; max-height: 30vh; object-fit: contain;">
        <img :src="previewPillImage" style="width: 50%; max-height: 30vh; object-fit: contain;">
        <div v-if="currentItem" style="margin-top: 20px;">
          <p v-if="!currentItem.medName"><strong>药品编号：</strong>{{ currentItem.medNumber }}</p>
          <p v-if="!currentItem.medNumber"><strong>药品名称：</strong>{{ currentItem.medName }}</p>
          <p><strong>用法用量：</strong>{{ currentItem.medAmount }}</p>
          <p><strong>描述：</strong>{{ currentItem.medRemark }}</p>
<!--          <p><strong>药品名称：</strong>{{ currentItem.medName }}</p>-->
        </div>
      </el-dialog>
    </div>

  </div>
</template>

<script>
import request from "@/api";

export default {
  name: "",
  data() {
    return {
      // 表格样式
      headerCellStyle: {
        borderTop: '2px solid #ebeef5' // 设置表头的上边框
      },

      // 全部用户数据
      allMedData: [],

      // medData: {
      //   headPortrait: "",
      //   medId: "",
      //   medname: "",
      //   password: "",
      //   type: 1, // 1表示编辑
      // },

      // 验证规则
      formRules: {
        medname: [
          {required: true, message: '名称是必填的', trigger: 'blur'},
          {max: 12, message: '名称不能超过12个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '密码是必填的', trigger: 'blur'},
          {min: 6, max: 20, message: '密码长度必须在6到20个字符之间', trigger: 'blur'}
        ]
      },

      fileList: [],
      dialogImageUrl: '',

      // 用户查询对象
      queryMed: {
        medType: '',
        medNumber:  '',
        medName: '',
        medUsage: '',
        medAmount: '',
        medRemark: '',
        current: 1,
        size: 100,
        total: 0
      },

      // 弹窗
      updateShow: false,
      deleteShow: false,
      previewShow: false,
      // 将删除的账号
      medIdToDelete: "",

      previewVisible: false,
      previewMedImage: '',
      previewPillImage: '',
      currentItem: null
    };

  },
  mounted() {
    this.getAllMedData();
  },

  methods: {
    openPreview(item) {
      this.previewMedImage = item.medPic;
      this.previewPillImage = item.pillPic;
      this.currentItem = item;
      this.previewVisible = true;
    },

    async getAllMedData() {
      try {
        console.log(this.queryMed)
        const response = await request.post('/medicine/getMed', this.queryMed)
        console.log(response)
        this.allMedData = response.records || []
        this.queryMed.total = response.total || 0
      } catch (error) {
        console.error('错误:', error)
      }
    },

    handleSizeChange(newSize) {
      this.queryMed.size = newSize;
      this.queryMed.current = 1; // 重置到第一页
      this.getAllMedData(); // 重新加载数据
    },
    // 当前页码改变事件
    handleCurrentChange(newPage) {
      this.queryMed.current = newPage;
      this.getAllMedData(); // 重新加载数据
    },
  },
};
</script>

<style scoped>
.container {

}

.button {
  margin: 0 0 20px 20px;
}

.medicine-container {
  display: flex;
  flex-wrap: wrap;
  gap: 50px;
  padding: 30px 8px 0 80px;
}

.medicine-box {
  width: 200px;
  height: 270px;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.medicine-box:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.2);
}

.medicine-image {
  width: 200px;
  height: 200px;
  object-fit: cover;
}

.medicine-name {
  width: 200px;
  margin-top: 10px;
  font-size: 20px;
  text-align: center;
  word-break: break-word;
}

.medicine-type {
  float: right;
  width: 50px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: right;
  padding-right: 5px;
  background-color: orange;
  clip-path: polygon(
    0 50%,
    50% 0,
    100% 0,
    100% 100%,
    50% 100%,
    0 50%
  );
}
</style>
