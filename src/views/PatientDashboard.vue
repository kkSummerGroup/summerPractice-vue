<template>
  <div class="dashboard-container">
    <!-- ========== 顶部：用户信息 ========== -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1>🧑‍⚕️ 我的抽血数据大屏</h1>
        <span class="user-role">患者端</span>
      </div>
      <div class="header-right" style="display: flex;">
        <p>您好，</p>
        <el-tag type="success" size="large">
          {{ username }}（{{ userId }}）
        </el-tag>
      </div>
    </div>

    <!-- ========== 统计卡片（新顺序 + 正确计算） ========== -->
    <el-row :gutter="20" class="stats-row">

      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-icon blue">📋</div>
          <div class="stats-content">
            <div class="stats-number">{{ overview.totalTests || 0 }}</div>
            <div class="stats-label">总检测次数</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-icon orange">📅</div>
          <div class="stats-content">
            <div class="stats-number">{{ overview.lastTestDate || '-' }}</div>
            <div class="stats-label">最近检测日期</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-icon red">⚠️</div>
          <div class="stats-content">
            <div class="stats-number" :style="{ color: overview.abnormalCount > 0 ? '#F56C6C' : '#67C23A' }">
              {{ overview.abnormalCount || 0 }}
            </div>
            <div class="stats-label">异常项目数（最近一次）</div>
          </div>
        </el-card>

      </el-col>
      <el-col :span="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-icon green">✅</div>
          <div class="stats-content">
            <div class="stats-number">{{ overview.normalCount || 0 }}</div>
            <div class="stats-label">正常项目数（最近一次）</div>
          </div>
        </el-card>
      </el-col>

    </el-row>

    <!-- ========== 异常指标 + 历史异常趋势 ========== -->
    <el-row :gutter="20" class="equal-height-row">
      <!-- 左侧：异常指标（改为表格形式，列对齐） -->
      <el-col :span="10">
        <el-card class="abnormal-card" shadow="hover">
          <div slot="header" class="abnormal-header">
            <span>⚠️ 我的异常指标</span>
            <el-badge :value="abnormalItems.length" class="badge" v-if="abnormalItems.length > 0" />
            <span class="abnormal-date" v-if="abnormalItems.length > 0">
              共 {{ abnormalItems.length }} 项
            </span>
          </div>
          <div class="abnormal-scroll-container" @click="openAbnormalDialog">
            <div v-if="abnormalItems.length === 0" class="empty-text">✅ 所有指标正常</div>
            <div v-else class="abnormal-table">
              <!-- 表头 -->
              <div class="abnormal-table-header">
                <span class="col-name">项目名</span>
                <span class="col-status">状态</span>
                <span class="col-value">数值</span>
                <span class="col-deviation">偏差</span>
              </div>
              <!-- 数据行 -->
              <div
                  v-for="item in abnormalItems"
                  :key="item.name"
                  class="abnormal-table-row"
              >
                <span class="col-name">{{ item.name }}</span>
                <span class="col-status">
                  <span class="item-status-tag" :class="item.status === 'high' ? 'tag-high' : 'tag-low'">
                    {{ item.status === 'high' ? '↑ 偏高' : '↓ 偏低' }}
                  </span>
                </span>
                <span class="col-value" :style="{ color: item.status === 'high' ? '#F56C6C' : '#409EFF' }">
                  {{ item.value }} {{ item.unit }}
                </span>
                <span class="col-deviation">{{ item.deviation }}</span>
              </div>
            </div>
          </div>
          <div v-if="abnormalItems.length > 0" class="abnormal-footer" @click="openAbnormalDialog">
            查看全部 →
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：历史异常指标趋势 -->
      <el-col :span="14">
        <el-card class="trend-card" shadow="hover">
          <div slot="header" class="trend-header">
            <span>📈 历史异常指标趋势</span>
            <el-tag size="small" type="info" v-if="abnormalTrendList.length > 0">
              连续异常次数 ≥ 2 次
            </el-tag>
          </div>
          <div class="trend-scroll-container">
            <div v-if="abnormalTrendList.length === 0" class="empty-text">✅ 暂无连续异常趋势</div>
            <div v-for="item in abnormalTrendList" :key="item.name" class="trend-item">
              <div class="trend-item-header">
                <span class="trend-name">{{ item.name }}</span>
                <span class="trend-tag" :class="item.direction === 'up' ? 'trend-up' : 'trend-down'"
                      :style="{ backgroundColor: getColorByCount(item.count, item.direction) }">
                      {{ item.displayDirection || (item.direction === 'up' ? '↑ 持续升高' : '↓ 持续降低') }}
                  <span class="trend-count">{{ item.count }}次</span>
                </span>
              </div>
              <div class="trend-values">
                <span v-for="(val, idx) in item.recentValues" :key="idx"
                      class="trend-value-item"
                      :class="{ 'is-abnormal': val.status === 'abnormal', 'is-normal': val.status === 'normal' }">
                  {{ val.date }}：{{ val.value }} {{ val.unit }}
                </span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ========== 最近检测记录 ========== -->
    <el-card class="history-card" shadow="hover" style="margin-top: 20px;">
      <div slot="header" class="history-header">
        <span>📋 我的最近检测记录</span>
        <el-button type="text" size="small" @click="goToDetail">查看全部 →</el-button>
      </div>
      <el-table
          :data="recentRecords"
          border stripe size="small"
          max-height="420"
          v-loading="loading"
          style="width: 100%;">
        <el-table-column prop="date" label="检测日期" width="140" />
        <el-table-column prop="name" label="项目名" />
        <el-table-column prop="value" label="值" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.status === 'normal' ? '#67C23A' : '#F56C6C' }">
              {{ row.value }} {{ row.unit }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="refRange" label="参考区间" width="140" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
              {{ row.status === 'normal' ? '正常' : '异常' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ========== 异常指标弹窗 ========== -->
    <el-dialog
        title="⚠️ 我的异常指标"
        :visible.sync="abnormalDialogVisible"
        width="650px"
        :close-on-click-modal="true"
        top="5vh">
      <div class="abnormal-dialog-scroll">
        <div v-for="item in abnormalItems" :key="item.name" class="abnormal-item dialog-item">
          <div class="abnormal-item-left">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-status-tag" :class="item.status === 'high' ? 'tag-high' : 'tag-low'">
              {{ item.status === 'high' ? '↑ 偏高' : '↓ 偏低' }}
            </span>
            <span class="item-date">{{ item.date || '-' }}</span>
          </div>
          <div class="abnormal-item-right">
            <span class="item-value" :style="{ color: item.status === 'high' ? '#F56C6C' : '#409EFF' }">
              {{ item.value }} {{ item.unit }}
            </span>
            <span class="item-deviation">{{ item.deviation }}</span>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <span class="footer-count">共 {{ abnormalItems.length }} 项异常指标</span>
        <el-button type="primary" @click="abnormalDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import request from '@/api'

export default {
  name: 'PatientDashboard',
  data() {
    return {
      loading: false,
      overview: {
        totalTests: 0,
        abnormalCount: 0,
        normalCount: 0,
        lastTestDate: ''
      },
      abnormalItems: [],
      abnormalDialogVisible: false,
      abnormalTrendList: [],
      fullRecentRecords: [],
      recentRecords: []
    }
  },
  computed: {
    ...mapGetters(['userId', 'username', 'role'])
  },
  created() {
    this.loadDashboardData()
  },
  methods: {
    ...mapActions(['logout']),

    parseRefRange(refRange) {
      if (!refRange || refRange === '-' || refRange === '') return { low: null, high: null }
      const parts = refRange.split('~')
      const lowStr = parts[0]?.trim()
      const highStr = parts[1]?.trim()
      let low = null, high = null
      if (lowStr && lowStr !== '') low = parseFloat(lowStr)
      if (highStr && highStr !== '') high = parseFloat(highStr)
      return { low, high }
    },

    checkIsAbnormal(value, refRange) {
      if (value == null || value === '' || value === '-') {
        return { isAbnormal: false, status: 'normal', deviation: '' }
      }
      const numValue = parseFloat(value)
      if (isNaN(numValue)) return { isAbnormal: false, status: 'normal', deviation: '' }
      const { low, high } = this.parseRefRange(refRange)
      if (low === null && high === null) return { isAbnormal: false, status: 'normal', deviation: '' }
      if (low !== null && numValue < low) {
        return { isAbnormal: true, status: 'low', deviation: `-${(low - numValue).toFixed(1)}` }
      }
      if (high !== null && numValue > high) {
        return { isAbnormal: true, status: 'high', deviation: `+${(numValue - high).toFixed(1)}` }
      }
      return { isAbnormal: false, status: 'normal', deviation: '' }
    },

    openAbnormalDialog() {
      if (this.abnormalItems.length > 0) this.abnormalDialogVisible = true
    },

    async loadDashboardData() {
      const userId = this.userId
      if (!userId) {
        this.$message.warning('请先登录')
        return
      }
      this.loading = true
      try {
        const res = await request.post('/bloodTest/getUserResults', {
          userId: userId,
          category: 'all'
        })
        const records = Array.isArray(res) ? res : []
        if (records.length === 0) {
          this.overview = { totalTests: 0, abnormalCount: 0, normalCount: 0, lastTestDate: '-' }
          this.abnormalItems = []
          this.recentRecords = []
          this.abnormalTrendList = []
          this.fullRecentRecords = []
          this.loading = false
          return
        }

        // 前端自行判断每条记录状态
        const recordsWithStatus = records.map(record => {
          const result = this.checkIsAbnormal(record.value, record.refRange)
          return {
            ...record,
            status: result.isAbnormal ? 'abnormal' : 'normal',
            deviation: result.deviation,
            _statusDetail: result.status
          }
        })

        // 1. 总检测次数 = 不同检测日期的数量
        const uniqueDates = new Set(records.map(r => r.date))
        const totalTests = uniqueDates.size

        // 2. 最近一次检测的日期
        const sortedDates = [...uniqueDates].sort()
        const lastTestDate = sortedDates.length > 0 ? sortedDates[sortedDates.length - 1] : '-'

        // 3. 取每个项目最新一条记录（即最近一次检测的所有项目）
        const latestByProject = {}
        recordsWithStatus.forEach(record => {
          const key = record.name
          if (!latestByProject[key] || new Date(record.date) > new Date(latestByProject[key].date)) {
            latestByProject[key] = record
          }
        })
        const latestRecords = Object.values(latestByProject)

        // 最近一次检测的项目总数
        const latestTotal = latestRecords.length

        // 异常项目数（最近一次）
        const abnormalCount = latestRecords.filter(r => r.status === 'abnormal').length
        // 正常项目数（最近一次）
        const normalCount = latestTotal - abnormalCount

        this.overview = {
          totalTests,
          abnormalCount,
          normalCount,
          lastTestDate
        }

        // 异常指标列表（最近一次的异常项目）
        this.abnormalItems = latestRecords
            .filter(r => r.status === 'abnormal')
            .map(r => ({
              name: r.name,
              value: r.value,
              unit: r.unit || '',
              status: r._statusDetail || 'high',
              deviation: r.deviation || '',
              date: r.date,
              refRange: r.refRange
            }))

        // 最近检测记录（每个项目最新一条）
        this.recentRecords = latestRecords.map(r => ({ ...r, status: r.status }))

        // 保存完整历史用于趋势计算
        this.fullRecentRecords = recordsWithStatus
        // 计算趋势
        this.calculateAbnormalTrend(recordsWithStatus)

      } catch (error) {
        console.error('加载大屏数据失败:', error)
        this.$message.error('加载数据失败，请稍后重试')
        this.overview = { totalTests: 0, abnormalCount: 0, normalCount: 0, lastTestDate: '-' }
        this.abnormalItems = []
        this.recentRecords = []
        this.abnormalTrendList = []
        this.fullRecentRecords = []
      } finally {
        this.loading = false
      }
    },

    calculateAbnormalTrend(recordsWithStatus) {
      const records = recordsWithStatus || this.fullRecentRecords
      if (records.length === 0) {
        this.abnormalTrendList = []
        return
      }

      // 按项目分组，按日期排序（旧→新）
      const groupMap = {}
      records.forEach(r => {
        if (!groupMap[r.name]) groupMap[r.name] = []
        groupMap[r.name].push(r)
      })

      const trendList = []

      Object.keys(groupMap).forEach(name => {
        const items = groupMap[name].sort((a, b) => new Date(a.date) - new Date(b.date))
        if (items.length < 2) return

        // 获取该项目的参考区间
        const { low, high } = this.parseRefRange(items[0]?.refRange)

        // 从最近一次开始，向前找连续异常的记录（按次数连续）
        let consecutiveAbnormal = []
        // 从后往前遍历（从最近到最旧）
        for (let i = items.length - 1; i >= 0; i--) {
          const record = items[i]
          const isAbnormal = record.status === 'abnormal'
          if (isAbnormal) {
            consecutiveAbnormal.push(record)
          } else {
            // 遇到正常记录，连续中断，停止向前
            break
          }
        }

        // 如果连续异常次数 < 2，跳过
        if (consecutiveAbnormal.length < 2) return

        // 反转，使日期从旧到新（便于判断趋势）
        consecutiveAbnormal.reverse()

        // 检查数值是否持续远离参考区间（连续上升或连续下降）
        let direction = null
        let allConsistent = true

        for (let i = 1; i < consecutiveAbnormal.length; i++) {
          const prev = parseFloat(consecutiveAbnormal[i - 1].value)
          const curr = parseFloat(consecutiveAbnormal[i].value)
          if (isNaN(prev) || isNaN(curr)) {
            allConsistent = false
            break
          }

          // 判断当前是偏高还是偏低（相对于参考区间）
          const isHigh = high !== null && prev > high && curr > high
          const isLow = low !== null && prev < low && curr < low

          // 如果不在同一侧（有的偏高有的偏低），不算连续趋势
          if (!isHigh && !isLow) {
            allConsistent = false
            break
          }

          // 判断方向：是否持续远离
          let currentDir = null
          if (isHigh) {
            // 偏高：数值越大表示越远离
            currentDir = curr > prev ? 'up' : (curr < prev ? 'down' : null)
          } else if (isLow) {
            // 偏低：数值越小表示越远离
            currentDir = curr < prev ? 'down' : (curr > prev ? 'up' : null)
          }

          if (currentDir === null) {
            allConsistent = false
            break
          }

          if (direction === null) {
            direction = currentDir
          } else if (direction !== currentDir) {
            // 方向不一致，中断
            allConsistent = false
            break
          }
        }

        // 只有持续远离（方向一致）且全部在正常范围外，才计入趋势
        if (allConsistent && direction !== null) {
          const recentValues = consecutiveAbnormal.map(item => ({
            date: item.date,
            value: item.value,
            unit: item.unit || '',
            status: item.status
          }))

          // direction 存储的是相对于参考区间的远离方向
          // up = 越来越高（偏高时）或 越来越低（偏低时但数值上升，即靠近正常值？这里需要修正）
          // 修正：统一用 'up' 表示数值朝远离参考区间的方向变化
          const firstVal = parseFloat(consecutiveAbnormal[0].value)
          const lastVal = parseFloat(consecutiveAbnormal[consecutiveAbnormal.length - 1].value)
          const isHighSide = high !== null && firstVal > high && lastVal > high
          const isLowSide = low !== null && firstVal < low && lastVal < low

          let displayDirection = ''
          if (isHighSide) {
            displayDirection = lastVal > firstVal ? '↑ 持续升高' : '↓ 持续降低'
          } else if (isLowSide) {
            displayDirection = lastVal < firstVal ? '↓ 持续降低' : '↑ 持续升高'
          } else {
            // 跨侧或无法判断，跳过
            return
          }

          trendList.push({
            name,
            direction: isHighSide ? (lastVal > firstVal ? 'up' : 'down') : (lastVal < firstVal ? 'down' : 'up'),
            count: consecutiveAbnormal.length,
            recentValues,
            displayDirection
          })
        }
      })

      // 按连续次数从高到低排序
      trendList.sort((a, b) => b.count - a.count)
      this.abnormalTrendList = trendList
    },

    getColorByCount(count, direction) {
      const opacity = Math.min(0.5 + (count - 2) * 0.12, 1)
      return direction === 'up' ? `rgba(245, 108, 108, ${opacity})` : `rgba(64, 158, 255, ${opacity})`
    },

    goToDetail() {
      this.$router.push('/bloodTestResult')
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 16px 24px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.header-left h1 { margin: 0; font-size: 22px; }
.user-role {
  font-size: 12px;
  color: #67C23A;
  background: #f0f9f0;
  padding: 2px 10px;
  border-radius: 10px;
  margin-left: 10px;
}
.stats-row { margin-bottom: 20px; }
.stats-card { display: flex; align-items: center; padding: 10px 0; }
.stats-icon { font-size: 32px; margin: 0 20px; }
.stats-content { flex: 1; }
.stats-number { font-size: 28px; font-weight: bold; }
.stats-label { color: #909399; font-size: 13px; margin-top: 4px; }

.equal-height-row {
  display: flex;
  align-items: stretch;
}
.equal-height-row .el-col {
  display: flex;
}
.equal-height-row .el-col .el-card {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.equal-height-row .el-col .el-card .el-card__body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.abnormal-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.abnormal-date {
  font-size: 12px;
  color: #909399;
  margin-left: auto;
}
.abnormal-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  cursor: pointer;
  max-height: 340px;
}
.abnormal-scroll-container::-webkit-scrollbar {
  width: 4px;
}
.abnormal-scroll-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}
.abnormal-scroll-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
.abnormal-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

/* ========== 异常指标表格样式（新增） ========== */
.abnormal-table {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.abnormal-table-header {
  display: flex;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  color: #909399;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 4px;
}

.abnormal-table-row {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 4px;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
}
.abnormal-table-row:hover {
  background: #f5f7fa;
}
.abnormal-table-row:last-child {
  border-bottom: none;
}

.col-name {
  flex: 3;
  font-size: 13px;
  color: #303133;
  font-weight: 500;
  word-break: break-word;
  min-width: 0;
}
.col-status {
  flex: 1.2;
  display: flex;
  align-items: center;
}
.col-value {
  flex: 1.5;
  font-weight: bold;
  font-size: 13px;
  white-space: nowrap;
}
.col-deviation {
  flex: 1;
  color: #909399;
  font-size: 13px;
  text-align: right;
  white-space: nowrap;
}

/* 状态标签 */
.item-status-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 500;
  white-space: nowrap;
  display: inline-block;
}
.tag-high {
  background: #fef0f0;
  color: #F56C6C;
}
.tag-low {
  background: #ecf5ff;
  color: #409EFF;
}

.abnormal-footer {
  text-align: center;
  color: #409EFF;
  cursor: pointer;
  padding: 10px 0 4px 0;
  font-size: 13px;
  border-top: 1px dashed #e4e7ed;
  transition: color 0.2s;
  flex-shrink: 0;
}
.abnormal-footer:hover {
  color: #66b1ff;
}

.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.trend-scroll-container {
  flex: 1;
  overflow-y: auto;
  max-height: 340px;
  padding-right: 4px;
}
.trend-scroll-container::-webkit-scrollbar {
  width: 4px;
}
.trend-scroll-container::-webkit-scrollbar-track {
  background: #f0f0f0;
  border-radius: 4px;
}
.trend-scroll-container::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
.trend-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #909399;
}

.trend-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  border-radius: 6px;
  background: #fafafa;
  border-left: 3px solid #d9d9d9;
  transition: background 0.2s;
}
.trend-item:hover {
  background: #f0f2f5;
}
.trend-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.trend-name {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}
.trend-tag {
  font-size: 12px;
  padding: 2px 12px;
  border-radius: 12px;
  color: #fff;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.trend-count {
  background: rgba(255,255,255,0.3);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 11px;
}
.trend-values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}
.trend-value-item {
  font-size: 13px;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}
.trend-value-item.is-abnormal {
  border-color: #F56C6C;
  background: #fef0f0;
}
.trend-value-item.is-normal {
  border-color: #67C23A;
  background: #f0f9f0;
}
.empty-text {
  text-align: center;
  color: #67C23A;
  padding: 30px 0;
  font-size: 16px;
}

.abnormal-dialog-scroll {
  max-height: 500px;
  overflow-y: auto;
}
.abnormal-dialog-scroll::-webkit-scrollbar {
  width: 4px;
}
.abnormal-dialog-scroll::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 4px;
}
.dialog-item {
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.dialog-item:last-child {
  border-bottom: none;
}
.item-date {
  font-size: 12px;
  color: #c0c4cc;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.footer-count {
  color: #909399;
  font-size: 13px;
}
.badge {
  margin-left: 8px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.history-card .el-table {
  width: 100%;
}
</style>