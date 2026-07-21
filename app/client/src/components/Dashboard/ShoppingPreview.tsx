import { useFamilyStore } from '../../store/useFamilyStore';

const CAT_ICON: Record<string, string> = { food: '🥦', drog: '🧴', misc: '📦' };

export default function ShoppingPreview() {
  const shopping   = useFamilyStore(s => s.shopping);
  const toggleShop = useFamilyStore(s => s.toggleShop);

  const open = shopping.filter(x => !x.done);
  const show = open.slice(0, 5);

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-hd">🛒 Einkauf</div>
      {shopping.length === 0
        ? <div className="empty">Liste leer ✨</div>
        : open.length === 0
          ? <div className="empty">Alles gekauft ✨</div>
          : show.map(i => (
            <div key={i.id} className="task-item">
              <input
                type="checkbox"
                className={`shop-cb cb-${i.cat}`}
                checked={i.done}
                onChange={() => toggleShop(i.id)}
              />
              <span className="task-lbl">{CAT_ICON[i.cat]} {i.name}</span>
            </div>
          ))
      }
      {open.length > 5 && (
        <div style={{ fontSize: 11, color: 'var(--text-soft)', paddingTop: 6 }}>
          +{open.length - 5} weitere…
        </div>
      )}
    </div>
  );
}
