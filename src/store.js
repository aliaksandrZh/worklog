import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

const CSV_PATH = path.join(process.cwd(), 'tasks.csv');
const HEADERS = ['date', 'type', 'number', 'name', 'timeSpent', 'comments'];

function ensureFile() {
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(CSV_PATH, HEADERS.join(',') + '\n', 'utf8');
  }
}

export function loadTasks() {
  ensureFile();
  const content = fs.readFileSync(CSV_PATH, 'utf8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return result.data.map(row => {
    const cleaned = {};
    for (const key of HEADERS) {
      cleaned[key] = (row[key] || '').trim();
    }
    return cleaned;
  });
}

export function saveTasks(tasks) {
  const csv = Papa.unparse(tasks, { columns: HEADERS });
  fs.writeFileSync(CSV_PATH, csv + '\n', 'utf8');
}

export function addTask(task) {
  const tasks = loadTasks();
  tasks.push(task);
  saveTasks(tasks);
}

export function addTasks(newTasks) {
  const tasks = loadTasks();
  tasks.push(...newTasks);
  saveTasks(tasks);
}

export function updateTask(index, updated) {
  const tasks = loadTasks();
  if (index >= 0 && index < tasks.length) {
    tasks[index] = { ...tasks[index], ...updated };
    saveTasks(tasks);
  }
}

export function deleteTask(index) {
  const tasks = loadTasks();
  if (index >= 0 && index < tasks.length) {
    tasks.splice(index, 1);
    saveTasks(tasks);
  }
}
