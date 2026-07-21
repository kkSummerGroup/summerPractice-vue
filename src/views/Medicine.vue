<template>
  <div class="container">
    <div class="main-wrapper">
      <div class="main-content">
        <!-- 搜索栏 -->
        <div class="search-bar">
          <el-input
              v-model="medName"
              placeholder="请输入药品名称搜索"
              size="medium"
              clearable
              class="search-input"
              @keyup.enter.native="getMyMedData"
          >
            <el-button
                slot="append"
                type="primary"
                icon="el-icon-search"
                @click="getMyMedData"
            >查询</el-button>
          </el-input>
          <span class="total-tip">共 {{ medList.length }} 种药品</span>
        </div>

        <el-divider></el-divider>
        <el-divider></el-divider>

        <!-- 药品列表 -->
        <div class="medicine-container">
          <div
              v-for="(item, index) in medList"
              :key="index"
              class="medicine-box"
              @click="openPreview(item)"
          >
            <el-tag
                :type="getCategoryTagType(item.medCategory)"
                size="medium"
                class="category-tag"
                effect="dark"
            >
              {{ item.medCategory || '未分类' }}
            </el-tag>

            <!-- 左侧：图片区 -->
            <div class="medicine-image-wrapper">
              <img
                  :src="item.medPic || defaultImage"
                  alt="药品"
                  class="medicine-image"
              />
            </div>

            <!-- 右侧：药品信息 -->
            <div class="medicine-info">
              <div class="medicine-name" :title="item.medName">
                {{ item.medName || '未命名' }}
              </div>
              <div class="medicine-meta">
                <el-tag size="mini" :type="getUsageTagType(item.medUsage)" class="usage-tag">
                  {{ item.medUsage || '未分类' }}
                </el-tag>
                <span class="medicine-dosage">{{ item.medDosage || '暂无用量' }}</span>
              </div>
              <div class="medicine-status">
                <el-tag
                    size="mini"
                    :type="item.status === 1 ? 'success' : 'info'"
                    effect="plain"
                >
                  {{ item.status === 1 ? '使用中' : '已停用' }}
                </el-tag>
                <span v-if="item.docAdvice" class="medicine-doc-advice">{{ item.docAdvice }}</span>
              </div>
            </div>

            <!-- ✅ 右下角：医生姓名标签 -->
            <div v-if="item.docName" class="doctor-tag">
              <i class="el-icon-user"></i>
              开药医生：{{ item.docName }}
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="medList.length === 0 && !loading" class="empty-state">
          <i class="el-icon-document"></i>
          <p>暂无药品记录</p>
        </div>

        <!-- ========== 预览弹窗 ========== -->
        <el-dialog
            :visible.sync="previewVisible"
            width="55%"
            :close-on-click-modal="true"
            class="preview-dialog"
        >
          <div class="preview-container">
            <div class="preview-image-wrapper">
              <img
                  :src="previewMedImage"
                  alt="药品图片"
                  class="preview-image"
              >
            </div>
            <div v-if="currentItem" class="preview-info">
              <div class="preview-name">
                {{ currentItem.medName }}
                <el-tag
                    size="small"
                    :type="currentItem.status === 1 ? 'success' : 'info'"
                    effect="plain"
                >
                  {{ currentItem.status === 1 ? '使用中' : '已停用' }}
                </el-tag>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">药品功能</span>
                  <span class="info-value">{{ currentItem.medFunction || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">药品规格</span>
                  <span class="info-value">{{ currentItem.medSpecification || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">药品类型</span>
                  <span class="info-value">
                    <el-tag :type="getCategoryTagType(currentItem.medCategory)" size="small">
                      {{ currentItem.medCategory || '-' }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">使用方法</span>
                  <span class="info-value">
                    <el-tag :type="getUsageTagType(currentItem.medUsage)" size="small">
                      {{ currentItem.medUsage || '-' }}
                    </el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">用法用量</span>
                  <span class="info-value highlight">{{ currentItem.medDosage || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">医嘱</span>
                  <span class="info-value">{{ currentItem.docAdvice || '-' }}</span>
                </div>
                <div class="info-item" style="grid-column: 1 / -1;">
                  <span class="info-label">用药禁忌：</span>
                  <div class="contraindication-preview-list">
                    <template v-if="getContraindicationList(currentItem.medContraindication).length > 0">
                      <div
                          v-for="(item, index) in getContraindicationList(currentItem.medContraindication)"
                          :key="index"
                          class="contraindication-preview-item"
                      >
                        <el-tag
                            type="danger"
                            size="small"
                            class="contraindication-tag"
                            effect="plain"
                        >
                          {{ item }}
                        </el-tag>
                      </div>
                    </template>
                    <span v-else class="info-value">无禁忌</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import request from "@/api"

export default {
  name: "Medicine",
  data() {
    return {
      loading: false,
      medList: [],
      medName: '',

      // 预览
      previewVisible: false,
      previewMedImage: '',
      currentItem: null,

      defaultImage: 'https://cube.elemecdn.com/6/94/4d3ea53c084bad6931a56d5158a48jpeg.jpeg'
    }
  },

  computed: {
    ...mapGetters(['userId', 'username', 'role'])
  },

  mounted() {
    if (this.userId) {
      this.getMyMedData()
    }
  },

  methods: {
    // ========== 查询患者的药品 ==========
    async getMyMedData() {
      if (!this.userId) {
        this.$message.warning('请先登录')
        return
      }

      this.loading = true
      try {
        const response = await request.post('/userMedicine/getUserMed', {
          userId: this.userId,
          medName: this.medName,
          current: 1,
          size: 999
        })
        this.medList = response.records || []
      } catch (error) {
        console.error('查询药品失败:', error)
        this.$message.error(error.response?.data?.message || '查询失败，请稍后重试')
      } finally {
        this.loading = false
      }
    },

    // ========== 预览 ==========
    openPreview(item) {
      this.previewMedImage = item.medPic || this.defaultImage
      this.currentItem = item
      this.previewVisible = true
    },

    // ========== 标签颜色 ==========
    getCategoryTagType(category) {
      const map = {
        '处方药': 'danger',
        '非处方药': 'success',
        '中成药': 'warning'
      }
      return map[category] || 'info'
    },

    getUsageTagType(usage) {
      const map = {
        '口服': 'success',
        '外用': 'warning',
        '吸入': 'primary',
        '含服': '',
        '注射': 'danger',
        '滴眼/滴鼻': 'danger',
        '其他': 'danger'
      }
      return map[usage] || 'info'
    },

    // ========== 工具方法 ==========
    getContraindicationList(contraindication) {
      if (!contraindication) return []
      return contraindication.split('|').filter(item => item.trim() !== '')
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
  background: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.main-content {
  flex: 1;
  min-width: 0;
}

/* ========== 搜索栏 ========== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0 0 20px 20px;
}

.search-input {
  width: 300px;
}

.search-input >>> .el-input-group__append {
  padding: 0 10px;
}

.search-input >>> .el-input-group__append .el-button {
  border-radius: 0 4px 4px 0;
  height: 40px;
  padding: 0 20px;
}

.total-tip {
  font-size: 14px;
  color: #909399;
}

/* ========== 药品列表 ========== */
.medicine-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px 10px;
}

/* ✅ 卡片变大：宽度 360px，高度自适应 */
.medicine-box {
  position: relative;
  display: flex;
  align-items: flex-start;  /* 改为顶部对齐，适应多行文字 */
  width: 100%;
  max-width: 360px;        /* 从 300px 改为 360px */
  min-height: 160px;       /* 从固定高度改为最小高度 */
  padding: 16px 18px;      /* 内边距加大 */
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.25s ease;
  cursor: pointer;
  gap: 16px;
  flex-shrink: 0;
}

.medicine-box:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.10);
  border-color: #c0c4cc;
}

/* ---- 图片区：稍微放大 ---- */
.medicine-image-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 110px;           /* 从 100px 改为 110px */
  height: 100px;          /* 从 90px 改为 100px */
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
}

.medicine-image {
  width: 100%;
  height: 100%;
  object-fit: contain;  /* 从 cover 改为 contain，显示完整图片 */
  display: block;
  background: #f5f7fa;  /* 背景色，填充空白区域 */
}

/* 类型标签 */
.category-tag {
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: 14px !important;
  padding: 2px 14px;
  line-height: 28px;
  height: 32px;
  border-radius: 16px 16px 16px 4px;
  opacity: 0.95;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  font-weight: 500;
}

/* ---- 信息区 ---- */
.medicine-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;  /* 从 center 改为 flex-start */
  gap: 4px;
  padding-top: 2px;
}

.medicine-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.medicine-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.usage-tag {
  font-size: 11px;
  padding: 0 8px;
  line-height: 20px;
  border-radius: 4px;
}

.medicine-dosage {
  font-size: 13px;
  color: #606266;
  background: #f5f7fa;
  padding: 0 10px;
  line-height: 22px;
  border-radius: 4px;
  white-space: nowrap;
}

.medicine-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.medicine-remark {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ✅ 医生建议：多行展示 */
.medicine-doc-advice {
  font-size: 13px;
  color: #409eff;
  background: #ecf5ff;
  padding: 4px 10px;
  border-radius: 4px;
  margin-top: 4px;
  line-height: 1.5;
  /* 最多显示2行，超出显示省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}

/* ========== 空状态 ========== */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 64px;
  color: #d0d5dd;
}

.empty-state p {
  font-size: 16px;
  margin-top: 16px;
}

/* ========== 预览弹窗 ========== */
.preview-dialog .el-dialog__body {
  padding: 20px 30px 30px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.preview-image-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f7f8fa;
  border-radius: 12px;
  padding: 20px;
  min-height: 150px;
}

.preview-image {
  max-width: 300px;
  max-height: 300px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.preview-name {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  text-align: center;
  padding-bottom: 16px;
  border-bottom: 2px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 40px;
}

.info-item {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.info-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  color: #303133;
}

.info-value.highlight {
  color: #409eff;
  font-weight: 600;
}

.contraindication-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
}

.contraindication-tag {
  font-weight: 500;
  border-radius: 6px;
  font-size: 13px !important;
  padding: 0 14px;
  height: 28px;
  line-height: 28px;
  background-color: #fef0f0 !important;
  border-color: #fde2e2 !important;
  color: #f56c6c !important;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* ========== 医生标签（右下角） ========== */
.doctor-tag {
  position: absolute;
  bottom: 10px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #fff;
  background: linear-gradient(135deg, #f56c6c, #e74c3c);
  padding: 2px 12px;
  border-radius: 12px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(245, 108, 108, 0.35);
  white-space: nowrap;
  z-index: 2;
}

.doctor-tag i {
  font-size: 12px;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
    align-items: stretch;
    margin: 0 0 16px 0;
  }

  .search-input {
    width: 100%;
  }

  .medicine-box {
    max-width: 100%;
    height: 130px;
    padding: 10px 12px;
  }

  .medicine-image-wrapper {
    width: 70px;
    height: 70px;
  }

  .medicine-name {
    font-size: 15px;
  }

  .medicine-dosage {
    font-size: 12px;
    padding: 0 6px;
  }

  .category-tag {
    font-size: 10px;
    top: -4px;
    right: 6px;
    padding: 0 8px;
    line-height: 20px;
    height: 24px;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .preview-image {
    max-width: 200px;
    max-height: 200px;
  }

  .preview-name {
    font-size: 20px;
  }
}
</style>