<template>
  <div class="menu-container">
    <el-menu
      background-color='rgb(48, 65, 86)'
      text-color="#fff"
      class="menu"
      default-active="/user"
      router>

      <el-submenu index="1">
        <template slot="title">
          <i class="el-icon-s-custom"></i>
          <span>用户</span>
        </template>
        <el-menu-item index="/user"><i class="el-icon-user-solid"></i><span slot="title" style="color: #fff">用户信息</span>
        </el-menu-item>
        <el-menu-item index="/addUser"><i class="el-icon-user"></i><span slot="title"
                                                                         style="color: #fff">添加用户</span>
        </el-menu-item>
      </el-submenu>



      <el-submenu index="2">
        <template slot="title">
          <i class="el-icon-data-analysis"></i>
          <span>抽血</span>
        </template>

        <el-menu-item index="/bloodTestResult"><i class="el-icon-document-copy"></i><span slot="title"
                                                                                      style="color: #fff">抽血结果</span>
        </el-menu-item>

        <el-menu-item index="/bloodTestProject"><i class="el-icon-document"></i><span slot="title"
                                                                                 style="color: #fff">抽血项目</span>
        </el-menu-item>
      </el-submenu>

      <el-submenu index="3">
        <template slot="title">
          <i class="el-icon-hot-water"></i>
          <span>药物</span>
        </template>

        <el-menu-item index="/addMedicine"><i class="el-icon-document-add"></i><span slot="title"
                                                                                 style="color: #fff">添加药物</span>
        </el-menu-item>
        <el-menu-item index="/medicine"><i class="el-icon-water-cup"></i><span slot="title"
                                                                                 style="color: #fff">药物列表</span>
        </el-menu-item>
      </el-submenu>

      <el-menu-item index="/test"><i class="el-icon-document"></i><span slot="title"
                                                                              style="color: #fff">测试</span>
      </el-menu-item>

<!--      <el-menu-item index="/uploadTest"><i class="el-icon-document"></i><span slot="title"-->
<!--                                                                              style="color: #fff">上传测试</span>-->
<!--      </el-menu-item>-->


    </el-menu>
  </div>
</template>

<script>


export default {}
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
}

.menu {
  min-height: 100vh; /* 设置菜单栏的最小高度为视口高度 */
}

</style>
