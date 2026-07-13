import VueRouter from 'vue-router'

const routes = [

  {
    path: '/',
    redirect: '/user' // 设置默认重定向路由
  },
  {
    path: '/index',
    name: 'index',
    component: () => import('../Index.vue'),
    children: [
      {
        path: '/user',
        name: 'user',
        meta: {
          title: '用户信息'
        },
        component: () => import('../views/User.vue')
      },
      {
        path: '/addUser',
        name: 'addUser',
        meta: {
          title: '添加用户'
        },
        component: () => import('../views/AddUser.vue')
      },
      {
        path: '/bloodTestResult',
        name: 'bloodTestResult',
        meta: {
          title: '抽血项目'
        },
        component: () => import('../views/BloodTestResult.vue')
      },
      {
        path: '/bloodTestProject',
        name: 'bloodTestProject',
        meta: {
          title: '抽血项目'
        },
        component: () => import('../views/BloodTestProject.vue')
      },
      {
        path: '/addMedicine',
        name: 'addMedicine',
        meta: {
          title: '添加药物'
        },
        component: () => import('../views/AddMedicine.vue')
      },
      {
        path: '/medicine',
        name: 'medicine',
        meta: {
          title: '药物'
        },
        component: () => import('../views/Medicine.vue')
      },
      // {
      //   path: '/uploadTest',
      //   name: 'uploadTest',
      //   meta: {
      //     title: '上传测试'
      //   },
      //   component: () => import('../views/UploadTest.vue')
      // },
      {
        path: '/test',
        name: 'tTest',
        meta: {
          title: '上传测试'
        },
        component: () => import('../views/Test.vue')
      },
    ]
  }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
