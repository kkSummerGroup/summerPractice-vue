<template>
  <el-container style="height: 100%;">
    <el-aside style="width: 190px;height: 100vh;background-color: rgb(48, 65, 86);z-index: 2;">
      <Aside></Aside>
    </el-aside>
    <el-main style="width: 100%;">
      <router-view/>
    </el-main>
  </el-container>
</template>

<script>
import Aside from "@/components/Aside.vue";

export default {
  components: {
    Aside
  }
}
</script>

<style>

</style>
