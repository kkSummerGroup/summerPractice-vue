<template>
  <div class="menu-container">
    <div class="logo">
      <h2>🔬 检验系统</h2>
    </div>

    <el-menu
        background-color="rgb(48, 65, 86)"
        text-color="#fff"
        class="menu"
        default-active=""
        router
    >
      <!-- ===== 根据角色动态渲染数据中心 ===== -->
      <el-menu-item v-if="userRole === 1" index="/doctorDashboard">
        <i class="el-icon-document"></i>
        <span slot="title" style="color: #fff">抽血数据大屏</span>
      </el-menu-item>

      <el-menu-item v-if="userRole === 2" index="/patientDashboard">
        <i class="el-icon-document"></i>
        <span slot="title" style="color: #fff">个人抽血数据大屏</span>
      </el-menu-item>

      <el-menu-item v-if="userRole === 2" index="/user">
        <i class="el-icon-document"></i>
        <span slot="title" style="color: #fff">个人信息</span>
      </el-menu-item>

      <!-- ===== 用户菜单（所有角色可见） ===== -->
      <el-submenu v-if="userRole === 1" index="1">
        <template slot="title">
          <i class="el-icon-s-custom"></i>
          <span>用户</span>
        </template>
        <el-menu-item index="/userView">
          <i class="el-icon-user-solid"></i>
          <span slot="title" style="color: #fff">用户信息</span>
        </el-menu-item>
        <el-menu-item index="/addUser">
          <i class="el-icon-user"></i>
          <span slot="title" style="color: #fff">添加用户</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <i class="el-icon-document"></i>
          <span slot="title" style="color: #fff">个人信息</span>
        </el-menu-item>
      </el-submenu>

      <!-- ===== 抽血菜单 ===== -->
      <el-menu-item v-if="userRole === 2" index="/bloodTestResult">
        <i class="el-icon-document-copy"></i>
        <span slot="title" style="color: #fff">抽血结果</span>
      </el-menu-item>

      <el-submenu v-if="userRole === 1"  index="2">
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

      <!-- ===== 药物菜单===== -->
      <el-menu-item v-if="userRole === 2" index="/medicine">
        <i class="el-icon-water-cup"></i>
        <span slot="title" style="color: #fff">药物列表</span>
      </el-menu-item>

      <el-submenu  v-if="userRole === 1" index="3">
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

      <!-- ===== 测试菜单（仅 role=1 可见） ===== -->
      <el-menu-item v-if="userRole === 1" index="/test">
        <i class="el-icon-document"></i>
        <span slot="title" style="color: #fff">测试</span>
      </el-menu-item>

      <!-- ===== 退出登录 ===== -->
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
    ...mapGetters(['username', 'role']),
    userRole() {
      return this.role || 0
    }
  },
  methods: {
    ...mapActions(['logout']),

    handleLogout() {
      this.$confirm('确认退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.logout()
        this.$router.push('/login')
        this.$message.success('已退出登录')
      }).catch(() => {})
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

.menu {
  flex: 1;
  border-right: none;
  overflow-y: auto;
  min-height: calc(100vh - 60px);
  /* ✅ 隐藏滚动条 - Firefox */
  scrollbar-width: none;
  /* ✅ 隐藏滚动条 - IE/Edge */
  -ms-overflow-style: none;
}

/* ✅ 隐藏滚动条 - Chrome/Safari/Opera */
.menu-container::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.menu-container::-webkit-scrollbar-track {
  background: transparent;
}

.menu-container::-webkit-scrollbar-thumb {
  background: transparent;
}

/* ✅ 隐藏滚动条 - Chrome/Safari/Opera */
.menu::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.menu::-webkit-scrollbar-track {
  background: transparent;
}

.menu::-webkit-scrollbar-thumb {
  background: transparent;
}
</style>