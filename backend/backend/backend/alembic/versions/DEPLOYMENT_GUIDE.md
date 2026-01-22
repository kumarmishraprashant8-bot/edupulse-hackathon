# EduPulse Deployment Guide

## Quick Start (Local Development)

```bash
# 1. Clone repository
git clone <repo-url>
cd edupulse-mvp

# 2. Set environment variables
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Wait for services (30-60 seconds)
# Watch for: "INFO: Application startup complete"

# 5. Seed sample data
docker-compose exec backend python /app/data/seed_data.py

# 6. Access application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

## Production Deployment

### Option 1: Cloud VM (DigitalOcean, AWS EC2, GCP)

**Requirements:**
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Docker & Docker Compose installed

```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# 4. Clone repository
git clone <repo-url>
cd edupulse-mvp

# 5. Configure production environment
cp .env.example .env
nano .env  # Edit with production values

# 6. Update docker-compose for production
# - Use PostgreSQL (not SQLite)
# - Set strong SECRET_KEY
# - Configure domain for CORS

# 7. Start services
docker-compose up -d

# 8. Set up reverse proxy (Nginx)
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/edupulse
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/edupulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 9. Set up SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Heroku

**Backend:**
```bash
# Create Heroku app
heroku create edupulse-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set FRONTEND_URL=https://edupulse-frontend.herokuapp.com

# Deploy
git subtree push --prefix backend heroku main
```

**Frontend:**
```bash
# Create frontend app
heroku create edupulse-frontend

# Set build pack
heroku buildpacks:set heroku/nodejs

# Set environment
heroku config:set REACT_APP_API_URL=https://edupulse-backend.herokuapp.com

# Deploy
git subtree push --prefix frontend heroku main
```

### Option 3: Railway.app

1. Connect GitHub repository
2. Create two services:
   - Backend (FastAPI)
   - Frontend (React)
3. Add PostgreSQL database
4. Set environment variables via Railway dashboard
5. Deploy automatically on git push

### Option 4: Docker Swarm (Multi-Node)

```bash
# Initialize swarm
docker swarm init

# Create production compose file
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: edupulse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: edupulse
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]

  backend:
    image: your-registry/edupulse-backend:latest
    environment:
      DATABASE_URL: postgresql://edupulse:${DB_PASSWORD}@db:5432/edupulse
      SECRET_KEY: ${SECRET_KEY}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure

  frontend:
    image: your-registry/edupulse-frontend:latest
    deploy:
      replicas: 2

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]

volumes:
  postgres_data:
```

```bash
# Deploy stack
docker stack deploy -c docker-compose.prod.yml edupulse
```

## Database Backups

### Automated PostgreSQL Backups

```bash
# Create backup script
nano /opt/backup-edupulse.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/backups/edupulse"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="edupulse_$DATE.sql"

mkdir -p $BACKUP_DIR

docker exec edupulse-db pg_dump -U edupulse edupulse > "$BACKUP_DIR/$FILENAME"
gzip "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME.gz"
```

```bash
# Make executable
chmod +x /opt/backup-edupulse.sh

# Add to cron (daily at 2 AM)
crontab -e
# Add line:
0 2 * * * /opt/backup-edupulse.sh
```

### Restore from Backup

```bash
# Stop backend
docker-compose stop backend

# Restore database
gunzip -c /backups/edupulse/edupulse_20260121_020000.sql.gz | \
  docker exec -i edupulse-db psql -U edupulse edupulse

# Restart
docker-compose start backend
```

## Monitoring & Logging

### Set Up Monitoring with Prometheus + Grafana

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### Centralized Logging

```bash
# Install Loki + Promtail for log aggregation
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions

# Update docker-compose to use loki driver
```

### Application Health Checks

Add to your monitoring:
```bash
# Backend health
curl http://localhost:8000/health

# Database connection
docker-compose exec backend python -c "from app.database import engine; engine.connect()"

# Frontend build
curl http://localhost:3000
```

## Scaling

### Horizontal Scaling

```yaml
# Scale backend instances
version: '3.8'
services:
  backend:
    deploy:
      replicas: 5
    
  # Add load balancer
  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

### Database Read Replicas

For high traffic:
```yaml
  db:
    image: postgres:15-alpine
    # Primary database
  
  db-replica:
    image: postgres:15-alpine
    environment:
      POSTGRES_PRIMARY_HOST: db
    # Configure as read replica
```

## Security Hardening

### 1. Environment Variables
```bash
# Use secrets management
docker secret create db_password ./db_password.txt
docker secret create secret_key ./secret_key.txt
```

### 2. Network Security
```yaml
# Restrict network access
networks:
  frontend:
  backend:
    internal: true  # No external access
```

### 3. SSL/TLS
```bash
# Enforce HTTPS
# Update Nginx config to redirect HTTP to HTTPS
```

### 4. Rate Limiting
```python
# Add to backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### 5. Firewall Rules
```bash
# UFW configuration
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait 10 more seconds
# 2. Port 8000 in use - change port in docker-compose
# 3. Missing dependencies - rebuild: docker-compose build --no-cache
```

### Frontend can't reach backend
```bash
# Check CORS settings in backend/app/main.py
# Verify REACT_APP_API_URL in frontend/.env
# Check browser console for errors
```

### Database connection errors
```bash
# Check database is running
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up -d db
# Wait 10 seconds
docker-compose up backend
```

### WhatsApp webhook not working
```bash
# 1. Verify ngrok is running
ngrok http 8000

# 2. Update Twilio webhook URL with ngrok URL
# 3. Check backend logs for incoming requests
docker-compose logs -f backend | grep webhook
```

## Performance Optimization

### 1. Database Indexing
Already included in models, but monitor slow queries:
```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Caching
Add Redis for caching:
```yaml
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### 3. CDN for Static Files
- Use Cloudflare or AWS CloudFront
- Serve exports and media from CDN
- Reduce backend load

### 4. Database Connection Pooling
Already configured in SQLAlchemy, but adjust pool size:
```python
# In database.py
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=20,
    max_overflow=40
)
```

## Maintenance Windows

Schedule regular maintenance:
```bash
# Weekly maintenance script
#!/bin/bash
# 1. Backup database
/opt/backup-edupulse.sh

# 2. Clean old exports (older than 90 days)
find /app/backend/exports -mtime +90 -delete

# 3. Vacuum database
docker exec edupulse-db vacuumdb -U edupulse -d edupulse -z

# 4. Restart services for memory cleanup
docker-compose restart
```

## Support Contacts

- **Technical Issues**: Create GitHub issue
- **Security Concerns**: security@edupulse.edu
- **General Questions**: support@edupulse.edu

---

**Last Updated**: January 2026  
**Version**: 1.0.0