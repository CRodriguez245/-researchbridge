# Saved Queries Organization Guide

## 🎯 **New Organization Features**

The saved queries system now includes comprehensive organization capabilities to help students categorize and find their queries more efficiently.

## 📊 **Organization Fields**

### **1. Topic**
- **Purpose**: Categorize queries by specific topics or themes
- **Examples**: "Machine Learning", "World War II", "Quantum Physics", "Climate Change"
- **Color**: Purple badges in the interface

### **2. Class Code**
- **Purpose**: Organize queries by specific courses
- **Examples**: "CS101", "HIST201", "BIO101", "MATH301"
- **Color**: Green badges in the interface

### **3. Subject**
- **Purpose**: Group queries by academic subjects or disciplines
- **Examples**: "Computer Science", "History", "Biology", "Mathematics"
- **Color**: Orange badges in the interface

### **4. Project**
- **Purpose**: Organize queries by specific assignments or projects
- **Examples**: "Final Paper", "Research Project", "Assignment 3", "Capstone"
- **Color**: Pink badges in the interface

## 🎨 **Enhanced Save Query Modal**

### **New Fields Added:**
- **Topic**: Dropdown with common topics or free text input
- **Class Code**: Course code input field
- **Subject**: Academic subject selection
- **Project**: Project or assignment name

### **Layout:**
- **Title** (required) - Main query name
- **Tags** (optional) - Comma-separated keywords
- **Organization Fields** (optional) - 2x2 grid layout:
  - Topic | Class Code
  - Subject | Project

## 🔍 **Enhanced Query Library Sidebar**

### **New Organization Features:**

#### **1. Grouping Options**
- **No Grouping**: Traditional list view
- **Group by Topic**: Organize by topic categories
- **Group by Class**: Organize by course codes
- **Group by Subject**: Organize by academic subjects
- **Group by Project**: Organize by assignments/projects

#### **2. Filtering & Search**
- **Search**: Search across titles and query content
- **Mode Filter**: Filter by Summarize, Ask, Outline, Citations
- **Group Filter**: When grouping is active, filter by specific groups
- **Group Counts**: Shows number of queries in each group

#### **3. Visual Organization**
- **Color-coded badges** for each organization field
- **Group headers** when grouping is active
- **Query counts** per group
- **Uncategorized section** for queries without organization data

## 🚀 **How to Use**

### **Saving a Query:**
1. Click the **Save Query** button (bookmark icon) in the Result section header
2. Fill in the **Title** (required)
3. Add **Tags** if desired (comma-separated)
4. **Organize** your query using the new fields:
   - **Topic**: What specific topic is this about?
   - **Class Code**: Which course is this for?
   - **Subject**: What academic subject?
   - **Project**: Which assignment or project?
5. Click **Save Query**

### **Organizing Existing Queries:**
1. Open the **Query Library** sidebar
2. Select a **Grouping option** (Topic, Class, Subject, or Project)
3. Use the **Group filter** to focus on specific categories
4. **Search** within groups to find specific queries

### **Finding Queries:**
1. **Search**: Use the search bar to find queries by title or content
2. **Filter by Mode**: Select specific AI modes (Summarize, Ask, etc.)
3. **Group and Filter**: Choose a grouping option and filter by specific groups
4. **Visual Scanning**: Use color-coded badges to quickly identify query types

## 🎯 **Best Practices**

### **For Students:**

#### **Consistent Naming:**
- Use consistent class codes (e.g., always "CS101" not "cs101" or "Computer Science 101")
- Use consistent topic names (e.g., always "Machine Learning" not "ML" or "AI")

#### **Organization Strategy:**
- **Topic**: Use for broad themes (e.g., "Climate Change", "World War II")
- **Class Code**: Use official course codes (e.g., "HIST201", "BIO101")
- **Subject**: Use academic disciplines (e.g., "History", "Biology")
- **Project**: Use for specific assignments (e.g., "Final Paper", "Assignment 3")

#### **Tagging Strategy:**
- Use tags for cross-cutting concepts (e.g., "research", "homework", "presentation")
- Keep tags short and consistent
- Use 3-5 tags per query for best organization

### **For Instructors:**
- Encourage students to use consistent class codes
- Suggest standard topics for your course
- Use projects to organize by assignment types

## 🔧 **Technical Implementation**

### **Database Schema:**
```sql
-- New fields added to SavedQuery model
topic       String?  // e.g., "Machine Learning", "History"
class       String?  // e.g., "CS101", "HIST201"
subject     String?  // e.g., "Computer Science", "History"
project     String?  // e.g., "Final Paper", "Assignment 3"
```

### **API Updates:**
- **POST /api/saved-queries**: Now accepts organization fields
- **PUT /api/saved-queries/[id]**: Can update organization fields
- **GET /api/saved-queries**: Returns organization data

### **UI Components:**
- **SaveQuery Modal**: Enhanced with organization fields
- **SavedQueriesSidebar**: Enhanced with grouping and filtering
- **Visual Indicators**: Color-coded badges for organization fields

## 🎉 **Benefits**

### **For Students:**
- **Better Organization**: Easily categorize queries by topic, class, subject, or project
- **Faster Finding**: Quickly locate relevant queries using filters and search
- **Academic Focus**: Organize queries around coursework and assignments
- **Visual Clarity**: Color-coded badges make query types instantly recognizable

### **For Learning:**
- **Topic Mastery**: Group related queries to see learning progress
- **Course Organization**: Keep queries organized by academic courses
- **Project Tracking**: Track queries used for specific assignments
- **Cross-Reference**: Find related queries across different contexts

The enhanced saved queries system now provides a comprehensive organization framework that adapts to students' academic workflows and helps them manage their research queries more effectively! 🚀 