import React, { useState, useRef } from 'react';
import { useFamilyStore } from '../../store/useFamilyStore';
import DayPopup from './DayPopup';
import RenderIcon from '../icons/RenderIcon';
import { todayStr, getMonday, dKey, DN, MONTHS } from '../../utils/dates';

function weekLabel(offset: number, mon: Date): string {
  if (offset === 0) return 'Diese Woche';
  if (offset === 1) return 'Nächste Woche';
  if (offset === -1) return 'Letzte Woche';
  const end = new Date(mon);
  end.setDate(mon.getDate() + 6);
  return `${mon.getDate()}. ${MONTHS[mon.getMonth()].substring(0, 3)} – ${end.getDate()}. ${MONTHS[end.getMonth()].substring(0, 3)}`;
}

export default function Calendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [openDay,    setOpenDay]    = useState<string | null>(null);
  const touchStartX = useRef(0);

  const cats  = useFamilyStore(s => s.cats);
  const days  = useFamilyStore(s => s.days);
  const tasks = useFamilyStore(s => s.tasks);
  const names = useFamilyStore(s => s.names);
  const today = todayStr();

  // Only date-type tasks appear in calendar
  const tasksByDate: Record<string, { person: string; title: string; done: boolean }[]> = {};
  tasks.filter(t => t.type === 'date' && t.date).forEach(t => {
    if (!tasksByDate[t.date!]) tasksByDate[t.date!] = [];
    tasksByDate[t.date!].push({ person: t.person, title: t.title, done: t.done });
  });

  function dayOwner(dk: string): 'mama' | 'papa' | 'both' | null {
    const dd = days[dk];
    if (!dd) return null;
    const owners = new Set<string>();
    cats.forEach(c => {
      const v = dd[c.id];
      if (v === 'mama') owners.add('mama');
      else if (v === 'papa') owners.add('papa');
    });
    if (owners.size === 0) return null;
    if (owners.size === 2) return 'both';
    return owners.has('mama') ? 'mama' : 'papa';
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (delta < -60) setWeekOffset(w => w + 1);
    if (delta >  60) setWeekOffset(w => w - 1);
    setOpenDay(null);
  }

  const mon   = getMonday(weekOffset);
  const label = weekLabel(weekOffset, mon);

  return (
    <>
      <div className="legend">
        <div className="leg-item"><div className="leg-dot leg-m" /><span>{names.mama}</span></div>
        <div className="leg-item"><div className="leg-dot leg-p" /><span>{names.papa}</span></div>
        <div className="leg-item"><div className="leg-dot leg-b" /><span>Beide</span></div>
      </div>

      <div className="cal-week-nav">
        <button className="cal-nav-btn" onClick={() => { setWeekOffset(w => w - 1); setOpenDay(null); }}>‹</button>
        <span className="cal-week-label">{label}</span>
        <button className="cal-nav-btn" onClick={() => { setWeekOffset(w => w + 1); setOpenDay(null); }}>›</button>
      </div>

      <div className="cal-grid" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {Array.from({ length: 7 }, (_, d) => {
          const day   = new Date(mon);
          day.setDate(mon.getDate() + d);
          const dk    = dKey(day);
          const owner = dayOwner(dk);
          const dd    = days[dk] || {};
          const dayTasks = tasksByDate[dk] || [];

          let cls = 'cal-day';
          if (dk === today)          cls += ' today';
          if (owner === 'mama')      cls += ' day-mama';
          else if (owner === 'papa') cls += ' day-papa';
          else if (owner === 'both') cls += ' day-both';
          if (openDay === dk)        cls += ' open';

          return (
            <div key={dk} className={cls} onClick={() => setOpenDay(p => p === dk ? null : dk)}>
              <div className="cal-dn">{DN[day.getDay()]}</div>
              <div className="cal-dd">{day.getDate()}</div>
              <div className="cal-cats">
                {cats.map(c => {
                  const v = dd[c.id];
                  if (!v || v === 'none') {
                    return (
                      <div key={c.id} className="cat-chip chip-none">
                        <RenderIcon id={c.icon} size={9} color="#b08898" />
                      </div>
                    );
                  }
                  const chipCls = v === 'mama' ? 'chip-mama' : 'chip-papa';
                  const color   = v === 'mama' ? '#7a2d52'   : '#0C447C';
                  return (
                    <div key={c.id} className={`cat-chip ${chipCls}`}>
                      <RenderIcon id={c.icon} size={9} color={color} />
                      <span className="chip-name">{v === 'mama' ? names.mama : names.papa}</span>
                    </div>
                  );
                })}
              </div>

              {/* Dated tasks as signal chips */}
              {dayTasks.length > 0 && (
                <div className="cal-task-chips">
                  {dayTasks.slice(0, 2).map((t, i) => {
                    const isOverdue = dk < today && !t.done;
                    const chipCls   = t.done        ? 'cal-task-done'
                                    : isOverdue     ? 'cal-task-overdue'
                                    : t.person === 'mama' ? 'cal-task-mama'
                                    : t.person === 'papa' ? 'cal-task-papa'
                                    : 'cal-task-both';
                    return (
                      <div key={i} className={`cal-task-chip ${chipCls}`} title={t.title}>
                        {t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <div className="cal-task-chip cal-task-more">+{dayTasks.length - 2}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {openDay && <DayPopup dk={openDay} onClose={() => setOpenDay(null)} />}
    </>
  );
}
