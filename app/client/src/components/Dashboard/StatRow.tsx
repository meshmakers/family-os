import { useFamilyStore } from '../../store/useFamilyStore';

export default function StatRow() {
  const tasks    = useFamilyStore(s => s.tasks);
  const shopping = useFamilyStore(s => s.shopping);

  const open     = tasks.filter(t => !t.done).length;
  const done     = tasks.filter(t =>  t.done).length;
  const total    = tasks.length;
  const shopLeft = shopping.filter(x => !x.done).length;
  const pct      = total ? Math.round(done / total * 100) : 0;

  return (
    <div className="stat-row">
      <div className="stat s-purple">
        <div className="stat-icon">✅</div>
        <div className="stat-val">{open}</div>
        <div className="stat-lbl">Aufgaben offen</div>
        <div className="prog-wrap">
          <div className="prog-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="stat s-pink">
        <div className="stat-icon">🛒</div>
        <div className="stat-val">{shopLeft}</div>
        <div className="stat-lbl">Einkauf offen</div>
      </div>
      <div className="stat s-teal">
        <div className="stat-icon">🏅</div>
        <div className="stat-val">{pct}%</div>
        <div className="stat-lbl">Erledigt</div>
      </div>
    </div>
  );
}
