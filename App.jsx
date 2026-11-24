import { useEffect, useMemo, useState } from 'react'
import { LISTINGS, RENTALS, ADS, CHATS, REVIEWS, CITIES, CATEGORIES, GIFT_TILES } from './listings.js'

const SITE = import.meta.env.VITE_SITE_URL || 'https://ziro.site'
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d } }
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v))

function Card({ p, saved, onSave, onOpen, onWatch, watched }) {
  return (
    <div className="card">
      <div className="img" role="button" onClick={() => onOpen(p)}>{p.emoji}</div>
      <div className="body">
        <button className={'heart' + (saved ? ' on' : '')} onClick={() => onSave(p.id)} aria-label="Save">{saved ? '♥' : '♡'}</button>
        <div className="price">${p.price}</div>
        <div className="title" role="button" onClick={() => onOpen(p)}>{p.title}</div>
        <div className="meta">{p.condition} · {p.city} · {p.time}</div>
        <div className="meta">Rent it · ${p.rentPerDay}/day</div>
        <div className="meta">{p.seller}</div>
        <button className="btn ghost" style={{ marginTop: 8, padding: '6px 10px' }} onClick={() => onWatch(p.id)}>{watched ? '✓ Watching' : 'Watch'}</button>
      </div>
    </div>
  )
}

const PAGES = {
  terms: ['Terms of Service', 'ziro takes 10% from every sale. Sellers should price their item 10% higher than the amount they want to keep — for example, on a $100 sale, $10 goes to ziro and the seller keeps $90. Ads cost $0.99 for an image ad and $2.99 for a video ad. Rent It rentals have a refundable deposit. Meet in public, check the item before paying, and never share passwords or bank details.'],
  privacy: ['Privacy Policy', 'ziro collects the name, email and listings you enter, and card brand, last 4 digits and expiry only for payments. Your full card number is never stored by ziro. Your information is never sold.'],
  safety: ['Safety tips', 'Meet in a public place. Bring an adult. Never share passwords or bank details. Check the item before you pay. If something feels wrong, stop and report it. Watch out for scams: too-good-to-be-true prices, pressure to pay fast, and asks to pay outside ziro.'],
  launch: ['Launch checklist — About ziro', 'Ready in ziro: marketplace, Rent It, Saved, alerts, ads, payments demo, footer pages, Google and Facebook sign-in setup. Still needed outside ziro: real hosting on ziro.site, real Stripe with an adult, removing sample listings, and real users.'],
  returns: ['Returns', 'Returns are agreed between buyer and seller. Check the item before you pay, and report problems quickly.'],
  contact: ['Contact', 'Questions about ziro? Use Report on a listing, or ask a seller through Chat. There is no phone support yet.'],
  browse: ['Browse', 'Browse all listings across the Greater Toronto Area.'],
  rent: ['Rent It', 'Rent items by the day instead of buying them. Pick 1, 3, 7, 14 or 30 days.'],
  deals: ['Best deals', 'The cheapest listings first.'],
  saved: ['Saved items', 'Tap the heart on any listing to save it here.'],
}

export default function App() {
  const [route, setRoute] = useState('home')
  const [page, setPage] = useState(null)
  const [category, setCategory] = useState('All')
  const [city, setCity] = useState('All cities')
  const [sort, setSort] = useState('Newest')
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState(null)
  const [rentDays, setRentDays] = useState(3)
  const [saved, setSaved] = useState(() => load('ziro_saved', []))
  const [watched, setWatched] = useState(() => load('ziro_watched', []))
  const [userListings, setUserListings] = useState(() => load('ziro_mine', []))
  const [notifications, setNotifications] = useState(() => load('ziro_notes', []))
  const [recent, setRecent] = useState(() => load('ziro_recent', []))
  const [user, setUser] = useState(() => load('ziro_user', null))
  const [showSignin, setShowSignin] = useState(false)
  const [showSnap, setShowSnap] = useState(false)
  const [showSell, setShowSell] = useState(false)
  const [showChat, setShowChat] = useState(null)
  const [ads, setAds] = useState(ADS)
  const [adIndex, setAdIndex] = useState(0)
  const [payments, setPayments] = useState(() => load('ziro_payments', []))
  const [cards, setCards] = useState(() => load('ziro_cards', []))
  const [editId, setEditId] = useState(null)
  const [offer, setOffer] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [chatText, setChatText] = useState('')
  const [chats, setChats] = useState(CHATS)
  const [form, setForm] = useState({ title: '', price: '', desc: '', category: 'Clothing', city: 'Toronto', condition: 'Used', rent: 3 })
  const [account, setAccount] = useState({ name: '', email: '' })

  useEffect(() => save('ziro_saved', saved), [saved])
  useEffect(() => save('ziro_watched', watched), [watched])
  useEffect(() => save('ziro_mine', userListings), [userListings])
  useEffect(() => save('ziro_notes', notifications), [notifications])
  useEffect(() => save('ziro_recent', recent), [recent])
  useEffect(() => save('ziro_user', user), [user])
  useEffect(() => save('ziro_payments', payments), [payments])
  useEffect(() => save('ziro_cards', cards), [cards])

  useEffect(() => {
    const t = setInterval(() => setAdIndex(i => (i + 1) % ads.length), 7000)
    return () => clearInterval(t)
  }, [ads.length])

  const all = useMemo(() => [...userListings, ...LISTINGS], [userListings])
  const filtered = useMemo(() => {
    let list = all.filter(p => (category === 'All' || p.category === category) && (city === 'All cities' || p.city === city))
    if (sort === 'Price low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price high to low') list = [...list].sort((a, b) => b.price - a.price)
    return list
  }, [all, category, city, sort])
  const bestDeals = useMemo(() => [...all].sort((a, b) => a.price - b.price), [all])
  const localDeals = useMemo(() => all.filter(p => p.price <= 25).sort((a, b) => a.distanceKm - b.distanceKm), [all])
  const unread = notifications.filter(n => !n.read).length
  const ad = ads[adIndex]

  function openProduct(p) {
    setProduct(p); setRentDays(3); setRoute('product')
    setRecent(r => [p.id, ...r.filter(id => id !== p.id)].slice(0, 8))
  }
  function toggleSave(id) { setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]) }
  function toggleWatch(id) { setWatched(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]) }
  function goBrowse(cat) { setCategory(cat || 'All'); setRoute('browse'); setPage(null); window.scrollTo(0, 0) }
  function goPage(name) { setPage(name); setRoute('page'); window.scrollTo(0, 0) }
  function submitSell(e) {
    e.preventDefault()
    if (!form.title || !form.price) return alert('Add a title and a price.')
    const item = { id: Date.now(), title: form.title, price: Number(form.price), rentPerDay: Number(form.rent || 3), category: form.category, city: form.city, distanceKm: 1, condition: form.condition, seller: user ? '@' + user.name.toLowerCase().replace(/\s+/g, '_') : '@you', time: 'Just now', emoji: '📦', desc: form.desc || 'Listed on ziro.', seed: false }
    setUserListings(u => [item, ...u]); setShowSell(false); setForm({ title: '', price: '', desc: '', category: 'Clothing', city: 'Toronto', condition: 'Used', rent: 3 }); setRoute('mine')
  }
  function saveEdit(id, title, price, desc) {
    setUserListings(u => u.map(p => {
      if (p.id !== id) return p
      if (price < p.price && watched.includes(id)) setNotifications(n => [{ id: Date.now(), text: `Price drop: ${p.title} is now $${price}`, read: false }, ...n])
      return { ...p, title, price, desc }
    })); setEditId(null)
  }
  function deleteListing(id) { if (confirm('Delete this listing?')) setUserListings(u => u.filter(p => p.id !== id)) }
  function payAd(adItem) {
    const card = cards[0]
    if (!card) return alert('Add a payment method first (Pay page). This demo stores only card brand, last 4 and expiry — no real money moves.')
    setPayments(p => [{ id: Date.now(), label: `Ad: ${adItem.business}`, amount: adItem.price, date: new Date().toLocaleDateString() }, ...p])
    setAds(a => a.map(x => x.id === adItem.id ? { ...x, status: 'LIVE' } : x))
    alert('Paid (demo). Your ad is now LIVE. No real money moved.')
  }
  function addCard(e) {
    e.preventDefault()
    const f = new FormData(e.target)
    const num = String(f.get('number')).replace(/\s+/g, '')
    if (num.length < 15) return alert('Check the card number.')
    setCards(c => [...c, { brand: num.startsWith('4') ? 'Visa' : 'Card', last4: num.slice(-4), expiry: f.get('expiry') }])
    e.target.reset()
  }
  function signInLocal() {
    if (!account.name || !account.email) return alert('Enter your name and email.')
    setUser({ name: account.name, email: account.email, how: 'Email' }); setShowSignin(false)
  }

  const recs = query ? all.filter(p => p.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5) : all.slice(0, 5)

  return (
    <div>
      <header>
        <div className="topbar">
          <div className="logo" role="button" onClick={() => { setRoute('home'); setPage(null) }}>ziro<span>↻</span></div>
          <div className="searchbar">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for items" aria-label="Search for items" />
            <button className="snapbtn" title="SNAP IT" onClick={() => setShowSnap(true)}>⌖</button>
            <button onClick={() => goBrowse('All')}>Search</button>
          </div>
          <button className="sellbtn" onClick={() => setShowSell(true)}>SELL</button>
          {user && <button className="btn ghost" onClick={() => setRoute('account')}>{user.name[0].toUpperCase()}</button>}
        </div>
        <div className="row2">
          <button onClick={() => setRoute('saved')}>Saved {saved.length ? `(${saved.length})` : ''}</button>
          <button onClick={() => setRoute('alerts')}>Alerts {unread ? <span className="badge">{unread}</span> : ''}</button>
          <button onClick={() => setRoute('chat')}>💬 Chat</button>
          <button onClick={() => setRoute('ads')}>Ads</button>
          <button onClick={() => setRoute('pay')}>Pay</button>
          {user ? <button onClick={() => setRoute('account')}>{user.name}</button> : <>
            <button className="login" onClick={() => setShowSignin(true)}>Log in</button>
            <button className="signin" onClick={() => setShowSignin(true)}>Sign in</button>
          </>}
        </div>
        <div className="cats">{CATEGORIES.map(c => <button key={c} className={category === c ? 'on' : ''} onClick={() => goBrowse(c)}>{c}</button>)}</div>
      </header>

      {query && route === 'home' && <div className="wrap"><div className="panel"><b>Recommendations</b>{recs.map(p => <div key={p.id} role="button" onClick={() => openProduct(p)}>{p.emoji} {p.title} — ${p.price}</div>)}</div></div>}

      {route === 'home' && <>
        <div className="wrap">
          <div className="adspot" key={ad.id}>
            <div className="adimg">{ad.emoji}</div>
            <div className="adbody"><div>{ad.business}</div><h3>{ad.title}</h3><p>{ad.desc}</p><p className="small">{ad.link} · {ad.clicks} clicks</p>
              <button onClick={() => { setAds(a => a.map(x => x.id === ad.id ? { ...x, clicks: x.clicks + 1 } : x)); const p = all.find(x => x.id === ad.listingId); if (p) openProduct(p) }}>See listing</button></div>
          </div>
          <div className="banner"><div><h1>List it, Sell it</h1><p>Sell what you don't use. Rent what you need.</p><button onClick={() => setShowSell(true)}>List yours right now!</button></div><div style={{ fontSize: 64 }}>👟</div></div>

          <h2>Rent It</h2>
          <div className="grid">{RENTALS.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
          <button className="btn ghost" onClick={() => goBrowse('All')}>Browse rentals</button>

          <h2>Gift them home</h2>
          <div className="tiles">{GIFT_TILES.map(t => <button key={t} className="tile" onClick={() => goBrowse('Home')}><b>{t}</b>Home</button>)}</div>
          <h2>Cook with heart</h2><div className="tiles">{['Cookware', 'Blenders', 'Mugs'].map(t => <button key={t} className="tile" onClick={() => goBrowse('Home')}><b>{t}</b>Kitchen</button>)}</div>
          <h2>Game like a gamer</h2><div className="tiles">{['Consoles', 'Games', 'Controllers'].map(t => <button key={t} className="tile" onClick={() => goBrowse('Games')}><b>{t}</b>Games</button>)}</div>
          <h2>Move like an athlete</h2><div className="tiles">{['Dumbbells', 'Balls', 'Yoga'].map(t => <button key={t} className="tile" onClick={() => goBrowse('Sports')}><b>{t}</b>Sports</button>)}</div>

          <h2>Best deals</h2>
          <div className="grid">{bestDeals.slice(0, 8).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>

          <h2>Local deals near you</h2>
          <p className="small">Items $25 and under, within 5 km, nearest first.</p>
          <div className="grid">{localDeals.slice(0, 8).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>

          {recent.length > 0 && <><h2>Recently viewed</h2><div className="grid">{recent.map(id => all.find(p => p.id === id)).filter(Boolean).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div></>}

          <h2>All listings</h2>
          <div className="grid">{all.slice(0, 12).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
          <button className="btn" style={{ marginTop: 12 }} onClick={() => goBrowse('All')}>See all {all.length} listings</button>
        </div>
      </>}

      {route === 'browse' && <div className="wrap">
        <h2>{category === 'All' ? 'All listings' : category}</h2>
        <div className="filters">
          <select value={city} onChange={e => setCity(e.target.value)}><option>All cities</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
          <select value={sort} onChange={e => setSort(e.target.value)}><option>Newest</option><option>Price low to high</option><option>Price high to low</option></select>
          <span className="small">{filtered.length} listings</span>
        </div>
        <div className="grid">{filtered.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
      </div>}

      {route === 'product' && product && <div className="wrap">
        <button className="btn ghost" onClick={() => setRoute('home')}>← Back</button>
        <div className="panel">
          <div style={{ fontSize: 90, textAlign: 'center' }}>{product.emoji}</div>
          <h2>{product.title}</h2><p className="price" style={{ fontSize: 24 }}>${product.price}</p>
          <p>{product.desc}</p><p className="small">{product.condition} · {product.city} · {product.seller} · {product.time}</p>
          <button className="btn ghost" onClick={() => { navigator.clipboard?.writeText(SITE + '/listing/' + product.id); alert('Link copied to share.') }}>Share</button>{' '}
          <button className="btn ghost" onClick={() => { const r = prompt('Report this listing — what is wrong?'); if (r) alert('Thanks. Your report was sent.') }}>Report</button>
        </div>
        <div className="panel"><h3>Rent It</h3>
          <p>Rent it · ${product.rentPerDay}/day · Refundable deposit ${Math.round(product.price * 0.2)}</p>
          <div className="filters">{[1, 3, 7, 14, 30].map(d => <button key={d} className={'btn ' + (rentDays === d ? '' : 'ghost')} onClick={() => setRentDays(d)}>{d} day{d > 1 ? 's' : ''}</button>)}</div>
          <p><b>Total: ${product.rentPerDay * rentDays + Math.round(product.price * 0.2)}</b> ({rentDays} days × ${product.rentPerDay} + ${Math.round(product.price * 0.2)} deposit)</p>
          <button className="btn teal" onClick={() => alert('Rent request sent (demo). No real money moved.')}>Rent It</button>
        </div>
        <div className="panel"><h3>Make Offer</h3><input type="number" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Your offer in $" /><button className="btn" onClick={() => { if (offer) { alert('Offer sent to ' + product.seller); setOffer('') } }}>Send offer</button></div>
        <div className="panel"><button className="btn" onClick={() => setRoute('chat')}>Message Seller</button></div>
        <div className="panel"><h3>Seller Reviews</h3>{REVIEWS.map((r, i) => <p key={i}>{'★'.repeat(r.stars)} {r.user} — {r.text}</p>)}</div>
        <div className="panel"><h3>Seller Profile</h3><p>{product.seller}</p><div className="grid">{all.filter(p => p.seller === product.seller && p.id !== product.id).slice(0, 4).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div></div>
      </div>}

      {route === 'saved' && <div className="wrap"><h2>Saved items</h2>{saved.length === 0 && <p>No saved items yet. Tap the heart on a listing.</p>}<div className="grid">{all.filter(p => saved.includes(p.id)).map(p => <Card key={p.id} p={p} saved onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div><h2>Watching</h2>{watched.length === 0 ? <p>Nothing watched yet.</p> : all.filter(p => watched.includes(p.id)).map(p => <p key={p.id}>{p.emoji} {p.title} — ${p.price}</p>)}</div>}

      {route === 'mine' && <div className="wrap"><h2>Your listings</h2>{userListings.length === 0 && <p>You have not listed anything yet.</p>}{userListings.map(p => <div key={p.id} className="panel"><b>{p.emoji} {p.title} — ${p.price}</b>{' '}<button className="btn ghost" onClick={() => openProduct(p)}>View</button>{' '}<button className="btn ghost" onClick={() => setEditId(p.id)}>{editId === p.id ? 'Close edit' : 'Edit'}</button>{' '}<button className="btn ghost" onClick={() => deleteListing(p.id)}>Delete</button>{editId === p.id && <EditForm p={p} onSave={saveEdit} />}</div>)}<p className="small">Seed listings cannot be deleted — only listings you create here.</p></div>}

      {route === 'alerts' && <div className="wrap"><h2>Notifications</h2><button className="btn ghost" onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}>Mark all read</button>{' '}<button className="btn ghost" onClick={() => setNotifications([])}>Clear</button>{notifications.length === 0 && <p>No notifications yet. Watch a listing and you will be told if its price drops.</p>}{notifications.map(n => <p key={n.id}>{n.read ? '' : '● '}{n.text}</p>)}</div>}

      {route === 'chat' && <div className="wrap"><h2>Chat</h2>{chats.map(c => <div key={c.id} className="panel" role="button" onClick={() => setShowChat(c)}><b>{c.user}</b> — {c.item}<p className="small">{c.messages[c.messages.length - 1].text}</p></div>)}
        {showChat && <div className="panel"><h3>{showChat.user}</h3>{showChat.messages.map((m, i) => <p key={i}><b>{m.from === 'me' ? 'You' : showChat.user}:</b> {m.text}</p>)}<input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type a message" /><button className="btn" onClick={() => { if (!chatText) return; setChats(cs => cs.map(c => c.id === showChat.id ? { ...c, messages: [...c.messages, { from: 'me', text: chatText }] } : c)); setShowChat(s => ({ ...s, messages: [...s.messages, { from: 'me', text: chatText }] })); setChatText('') }}>Send</button></div>}
      </div>}

      {route === 'ads' && <div className="wrap"><h2>Advertise</h2><p className="small">Image ad $0.99 · Video ad $2.99. Ads stay PENDING and invisible until paid, then go LIVE.</p>
        {ads.map(a => <div key={a.id} className="panel"><b>{a.emoji} {a.business}</b> — {a.title} · {a.status} · {a.clicks} clicks · ${a.price}<br /><button className="btn" onClick={() => payAd(a)}>Pay ${a.price} (demo)</button></div>)}
        <div className="panel"><h3>Seller tips</h3><p>ziro takes 10% from every sale. Price your item 10% higher than the amount you want to keep — on a $100 sale, $10 goes to ziro and you keep $90.</p></div>
      </div>}

      {route === 'pay' && <div className="wrap"><h2>Payment methods</h2><p className="small">Demo checkout — no real money moves. Only card brand, last 4 digits and expiry are stored.</p>
        <form onSubmit={addCard}><label>Card number</label><input name="number" placeholder="4242 4242 4242 4242" /><label>Expiry</label><input name="expiry" placeholder="12/28" /><label>CVC</label><input name="cvc" placeholder="123" /><button className="btn">Add card</button></form>
        {cards.map((c, i) => <p key={i}>{c.brand} ···· {c.last4} · Expires {c.expiry}</p>)}
        <h2>Recent payments</h2>{payments.length === 0 ? <p>No payments yet.</p> : payments.map(p => <p key={p.id}>{p.label} — ${p.amount} · {p.date}</p>)}
      </div>}

      {route === 'account' && <div className="wrap"><h2>Your account</h2>{user ? <><p><b>{user.name}</b><br />{user.email}<br />Signed in with: {user.how}<br />Status: Active</p><button className="btn ghost" onClick={() => setShowSignin(true)}>Create new account</button>{' '}<button className="btn ghost" onClick={() => setRoute('mine')}>Your listings</button>{' '}<button className="btn ghost" onClick={() => setRoute('saved')}>Saved items</button>{' '}<button className="btn ghost" onClick={() => setRoute('pay')}>Payment methods</button>{' '}<button className="btn" onClick={() => { setUser(null); setRoute('home') }}>Sign out</button></> : <p>Not signed in. <button className="btn" onClick={() => setShowSignin(true)}>Sign in</button></p>}</div>}

      {route === 'page' && page && PAGES[page] && <div className="wrap"><h2>{PAGES[page][0]}</h2><p>{PAGES[page][1]}</p><button className="btn ghost" onClick={() => setRoute('home')}>Back to homepage</button></div>}

      <footer>
        <div><h4>Buy</h4><button onClick={() => goBrowse('All')}>Browse</button><button onClick={() => goBrowse('All')}>Rent It</button><button onClick={() => setRoute('home')}>Best deals</button><button onClick={() => setRoute('saved')}>Saved</button><button onClick={() => setRoute('alerts')}>Price-drop alerts</button></div>
        <div><h4>Sell</h4><button onClick={() => setShowSell(true)}>Start selling</button><button onClick={() => setRoute('mine')}>Your listings</button><button onClick={() => setShowSnap(true)}>SNAP IT</button><button onClick={() => setRoute('ads')}>Advertise</button></div>
        <div><h4>About ziro</h4><button onClick={() => goPage('launch')}>About ziro</button><button onClick={() => goPage('terms')}>Terms of Service</button><button onClick={() => goPage('privacy')}>Privacy Policy</button><button onClick={() => goPage('safety')}>Safety tips</button></div>
        <div><h4>Help &amp; Contact</h4><button onClick={() => goPage('contact')}>Contact</button><button onClick={() => goPage('returns')}>Returns</button><button onClick={() => goPage('safety')}>Safety</button></div>
        <div><h4>Community</h4><button onClick={() => setRoute('chat')}>Chat</button><button onClick={() => setRoute('home')}>Local deals</button><button onClick={() => goPage('launch')}>Launch checklist</button></div>
      </footer>
      <p className="small" style={{ textAlign: 'center', padding: '0 0 20px' }}>ziro — List it. Sell it. Rent it. · ziro takes 10% from every sale · {SITE}</p>

      {showSignin && <div className="modal"><div className="box"><h3>Sign in / Create account</h3>
        <p className="small">Real sign-in uses Google and Facebook's own official pages. Full OAuth return to {SITE} needs the server keys set as environment variables (see README). No Apple sign-in.</p>
        <a className="social" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} href="https://accounts.google.com/AccountChooser" target="_blank" rel="noreferrer">Continue with Google</a>
        <a className="social" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }} href="https://www.facebook.com/login.php" target="_blank" rel="noreferrer">Continue with Facebook</a>
        <p className="small">Registered return addresses: {SITE}/signin/google/cb and {SITE}/signin/fb/cb</p>
        <label>Name</label><input value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} placeholder="Your name" />
        <label>Email</label><input value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} placeholder="you@example.com" />
        <button className="btn" onClick={signInLocal}>Create account / Log in</button>{' '}
        <button className="btn ghost" onClick={() => setShowSignin(false)}>Back to homepage</button>
      </div></div>}

      {showSnap && <div className="modal"><div className="box"><h3>SNAP IT</h3><p>Take a photo of an item to find similar listings. (Camera is used in the browser; no photo is uploaded in this demo.)</p><button className="btn" onClick={() => { setShowSnap(false); goBrowse('All') }}>Take Photo</button>{' '}<button className="btn ghost" onClick={() => setShowSnap(false)}>Close</button></div></div>}

      {showSell && <div className="modal"><div className="box"><h3>List it — Sell form</h3><form onSubmit={submitSell}>
        <label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <label>Price ($)</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <label>Rent per day ($)</label><input type="number" value={form.rent} onChange={e => setForm({ ...form, rent: e.target.value })} />
        <label>Description</label><textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
        <label>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select>
        <label>City</label><select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
        <label>Condition</label><select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option>New</option><option>Like New</option><option>Used</option></select>
        <p className="small">Tip: ziro takes 10% — price 10% higher than what you want to keep.</p>
        <button className="btn">List it</button>{' '}<button type="button" className="btn ghost" onClick={() => setShowSell(false)}>Cancel</button>
      </form></div></div>}
    </div>
  )
}

function EditForm({ p, onSave }) {
  const [t, setT] = useState(p.title); const [pr, setPr] = useState(p.price); const [d, setD] = useState(p.desc)
  return <div style={{ marginTop: 10 }}><input value={t} onChange={e => setT(e.target.value)} /><input type="number" value={pr} onChange={e => setPr(Number(e.target.value))} /><input value={d} onChange={e => setD(e.target.value)} /><button className="btn" onClick={() => onSave(p.id, t, pr, d)}>Save (price drop notifies watchers)</button></div>
}
