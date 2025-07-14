import { useState, useEffect } from 'react';

// Helper to generate time options
const generateTimeOptions = (max, pad) => {
  const options = [];
  for (let i = 0; i < max; i++) {
    options.push(i.toString().padStart(pad, '0'));
  }
  return options;
};

function GoalManager() {
  const [objective, setObjective] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueHour, setDueHour] = useState('');
  const [dueMinute, setDueMinute] = useState('');
  const [priority, setPriority] = useState('medium');
  const [objectives, setObjectives] = useState([]);
  const [subTask, setSubTask] = useState('');
  const [activeObjectiveIdx, setActiveObjectiveIdx] = useState(null);

  // Load objectives from storage
  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(['objectives'], (result) => {
        setObjectives(result.objectives || []);
      });
    } else {
      const storedObjectives = localStorage.getItem('objectives');
      setObjectives(storedObjectives ? JSON.parse(storedObjectives) : []);
    }
  }, []);

  // Save objectives to storage
  const persistObjectives = (updatedObjectives) => {
    setObjectives(updatedObjectives);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ objectives: updatedObjectives });
    } else {
      localStorage.setItem('objectives', JSON.stringify(updatedObjectives));
    }
  };

  // Add a new objective
  const createObjective = () => {
    if (objective.trim()) {
      const newObjective = {
        title: objective,
        isDone: false,
        subTasks: [],
        dueDate: dueDate ? `${dueDate}T${dueHour || '00'}:${dueMinute || '00'}:00` : null,
        priority,
      };
      const updatedObjectives = [...objectives, newObjective];
      persistObjectives(updatedObjectives);
      setObjective('');
      setDueDate('');
      setDueHour('');
      setDueMinute('');
      setPriority('medium');
    }
  };

  // Add a subtask
  const createSubTask = (objIdx) => {
    if (subTask.trim()) {
      const updatedObjectives = objectives.map((obj, idx) =>
        idx === objIdx
          ? { ...obj, subTasks: [...(obj.subTasks || []), { title: subTask, isDone: false }] }
          : obj
      );
      persistObjectives(updatedObjectives);
      setSubTask('');
      setActiveObjectiveIdx(null);
    }
  };

  // Check if parent objective should be auto-completed
  const checkParentCompletion = (objList, objIdx) => {
    const obj = objList[objIdx];
    if (obj.subTasks?.length > 0 && obj.subTasks.every((st) => st.isDone)) {
      objList[objIdx].isDone = true;
    } else if (obj.subTasks?.length > 0) {
      objList[objIdx].isDone = false;
    }
    return objList;
  };

  // Toggle objective completion
  const toggleObjective = (idx) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[idx].isDone = !updatedObjectives[idx].isDone;
    if (updatedObjectives[idx].subTasks?.length > 0) {
      updatedObjectives[idx].subTasks = updatedObjectives[idx].subTasks.map((st) => ({
        ...st,
        isDone: updatedObjectives[idx].isDone,
      }));
    }
    persistObjectives(updatedObjectives);
  };

  // Toggle subtask completion
  const toggleSubTask = (objIdx, subIdx) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[objIdx].subTasks[subIdx].isDone = !updatedObjectives[objIdx].subTasks[subIdx].isDone;
    checkParentCompletion(updatedObjectives, objIdx);
    persistObjectives(updatedObjectives);
  };

  // Remove objective
  const deleteObjective = (idx) => {
    const updatedObjectives = objectives.filter((_, i) => i !== idx);
    persistObjectives(updatedObjectives);
  };

  // Remove subtask
  const deleteSubTask = (objIdx, subIdx) => {
    const updatedObjectives = [...objectives];
    updatedObjectives[objIdx].subTasks = updatedObjectives[objIdx].subTasks.filter((_, i) => i !== subIdx);
    checkParentCompletion(updatedObjectives, objIdx);
    persistObjectives(updatedObjectives);
  };

  // Get icon path
  const getIconPath = () => {
    return (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
      ? chrome.runtime.getURL('icon48.jpeg')
      : '/icon48.jpeg';
  };

  const hourOptions = generateTimeOptions(24, 2);
  const minuteOptions = generateTimeOptions(60, 2);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Task Manager</h2>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          className="flex-1 p-2 border rounded-lg dark:bg-gray-600 dark:text-white"
          placeholder="Enter a task"
        />
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-600 dark:text-white"
        />
        <select
          value={dueHour}
          onChange={(e) => setDueHour(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-600 dark:text-white"
        >
          <option value="">Hour</option>
          {hourOptions.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          value={dueMinute}
          onChange={(e) => setDueMinute(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-600 dark:text-white"
        >
          <option value="">Minute</option>
          {minuteOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-2 border rounded-lg dark:bg-gray-600 dark:text-white"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={createObjective}
          className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600"
        >
          Add Task
        </button>
      </div>
      <ul className="space-y-3">
        {objectives.map((obj, idx) => (
          <li
            key={idx}
            className={`p-3 rounded-lg ${obj.isDone ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-200 dark:bg-gray-600'} select-none`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={getIconPath()}
                  alt="Task Icon"
                  className="w-5 h-5"
                />
                <span
                  onClick={() => toggleObjective(idx)}
                  className="cursor-pointer font-medium"
                >
                  {obj.title} {obj.isDone && '✔'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${obj.priority === 'high' ? 'bg-red-200' : obj.priority === 'medium' ? 'bg-yellow-200' : 'bg-blue-200'}`}>
                  {obj.priority.charAt(0).toUpperCase() + obj.priority.slice(1)}
                </span>
                {obj.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-300 ml-2">
                    Due: {new Date(obj.dueDate).toLocaleString()}
                  </span>
                )}
                {obj.dueDate && !obj.isDone && new Date(obj.dueDate) < new Date() && (
                  <span className="text-xs text-red-500 dark:text-red-400 ml-2">
                    Overdue
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveObjectiveIdx(idx)}
                  className="text-sm bg-gray-300 dark:bg-gray-500 px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
                >
                  Add Subtask
                </button>
                <button
                  onClick={() => deleteObjective(idx)}
                  className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
            <ul className="ml-6 mt-2 space-y-2">
              {obj.subTasks?.map((st, subIdx) => (
                <li
                  key={subIdx}
                  className={`flex items-center justify-between p-2 rounded ${st.isDone ? 'bg-green-50 dark:bg-green-800' : 'bg-gray-100 dark:bg-gray-500'}`}
                >
                  <span
                    onClick={() => toggleSubTask(idx, subIdx)}
                    className="cursor-pointer"
                  >
                    {st.title} {st.isDone && '✔'}
                  </span>
                  <button
                    onClick={() => deleteSubTask(idx, subIdx)}
                    className="text-sm bg-red-400 text-white px-2 py-1 rounded hover:bg-red-500"
                  >
                    Delete
                  </button>
                </li>
              ))}
              {activeObjectiveIdx === idx && (
                <li className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={subTask}
                    onChange={(e) => setSubTask(e.target.value)}
                    className="flex-1 p-2 border rounded-lg dark:bg-gray-600 dark:text-white text-sm"
                    placeholder="Enter a subtask"
                  />
                  <button
                    onClick={() => createSubTask(idx)}
                    className="bg-indigo-500 text-white px-3 py-1 rounded hover:bg-indigo-600 text-sm"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setActiveObjectiveIdx(null); setSubTask(''); }}
                    className="bg-gray-300 dark:bg-gray-500 px-3 py-1 rounded hover:bg-gray-400 dark:hover:bg-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                </li>
              )}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GoalManager;