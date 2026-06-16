import StatRow from './StatRow';
import GamePanel from './GamePanel';
import Calendar from '../Calendar';
import UpcomingTasks from './UpcomingTasks';
import ShoppingPreview from './ShoppingPreview';
import Pinboard from './Pinboard';

export default function Dashboard() {
  return (
    <>
      <StatRow />
      <Pinboard />
      <GamePanel />
      <div className="card">
        <div className="card-hd">
          📅 Wochenkalender
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-soft)', fontWeight: 400 }}>
            Klick auf Tag zum Bearbeiten
          </span>
        </div>
        <Calendar />
      </div>
      <div className="dash-grid">
        <UpcomingTasks />
        <ShoppingPreview />
      </div>
    </>
  );
}
