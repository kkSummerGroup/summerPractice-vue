import VueRouter from 'vue-router'
import store from '@/store'

const routes = [
  {
    path: '/login',
    name: 'login',
    meta: {
      title: '登录',
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
      {
        path: '/user',
        name: 'user',
        meta: {
          title: '用户信息',
          requiresAuth: true
        },
        component: () => import('../views/User.vue')
      },
      {
        path: '/addUser',
        name: 'addUser',
        meta: {
          title: '添加用户',
          requiresAuth: true
        },
        component: () => import('../views/AddUser.vue')
      },
      {
        path: '/bloodTestResult',
        name: 'bloodTestResult',
        meta: {
          title: '抽血结果',
          requiresAuth: true
        },
        component: () => import('../views/BloodTestResult.vue')
      },
      {
        path: '/bloodTestProject',
        name: 'bloodTestProject',
        meta: {
          title: '抽血项目',
          requiresAuth: true
        },
        component: () => import('../views/BloodTestProject.vue')
      },
      {
        path: '/addMedicine',
        name: 'addMedicine',
        meta: {
          title: '添加药物',
          requiresAuth: true
        },
        component: () => import('../views/AddMedicine.vue')
      },
      {
        path: '/medicine',
        name: 'medicine',
        meta: {
          title: '药物',
          requiresAuth: true
        },
        component: () => import('../views/Medicine.vue')
      },
      {
        path: '/test',
        name: 'tTest',
        meta: {
          title: '上传测试',
          requiresAuth: true
        },
        component: () => import('../views/Test.vue')
      }
    ]
  },
  // 404 页面
  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

// 路由守卫 - 认证检查
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth) {
    // 检查是否已登录
    const isLoggedIn = store.getters.isLoggedIn

    if (!isLoggedIn) {
      // 未登录，跳转到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 验证 Token 是否有效
    try {
      const isValid = await store.dispatch('verify')
      if (!isValid) {
        store.dispatch('logout')
        next({
          path: '/login',
          query: { redirect: to.fullPath }
        })
        return
      }
    } catch (error) {
      store.dispatch('logout')
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }

  // 已登录但访问登录页，跳转到首页
  if (to.path === '/login' && store.getters.isLoggedIn) {
    try {
      const isValid = await store.dispatch('verify')
      if (isValid) {
        next(from.query.redirect || '/')
        return
      }
    } catch (error) {
      // Token 无效，继续显示登录页
    }
  }

  next()
})

export default router