# Instructor Dashboard Test Guide

## 🎯 **Demo Instructor Account**

**Email:** `demo@instructor.com`  
**Password:** `demo123`

## 🚀 **How to Test the Instructor Dashboard**

### **Step 1: Sign In**
1. Go to http://localhost:3000
2. Click "Sign in" in the header
3. Use the demo credentials above
4. Click "Sign in"

### **Step 2: Access Instructor Dashboard**
1. After signing in, click "Instructor Dashboard" in the header
2. You'll see the full dashboard with mock student data

## 📊 **Mock Data Included**

### **5 Mock Students:**
1. **Alice Johnson** - Active (2 hours ago), 12 sessions, 5 exports
2. **Bob Smith** - Recent (6 hours ago), 8 sessions, 3 exports  
3. **Carol Davis** - Recent (1 day ago), 15 sessions, 8 exports
4. **David Wilson** - Stuck (3 days ago), 6 sessions, 2 exports
5. **Eva Brown** - Active (30 minutes ago), 20 sessions, 12 exports

### **Mock Statistics:**
- **4 students active this week** (out of 5)
- **18 minutes average session time**
- **15 citations completed**
- **Mode usage:** Summarize (25), Ask (18), Outline (12), Citations (15)

### **Mock Analytics:**
- **Preference Analytics:** Shows most common preferences and categories
- **Nudge Analytics:** Shows nudge effectiveness and problematic nudges
- **Student Insights:** Individual student performance and preferences

## 🎨 **Dashboard Features to Test**

### **Overview Section:**
- Student activity cards with status indicators
- Real-time activity feed with mock updates
- Live notifications (appear every 10 seconds)

### **Student Management:**
- Student list with activity status
- Individual student performance metrics
- Preference tracking per student

### **Analytics:**
- Preference trend charts
- Mode usage donut chart
- Student engagement heatmap
- Real-time activity feed

### **Notifications:**
- Live notification panel (top-right)
- Expandable notification list
- Auto-dismissing notifications

## 🔧 **Technical Notes**

- **Mock Data:** Automatically loaded when no real student enrollments exist
- **Real Data:** Will be used if actual students are enrolled in the class
- **Live Updates:** Simulated every 10 seconds with random student activities
- **Responsive Design:** Works on desktop and mobile devices

## 🎉 **What You'll See**

The dashboard will now display:
- ✅ **5 mock students** with realistic activity data
- ✅ **Live activity feed** with simulated updates
- ✅ **Analytics charts** with mock preference data
- ✅ **Notifications** appearing automatically
- ✅ **Student status indicators** (active, recent, stuck)
- ✅ **Performance metrics** for each student

Enjoy exploring the full instructor dashboard functionality! 🚀 