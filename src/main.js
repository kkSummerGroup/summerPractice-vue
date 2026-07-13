import Vue from 'vue'
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import VueRouter from 'vue-router';
import router from './router';
import App from './App.vue';
import './assets/global.css'

Vue.config.productionTip = false
Vue.use(ElementUI);
Vue.use(VueRouter);

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')  // 挂载到 #app 元素
