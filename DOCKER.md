# Docker 部署说明

## 构建和运行

### 使用 Docker 命令

#### 1. 构建镜像（带环境变量）

```bash
# 使用你的 Cloudflare Worker 地址
docker build \
  --build-arg VITE_RELAY_SERVER=wss://guess-number-relay.1060401583.workers.dev \
  -t guess-number:latest .
```

或者使用本地开发服务器：
```bash
docker build \
  --build-arg VITE_RELAY_SERVER=ws://localhost:8787 \
  -t guess-number:latest .
```

#### 2. 运行容器

```bash
docker run -d -p 8080:80 --name guess-number-app guess-number:latest
```

#### 3. 查看日志

```bash
docker logs -f guess-number-app
```

#### 4. 停止和清理

```bash
# 停止容器
docker stop guess-number-app

# 删除容器
docker rm guess-number-app

# 删除镜像（可选）
docker rmi guess-number:latest
```

访问: http://localhost:8080

## 环境变量

### VITE_RELAY_SERVER

这是构建时必须指定的环境变量，用于配置 WebSocket 中继服务器地址。

**必须在构建时指定：**

```bash
docker build --build-arg VITE_RELAY_SERVER=wss://your-relay-server.com ...
```

**常见值：**
- Cloudflare Worker: `wss://guess-number-relay.1060401583.workers.dev`
- 本地开发: `ws://localhost:8787`
- 自建服务器: `wss://your-domain.com`

### 自定义端口

如果需要修改容器端口映射：

```bash
docker run -d -p 3000:80 --name guess-number-app guess-number:latest
```

访问: http://localhost:3000

## 文件结构

```
.
├── Dockerfile              # Docker 构建文件
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
