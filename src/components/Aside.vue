<template>
  <div class="menu-container">
    <div class="logo">
      <h2>🔬 检验系统</h2>
    </div>

    <el-menu
        background-color="rgb(48, 65, 86)"
        text-color="#fff"
        class="menu"
        default-active="/user"
        router
    >
      <el-submenu index="1">
        <template slot="title">
          <i class="el-icon-s-custom"></i>
          <span>用户</span>
        </template>
        <el-menu-item index="/user">
          <i class="el-icon-user-solid"></i>
          <span slot="title" style="color: #fff">用户信息</span>
        </el-menu-item>
        <el-menu-item index="/addUser">
          <i class="el-icon-user"></i>
          <span slot="title" style="color: #fff">添加用户</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="2">
        <template slot="title">
          <i class="el-icon-data-analysis"></i>
          <span>抽血</span>
        </template>
        <el-menu-item index="/bloodTestResult">
          <i class="el-icon-document-copy"></i>
          <span slot="title" style="color: #fff">抽血结果</span>
        </el-menu-item>
        <el-menu-item index="/bloodTestProject">
          <i class="el-icon-document"></i>
          <span slot="title" style="color: #fff">抽血项目</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="3">
        <template slot="title">
          <i class="el-icon-hot-water"></i>
          <span>药物</span>
        </template>
        <el-menu-item index="/addMedicine">
          <i class="el-icon-document-add"></i>
          <span slot="title" style="color: #fff">添加药物</span>
        </el-menu-item>
        <el-menu-item index="/medicine">
          <i class="el-icon-water-cup"></i>
          <span slot="title" style="color: #fff">药物列表</span>
        </el-menu-item>
      </el-submenu>

      <el-menu-item index="/test">
        <i class="el-icon-document"></i>
        <span slot="title" style="color: #fff">测试</span>
      </el-menu-item>

      <!-- 退出登录 -->
      <div class="logout-section">
        <el-menu-item index="/login" @click="handleLogout">
          <i class="el-icon-switch-button"></i>
          <span slot="title" style="color: #fff">退出登录</span>
        </el-menu-item>
      </div>
    </el-menu>
  </div>
</template>

<script>
import {mapGetters, mapActions} from 'vuex'

export default {
  name: 'Menu',
  computed: {
    ...mapGetters(['username'])
  },
  methods: {
    ...mapActions(['logout']),

    handleLogout() {
      this.$confirm('确认退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 清除登录状态
        this.logout()
        // 跳转到登录页
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(() => {
      })
    }
  }
}
</script>

<style scoped>
.menu-container {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  overflow-x: hidden;
  transition: width 0.3s;
  width: 190px;
  display: flex;
  flex-direction: column;
  background-color: rgb(48, 65, 86);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.logo h2 {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
}

.menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  min-height: calc(100vh - 60px);
}

.logout-section {
  position: sticky;
  bottom: 0;
  background-color: rgb(48, 65, 86);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.logout-section .el-menu-item {
  color: #bfcbd9;
}

.logout-section .el-menu-item:hover {
  color: #409EFF;
}

.el-menu {
  border-right: none;
}

.el-menu-item {
  height: 50px;
  line-height: 50px;
}

/* 滚动条样式 */
.menu::-webkit-scrollbar {
  width: 4px;
}

.menu::-webkit-scrollbar-track {
  background: transparent;
}

.menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>