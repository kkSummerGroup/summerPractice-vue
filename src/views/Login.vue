<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>🔬 检验系统</h1>
        <p>登录以继续使用</p>
      </div>

      <el-form
          ref="loginForm"
          :model="loginData"
          :rules="rules"
          @submit.native.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
              v-model="loginData.username"
              placeholder="请输入用户名"
              prefix-icon="el-icon-user"
              size="large"
              clearable
              @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
              v-model="loginData.password"
              type="password"
              placeholder="请输入密码"
              prefix-icon="el-icon-lock"
              size="large"
              show-password
              @keyup.enter.native="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleLogin"
              style="width: 100%"
          >
            登 录
          </el-button>
        </el-form-item>

        <div v-if="message" class="message" :class="messageType">
          {{ message }}
        </div>
      </el-form>

      <div class="login-footer">
        <span>还没有账号？</span>
        <el-button type="text" @click="handleRegister">立即注册</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  name: 'Login',
  data() {
    return {
      loginData: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 2, max: 20, message: '用户名长度为2-20位', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur'}
        ]
      },
      loading: false,
      message: '',
      messageType: 'error'
    }
  },
  computed: {
    ...mapGetters(['isLoggedIn', 'role'])
  },
  methods: {
    // ✅ 添加 logout
    ...mapActions(['login', 'logout']),

    async handleLogin() {
      this.message = ''

      try {
        const valid = await this.$refs.loginForm.validate()
        if (!valid) return
      } catch {
        return
      }

      this.loading = true

      try {
        const result = await this.login(this.loginData)
        console.log('登录结果:', result)

        if (result.success) {
          // ===== 获取角色 =====
          const role = result.data?.role || this.role

          // ❌ 非 1 或 2 不允许登录
          if (role !== 1 && role !== 2) {
            // 清除已保存的登录状态
            await this.logout()
            this.message = '❌ 该账号无权限登录系统，请联系管理员'
            this.messageType = 'error'
            this.loading = false
            return
          }

          this.message = '✅ 登录成功，正在跳转...'
          this.messageType = 'success'

          // 根据角色跳转
          let redirect = '/user'
          if (role === 1) {
            redirect = '/doctorDashboard'
          } else if (role === 2) {
            redirect = '/patientDashboard'
          }

          setTimeout(() => {
            this.$router.push(redirect)
          }, 1000)

        } else {
          this.message = '❌ ' + (result.message || '登录失败，请检查用户名和密码')
          this.messageType = 'error'
        }
      } catch (error) {
        console.error('登录异常:', error)
        this.message = '❌ 登录失败，请检查网络连接'
        this.messageType = 'error'
      } finally {
        this.loading = false
      }
    },

    handleRegister() {
      this.$message.info('请联系管理员注册账号')
    }
  },

  mounted() {
    // 如果已登录，根据角色跳转
    if (this.isLoggedIn) {
      const role = this.role
      if (role === 1) {
        this.$router.push('/doctorDashboard')
      } else if (role === 2) {
        this.$router.push('/patientDashboard')
      } else {
        this.$router.push('/user')
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: #ffffff;
  border-radius: 20px;
  padding: 50px 40px;
  width: 420px;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.login-header p {
  color: #999;
  font-size: 14px;
}

.message {
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  text-align: center;
}

.message.error {
  background: #fff3f3;
  color: #d32f2f;
  border: 1px solid #ffcdd2;
}

.message.success {
  background: #f0f9f0;
  color: #2e7d32;
  border: 1px solid #c8e6c9;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #999;
  font-size: 14px;
}
</style>