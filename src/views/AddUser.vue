<template>
  <div>
    <el-form class="addForm">
      <el-form-item style="margin: 30px 25%;display: flex;justify-content: center;align-items: center">

        <el-upload
          ref="upload"
          action="#"
          :file-list="fileList"
          list-type="picture-card"
          :on-change="uploadOnChange"
          :auto-upload="false">
          <div>请上传头像</div>

          <div slot="file" slot-scope="{file}">
            <img
              class="el-upload-list__item-thumbnail"
              :src="file.url" alt=""
            >

            <span class="el-upload-list__item-actions">
          <span
            class="el-upload-list__item-preview"
            @click="handlePictureCardPreview(file)"
          >
            <i class="el-icon-zoom-in"></i>
          </span>

          <span
            class="el-upload-list__item-delete"
            @click="handleRemove(file)"
            style="margin-left: 20px"
          >
            <i class="el-icon-delete"></i>
          </span>
        </span>
          </div>
        </el-upload>
      </el-form-item>

      <el-form :model="userData" :rules="formRules" ref="userForm" :hide-required-asterisk="true">
        <el-row>
          <el-form-item class="formItem" label="账号：" prop="userId">
            <el-input placeholder="必填" class="input" v-model="userData.userId"></el-input>
          </el-form-item>
        </el-row>

        <el-row>
          <el-form-item class="formItem" label="名称：" prop="username">
            <el-input placeholder="必填" class="input" v-model="userData.username"></el-input>
          </el-form-item>
        </el-row>

        <el-row>
          <el-form-item class="formItem" label="密码：" prop="password">
            <el-input placeholder="必填（6-20位）" class="input" v-model="userData.password" show-password></el-input>
          </el-form-item>
        </el-row>
      </el-form>

      <el-row>
        <el-form-item style="display: flex;justify-content: center;align-items: center">
          <el-button type="primary" @click="addUser">添加</el-button>
          <el-button type="danger" @click="resetUser">清空</el-button>
        </el-form-item>
      </el-row>

    </el-form>

    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import {API_BASE_URL} from "@/tool/config";

export default {
  data() {
    return {
      userData: {
        headPortrait: "",
        userId: "",
        username: "",
        password: "",
        type: 0, // 0表示添加
      },
      fileList: [],
      dialogImageUrl: '',
      dialogVisible: false,

      formRules: {
        userId: [
          {required: true, message: '账号是必填的', trigger: 'blur'},
          {pattern: /^[0-9]{1,12}$/, message: '账号必须是数字且不超过12位', trigger: 'blur'}
        ],
        username: [
          {required: true, message: '名称是必填的', trigger: 'blur'},
          {max: 12, message: '名称不能超过12个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '密码是必填的', trigger: 'blur'},
          {min: 6, max: 20, message: '密码长度必须在6到20个字符之间', trigger: 'blur'}
        ]
      }
    };
  },
  methods: {
    /**
     * 上传图片
     * @param file
     * @returns {Promise<void>}
     */
    async uploadOnChange(file) {
      // console.log('==================================',file.raw)
      this.userData.headPortrait = await this.getBase64(file.raw);
      // console.log('==================================',this.userData.headPortrait)
      this.$nextTick(() => {
        this.$refs.upload.$el.querySelector('.el-upload--picture-card').style.display = 'none';
      });
    },

    /**
     * 删除图片
     */
    handleRemove() {
      console.log();
      this.fileList = [];
      this.dialogImageUrl = "";
      this.userData.headPortrait = ""; // 清空 Base64 字符串
      // 隐藏新增图片-出于element-ui的bug
      setTimeout(() => {
        this.$refs.upload.$el.querySelector('.el-upload--picture-card').style.display = 'block';
      }, 1000);
    },

    /**
     * 图片预览
     * @param file
     */
    handlePictureCardPreview(file) {
      this.dialogImageUrl = file.url;
      this.dialogVisible = true;
    },

    /**
     * 添加用户
     * @returns {Promise<void>}
     */
    addUser() {
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          // 提交表单
          try {
            axios.post(`${API_BASE_URL}/user/saveUser`, this.userData);
          } catch (error) {
            console.error('错误:', error);
          }
          this.resetUser();
          this.$message({
            message: '用户添加成功',
            type: 'success'
          });
        } else {
          return false;
        }
      });
    },

    // 清空
    resetUser() {
      this.$refs.userForm.resetFields();
      this.handleRemove();
    },

    /**
     * 工具类函数
     * @param file
     * @returns {Promise<unknown>}
     */
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
}
</script>

<style scoped>
.addForm {
  margin: 100px auto;
  width: 50%;
  border: #ebeef5 2px solid;
  border-radius: 10px;
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
