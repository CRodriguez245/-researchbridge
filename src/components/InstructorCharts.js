"use client";
import { useState, useEffect } from "react";

// Custom Tooltip Component
function CustomTooltip({ content, isVisible, position }) {
  if (!isVisible) return null;
  
  // Calculate if tooltip would go off-screen within the container
  const tooltipWidth = 200; // Approximate tooltip width
  const tooltipHeight = 60; // Approximate tooltip height
  const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  
  // Adjust position to keep tooltip within container bounds
  let adjustedX = position.x;
  let adjustedY = position.y;
  let transform = 'translate(-50%, -100%)';
  let marginTop = '-8px';
  let arrowPosition = 'top-full left-1/2 transform -translate-x-1/2';
  
  // Check if tooltip would go off the right edge
  if (position.x + tooltipWidth / 2 > containerWidth - 20) {
    adjustedX = containerWidth - tooltipWidth / 2 - 20;
    transform = 'translate(-100%, -100%)';
    arrowPosition = 'top-full right-4';
  }
  
  // Check if tooltip would go off the left edge
  if (position.x - tooltipWidth / 2 < 20) {
    adjustedX = tooltipWidth / 2 + 20;
    transform = 'translate(0%, -100%)';
    arrowPosition = 'top-full left-4';
  }
  
  // Check if tooltip would go off the top edge
  if (position.y - tooltipHeight < 20) {
    adjustedY = position.y + 30;
    transform = 'translate(-50%, 0%)';
    marginTop = '8px';
    arrowPosition = 'bottom-full left-1/2 transform -translate-x-1/2';
  }
  
  return (
    <div 
      className="absolute z-50 bg-white text-gray-800 text-xs rounded-lg py-2 px-3 shadow-lg border border-gray-200 max-w-xs whitespace-nowrap"
      style={{
        left: adjustedX,
        top: adjustedY,
        transform: transform,
        marginTop: marginTop
      }}
    >
      {content}
      <div className={`absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white ${arrowPosition}`}></div>
    </div>
  );
}

// Simple Chart Components (we can enhance these with a proper charting library later)
export function PreferenceTrendChart({ data }) {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [tooltip, setTooltip] = useState({ visible: false, content: '', position: { x: 0, y: 0 } });
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Preference Trends</h3>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No trend data available
        </div>
      </div>
    );
  }

  const handleBarHover = (event, day) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = event.currentTarget.closest('.relative').getBoundingClientRect();
    setTooltip({
      visible: true,
      content: `${day.date}: ${day.count} preferences`,
      position: { 
        x: rect.left - containerRect.left + rect.width / 2, 
        y: rect.top - containerRect.top 
      }
    });
  };

  const handleBarLeave = () => {
    setTooltip({ visible: false, content: '', position: { x: 0, y: 0 } });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Preference Trends</h3>
        <select 
          value={selectedPeriod} 
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="semester">This Semester</option>
        </select>
      </div>
      
      <div className="h-64 flex items-end justify-between space-x-2 p-4 bg-gray-50 rounded">
        {data.slice(0, 7).map((day, index) => (
          <div key={index} className="flex flex-col items-center flex-1">
            <div 
              className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600 cursor-pointer"
              style={{ height: `${(day.count / Math.max(...data.map(d => d.count))) * 200}px` }}
              onMouseEnter={(e) => handleBarHover(e, day)}
              onMouseLeave={handleBarLeave}
            />
            <span className="text-xs text-gray-600 mt-1">{day.date}</span>
          </div>
        ))}
      </div>
      
      <CustomTooltip 
        content={tooltip.content}
        isVisible={tooltip.visible}
        position={tooltip.position}
      />
    </div>
  );
}

export function StudentEngagementHeatmap({ students }) {
  const [selectedMetric, setSelectedMetric] = useState('sessions');
  const [tooltip, setTooltip] = useState({ visible: false, content: '', position: { x: 0, y: 0 } });
  
  const metrics = {
    sessions: { label: 'Sessions', color: 'bg-blue' },
    preferences: { label: 'Preferences', color: 'bg-green' },
    confidence: { label: 'Confidence', color: 'bg-purple' },
    citations: { label: 'Citations', color: 'bg-orange' }
  };

  // Generate realistic engagement data for each student
  const studentsWithData = students?.map((student, index) => {
    // Create consistent but varied data based on student index
    const baseEngagement = 0.3 + (index % 5) * 0.15; // Varies from 0.3 to 0.9
    
    return {
      ...student,
      sessions: Math.floor(5 + Math.random() * 15 + (index % 3) * 5), // 5-25 sessions
      preferences: Math.floor(2 + Math.random() * 8 + (index % 4) * 2), // 2-12 preferences
      confidence: Math.floor(3 + Math.random() * 7 + (index % 2) * 3), // 3-13 confidence ratings
      citations: Math.floor(1 + Math.random() * 10 + (index % 3) * 3) // 1-16 citations
    };
  }) || [];

  const handleCellHover = (event, student, value) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const containerRect = event.currentTarget.closest('.relative').getBoundingClientRect();
    setTooltip({
      visible: true,
      content: `${student.name}: ${value} ${metrics[selectedMetric].label}`,
      position: { 
        x: rect.left - containerRect.left + rect.width / 2, 
        y: rect.top - containerRect.top 
      }
    });
  };

  const handleCellLeave = () => {
    setTooltip({ visible: false, content: '', position: { x: 0, y: 0 } });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Student Engagement Heatmap</h3>
        <select 
          value={selectedMetric} 
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="text-sm border border-gray-300 rounded px-2 py-1"
        >
          {Object.entries(metrics).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {studentsWithData.slice(0, 20).map((student, index) => {
          const value = student[selectedMetric] || 0;
          const maxValue = Math.max(...studentsWithData.map(s => s[selectedMetric] || 0));
          const intensity = maxValue > 0 ? (value / maxValue) : 0;
          
          return (
            <div 
              key={student.id}
              className={`aspect-square rounded cursor-pointer transition-all duration-300 hover:scale-110 ${
                intensity > 0.8 ? `${metrics[selectedMetric].color}-600` :
                intensity > 0.6 ? `${metrics[selectedMetric].color}-500` :
                intensity > 0.4 ? `${metrics[selectedMetric].color}-400` :
                intensity > 0.2 ? `${metrics[selectedMetric].color}-300` :
                `${metrics[selectedMetric].color}-100`
              }`}
              onMouseEnter={(e) => handleCellHover(e, student, value)}
              onMouseLeave={handleCellLeave}
            >
              <div className="h-full flex items-center justify-center text-white text-xs font-medium">
                {student.name?.charAt(0) || '?'}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <span>Low</span>
        <div className="flex space-x-1">
          {(() => {
            const colorMap = {
              sessions: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb'],
              preferences: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a'],
              confidence: ['#f3e8ff', '#e9d5ff', '#d8b4fe', '#c084fc', '#a855f7', '#9333ea'],
              citations: ['#fed7aa', '#fdba74', '#fb923c', '#f97316', '#ea580c', '#dc2626']
            };
            
            return colorMap[selectedMetric].map((color, index) => (
              <div 
                key={index}
                className="w-4 h-4 rounded"
                style={{ backgroundColor: color }}
              />
            ));
          })()}
        </div>
        <span>High</span>
      </div>
      
      <CustomTooltip 
        content={tooltip.content}
        isVisible={tooltip.visible}
        position={tooltip.position}
      />
    </div>
  );
}

export function ModeUsageDonut({ modeUsage }) {
  const [tooltip, setTooltip] = useState({ visible: false, content: '', position: { x: 0, y: 0 } });
  const total = Object.values(modeUsage).reduce((sum, count) => sum + count, 0);
  

  
  if (total === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Mode Usage</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No mode usage data
        </div>
      </div>
    );
  }

  const handleLegendHover = (event, mode, count, percentage, customPosition = null) => {
    console.log('handleLegendHover called:', mode, count, percentage, customPosition);
    let position;
    
    if (customPosition) {
      // Use the custom position provided (for pie chart segments)
      const containerRect = event.currentTarget.closest('.relative').getBoundingClientRect();
      position = {
        x: customPosition.x,
        y: customPosition.y
      };
    } else {
      // Calculate position for legend items
      const rect = event.currentTarget.getBoundingClientRect();
      const containerRect = event.currentTarget.closest('.relative').getBoundingClientRect();
      position = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top
      };
    }
    
    console.log('Setting tooltip position:', position);
    setTooltip({
      visible: true,
      content: `${mode}: ${count} uses (${percentage}% of total)`,
      position: position
    });
  };

  const handleLegendLeave = () => {
    setTooltip({ visible: false, content: '', position: { x: 0, y: 0 } });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg relative">
      <h3 className="text-lg font-semibold mb-4">Mode Usage Distribution</h3>
      
                              <div className="flex items-center justify-center">
                    <div className="relative w-40 h-40">
                      <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 40 40">
            {(() => {
              const entries = Object.entries(modeUsage);
              let currentAngle = 0;
              
              return entries.map(([mode, count], index) => {
                const percentage = (count / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;
                
                // Convert angles to radians
                const startRad = (startAngle - 90) * Math.PI / 180;
                const endRad = (endAngle - 90) * Math.PI / 180;
                
                // Calculate arc coordinates (using larger radius for better proportions)
                const x1 = 20 + 16 * Math.cos(startRad);
                const y1 = 20 + 16 * Math.sin(startRad);
                const x2 = 20 + 16 * Math.cos(endRad);
                const y2 = 20 + 16 * Math.sin(endRad);
                
                // Determine if arc is large
                const largeArcFlag = angle > 180 ? 1 : 0;
                
                            // Define specific colors for each mode with gradients
            const modeColors = {
              'summarize': '#2563EB', // Darker Blue
              'ask': '#059669',       // Darker Green
              'outline': '#D97706',   // Darker Amber
              'citations': '#7C3AED'  // Darker Purple
            };
                
                const color = modeColors[mode] || '#6B7280'; // Gray fallback
                

                
                // Update current angle for next segment
                currentAngle += angle;
                
                return (
                  <g key={mode}>
                    {/* Animated shadow layer */}
                    <path
                      d={`M 20 20 L ${x1} ${y1} A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={color}
                      className="transition-all duration-500 ease-in-out"
                      style={{ 
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                        opacity: 0.3,
                        transform: 'translateY(2px)'
                      }}
                    />
                    {/* Main segment with enhanced hover effects */}
                    <path
                      d={`M 20 20 L ${x1} ${y1} A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill={color}
                      className="transition-all duration-300 ease-in-out hover:scale-105 cursor-pointer"
                      style={{ 
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
                        stroke: '#ffffff',
                        strokeWidth: '0.5',
                        transformOrigin: 'center'
                      }}
                      onMouseEnter={(e) => {
                        console.log('Pie segment hover:', mode, count, percentage);
                        // Add visual feedback
                        e.currentTarget.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.3)) brightness(1.1)';
                        
                        const rect = e.currentTarget.getBoundingClientRect();
                        const containerRect = e.currentTarget.closest('.relative').getBoundingClientRect();
                        const customPosition = {
                          x: rect.left + rect.width / 2 - containerRect.left,
                          y: rect.top + rect.height / 2 - containerRect.top
                        };
                        console.log('Custom position:', customPosition);
                        handleLegendHover(e, mode, count, percentage, customPosition);
                      }}
                      onMouseLeave={(e) => {
                        // Reset visual feedback
                        e.currentTarget.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))';
                        handleLegendLeave();
                      }}
                    />
                    {/* Enhanced hit area with better detection */}
                    <path
                      d={`M 20 20 L ${x1} ${y1} A 16 16 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth="12"
                      onMouseEnter={(e) => {
                        console.log('Pie segment hover (hit area):', mode, count, percentage);
                        const rect = e.currentTarget.getBoundingClientRect();
                        const containerRect = e.currentTarget.closest('.relative').getBoundingClientRect();
                        const customPosition = {
                          x: rect.left + rect.width / 2 - containerRect.left,
                          y: rect.top + rect.height / 2 - containerRect.top
                        };
                        console.log('Custom position (hit area):', customPosition);
                        handleLegendHover(e, mode, count, percentage, customPosition);
                      }}
                      onMouseLeave={handleLegendLeave}
                    />
                  </g>
                );
              });
            })()}
          </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center bg-white rounded-full w-16 h-16 flex flex-col items-center justify-center shadow-sm border border-gray-100 transition-all duration-300 hover:scale-110 hover:shadow-md">
                          <span className="text-lg font-bold text-gray-800 leading-none">{total}</span>
                          <div className="text-xs text-gray-500 leading-none">Total</div>
                        </div>
                      </div>
        </div>
      </div>
      
      <div className="mt-6 space-y-1">
        {Object.entries(modeUsage).map(([mode, count], index) => {
          const percentage = ((count / total) * 100).toFixed(1);
          
          // Define specific colors for each mode (same as above)
          const modeColors = {
            'summarize': '#2563EB', // Darker Blue
            'ask': '#059669',       // Darker Green
            'outline': '#D97706',   // Darker Amber
            'citations': '#7C3AED'  // Darker Purple
          };
          
          const color = modeColors[mode] || '#6B7280'; // Gray fallback
          
          return (
            <div 
              key={mode} 
              className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all duration-200 hover:shadow-sm border border-transparent hover:border-gray-200"
              onMouseEnter={(e) => handleLegendHover(e, mode, count, percentage)}
              onMouseLeave={handleLegendLeave}
            >
              <div className="flex items-center">
                <div 
                  className="w-4 h-4 rounded-full mr-3 shadow-sm border border-white"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-semibold capitalize text-gray-800">{mode}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-gray-900">{count}</span>
                <span className="text-xs text-gray-500 ml-1 font-medium">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      
      <CustomTooltip 
        content={tooltip.content}
        isVisible={tooltip.visible}
        position={tooltip.position}
      />
    </div>
  );
}

export function RealTimeActivityFeed({ activities = [] }) {
  const [isLive, setIsLive] = useState(true);

  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <div className={`w-2 h-2 rounded-full mr-2 ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
          Live Activity Feed
        </h3>
        <button 
          onClick={() => setIsLive(!isLive)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            isLive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
        >
          {isLive ? 'LIVE' : 'PAUSED'}
        </button>
      </div>
      
      <div className="h-64 overflow-y-auto space-y-2">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded transition-all duration-200 hover:bg-gray-100 hover:shadow-sm"
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">{activity.student}</span>
                <span className="text-sm text-gray-600 ml-2">{activity.action}</span>
              </div>
              <span className="text-xs text-gray-500 font-medium">{activity.time}</span>
            </div>
          ))
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Waiting for activity...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function StudentProgressTimeline({ student }) {
  if (!student || !student.timeline) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Student Progress</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No timeline data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow transition-all duration-300 hover:shadow-lg">
      <h3 className="text-lg font-semibold mb-4">{student.name}'s Progress Timeline</h3>
      
      <div className="space-y-4">
        {student.timeline.map((event, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-3 h-3 bg-blue-500 rounded-full mt-2" />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium">{event.type}</span>
                <span className="text-xs text-gray-500">{event.time}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              {event.metrics && (
                <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                  {Object.entries(event.metrics).map(([key, value]) => (
                    <span key={key}>{key}: {value}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 