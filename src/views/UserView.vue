<template>
  <div class="container">
    <el-input class="input" v-model="queryUser.userId" placeholder="账号" clearable></el-input>
    <el-input class="input" v-model="queryUser.username" placeholder="用户名" clearable></el-input>
    <el-button class="button" type="primary" @click="getAllUserData()">查询</el-button>

    <el-table :data="allUserData" style="width: 100%" :header-cell-style="headerCellStyle">
      <el-table-column prop="headPortrait" label="头像">
        <template slot-scope="scope">
          <img :src="scope.row.headPortrait" alt="头像" style="width: 50px; height: 50px; border-radius: 50%;">
        </template>
      </el-table-column>
      <el-table-column prop="userId" label="账号"></el-table-column>
      <el-table-column prop="username" label="用户名"></el-table-column>
      <el-table-column prop="password" label="密码"></el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
<!--          <el-button type="primary" @click="openUpdateDialog(scope.row)">编辑</el-button>-->
          <el-button type="danger" @click="openDeleteDialog(scope.row.userId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页组件 -->
    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="queryUser.total"
      :page-size="queryUser.size"
      :current-page="queryUser.current"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      class="pagination"
    >
    </el-pagination>

    <!--编辑弹窗-->
<!--    <el-dialog :visible.sync="updateShow">-->
<!--      <el-form class="updateForm">-->
<!--        <el-form-item style="margin: 30px 25%;display: flex;justify-content: center;align-items: center">-->
<!--          <el-upload-->
<!--            ref="upload"-->
<!--            action="#"-->
<!--            :file-list="fileList"-->
<!--            list-type="picture-card"-->
<!--            :on-change="uploadOnChange"-->
<!--            :auto-upload="false">-->
<!--            <div>请上传头像</div>-->

<!--            <div slot="file" slot-scope="{file}">-->
<!--              <img-->
<!--                class="el-upload-list__item-thumbnail"-->
<!--                :src="file.url" alt=""-->
<!--              >-->

<!--              <span class="el-upload-list__item-actions">-->
<!--          <span-->
<!--            class="el-upload-list__item-preview"-->
<!--            @click="handlePictureCardPreview(file)"-->
<!--          >-->
<!--            <i class="el-icon-zoom-in"></i>-->
<!--          </span>-->

<!--          <span-->
<!--            class="el-upload-list__item-delete"-->
<!--            @click="handleRemove(file)"-->
<!--            style="margin-left: 20px"-->
<!--          >-->
<!--            <i class="el-icon-delete"></i>-->
<!--          </span>-->
<!--        </span>-->
<!--            </div>-->
<!--          </el-upload>-->
<!--        </el-form-item>-->

<!--        <el-form :model="userData" :rules="formRules" ref="userForm" :hide-required-asterisk="true">-->
<!--          <el-row>-->
<!--            <el-form-item class="formItem" label="账号：" >-->
<!--              <el-input placeholder="必填" class="input" v-model="userData.userId" disabled></el-input>-->
<!--            </el-form-item>-->
<!--          </el-row>-->

<!--          <el-row>-->
<!--            <el-form-item class="formItem" label="名称：" prop="username">-->
<!--              <el-input placeholder="必填" class="input" v-model="userData.username"></el-input>-->
<!--            </el-form-item>-->
<!--          </el-row>-->

<!--          <el-row>-->
<!--            <el-form-item class="formItem" label="密码：" prop="password">-->
<!--              <el-input placeholder="必填（8-20位）" class="input" v-model="userData.password" show-password></el-input>-->
<!--            </el-form-item>-->
<!--          </el-row>-->
<!--        </el-form>-->

<!--        <el-row>-->
<!--          <el-form-item style="display: flex;justify-content: center;align-items: center">-->
<!--            <el-button type="primary" @click="updateUser">确定</el-button>-->
<!--            <el-button type="danger" @click="cancelUpdate">取消</el-button>-->
<!--          </el-form-item>-->
<!--        </el-row>-->

<!--      </el-form>-->
<!--    </el-dialog>-->

    <!-- 删除确认弹窗 -->
    <el-dialog
      :visible.sync="deleteShow"
      title="删除用户"
      @close="cancelDelete"
    >
      <span>确定删除这个用户吗？</span>
      <span slot="footer" class="dialog-footer">
    <el-button @click="deleteShow = false">取消</el-button>
    <el-button type="danger" @click="deleteUser">确定</el-button>
  </span>
    </el-dialog>
  </div>
</template>

<script>
import request from '@/api'
import {API_BASE_URL} from '@/tool/config';

export default {
  data() {
    return {
      // 表格样式
      headerCellStyle: {
        borderTop: '2px solid #ebeef5' // 设置表头的上边框
      },

      // 全部用户数据
      allUserData: [],

      userData: {
        headPortrait: "",
        userId: "",
        username: "",
        password: "",
        type: 1, // 1表示编辑
      },

      // 验证规则
      formRules: {
        username: [
          {required: true, message: '名称是必填的', trigger: 'blur'},
          {max: 12, message: '名称不能超过12个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '密码是必填的', trigger: 'blur'},
          {min: 6, max: 20, message: '密码长度必须在6到20个字符之间', trigger: 'blur'}
        ]
      },

      fileList: [],
      dialogImageUrl: '',

      // 用户查询对象
      queryUser: {
        userId: '',
        username: '',
        current: 1,
        size: 10,
        total: 0
      },

      // 弹窗
      updateShow: false,
      deleteShow: false,
      previewShow: false,
      // 将删除的账号
      userIdToDelete: "",
    };
  },

  mounted() {
    this.getAllUserData();
  },

  methods: {

    // 直接使用响应数据，不判断 code
    async getAllUserData() {
      this.loading = true
      try {
        const response = await request.post('/user/getUser', this.queryUser)
        console.log('用户数据响应:', response)

        // 直接取数据，因为后端返回的就是分页对象
        this.allUserData = response.records || []
        this.queryUser.total = response.total || 0
      } catch (error) {
        console.error('获取用户数据失败:', error)
        this.$message.error('获取用户数据失败')
      } finally {
        this.loading = false
      }
    },

    // 编辑
    openUpdateDialog(row) {
      console.log(row)
      this.updateShow = true;
      this.userData = {
        headPortrait: row.headPortrait,
        userId: row.userId,
        username: row.username,
        password: row.password,
        type: 1, // 1表示编辑
      };
      this.fileList = [
        {
          name: '头像',  // 文件名可以自定义
          url: row.headPortrait,  // 图片的URL
        }
      ];
      this.$nextTick(() => {
        this.$refs.upload.$el.querySelector('.el-upload--picture-card').style.display = 'none';
      });
    },

    cancelUpdate() {
      this.updateShow = false;
    },

    async uploadOnChange(file) {
      // console.log('==================================',file.raw)
      this.userData.headPortrait = await this.getBase64(file.raw);
      // console.log('==================================',this.userData.headPortrait)
      this.$nextTick(() => {
        this.$refs.upload.$el.querySelector('.el-upload--picture-card').style.display = 'none';
      });
    },

    handleRemove(file) {
      console.log(file);
      this.fileList = [];
      this.dialogImageUrl = "";
      this.userData.headPortrait = ""; // 清空 Base64 字符串
      // 隐藏新增图片-出于element-ui的bug
      setTimeout(() => {
        this.$refs.upload.$el.querySelector('.el-upload--picture-card').style.display = 'block';
      }, 1000);
    },

    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },

    async updateUser() {
      // 包装 validate 为 Promise
      const isValid = await new Promise((resolve) => {
        this.$refs.userForm.validate((valid) => {
          resolve(valid);
        });
      });
      if (isValid) {
        try {
          await axios.post(`${API_BASE_URL}/user/saveUser`, this.userData);
          console.log(this.userData)
          this.cancelUpdate();
          await this.getAllUserData();
        } catch (error) {
          console.error('错误:', error);
        }
      } else {
        return false;
      }
    },

    // 删除
    openDeleteDialog(userId) {
      console.log(userId)
      this.userIdToDelete = userId;
      this.deleteShow = true;  // 打开弹窗
    },

    cancelDelete() {
      this.deleteShow = false;  // 关闭弹窗
      this.userIdToDelete = ""
    },

    async deleteUser() {
      try {
        await axios.delete(`${API_BASE_URL}/user/deleteUser/${this.userIdToDelete}`);
        await this.getAllUserData();
        this.cancelDelete()
      } catch (error) {
        console.error('错误:', error);
      }
    },

    // 每页大小改变事件
    handleSizeChange(newSize) {
      this.queryUser.size = newSize;
      this.queryUser.current = 1; // 重置到第一页
      this.getAllUserData(); // 重新加载数据
    },
    // 当前页码改变事件
    handleCurrentChange(newPage) {
      this.queryUser.current = newPage;
      this.getAllUserData(); // 重新加载数据
    },

    getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve(reader.result);
        };
        reader.onerror = (error) => {
          reject(error);
        };
      });
    },
  }
};
</script>

<style scoped>
.container {

}

.input {
  width: 200px;
  margin: 0 0 20px 20px;
}

.button {
  margin: 0 0 20px 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.updateForm {

}

.formItem {
  margin: 20px 30%;
  font-weight: bold;
}

.input {
  margin: 0 0 20px 20px;
  width: 200px;
}

</style>
