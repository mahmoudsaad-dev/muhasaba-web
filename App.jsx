import { useState, useEffect, useCallback } from 'react'

const TASKS = [
  { id: 'fajr',     name: 'صلاة الفجر',   icon: '🌅', pts: 4 },
  { id: 'dhuhr',    name: 'صلاة الظهر',   icon: '☀️', pts: 3 },
  { id: 'asr',      name: 'صلاة العصر',   icon: '🌤️', pts: 3 },
  { id: 'maghrib',  name: 'صلاة المغرب',  icon: '🌇', pts: 3 },
  { id: 'isha',     name: 'صلاة العشاء',  icon: '🌙', pts: 3 },
  { id: 'adhkar_s', name: 'أذكار الصباح', icon: '📿', pts: 4 },
  { id: 'adhkar_m', name: 'أذكار المساء', icon: '🕯️', pts: 4 },
  { id: 'quran',    name: 'الورد اليومي من القرآن', icon: '📖', pts: 4 },
  { id: 'witr',     name: 'صلاة الوتر',   icon: '⭐', pts: 2 },
]
const MAX_DAY = 30

const STORE = [
  { id: 'shield',       icon: '🛡️', name: 'درع الاستمرارية',     desc: 'يحمي سلسلة أيامك مرة واحدة لو فاتك يوم', cost: 50, type: 'consumable' },
  { id: 'tree',         icon: '🌲', name: 'ازرع شجرة إضافية',    desc: 'شجرة جديدة في حديقتك فورًا', cost: 40, type: 'consumable' },
  { id: 'adhkar',       icon: '📿', name: 'حصن المسلم المختصر',  desc: 'فتح قائمة أذكار الصباح والمساء داخل التطبيق', cost: 20, type: 'unlock' },
  { id: 'theme_light',  icon: '🌞', name: 'المظهر الفاتح',       desc: 'تغيير شكل التطبيق للوضع النهاري', cost: 30, type: 'theme' },
  { id: 'theme_golden', icon: '🏵️', name: 'المظهر الذهبي',       desc: 'مظهر ذهبي فاخر', cost: 60, type: 'theme' },
]

const ADHKAR_MORNING = [
  'آية الكرسي (مرة)',
  'الإخلاص والمعوذتين (3 مرات)',
  'أصبحنا وأصبح الملك لله... (مرة)',
  'اللهم بك أصبحنا وبك أمسينا... (مرة)',
  'سيد الاستغفار (مرة)',
  'سبحان الله وبحمده (100 مرة)',
  'لا إله إلا الله وحده لا شريك له... (10 مرات)',
]
const ADHKAR_EVENING = [
  'آية الكرسي (مرة)',
  'الإخلاص والمعوذتين (3 مرات)',
  'أمسينا وأمسى الملك لله... (مرة)',
  'اللهم بك أمسينا وبك أصبحنا... (مرة)',
  'أعوذ بكلمات الله التامات من شر ما خلق (3 مرات)',
  'سبحان الله وبحمده (100 مرة)',
]

function todayKey() {
  const d = new Date()
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}
function load(k, def) {
  try {
    const v = localStorage.getItem('muhasaba_' + k)
    return v === null ? def : JSON.parse(v)
  } catch (e) {
    return def
  }
}
function save(k, v) {
  localStorage.setItem('muhasaba_' + k, JSON.stringify(v))
}

function fmtDate() {
  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
  const d = new Date()
  return days[d.getDay()] + '، ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear()
}

const DEFAULT_STATE = {
  wallet: 0, lifetime: 0, streak: 0, bestStreak: 0,
  shields: 0, extraTrees: 0, owned: [], theme: 'dark', lastDay: null,
}

export default function App() {
  const [state, setState] = useState(() => load('state', { ...DEFAULT_STATE }))
  const [done, setDone] = useState(() => load('day_' + todayKey(), {}))
  const [page, setPage] = useState('today')
  const [msg, setMsg] = useState('')
  const [modal, setModal] = useState(null)
  const [confetti, setConfetti] = useState([])

  const dayPoints = useCallback(
    (d = done) => Math.min(TASKS.reduce((p, t) => p + (d[t.id] ? t.pts : 0), 0), MAX_DAY),
    [done]
  )

  const celebrate = useCallback((text) => {
    const em = ['🎉', '✨', '🌟', '💚', '🤍']
    const burst = Array.from({ length: 14 }, (_, i) => ({
      id: Date.now() + '-' + i,
      char: em[i % em.length],
      left: Math.random() * 95 + 'vw',
      delay: Math.random() * 0.6 + 's',
    }))
    setConfetti((c) => [...c, ...burst])
    setTimeout(() => {
      setConfetti((c) => c.filter((x) => !burst.some((b) => b.id === x.id)))
    }, 2800)
    if (text) setMsg(text)
  }, [])

  // Streak engine: runs once per app open
  useEffect(() => {
    setState((prev) => {
      const today = todayKey()
      if (prev.lastDay === today) return prev
      let missed = 0
      const d = new Date()
      d.setDate(d.getDate() - 1)
      while (true) {
        const k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
        const dd = load('day_' + k, null)
        let pts = 0
        if (dd) pts = Math.min(TASKS.reduce((p, t) => p + (dd[t.id] ? t.pts : 0), 0), MAX_DAY)
        if (pts >= 10) break
        if (dd === null && k === prev.lastDay) break
        missed++
        if (missed > 1) break
        d.setDate(d.getDate() - 1)
      }
      const next = { ...prev, lastDay: today }
      if (missed > 0) {
        if (next.shields > 0) {
          next.shields--
          setMsg('🛡️ درع الاستمرارية حمى سلسلتك!')
        } else {
          next.streak = 0
        }
      }
      save('state', next)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Theme
  useEffect(() => {
    document.body.className = state.theme === 'light' ? 'light' : state.theme === 'golden' ? 'golden' : ''
  }, [state.theme])

  function toggleTask(id) {
    const task = TASKS.find((t) => t.id === id)
    const wasDone = !!done[id]
    const newDone = { ...done, [id]: !wasDone }
    setDone(newDone)
    save('day_' + todayKey(), newDone)
    setState((prev) => {
      const next = { ...prev }
      if (!wasDone) {
        next.wallet += task.pts
        next.lifetime += task.pts
      } else {
        next.wallet = Math.max(0, next.wallet - task.pts)
        next.lifetime = Math.max(0, next.lifetime - task.pts)
      }
      // first time today reaching 10 points advances the streak
      const p = Math.min(TASKS.reduce((s, t) => s + (newDone[t.id] ? t.pts : 0), 0), MAX_DAY)
      if (!wasDone && p >= 10 && !next['streakCounted_' + todayKey()]) {
        next.streak++
        if (next.streak > next.bestStreak) next.bestStreak = next.streak
        next['streakCounted_' + todayKey()] = true
        setTimeout(() => celebrate('🔥 ' + next.streak + ' أيام متتالية!'), 0)
      }
      save('state', next)
      return next
    })
    if (!wasDone && dayPoints(newDone) >= MAX_DAY) {
      celebrate('يوم كامل! تقبّل الله منك 🤍')
    }
  }

  function buy(id) {
    const s = STORE.find((x) => x.id === id)
    if (!s || state.wallet < s.cost) return
    if (s.type !== 'consumable' && state.owned.includes(id)) return
    setState((prev) => {
      const next = { ...prev, wallet: prev.wallet - s.cost }
      if (s.id === 'shield') { next.shields++; setMsg('🛡️ تم! درعك جاهز لو فاتك يوم') }
      else if (s.id === 'tree') { next.extraTrees++; setMsg('🌲 زرعت شجرة جديدة!'); setTimeout(() => celebrate(), 0) }
      else { next.owned = [...next.owned, id]; setMsg('تم الفتح ✨') }
      save('state', next)
      return next
    })
  }

  function useTheme(id) {
    const theme = id === 'theme_light' ? 'light' : id === 'theme_golden' ? 'golden' : 'dark'
    setState((prev) => {
      const next = { ...prev, theme }
      save('state', next)
      return next
    })
  }

  const p = dayPoints()
  const autoMsg =
    p >= MAX_DAY ? 'ما شاء الله! يوم كامل، تقبّل الله 🤍'
    : p >= 20 ? 'قربت توصل للهدف، أكمل!'
    : p >= 10 ? 'بداية جميلة، استمر' : ''

  const earnedTrees = Math.floor(state.lifetime / 30)
  const totalTrees = earnedTrees + state.extraTrees
  const species = ['🌳', '🌲', '🌴', '🎋', '🌵', '🍀']

  return (
    <>
      <div className="wrap">
        <header>
          <div className="basmala">بسم الله الرحمن الرحيم</div>
          <h1>محاسبة النفس</h1>
          <div className="date">{fmtDate()}</div>
        </header>

        <div className="stats">
          <div className="stat"><div className="num">{p}</div><div className="lbl">نقاط اليوم</div></div>
          <div className="stat hot"><div className="num">{state.streak} 🔥</div><div className="lbl">أيام متتالية</div></div>
          <div className="stat"><div className="num">{state.wallet}</div><div className="lbl">رصيدك</div></div>
        </div>

        {page === 'today' && (
          <div className="page">
            <div className="progress">
              <div className="row"><span>هدف اليوم</span><span className="pts">{p} / {MAX_DAY}</span></div>
              <div className="bar"><div style={{ width: Math.round((p / MAX_DAY) * 100) + '%' }}></div></div>
            </div>
            <div className="msg">{msg || autoMsg}</div>
            <div>
              {TASKS.map((t) => (
                <div key={t.id} className={'task' + (done[t.id] ? ' done' : '')} onClick={() => toggleTask(t.id)}>
                  <div className="icon">{t.icon}</div>
                  <div className="body">
                    <div className="name">{t.name}</div>
                    <div className="pts">+{t.pts} نقاط</div>
                  </div>
                  <div className="check">✔</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'garden' && (
          <div className="page">
            <div className="garden">
              <div className="trees">
                {totalTrees === 0
                  ? <div style={{ fontSize: 52 }}>🌱</div>
                  : Array.from({ length: Math.min(totalTrees, 48) }, (_, i) => (
                      <span key={i}>{species[i % species.length]}</span>
                    ))}
              </div>
              <div className="stage">
                {totalTrees === 0 ? 'حديقتك لسه بذرة' : 'عندك ' + totalTrees + ' شجرة 🌳'}
              </div>
              <div className="hint">
                {totalTrees === 0
                  ? 'كل 30 نقطة تكسبها تزرع شجرة جديدة. ابدأ اليوم!'
                  : (30 - (state.lifetime % 30)) + ' نقطة وتزرع الشجرة رقم ' + (totalTrees + 1)}
              </div>
            </div>
          </div>
        )}

        {page === 'store' && (
          <div className="page">
            {STORE.map((s) => {
              const owned = state.owned.includes(s.id)
              let btn
              let desc = s.desc
              if (s.type === 'consumable') {
                const count = s.id === 'shield' ? state.shields : state.extraTrees
                if (count > 0) desc += ' (عندك: ' + count + ')'
                btn = <button disabled={state.wallet < s.cost} onClick={() => buy(s.id)}>{s.cost} نقطة</button>
              } else if (owned) {
                btn = s.type === 'theme'
                  ? <button className="owned" onClick={() => useTheme(s.id)}>استخدم</button>
                  : <button className="owned" onClick={() => setModal('adhkar')}>افتح</button>
              } else {
                btn = <button disabled={state.wallet < s.cost} onClick={() => buy(s.id)}>{s.cost} نقطة</button>
              }
              return (
                <div key={s.id} className="item">
                  <div className="icon">{s.icon}</div>
                  <div className="body">
                    <div className="name">{s.name}</div>
                    <div className="desc">{desc}</div>
                  </div>
                  {btn}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <nav>
        <button className={page === 'today' ? 'active' : ''} onClick={() => setPage('today')}><span className="i">✅</span>اليوم</button>
        <button className={page === 'garden' ? 'active' : ''} onClick={() => setPage('garden')}><span className="i">🌳</span>حديقتي</button>
        <button className={page === 'store' ? 'active' : ''} onClick={() => setPage('store')}><span className="i">🛍️</span>المتجر</button>
      </nav>

      {modal === 'adhkar' && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <h3>أذكار الصباح</h3>
            <ul>{ADHKAR_MORNING.map((a, i) => <li key={i}>{a}</li>)}</ul>
            <h3 style={{ marginTop: 14 }}>أذكار المساء</h3>
            <ul>{ADHKAR_EVENING.map((a, i) => <li key={i}>{a}</li>)}</ul>
            <button className="close" onClick={() => setModal(null)}>حسنًا</button>
          </div>
        </div>
      )}

      {confetti.map((c) => (
        <div key={c.id} className="confetti" style={{ left: c.left, animationDelay: c.delay }}>{c.char}</div>
      ))}
    </>
  )
}
