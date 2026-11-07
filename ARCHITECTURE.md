# GreenCity – Cloud Architecture & System Design Documentation

## 1. High-Level Architecture Overview

GreenCity is a cloud-native, full-stack smart waste management and complaint tracking platform designed according to the AWS Well-Architected Framework principles (Security, Reliability, Performance Efficiency, and Cost Optimization).

### Deployment Strategy: Two Distinct Environments
1. **Public Edge Demonstration (Stage 1 - Verified):**
   - **URL:** `https://arena-vip-spa-democrats.trycloudflare.com`
   - **Purpose:** Immediate public internet accessibility for college evaluation and mobile testing without firewall exposure.
   - **Status:** **Active & Verified (24/24 integration tests passed)**.
2. **AWS Production Infrastructure (Stage 2 - IaC Codified):**
   - **Template:** `aws/cloudformation.yaml` | **Deployment Automation:** `aws/deploy.ps1`
   - **Purpose:** Permanent cloud deployment on AWS VPC, EC2, RDS MySQL, S3, SSM, and CloudWatch.
   - **Status:** **Ready for AWS Academy / Learner Lab activation**.

### AWS Production Architecture Diagram

```mermaid
flowchart TD
    subgraph Internet ["Public Internet"]
        Citizen["Citizens / Mobile Users"]
        Admin["Municipal Admins / Staff"]
    end

    subgraph AWS ["Amazon Web Services (AWS Region: us-east-1)"]
        subgraph VPC ["Custom VPC (10.0.0.0/16)"]
            IGW["Internet Gateway"]
            
            subgraph PublicSubnets ["Public Subnets (AZ-A: 10.0.1.0/24 | AZ-B: 10.0.2.0/24)"]
                EC2["EC2 Application Server (t3.micro)\n- Node.js / Express API (Port 5000)\n- Vite Production Frontend (Port 80)\n- CloudWatch Logger Agent"]
            end

            subgraph PrivateSubnets ["Private Subnets (AZ-A: 10.0.10.0/24 | AZ-B: 10.0.11.0/24)"]
                RDS[("Amazon RDS MySQL 8.0\n(db.t3.micro)\n- Multi-AZ DB Subnet Group\n- Isolated from Public Internet")]
            end
        end

        subgraph CloudServices ["AWS Managed Services"]
            S3[("Amazon S3 Bucket\n- Private Object Storage\n- Complaint Photos\n- Pre-signed URL Retrieval")]
            SSM["AWS Systems Manager\nParameter Store\n- DB Host / User / Pass\n- JWT Secret Key\n- S3 Bucket Name"]
            CW["Amazon CloudWatch\n- Log Group: /greencity/backend\n- Metrics: 5xxErrors, APILatency, Submissions\n- Alarms: High5xxErrors, HighLatency"]
            Budget["AWS Budgets\n- $10/month Spending Cap\n- 80% & 100% Alert Thresholds"]
        end
    end

    Citizen -->|HTTP:80 / API:5000| IGW
    Admin -->|HTTP:80 / API:5000| IGW
    IGW -->|Route Table 0.0.0.0/0| EC2

    EC2 -->|MySQL Port 3306 (Restricted SG)| RDS
    EC2 -->|IAM Least Privilege / S3 SDK| S3
    EC2 -->|IAM Role / Parameter Retrieval| SSM
    EC2 -->|CloudWatch SDK / Metrics & Logs| CW
```

---

## 2. Network Isolation & Security Design

| Layer | Component | CIDR / Configuration | Purpose |
|---|---|---|---|
| **VPC** | Custom VPC | `10.0.0.0/16` | Dedicated private network space |
| **Internet Gateway** | `greencity-igw` | Attached to VPC | Inbound/outbound traffic routing for public subnets |
| **Public Subnet 1** | `10.0.1.0/24` | `us-east-1a` | Hosts EC2 web application server |
| **Public Subnet 2** | `10.0.2.0/24` | `us-east-1b` | Redundant public tier for ALB/scaling |
| **Private Subnet 1** | `10.0.10.0/24` | `us-east-1a` | RDS MySQL primary instance |
| **Private Subnet 2** | `10.0.11.0/24` | `us-east-1b` | RDS DB Subnet Group redundancy |
| **Route Table (Public)** | `greencity-public-rt` | `0.0.0.0/0 -> IGW` | Public internet connectivity |
| **Route Table (Private)**| `greencity-private-rt` | Local VPC only | Zero direct internet exposure for database |

---

## 3. Security Groups (Least Privilege Firewall)

### 1. `AppSecurityGroup` (EC2 Application Server)
- **Inbound Rules:**
  - `TCP 80` (HTTP) from `0.0.0.0/0` (Frontend client traffic)
  - `TCP 5000` (API) from `0.0.0.0/0` (REST API traffic)
  - `TCP 22` (SSH) from Admin IP / VPC (Server maintenance)
- **Outbound Rules:**
  - All outbound traffic allowed (`0.0.0.0/0`) for AWS SDK calls and software updates.

### 2. `RDSSecurityGroup` (Amazon RDS MySQL)
- **Inbound Rules:**
  - `TCP 3306` (MySQL) **ONLY** from `AppSecurityGroup` (`sg-xxxx`). No direct public internet access.
- **Outbound Rules:**
  - Standard VPC egress.

---

## 4. Secure Secrets Management (SSM Parameter Store)

In accordance with Cloud Security Best Practices, passwords and sensitive keys are **NEVER hardcoded** or committed into source control repositories.

| Parameter Name | Type | Encrypted | Description |
|---|---|---|---|
| `/greencity/prod/db_host` | String | No | RDS MySQL DNS endpoint address |
| `/greencity/prod/db_user` | String | No | Master database username |
| `/greencity/prod/db_password` | SecureString | Yes | RDS master password |
| `/greencity/prod/db_name` | String | No | Database name (`greencity`) |
| `/greencity/prod/db_port` | String | No | MySQL port (`3306`) |
| `/greencity/prod/jwt_secret` | SecureString | Yes | 256-bit cryptographic signing secret for JWT tokens |
| `/greencity/prod/s3_bucket` | String | No | Amazon S3 bucket name for photo uploads |

At server launch, the Node.js backend automatically invokes `loadSSMParameters()` via the AWS SDK using the EC2 instance profile (`LabRole` / `GreenCityEC2Role`), decrypts the parameters in memory, and initializes the connection pool.

---

## 5. Amazon S3 Image Storage & Presigned URLs

1. **Upload Workflow:**
   - Citizen uploads a JPEG/PNG/WEBP photo of overflowing waste or illegal dumping (up to 5 MB).
   - Backend performs magic-byte signature validation in `utils/storage.js` to prevent malicious file uploads.
   - The file is saved directly to the private S3 bucket `greencity-complaints-<account-id>-<region>` under the key `complaints/<uuid>.<ext>`.
2. **Access Security:**
   - S3 **Block All Public Access** is set to `TRUE`.
   - When retrieving complaints for display, the backend generates short-lived **Pre-signed URLs** (`expiresIn: 3600s`) using `@aws-sdk/s3-request-presigner`.
   - The private bucket is never exposed publicly to the web.

---

## 6. CloudWatch Observability & Monitoring

### Metrics Emitted to Namespace `GreenCity/Application`:
- `APIRequests` (Count): Total requests hitting the API.
- `APILatency` (Milliseconds): API endpoint response latency.
- `5xxErrors` (Count): Server-side unhandled errors.
- `ComplaintSubmissions` (Count): Number of citizen complaints submitted.
- `ComplaintResolutions` (Count): Number of citizen complaints marked resolved.

### CloudWatch Alarms:
1. **`GreenCityHigh5xxErrors`**:
   - Alarm triggers if `Sum(5xxErrors) >= 3` within 5 minutes.
   - Identifies backend failure, database disconnect, or uncaught exceptions.
2. **`GreenCityHighAPILatency`**:
   - Alarm triggers if `Average(APILatency) >= 1500ms` within 5 minutes.
   - Detects database lock contention or server overloading.

---

## 7. Cloud Budget & Cost Management

- Configured monthly budget: **$10.00 USD**.
- Actual spend alert triggered at **80% ($8.00)**.
- Forecasted spend alert triggered at **100% ($10.00)**.
- Email alert sent to municipal project administrator.
