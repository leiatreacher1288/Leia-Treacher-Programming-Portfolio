# Nginx Service

## Overview

The Nginx service provides reverse proxy functionality for ExamVault, acting as the primary entry point for all web traffic. It handles routing between the frontend React application and backend Django API, provides SSL termination, and implements security headers and rate limiting.

## 🏗️ Architecture

### Service Configuration

**Primary Functions:**
- **Reverse Proxy**: Routes traffic to appropriate services
- **Load Balancing**: Distributes requests across multiple instances
- **SSL Termination**: Handles HTTPS encryption
- **Security Headers**: Implements security best practices
- **Rate Limiting**: Prevents abuse and DDoS attacks

**Routing Rules:**
- `/api/*` → Django Backend (Port 8000)
- `/admin/*` → Django Admin (Port 8000)
- `/static/*` → Django Static Files (Port 8000)
- `/_vite_hmr` → Vite HMR (Port 5173)
- `/*` → React Frontend (Port 5173)

## 📁 Configuration Files

### nginx.conf
Main Nginx configuration file with server blocks and routing rules.

**Key Features:**
- **Upstream Definitions**: Backend and frontend service definitions
- **Server Blocks**: Virtual host configuration
- **Location Blocks**: URL routing rules
- **Security Headers**: Comprehensive security configuration
- **Rate Limiting**: Request rate limiting rules

### SSL Configuration
Optional SSL configuration for production deployments.

**Features:**
- **Certificate Management**: SSL certificate handling
- **HTTP/2 Support**: Modern protocol support
- **OCSP Stapling**: Certificate validation optimization
- **HSTS Headers**: Security header implementation

## 🔧 Configuration Details

### Upstream Services

```nginx
# Backend service (Django)
upstream backend {
    server backend:8000;
    keepalive 32;
}

# Frontend service (React/Vite)
upstream frontend {
    server frontend:5173;
    keepalive 32;
}
```

### Server Block Configuration

```nginx
server {
    listen 80;
    server_name localhost;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # API routes
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Admin routes
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /static/ {
        proxy_pass http://backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Vite HMR
    location /_vite_hmr {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 Features

### Reverse Proxy
- **Service Routing**: Intelligent routing to appropriate services
- **Load Balancing**: Distributes requests across multiple instances
- **Health Checks**: Monitors backend service health
- **Failover**: Automatic failover to healthy instances

### Security Features
- **Security Headers**: Comprehensive security header implementation
- **Rate Limiting**: Request rate limiting and abuse prevention
- **DDoS Protection**: Basic DDoS attack mitigation
- **CORS Handling**: Cross-origin resource sharing configuration
- **Request Filtering**: Malicious request filtering

### Performance Optimization
- **Connection Pooling**: Efficient connection management
- **Caching**: Static file caching and optimization
- **Compression**: Gzip compression for text-based content
- **Keep-Alive**: Persistent connection optimization

### Monitoring & Logging
- **Access Logs**: Comprehensive request logging
- **Error Logs**: Detailed error logging and monitoring
- **Metrics**: Performance metrics collection
- **Health Monitoring**: Service health monitoring

## 🛠️ Usage Examples

### Development Configuration

```bash
# Start nginx with development config
docker-compose up nginx

# View nginx logs
docker-compose logs nginx

# Test nginx configuration
docker-compose exec nginx nginx -t
```

### Production Configuration

```bash
# Start with SSL certificates
docker-compose -f docker-compose.prod.yml up nginx

# Reload configuration
docker-compose exec nginx nginx -s reload

# Check nginx status
docker-compose exec nginx nginx -t
```

### Custom Configuration

```bash
# Mount custom nginx config
docker run -v ./custom-nginx.conf:/etc/nginx/nginx.conf nginx:alpine

# Use custom SSL certificates
docker run -v ./ssl:/etc/nginx/ssl nginx:alpine
```

## 🔒 Security Configuration

### Security Headers

```nginx
# Security headers configuration
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
```

### Rate Limiting

```nginx
# Rate limiting configuration
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://backend;
}

location /api/auth/login/ {
    limit_req zone=login burst=5 nodelay;
    proxy_pass http://backend;
}
```

### SSL Configuration

```nginx
# SSL configuration for production
server {
    listen 443 ssl http2;
    server_name examvault.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

## 🧪 Testing

### Configuration Testing

```bash
# Test nginx configuration
docker-compose exec nginx nginx -t

# Test with custom config
docker run --rm -v ./nginx.conf:/etc/nginx/nginx.conf nginx:alpine nginx -t
```

### Load Testing

```bash
# Basic load testing
ab -n 1000 -c 10 http://localhost/

# API load testing
ab -n 1000 -c 10 http://localhost/api/health/

# Concurrent connection testing
siege -c 100 -t 30S http://localhost/
```

## 📈 Performance Considerations

### Optimization Settings

```nginx
# Performance optimization
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
keepalive_requests 100;

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
```

### Caching Configuration

```nginx
# Static file caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary Accept-Encoding;
}
```

## 🔄 Migration History

### Recent Changes
- **v1.0**: Initial nginx configuration
- **v1.1**: Added security headers
- **v1.2**: Implemented rate limiting
- **v1.3**: Enhanced SSL configuration
- **v1.4**: Added monitoring and logging
- **v1.5**: Improved performance optimization

## 📚 Related Documentation

- [Docker Configuration](../docker-compose.yml)
- [SSL Setup Guide](../docs/deployment/ssl.md)
- [Security Configuration](../docs/deployment/security.md)
- [Performance Tuning](../docs/deployment/performance.md)

## 🤝 Contributing

When contributing to the nginx configuration:

1. **Security First**: Always consider security implications
2. **Test Configuration**: Validate configuration changes
3. **Performance**: Monitor performance impact
4. **Documentation**: Update configuration documentation
5. **Backup**: Always backup existing configurations

## 📞 Support

For issues related to the nginx service:
- Check the [nginx troubleshooting guide](../docs/deployment/nginx-troubleshooting.md)
- Review the [configuration documentation](../docs/deployment/nginx-config.md)
- Create an issue with the `nginx` label
