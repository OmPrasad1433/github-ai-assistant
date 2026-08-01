import { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";

// Generate realistic daily activity data for the current year
const generateActivityData = () => {
  const data = [];
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 1); // Jan 1st of current year
  
  let currentDate = new Date(start);
  while (currentDate <= today) {
    // Generate values: more 0s and small values, with occasional high spikes
    const rand = Math.random();
    let count = 0;
    if (rand > 0.85) count = Math.floor(Math.random() * 8) + 5; // high activity
    else if (rand > 0.5) count = Math.floor(Math.random() * 4) + 1; // low activity
    
    data.push({
      date: currentDate.toISOString().split("T")[0],
      count: count,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return data;
};

const HeatMapProfile = () => {
  const [activityData, setActivityData] = useState([]);

  useEffect(() => {
    setActivityData(generateActivityData());
  }, []);

  const today = new Date();
  const startDate = new Date(today.getFullYear(), 0, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider">
          Contribution Calendar
        </h4>
        <span className="text-xs text-slate-400">
          {activityData.reduce((sum, d) => sum + d.count, 0)} contributions in {today.getFullYear()}
        </span>
      </div>

      <div className="bg-[#0d1117] p-4 rounded-lg border border-[#30363d] overflow-x-auto">
        <div className="min-w-[620px]">
          <HeatMap
            value={activityData}
            weekLabels={["Sun", "", "Tue", "", "Thu", "", "Sat"]}
            monthLabels={[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ]}
            startDate={startDate}
            rectSize={10}
            space={3}
            rectProps={{
              rx: 2,
            }}
            style={{ 
              color: "#8b949e",
              fontSize: "10px",
            }}
            panelColors={{
              0: "#161b22",
              1: "#0e4429",
              2: "#0e4429",
              3: "#006d32",
              4: "#006d32",
              5: "#26a641",
              6: "#26a641",
              7: "#39d353",
              8: "#39d353",
            }}
          />
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex justify-end items-center gap-1.5 text-[10px] text-slate-500 font-semibold pt-1">
        <span>Less</span>
        <span className="w-2.5 h-2.5 rounded-sm bg-[#161b22]"></span>
        <span className="w-2.5 h-2.5 rounded-sm bg-[#0e4429]"></span>
        <span className="w-2.5 h-2.5 rounded-sm bg-[#006d32]"></span>
        <span className="w-2.5 h-2.5 rounded-sm bg-[#26a641]"></span>
        <span className="w-2.5 h-2.5 rounded-sm bg-[#39d353]"></span>
        <span>More</span>
      </div>
    </div>
  );
};

export default HeatMapProfile;
