import axios from 'axios'
import store from '@/store'
import {API_BASE_URL} from "@/tool/config";

// 创建 axios 实例
const request = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
})

// 请求拦截器 - 自动添加 Token
request.interceptors.request.use(
    config => {
        const token = store.state.token || localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 响应拦截器 - 处理 Token 过期
request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        if (error.response) {
            // 401: Token 过期或未登录
            if (error.response.status === 401) {
                store.dispatch('logout')
                // 跳转到登录页
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login'
                }
            }
        }
        return Promise.reject(error)
    }
)

export default request