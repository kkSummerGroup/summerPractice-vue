<template>
  <div>
    <el-form class="addForm">

      <el-form :model="data" :rules="formRules" ref="medicineForm" :hide-required-asterisk="true">
        <el-row>
          <el-form-item class="formItem" label="药物种类：" prop="medType">
            <el-select
              class="input"
              v-model="data.medType"
              clearable
            >
            <el-option
              v-for="item in medTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
            </el-select>
          </el-form-item>
        </el-row>

          <el-form-item v-if="data.medType === '蒙药'" class="formItem" label="药物编号：" prop="medNumber">
            <el-input class="input" v-model="data.medNumber"></el-input>
          </el-form-item>


          <el-form-item v-else class="formItem" label="药物名：" prop="medName">
            <el-input class="input" v-model="data.medName"></el-input>
          </el-form-item>

        <el-row>
          <el-form-item class="formItem" label="用处：" prop="medUsage">
            <el-input class="input" v-model="data.medUsage"></el-input>
          </el-form-item>
        </el-row>

        <el-row>
          <el-form-item class="formItem" label="用法用量：" prop="medAmount">
            <el-input class="input" v-model="data.medAmount"></el-input>
          </el-form-item>
        </el-row>

        <el-form-item style="margin: 30px 25%;display: flex;justify-content: center;align-items: center">

          <div style="display: flex">
            <el-upload
              ref="upload1"
              action="#"
              :file-list="medPic"
              list-type="picture-card"
              :on-change="uploadOnChange1"
              :auto-upload="false"

            >
              <div>请上传药品图片</div>

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
            @click="handleRemoveMedPic(file)"
            style="margin-left: 20px"
          >
            <i class="el-icon-delete"></i>
          </span>
        </span>
              </div>
            </el-upload>

            <el-upload
              ref="upload2"
              action="#"
              :file-list="pillPic"
              list-type="picture-card"
              :on-change="uploadOnChange2"
              :auto-upload="false"
              style="margin-left: 20px"
            >
              <div>请上传药丸图片</div>

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
            @click="handleRemovePillPic(file)"
            style="margin-left: 20px"
          >
            <i class="el-icon-delete"></i>
          </span>
        </span>
              </div>
            </el-upload>
          </div>

        </el-form-item>

        <el-row>
          <el-form-item class="formItem" label="备注：" prop="medRemark">
            <el-input class="input" v-model="data.medRemark" type="textarea" :rows="2"></el-input>
          </el-form-item>
        </el-row>
      </el-form>

      <el-row>
        <el-form-item style="display: flex;justify-content: center;align-items: center">
          <el-button type="primary" @click="addMedicine">添加</el-button>
          <el-button type="danger" @click="resetMedicine">清空</el-button>
        </el-form-item>
      </el-row>

    </el-form>

    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="dialogImageUrl" alt="">
    </el-dialog>
  </div>
</template>

<script>
import request from "@/api";

export default {
  data() {
    return {
      data: {
        medType: "",
        medNumber: "",
        medName: "",
        medPic: "",
        pillPic: "",
        medUsage: "",
        medAmount: "",
        medRemark: ""
      },
      medTypeOptions: [
        { label: '中药', value: '中药' },
        { label: '西药', value: '西药' },
        { label: '蒙药', value: '蒙药' },
      ],
      medPic: [],
      pillPic: [],
      dialogImageUrl: '',
      dialogVisible: false,

      formRules: {
        // medicineId: [
        //   {required: true, message: '账号是必填的', trigger: 'blur'},
        //   {pattern: /^[0-9]{1,12}$/, message: '账号必须是数字且不超过12位', trigger: 'blur'}
        // ],
        // medicinename: [
        //   {required: true, message: '名称是必填的', trigger: 'blur'},
        //   {max: 12, message: '名称不能超过12个字符', trigger: 'blur'}
        // ],
        // password: [
        //   {required: true, message: '密码是必填的', trigger: 'blur'},
        //   {min: 6, max: 20, message: '密码长度必须在6到20个字符之间', trigger: 'blur'}
        // ]
      }
    };
  },
  methods: {
    /**
     * 上传图片
     * @param file
     * @returns {Promise<void>}
     */
    async uploadOnChange1(file) {
      // console.log('==================================',file.raw)
      this.data.medPic = await this.getBase64(file.raw);
      this.$nextTick(() => {
        this.$refs.upload1.$el.querySelector('.el-upload--picture-card').style.display = 'none';
      });
    },

    async uploadOnChange2(file) {
      // console.log('==================================',file.raw)
      this.data.pillPic = await this.getBase64(file.raw);
      this.$nextTick(() => {
        this.$refs.upload2.$el.querySelector('.el-upload--picture-card').style.display = 'none';
      });
    },

    /**
     * 删除图片
     */

    handleRemoveMedPic() {
      // console.log(321);
      this.medPic = [];
      this.dialogImageUrl = "";
      this.data.medPic = ""; // 清空 Base64 字符串
      // 隐藏新增图片-出于element-ui的bug
      setTimeout(() => {
        this.$refs.upload1.$el.querySelector('.el-upload--picture-card').style.display = 'block';
      }, 1000);
    },

    handleRemovePillPic() {
      // console.log(321);
      this.pillPic = [];
      this.dialogImageUrl = "";
      this.data.pillPic = ""; // 清空 Base64 字符串
      // 隐藏新增图片-出于element-ui的bug
      setTimeout(() => {
        this.$refs.upload2.$el.querySelector('.el-upload--picture-card').style.display = 'block';
      }, 1000);
    },

    handleRemove() {
      // console.log(321);
      this.medPic = [];
      this.pillPic = [];
      this.dialogImageUrl = "";
      this.data.medPic = ""; // 清空 Base64 字符串
      this.data.pillPic = ""; // 清空 Base64 字符串
      // 隐藏新增图片-出于element-ui的bug
      setTimeout(() => {
        this.$refs.upload1.$el.querySelector('.el-upload--picture-card').style.display = 'block';
        this.$refs.upload2.$el.querySelector('.el-upload--picture-card').style.display = 'block';
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
     * 添加药物
     * @returns {Promise<void>}
     */
    addMedicine() {
      this.$refs.medicineForm.validate((valid) => {
        if (valid) {
          // 提交表单
          request.post('/medicine/saveMed', this.data)
              .then(res => {
                console.log('添加成功:', res);
                this.$message({
                  message: '药物添加成功',
                  type: 'success'
                });
                this.resetMedicine();
              })
              .catch(err => {
                console.error('添加失败:', err);
                this.$message({
                  message: err.response?.data?.message || '添加失败，请稍后重试',
                  type: 'error'
                });
              });
        } else {
          return false;
        }
      });
    },

    // 清空
    resetMedicine() {
      this.data = {
        medNumber: "", // 重置编号
        medName: "", // 重置名称
      };
      this.$refs.medicineForm.resetFields();
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
  margin: 0 auto;
  width: 60%;
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
