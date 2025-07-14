import { useState } from 'react';
import GoalManager from './components/GoalManager';
import TimeMonitor from './components/TimeMonitor';
import ProgressChart from './components/ProgressChart';
import './App.css';

// Main React component for the productivity dashboard
function App() {
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className={`w-[400px] p-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <div className="flex justify-between items-center mb-4">
        <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          Productivity Dashboard
        </h1>
        <button
          onClick={toggleTheme}
          className="px-3 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 text-sm"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </div>
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <GoalManager />
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <TimeMonitor />
        </div>
        <div className="bg-white dark:bg-gray-700 rounded-lg shadow p-4">
          <ProgressChart />
        </div>
      </div>
    </div>
  );
}

export default App;