# 阶段1：构建应用程序
FROM node:20-bullseye AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 配置pnpm使用国内镜像源
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm config set disturl https://npmmirror.com/mirrors/node
RUN pnpm config set electron_mirror https://npmmirror.com/mirrors/electron/

# 复制package.json和pnpm-lock.yaml（如果存在）
COPY package.json pnpm-lock.yaml* ./

# 安装依赖
RUN pnpm install

# 复制所有文件
COPY . .

# 创建nginx配置目录和配置文件
RUN mkdir -p /app/nginx
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    client_max_body_size 0; \
    # 启用gzip压缩 \
    gzip on; \
    gzip_comp_level 6; \
    gzip_min_length 256; \
    gzip_proxied any; \
    gzip_vary on; \
    gzip_types \
        text/plain \
        text/css \
        text/xml \
        text/javascript \
        application/javascript \
        application/x-javascript \
        application/json \
        application/xml \
        application/xml+rss \
        application/vnd.ms-fontobject \
        application/x-font-ttf \
        font/opentype \
        image/svg+xml; \
    location ^~ /api/ { \
        proxy_pass http://api:3000/api/; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
    } \
    # HTML文件 - 确保每次都重新获取 \
    location ~ \.html$ { \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
        try_files $uri $uri/ /index.html; \
    } \
    # JavaScript和CSS文件 - 确保每次都重新验证 \
    location ~* \.(js|css)$ { \
        add_header Cache-Control "no-cache"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
        access_log off; \
    } \
    # 其他静态资源 (使用长缓存) \
    location ~* \.(png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 7d; \
        add_header Cache-Control "public, max-age=604800"; \
        access_log off; \
    } \
    location / { \
        try_files $uri $uri/ /index.html; \
        add_header Cache-Control "no-cache, no-store, must-revalidate"; \
        add_header Pragma "no-cache"; \
        add_header Expires "0"; \
    } \
    add_header X-Frame-Options "SAMEORIGIN"; \
    add_header X-Content-Type-Options "nosniff"; \
    add_header X-XSS-Protection "1; mode=block"; \
    add_header Referrer-Policy "strict-origin-when-cross-origin"; \
    error_page 404 /index.html; \
    error_page 500 502 503 504 /50x.html; \
    location = /50x.html { \
        root /usr/share/nginx/html; \
    } \
}' > /app/nginx/nginx.conf

# 构建应用程序
RUN pnpm build

# 阶段2：配置Nginx服务
FROM nginx:stable-alpine

# 设置工作目录
WORKDIR /usr/share/nginx/html

# 从构建阶段复制构建产物
COPY --from=builder /app/dist .

# 复制Nginx配置文件
COPY --from=builder /app/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# 暴露80端口
EXPOSE 8888

# 启动Nginx服务
CMD ["nginx", "-g", "daemon off;"] 
