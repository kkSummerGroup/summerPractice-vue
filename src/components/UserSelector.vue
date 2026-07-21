<!-- components/UserSelector.vue -->
<template>
  <div class="user-selector">
    <div class="user-selector-header">
      <span>{{ title }}</span>
      <el-input
          v-model="keyword"
          placeholder="搜索用户"
          size="small"
          clearable
          @input="handleSearch"
          style="margin-top: 10px;"
      />
    </div>
    <div class="user-list">
      <div
          v-for="user in userList"
          :key="user.userId"
          class="user-item"
          :class="{ active: selectedUserId === user.userId }"
          @click="selectUser(user)"
      >
        <img
            :src="user.headPortrait || defaultAvatar"
            alt="头像"
            class="user-avatar"
        />
        <div class="user-info">
          <div class="user-name">{{ user.username }}</div>
          <div class="user-id">{{ user.userId }}</div>
        </div>
      </div>
      <div v-if="userList.length === 0 && !loading" class="empty-text">暂无用户</div>
      <div v-if="loading" class="empty-text">加载中...</div>
    </div>
    <el-pagination
        background
        small
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        :current-page="currentPage"
        @current-change="handlePageChange"
        style="padding: 10px 0; justify-content: center;"
    />
  </div>
</template>

<script>
import request from '@/api'

export default {
  name: 'UserSelector',
  props: {
    title: {
      type: String,
      default: '选择用户'
    },
    value: {
      type: String,
      default: ''
    },
    pageSize: {
      type: Number,
      default: 10
    },
    autoLoad: {
      type: Boolean,
      default: true
    },
    // 是否自动选中第一个用户
    autoSelectFirst: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      userList: [],
      selectedUserId: this.value,
      keyword: '',
      currentPage: 1,
      total: 0,
      loading: false,
      defaultAvatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
    }
  },
  watch: {
    value(newVal) {
      this.selectedUserId = newVal
    }
  },
  mounted() {
    if (this.autoLoad) {
      this.loadUsers()
    }
  },
  methods: {
    // 修改 loadUsers 返回 Promise
    async loadUsers() {
      this.loading = true
      try {
        const params = {
          userId: this.keyword,
          username: this.keyword,
          role: 2,
          current: this.currentPage,
          size: this.pageSize
        }
        const res = await request.post('/user/getUser', params)
        this.userList = res.records || []
        this.total = res.total || 0

        // 如果有选中的 userId，高亮对应的用户
        if (this.selectedUserId) {
          const found = this.userList.find(u => u.userId === this.selectedUserId)
          if (!found && this.userList.length > 0) {
            // 如果当前页没有找到，可能需要翻页查找，这里简单处理
            // 可以尝试搜索该用户
            this.keyword = this.selectedUserId
            await this.loadUsers()
          }
        }

        if (this.autoSelectFirst && this.userList.length > 0 && !this.selectedUserId) {
          this.selectUser(this.userList[0])
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
      } finally {
        this.loading = false
      }
    },

    handleSearch() {
      this.currentPage = 1
      this.loadUsers()
    },

    handlePageChange(page) {
      this.currentPage = page
      this.loadUsers()
    },

    selectUser(user) {
      if (this.selectedUserId === user.userId) {
        this.selectedUserId = ''
        this.$emit('input', '')
        this.$emit('change', null)
        return
      }
      this.selectedUserId = user.userId
      this.$emit('input', user.userId)
      this.$emit('change', user)
    },

    setSelectedUserId(userId) {
      this.selectedUserId = userId
      // 先加载用户列表，确保数据存在
      this.loadUsers().then(() => {
        // 加载完成后，触发选中逻辑
        const user = this.userList.find(u => u.userId === userId)
        if (user) {
          this.$emit('change', user)
        }
      })
    },

    // ========== 暴露给父组件的方法 ==========
    refresh() {
      this.loadUsers()
    },

    clear() {
      this.selectedUserId = ''
      this.$emit('input', '')
      this.$emit('change', null)
    },

    getSelectedUser() {
      return this.userList.find(u => u.userId === this.selectedUserId) || null
    },

    // 获取第一个用户
    getFirstUser() {
      return this.userList.length > 0 ? this.userList[0] : null
    }
  }
}
</script>

<style scoped>
.user-selector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.user-selector-header {
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
</style>