<template>
  <div class="container">
    <div class="header-container">
      <div class="class-container">
        <div class="class" :class="{ active: activeClass === '' }" @click="getBloodTestProjectData('')">
          全部
        </div>
        <div class="class" :class="{ active: activeClass === className }" v-for="(className, index) in classNames"
             :key="index" @click="getBloodTestProjectData(className)">
          {{ className }}
        </div>
      </div>
      <div class="options">

        <!-- 不能识别 "%" 这样的通配符 -->
        <el-input placeholder="搜索项目名称" class="input-with-icon-button" v-model="queryProject.projectName" clearable>
          <el-button slot="append" icon="el-icon-search" @click="getBloodTestProjectData(activeClass)"></el-button>
        </el-input>

        <el-button type="primary" round @click="openAddClass()">添加分类</el-button>
        <el-button type="success" round @click="openSaveProject()">添加项目</el-button>
      </div>

    </div>

    <div class="divider" style="width: 100%; height: 3px; background-color: gray; z-index: 1;"></div>
    <el-table
      class="table"
      :data="allProjectData"
      :header-cell-style="{'text-align':'center'}"
      :cell-style="{'text-align':'center'}"
      border
      stripe
    >
      <el-table-column label="序号" type="index" width="80px"></el-table-column>
      <el-table-column prop="projectClassName" label="分类"></el-table-column>
      <el-table-column prop="projectName" label="名称"></el-table-column>
      <el-table-column prop="unit" label="单位"></el-table-column>
      <el-table-column label="参考范围">
        <template #default="{row}">
          {{ row.referenceRangeLow }} ~ {{ row.referenceRangeHigh }}
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template slot-scope="scope">
          <el-button type="info" @click="">查看</el-button>
          <el-button type="primary" @click="openSaveProject(scope.row)">编辑</el-button>
          <el-button type="danger" @click="openDeleteProject(scope.row.projectId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      background
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      :page-size="pageSize"
      :page-sizes="[10, 20, 50, 100]"
      style="text-align: center; margin-top: 20px;"
    ></el-pagination>

    <el-dialog
      :visible.sync="addProjectClassShow"
      width="400px"
      title="添加分类"
      center
    >
      <el-form>
        <el-form-item label="分类名称：">
          <el-input v-model="addProjectClassForm.projectClassName"></el-input>
        </el-form-item>
        <el-button type="primary" @click="saveProjectClass()">保存</el-button>
        <el-button @click="cancelProjectClass()">取消</el-button>
      </el-form>
    </el-dialog>

    <el-dialog
      :visible.sync="saveProjectShow"
      width="600px"
      title="添加项目"
      center
    >
      <el-form>
        <el-form-item label="所属项目分类：">
          <el-select v-model="updateProjectForm.projectClassId" clearable>

            <el-option v-for="(item, index) in classes" :key="index" :label="item.projectClassName"
                       :value="item.projectClassId">
            </el-option>

          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="项目名称：">
              <el-input v-model="updateProjectForm.projectName"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="计量单位：">
              <el-input v-model="updateProjectForm.unit"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最低标准值：">
              <el-input v-model="updateProjectForm.referenceRangeLow"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最高标准值：">
              <el-input v-model="updateProjectForm.referenceRangeHigh"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary" @click="saveProject()">保存</el-button>
        <el-button @click="cancelProject()">取消</el-button>
      </el-form>
    </el-dialog>

    <el-dialog
      :visible.sync="deleteProjectShow"
      width="400px"
      title="删除项目"
      center
    >
      <el-form>
        <el-form-item>
          确定要删除吗？
        </el-form-item>
        <el-button type="primary" @click="deleteProject()">确定</el-button>
        <el-button @click="cancelDeleteProject()">取消</el-button>
      </el-form>
    </el-dialog>


  </div>
</template>

<script>
import request from '@/api'

export default {
  name: "",
  data() {
    return {
      queryProject: {
        projectClassName: '',
        projectName: '',
        unit: '',
        referenceRangeLow: null,
        referenceRangeHigh: null,
      },
      pageNum: 1,
      pageSize: 10,
      total: 0,

      allProjectData: [],
      classes: [],
      classIds: [],
      classNames: [],
      activeClass: '',
      activeClassId: '',

      addProjectClassShow: false,
      addProjectClassForm: {
        projectClassName: '',
      },

      saveProjectShow: false,
      updateProjectForm: {
        projectId: '',
        projectClassId: '',
        projectName: '',
        unit: '',
        referenceRangeLow: null,
        referenceRangeHigh: null,
      },

      deleteProjectShow: false,
      projectIdToDelete: '',
    }
  },
  mounted() {
    this.getAllProjectClassNames();
    this.getBloodTestProjectData('');
  },
  methods: {
    async getAllProjectClassNames() {
      try {
        const response = await request.get('/bloodTest/getAllProjectClassNames')
        this.classes = response
        // 如果返回的是 {code, data} 格式，用下面这行
        // this.classes = response.data || response
        this.classIds = this.classes.map(item => item.projectClassId);
        this.classNames = this.classes.map(item => item.projectClassName);
      } catch (error) {
        console.error('错误:', error);
      }
    },

    async getBloodTestProjectData(type) {
      this.activeClass = type;
      this.activeClassId = this.classIds[this.classNames.indexOf(type)];
      this.queryProject.projectClassName = type;
      try {
        const response = await request.post('/bloodTest/getBloodTestProject', this.queryProject, {
          params: {
            pageNum: this.pageNum,
            pageSize: this.pageSize
          }
        });
        console.log("项目名称", response)
        this.total = response.total;
        this.allProjectData = response.records;
      } catch (error) {
        console.error('错误:', error);
      }
    },

    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.getBloodTestProjectData(this.activeClass);
    },

    handleCurrentChange(newPage) {
      this.pageNum = newPage;
      this.getBloodTestProjectData(this.activeClass);
    },

    openAddClass() {
      this.addProjectClassForm = {
        projectClassName: '',
      }
      this.addProjectClassShow = true;
    },

    async saveProjectClass() {
      try {
        await request.post(`/bloodTest/saveProjectClass?projectClass=${this.addProjectClassForm.projectClassName}`);
        this.$message.success('保存成功');
        await this.getAllProjectClassNames();
        await this.getBloodTestProjectData(this.activeClass);
        this.cancelProjectClass();
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    cancelProjectClass() {
      this.addProjectClassShow = false;
    },

    openSaveProject(project) {
      if (project) {
        this.updateProjectForm = {
          projectId: project.projectId,
          projectClassId: project.projectClassId,
          projectName: project.projectName,
          unit: project.unit,
          referenceRangeLow: project.referenceRangeLow,
          referenceRangeHigh: project.referenceRangeHigh,
        }
      } else {
        this.updateProjectForm = {
          projectClassId: this.activeClassId,
          projectName: '',
          unit: '',
          referenceRangeLow: null,
          referenceRangeHigh: null,
        };
      }

      this.saveProjectShow = true;
    },

    async saveProject() {
      console.log(this.updateProjectForm)

      this.updateProjectForm = {
        ...this.updateProjectForm,
        referenceRangeHigh: this.updateProjectForm.referenceRangeHigh || null,
        referenceRangeLow: this.updateProjectForm.referenceRangeLow || null
      };

      console.log("保存项目", this.updateProjectForm)

      try {
        await request.post('/bloodTest/saveProject', this.updateProjectForm);
        this.$message.success('保存成功');
        await this.getBloodTestProjectData(this.activeClass);
        this.cancelProject();
      } catch (error) {
        console.error('保存失败:', error);
      }
    },

    cancelProject() {
      this.saveProjectShow = false;
    },

    openDeleteProject(id) {
      this.projectIdToDelete = id;
      this.deleteProjectShow = true;
    },

    async deleteProject() {
      try {
        const response = await request.delete(`/bloodTest/deleteProject/${this.projectIdToDelete}`);
        console.log(response)
        this.$message.success('删除成功');
        this.cancelDeleteProject();
        await this.getBloodTestProjectData(this.activeClass);
      } catch (error) {
        console.error('删除失败:', error);
        this.$message.error('删除失败');
      }
    },

    cancelDeleteProject() {
      this.projectIdToDelete = '';
      this.deleteProjectShow = false;
    },
  },
};
</script>

<style scoped>
.container {
  height: 100%;
  width: 100%;
}

.header-container {
  height: 50px;
  width: 100%;
}

.input-with-icon-button {
  width: 300px;
  margin-right: 15px;
}

.class-container {
  float: left;
  display: flex;
  width: 60%;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.class {
  min-width: 120px;
  height: 47px;
  border: gray 3px solid;
  border-right: none; /* 默认移除所有元素的右边框 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 0 15px;
  cursor: pointer;
}

.class:last-child {
  border-right: gray 3px solid;
}

/* 高亮状态 */
.class.active {
  background-color: #1890ff;
  color: white;
}

.class.active:not(:last-child) {
  border-right: 3px solid #1890ff;
  margin-right: -3px;
}

.options {
  float: right;
}

.table {
  height: calc(100% - 100px);
}

</style>
