import { useState } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import type { ShopCategory } from '../../types';

const CATS = {
  food: { label: 'Lebensmittel', icon: '🥦', cls: 'cp-food', cb: 'cb-food' },
  drog: { label: 'Drogerie',     icon: '🧴', cls: 'cp-drog', cb: 'cb-drog' },
  misc: { label: 'Sonstiges',    icon: '📦', cls: 'cp-misc', cb: 'cb-misc' },
} as const;

export default function ShoppingList() {
  const [name, setName] = useState('');
  const [cat,  setCat]  = useState<ShopCategory>('food');

  const shopping      = useFamilyStore(s => s.shopping);
  const addShopItem   = useFamilyStore(s => s.addShopItem);
  const toggleShop    = useFamilyStore(s => s.toggleShop);
  const delShop       = useFamilyStore(s => s.delShop);
  const clearDoneShop = useFamilyStore(s => s.clearDoneShop);

  function handleAdd() {
    if (!name.trim()) return;
    addShopItem(name.trim(), cat);
    setName('');
  }

  return (
    <>
      <div className="shop-add">
        <div className="shop-hd">🛒 Artikel hinzufügen</div>
        <div className="form-row">
          <input
            type="text" value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Artikel..."
            style={{ borderColor: 'var(--teal-mid)' }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <select
            value={cat}
            onChange={e => setCat(e.target.value as ShopCategory)}
            style={{ borderColor: 'var(--teal-mid)' }}
          >
            <option value="food">Lebensmittel</option>
            <option value="drog">Drogerie</option>
            <option value="misc">Sonstiges</option>
          </select>
          <button className="btn-teal" onClick={handleAdd}>+</button>
        </div>
      </div>

      {(Object.keys(CATS) as ShopCategory[]).map(key => {
        const info  = CATS[key];
        const items = shopping.filter(x => x.cat === key);
        if (!items.length) return null;
        const openCount = items.filter(x => !x.done).length;
        return (
          <div key={key}>
            <div className="cat-section-hd">
              {info.icon} {info.label}{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-soft)' }}>
                ({openCount} offen)
              </span>
            </div>
            <div className="card">
              {items.map(i => (
                <div key={i.id} className="shop-item">
                  <input
                    type="checkbox"
                    className={`${info.cb} shop-cb`}
                    checked={i.done}
                    onChange={() => toggleShop(i.id)}
                  />
                  <span className={`shop-lbl ${i.done ? 'done' : ''}`}>{i.name}</span>
                  <span className={`cpill ${info.cls}`}>{info.label}</span>
                  <button className="del-btn" onClick={() => delShop(i.id)} title="Löschen">🗑</button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {shopping.length === 0 && (
        <div className="empty">Die Einkaufsliste ist leer. Füge Artikel hinzu!</div>
      )}

      <button className="btn-ghost" onClick={clearDoneShop} style={{ marginTop: 4, fontSize: 12 }}>
        🗑 Erledigte löschen
      </button>
    </>
  );
}
