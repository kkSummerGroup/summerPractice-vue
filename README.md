# summerPractice-vue
暑期实训小组-前端
# ntypro-ui

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


### 本地与远程部署
### 服务器端口号：39.106.228.188
如果想进行本地与远程部署之间的切换，只需前往==config.js==更改注释，在==application.yml==中更改本地/远程数据库，然后重启项目即可

### 前端：8012
npm.cmd run build 后将dist文件夹上传至服务器/var/www/html即可

### 后端：8031
1. mvn clean package 打包
2. scp target/ntyPro-api-0.0.1-SNAPSHOT.jar root@39.106.228.188:/var/www/springboot 上传至服务器

### 找到对应位置
cd /var/www/springboot
### 启动后端服务
java -jar ntyPro-api-0.0.1-SNAPSHOT.jar & (其中加&表示后台运行)
### 停止后端服务
pkill -f "java -jar ntyPro-api-0.0.1-SNAPSHOT.jar" 




