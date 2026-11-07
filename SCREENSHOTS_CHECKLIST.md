# GreenCity – College Submission Screenshots Checklist

This checklist provides the exact screenshots needed for your formal mini-project report, presentation slides (PPT), and faculty demonstration viva.

---

## Part A: Public Application & User Interface (Live on Cloud)

**Target URL:** [https://arena-vip-spa-democrats.trycloudflare.com](https://arena-vip-spa-democrats.trycloudflare.com) (or `http://localhost:5000`)  
**Admin Authentication:** Configured Administrator account (Credentials stored in local `.env`, flagged for rotation)

- [ ] **1. Admin Login Screen (`/`):**
  - Showing GreenCity branding, email and password input fields, and "Authorized Admin access only" notice.
- [ ] **2. Executive Dashboard Overview (`Dashboard` Tab):**
  - Stat cards: Total Waste (Tons), Active Fleet, Fuel Usage (L), Total Complaints, Resolved Complaints.
  - Weekly Waste Collection bar chart.
  - Complaint Status breakdown (Pending, In Progress, Resolved) with animated percentage progress bar.
  - Vehicle Status summary and waste categories breakdown (Organic, Plastic, Recyclable).
  - Recent Complaints activity feed.
- [ ] **3. Complaints & Complaint Tracking (`Complaints` Tab):**
  - New Complaint submission form with photo preview dropzone.
  - Complaints filter toolbar showing real-time search, category dropdown, and status dropdown.
  - Complaints table with ID, Citizen Name, Location, Category, Status badge, Photo Thumbnail, and Action buttons (View Details / Delete).
  - Complaint Detail Modal showing photo, timestamps, and status updater (`Pending` -> `In Progress` -> `Resolved`).
- [ ] **4. Fleet & Vehicle Management (`Vehicles` Tab):**
  - Add Vehicle form (Vehicle Number, Type, Driver Name, Phone, Capacity in Tons, Status).
  - Fleet table with status badges (Active, Inactive, Maintenance) and action controls.
- [ ] **5. Waste Collection Scheduling (`Waste Collection` Tab):**
  - Schedule form (Location, Waste Type, Quantity, Date, Assigned Vehicle).
  - Status progression table (Scheduled, Collected, Pending).
- [ ] **6. Collection Locations & GIS Map (`Collection Locations` Tab):**
  - Interactive Leaflet map displaying pinned waste bins across city coordinates.
  - Location detail list with bin capacities and fill level statuses (Active, Full).
- [ ] **7. Reports & Visual Analytics (`Reports & Analytics` Tab):**
  - Recharts visual graphs:
    - Complaints Status pie chart.
    - Monthly Collection trend line chart.
    - Waste Quantity by Category bar chart.
- [ ] **8. User Management & RBAC (`Users` Tab):**
  - Admin view of staff and administrator accounts with roles and active statuses.
- [ ] **9. Admin Profile Settings (`Settings` Tab):**
  - Profile update form demonstrating administrator name and email modification.

---

## Part B: Live Cloud Connectivity & Network Probes

- [ ] **10. Browser URL Bar & SSL Certificate:**
  - Screenshot of browser navigating to `https://arena-vip-spa-democrats.trycloudflare.com/` showing the green/secure padlock indicating valid Cloudflare Edge SSL.
- [ ] **11. Live API Health Probe:**
  - Browser or Postman/cURL output of `https://arena-vip-spa-democrats.trycloudflare.com/api/health` displaying `{"status":"healthy","service":"GreenCity Backend",...}`.
- [ ] **12. Live Database Connectivity Probe:**
  - Browser or Postman/cURL output of `https://arena-vip-spa-democrats.trycloudflare.com/api/db-check` displaying `{"status":"OK","database":"Connected",...}`.

---

## Part C: Automated Test Suite & Codebase Integrity

- [ ] **13. Automated Test Suite Execution (24/24 PASS):**
  - Terminal screenshot of `node backend/test_suite.js` executing with all 24 green passing test cases over the live Cloudflare endpoint.
- [ ] **14. Frontend Production Build:**
  - Terminal screenshot of `npm run build` inside `frontend/` showing Vite compiling client environment into `dist/` in under 2 seconds.
- [ ] **15. MySQL Database Tables:**
  - Terminal or MySQL Workbench screenshot showing `SHOW TABLES;` and `DESCRIBE complaints;` displaying the upgraded columns (`image_key`, `updated_at`, indices).
- [ ] **16. AWS CloudFormation Template & Deploy Scripts:**
  - VSCode screenshot showing `aws/cloudformation.yaml`, `aws/deploy.ps1`, and `aws/budget.json` structured according to college AWS requirements.

---

## Part D: AWS Cloud Management Console (Upon AWS Academy Stack Launch)

- [ ] **17. AWS CloudFormation Console:**
  - Screenshot showing stack `greencity-cloud-stack` with status `CREATE_COMPLETE` and the Outputs tab listing `EC2PublicIP`, `RDSEndpoint`, and `S3BucketName`.
- [ ] **18. Amazon EC2 Management Console:**
  - Screenshot of the running EC2 instance `greencity-app-server` (`t3.micro`) showing Public IPv4 and Security Group `greencity-app-sg`.
- [ ] **19. Amazon RDS Management Console:**
  - Screenshot of RDS MySQL database `greencity-rds-mysql` (`db.t3.micro`) showing status `Available`, VPC security group, and Multi-AZ subnet group.
- [ ] **20. Amazon S3 Console:**
  - Screenshot of the S3 bucket `greencity-complaints-<account-id>-<region>` showing "Bucket and objects not public".
- [ ] **21. AWS Systems Manager (SSM) Parameter Store:**
  - Screenshot showing `/greencity/prod/` parameters (`db_host`, `db_user`, `db_password`, `jwt_secret`, `s3_bucket`).
- [ ] **22. Amazon CloudWatch Logs & Alarms Console:**
  - Screenshot showing Log Group `/greencity/backend` and Alarms `GreenCityHigh5xxErrors` and `GreenCityHighAPILatency` in `OK` state.
