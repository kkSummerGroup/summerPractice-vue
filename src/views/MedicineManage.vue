<template>
  <div class="container">
    <div class="main-wrapper">
      <div class="main-content">
        <!-- 操作按钮 -->
        <div class="search-bar">
          <el-input
              v-model="queryMed.medName"
              placeholder="请输入药品名称搜索"
              size="medium"
              clearable
              class="search-input"
              @keyup.enter.native="getMedData"
          >
            <el-button
                slot="append"
                type="primary"
                icon="el-icon-search"
                @click="getMedData"
            >查询</el-button>
          </el-input>
          <el-button class="add-btn" type="primary" @click="openAddDialog">添加药品</el-button>
        </div>
        <el-divider></el-divider>
        <el-divider></el-divider>

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
            </div>
          </div>
        </div>

        <!-- 右键菜单 -->
        <div
            v-show="contextMenuVisible"
            class="context-menu"
            :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
            @click.stop
        >
          <div class="context-menu-item" @click="openEditDialog(currentRightClickItem)">
            <i class="el-icon-edit"></i> 编辑
          </div>
          <div class="context-menu-item context-menu-item-danger" @click="handleDelete(currentRightClickItem)">
            <i class="el-icon-delete"></i> 删除
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
              >
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

        <!-- ========== 新增/编辑 共用 Dialog ========== -->
        <el-dialog
            :title="dialogTitle"
            :visible.sync="formDialogVisible"
            width="60%"
            :close-on-click-modal="false"
            @close="resetMedicine"
        >
          <el-form :model="formData" :rules="formRules" ref="medicineForm" :hide-required-asterisk="true">
            <!-- 药品名称 -->
            <el-row>
              <el-form-item class="formItem" label="药品名称：" prop="medName">
                <el-input class="input" v-model="formData.medName"></el-input>
              </el-form-item>
            </el-row>

            <!-- 药品功能 -->
            <el-row>
              <el-form-item class="formItem" label="药品功能：" prop="medFunction">
                <el-input class="input" v-model="formData.medFunction" type="textarea" :rows="4" placeholder="如：用于治疗......"></el-input>
              </el-form-item>
            </el-row>

            <!-- 药品规格 -->
            <el-row>
              <el-form-item class="formItem" label="药品规格：" prop="medSpecification">
                <el-input class="input" v-model="formData.medSpecification" placeholder="如：0.5g*20片/盒"></el-input>
              </el-form-item>
            </el-row>

            <!-- 药品类型 -->
            <el-row>
              <el-form-item class="formItem" label="药品类型：" prop="medCategory">
                <el-select
                    class="input"
                    v-model="formData.medCategory"
                    clearable
                    placeholder="请选择药品类型"
                >
                  <el-option label="处方药" value="处方药" />
                  <el-option label="非处方药" value="非处方药" />
                  <el-option label="中成药" value="中成药" />
                </el-select>
              </el-form-item>
            </el-row>

            <!-- 使用分类 -->
            <el-row>
              <el-form-item class="formItem" label="使用分类：" prop="medUsage">
                <el-select
                    class="input"
                    v-model="formData.medUsage"
                    clearable
                    placeholder="请选择使用方式"
                >
                  <el-option label="口服" value="口服" />
                  <el-option label="外用" value="外用" />
                  <el-option label="注射" value="注射" />
                  <el-option label="吸入" value="吸入" />
                  <el-option label="含服" value="含服" />
                  <el-option label="滴眼/滴鼻" value="滴眼/滴鼻" />
                  <el-option label="其他" value="其他" />
                </el-select>
              </el-form-item>
            </el-row>

            <!-- 用法用量 -->
            <el-row>
              <el-form-item class="formItem" label="用法用量：" prop="medDosage">
                <el-input class="input" v-model="formData.medDosage" placeholder="如：一次1粒，一日2次"></el-input>
              </el-form-item>
            </el-row>

            <!-- 用药禁忌（动态添加） -->
            <el-row>
              <el-form-item class="formItem" label="用药禁忌：" prop="medContraindication">
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  <div
                      v-for="(item, index) in contraindicationList"
                      :key="index"
                      style="display: flex; align-items: center; gap: 10px;"
                  >
                    <el-input
                        v-model="contraindicationList[index]"
                        placeholder="请输入用药禁忌"
                        style="width: 300px;"
                    ></el-input>

                    <el-button
                        v-if="contraindicationList.length > 1"
                        type="danger"
                        size="small"
                        icon="el-icon-minus"
                        circle
                        @click="removeContraindication(index)"
                    ></el-button>

                    <el-button
                        v-if="index === contraindicationList.length - 1"
                        type="success"
                        size="small"
                        icon="el-icon-plus"
                        circle
                        @click="addContraindication"
                    ></el-button>
                  </div>
                </div>
              </el-form-item>
            </el-row>

            <!-- 药品图片 -->
            <el-form-item style="margin: 30px 25%;display: flex;justify-content: center;align-items: center">
              <el-upload
                  ref="upload1"
                  action="#"
                  :file-list="medPicList"
                  list-type="picture-card"
                  :on-change="uploadOnChange"
                  :on-remove="handleRemoveMedPic"
                  :auto-upload="false"
                  :limit="1"
                  :class="{ 'hide-upload-btn': formData.medPic }"
              >
                <i class="el-icon-plus"></i>
                <div slot="tip" class="el-upload__tip">请上传药品图片</div>

                <div slot="file" slot-scope="{file}">
                  <img class="el-upload-list__item-thumbnail" :src="file.url" alt="">
                  <span class="el-upload-list__item-actions">
                    <span class="el-upload-list__item-preview" @click="handlePictureCardPreview(file)">
                      <i class="el-icon-zoom-in"></i>
                    </span>
                    <span class="el-upload-list__item-delete" @click="handleRemoveMedPic(file)">
                      <i class="el-icon-delete"></i>
                    </span>
                  </span>
                </div>
              </el-upload>
            </el-form-item>
          </el-form>

          <span slot="footer" class="dialog-footer">
            <el-button @click="formDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="saveMedicine" :loading="submitLoading">
              {{ isEdit ? '更新' : '添加' }}
            </el-button>
          </span>
        </el-dialog>

        <!-- 图片预览 Dialog -->
        <el-dialog :visible.sync="dialogVisible" width="30%">
          <img width="100%" :src="dialogImageUrl" alt="">
        </el-dialog>
      </div>
    </div>
  </div>
</template>

<script>
import request from "@/api"

export default {
  name: "MedicineManage",
  data() {
    return {
      // 查询对象
      queryMed: {
        medName: '',
        current: 1,
        size: 100,
        total: 0
      },

      queriedMedData: [],

      // 预览
      previewVisible: false,
      previewMedImage: '',
      currentItem: null,

      // ========== 新增/编辑 共用 ==========
      formDialogVisible: false,
      isEdit: false,           // true=编辑，false=新增
      dialogTitle: '添加药品',
      submitLoading: false,

      // 表单数据
      formData: {
        medId: '',
        medName: '',
        medFunction: '',
        medSpecification: '',
        medCategory: '',
        medUsage: '',
        medDosage: '',
        medContraindication: '',
        medPic: ''
      },

      // 用药禁忌动态列表
      contraindicationList: [''],

      // ========== 右键菜单 ==========
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      currentRightClickItem: null,

      // 图片相关
      medPicList: [],
      dialogImageUrl: '',
      dialogVisible: false,

      formRules: {
        medName: [
          { required: true, message: '请输入药品名称', trigger: 'blur' }
        ],
        medFunction: [
          { required: true, message: '请输入药品功能', trigger: 'blur' }
        ],
        medCategory: [
          { required: true, message: '请选择药品类型', trigger: 'change' }
        ],
        medUsage: [
          { required: true, message: '请选择使用分类', trigger: 'change' }
        ],
        medDosage: [
          { required: true, message: '请输入用法用量', trigger: 'blur' }
        ]
      }
    }
  },

  mounted() {
    this.getMedData()
    document.addEventListener('click', this.handleContextMenuClose)
  },

  beforeDestroy() {
    document.removeEventListener('click', this.handleContextMenuClose)
  },

  methods: {
    // ========== 打开新增 Dialog ==========
    openAddDialog() {
      this.isEdit = false
      this.dialogTitle = '添加药品'
      this.resetMedicine()
      this.formDialogVisible = true
    },

    // ========== 打开编辑 Dialog（右键菜单触发） ==========
    openEditDialog(item) {
      this.contextMenuVisible = false
      this.isEdit = true
      this.dialogTitle = '编辑药品'

      // 回填数据
      this.formData = {
        medId: item.medId || '',
        medName: item.medName || '',
        medFunction: item.medFunction || '',
        medSpecification: item.medSpecification || '',
        medCategory: item.medCategory || '',
        medUsage: item.medUsage || '',
        medDosage: item.medDosage || '',
        medContraindication: item.medContraindication || '',
        medPic: item.medPic || ''
      }

      // 回填禁忌列表
      if (item.medContraindication) {
        this.contraindicationList = item.medContraindication.split('|').filter(t => t.trim() !== '')
        if (this.contraindicationList.length === 0) {
          this.contraindicationList = ['']
        }
      } else {
        this.contraindicationList = ['']
      }

      // 回填图片
      if (item.medPic) {
        this.medPicList = [{ url: item.medPic, name: '药品图片', uid: Date.now() }]
      } else {
        this.medPicList = []
      }

      this.formDialogVisible = true
      this.$nextTick(() => {
        if (this.$refs.medicineForm) {
          this.$refs.medicineForm.clearValidate()
        }
      })
    },

    // ========== 右键菜单 ==========
    openEditMenu(event, item) {
      this.currentRightClickItem = item
      this.contextMenuX = event.clientX
      this.contextMenuY = event.clientY
      this.contextMenuVisible = true
    },

    handleContextMenuClose() {
      this.contextMenuVisible = false
    },

    // ========== 预览 ==========
    openPreview(item) {
      this.previewMedImage = item.medPic
      this.currentItem = item
      this.previewVisible = true
    },

    // ========== 查询药品 ==========
    async getMedData() {
      try {
        const response = await request.post('/medicine/getMed', this.queryMed)
        this.queriedMedData = response.records || []
        this.queryMed.total = response.total || 0
      } catch (error) {
        console.error('错误:', error)
      }
    },

    // ========== 用药禁忌动态操作 ==========
    addContraindication() {
      const lastItem = this.contraindicationList[this.contraindicationList.length - 1]
      if (!lastItem || lastItem.trim() === '') {
        this.$message.warning('请先填写当前禁忌项')
        return
      }
      this.contraindicationList.push('')
    },

    removeContraindication(index) {
      if (this.contraindicationList.length <= 1) return
      this.contraindicationList.splice(index, 1)
    },

    // ========== 上传图片 ==========
    async uploadOnChange(file) {
      if (file.size > 2 * 1024 * 1024) {
        this.$message.error('图片大小不能超过 2MB')
        this.medPicList = []
        this.$refs.upload1.clearFiles()
        return
      }
      this.formData.medPic = await this.getBase64(file.raw)
      // 同步 fileList
      this.medPicList = [{ url: this.formData.medPic, name: file.name, uid: file.uid }]
    },

    handleRemoveMedPic() {
      this.medPicList = []
      this.formData.medPic = ''
      this.dialogImageUrl = ''
      if (this.$refs.upload1) {
        this.$refs.upload1.clearFiles()
      }
    },

    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url
      this.dialogVisible = true
    },

    // ========== 保存药品（新增/编辑通用） ==========
    saveMedicine() {
      console.log('提交的 formData:', this.formData)  // 👈 加这行
      console.log('medId 是否有值:', this.formData.medId)
      this.$refs.medicineForm.validate(async (valid) => {
        if (!valid) return

        // 处理用药禁忌
        const validContraindications = this.contraindicationList
            .filter(item => item && item.trim() !== '')
            .map(item => item.trim())
        this.formData.medContraindication = validContraindications.join('|')

        this.submitLoading = true
        try {
          await request.post('/medicine/saveMed', this.formData)
          this.$message.success(this.isEdit ? '药品更新成功' : '药品添加成功')
          this.formDialogVisible = false
          this.resetMedicine()
          this.getMedData()
        } catch (err) {
          console.error('保存失败:', err)
          this.$message.error(err.response?.data?.message || '保存失败，请稍后重试')
        } finally {
          this.submitLoading = false
        }
      })
    },

    // ========== 删除药品 ==========
    handleDelete(item) {
      this.contextMenuVisible = false

      this.$confirm(
          `确定要删除药品「${item.medName}」吗？`,
          '删除确认',
          {
            confirmButtonText: '确定删除',
            cancelButtonText: '取消',
            type: 'warning',
            confirmButtonClass: 'el-button--danger'
          }
      ).then(async () => {
        try {
          // DELETE 请求，路径传参
          await request.delete(`/medicine/deleteMed/${item.medId}`)
          this.$message.success('删除成功')
          this.getMedData()
        } catch (err) {
          console.error('删除失败:', err)
          this.$message.error(err.response?.data?.message || '删除失败，请稍后重试')
        }
      }).catch(() => {
        // 用户取消删除
      })
    },

    // 获取禁忌列表
    getContraindicationList(contraindication) {
      if (!contraindication) return []
      return contraindication.split('|').filter(item => item.trim() !== '')
    },

    // 药品类型标签颜色
    getCategoryTagType(category) {
      const map = {
        '处方药': 'danger',
        '非处方药': 'success',
        '中成药': 'warning'
      }
      return map[category] || 'info'
    },

    // 使用分类标签颜色
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

    // ========== 清空表单 ==========
    resetMedicine() {
      this.formData = {
        medId: '',
        medName: '',
        medFunction: '',
        medSpecification: '',
        medCategory: '',
        medUsage: '',
        medDosage: '',
        medContraindication: '',
        medPic: ''
      }
      this.contraindicationList = ['']
      this.medPicList = []
      this.dialogImageUrl = ''
      if (this.$refs.upload1) {
        this.$refs.upload1.clearFiles()
      }
      this.$nextTick(() => {
        if (this.$refs.medicineForm) {
          this.$refs.medicineForm.clearValidate()
        }
      })
    },

    // ========== 分页 ==========
    handleSizeChange(newSize) {
      this.queryMed.size = newSize
      this.queryMed.current = 1
      this.getMedData()
    },

    handleCurrentChange(newPage) {
      this.queryMed.current = newPage
      this.getMedData()
    },

    // ========== 工具函数 ==========
    getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = (error) => reject(error)
      })
    }
  }
}
</script>


<style scoped>
.container {
  padding: 20px;
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

/* ========== 药品列表 - 横向卡片 ========== */
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
  max-width: 300px;
  height: 120px;
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

/* ---- 图片区（左侧固定） ---- */
.medicine-image-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #f0f0f0;
}

.medicine-image {
  width: 100%;
  height: 100%;
  object-fit: cover;   /* 保证图片完整显示且不变形 */
  display: block;
}

/* 类型标签（图片右上角） */
.category-tag {
  position: absolute;
  top: -8px;                  /* 微微超出卡片边缘 */
  right: 12px;
  font-size: 14px !important;  /* 调整字体大小，用 !important 覆盖 Element UI 默认样式 */
  padding: 2px 14px;
  line-height: 28px;
  height: 32px;               /* 固定高度保证视觉统一 */
  border-radius: 16px 16px 16px 4px;
  opacity: 0.95;
  pointer-events: none;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  font-weight: 500;           /* 加粗一点更清晰 */
}

/* ---- 信息区（右侧自适应） ---- */
.medicine-info {
  flex: 1;
  min-width: 0;          /* 防止文字溢出 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
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

/* 可选：功能描述（短文本） */
.medicine-function {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

/* ========== 响应式：小屏手机 ========== */
@media (max-width: 600px) {
  .medicine-box {
    max-width: 100%;
    height: 100px;
    padding: 10px 12px;
    gap: 12px;
  }

  .medicine-image-wrapper {
    width: 64px;
    height: 64px;
  }

  .medicine-name {
    font-size: 14px;
  }

  .medicine-dosage {
    font-size: 12px;
    padding: 0 6px;
  }

  .category-tag {
    font-size: 9px;
    top: 2px;
    right: 2px;
    padding: 0 4px;
    line-height: 16px;
  }
}

/* ========== 预览弹窗样式 ========== */
.preview-dialog .el-dialog__body {
  padding: 20px 30px 30px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ---- 图片 ---- */
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

/* ---- 药品名称 ---- */
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
  gap: 10px;
}

/* ---- 信息网格 ---- */
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

/* ---- 预览弹窗中的用药禁忌（垂直排列） ---- */
.contraindication-preview-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 2px;
}

.contraindication-preview-item {
  display: flex;
  align-items: center;
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
/* ---- 响应式 ---- */
@media (max-width: 768px) {
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

/* ========== 右键菜单 ========== */
.context-menu {
  position: fixed;
  z-index: 9999;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid #ebeef5;
  min-width: 120px;
  padding: 6px 0;
  user-select: none;
}

.context-menu-item {
  padding: 10px 20px;
  font-size: 14px;
  color: #303133;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s;
}

.context-menu-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.context-menu-item i {
  font-size: 16px;
}

/* 删除项 - 危险样式 */
.context-menu-item-danger {
  color: #f56c6c;
}

.context-menu-item-danger:hover {
  background: #fef0f0;
  color: #f56c6c;
}

/* 分割线（可选） */
.context-menu-divider {
  height: 1px;
  background: #ebeef5;
  margin: 4px 12px;
}


/* ========== Dialog 表单样式 ========== */
.formItem {
  margin: 20px 25%;
  font-weight: bold;
}

.input {
  margin: 0 0 20px 20px;
  width: 280px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
}

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

.el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}

.el-upload-list--picture-card .el-upload-list__item {
  width: 100px;
  height: 100px;
}

.hide-upload-btn ::v-deep .el-upload--picture-card {
  display: none !important;
}

</style>