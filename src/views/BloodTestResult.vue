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

      <!-- ========== 右侧用户列表（使用 UserSelector 组件） ========== -->
      <div v-if="userRole === 1" class="user-sidebar">
        <UserSelector
            ref="userSelector"
            v-model="selectedUserId"
            :page-size="10"
            @change="onUserChange"
        />
      </div>
    </div>

    <!-- ========== 上传对话框 ========== -->
    <el-dialog
        title="上传检验数据"
        :visible.sync="uploadDialogVisible"
        width="600px"
        :close-on-click-modal="false"
        @closed="resetUploadForm"
    >
      <el-form :model="uploadForm" label-width="100px" ref="uploadFormRef">
        <el-form-item label="当前用户">
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
import UserSelector from '@/components/UserSelector.vue'

export default {
  components: {
    UserSelector
  },
  data() {
    return {
      // ========== 用户选择相关 ==========
      selectedUserId: '',
      uploadSelectedUserId: '',
      selectedUser: null,

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
        return this.selectedUserId || null
      }
    }
  },

  created() {
    this.getCategoryList()
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
    // ========== UserSelector 事件处理 ==========
    onUserChange(user) {
      this.selectedUser = user
      console.log('选中的用户:', user)
    },

    onUploadUserChange(user) {
      // 上传弹窗内选择的用户，仅用于显示
      console.log('上传弹窗选中的用户:', user)
    },

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

    // ========== 数据转换（透视表） ==========
    transformData() {
      if (!this.originalData || this.originalData.length === 0) {
        this.transformedData = {columns: [], data: []}
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

    // ========== 图表相关 ==========
    handleRowClick(row) {
      this.openChart(row)
    },

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
      })
    },

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

      const labelColors = values.map(val => {
        if (high !== null && val > high) return '#F56C6C'
        if (low !== null && val < low) return '#409EFF'
        return '#67C23A'
      })

      const coloredData = values.map((val, index) => ({
        value: val,
        itemStyle: {color: labelColors[index]},
        label: {
          color: labelColors[index],
          show: values.length <= 10,
          position: 'top',
          fontSize: 16,
          formatter: function (params) {
            return params.value
          }
        }
      }))

      const dataMin = Math.min(...values)
      const dataMax = Math.max(...values)
      const refLow = low !== null ? low : dataMin
      const refHigh = high !== null ? high : dataMax

      let yMin = Math.min(dataMin, refLow)
      let yMax = Math.max(dataMax, refHigh)
      const margin = (yMax - yMin) * 0.1 || 5
      yMin = Math.max(0, yMin - margin)
      yMax = yMax + margin

      const markLineData = []
      const addedValues = new Set()
      if (high !== null && !addedValues.has(high)) {
        markLineData.push({
          yAxis: high,
          name: `上界：${high}`,
          lineStyle: {color: '#ee6666', type: 'dashed', width: 2}
        })
        addedValues.add(high)
      }
      if (low !== null && !addedValues.has(low)) {
        markLineData.push({
          yAxis: low,
          name: `下界：${low}`,
          lineStyle: {color: '#ee6666', type: 'dashed', width: 2}
        })
        addedValues.add(low)
      }

      const markAreaData = []
      if (low !== null && high !== null && low < high) {
        markAreaData.push([
          {yAxis: low, itemStyle: {color: 'rgba(0,180,0,0.06)'}},
          {yAxis: high}
        ])
      }

      const option = {
        title: {
          text: `${name} 趋势监测`,
          subtext: low !== null && high !== null ? `参考区间 ${low} ~ ${high} ${unit || ''}` : '',
          left: 'center',
          textStyle: {fontSize: 18, fontWeight: 'bold'},
          subtextStyle: {fontSize: 13, color: '#888'}
        },
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            let res = `<strong>${params[0].axisValue}</strong><br/>`
            params.forEach(p => {
              res += `${p.marker} ${p.seriesName}：${p.value} ${unit || ''}<br/>`
            })
            return res
          }
        },
        xAxis: {
          type: 'category',
          data: dates,
          name: '检测日期',
          axisLabel: {rotate: 20, fontSize: 12},
          splitLine: {
            show: true,
            lineStyle: {color: '#e0e0e0', type: 'dashed', width: 1}
          },
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          min: yMin,
          max: yMax,
          name: `检测值（${unit || ''}）`,
          splitLine: {lineStyle: {type: 'dashed', color: '#eee'}}
        },
        series: [{
          name: name,
          type: 'line',
          data: coloredData,
          symbol: 'circle',
          symbolSize: 14,
          lineStyle: {color: '#999999', width: 3},
          markLine: {
            silent: true,
            data: markLineData,
            symbol: 'none',
            label: {
              formatter: function (params) {
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

    closeChart() {
      if (this.chartDialog.chartInstance) {
        this.chartDialog.chartInstance.dispose()
        this.chartDialog.chartInstance = null
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
      this.uploadSelectedUserId = ''
    },

    handleUpload() {
      // 获取上传的用户ID：优先使用上传弹窗选择的，否则使用当前用户
      const userId = this.uploadSelectedUserId || this.queryUserId
      if (!userId) {
        this.$message.warning('请选择用户')
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
        params: {type: type},
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
      return inRange ? '#67C23A' : '#F56C6C'
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
  display: flex;
  flex-direction: column;
  border: 1px solid #ebeef5;
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

/* ========== 上传弹窗内的用户选择器样式 ========== */
::v-deep .upload-user-selector .user-selector {
  max-height: 200px;
}

::v-deep .upload-user-selector .user-list {
  max-height: 120px;
}
</style>