<template>
  <div class="doctor-dashboard" style="  overflow: hidden !important;">
    <!-- ===== 顶部指标卡 ===== -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <i class="el-icon-user"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalPatients || 0 }}</div>
              <div class="stat-label">总患者</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.totalTests || 0 }}</div>
              <div class="stat-label">总检测记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <i class="el-icon-data-line"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.avgTests || 0 }}</div>
              <div class="stat-label">平均检测次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red">
              <i class="el-icon-medal"></i>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ stats.maxTests || 0 }}</div>
              <div class="stat-label">最多检测</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ===== 图表区域 ===== -->
    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="chart-header">
            <span class="chart-title">📊 患者检测频率分布</span>
          </div>
          <div ref="frequencyChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="chart-header">
            <span class="chart-title">📈 患者活跃度趋势</span>
            <span class="chart-subtitle">近2个月</span>
          </div>
          <div ref="activityChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="chart-header">
            <span class="chart-title">🏥 患者健康状况</span>
          </div>
          <div ref="healthChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover" class="chart-card">
          <div slot="header" class="chart-header">
            <span class="chart-title">⚠️ 需关注患者Top5</span>
          </div>
          <el-table
              :data="concernPatients"
              size="small"
              style="width: 100%;height: 200px"
              :header-cell-style="{ background: '#f5f7fa', fontWeight: 'bold' }"
          >
            <el-table-column prop="rank" label="#" width="50" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.rank <= 3 ? 'danger' : 'warning'" size="small">
                  {{ row.rank }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="username" label="患者" />
            <el-table-column prop="abnormalCount" label="异常次数" width="80" align="center">
              <template slot-scope="{ row }">
                <el-tag :type="row.abnormalCount >= 4 ? 'danger' : 'warning'" size="small">
                  {{ row.abnormalCount }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="abnormalItems" label="主要异常" show-overflow-tooltip />
          </el-table>
          <div v-if="concernPatients.length === 0" class="empty-tip">
            <i class="el-icon-check"></i> 暂无异常患者，继续保持！
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import request from '@/api'

export default {
  name: 'DoctorDashboard',
  data() {
    return {
      stats: {
        totalPatients: 0,
        totalTests: 0,
        avgTests: 0,
        maxTests: 0
      },
      frequencyData: [],
      activityData: { dates: [], counts: [] },
      healthData: [],
      concernPatients: [],
      frequencyInstance: null,
      activityInstance: null,
      healthInstance: null
    }
  },
  mounted() {
    this.initData()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    this.frequencyInstance?.dispose()
    this.activityInstance?.dispose()
    this.healthInstance?.dispose()
  },
  methods: {
    async initData() {
      await Promise.all([
        this.loadStats(),
        this.loadFrequency(),
        this.loadActivity(),
        this.loadHealthStatus(),
        this.loadConcernPatients()
      ])

      this.$nextTick(() => {
        this.renderFrequencyChart()
        this.renderActivityChart()
        this.renderHealthChart()
      })

      window.addEventListener('resize', this.handleResize)
    },

    // ==================== 加载数据 ====================
    async loadStats() {
      try {
        const res = await request.get('/bloodTest/patient/stats')
        this.stats = res
      } catch (error) {
        console.error('加载统计数据失败:', error)
      }
    },

    async loadFrequency() {
      try {
        const res = await request.get('/bloodTest/patient/frequency')
        this.frequencyData = res
        this.$nextTick(() => {
          this.renderFrequencyChart()
        })
      } catch (error) {
        console.error('加载频率数据失败:', error)
      }
    },

    async loadActivity() {
      try {
        const res = await request.get('/bloodTest/patient/activity')
        this.activityData = {
          dates: res.map(item => item.date || item.DATE),
          counts: res.map(item => item.count || item.COUNT)
        }
        this.$nextTick(() => {
          this.renderActivityChart()
        })
      } catch (error) {
        console.error('加载活跃度数据失败:', error)
      }
    },

    async loadHealthStatus() {
      try {
        const res = await request.get('/bloodTest/patient/health-status')
        this.healthData = res
        this.$nextTick(() => {
          this.renderHealthChart()
        })
      } catch (error) {
        console.error('加载健康状况数据失败:', error)
      }
    },

    async loadConcernPatients() {
      try {
        const res = await request.get('/bloodTest/patient/concern')
        this.concernPatients = res || []
      } catch (error) {
        console.error('加载关注患者数据失败:', error)
      }
    },

    // ==================== 渲染图表 ====================

    renderFrequencyChart() {
      const el = this.$refs.frequencyChart
      if (!el) return

      if (!this.frequencyInstance) {
        this.frequencyInstance = echarts.init(el)
      }

      const data = this.frequencyData
      const xData = data.map(item => item.frequency)
      const yData = data.map(item => item.count)

      this.frequencyInstance.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0]
            return `${p.name}<br/>患者数：<strong>${p.value}</strong> 人`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '5%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xData,
          axisLabel: { fontSize: 12 }
        },
        yAxis: {
          type: 'value',
          name: '人数',
          nameTextStyle: { fontSize: 12 },
          splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
        },
        series: [
          {
            type: 'bar',
            data: yData,
            barWidth: '50%',
            itemStyle: {
              color: (params) => {
                const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
                return colors[params.dataIndex % colors.length]
              },
              borderRadius: [4, 4, 0, 0]
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 14,
              fontWeight: 'bold'
            }
          }
        ]
      })
    },

    renderActivityChart() {
      const el = this.$refs.activityChart
      if (!el) return

      if (!this.activityInstance) {
        this.activityInstance = echarts.init(el)
      }

      const { dates, counts } = this.activityData

      if (!dates || dates.length === 0) {
        this.activityInstance.setOption({
          title: {
            text: '暂无数据',
            left: 'center',
            top: 'center',
            textStyle: { color: '#909399', fontSize: 16 }
          }
        })
        return
      }

      this.activityInstance.setOption({
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const p = params[0]
            return `${p.name}<br/>活跃患者数：<strong>${p.value}</strong> 人`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '5%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            fontSize: 11,
            rotate: dates.length > 20 ? 30 : 0
          }
        },
        yAxis: {
          type: 'value',
          name: '人数',
          nameTextStyle: { fontSize: 12 },
          minInterval: 1,
          splitLine: { lineStyle: { type: 'dashed', color: '#E4E7ED' } }
        },
        series: [
          {
            type: 'line',
            data: counts,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
              color: '#409EFF',
              width: 3
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.4)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
                ]
              }
            },
            itemStyle: {
              color: '#409EFF'
            },
            label: {
              show: true,
              fontSize: 11,
              formatter: (params) => params.value > 0 ? params.value : ''
            }
          }
        ]
      })
    },

    renderHealthChart() {
      const el = this.$refs.healthChart
      if (!el) return

      if (!this.healthInstance) {
        this.healthInstance = echarts.init(el)
      }

      const data = this.healthData
      const colorMap = {
        '正常': '#67C23A',
        '需关注': '#E6A23C',
        '需干预': '#F56C6C'
      }

      this.healthInstance.setOption({
        tooltip: {
          trigger: 'item',
          formatter: (params) => {
            return `${params.name}<br/>人数：<strong>${params.value}</strong> 人<br/>占比：<strong>${params.percent}%</strong>`
          }
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          itemWidth: 14,
          itemHeight: 14,
          textStyle: { fontSize: 13 }
        },
        series: [
          {
            type: 'pie',
            radius: ['45%', '75%'],
            center: ['45%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 12
            },
            labelLine: {
              length: 15,
              length2: 10
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 14,
                fontWeight: 'bold'
              }
            },
            data: data.map(item => ({
              name: item.status,
              value: item.count,
              itemStyle: { color: colorMap[item.status] || '#909399' }
            }))
          }
        ]
      })
    },

    // ==================== 窗口自适应 ====================
    handleResize() {
      this.frequencyInstance?.resize()
      this.activityInstance?.resize()
      this.healthInstance?.resize()
    }
  }
}
</script>

<style scoped>
.doctor-dashboard {
  padding: 20px;
  background: #f0f2f5;
  min-height: calc(100vh - 60px);
}

/* ===== 指标卡 ===== */
.stat-cards {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #409EFF, #2d7fd3);
}
.stat-icon.green {
  background: linear-gradient(135deg, #67C23A, #4a9e2f);
}
.stat-icon.orange {
  background: linear-gradient(135deg, #E6A23C, #c98c2b);
}
.stat-icon.red {
  background: linear-gradient(135deg, #F56C6C, #d94a4a);
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 2px;
}

/* ===== 图表卡片 ===== */
.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  border-radius: 12px;
  overflow: hidden;
}

.chart-card >>> .el-card__header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #fafafa;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-subtitle {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  height: 200px;
  width: 100%;
}

/* ===== 空状态 ===== */
.empty-tip {
  text-align: center;
  padding: 40px 0;
  color: #67C23A;
  font-size: 16px;
}

.empty-tip i {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

/* ===== 表格样式 ===== */
.el-table >>> .el-table__header th {
  background: #f5f7fa !important;
}
</style>