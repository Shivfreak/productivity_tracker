import { useState, useEffect } from 'react';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#ef4444']; // Indigo for completed, red for remaining

function ProgressChart() {
  const [chartData, setChartData] = useState([]);
  const [completionRate, setCompletionRate] = useState(0);

  const calculateProgress = (objectives) => {
    let completedTasks = 0;
    let totalTasks = 0;

    objectives.forEach((obj) => {
      totalTasks += 1;
      if (obj.isDone) completedTasks += 1;
      if (obj.subTasks?.length) {
        totalTasks += obj.subTasks.length;
        completedTasks += obj.subTasks.filter((st) => st.isDone).length;
      }
    });

    setChartData([
      { name: 'Completed', value: completedTasks },
      { name: 'Pending', value: totalTasks - completedTasks },
    ]);
    setCompletionRate(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
  };

  const fetchObjectives = () => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['objectives'], (result) => {
        if (result.objectives) {
          calculateProgress(result.objectives);
        } else {
          setChartData([]);
          setCompletionRate(0);
        }
      });
    } else {
      const storedObjectives = localStorage.getItem('objectives');
      if (storedObjectives) {
        calculateProgress(JSON.parse(storedObjectives));
      } else {
        setChartData([]);
        setCompletionRate(0);
      }
    }
  };

  useEffect(() => {
    fetchObjectives();

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
      const handleUpdate = (changes, area) => {
        if (area === "local" && changes.objectives) {
          fetchObjectives();
        }
      };
      chrome.storage.onChanged.addListener(handleUpdate);
      return () => chrome.storage.onChanged.removeListener(handleUpdate);
    } else {
      const handleStorage = (e) => {
        if (e.key === 'objectives') fetchObjectives();
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Task Progress</h2>
      <div className="text-center text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
        {completionRate}% Complete
      </div>
      <div style={{ width: '100%', height: 200 }}>
        {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">No task data to display.</p>
        )}
      </div>
    </div>
  );
}

export default ProgressChart;