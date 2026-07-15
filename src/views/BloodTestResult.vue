<template>
  <div class="pivot-table-container">
    <!-- ========== 主内容 + 右侧用户列表 ========== -->
    <div class="main-wrapper">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <!-- 操作按钮栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
            <!-- 现在（动态） -->
            <el-button
                v-for="category in categoryList"
                :key="category.projectClassId"
                type="primary"
                @click="downloadExcel(category.projectClassName)"
            >
              下载{{ category.projectClassName }}
            </el-button>
            <el-button type="info" @click="uploadDialogVisible = true">上传检验数据</el-button>
          </div>
          <div class="toolbar-right">
            <el-tag v-if="selectedUser" type="success">
              当前用户：{{ selectedUser.username }}（{{ selectedUser.userId }}）
            </el-tag>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="filter-bar">
          <span class="filter-label">检验类别：</span>
          <el-radio-group v-model="selectedCategory" size="small" @change="loadData">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button
                v-for="category in categoryList"
                :key="category.projectClassId"
                :label="category.projectClassName"
            >
              {{ category.projectClassName }}
            </el-radio-button>
          </el-radio-group>
        </div>

        <!-- ========== 表格 ========== -->
        <el-table
            :data="transformedData.data"
            border
            style="width: 100%; margin-top: 10px;"
            :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
            v-loading="tableLoading"
        >
          <el-table-column prop="name" label="项目" width="140" fixed />
          <el-table-column prop="unit" label="单位" width="100" fixed />
          <el-table-column prop="refRange" label="参考区间" width="140" fixed />
          <el-table-column
              v-for="date in transformedData.columns"
              :key="date"
              :label="date"
              width="120"
          >
            <template #default="{ row }">
              <span :style="{ color: getColor(row, date) }">
                {{ row[date] || '-' }}
            </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- ========== 右侧用户列表 ========== -->
      <div class="user-sidebar">
        <div class="user-sidebar-header">
          <span>选择用户</span>
          <el-input
              v-model="userQuery.keyword"
              placeholder="搜索"
              size="small"
              clearable
              @input="getAllUserData"
              style="margin-top: 10px;"
          />
        </div>
        <div class="user-list">
          <div
              v-for="user in allUserData"
              :key="user.userId"
              class="user-item"
              :class="{ active: selectedUser && selectedUser.userId === user.userId }"
              @click="selectUser(user)"
          >
            <img
                :src="user.headPortrait || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"
                alt="头像"
                class="user-avatar"
            />
            <div class="user-info">
              <div class="user-name">{{ user.username }}</div>
              <div class="user-id">{{ user.userId }}</div>
            </div>
          </div>
          <div v-if="allUserData.length === 0" class="empty-text">暂无用户</div>
        </div>
        <el-pagination
            background
            small
            layout="prev, pager, next"
            :total="userQuery.total"
            :page-size="userQuery.size"
            :current-page="userQuery.current"
            @current-change="handleUserPageChange"
            style="padding: 10px 0; justify-content: center;"
        />
      </div>
    </div>

    <!-- ========== 上传对话框 ========== -->
    <el-dialog
        title="上传检验数据"
        :visible.sync="uploadDialogVisible"
        width="550px"
        :close-on-click-modal="false"
        @closed="resetUploadForm"
    >
      <el-form :model="uploadForm" label-width="100px" ref="uploadFormRef">
        <el-form-item label="选择用户">
          <el-tag v-if="selectedUser" size="large" type="success">
            {{ selectedUser.username }}（{{ selectedUser.userId }}）
          </el-tag>
          <el-tag v-else size="large" type="info">请先选择用户</el-tag>
        </el-form-item>

        <el-form-item
            label="检测日期"
            prop="testDate"
            :rules="[{ required: true, message: '请选择检测日期', trigger: 'change' }]"
        >
          <el-date-picker
              v-model="uploadForm.testDate"
              type="datetime"
              placeholder="请选择检测日期"
              value-format="yyyy-MM-dd HH:mm:ss"
              style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="上传文件" prop="fileList">
          <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :file-list="uploadForm.fileList"
              :limit="1"
              accept=".xlsx,.xls"
              action=""
              drag
          >
            <i class="el-icon-upload" />
            <div class="el-upload__text">将 Excel 文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip" slot="tip">
              支持 .xlsx / .xls 格式，文件大小不超过 10MB
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <span slot="footer">
        <el-button @click="uploadDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="uploadLoading" @click="handleUpload">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/api'

export default {
  data() {
    return {
      // ========== 用户列表相关 ==========
      allUserData: [],
      selectedUser: null,
      userQuery: {
        keyword: '',
        current: 1,
        size: 10,
        total: 0
      },

      // ========== 筛选相关 ==========
      selectedCategory: 'all',
      tableLoading: false,

      // ========== 上传相关 ==========
      uploadDialogVisible: false,
      uploadLoading: false,
      uploadForm: {
        testDate: '',
        fileList: []
      },
      uploadedFile: null,

      // ========== 表格数据 ==========
      originalData: [],
      transformedData: {
        columns: [],
        data: []
      },

      // ========== 分类列表 ==========
      categoryList: [],
    }
  },
  created() {
    this.getCategoryList()  // 👈 新增：加载分类列表
    this.getAllUserData()
  },
  watch: {
    selectedUser: {
      handler() {
        this.loadData()
      },
      immediate: true
    }
  },
  methods: {
    // ========== 获取分类列表 ==========
    async getCategoryList() {
      try {
        const res = await request.get('/bloodTest/getCategories')
        this.categoryList = res || []
        console.log('分类列表:', this.categoryList)
      } catch (error) {
        console.error('获取分类列表失败:', error)
      }
    },
    // ========== 加载数据 ==========
    async loadData() {
      if (!this.selectedUser) {
        this.originalData = []
        this.transformData()
        return
      }

      this.tableLoading = true
      try {
        const params = {
          userId: this.selectedUser.userId,
          category: this.selectedCategory  // 'all' 或具体类别名
        }
        const res = await request.post('/bloodTest/getUserResults', params)
        this.originalData = res || []
        this.transformData()
      } catch (error) {
        console.error('加载数据失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.tableLoading = false
      }
    },

    // ========== 用户列表相关 ==========
    async getAllUserData() {
      try {
        const params = {
          userId: this.userQuery.keyword,
          username: this.userQuery.keyword,
          current: this.userQuery.current,
          size: this.userQuery.size
        }
        const res = await request.post('/user/getUser', params)
        this.allUserData = res.records || []
        this.userQuery.total = res.total || 0

        // ✅ 如果用户列表有数据，且没有选中任何用户，默认选中第一个
        if (this.allUserData.length > 0 && !this.selectedUser) {
          this.selectedUser = this.allUserData[0]
          this.$message.success(`默认选择用户：${this.selectedUser.username}`)
          this.loadData()
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
      }
    },

    handleUserPageChange(page) {
      this.userQuery.current = page
      this.getAllUserData()
    },

    selectUser(user) {
      if (this.selectedUser && this.selectedUser.userId === user.userId) {
        // 如果点击的是已选中的用户，取消选中
        this.selectedUser = null
        this.$message.info('已取消选择用户')
      } else {
        this.selectedUser = user
        this.$message.success(`已选择用户：${user.username}`)
      }
    },

    // ========== 数据转换（透视表） ==========
    transformData() {
      if (!this.originalData || this.originalData.length === 0) {
        this.transformedData = { columns: [], data: [] }
        return
      }

      // 获取所有唯一的日期值作为列头
      const dates = [...new Set(this.originalData.map(item => item.date))].sort()
      // 获取所有唯一的项目名称作为行头
      const items = [...new Set(this.originalData.map(item => item.name))]

      const transformedData = items.map(item => {
        // 从第一条数据中获取 refRange 和 unit（同一项目相同）
        const firstItem = this.originalData.find(d => d.name === item)
        const row = {
          name: item,
          unit: firstItem ? firstItem.unit : '-',        // 单位列
          refRange: firstItem ? firstItem.refRange : '-' // 参考区间列
        }
        dates.forEach(date => {
          const found = this.originalData.find(d => d.name === item && d.date === date)
          row[date] = found ? found.value : '-'
        })
        return row
      })

      this.transformedData = {
        columns: dates,
        data: transformedData
      }
    },

    // ========== 上传相关 ==========
    handleFileChange(file, fileList) {
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        this.$message.error('文件大小不能超过 10MB！')
        this.uploadForm.fileList = []
        this.uploadedFile = null
        return
      }
      const validExts = ['.xlsx', '.xls']
      const fileName = file.name.toLowerCase()
      const isValidExt = validExts.some(ext => fileName.endsWith(ext))
      if (!isValidExt) {
        this.$message.error('只支持 .xlsx 和 .xls 格式的文件！')
        this.uploadForm.fileList = []
        this.uploadedFile = null
        return
      }
      this.uploadForm.fileList = fileList
      this.uploadedFile = file
    },

    handleFileRemove() {
      this.uploadedFile = null
      this.uploadForm.fileList = []
    },

    resetUploadForm() {
      this.uploadForm.testDate = ''
      this.uploadForm.fileList = []
      this.uploadedFile = null
      this.uploadLoading = false
    },

    handleUpload() {
      if (!this.selectedUser) {
        this.$message.warning('请先选择用户')
        return
      }

      if (!this.uploadForm.testDate) {
        this.$message.warning('请选择检测日期')
        return
      }

      if (!this.uploadedFile) {
        this.$message.warning('请上传 Excel 文件')
        return
      }

      this.uploadLoading = true
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const base64 = e.target.result.split(',')[1]
          const params = {
            userId: this.selectedUser.userId,
            testDate: this.uploadForm.testDate,
            fileName: this.uploadedFile.name,
            fileContent: base64
          }

          request({
            url: '/excel/upload',
            method: 'post',
            data: params
          }).then(res => {
            this.$message.success(res.data || '数据上传成功')
            this.uploadDialogVisible = false
            this.resetUploadForm()
            this.loadData() // 刷新表格
          }).catch(err => {
            const msg = err.response?.data?.message || err.message || '上传失败，请稍后重试'
            this.$message.error(msg)
          }).finally(() => {
            this.uploadLoading = false
          })
        } catch (error) {
          console.error('读取文件失败:', error)
          this.$message.error('读取文件失败，请重试')
          this.uploadLoading = false
        }
      }

      reader.onerror = () => {
        this.$message.error('读取文件失败')
        this.uploadLoading = false
      }

      reader.readAsDataURL(this.uploadedFile.raw)
    },

    // ========== 下载 ==========
    downloadExcel(type) {
      // type 就是分类名，如 "全血细胞分析"、"生化全项"
      const fileName = `${type}.xlsx`

      request({
        url: '/excel/download',
        method: 'get',
        params: { type: type },
        responseType: 'blob'
      }).then(res => {
        const blob = new Blob([res], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
        this.$message.success(`${type} 下载成功`)
      }).catch(err => {
        console.error('下载失败:', err)
        this.$message.error(`${type} 下载失败，请稍后重试`)
      })
    },

    /**
     * 判断值是否在参考区间内
     * @param {string} value - 实际值
     * @param {string} refRange - 参考区间，如 "40~75" 或 "5~" 或 "~5" 或 "~"
     * @returns {boolean} true=在区间内（绿色），false=超出区间（红色）
     */
    isValueInRange(value, refRange) {
      if (!value || value === '' || value === '-') return true // 空值默认绿色
      if (!refRange || refRange === '' || refRange === '~' || refRange === '-') return true // 无界默认绿色

      const numValue = parseFloat(value)
      if (isNaN(numValue)) return true

      const parts = refRange.split('~')
      const lowStr = parts[0]?.trim()
      const highStr = parts[1]?.trim()

      // 5~ 形式：无上限，只需检查下限
      if (lowStr && lowStr !== '' && (!highStr || highStr === '')) {
        const low = parseFloat(lowStr)
        return !isNaN(low) && numValue >= low
      }

      // ~5 形式：无下限，只需检查上限
      if ((!lowStr || lowStr === '') && highStr && highStr !== '') {
        const high = parseFloat(highStr)
        return !isNaN(high) && numValue <= high
      }

      // 5~10 形式：正常范围
      if (lowStr && lowStr !== '' && highStr && highStr !== '') {
        const low = parseFloat(lowStr)
        const high = parseFloat(highStr)
        if (!isNaN(low) && !isNaN(high)) {
          return numValue >= low && numValue <= high
        }
      }

      return true // 解析失败默认绿色
    },

    getColor(row, date) {
      const value = row[date]
      const refRange = row.refRange

      // 空值或 '-' 默认黑色
      if (!value || value === '-' || value === '') {
        return '#303133'
      }

      // 判断是否在区间内
      const inRange = this.isValueInRange(value, refRange)
      return inRange ? '#67C23A' : '#F56C6C' // 绿色 / 红色
    }
  }
}
</script>

<style scoped>
.pivot-table-container {
  margin: 20px;
}

.main-wrapper {
  display: flex;
  gap: 20px;
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* ========== 工具栏 ========== */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

/* ========== 筛选栏 ========== */
.filter-bar {
  display: flex;
  align-items: center;
  margin-top: 15px;
  padding: 10px 15px;
  background: #f5f7fa;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.filter-label {
  font-weight: bold;
  color: #303133;
  margin-right: 15px;
  white-space: nowrap;
}

/* ========== 右侧用户列表 ========== */
.user-sidebar {
  width: 220px;
  min-width: 220px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 15px;
  height: fit-content;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
}

.user-sidebar-header {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.user-item:hover {
  background: #e4e7ed;
}

.user-item.active {
  background: #409eff;
  color: #fff;
}

.user-item.active .user-id {
  color: rgba(255, 255, 255, 0.8);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.user-item.active .user-name {
  color: #fff;
}

.user-id {
  font-size: 12px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-item.active .user-id {
  color: rgba(255, 255, 255, 0.8);
}

.empty-text {
  text-align: center;
  color: #909399;
  font-size: 13px;
  padding: 20px 0;
}

.el-table--striped .el-table__body tr.el-table__row--striped td {
  background: #fafafa;
}

.el-table__body tr:hover > td {
  background-color: #f5f5f5 !important;
}

.el-upload-dragger {
  width: 100%;
}
</style>