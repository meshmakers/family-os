import { useState, useEffect } from 'react';
import { useFamilyStore } from './store/useFamilyStore';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import TaskList from './components/Tasks';
import ShoppingList from './components/Shopping';
import SettingsModal from './components/Settings/SettingsModal';
import Toast from './components/ui/Toast';
import ReminderPopup from './components/ui/ReminderPopup';

type Tab = 'dashboard' | 'tasks' | 'shopping';

export default function App() {
  const [tab,          setTab]          = useState<Tab>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const hydrate       = useFamilyStore(s => s.hydrate);
  const tickRecurring = useFamilyStore(s => s.tickRecurring);

  useEffect(() => { hydrate().then(() => tickRecurring()); }, [hydrate, tickRecurring]);

  return (
    <>
      <TopBar onSettings={() => setSettingsOpen(true)} />

      <div className="tabs">
        <button className={`tab ${tab === 'dashboard' ? 'active' : ''}`} onClick={() => setTab('dashboard')}>
          &#128196; Übersicht
        </button>
        <button className={`tab ${tab === 'tasks' ? 'active' : ''}`} onClick={() => setTab('tasks')}>
          &#9989; Aufgaben
        </button>
        <button className={`tab ${tab === 'shopping' ? 'active' : ''}`} onClick={() => setTab('shopping')}>
          &#128722; Einkauf
        </button>
      </div>

      {tab === 'dashboard' && <Dashboard />}
      {tab === 'tasks'     && <TaskList />}
      {tab === 'shopping'  && <ShoppingList />}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
      <Toast />
      <ReminderPopup />
    </>
  );
}
