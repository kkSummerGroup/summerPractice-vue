<template>
  <div class="pivot-table-container">
    <!-- ========== 主内容 + 右侧用户列表 ========== -->
    <div class="main-wrapper">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <!-- 操作按钮栏 -->
        <div  v-if="userRole === 1"  class="toolbar">
          <div class="toolbar-left">
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
            <el-tag v-if="currentUser" type="success">
              当前用户：{{ currentUser.username }}（{{ currentUser.userId }}）
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
            @row-click="handleRowClick"
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
        <!-- ========== 图表弹窗 ========== -->
        <el-dialog
            :visible.sync="chartDialog.visible"
            width="80%"
            :close-on-click-modal="true"
            @closed="closeChart"
        >
          <div id="chartContainer" style="width: 100%; height: 460px; margin: 0 auto;"></div>
        </el-dialog>
      </div>

      <!-- ========== 右侧用户列表（仅 role=1 显示） ========== -->
      <div v-if="userRole === 1" class="user-sidebar">
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
          <el-tag v-if="currentUser" size="large" type="success">
            {{ currentUser.username }}（{{ currentUser.userId }}）
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
import * as echarts from 'echarts'
import { mapGetters } from 'vuex'

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
      // ========== 图表弹窗 ==========
      chartDialog: {
        visible: false,
        title: '',
        chartInstance: null,
      },
    }
  },

  computed: {
    ...mapGetters(['userId', 'username', 'role']),
    userRole() {
      return this.role || 0
    },
    // 当前用户（用于显示）
    currentUser() {
      if (this.userRole === 2) {
        // role=2：直接使用当前登录用户
        return {
          userId: this.userId,
          username: this.username
        }
      } else {
        // role=1：使用选中的用户
        return this.selectedUser
      }
    },
    // 实际查询的用户ID
    queryUserId() {
      if (this.userRole === 2) {
        return this.userId
      } else {
        return this.selectedUser?.userId || null
      }
    }
  },

  created() {
    this.getCategoryList()
    this.getAllUserData()
  },
  watch: {
    queryUserId: {
      handler(newVal) {
        if (newVal) {
          this.loadData()
        }
      },
      immediate: true
    }
  },
  methods: {
    // ========== 获取分类列表 ==========
    handleRowClick(row) {
      this.openChart(row)
    },
    // ==========准备数据 + 打开弹窗=====
    openChart(row) {
      if (!row || !row.name) {
        this.$message.warning('暂无数据')
        return
      }
      const refRange = row.refRange || ''
      let low = null
      let high = null
      if (refRange && refRange !== '-' && refRange !== '') {
        const parts = refRange.split('~')
        if (parts.length === 2) {
          const lowStr = parts[0].trim()
          const highStr = parts[1].trim()
          if (lowStr) low = parseFloat(lowStr)
          if (highStr) high = parseFloat(highStr)
        }
      }
      const dates = this.transformedData.columns || []
      const values = dates.map(date => {
        const val = row[date]
        if (val === '-' || val === '' || val === null || val === undefined) {
          return null
        }
        const num = parseFloat(val)
        return isNaN(num) ? null : num
      })

      let validData = dates.map((date, idx) => ({
        date: date,
        value: values[idx]
      })).filter(item => item.value !== null)

      // 如果数据点过多（>20），只显示最近20个，避免渲染卡顿
      if (validData.length > 20) {
        validData = validData.slice(-20)
        this.$message.info('数据点过多，仅显示最近20次检测')
      }

      if (validData.length === 0) {
        this.$message.warning('该项目暂无有效数据')
        return
      }
      if (validData.length === 1) {
        this.$message.warning('只有一个数据点，无法绘制趋势线')
        return
      }

      this.chartDialog.title = `${row.name} 趋势监测`
      this.chartDialog.visible = true
      this.$nextTick(() => {
        this.initChart(validData, row.name, low, high, row.unit || '')
      }, 300)
    },
    async getCategoryList() {
      try {
        const res = await request.get('/bloodTest/getCategories')
        this.categoryList = res || []
        console.log('分类列表:', this.categoryList)
      } catch (error) {
        console.error('获取分类列表失败:', error)
      }
    },
    //============画图（优化Y轴范围，确保所有点可见）===========
    initChart(data, name, low, high, unit) {
      const container = document.getElementById('chartContainer')
      if (!container) {
        console.warn('未找到 chartContainer 容器')
        return
      }
      if (this.chartDialog.chartInstance) {
        this.chartDialog.chartInstance.dispose()
        this.chartDialog.chartInstance = null
      }
      const chart = echarts.init(container)
      this.chartDialog.chartInstance = chart
      const dates = data.map(item => item.date)
      const values = data.map(item => item.value)

      // ========== 计算每个数据点的颜色 ==========
      const labelColors = values.map(val => {
        if (high !== null && val > high) return '#F56C6C'  // 红色（超过上界）
        if (low !== null && val < low) return '#409EFF'   // 蓝色（低于下界）
        return '#67C23A'  // 绿色（在范围内）
      })

      // ========== 构建带颜色的数据点 ==========
      const coloredData = values.map((val, index) => ({
        value: val,
        itemStyle: {
          color: labelColors[index]  // 圆点颜色
        },
        label: {
          color: labelColors[index],  // 标签文字颜色
          show: values.length <= 10,
          position: 'top',
          fontSize: 16,
          formatter: function(params) {
            return params.value
          }
        }
      }))

      // 计算数据的最小值和最大值，用于Y轴范围
      const dataMin = Math.min(...values)
      const dataMax = Math.max(...values)

      // 参考区间的值（可能为null）
      const refLow = low !== null ? low : dataMin
      const refHigh = high !== null ? high : dataMax

      // Y轴范围：取数据范围和参考区间的并集，再留10%边距
      let yMin = Math.min(dataMin, refLow)
      let yMax = Math.max(dataMax, refHigh)
      const margin = (yMax - yMin) * 0.1 || 5  // 如果差为0，给个默认边距
      yMin = Math.max(0, yMin - margin)  // 如果最小值小于0，则从0开始
      yMax = yMax + margin

      // 构建参考区间标记线（去重）
      const markLineData = []
      const addedValues = new Set()
      if (high !== null && !addedValues.has(high)) {
        markLineData.push({
          yAxis: high,
          name: `上界：${high}`,
          lineStyle: { color: '#ee6666', type: 'dashed', width: 2 }
        })
        addedValues.add(high)
      }
      if (low !== null && !addedValues.has(low)) {
        markLineData.push({
          yAxis: low,
          name: `下界：${low}`,
          lineStyle: { color: '#ee6666', type: 'dashed', width: 2 }
        })
        addedValues.add(low)
      }

      const markAreaData = []
      if (low !== null && high !== null && low < high) {
        markAreaData.push([
          { yAxis: low, itemStyle: { color: 'rgba(0,180,0,0.06)' } },
          { yAxis: high }
        ])
      }

      const option = {
        title: {
          text: `${name} 趋势监测`,
          subtext: low !== null && high !== null ? `参考区间 ${low} ~ ${high} ${unit || ''}` : '',
          left: 'center',
          textStyle: { fontSize: 18, fontWeight: 'bold' },
          subtextStyle: { fontSize: 13, color: '#888' }
        },
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            let res = `<strong>${params[0].axisValue}</strong><br/>`
            params.forEach(p => {
              res += `${p.marker} ${p.seriesName}：${p.value} ${unit || ''}<br/>`
            })
            return res
          }
        },
        // legend: {
        //   data: [name],
        //   bottom: 0,
        //   icon: 'roundRect',
        //   itemWidth: 20
        // },
        xAxis: {
          type: 'category',
          data: dates,
          name: '检测日期',
          axisLabel: { rotate: 20, fontSize: 12 },
          splitLine: {
            show: true,
            lineStyle: {
              color: '#e0e0e0',
              type: 'dashed',
              width: 1
            }
          },
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          min: yMin,
          max: yMax,
          name: `检测值（${unit || ''}）`,
          splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
          axisLabel: {
            formatter: function(value) {
              return value
            }
          }
        },
        series: [{
          name: name,
          type: 'line',
          data: coloredData,
          symbol: 'circle',
          symbolSize: 14,
          lineStyle: { color: '#999999', width: 3 },
          // // 显示数值标签（数据点少于10个时）
          // label: {
          //   show: values.length <= 10,
          //   position: 'top',
          //   fontSize: 11,
          //   color: '#303133',
          //   formatter: function(params) {
          //     return params.value
          //   }
          // },
          markLine: {
            silent: true,
            data: markLineData,
            symbol: 'none',  // ✅ 去掉端点标记（圆点和箭头）
            label: {
              formatter: function(params) {
                return params.name
              },
              position: 'start',
              fontSize: 12,
              color: '#ee6666'
            }
          },
          markArea: {
            silent: true,
            data: markAreaData
          }
        }]
      }

      chart.setOption(option, true)
      chart.resize()
      setTimeout(() => {
        chart.resize()
      }, 200)
    },
    // ========== 关闭图表弹窗 ==========
    closeChart() {
      if (this.chartDialog.chartInstance) {
        this.chartDialog.chartInstance.dispose()
        this.chartDialog.chartInstance = null
      }
    },
    // ========== 加载数据 ==========
    async loadData() {
      const userId = this.queryUserId
      if (!userId) {
        this.originalData = []
        this.transformData()
        return
      }

      this.tableLoading = true
      try {
        const params = {
          userId: userId,
          category: this.selectedCategory
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

    // ========== 用户列表相关（仅 role=1 使用） ==========
    async getAllUserData() {
      // role=2 不需要获取用户列表
      if (this.userRole !== 1) {
        return
      }

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

        if (this.allUserData.length > 0 && !this.selectedUser) {
          this.selectedUser = this.allUserData[0]
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

      const dates = [...new Set(this.originalData.map(item => item.date))].sort()
      const items = [...new Set(this.originalData.map(item => item.name))]

      const transformedData = items.map(item => {
        const firstItem = this.originalData.find(d => d.name === item)
        const row = {
          name: item,
          unit: firstItem ? firstItem.unit : '-',
          refRange: firstItem ? firstItem.refRange : '-'
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
      const userId = this.queryUserId
      if (!userId) {
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
            userId: userId,
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
            this.loadData()
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
      if (!value || value === '' || value === '-') return true
      if (!refRange || refRange === '' || refRange === '~' || refRange === '-') return true

      const numValue = parseFloat(value)
      if (isNaN(numValue)) return true

      const parts = refRange.split('~')
      const lowStr = parts[0]?.trim()
      const highStr = parts[1]?.trim()

      if (lowStr && lowStr !== '' && (!highStr || highStr === '')) {
        const low = parseFloat(lowStr)
        return !isNaN(low) && numValue >= low
      }

      if ((!lowStr || lowStr === '') && highStr && highStr !== '') {
        const high = parseFloat(highStr)
        return !isNaN(high) && numValue <= high
      }

      if (lowStr && lowStr !== '' && highStr && highStr !== '') {
        const low = parseFloat(lowStr)
        const high = parseFloat(highStr)
        if (!isNaN(low) && !isNaN(high)) {
          return numValue >= low && numValue <= high
        }
      }

      return true
    },

    getColor(row, date) {
      const value = row[date]
      const refRange = row.refRange

      if (!value || value === '-' || value === '') {
        return '#303133'
      }

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