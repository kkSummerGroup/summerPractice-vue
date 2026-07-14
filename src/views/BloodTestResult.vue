<template>
  <div class="pivot-table-container">
    <div>
      <el-button type="primary" @click="downloadExcel('blood')">下载全血细胞分析</el-button>
      <el-button type="success" @click="downloadExcel('biochemistry')">下载生化全项</el-button>
      <el-button type="warning" @click="downloadExcel('all')">下载检验指标总表</el-button>
    </div>
    <el-table
      :data="transformedData.data"
      border
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
    >
      <!-- 固定项目名称列 -->
      <el-table-column
        prop="name"
        label="项目"
        width="120"
        fixed
      />

      <!-- 动态生成日期列 -->
      <el-table-column
        v-for="date in transformedData.columns"
        :key="date"
        :label="date"
      >
        <template #default="{ row }">
          {{ row[date] || '-' }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import request from '@/api'
export default {
  data() {
    return {
      // 原始数据格式
      originalData: [
        { name: '白细胞', date: '4.29', value: '14' },
        { name: '红细胞', date: '4.29', value: '14' },
        { name: '血小板', date: '4.29', value: '14' },
        { name: '白细胞', date: '5.20', value: '15' },
        { name: '红细胞', date: '5.20', value: '12' },
        { name: '血小板', date: '5.20', value: '15' },
        { name: '白细胞', date: '5.21', value: '16' },
      ],

      // 转换后的数据
      transformedData: {
        columns: [],
        data: []
      }
    };
  },
  created() {
    this.transformData();
  },
  methods: {
    transformData() {
      // 获取所有唯一的日期值作为列头
      const dates = [...new Set(this.originalData.map(item => item.date))].sort();

      // 获取所有唯一的项目名称作为行头
      const items = [...new Set(this.originalData.map(item => item.name))];

      // 构建转换后的数据
      const transformedData = items.map(item => {
        const row = { name: item };
        dates.forEach(date => {
          // 查找对应项目和日期的值
          const found = this.originalData.find(d => d.name === item && d.date === date);
          row[date] = found ? found.value : '-';
        });
        return row;
      });

      this.transformedData = {
        columns: dates,
        data: transformedData
      };

      console.log('转换后的数据:', this.transformedData); // 调试用
    },

    downloadExcel(type) {
      const fileMap = {
        'blood': { fileName: '全血细胞分析.xlsx', displayName: '全血细胞分析' },
        'biochemistry': { fileName: '生化全项.xlsx', displayName: '生化全项' },
        'all': { fileName: '检验指标总表.xlsx', displayName: '检验指标总表' }
      };

      const selected = fileMap[type];
      if (!selected) {
        this.$message.error('未知的下载类型');
        return;
      }

      request({
        url: '/excel/download',
        method: 'get',
        params: { type: type },
        responseType: 'blob'
      }).then(res => {
        const blob = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        console.log('创建的 Blob:', blob);
        console.log('Blob 大小:', blob.size);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = selected.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        this.$message.success(`${selected.displayName} 下载成功`);
      }).catch(err => {
        console.error('下载失败:', err);
        this.$message.error(`${selected.displayName} 下载失败，请稍后重试`);
      });
    }
  }
};
</script>

<style>
.pivot-table-container {
  margin: 20px;
}

/* 可选：为表格添加斑马纹效果 */
.el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #fafafa;
}

/* 可选：悬停高亮 */
.el-table__body tr:hover > td {
  background-color: #f5f5f5 !important;
}
</style>
