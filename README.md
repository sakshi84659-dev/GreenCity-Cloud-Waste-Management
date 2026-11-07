# GreenCity – Cloud-Based Smart Waste Management & Complaint Tracking System

A full-stack cloud computing project engineered for urban solid waste monitoring, fleet scheduling, GIS bin tracking, and citizen complaint redressal.

---

## 🌐 Deployment Status & Environments

GreenCity features two distinct deployment targets:

### 1. Stage 1: Verified Public Edge Demonstration (Live Cloudflare Tunnel)
- **Web Application URL:** **[https://arena-vip-spa-democrats.trycloudflare.com](https://arena-vip-spa-democrats.trycloudflare.com)**
- **API Health Check:** `https://arena-vip-spa-democrats.trycloudflare.com/api/health`
- **Database Status:** `https://arena-vip-spa-democrats.trycloudflare.com/api/db-check`
- **Admin Authentication:** Provisioned administrator account (Credentials stored in secure `.env`)
- **Status:** **Active & 100% Verified (24/24 automated integration tests passed)**
- **Security Notice:** All test credentials have been flagged for rotation. Passwords are never committed or exposed in documentation.

### 2. Stage 2: AWS Academy Production Cloud Infrastructure (Automated IaC)
- **Infrastructure as Code:** `aws/cloudformation.yaml`
- **One-Click Deploy Script:** `aws/deploy.ps1` (PowerShell) / `aws/deploy.sh` (Bash)
- **Architecture:** Custom VPC (`10.0.0.0/16`), 2 Public Subnets, 2 Private Subnets, EC2 (`t3.micro`), RDS MySQL (`db.t3.micro`), S3 Bucket, SSM Parameter Store (`/greencity/prod/*`), CloudWatch Logs & Alarms.
- **AWS Academy Compatibility:** Pre-configured with `LabInstanceProfile` / `LabRole` (no SCP role creation block).
- **Status:** **Ready for AWS Academy Learner Lab activation**.

---

## 🌟 Key Functional Features

- **Executive Analytics Dashboard:** Real-time metrics on waste volume, fleet availability, resolution rates, and recent activity.
- **Citizen Complaint Redressal:** Submit complaints with photo evidence, tracked across `Pending`, `In Progress`, and `Resolved` stages.
- **Fleet & Vehicle Tracking:** Manage compactor and tipper trucks with tonnage capacity and driver assignment.
- **Collection Schedules:** Schedule and track waste collections by locality and waste classification (Organic, Plastic, Recyclable).
- **GIS Bin Mapping:** Interactive map visualization with Leaflet and OpenStreetMap tiles.
- **Enterprise Cloud Security:** Custom AWS VPC, isolated RDS MySQL, S3 pre-signed URLs, SSM Parameter Store secrets, and CloudWatch alarms.
- **Role-Based Access Control (RBAC):** Bcrypt password hashing (cost 12) with signed JSON Web Tokens (JWT).

---

## 🏗️ Architecture Stack

- **Frontend:** React 19, Vite, Lucide Icons, Leaflet GIS, Recharts.
- **Backend:** Node.js, Express, Multer, AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/client-ssm`, `@aws-sdk/client-cloudwatch`, `@aws-sdk/client-cloudwatch-logs`).
- **Database:** MySQL 8.0 (Local & Amazon RDS).
- **Cloud Infrastructure:** AWS CloudFormation (VPC, Subnets, EC2, RDS, S3, SSM, CloudWatch, Budgets) + Cloudflare Anycast Edge.

---

## 🧪 Automated System Test Suite (24/24 PASS)

Run the automated integration test suite against the live deployment or local server:

```bash
cd backend
# Against public cloud deployment:
$env:TEST_URL="https://arena-vip-spa-democrats.trycloudflare.com"
node test_suite.js

# Against local server:
$env:TEST_URL="http://localhost:5000"
node test_suite.js
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+)

### 2. Database Initialization
```bash
# Connect to your local MySQL server
mysql -u root -p

# Create database and user (replace <YourSecurePassword> with your chosen password)
CREATE DATABASE greencity;
CREATE USER 'greencity_user'@'localhost' IDENTIFIED BY '<YourSecurePassword>';
GRANT ALL PRIVILEGES ON greencity.* TO 'greencity_user'@'localhost';
FLUSH PRIVILEGES;

# Run migration
mysql -u greencity_user -p greencity < backend/migrations/001_complaints_upgrade.sql
```

### 3. Unified Server Startup
The Node.js backend serves both the compiled React frontend SPA and the REST API from port 5000:
```bash
cd backend
npm install
node server.js
```
The application opens on `http://localhost:5000`.

---

## ☁️ AWS Cloud Deployment (When Running on AWS Academy)

1. When deploying to AWS Academy / Learner Lab, activate your lab and ensure credentials are set in `~/.aws/credentials`.
2. Run automated CloudFormation deployment:
   ```powershell
   # PowerShell
   .\aws\deploy.ps1
   ```
   ```bash
   # Bash
   ./aws/deploy.sh
   ```

---

## 👤 Student & Project Details

- **Student Name:** Sakshi
- **Roll Number:** 10895
- **Department:** Computer Engineering
- **College:** Fr. Conceicao Rodrigues College of Engineering, Bandra (West), Mumbai – 400 050
- **Academic Year:** 2026–2027
- **Project Type:** Individual Mini Project
