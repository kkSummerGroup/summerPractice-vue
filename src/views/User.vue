<template>
  <div class="profile-container">
    <!-- ========== 个人信息卡片 ========== -->
    <el-card class="profile-card">
      <div slot="header" class="profile-header">
        <span class="title">个人信息</span>
        <el-button type="primary" size="small" @click="openEditDialog">编辑信息</el-button>
      </div>

      <div class="profile-content">
        <div class="avatar-section">
          <img :src="userInfo.headPortrait || defaultAvatar" alt="头像" class="avatar" />
        </div>
        <div class="info-section">
          <div class="info-item">
            <span class="label">账号：</span>
            <span class="value">{{ userInfo.userId }}</span>
          </div>
          <div class="info-item">
            <span class="label">用户名：</span>
            <span class="value">{{ userInfo.username }}</span>
          </div>
          <div class="info-item">
            <span class="label">密码：</span>
            <span class="value">******</span>
          </div>
          <div class="info-item">
            <span class="label">角色：</span>
            <span class="value">{{ userInfo.role === 1 ? '医生' : '患者' }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- ========== 编辑弹窗 ========== -->
    <el-dialog
        title="编辑个人信息"
        :visible.sync="editDialogVisible"
        width="500px"
        :close-on-click-modal="false"
        @closed="resetEditForm"
    >
      <el-form :model="editForm" :rules="editRules" ref="editFormRef" label-width="80px">
        <!-- 头像上传 -->
        <el-form-item label="头像" style="display: flex; justify-content: center;">
          <el-upload
              ref="uploadRef"
              action="#"
              :file-list="editFileList"
              list-type="picture-card"
              :on-change="handleAvatarChange"
              :auto-upload="false"
              :limit="1"
          >
            <i class="el-icon-plus" />
            <div slot="file" slot-scope="{ file }">
              <img class="el-upload-list__item-thumbnail" :src="file.url" alt="" />
              <span class="el-upload-list__item-actions">
                <span class="el-upload-list__item-delete" @click="handleRemoveAvatar">
                  <i class="el-icon-delete" />
                </span>
              </span>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 账号（不可修改） -->
        <el-form-item label="账号">
          <el-input v-model="editForm.userId" disabled />
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input v-model="editForm.password" type="password" placeholder="不修改则留空" show-password />
          （不修改则留空）
        </el-form-item>


        <!-- 确认密码（只有密码有值时显示） -->
        <el-form-item v-if="editForm.password" label="确认密码" prop="confirmPassword">
          <el-input v-model="editForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>

        <!-- 角色：编辑时不显示 -->
      </el-form>

      <span slot="footer">
        <el-button @click="editDialogVisible = false">取 消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="saveUserInfo">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import request from '@/api'

export default {
  name: 'Profile',
  data() {
    const validateConfirmPassword = (rule, value, callback) => {
      if (this.editForm.password) {
        if (!value) {
          callback(new Error('请再次输入密码'))
        } else if (value !== this.editForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }

    return {
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',

      userInfo: {
        userId: '',
        username: '',
        headPortrait: '',
        role: 0
      },

      editDialogVisible: false,
      saveLoading: false,

      editForm: {
        userId: '',
        username: '',
        headPortrait: '',
        password: '',
        confirmPassword: ''
      },

      editFileList: [],

      editRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 2, max: 12, message: '用户名长度为2-12位', trigger: 'blur' }
        ],
        password: [
          { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
        ],
        confirmPassword: [
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    ...mapGetters(['userId', 'username', 'role'])
  },
  created() {
    this.loadUserInfo()
  },
  methods: {
    ...mapActions(['logout']),

    loadUserInfo() {
      this.userInfo = {
        userId: this.userId,
        username: this.username,
        headPortrait: this.$store.state.userInfo?.headPortrait || '',
        role: this.role
      }
    },

    openEditDialog() {
      this.editForm = {
        userId: this.userInfo.userId,
        username: this.userInfo.username,
        headPortrait: this.userInfo.headPortrait || '',
        password: '',
        confirmPassword: ''
      }

      if (this.userInfo.headPortrait) {
        this.editFileList = [{ name: '头像', url: this.userInfo.headPortrait }]
      } else {
        this.editFileList = []
      }

      this.editDialogVisible = true
      this.$nextTick(() => {
        this.$refs.editFormRef?.clearValidate()
        const uploadEl = this.$refs.uploadRef?.$el
        if (uploadEl) {
          const addBtn = uploadEl.querySelector('.el-upload--picture-card')
          if (addBtn) {
            addBtn.style.display = this.editFileList.length > 0 ? 'none' : 'block'
          }
        }
      })
    },

    resetEditForm() {
      this.editDialogVisible = false
      this.editForm = { userId: '', username: '', headPortrait: '', password: '', confirmPassword: '' }
      this.editFileList = []
      this.saveLoading = false
      this.$refs.editFormRef?.clearValidate()
    },

    handleAvatarChange(file) {
      this.getBase64(file.raw).then(base64 => {
        this.editForm.headPortrait = base64
        this.editFileList = [{ name: '头像', url: base64 }]
        this.$nextTick(() => {
          const uploadEl = this.$refs.uploadRef?.$el
          if (uploadEl) {
            const addBtn = uploadEl.querySelector('.el-upload--picture-card')
            if (addBtn) addBtn.style.display = 'none'
          }
        })
      })
    },

    handleRemoveAvatar() {
      this.editForm.headPortrait = ''
      this.editFileList = []
      this.$nextTick(() => {
        const uploadEl = this.$refs.uploadRef?.$el
        if (uploadEl) {
          const addBtn = uploadEl.querySelector('.el-upload--picture-card')
          if (addBtn) addBtn.style.display = 'block'
        }
      })
    },

    getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = reject
      })
    },

    async saveUserInfo() {
      try {
        const valid = await this.$refs.editFormRef.validate()
        if (!valid) return
      } catch {
        return
      }

      this.saveLoading = true
      try {
        const saveData = {
          headPortrait: this.editForm.headPortrait,
          userId: this.editForm.userId,
          username: this.editForm.username,
          role: this.role
        }
        // 只有密码有值时才传密码
        if (this.editForm.password) {
          saveData.password = this.editForm.password
        }

        // ✅ 使用 request
        await request.post('/user/saveUser', saveData)

        // 更新 Vuex
        this.$store.commit('SET_USER_INFO', {
          userId: this.editForm.userId,
          username: this.editForm.username,
          headPortrait: this.editForm.headPortrait,
          role: this.role
        })

        this.userInfo = {
          userId: this.editForm.userId,
          username: this.editForm.username,
          headPortrait: this.editForm.headPortrait,
          role: this.role
        }

        this.$message.success('保存成功')
        this.editDialogVisible = false
        this.resetEditForm()
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败，请重试')
      } finally {
        this.saveLoading = false
      }
    }
  }
}
</script>

<style scoped>
.profile-container {
  margin: 40px auto;
  max-width: 600px;
}

.profile-card {
  border-radius: 12px;
}

.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-header .title {
  font-size: 18px;
  font-weight: bold;
}

.profile-content {
  display: flex;
  align-items: center;
  padding: 20px 0;
}

.avatar-section {
  margin-right: 40px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #409eff;
}

.info-section {
  flex: 1;
}

.info-item {
  padding: 8px 0;
  font-size: 16px;
}

.info-item .label {
  color: #909399;
  font-weight: 500;
}

.info-item .value {
  color: #303133;
}

.el-upload--picture-card {
  width: 100px;
  height: 100px;
  line-height: 100px;
}
</style>