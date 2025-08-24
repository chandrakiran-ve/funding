# VE Funds - Fundraising Intelligence System

A comprehensive fundraising dashboard for Vision Empower Trust built with Next.js, Clerk authentication, Google Sheets backend, and shadcn/ui components.

## 🎯 Features

### Multi-View Dashboard System
- **Org-wide Overview**: Total targets, secured funding, shortfall, and pipeline metrics
- **Funder-Centric Views**: Detailed funder profiles with contribution history and renewal tracking
- **State-Centric Views**: FY targets vs secured funding with school-level breakdowns
- **Pipeline Management**: Interactive kanban board with weighted projections
- **Analytics Dashboard**: Comprehensive insights with trends and performance metrics

### Key Capabilities
- **Fiscal Year Tracking**: Indian FY system (FY24-25, FY25-26, etc.)
- **INR Currency Display**: All amounts formatted in Indian Rupees
- **School-Level Granularity**: Track funding at individual school level within states
- **Prospect Pipeline**: Lead → Contacted → Proposal → Committed workflow
- **Performance Analytics**: Achievement rates, growth trends, and conversion metrics

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Lucide icons
- **Authentication**: Clerk (email/password + SSO)
- **Backend**: Google Sheets API with service account
- **Charts**: Recharts for data visualization
- **Deployment**: Vercel-ready

### Data Structure
The system uses Google Sheets with the following tabs:

#### Funders
| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique funder identifier |
| name | String | Funder organization name |
| type | String | Corporate Foundation, Private Foundation, etc. |
| priority | String | High, Medium, Low |
| owner | String | Relationship manager |

#### States
| Column | Type | Description |
|--------|------|-------------|
| code | String | State code (MH, KA, TN, etc.) |
| name | String | Full state name |
| coordinator | String | State coordinator name |

#### Schools
| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique school identifier |
| stateCode | String | Reference to States.code |
| name | String | School name |
| program | String | Primary Education, Vocational Training, etc. |

#### StateTargets
| Column | Type | Description |
|--------|------|-------------|
| stateCode | String | Reference to States.code |
| fiscalYear | String | FY24-25, FY25-26, etc. |
| targetAmount | Number | Target funding amount in INR |

#### Contributions
| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique contribution identifier |
| funderId | String | Reference to Funders.id |
| stateCode | String | Reference to States.code |
| schoolId | String | Reference to Schools.id (optional) |
| fiscalYear | String | FY24-25, FY25-26, etc. |
| date | String | Contribution date (YYYY-MM-DD) |
| initiative | String | Digital Learning, Teacher Training, etc. |
| amount | Number | Contribution amount in INR |

#### Prospects
| Column | Type | Description |
|--------|------|-------------|
| id | String | Unique prospect identifier |
| stateCode | String | Reference to States.code |
| funderName | String | Prospect funder name |
| stage | String | Lead, Contacted, Proposal, Committed |
| estimatedAmount | Number | Estimated funding amount in INR |
| probability | Number | Success probability (0.0 to 1.0) |
| nextAction | String | Required next action |
| dueDate | String | Action due date (YYYY-MM-DD) |
| owner | String | Prospect owner |

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- Google Cloud Platform account
- Clerk account

### 2. Google Sheets Setup
1. Create a new Google Sheet
2. Create tabs: `Funders`, `States`, `Schools`, `StateTargets`, `Contributions`, `Prospects`
3. Add column headers as specified in the data structure above

### 3. Google Service Account Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create a Service Account:
   - IAM & Admin → Service Accounts → Create
   - Grant "Editor" role or minimum "Google Sheets API" access
   - Create key → JSON format
5. Share your Google Sheet with the service account email (Viewer access)

### 4. Clerk Authentication Setup
1. Sign up at [Clerk](https://clerk.com/)
2. Create a new application
3. Get your publishable key and secret key
4. Configure sign-in/up methods as needed

### 5. Environment Configuration
Create `.env.local` in the project root:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Sheets (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id-from-url
```

### 6. Installation & Seeding
```bash
# Install dependencies
npm install

# Seed sample data (optional)
node scripts/seed-sheets.js

# Start development server
npm run dev
```

### 7. Production Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📊 Sample Data

The system includes a comprehensive seed script that populates your Google Sheets with realistic sample data:

- **8 Major Indian Funders**: Tata Trusts, Azim Premji Foundation, Infosys Foundation, etc.
- **8 States**: Maharashtra, Karnataka, Tamil Nadu, Andhra Pradesh, Telangana, Gujarat, Rajasthan, UP
- **20 Schools**: Distributed across states with different programs
- **Financial Data**: ₹27.5 crores target for FY24-25 with ₹8.8 crores secured (32.2% achievement)
- **Pipeline**: ₹11.1 crores total pipeline with ₹5.2 crores weighted value

Run `node scripts/test-data.js` to see the complete data structure and financial summary.

## 🎨 Dashboard Views

### Overview Dashboard
- Key metrics cards (Target, Secured, Shortfall, Pipeline)
- State performance grid with achievement indicators
- Top funders with contribution summaries
- Pipeline status by stage

### Funder Management
- **List View**: All funders with metrics, status, and data tables
- **Detail View**: Individual funder profile with:
  - Contribution history by fiscal year
  - State and school impact analysis
  - Renewal pattern insights
  - Contact information and actions

### State Management
- **List View**: All states with performance metrics and progress bars
- **Detail View**: Individual state profile with:
  - Multi-year FY performance tracking
  - School funding status breakdown
  - Active funders supporting the state
  - Coordinator information

### Pipeline Management
- **Kanban Board**: Visual pipeline with drag-drop cards
- **State Analysis**: Pipeline distribution across states
- **Action Tracking**: Upcoming actions with overdue alerts
- **Conversion Metrics**: Success rates and deal sizes

### Analytics Dashboard
- **Performance Analytics**: YoY growth, achievement rates, trends
- **State Comparisons**: Top/bottom performers, regional insights
- **Funder Analysis**: Contribution patterns, type distribution
- **Pipeline Health**: Conversion rates, stage analysis

## 🔧 Customization

### Adding New States
1. Add to `States` tab in Google Sheets
2. Add corresponding schools to `Schools` tab
3. Set targets in `StateTargets` tab

### Adding New Funders
1. Add to `Funders` tab with unique ID
2. Start adding contributions with the funder ID

### Fiscal Year Management
- System automatically detects current Indian FY
- Add new FY targets in `StateTargets` tab
- Historical data preserved for trend analysis

## 🚨 Troubleshooting

### Common Issues
1. **Google Sheets API Error**: Verify service account has access and sheet is shared
2. **Clerk Auth Issues**: Check environment variables and domain configuration
3. **Data Not Loading**: Verify sheet tab names match exactly (case-sensitive)
4. **Currency Formatting**: All amounts should be stored as numbers in INR

### Support
- Check the `/api/schema` endpoint for expected data structure
- Review browser console for detailed error messages
- Verify environment variables are properly set

## 📈 Performance

- **Server-Side Rendering**: Fast initial page loads
- **Optimized Queries**: Efficient Google Sheets API usage
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Error Resilience**: Graceful handling of missing data

## 🛡️ Security

- **Authentication Required**: All routes protected by Clerk
- **Service Account**: Secure Google Sheets access
- **Environment Variables**: Sensitive data properly secured
- **Input Validation**: Zod schemas for data validation

---

**Built for Vision Empower Trust** - Empowering education through intelligent fundraising management.