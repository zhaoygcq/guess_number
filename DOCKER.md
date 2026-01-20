# Docker 部署说明

## 构建和运行

### 方法 1: 使用 Docker Compose (推荐)

```bash
# 构建并启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down

# 重新构建并启动
docker-compose up -d --build
```

访问: http://localhost:8080

### 方法 2: 使用 Docker 命令

```bash
# 构建镜像
docker build -t guess-number:latest .

# 运行容器
docker run -d -p 80:80 --name guess-number-app guess-number:latest

# 查看日志
docker logs -f guess-number-app

# 停止容器
docker stop guess-number-app

# 删除容器
docker rm guess-number-app
```

访问: http://localhost:8080

## 环境变量

如果需要自定义端口，可以修改 `docker-compose.yml` 中的 `ports` 配置：

```yaml
ports:
  - "3000:80"  # 将宿主机的 3000 端口映射到容器的 80 端口
```

## 文件结构

```
.
├── Dockerfile              # Docker 构建文件
├── docker-compose.yml      # Docker Compose 配置
├── nginx.conf              # Nginx 配置文件
├── .dockerignore           # Docker 忽略文件
├── DOCKER.md               # 本文件
└── dist/                   # 构建产物 (自动生成)
```

## Nginx 配置说明

- 启用了 Gzip 压缩
- 支持单页应用 (SPA) 路由
- 静态资源缓存 1 年
- 禁止访问隐藏文件

## 端口映射

- 容器内部: 80
- 宿主机默认: 8080

## 常见问题

### 1. 端口被占用

修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "8081:80"  # 使用其他端口
```

### 2. 构建失败

确保 Docker 有足够的内存（至少 2GB）用于构建。

### 3. 页面无法访问

检查容器状态：

```bash
docker ps
docker logs guess-number-app
```

## 生产环境部署

### 使用自定义域名

1. 修改 `nginx.conf` 中的 `server_name`
2. 配置 DNS 解析
3. 使用 Let's Encrypt 配置 HTTPS

### 使用反向代理

如果使用 Nginx 作为反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 性能优化

### 启用 Brotli 压缩

在 Nginx 配置中添加：

```nginx
brotli on;
brotli_comp_level 6;
brotli_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
```

### 增加缓存

对于静态资源，可以增加缓存时间：

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 监控

查看容器资源使用：

```bash
docker stats guess-number-app
```

## 备份和恢复

### 备份镜像

```bash
docker save guess-number:latest > guess-number.tar
```

### 恢复镜像

```bash
docker load < guess-number.tar
```
