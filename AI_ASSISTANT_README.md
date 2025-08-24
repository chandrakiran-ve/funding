# AI Assistant - Fundraising Intelligence

The AI Assistant is an advanced feature that provides intelligent analysis and insights for your fundraising data using Google's Gemini AI.

## 🤖 Features

### **Comprehensive Data Access**
- Real-time access to all Google Sheets data (funders, contributions, states, targets, prospects, schools)
- Current fiscal year context and historical data analysis
- Automatic data synchronization and refresh capabilities

### **Intelligent Analysis**
- **Performance Analysis**: Track achievement rates, identify trends, and compare performance
- **Funder Insights**: Analyze contribution patterns, relationship management, and giving history
- **State Performance**: Compare state-wise metrics, identify top performers and areas needing attention
- **Pipeline Management**: Review prospect stages, conversion rates, and weighted projections
- **Strategic Recommendations**: Get data-driven suggestions for improving fundraising outcomes

### **Natural Language Interface**
- Ask questions in plain English about your fundraising data
- Context-aware responses that reference specific data points
- Conversation history for follow-up questions
- Suggested questions to get started

## 🛠️ Technical Implementation

### **Architecture**
- **Frontend**: React-based chat interface with real-time messaging
- **Backend**: Next.js API routes with Google Sheets integration
- **AI Engine**: Google Gemini 1.5 Flash model for fast, accurate responses
- **Data Layer**: Direct integration with existing Google Sheets functions

### **Key Components**
1. **AI Agent (`ai-agent.ts`)**: Core intelligence engine with data access
2. **API Routes (`/api/ai-chat`)**: RESTful endpoints for chat functionality
3. **Chat Interface**: Modern, responsive UI for user interactions
4. **Data Context**: Real-time synchronization with Google Sheets

## 🚀 Setup Instructions

### **1. Get Gemini API Key**
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API key"
3. Create a new API key
4. Copy the API key

### **2. Update Environment Variables**
Add to your `.env.local` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### **3. Verify Setup**
1. Restart your development server: `npm run dev`
2. Navigate to the "AI Assistant" tab in the sidebar
3. The assistant should initialize with current data context
4. Try asking: "What's our current fundraising performance?"

## 💡 Usage Examples

### **Performance Questions**
- "What's our current fundraising performance?"
- "How are we doing compared to last year?"
- "Which states are meeting their targets?"
- "What's our achievement rate this fiscal year?"

### **Funder Analysis**
- "Who are our top funders this year?"
- "Show me funders who haven't contributed recently"
- "Which funders support multiple states?"
- "What's the average contribution size?"

### **State Insights**
- "Which states need the most attention?"
- "Compare Karnataka and Tamil Nadu performance"
- "What's the funding gap in Maharashtra?"
- "Which states have the strongest pipelines?"

### **Pipeline Questions**
- "How is our pipeline looking?"
- "What prospects are likely to convert?"
- "Which stages have the most value?"
- "What's our weighted pipeline projection?"

### **Strategic Planning**
- "Where should we focus our efforts?"
- "What trends do you see in our data?"
- "Which funders should we prioritize for renewal?"
- "What strategies would improve our performance?"

## 🔧 Advanced Features

### **Data Refresh**
- Click "Refresh Data" to sync with latest Google Sheets data
- Automatic context updates when new data is available
- Real-time status indicators

### **Context Awareness**
- AI remembers conversation history for follow-up questions
- References specific data points and calculations
- Provides actionable insights based on current context

### **Mobile Responsive**
- Fully functional on mobile devices
- Touch-optimized interface
- Responsive design for all screen sizes

## 🛡️ Security & Privacy

### **Data Security**
- All data processing happens server-side
- No sensitive data stored in AI service
- Conversations are not persisted permanently
- Uses existing authentication and authorization

### **API Security**
- Requires valid Clerk authentication
- Rate limiting and timeout protection
- Error handling and graceful degradation

## 🔍 Troubleshooting

### **Common Issues**

1. **"Failed to initialize AI"**
   - Check if GEMINI_API_KEY is set correctly
   - Verify API key is valid and has quota remaining
   - Check network connectivity

2. **"No data available"**
   - Ensure Google Sheets integration is working
   - Check if sheets contain data
   - Try refreshing AI data

3. **Slow responses**
   - Large datasets may take longer to process
   - Consider asking more specific questions
   - Check API quota limits

### **Debug Information**
- Check browser console for detailed error messages
- API responses include context and summary data
- Server logs show AI processing details

## 🚀 Future Enhancements

### **Planned Features**
- **Export Chat**: Save conversations as PDF/text
- **Scheduled Reports**: AI-generated weekly/monthly summaries
- **Predictive Analytics**: Forecast future performance
- **Custom Insights**: Personalized recommendations
- **Voice Interface**: Voice-to-text input capability

### **Integration Opportunities**
- **Email Reports**: Automated AI-generated email summaries
- **Slack/Teams**: Direct integration with team communication
- **Mobile App**: Dedicated mobile AI assistant
- **API Access**: External integrations for custom applications

## 📊 Performance Metrics

The AI Assistant tracks:
- Response accuracy and relevance
- Query processing time
- User engagement metrics
- Data freshness indicators

## 🤝 Support

For issues or feature requests:
1. Check the troubleshooting section above
2. Review browser console for error details
3. Ensure all environment variables are configured
4. Contact system administrator for API key issues

---

**Note**: The AI Assistant requires a valid Gemini API key and active Google Sheets integration to function properly. All responses are generated based on your actual fundraising data.

---

# 🤖 **AI Data Modification System**

## **Overview**
The AI assistant now has the ability to **safely modify your Google Sheets data** with full revert/undo capabilities. This system provides enterprise-grade data management with comprehensive safety features, change tracking, and backup/restore functionality.

## **🔒 Safety Features**

### **1. Risk Assessment**
- **Low Risk**: Simple create operations (new contributions, prospects)
- **Medium Risk**: Update operations, single record deletions
- **High Risk**: Bulk operations affecting multiple records
- **Critical Risk**: Database-wide operations (erase all data)

### **2. Automatic Backups**
- **Pre-operation snapshots**: Automatic backup before any high-risk operation
- **Change tracking**: Every modification is recorded with full details
- **Revert capability**: Every change can be safely undone
- **Audit trail**: Complete history of all data modifications

### **3. Confirmation System**
- **Required confirmations**: High and critical risk operations need explicit confirmation
- **Clear warnings**: Detailed descriptions of what will be affected
- **Operation IDs**: Each pending operation has a unique identifier
- **Cancellation support**: Users can cancel pending operations

## **📝 Available Operations**

### **Create Operations**
```bash
"Add a contribution of ₹50,000 from XYZ Foundation to Karnataka"
"Create a new prospect for ABC Corp in Tamil Nadu worth ₹1,00,000"
"Add a state target of ₹2,000,000 for Kerala in FY25-26"
```

### **Update Operations**
```bash
"Update contribution amount to ₹75,000 for contribution ID xyz"
"Change the stage of prospect ID abc to Committed"
"Update the target for Karnataka to ₹3,000,000"
```

### **Delete Operations**
```bash
"Delete prospect with ID xyz"
"Remove all prospects in Lead stage older than 3 months"
"Delete contribution ID abc"
```

### **Bulk Operations**
```bash
"Delete all prospects in Lead stage"
"Update all contribution amounts by 10% for FY24-25"
"Change all prospects from Contacted to Proposal stage"
```

### **Revert Operations**
```bash
"Revert change ID xyz"
"Undo the last operation"
"Revert change-1234567890"
```

### **Backup & Restore**
```bash
"Create a backup of current data"
"Show available snapshots"
"Restore from backup ID xyz"
```

### **Dangerous Operations**
```bash
"Erase all data"  # Requires confirmation + creates backup first
"Delete all contributions"  # High risk + requires confirmation
"Remove all prospects"  # High risk + requires confirmation
```

## **🔄 Revert/Undo System**

### **How It Works**
1. **Change Recording**: Every operation is recorded with a unique ID and full details
2. **Revert Data**: Sufficient information is stored to completely undo the operation
3. **Safety Checks**: The system verifies that revert is possible before proceeding
4. **Cache Invalidation**: After revert, all data caches are refreshed

### **Revert Commands**
```bash
# Revert by change ID
"Revert change-1234567890"

# Revert the last operation
"Undo the last operation"

# Revert a specific type of operation
"Revert the last prospect deletion"
```

### **What Can Be Reverted**
- ✅ Single record creation
- ✅ Single record updates
- ✅ Single record deletions
- ✅ Bulk operations
- ✅ Data imports
- ❌ Database restoration (cannot be reverted)
- ❌ Manual sheet edits (not tracked by system)

## **📊 Status & Monitoring**

### **Status Information**
The AI provides real-time status information:
```bash
# Get current status
"What's the current status of data operations?"

# See recent changes
"Show me recent changes"

# Check available backups
"What backups are available?"
```

### **Status Response Example**
```
📊 Current Status:
- Recent Changes: 5
- Revertable Changes: 4
- Available Snapshots: 3
- Pending Operations: 1
```

## **⚠️ Safety Guidelines**

### **1. Always Confirm Dangerous Operations**
- The system will require confirmation for high-risk operations
- Read the confirmation message carefully
- Understand what data will be affected
- Note the operation ID for potential cancellation

### **2. Use Backup Before Major Changes**
- Create backups before large-scale operations
- Keep multiple backup snapshots
- Test restore functionality periodically

### **3. Test Operations First**
- Test new operations on small datasets first
- Verify data integrity after operations
- Check that revert functionality works

### **4. Monitor Change History**
- Regularly review the change history
- Ensure unexpected changes are investigated
- Keep track of who made what changes

## **🛠️ Advanced Features**

### **1. Operation Queuing**
- Multiple operations can be queued
- Operations are processed sequentially
- Failed operations don't block the queue

### **2. Data Validation**
- Automatic validation of data types
- Range checking for amounts and dates
- Required field validation
- Cross-reference validation (e.g., valid state codes)

### **3. Error Recovery**
- Automatic rollback on operation failure
- Detailed error messages
- Recovery suggestions
- Partial operation handling

### **4. Performance Optimization**
- Caching of frequently accessed data
- Batch operations for bulk changes
- Lazy loading for large datasets
- Memory management for large operations

## **📋 Best Practices**

### **1. Data Management**
- Create backups before major operations
- Test operations on small datasets first
- Verify data integrity after changes
- Keep change history for auditing

### **2. Operation Planning**
- Plan complex operations in advance
- Break large operations into smaller steps
- Test revert functionality
- Have a recovery plan

### **3. Team Coordination**
- Communicate planned data changes
- Coordinate with team members
- Document major operations
- Share backup and restore procedures

### **4. Monitoring & Maintenance**
- Regularly review change history
- Monitor system performance
- Clean up old backup snapshots
- Update documentation as needed

## **🚨 Emergency Procedures**

### **Data Loss Recovery**
1. **Immediate Action**: Stop all operations
2. **Check Backups**: Identify the most recent good backup
3. **Restore Process**: Use "Restore from backup ID xyz"
4. **Verify Data**: Check data integrity after restore
5. **Document Incident**: Record what happened and how it was resolved

### **Accidental Deletions**
1. **Quick Revert**: Use "Revert change ID" if available
2. **Check History**: Look for the deletion in recent changes
3. **Restore Backup**: If revert isn't available, restore from backup
4. **Data Verification**: Ensure all data is properly restored

### **System Issues**
1. **Stop Operations**: Pause all data modifications
2. **Check Status**: Get system status and recent changes
3. **Contact Support**: If system issues persist
4. **Document Problems**: Keep detailed records for troubleshooting

## **🔧 Technical Implementation**

### **Architecture Overview**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AI Agent      │────│ Data Controller  │────│ Operations Mgr  │
│                 │    │                  │    │                 │
│ • Command       │    │ • Parse Commands │    │ • Execute       │
│ • Analysis      │    │ • Risk Assessment│    │ • Track Changes │
│ • Response      │    │ • Confirmations  │    │ • Revert        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌──────────────────┐           │
│ Google Sheets   │    │   Cache System   │◄──────────┘
│                 │    │                  │
│ • Contributions  │    │ • Data Cache     │
│ • Prospects      │    │ • Invalidation   │
│ • Targets        │    │ • Refresh       │
└─────────────────┘    └──────────────────┘
```

### **Key Components**
1. **AI Agent**: Main interface for user interactions
2. **Data Controller**: Parses commands and manages operations
3. **Operations Manager**: Executes operations and tracks changes
4. **Cache System**: Manages data caching and invalidation
5. **Google Sheets API**: Direct interface to spreadsheet data

### **Data Flow**
1. User sends command to AI Agent
2. AI Agent parses command and identifies operation type
3. Data Controller validates and assesses risk
4. Operations Manager executes operation with change tracking
5. Cache is invalidated and refreshed
6. User receives confirmation and status update

## **📞 Support & Troubleshooting**

### **Common Issues**
1. **Operation Not Recognized**: Try rephrasing the command
2. **Confirmation Timeout**: Pending operations expire after 5 minutes
3. **Revert Failed**: Check if the change is still revertable
4. **Backup Not Found**: Verify the snapshot ID is correct

### **Getting Help**
```bash
# Get help with operations
"Help me with data operations"
"What operations can I perform?"
"Show me examples of data commands"

# Get system status
"What's the current system status?"
"Show me recent changes"
"Are there any pending operations?"
```

### **Contact Information**
For technical issues or questions about the data modification system, please contact your system administrator or the development team.

---

**⚠️ IMPORTANT**: This system provides powerful data modification capabilities. Always use caution with high-risk operations and ensure you understand the impact of each command before executing it.
