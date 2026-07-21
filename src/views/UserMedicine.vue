<template>
  <div class="container">
    <!-- ========== 主内容 + 右侧用户列表 ========== -->
    <div class="main-wrapper">
      <!-- 左侧主内容 -->
      <div class="main-content">
        <!-- 操作按钮 -->
        <div class="search-bar">
          <el-input
              v-model="queryMed.medName"
              placeholder="请输入药品名称搜索"
              size="medium"
              clearable
              class="search-input"
              @keyup.enter.native="getUserMedData"
          >
            <el-button
                slot="append"
                type="primary"
                icon="el-icon-search"
                @click="getUserMedData"
            >查询</el-button>
          </el-input>
          <el-button class="add-btn" type="primary" :disabled="!selectedUser" @click="openUpdateDialog">更新药品</el-button>
        </div>
        <el-divider></el-divider>

        <!-- 显示当前选中的用户 -->
        <div v-if="selectedUser" class="current-user">
          <el-tag type="success" size="large">
            当前用户：{{ selectedUser.username }}（{{ selectedUser.userId }}）
            <span style="margin-left: 20px; color: #909399; font-weight: normal;">
              已开 {{ queriedMedData.length }} 种药品
            </span>
          </el-tag>
        </div>
        <div v-else class="current-user">
          <el-tag type="info" size="large">请先在右侧选择一个用户</el-tag>
        </div>

        <!-- 药品列表 -->
        <div class="medicine-container">
          <div
              v-for="(item, index) in queriedMedData"
              :key="index"
              class="medicine-box"
              @click="openPreview(item)"
              @contextmenu.prevent="openEditMenu($event, item)"
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
              <!-- 显示医生建议（如果有） -->
              <div v-if="item.docAdvice" class="medicine-doc-advice">
                <i class="el-icon-document"></i> 医嘱：{{ item.docAdvice }}
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="selectedUser && queriedMedData.length === 0" class="empty-state">
            <i class="el-icon-document"></i>
            <p>暂未给该用户开药品</p>
          </div>
        </div>

        <!-- 放大预览的弹窗 -->
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
              />
            </div>
            <div v-if="currentItem" class="preview-info">
              <div class="preview-name">
                {{ currentItem.medName }}
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
                    <el-tag :type="getUsageTagType(currentItem.medUsage)" size="small">{{ currentItem.medUsage || '-' }}</el-tag>
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">用法用量</span>
                  <span class="info-value highlight">{{ currentItem.medDosage || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">医生建议</span>
                  <span class="info-value">{{ currentItem.docAdvice || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">慎用禁用者：</span>
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

        <!-- ========== 更新药品 Dialog ========== -->
        <el-dialog
            title="更新药品"
            :visible.sync="formDialogVisible"
            width="85%"
            :close-on-click-modal="false"
            @close="resetForm"
        >
          <div class="dialog-body-wrapper">
            <!-- ===== 左侧：已选药品列表 ===== -->
            <div class="dialog-left">
              <div class="selected-list-header">
                <span>已选药品（{{ selectedMedList.length }}）</span>
                <el-button
                    v-if="selectedMedList.length > 0"
                    type="danger"
                    size="mini"
                    plain
                    @click="clearAllSelected"
                >清空全部</el-button>
              </div>

              <div v-if="selectedMedList.length > 0" class="selected-med-list">
                <div
                    v-for="(item, index) in selectedMedList"
                    :key="item.medId || index"
                    class="selected-med-box"
                >
                  <el-tag
                      :type="getCategoryTagType(item.medCategory)"
                      size="medium"
                      class="selected-category-tag"
                      effect="dark"
                  >
                    {{ item.medCategory || '未分类' }}
                  </el-tag>
                  <div class="selected-med-image-wrapper">
                    <img
                        :src="item.medPic || defaultImage"
                        alt="药品"
                        class="selected-med-image"
                    />
                  </div>
                  <div class="selected-med-info">
                    <div class="selected-med-name" :title="item.medName">
                      {{ item.medName || '未命名' }}
                    </div>
                    <div class="selected-med-meta">
                      <el-tag size="mini" :type="getUsageTagType(item.medUsage)" class="selected-usage-tag">
                        {{ item.medUsage || '未分类' }}
                      </el-tag>
                      <span class="selected-med-dosage">{{ item.medDosage || '暂无用量' }}</span>
                    </div>
                    <div class="selected-med-contraindication">
                      <span class="contraindication-label">禁忌：</span>
                      <template v-if="getContraindicationList(item.medContraindication).length > 0">
                        <el-tag
                            v-for="(tag, idx) in getContraindicationList(item.medContraindication)"
                            :key="idx"
                            type="danger"
                            size="mini"
                            class="contraindication-tag-mini"
                        >
                          {{ tag }}
                        </el-tag>
                      </template>
                      <span v-else class="no-contraindication">无</span>
                    </div>
                  </div>
                  <div class="selected-med-action" @click.stop="removeSelectedMed(index)">
                    <el-button type="danger" size="mini" circle icon="el-icon-close" />
                  </div>
                  <div class="selected-med-advice">
                    <div style="display: flex; align-items: flex-start; gap: 10px; width: 100%;">
                      <el-input
                          v-model="selectedMedList[index].docAdvice"
                          type="textarea"
                          :rows="2"
                          placeholder="请输入医生建议"
                          size="small"
                          style="flex: 1;"
                      />
                      <el-popover placement="bottom" width="320" trigger="click">
                        <div style="max-height: 200px; overflow-y: auto;">
                          <div
                              v-for="item in docAdviceOptions"
                              :key="item.value"
                              class="suggestion-item"
                              @click="insertSuggestion(index, item.value)"
                          >
                            {{ item.label }}
                          </div>
                        </div>
                        <el-button slot="reference" size="small" type="primary" style="margin-top: 2px; flex-shrink: 0;">
                          <i class="el-icon-document-add"></i> 快捷短语
                        </el-button>
                      </el-popover>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-selected">
                <i class="el-icon-warning-outline"></i>
                <p>请从右侧选择药品</p>
              </div>
            </div>

            <!-- ===== 右侧：药品卡片列表 ===== -->
            <div class="dialog-right">
              <div class="dialog-medicine-header">
                <span>选择药品</span>
                <el-input
                    v-model="dialogMedKeyword"
                    placeholder="搜索药品名称"
                    size="small"
                    clearable
                    style="width: 200px;"
                    @input="filterDialogMedList"
                />
              </div>
              <div class="dialog-medicine-container">
                <div
                    v-for="item in filteredDialogMedList"
                    :key="item.medId"
                    class="dialog-medicine-box"
                    :class="{ selected: isMedSelected(item.medId) }"
                    @click="toggleSelectMed(item)"
                >
                  <el-tag
                      :type="getCategoryTagType(item.medCategory)"
                      size="medium"
                      class="dialog-category-tag"
                      effect="dark"
                  >
                    {{ item.medCategory || '未分类' }}
                  </el-tag>
                  <div class="dialog-medicine-image-wrapper">
                    <img
                        :src="item.medPic || defaultImage"
                        alt="药品"
                        class="dialog-medicine-image"
                    />
                  </div>
                  <div class="dialog-medicine-info">
                    <div class="dialog-medicine-name" :title="item.medName">
                      {{ item.medName || '未命名' }}
                    </div>
                    <div class="dialog-medicine-meta">
                      <el-tag size="mini" :type="getUsageTagType(item.medUsage)" class="dialog-usage-tag">
                        {{ item.medUsage || '未分类' }}
                      </el-tag>
                      <span class="dialog-medicine-dosage">{{ item.medDosage || '暂无用量' }}</span>
                    </div>
                    <div class="selected-med-contraindication">
                      <span class="contraindication-label">禁忌：</span>
                      <template v-if="getContraindicationList(item.medContraindication).length > 0">
                        <el-tag
                            v-for="(tag, idx) in getContraindicationList(item.medContraindication)"
                            :key="idx"
                            type="danger"
                            size="mini"
                            class="contraindication-tag-mini"
                        >
                          {{ tag }}
                        </el-tag>
                      </template>
                      <span v-else class="no-contraindication">无</span>
                    </div>
                  </div>
                  <div class="dialog-medicine-action" @click.stop="toggleSelectMed(item)">
                    <el-button
                        :type="isMedSelected(item.medId) ? 'danger' : 'success'"
                        size="mini"
                        circle
                        :icon="isMedSelected(item.medId) ? 'el-icon-minus' : 'el-icon-plus'"
                    />
                  </div>
                </div>

                <div v-if="filteredDialogMedList.length === 0" class="dialog-empty-state">
                  <i class="el-icon-document"></i>
                  <p>{{ dialogMedKeyword ? '未找到匹配药品' : '暂无药品' }}</p>
                </div>
              </div>
            </div>
          </div>

          <span slot="footer" class="dialog-footer">
            <el-button @click="formDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveUserMedicine" :loading="submitLoading">
              更新
            </el-button>
          </span>
        </el-dialog>
      </div>

      <!-- ========== 右侧用户列表 ========== -->
      <div class="user-sidebar">
        <UserSelector
            ref="userSelector"
            v-model="selectedUserId"
            :page-size="10"
            title="选择用户"
            @change="onUserChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/api"
import UserSelector from "@/components/UserSelector.vue"
import { mapGetters } from 'vuex'

export default {
  name: "MedicineManage",
  components: {
    UserSelector
  },
  data() {
    return {
      // ========== 用户选择 ==========
      selectedUserId: '',
      selectedUser: null,

      // ========== 查询对象 ==========
      queryMed: {
        medName: '',
        userId: '',
        current: 1,
        size: 100,
        total: 0
      },

      queriedMedData: [],

      // ========== 预览 ==========
      previewVisible: false,
      previewMedImage: '',
      currentItem: null,

      // ========== 更新 Dialog ==========
      formDialogVisible: false,
      submitLoading: false,

      // 表单数据 - 只存用户ID和医生ID
      formData: {
        userId: '',
        docId: ''
      },

      // 已选药品列表（每个药品带医生建议）
      selectedMedList: [],

      // 医生建议快捷短语
      docAdviceOptions: [
        { label: '用药3-7天，症状未缓解，请咨询医生。', value: '用药3-7天，症状未缓解，请咨询医生。' },
        { label: '饭后服用，减少胃肠道刺激。', value: '饭后服用，减少胃肠道刺激。' },
        { label: '饭前服用，有利于吸收。', value: '饭前服用，有利于吸收。' },
        { label: '服药期间禁酒，避免驾驶。', value: '服药期间禁酒，避免驾驶。' },
        { label: '孕妇及哺乳期妇女慎用。', value: '孕妇及哺乳期妇女慎用。' },
        { label: '儿童用药请遵医嘱。', value: '儿童用药请遵医嘱。' },
        { label: '肝肾功能不全者慎用。', value: '肝肾功能不全者慎用。' },
        { label: '请勿与同类药物同时服用。', value: '请勿与同类药物同时服用。' },
        { label: '如出现皮疹、瘙痒等过敏反应，请立即停药。', value: '如出现皮疹、瘙痒等过敏反应，请立即停药。' },
      ],

      // ========== Dialog 右侧药品列表 ==========
      dialogAllMedList: [],
      filteredDialogMedList: [],
      dialogMedKeyword: '',

      defaultImage: 'https://via.placeholder.com/100x80?text=No+Image'
    }
  },

  computed: {
    ...mapGetters(['userId', 'username', 'role'])
  },

  mounted() {
    // ✅ 接收路由参数
    const { userId, username } = this.$route.query
    if (userId) {
      this.queryMed.userId = userId
      this.selectedUserId = userId
      this.$message.info(`正在查看患者「${username || userId}」的药品`)
      // 自动选中用户
      this.$nextTick(() => {
        if (this.$refs.userSelector) {
          this.$refs.userSelector.setSelectedUserId(userId)
        }
      })
    } else if (this.userId) {
      this.queryMed.userId = this.userId
    }
    this.getUserMedData()
  },

  methods: {
    // ========== UserSelector 事件 ==========
    onUserChange(user) {
      this.selectedUser = user
      this.selectedUserId = user ? user.userId : ''
      this.queryMed.userId = this.selectedUserId
      this.getUserMedData()
    },

    // ========== 查询药品（联查 user_medicine） ==========
    async getUserMedData() {
      try {
        const params = {
          medName: this.queryMed.medName || '',
          userId: this.selectedUserId || '',
          current: this.queryMed.current || 1,
          size: this.queryMed.size || 100
        }
        const response = await request.post('/userMedicine/getUserMed', params)
        this.queriedMedData = response.records || []
        this.queryMed.total = response.total || 0
      } catch (error) {
        console.error('查询失败:', error)
        this.$message.error('查询失败，请稍后重试')
      }
    },

    // ========== 加载 Dialog 药品列表 ==========
    async loadDialogMedList() {
      try {
        const params = {
          medName: '',
          current: 1,
          size: 100
        }
        const response = await request.post('/medicine/getMed', params)
        this.dialogAllMedList = response.records || []
        this.filteredDialogMedList = [...this.dialogAllMedList]
      } catch (err) {
        console.error('加载药品列表失败:', err)
        this.$message.error('加载药品列表失败')
      }
    },

    // ========== 过滤药品列表 ==========
    filterDialogMedList() {
      const keyword = this.dialogMedKeyword.trim().toLowerCase()
      if (!keyword) {
        this.filteredDialogMedList = [...this.dialogAllMedList]
        return
      }
      this.filteredDialogMedList = this.dialogAllMedList.filter(item =>
          item.medName && item.medName.toLowerCase().includes(keyword)
      )
    },

    // ========== 判断药品是否已选 ==========
    isMedSelected(medId) {
      return this.selectedMedList.some(m => m.medId === medId)
    },

    // ========== 切换选择药品（多选） ==========
    toggleSelectMed(item) {
      const index = this.selectedMedList.findIndex(m => m.medId === item.medId)
      if (index !== -1) {
        this.selectedMedList.splice(index, 1)
      } else {
        this.selectedMedList.push({
          relId: '',
          medId: item.medId,
          medName: item.medName,
          medPic: item.medPic,
          medSpecification: item.medSpecification,
          medCategory: item.medCategory,
          medUsage: item.medUsage,
          medDosage: item.medDosage,
          medFunction: item.medFunction,
          medContraindication: item.medContraindication,
          docAdvice: ''
        })
      }
    },

    // ========== 移除已选药品（按索引） ==========
    removeSelectedMed(index) {
      this.selectedMedList.splice(index, 1)
    },

    // ========== 清空全部已选 ==========
    clearAllSelected() {
      this.selectedMedList = []
    },

    // ========== 打开更新 Dialog ==========
    async openUpdateDialog() {
      if (!this.selectedUser) {
        this.$message.warning('请先在右侧选择一个用户')
        return
      }
      this.resetForm()
      this.formData.userId = this.selectedUser.userId

      try {
        const params = {
          medName: '',
          userId: this.selectedUser.userId || '',
          current: 1,
          size: 100
        }
        const response = await request.post('/userMedicine/getUserMed', params)
        const records = response.records || []
        this.selectedMedList = records.map(m => ({
          relId: m.relId || '',
          medId: m.medId,
          medName: m.medName,
          medPic: m.medPic,
          medSpecification: m.medSpecification,
          medCategory: m.medCategory,
          medUsage: m.medUsage,
          medDosage: m.medDosage,
          medFunction: m.medFunction,
          medContraindication: m.medContraindication,
          docAdvice: m.docAdvice || ''
        }))
        // 删除 originalRelIds 赋值
      } catch (err) {
        console.error('加载用户关联药品失败:', err)
        this.selectedMedList = []
      }

      this.loadDialogMedList()
      this.formDialogVisible = true
    },

    // ========== 插入快捷短语 ==========
    insertSuggestion(index, text) {
      const current = this.selectedMedList[index].docAdvice || ''
      if (!current) {
        this.selectedMedList[index].docAdvice = text
      } else {
        this.selectedMedList[index].docAdvice = current + '\n' + text
      }
    },

    // ========== 预览 ==========
    openPreview(item) {
      this.previewMedImage = item.medPic
      this.currentItem = item
      this.previewVisible = true
    },

    // ========== 保存更新 ==========
    saveUserMedicine() {
      if (this.selectedMedList.length === 0) {
        this.$message.warning('请至少选择一个药品')
        return
      }

      this.submitLoading = true

      const medIds = this.selectedMedList.map(m => m.medId)
      const docAdvice = this.selectedMedList[0].docAdvice || ''

      const promises = []

      // 1. 删除该用户所有关联药品（按 userId）
      promises.push(request.post('/userMedicine/deleteBatch', this.formData.userId))

      // 2. 批量新增当前选中的
      promises.push(request.post('/userMedicine/saveBatch', {
        userId: this.formData.userId,
        docId: this.userId,
        docAdvice: docAdvice,
        medIds: medIds
      }))

      Promise.all(promises)
          .then(() => {
            this.$message.success('更新成功')
            this.formDialogVisible = false
            this.resetForm()
            this.getUserMedData()
          })
          .catch(err => {
            console.error('更新失败:', err)
            this.$message.error(err.response?.data?.message || '更新失败，请稍后重试')
          })
          .finally(() => {
            this.submitLoading = false
          })
    },

    // ========== 清空表单 ==========
    resetForm() {
      this.formData = {
        userId: this.selectedUser ? this.selectedUser.userId : '',
        docId: ''
      }
      this.selectedMedList = []
      this.dialogMedKeyword = ''
      this.$nextTick(() => {
        if (this.$refs.medicineForm) {
          this.$refs.medicineForm.clearValidate()
        }
      })
    },

    // ========== 工具函数 ==========
    getContraindicationList(contraindication) {
      if (!contraindication) return []
      return contraindication.split('|').filter(item => item.trim() !== '')
    },

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
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}

.main-wrapper {
  display: flex;
  gap: 20px;
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

.add-btn {
  margin: 0;
}

.current-user {
  margin: 10px 0 20px 20px;
}

/* ========== 药品列表 ========== */
.medicine-container {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 10px 10px;
}

.medicine-box {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 320px;
  min-height: 120px;
  padding: 12px 16px;
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

.medicine-image-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 100px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
}

.medicine-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.category-tag {
  position: absolute;
  top: -8px;
  right: 12px;
  font-size: 12px !important;
  padding: 2px 12px;
  line-height: 24px;
  height: 28px;
  border-radius: 14px 14px 14px 4px;
  opacity: 0.95;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  font-weight: 500;
}

.medicine-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.medicine-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.medicine-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.usage-tag {
  font-size: 11px;
  padding: 0 8px;
  line-height: 20px;
  border-radius: 4px;
}

.medicine-dosage {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 0 10px;
  line-height: 22px;
  border-radius: 4px;
  white-space: nowrap;
}

.medicine-doc-advice {
  font-size: 12px;
  color: #409eff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  width: 100%;
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
}

.empty-state p {
  margin: 16px 0;
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
  flex-direction: column;
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

/* ========== Dialog 左右两栏布局 ========== */
.dialog-body-wrapper {
  display: flex;
  gap: 24px;
  height: 500px;
}

.dialog-left {
  flex: 2;              /* 左边占2份 */
  overflow-y: auto;
  padding-right: 20px;
  border-right: 1px solid #ebeef5;
}

.dialog-right {
  flex: 1;              /* 右边占1份 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dialog-medicine-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex-shrink: 0;
}

.dialog-medicine-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

/* ===== 对话框中的药品卡片 ===== */
.dialog-medicine-box {
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  cursor: pointer;
  gap: 14px;
}

.dialog-medicine-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #409eff;
}

.dialog-medicine-box.selected {
  border-color: #409eff;
  background: #ecf5ff;
}

/* ===== 用药禁忌 ===== */
.selected-med-contraindication {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.contraindication-label {
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.contraindication-tag-mini {
  font-size: 10px !important;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
  border-radius: 4px;
}

.no-contraindication {
  font-size: 12px;
  color: #c0c4cc;
}

/* ===== 左侧已选药品卡片（与右侧一致） ===== */
.selected-med-box {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  gap: 12px;
}

.selected-med-box:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-color: #c0c4cc;
}

.selected-category-tag {
  position: absolute;
  top: -6px;
  right: 44px;
  font-size: 10px !important;
  padding: 0 10px;
  line-height: 20px;
  height: 22px;
  border-radius: 11px 11px 11px 4px;
  opacity: 0.9;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.selected-med-image-wrapper {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
}

.selected-med-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.selected-med-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.selected-med-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-med-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-usage-tag {
  font-size: 10px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 4px;
}

.selected-med-dosage {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 0 8px;
  line-height: 20px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 删除按钮 */
.selected-med-action {
  flex-shrink: 0;
}

.selected-med-action .el-button {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 14px;
}

/* 医生建议输入框（占满整行） */
.selected-med-advice {
  flex: 0 0 100%;
  width: 100%;
  margin-top: 4px;
}

.selected-med-advice .el-textarea__inner {
  border-radius: 6px;
  font-size: 13px;
}

/* 列表容器 */
.selected-med-list {
  max-height: 400px;
  overflow-y: auto;
  padding-right: 4px;
}

.selected-med-list::-webkit-scrollbar {
  width: 4px;
}

.selected-med-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 4px;
}

.selected-med-list::-webkit-scrollbar-track {
  background: transparent;
}

.selected-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

.empty-selected {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.empty-selected i {
  font-size: 36px;
}

.empty-selected p {
  margin: 12px 0 0;
}

.dialog-category-tag {
  position: absolute;
  top: -6px;
  right: 44px;
  font-size: 10px !important;
  padding: 0 10px;
  line-height: 20px;
  height: 22px;
  border-radius: 11px 11px 11px 4px;
  opacity: 0.9;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  font-weight: 500;
}

.dialog-medicine-image-wrapper {
  flex-shrink: 0;
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
}

.dialog-medicine-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.dialog-medicine-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.dialog-medicine-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dialog-medicine-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.dialog-usage-tag {
  font-size: 10px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 4px;
}

.dialog-medicine-dosage {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 0 8px;
  line-height: 20px;
  border-radius: 4px;
  white-space: nowrap;
}

/* 右上角操作按钮 */
.dialog-medicine-action {
  flex-shrink: 0;
  margin-left: 4px;
}

.dialog-medicine-action .el-button {
  width: 28px;
  height: 28px;
  padding: 0;
  font-size: 14px;
}

.dialog-empty-state {
  width: 100%;
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.dialog-empty-state i {
  font-size: 36px;
}

.dialog-empty-state p {
  margin: 12px 0 0;
}

/* Dialog 表单项调整 */
.dialog-left .formItem {
  margin: 16px 0;
  font-weight: bold;
}

.dialog-left .input {
  margin: 0;
  width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* ===== 快捷短语 ===== */
.suggestion-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  transition: background-color 0.2s;
}

.suggestion-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
}

.suggestion-item:last-child {
  border-bottom: none;
}

@media (max-width: 768px) {
  .dialog-body-wrapper {
    flex-direction: column;
    height: auto;
  }

  .dialog-left {
    flex: none;
    border-right: none;
    padding-right: 0;
    border-bottom: 1px solid #ebeef5;
    padding-bottom: 16px;
  }

  .dialog-right {
    height: 300px;
  }

  .main-wrapper {
    flex-direction: column;
  }

  .user-sidebar {
    width: 100%;
    min-width: unset;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>