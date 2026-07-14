import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import VueRouter from 'vue-router'
import Vuex from 'vuex'
import router from './router'
import store from './store'
import App from './App.vue'
import './assets/global.css'

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.use(VueRouter)
Vue.use(Vuex)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')