import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        token: localStorage.getItem('token') || '',
        userInfo: (() => {
            try {
                const data = localStorage.getItem('userInfo')
                return data ? JSON.parse(data) : null
            } catch {
                return null
            }
        })()
    },

    mutations: {
        SET_TOKEN(state, token) {
            state.token = token
            localStorage.setItem('token', token)
        },

        SET_USER_INFO(state, userInfo) {
            state.userInfo = userInfo
            localStorage.setItem('userInfo', JSON.stringify(userInfo))
        },

        CLEAR_AUTH(state) {
            state.token = ''
            state.userInfo = null
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
        }
    },

    actions: {
        // 登录
        async login({ commit }, loginData) {
            try {
                const res = await import('@/api/auth').then(m => m.default.login(loginData))
                console.log('登录响应:', res)  // 调试日志

                // 根据后端返回格式调整
                const data = res.data || res

                if (data.token) {
                    commit('SET_TOKEN', data.token)
                    commit('SET_USER_INFO', {
                        userId: data.userId,
                        username: data.username,
                        role: data.role
                    })
                    return { success: true, data: data }
                }
                return { success: false, message: res.message || '登录失败' }
            } catch (error) {
                console.error('登录错误:', error)
                return {
                    success: false,
                    message: error.response?.data?.message || '登录失败，请检查网络'
                }
            }
        },

        // 退出登录
        logout({ commit }) {
            commit('CLEAR_AUTH')
        },

        // 验证 Token
        async verify({ state, commit }) {
            if (!state.token) {
                commit('CLEAR_AUTH')
                return false
            }
            try {
                const res = await import('@/api/auth').then(m => m.default.verify())
                console.log('验证响应:', res)  // 调试日志

                // 根据后端返回格式判断
                if (res && (res.success === true || res === true)) {
                    return true
                }
                commit('CLEAR_AUTH')
                return false
            } catch (error) {
                console.error('验证错误:', error)
                commit('CLEAR_AUTH')
                return false
            }
        }
    },

    getters: {
        isLoggedIn: state => !!state.token,
        currentUser: state => state.userInfo,
        username: state => state.userInfo?.username || '',
        userId: state => state.userInfo?.userId || '',
        role: state => state.userInfo?.role || 0
    }
})