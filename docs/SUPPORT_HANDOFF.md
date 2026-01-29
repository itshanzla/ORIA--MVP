# ORIA MVP - Support Handoff Document

## 15-Day Support Period Overview

This document outlines the support coverage for the ORIA MVP during the 15-day support period following project handoff.

---

## Support Scope

### Included in Support

| Category | Coverage |
|----------|----------|
| **Bug Fixes** | Critical bugs affecting core functionality |
| **Configuration Issues** | Help with environment setup and deployment |
| **API Issues** | Debugging API endpoint problems |
| **Blockchain Integration** | Nexus connection and transaction issues |
| **Documentation Clarification** | Explaining code and architecture |

### Not Included

| Category | Reason |
|----------|--------|
| **New Features** | Outside MVP scope |
| **UI Redesign** | Outside MVP scope |
| **Third-party Issues** | Supabase outages, Nexus network issues |
| **Infrastructure Setup** | Server provisioning, SSL certificates |
| **Training** | Extended training sessions |

---

## Contact & Response Times

### Support Channel

Primary contact method: [To be defined - email/Slack/Discord]

### Response Times

| Priority | Response Time | Resolution Target |
|----------|--------------|-------------------|
| **Critical** (App down) | 4 hours | 24 hours |
| **High** (Feature broken) | 12 hours | 48 hours |
| **Medium** (Non-blocking) | 24 hours | 72 hours |
| **Low** (Questions) | 48 hours | Best effort |

### Availability

- Monday - Friday: 9 AM - 6 PM (your timezone)
- Weekends: Emergency only
- Holidays: Limited availability

---

## System Access Requirements

### Accounts Needed for Support

| Service | Access Level | Purpose |
|---------|--------------|---------|
| **GitHub/Git** | Read access to repo | Code review, debugging |
| **Supabase** | Dashboard access | Database/auth debugging |
| **Hosting Platform** | Logs access | Server error diagnosis |
| **Nexus Node** | SSH/API access | Blockchain debugging |

### Environment Information

Please provide:
- [ ] Staging/Production URLs
- [ ] API endpoint URLs
- [ ] Supabase project URL
- [ ] Nexus node URL and network (testnet/mainnet)
- [ ] Any custom configuration

---

## Known Issues & Limitations

### Current Limitations

1. **Session Expiry**
   - Nexus sessions expire after inactivity
   - Users may need to re-login for blockchain operations
   - **Mitigation**: Auto-refresh on API calls (future enhancement)

2. **Transaction Confirmation**
   - Blockchain confirmations take 10-60 seconds
   - Status may show "confirming" temporarily
   - **Mitigation**: Polling mechanism in place

3. **File Size Limits**
   - Audio files: 50MB max
   - Image files: 10MB max
   - **Mitigation**: Frontend validation

4. **Mock Mode Limitations**
   - Mock mode doesn't persist data across restarts
   - Some edge cases not simulated
   - **Mitigation**: Use testnet for realistic testing

### Known Bugs

| Issue | Status | Workaround |
|-------|--------|------------|
| None currently documented | - | - |

---

## Troubleshooting Guide

### Quick Fixes

#### 1. Backend won't start

```bash
# Check Node version (requires 18+)
node --version

# Clean install
cd backend
rm -rf node_modules
npm install

# Check .env file exists and has required values
cat .env
```

#### 2. Frontend won't start

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

#### 3. Database connection failed

1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`
2. Check Supabase project is active
3. Run database setup script if tables missing

#### 4. Nexus connection failed

1. Check `NEXUS_BASE_URL` in `.env`
2. For development: Set to `mock`
3. For testnet: Verify node is running and accessible
4. Check firewall allows connection

#### 5. Asset minting fails

1. Check user has valid Nexus session
2. Verify audio file is valid and under 50MB
3. Check backend logs for specific error
4. Try `/api/mint/retry/:id` endpoint

#### 6. Transfer fails

1. Verify sender owns the asset
2. Check recipient username exists
3. Verify sender has unlocked Nexus session
4. Check recipient has registered (has Nexus account)

---

## Deployment Checklist

### Before Going Live

- [ ] Change `NEXUS_BASE_URL` from `mock` to real node URL
- [ ] Verify `NEXUS_NETWORK=testnet` (or mainnet when approved)
- [ ] Set `NODE_ENV=production`
- [ ] Configure platform wallet for fee sponsorship (optional)
- [ ] Set up Supabase RLS policies
- [ ] Configure CORS for production domain
- [ ] Set up SSL certificates
- [ ] Configure proper logging
- [ ] Set up monitoring/alerts
- [ ] Backup database schema

### Production Environment Variables

```env
# Backend
PORT=3001
NODE_ENV=production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXUS_BASE_URL=http://your-nexus-node:8080
NEXUS_NETWORK=testnet
NEXUS_PLATFORM_USERNAME=platform_user
NEXUS_PLATFORM_PASSWORD=secure_password
NEXUS_PLATFORM_PIN=secure_pin

# Frontend
VITE_API_URL=https://api.yourdomain.com/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Maintenance Tasks

### Regular Maintenance

| Task | Frequency | How To |
|------|-----------|--------|
| Check error logs | Daily | Review hosting platform logs |
| Monitor disk space | Weekly | Check Supabase storage usage |
| Database backup | Weekly | Supabase auto-backups or manual export |
| Dependency updates | Monthly | `npm outdated`, then update carefully |
| Security patches | As needed | Watch for CVE alerts |

### Health Monitoring

#### API Health Check

```bash
curl http://localhost:3001/
# Should return: {"success":true,"message":"ORIA Backend API is running",...}
```

#### Nexus Connection Check

```bash
curl http://localhost:3001/api/nexus/status
# Should return node info and connection status
```

---

## Handoff Checklist

### Developer Has Received

- [ ] Complete source code access
- [ ] This documentation
- [ ] Postman collection (`ORIA-API.postman_collection.json`)
- [ ] Environment template files (`.env.example`)
- [ ] Database schema SQL
- [ ] Access to staging environment

### Client Has Provided

- [ ] Supabase project credentials
- [ ] Nexus node access details
- [ ] Hosting platform access
- [ ] Domain/DNS access (if applicable)
- [ ] Contact information for support

---

## Escalation Path

### Level 1: Developer Support (This Agreement)

- Bug fixes and configuration help
- Response within agreed timeframes

### Level 2: Extended Support (Separate Agreement)

- Feature development
- Performance optimization
- Architecture changes

### Level 3: External Services

| Service | Contact For |
|---------|-------------|
| Supabase Support | Database/Auth issues outside our control |
| Nexus Community | Blockchain network issues |
| Hosting Provider | Server/infrastructure issues |

---

## Post-Support Period

After the 15-day support period:

1. **Documentation** - All docs remain available
2. **Code** - Full source code ownership transfers
3. **Future Support** - Available at standard rates
4. **Updates** - Not included, available separately

---

## Appendix: Quick Reference

### API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| POST | `/api/mint` | Mint asset |
| GET | `/api/mint/my-assets` | User's assets |
| POST | `/api/mint/transfer` | Transfer asset |
| GET | `/api/tx/:hash` | Transaction lookup |

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthorized |
| 404 | Not found |
| 500 | Server error |

### Asset Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Not yet submitted |
| `registering` | Submitting to blockchain |
| `confirming` | Waiting for confirmations |
| `confirmed` | Fully confirmed |
| `failed` | Registration failed |
| `transfer_pending` | Transfer in progress |
| `transferred` | Ownership changed |

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Support Period: 15 days from handoff date*
