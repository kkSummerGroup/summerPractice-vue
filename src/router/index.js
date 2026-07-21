// router/index.js
import VueRouter from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: '云知康检验指标可视化-登录',
      requiresAuth: false
    },
    component: () => import('../views/Login.vue')
  },
  {
    path: '/',
    redirect: '/user'
  },
  {
    path: '/index',
    name: 'index',
    component: () => import('../Index.vue'),
    meta: {
      requiresAuth: true
    },
    children: [
      // ===== 两个 Dashboard =====
      {
        path: '/doctorDashboard',
        name: 'doctorDashboard',
        meta: {
          title: '云知康检验指标可视化-数据中心',
          requiresAuth: true,
          roles: [1]  // 👈 只有 role=1 可见
        },
        component: () => import('../views/DoctorDashboard.vue')
      },
      {
        path: '/patientDashboard',
        name: 'patientDashboard',
        meta: {
          title: '云知康检验指标可视化-数据中心',
          requiresAuth: true,
          roles: [2]  // 👈 只有 role=2 可见
        },
        component: () => import('../views/PatientDashboard.vue')
      },
      {
        path: '/user',
        name: 'user',
        meta: {
          title: '云知康检验指标可视化-个人信息',
          requiresAuth: true,
        },
        component: () => import('../views/User.vue')
      },
      // ===== 公共路由（所有角色可见） =====
      {
        path: '/userView',
        name: 'userView',
        meta: {
          title: '云知康检验指标可视化-用户信息',
          requiresAuth: true
        },
        component: () => import('../views/UserView.vue')
      },
      {
        path: '/addUser',
        name: 'addUser',
        meta: {
          title: '云知康检验指标可视化-添加用户',
          requiresAuth: true
        },
        component: () => import('../views/AddUser.vue')
      },
      {
        path: '/bloodTestResult',
        name: 'bloodTestResult',
        meta: {
          title: '云知康检验指标可视化-抽血结果',
          requiresAuth: true
        },
        component: () => import('../views/BloodTestResult.vue')
      },
      {
        path: '/bloodTestProject',
        name: 'bloodTestProject',
        meta: {
          title: '云知康检验指标可视化-抽血项目',
          requiresAuth: true
        },
        component: () => import('../views/BloodTestProject.vue')
      },
      {
        path: '/medicineManage',
        name: 'medicineManage',
        meta: {
          title: '云知康检验指标可视化-药物管理',
          requiresAuth: true
        },
        component: () => import('../views/MedicineManage.vue')
      },
      {
        path: '/userMedicine',
        name: 'userMedicine',
        meta: {
          title: '云知康检验指标可视化-患者用药',
          requiresAuth: true
        },
        component: () => import('../views/UserMedicine.vue')
      },
      {
        path: '/medicine',
        name: 'medicine',
        meta: {
          title: '云知康检验指标可视化-药物列表',
          requiresAuth: true
        },
        component: () => import('../views/Medicine.vue')
      },
      {
        path: '/test',
        name: 'test',
        meta: {
          title: '云知康检验指标可视化-测试',
          requiresAuth: true
        },
        component: () => import('../views/Test.vue')
      }
    ]
  },
  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// ===== 路由守卫 =====
router.beforeEach(async (to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    const isLoggedIn = store.getters.isLoggedIn

    if (!isLoggedIn) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 验证 Token
    try {
      const isValid = await store.dispatch('verify')
      if (!isValid) {
        store.dispatch('logout')
        next({ path: '/login', query: { redirect: to.fullPath } })
        return
      }
    } catch (error) {
      store.dispatch('logout')
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }

    // ===== 权限校验 =====
    const userRole = store.getters.role
    const requiredRoles = to.meta.roles

// ❌ 用户角色本身无效（非1非2），强制退出
    if (userRole !== 1 && userRole !== 2) {
      store.dispatch('logout')
      next({ path: '/login', query: { message: '账号无权限' } })
      return
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(userRole)) {
        // 无权限，跳转到对应的 Dashboard
        if (userRole === 1) {
          next('/doctorDashboard')
        } else if (userRole === 2) {
          next('/patientDashboard')
        } else {
          // 理论上不会到这里，但保留兜底
          store.dispatch('logout')
          next('/login')
        }
        return
      }
    }
  }

  // 已登录访问登录页
  if (to.path === '/login' && store.getters.isLoggedIn) {
    try {
      const isValid = await store.dispatch('verify')
      if (isValid) {
        const userRole = store.getters.role
        if (userRole === 1) {
          next('/doctorDashboard')
        } else if (userRole === 2) {
          next('/patientDashboard')
        } else {
          next('/')
        }
        return
      }
    } catch (error) {
      // 继续显示登录页
    }
  }

  next()
})

export default router