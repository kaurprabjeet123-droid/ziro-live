import { useEffect, useMemo, useRef, useState } from 'react'
import { LISTINGS, RENTALS, ADS, CHATS, REVIEWS, CITIES, CATEGORIES, SHOWCASE, FOOTER, INFO, rentOf, depOf } from './data/listings.js'

const SITE = import.meta.env.VITE_SITE_URL || 'https://ziro.site'
// OAuth client IDs are NOT read from build-time VITE_* vars here.
// They are fetched at run time from /api/auth/config (see
// api/auth/config.js), which reads them from Vercel env vars.
// That matters: a build-time empty ID made the bundler delete the
// real Google/Facebook redirect as dead code. The IDs are public
// (like a username); the secrets never leave the server.
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d } catch { return d } }
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* storage full (photos) — keep going */ } }
// --- Per-user storage (v2) + old-demo purge ---
// Old demo data (Sneaker Spot / Game Zone / Home Nest / Cycle City ads,
// the 43 sample listings) lived under the old shared keys (ziro_ads,
// ziro_saved, ...). Those keys are NEVER read again: everything now
// lives under ziro_v2_u_<user>_<thing>, so a browser that visited the
// old demo shows no ads and no products. On first load we also delete
// the old shared keys outright, so the demo data is gone for good.
const DEMO_AD_BUSINESSES = ['Sneaker Spot', 'Game Zone', 'Home Nest', 'Cycle City']
const userIdOf = (u) => u ? String(u.email || u.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'user' : null
const perKey = (base, usr) => { const id = userIdOf(usr); return id ? `ziro_v2_u_${id}_${base}` : `ziro_v2_${base}` }
const readKey = (k) => { try { const v = localStorage.getItem(k); return v == null ? undefined : JSON.parse(v) } catch { return undefined } }
const cleanAds = (arr) => (Array.isArray(arr) ? arr : []).filter(a => a && !DEMO_AD_BUSINESSES.includes(a.business))
const cleanListings = (arr) => (Array.isArray(arr) ? arr : []).filter(x => x && !x.seed)
const loadFor = (base, def, usr) => {
  const v = readKey(perKey(base, usr))
  if (v === undefined) return def
  if (base === 'ads') return cleanAds(v)
  if (base === 'mine') return cleanListings(v)
  return v
}
const sellerKey = (s) => String(s || '').replace(/^@/, '')

function ScanIcon() {
  // User's exact SNAP IT icon: black corner brackets on white, QR/scan frame.
  return <img src="/assets/snap-it.png" alt="" width="22" height="22" aria-hidden="true" style={{ display: 'block', imageRendering: 'pixelated' }} />
}

function Card({ p, saved, onSave, onOpen, onWatch, watched }) {
  return (
    <div className="card">
      <div className="img" role="button" onClick={() => onOpen(p)}>
        <img src={p.photo || '/assets/mysterybox.jpg'} alt={p.title} loading="lazy" />
        <span className="clicks">{p.clicks ? `${p.clicks} views` : ''}</span>
      </div>
      <div className="body">
        <button className={'heart' + (saved ? ' on' : '')} onClick={() => onSave(p.id)} aria-label="Save">{saved ? '♥' : '♡'}</button>
        <div className="price">${p.price}</div>
        <div className="title" role="button" onClick={() => onOpen(p)}>{p.title}</div>
        <div className="meta">{p.condition} · {p.city} · {p.time}</div>
        <div className="meta">Rent it · ${p.rentPerDay}/day</div>
        <div className="meta">{p.seller}</div>
        <button className="watchbtn" onClick={() => onWatch(p.id)}>{watched ? '✓ Watching' : 'Watch'}</button>
      </div>
    </div>
  )
}

function matchesFilter(p, f, saved, recent) {
  if (!f) return true
  switch (f.kind) {
    case 'cat': return f.value === 'All' || p.category === f.value
    case 'group': return p.group === f.value
    case 'keyword': return (p.title + ' ' + p.desc).toLowerCase().includes(String(f.value).toLowerCase())
    case 'theme':
      if (f.value === 'home') return p.category === 'Home'
      if (f.value === 'kitchen') return p.group === 'kitchen'
      if (f.value === 'gamer') return p.category === 'Games'
      if (f.value === 'sports') return p.category === 'Sports'
      return true
    case 'deals': return p.price <= 25
    case 'local': return p.price <= 25 && p.distanceKm <= 5
    case 'rent': return true
    case 'recent': return recent.includes(p.id)
    case 'saved': return saved.includes(p.id)
    default: return true
  }
}

const SHOWCASE_TITLES = { gift: ['Gift them home', "Home favourites they'll actually use"], cook: ['Cook with heart', 'Kitchen gear for people who love to cook'], game: ['Game like a gamer', 'Consoles, controllers and games'], athlete: ['Move like an athlete', 'Sports gear, ready to play'] }

export default function App() {
  const [route, setRoute] = useState('home')
  const [infoKey, setInfoKey] = useState(null)
  const [browse, setBrowse] = useState(null) // {kind, value, title}
  const [category, setCategory] = useState('All')
  const [city, setCity] = useState('All cities')
  const [sort, setSort] = useState('Newest')
  const [query, setQuery] = useState('')
  const [product, setProduct] = useState(null)
  const [rentDays, setRentDays] = useState(3)
  const [user, setUser] = useState(() => load('ziro_user', null))
  const loadedForRef = useRef(userIdOf(load('ziro_user', null)))
  const [saved, setSaved] = useState(() => loadFor('saved', [], load('ziro_user', null)))
  const [watched, setWatched] = useState(() => loadFor('watched', [], load('ziro_user', null)))
  const [userListings, setUserListings] = useState(() => loadFor('mine', [], load('ziro_user', null)))
  const [notifications, setNotifications] = useState(() => loadFor('notes', [], load('ziro_user', null)))
  const [recent, setRecent] = useState(() => loadFor('recent', [], load('ziro_user', null)))
  const [showSignin, setShowSignin] = useState(false)
  const [signinMode, setSigninMode] = useState('signin') // 'signin' | 'create' — both use only Google / Facebook, like eBay
  const [showSnap, setShowSnap] = useState(false)
  const [showSell, setShowSell] = useState(false)
  const [showChat, setShowChat] = useState(null)
  const [ads, setAds] = useState(() => loadFor('ads', ADS, load('ziro_user', null)))
  const [adIndex, setAdIndex] = useState(0)
  const [adFade, setAdFade] = useState(false)
  const [payments, setPayments] = useState(() => loadFor('payments', [], load('ziro_user', null)))
  const [cards, setCards] = useState(() => loadFor('cards', [], load('ziro_user', null)))
  const [editId, setEditId] = useState(null)
  const [offer, setOffer] = useState('')
  const [chatText, setChatText] = useState('')
  const [chats, setChats] = useState(() => loadFor('chats', CHATS, load('ziro_user', null)))
  const [reports, setReports] = useState(() => loadFor('reports', [], load('ziro_user', null)))
  const [checkout, setCheckout] = useState(null) // {label, amount}
  const [snapPhoto, setSnapPhoto] = useState(null)
  const [snapCat, setSnapCat] = useState('All')
  const [adForm, setAdForm] = useState({ business: '', title: '', desc: '', type: 'image', link: '', place: 'Home page banner' })
  const [sellPhoto, setSellPhoto] = useState(null)
  const [form, setForm] = useState({ email: '', store: '', title: '', price: '', desc: '', category: 'Clothing', city: 'Toronto', condition: 'Used', shipping: 5, distance: 10, returns: 'No returns', offers: true, quantity: 1, specifics: '' })
  const fileRef = useRef(null)
  // Real OAuth return flow (like eBay: Google -> back to ziro).
  const [oauth, setOauth] = useState(null) // {provider, phase, name, email, message}
  const oauthHandledRef = useRef(false)

  // Purge old demo data once: delete every old shared ziro_* key except
  // the signed-in session (ziro_user) and the new v2 keys. A browser that
  // visited the old demo then has no stored ads/listings/chats left.
  useEffect(() => {
    try {
      const dead = []
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('ziro_') && k !== 'ziro_user' && !k.startsWith('ziro_v2_')) dead.push(k) }
      dead.forEach(k => localStorage.removeItem(k))
    } catch { /* ignore */ }
  }, [])
  // When the signed-in user changes, load THAT user's saved/watched/
  // listings/recent/chats/ads/payments — never another user's. Signed
  // out means empty lists. Declared before the save effects so the
  // load reads the new user's stored data before any save writes.
  useEffect(() => {
    const id = userIdOf(user)
    if (loadedForRef.current === id) return
    loadedForRef.current = id
    if (!user) { setSaved([]); setWatched([]); setUserListings([]); setNotifications([]); setRecent([]); setPayments([]); setCards([]); setAds([]); setReports([]); setChats([]); return }
    setSaved(loadFor('saved', [], user))
    setWatched(loadFor('watched', [], user))
    setUserListings(loadFor('mine', [], user))
    setNotifications(loadFor('notes', [], user))
    setRecent(loadFor('recent', [], user))
    setPayments(loadFor('payments', [], user))
    setCards(loadFor('cards', [], user))
    setAds(loadFor('ads', ADS, user))
    setReports(loadFor('reports', [], user))
    setChats(loadFor('chats', CHATS, user))
  }, [user])
  useEffect(() => { if (user) save(perKey('saved', user), saved) }, [saved, user])
  useEffect(() => { if (user) save(perKey('watched', user), watched) }, [watched, user])
  useEffect(() => { if (user) save(perKey('mine', user), userListings) }, [userListings, user])
  useEffect(() => { if (user) save(perKey('notes', user), notifications) }, [notifications, user])
  useEffect(() => { if (user) save(perKey('recent', user), recent) }, [recent, user])
  useEffect(() => save('ziro_user', user), [user])
  useEffect(() => { if (user) save(perKey('payments', user), payments) }, [payments, user])
  useEffect(() => { if (user) save(perKey('cards', user), cards) }, [cards, user])
  useEffect(() => { if (user) save(perKey('ads', user), ads) }, [ads, user])
  useEffect(() => { if (user) save(perKey('reports', user), reports) }, [reports, user])
  useEffect(() => { if (user) save(perKey('chats', user), chats) }, [chats, user])

  // --- Real Google / Facebook sign-in (OAuth, like eBay) ---
  // Start: send the user to Google's / Facebook's own official page
  // with ziro's client ID, asking it to come back to ziro.site (or the
  // Vercel preview) at /signin/<provider>/cb with a one-time code.
  // Return: that code is swapped for name + email by the server
  // function in /api/auth/<provider>.js — the secret never leaves
  // the server, and no password is ever typed into ziro.
  function oauthState() {
    const s = Math.random().toString(36).slice(2) + Date.now().toString(36)
    try { sessionStorage.setItem('ziro_oauth_state', s) } catch { /* ignore */ }
    return s
  }
  async function getOAuthConfig() {
    try {
      const res = await fetch('/api/auth/config')
      if (!res.ok) return {}
      return await res.json()
    } catch { return {} }
  }
  function oauthNotSetUp(provider) {
    const name = provider === 'google' ? 'Google' : 'Facebook'
    alert(`${name} sign-in is not set up yet. An adult needs to add the ${name} keys in Vercel, under Settings > Environment Variables.`)
  }
  async function startGoogle() {
    // Fetch the public Google client ID from ziro's own server, then
    // send the user to GOOGLE'S OWN official sign-in page
    // (accounts.google.com/o/oauth2/v2/auth). Ziro never shows a
    // Google sign-in page of its own — Google does that part.
    const { googleClientId } = await getOAuthConfig()
    if (!googleClientId) { oauthNotSetUp('google'); return }
    const redirectUri = window.location.origin + '/signin/google/cb'
    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: googleClientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'online',
      prompt: 'select_account',
      state: oauthState(),
    })
    window.location.href = url
  }
  async function startFacebook() {
    // Same as Google: fetch the public Facebook app ID, then send
    // the user to FACEBOOK'S OWN official sign-in page
    // (facebook.com/v20.0/dialog/oauth). Ziro never shows a
    // Facebook sign-in page of its own.
    const { facebookAppId } = await getOAuthConfig()
    if (!facebookAppId) { oauthNotSetUp('facebook'); return }
    const redirectUri = window.location.origin + '/signin/fb/cb'
    const url = 'https://www.facebook.com/v20.0/dialog/oauth?' + new URLSearchParams({
      client_id: facebookAppId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'email,public_profile',
      state: oauthState(),
    })
    window.location.href = url
  }
  async function finishOAuth(provider) {
    const params = new URLSearchParams(window.location.search)
    const label = provider === 'google' ? 'Google' : 'Facebook'
    if (params.get('error')) {
      setOauth({ provider, phase: 'error', message: `${label} sign-in was cancelled. You can try again.` })
      setShowSignin(true)
      return
    }
    const code = params.get('code')
    if (!code) {
      setOauth({ provider, phase: 'error', message: `No sign-in code came back from ${label}. Please try signing in again.` })
      setShowSignin(true)
      return
    }
    let savedState = null
    try { savedState = sessionStorage.getItem('ziro_oauth_state') } catch { /* ignore */ }
    if (savedState && params.get('state') && params.get('state') !== savedState) {
      setOauth({ provider, phase: 'error', message: 'That sign-in did not match this browser. Please try signing in again.' })
      setShowSignin(true)
      return
    }
    try { sessionStorage.removeItem('ziro_oauth_state') } catch { /* ignore */ }
    setOauth({ provider, phase: 'fetching', message: `Signing you in with ${label}…` })
    setShowSignin(true)
    try {
      const res = await fetch(`/api/auth/${provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, redirectUri: window.location.origin + `/signin/${provider}/cb` }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.email) {
        setOauth({ provider, phase: 'error', message: data.message || `Sign-in with ${label} did not work. Please try again.` })
        return
      }
      // eBay-style step: show the details Google/Facebook sent, and
      // let one tap create the ziro account from them. No password,
      // no phone code.
      setOauth({ provider, phase: 'confirm', name: data.name, email: data.email })
    } catch (e) {
      setOauth({ provider, phase: 'error', message: 'Could not reach ziro to finish signing in. Check your connection and try again.' })
    }
  }
  function confirmOAuthAccount() {
    if (!oauth || !oauth.email) return
    const label = oauth.provider === 'google' ? 'Google' : 'Facebook'
    setUser({ name: oauth.name || oauth.email.split('@')[0], email: oauth.email, how: label })
    setOauth(null)
    setShowSignin(false)
    try { window.history.replaceState({}, '', '/') } catch { /* ignore */ }
    goRoute('home')
  }
  // On load, catch the return from Google / Facebook.
  useEffect(() => {
    if (oauthHandledRef.current) return
    const path = window.location.pathname
    const provider = path === '/signin/google/cb' ? 'google' : path === '/signin/fb/cb' ? 'facebook' : null
    if (!provider) return
    oauthHandledRef.current = true
    finishOAuth(provider)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const liveAds = useMemo(() => ads.filter(a => a.status === 'LIVE'), [ads])
  useEffect(() => {
    if (liveAds.length < 2) return
    const t = setInterval(() => {
      setAdFade(true)
      setTimeout(() => { setAdIndex(i => (i + 1) % liveAds.length); setAdFade(false) }, 1400)
    }, 7000)
    return () => clearInterval(t)
  }, [liveAds.length])
  const ad = liveAds.length ? liveAds[adIndex % liveAds.length] : null

  const all = useMemo(() => [...userListings, ...LISTINGS], [userListings])
  const filtered = useMemo(() => {
    let list = all.filter(p => matchesFilter(p, browse, saved, recent) && (category === 'All' || !browse || browse.kind !== 'cat' || p.category === category) && (city === 'All cities' || p.city === city))
    if (browse && browse.kind === 'cat') list = all.filter(p => matchesFilter(p, browse, saved, recent) && (city === 'All cities' || p.city === city))
    if (sort === 'Price low to high') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'Price high to low') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'Nearest') list = [...list].sort((a, b) => a.distanceKm - b.distanceKm)
    if (sort === 'Newest') list = [...list].sort((a, b) => b.id - a.id)
    return list
  }, [all, browse, category, city, sort, saved, recent])
  const bestDeals = useMemo(() => [...all].filter(p => p.price <= 25).sort((a, b) => a.price - b.price).slice(0, 8), [all])
  const localDeals = useMemo(() => all.filter(p => p.price <= 25 && p.distanceKm <= 5).sort((a, b) => a.distanceKm - b.distanceKm), [all])
  const unread = notifications.filter(n => !n.read).length

  function openProduct(p) {
    const withClick = { ...p, clicks: (p.clicks || 0) + 1 }
    if (p.seed) { /* seed clicks are session-only */ } else setUserListings(u => u.map(x => x.id === p.id ? withClick : x))
    setProduct(withClick); setRentDays(3); setRoute('product')
    // Recently viewed is per signed-in user only — signed-out visitors
    // can inspect a listing, but nothing is recorded for them.
    if (user) setRecent(r => [p.id, ...r.filter(id => id !== p.id)].slice(0, 8))
    window.scrollTo(0, 0)
  }
  // Login gate: signed-out visitors can look around, but any click that
  // DOES something sends them to the sign-in modal instead.
  function needLogin() { if (user) return false; openSignin('signin'); return true }
  function openSell() { if (needLogin()) return; setShowSell(true) }
  function startCheckout(c) { if (needLogin()) return; setCheckout(c) }
  function toggleSave(id) { if (needLogin()) return; setSaved(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]) }
  function toggleWatch(id) { if (needLogin()) return; setWatched(w => w.includes(id) ? w.filter(x => x !== id) : [...w, id]) }
  function goBrowse(f) { setBrowse(f || null); setCategory(f && f.kind === 'cat' ? f.value : 'All'); setRoute('browse'); setInfoKey(null); window.scrollTo(0, 0) }
  function goInfo(key) { setInfoKey(key); setRoute('info'); window.scrollTo(0, 0) }
  const PROTECTED_ROUTES = ['saved', 'alerts', 'chat', 'ads', 'pay', 'mine']
  function goRoute(r) { if (!user && PROTECTED_ROUTES.includes(r)) { openSignin('signin'); return } setRoute(r); setInfoKey(null); window.scrollTo(0, 0) }
  function openFooterLink(target) {
    if (target === 'all') return goBrowse(null)
    if (target === 'rent') return goBrowse({ kind: 'rent', title: 'Rent It' })
    if (target === 'best') return goBrowse({ kind: 'deals', title: 'Best deals' })
    if (target === 'local') return goBrowse({ kind: 'local', title: 'Local deals near you' })
    if (target === 'recent') return goBrowse({ kind: 'recent', title: 'Recently viewed' })
    if (target === 'saved') return goRoute('saved')
    if (target === 'alerts') return goRoute('alerts')
    if (target === 'pay') return goRoute('pay')
    if (target === 'sell') return openSell()
    if (target === 'your') return goRoute('mine')
    if (target === 'snap') return setShowSnap(true)
    if (target === 'ads') return goRoute('ads')
    if (target === 'chat') return goRoute('chat')
    if (target.startsWith('info:')) return goInfo(target.slice(5))
    if (target.startsWith('hub:')) return goInfo(target.slice(4))
    if (target.startsWith('theme:')) return goBrowse({ kind: 'theme', value: target.slice(6), title: target.slice(6) })
  }
  function submitSell(e) {
    e.preventDefault()
    if (needLogin()) return
    if (!form.title || !form.price) return alert('Add a title and a price.')
    const price = Number(form.price)
    const item = { id: Date.now(), title: form.title, price, rentPerDay: rentOf(price), rentDeposit: depOf(price), category: form.category, city: form.city, distanceKm: 1, condition: form.condition, seller: user ? '@' + user.name.toLowerCase().replace(/\s+/g, '_') : '@you', time: 'Just now', photo: sellPhoto || '/assets/mysterybox.jpg', group: form.category.toLowerCase(), desc: form.desc || 'Listed on ziro.', shipping: Number(form.shipping || 0), specs: form.specifics || '', clicks: 0, seed: false, store: form.store, email: form.email, returns: form.returns, offers: form.offers, quantity: Number(form.quantity || 1) }
    setUserListings(u => [item, ...u]); setShowSell(false); setSellPhoto(null)
    setForm({ email: '', store: '', title: '', price: '', desc: '', category: 'Clothing', city: 'Toronto', condition: 'Used', shipping: 5, distance: 10, returns: 'No returns', offers: true, quantity: 1, specifics: '' })
    goRoute('mine')
  }
  function saveEdit(id, title, price, desc) {
    if (needLogin()) return
    setUserListings(u => u.map(p => {
      if (p.id !== id) return p
      if (price < p.price && watched.includes(id)) setNotifications(n => [{ id: Date.now(), text: `Price drop: ${p.title} is now $${price}`, read: false }, ...n])
      return { ...p, title, price, desc, rentPerDay: rentOf(price), rentDeposit: depOf(price) }
    })); setEditId(null)
  }
  function deleteListing(id) { if (needLogin()) return; if (confirm('Delete this listing?')) setUserListings(u => u.filter(p => p.id !== id)) }
  function luhn(num) { let s = 0, alt = false; for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (alt) { d *= 2; if (d > 9) d -= 9 } s += d; alt = !alt } return num.length >= 15 && s % 10 === 0 }
  function addCard(e) {
    e.preventDefault()
    if (needLogin()) return
    const f = new FormData(e.target)
    const num = String(f.get('number')).replace(/\s+/g, '')
    if (!luhn(num)) return alert('Check the card number.')
    setCards(c => [...c, { brand: num.startsWith('4') ? 'Visa' : num.startsWith('5') ? 'Mastercard' : 'Card', last4: num.slice(-4), expiry: f.get('expiry') }])
    e.target.reset()
  }
  function payCheckout() {
    if (needLogin()) return
    const card = cards[0]
    if (!checkout) return
    if (!card) return alert('Add a payment method first (Pay page). This demo stores only card brand, last 4 and expiry — no real money moves.')
    setPayments(p => [{ id: Date.now(), label: checkout.label, amount: checkout.amount, date: new Date().toLocaleDateString() }, ...p])
    if (checkout.adId) setAds(a => a.map(x => x.id === checkout.adId ? { ...x, status: 'LIVE' } : x))
    alert('Paid (demo). No real money moved.')
    setCheckout(null)
  }
  function openSignin(mode) { setSigninMode(mode === 'create' ? 'create' : 'signin'); setOauth(null); setShowSignin(true) }
  function messageSeller(p) {
    if (needLogin()) return
    const existing = chats.find(c => c.user === p.seller)
    if (existing) { setShowChat(existing); goRoute('chat'); return }
    const thread = { id: Date.now(), user: p.seller, item: `${p.title} $${p.price}`, messages: [{ from: 'me', text: `Hi! Is the ${p.title} still available?` }] }
    setChats(cs => [thread, ...cs]); setShowChat(thread); goRoute('chat')
  }
  function submitAd(e) {
    e.preventDefault()
    if (needLogin()) return
    if (!adForm.business || !adForm.title) return alert('Add a business name and an ad title.')
    const price = adForm.type === 'video' ? 2.99 : 0.99
    const item = { id: Date.now(), business: adForm.business, title: adForm.title, desc: adForm.desc, type: adForm.type, media: '/assets/logo.png', listingId: null, place: adForm.place, clicks: 0, price, status: 'PENDING' }
    setAds(a => [...a, item]); setAdForm({ business: '', title: '', desc: '', type: 'image', link: '', place: 'Home page banner' })
    alert('Ad submitted. It stays PENDING and invisible until paid, then it goes LIVE.')
  }
  function onPhotoFile(e, setter) {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setter(String(reader.result))
    reader.readAsDataURL(f)
  }

  const recs = query ? all.filter(p => (p.title + ' ' + p.desc).toLowerCase().includes(query.toLowerCase())).slice(0, 5) : all.slice(0, 5)
  const info = infoKey ? INFO[infoKey] : null

  return (
    <div>
      <header>
        <div className="topbar">
          <button className="logo" onClick={() => goRoute('home')} aria-label="ziro home"><img src="/assets/logo.png" alt="ziro" /></button>
          <div className="searchbar">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for items" aria-label="Search for items" />
            <button className="snapbtn" title="SNAP IT" aria-label="SNAP IT" onClick={() => setShowSnap(true)}><ScanIcon /></button>
            <button className="searchbtn" onClick={() => goBrowse(null)}>Search</button>
          </div>
          <button className="sellbtn" onClick={() => openSell()}>SELL</button>
          {user && <button className="acctbtn" onClick={() => goRoute('account')} aria-label="Your account">{user.name[0].toUpperCase()}</button>}
        </div>
        <div className="row2">
          <button onClick={() => goRoute('saved')}>Saved {saved.length ? `(${saved.length})` : ''}</button>
          <button onClick={() => goRoute('alerts')}>Alerts {unread ? <span className="badge">{unread}</span> : ''}</button>
          <button onClick={() => goRoute('chat')}>💬 Chat</button>
          <button onClick={() => goRoute('ads')}>Ads · from $0.99</button>
          <button onClick={() => goRoute('pay')}>Pay</button>
          {user ? <button onClick={() => goRoute('account')}>{user.name}</button> : <>
            <button className="login" onClick={() => openSignin('signin')}>Log in</button>
            <button className="signin" onClick={() => openSignin('signin')}>Sign in</button>
          </>}
        </div>
        <div className="cats">{CATEGORIES.map(c => <button key={c} className={category === c && route === 'browse' ? 'on' : ''} onClick={() => goBrowse({ kind: 'cat', value: c, title: c === 'All' ? 'All listings' : c })}>{c}</button>)}</div>
      </header>

      {query && route === 'home' && recs.length > 0 && <div className="wrap"><div className="panel"><b>Recommendations</b>{recs.map(p => <div key={p.id} className="rec" role="button" onClick={() => openProduct(p)}><img src={p.photo} alt="" /> {p.title} — ${p.price}</div>)}</div></div>}

      {route === 'home' && <>
        <div className="wrap">
          <div className="banner">
            <div className="b-txt"><h1>List it, Sell it</h1><p>Snap your sneakers, post them, get paid. That fast.</p><button onClick={() => openSell()}>List yours right now!</button></div>
            <img className="b-photo" src="/assets/banner.jpg" alt="Person taking a photo of sneakers they want to sell" />
          </div>

          <section>
            <div className="sec-head"><h2>Rent It</h2><button className="seeall" onClick={() => goBrowse({ kind: 'rent', title: 'Rent It' })}>Browse rentals</button></div>
            <p className="sec-sub">Instead of buying, rent it by the day — daily rate on every card, plus a refundable deposit</p>
            {RENTALS.length === 0 ? <p>No rentals yet — be the first to list something!</p> : <div className="hscroll">{RENTALS.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>}
          </section>

          {ad && <div className="adspot" style={{ opacity: adFade ? 0 : 1 }} aria-label="Featured spotlight">
            <div className="ad-art">
              {ad.type === 'video' && String(ad.media).endsWith('.mp4')
                ? <video src={ad.media} autoPlay muted loop playsInline />
                : <img src={ad.media} alt={ad.title} />}
            </div>
            <div className="ad-txt">
              <div className="ad-biz">{ad.business}</div>
              <div className="ad-title">{ad.title}</div>
              <p>{ad.desc}</p>
              {all.find(x => x.id === ad.listingId) && <button className="btn teal" onClick={() => { if (needLogin()) return; setAds(a => a.map(x => x.id === ad.id ? { ...x, clicks: x.clicks + 1 } : x)); const p = all.find(x => x.id === ad.listingId); if (p) openProduct(p) }}>See listing</button>}
              <div className="ad-meta"><span>{ad.place}</span><span>·</span><span>{ad.clicks} clicks</span></div>
            </div>
          </div>}

          {SHOWCASE.map(s => <section key={s.key}>
            <div className="sec-head"><h2>{SHOWCASE_TITLES[s.key][0]}</h2><button className="seeall" onClick={() => goBrowse({ kind: 'theme', value: s.key === 'gift' ? 'home' : s.key === 'cook' ? 'kitchen' : s.key === 'game' ? 'gamer' : 'sports', title: SHOWCASE_TITLES[s.key][0] })}>See all</button></div>
            <p className="sec-sub">{SHOWCASE_TITLES[s.key][1]}</p>
            <div className="tiles">{s.tiles.map(([label, asset, f]) => {
              const count = all.filter(p => matchesFilter(p, f.kind === 'group' ? { kind: 'group', value: f.value } : { kind: 'keyword', value: f.value }, saved, recent)).length
              return <button key={label} className="tile" onClick={() => goBrowse(f.kind === 'group' ? { kind: 'group', value: f.value, title: label } : { kind: 'keyword', value: f.value, title: label })}>
                <img src={`/assets/${asset}.jpg`} alt={label} /><b>{label}</b><span>{count} listings</span>
              </button>
            })}</div>
          </section>)}

          <section>
            <div className="sec-head"><h2>Best deals</h2><button className="seeall" onClick={() => goBrowse({ kind: 'deals', title: 'Best deals' })}>See all</button></div>
            <p className="sec-sub">The lowest prices on ZIRO right now</p>
            {bestDeals.length === 0 ? <p>No best deals yet — be the first to list something!</p> : <div className="hscroll">{bestDeals.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>}
          </section>

          {recent.length > 0 && <section>
            <div className="sec-head"><h2>Recently viewed</h2><button className="seeall" onClick={() => goBrowse({ kind: 'recent', title: 'Recently viewed' })}>See all</button></div>
            <div className="hscroll">{recent.map(id => all.find(p => p.id === id)).filter(Boolean).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
            <button className="btn ghost" onClick={() => { if (needLogin()) return; setRecent([]) }}>Clear history</button>
          </section>}

          <section>
            <div className="sec-head"><h2>Local deals near you</h2><button className="seeall" onClick={() => goBrowse({ kind: 'local', title: 'Local deals near you' })}>See all</button></div>
            <p className="sec-sub">Listings $25 and under within 5 km of you, nearest first</p>
            {localDeals.length === 0 ? <p>No local deals yet — be the first to list something!</p> : <div className="hscroll">{localDeals.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>}
          </section>

          <section>
            <div className="sec-head"><h2>All listings</h2><span className="small">{all.length} listings</span></div>
            <div className="filters">
              <select value={city} onChange={e => setCity(e.target.value)}><option>All cities</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
              <select value={sort} onChange={e => setSort(e.target.value)}><option>Newest</option><option>Price low to high</option><option>Price high to low</option><option>Nearest</option></select>
            </div>
            {all.length === 0 && <p>No listings yet — be the first to list something! <button className="btn teal" onClick={() => openSell()}>List yours right now!</button></p>}<div className="grid">{[...all].filter(p => city === 'All cities' || p.city === city).sort((a, b) => sort === 'Price low to high' ? a.price - b.price : sort === 'Price high to low' ? b.price - a.price : sort === 'Nearest' ? a.distanceKm - b.distanceKm : b.id - a.id).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
          </section>
        </div>
      </>}

      {route === 'browse' && <div className="wrap">
        <h2>{browse ? browse.title : 'All listings'}</h2>
        <div className="filters">
          <select value={city} onChange={e => setCity(e.target.value)}><option>All cities</option>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
          <select value={sort} onChange={e => setSort(e.target.value)}><option>Newest</option><option>Price low to high</option><option>Price high to low</option><option>Nearest</option></select>
          <span className="small">{filtered.length} listings</span>
        </div>
        {browse && browse.kind === 'recent' && recent.length > 0 && <p><button className="btn ghost" onClick={() => { if (needLogin()) return; setRecent([]) }}>Clear history</button></p>}
        {filtered.length === 0 && <p>No listings yet — be the first to list something! <button className="btn teal" onClick={() => openSell()}>List yours right now!</button></p>}
        <div className="grid">{filtered.map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div>
      </div>}

      {route === 'product' && product && <div className="wrap">
        <button className="btn ghost" onClick={() => goRoute('home')}>← Back</button>
        <div className="panel">
          <img className="prod-photo" src={product.photo || '/assets/mysterybox.jpg'} alt={product.title} />
          <h2>{product.title}</h2><p className="price" style={{ fontSize: 24 }}>${product.price}</p>
          <p>{product.desc}</p>
          <p className="small">{product.condition} · {product.city} · {product.seller} · {product.time} · Shipping ${product.shipping} · {product.distanceKm} km away{product.clicks ? ` · ${product.clicks} views` : ''}</p>
          {product.specs && <p className="small"><b>Item specifics:</b> {product.specs}</p>}
          <button className="btn ghost" onClick={() => toggleSave(product.id)}>{saved.includes(product.id) ? '♥ Saved' : '♡ Save'}</button>{' '}
          <button className="btn ghost" onClick={() => toggleWatch(product.id)}>{watched.includes(product.id) ? '✓ Watching' : 'Watch'}</button>{' '}
          <button className="btn ghost" onClick={() => { if (needLogin()) return; navigator.clipboard?.writeText(SITE + '/listing/' + product.id); alert('Link copied to share.') }}>Share</button>{' '}
          <button className="btn ghost" onClick={() => { if (needLogin()) return; const r = prompt('Report this listing — what is wrong? (e.g. scam, wrong item, rude seller, other)'); if (r) { setReports(x => [...x, { id: Date.now(), listing: product.title, reason: r }]); alert('Thanks. Your report was sent.') } }}>Report</button>
        </div>
        <div className="panel"><h3>Rent It</h3>
          <p>Rent it · ${product.rentPerDay}/day · Refundable deposit ${product.rentDeposit} (half the buy price)</p>
          <div className="filters">{[1, 3, 7, 14, 30].map(d => <button key={d} className={'btn ' + (rentDays === d ? '' : 'ghost')} onClick={() => setRentDays(d)}>{d} day{d > 1 ? 's' : ''}</button>)}</div>
          <p><b>Total: ${product.rentPerDay * rentDays + product.rentDeposit}</b> ({rentDays} days × ${product.rentPerDay} + ${product.rentDeposit} deposit)</p>
          <button className="btn teal" onClick={() => startCheckout({ label: `Rent: ${product.title} (${rentDays} days)`, amount: product.rentPerDay * rentDays + product.rentDeposit })}>Rent It</button>
          <p className="small">No Buy Now — Rent It is the way to get this item.</p>
        </div>
        {product.offers !== false && <div className="panel"><h3>Make Offer</h3><input type="number" value={offer} onChange={e => setOffer(e.target.value)} placeholder="Your offer in $" /><button className="btn" onClick={() => { if (needLogin()) return; if (offer) { alert('Offer sent to ' + product.seller); setOffer('') } }}>Send offer</button></div>}
        <div className="panel"><button className="btn" onClick={() => messageSeller(product)}>Message Seller</button></div>
        <div className="panel"><h3>Seller Reviews</h3>{(REVIEWS[sellerKey(product.seller)] || []).length === 0 ? <p>No reviews yet.</p> : (REVIEWS[sellerKey(product.seller)] || []).map((r, i) => <p key={i}>{'★'.repeat(r[1] ?? r.stars)} {r[0] ?? r.user} — {r[2] ?? r.text}</p>)}</div>
        <div className="panel"><h3>Seller Profile</h3><p>{product.seller}</p><div className="grid">{all.filter(p => p.seller === product.seller && p.id !== product.id).slice(0, 4).map(p => <Card key={p.id} p={p} saved={saved.includes(p.id)} onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div></div>
      </div>}

      {route === 'saved' && <div className="wrap"><h2>Saved items</h2>{saved.length === 0 && <p>No saved items yet. Tap the heart on a listing.</p>}<div className="grid">{all.filter(p => saved.includes(p.id)).map(p => <Card key={p.id} p={p} saved onSave={toggleSave} onOpen={openProduct} onWatch={toggleWatch} watched={watched.includes(p.id)} />)}</div><h2>Watching</h2>{watched.length === 0 ? <p>Nothing watched yet. Watch a listing and you will be told if its price drops.</p> : all.filter(p => watched.includes(p.id)).map(p => <p key={p.id}><img src={p.photo} alt="" style={{ width: 40, height: 40, objectFit: 'cover', verticalAlign: 'middle' }} /> {p.title} — ${p.price}</p>)}</div>}

      {route === 'mine' && <div className="wrap"><h2>Your listings</h2>{userListings.length === 0 && <p>You have not listed anything yet.</p>}{userListings.map(p => <div key={p.id} className="panel"><img src={p.photo} alt="" style={{ width: 60, height: 60, objectFit: 'cover', verticalAlign: 'middle' }} /> <b>{p.title} — ${p.price}</b>{' '}<button className="btn ghost" onClick={() => openProduct(p)}>View</button>{' '}<button className="btn ghost" onClick={() => setEditId(editId === p.id ? null : p.id)}>{editId === p.id ? 'Close edit' : 'Edit'}</button>{' '}<button className="btn ghost" onClick={() => deleteListing(p.id)}>Delete</button>{editId === p.id && <EditForm p={p} onSave={saveEdit} />}</div>)}<p className="small">Only listings you create here appear here. Use View, Edit or Delete on a listing to manage it.</p></div>}

      {route === 'alerts' && <div className="wrap"><h2>Notifications</h2><button className="btn ghost" onClick={() => setNotifications(n => n.map(x => ({ ...x, read: true })))}>Mark all read</button>{' '}<button className="btn ghost" onClick={() => setNotifications([])}>Clear</button>{notifications.length === 0 && <p>No notifications yet. Watch a listing and you will be told if its price drops.</p>}{notifications.map(n => <p key={n.id}>{n.read ? '' : '● '}{n.text}</p>)}</div>}

      {route === 'chat' && <div className="wrap"><h2>Chat</h2>{chats.length === 0 && <p>No chats yet. Message a seller from a listing to start chatting.</p>}{chats.map(c => <div key={c.id} className="panel" role="button" onClick={() => setShowChat(c)}><b>{c.user}</b> — {c.item}<p className="small">{c.messages[c.messages.length - 1].text}</p></div>)}
        {showChat && <div className="panel"><h3>{showChat.user}</h3>{showChat.messages.map((m, i) => <p key={i}><b>{m.from === 'me' ? 'You' : showChat.user}:</b> {m.text}</p>)}<input value={chatText} onChange={e => setChatText(e.target.value)} placeholder="Type a message" /><button className="btn" onClick={() => { if (needLogin()) return; if (!chatText) return; const msg = { from: 'me', text: chatText }; setChats(cs => cs.map(c => c.id === showChat.id ? { ...c, messages: [...c.messages, msg] } : c)); setShowChat(s => ({ ...s, messages: [...s.messages, msg] })); setChatText('') }}>Send</button></div>}
      </div>}

      {route === 'ads' && <div className="wrap"><h2>Advertise</h2><p className="small">Image ad $0.99 · Video ad $2.99. Ads stay PENDING and invisible until paid, then go LIVE. Ads show only on the home page banner. Clicks are tracked — the most-clicked ads show first.</p>
        {ads.length === 0 && <p>No ads yet. Submit your first ad below.</p>}
        {ads.map(a => <div key={a.id} className="panel"><b>{a.business}</b> — {a.title} · {a.status} · {a.clicks} clicks · ${a.price}<br />{a.status === 'PENDING' && <button className="btn" onClick={() => startCheckout({ label: `Ad: ${a.business}`, amount: a.price, adId: a.id })}>Pay ${a.price} (demo)</button>}{' '}<button className="btn ghost" onClick={() => { if (needLogin()) return; setAds(x => x.filter(y => y.id !== a.id)) }}>Delete</button></div>)}
        <div className="panel"><h3>Advertise yours</h3><form onSubmit={submitAd}>
          <label>Business / item name</label><input value={adForm.business} onChange={e => setAdForm({ ...adForm, business: e.target.value })} />
          <label>Ad title</label><input value={adForm.title} onChange={e => setAdForm({ ...adForm, title: e.target.value })} />
          <label>Description</label><textarea value={adForm.desc} onChange={e => setAdForm({ ...adForm, desc: e.target.value })} />
          <label>Ad type</label><select value={adForm.type} onChange={e => setAdForm({ ...adForm, type: e.target.value })}><option value="image">Image ad — $0.99</option><option value="video">Video ad — $2.99</option></select>
          <label>Link / contact</label><input value={adForm.link} onChange={e => setAdForm({ ...adForm, link: e.target.value })} placeholder="yourshop.example" />
          <p className="small">Ads show only on the home page banner.</p>
          <button className="btn">Submit ad</button>
        </form></div>
        <div className="panel"><h3>Seller tips</h3><p>ziro takes 10% from every sale. Price your item 10% higher than the amount you want to keep — on a $100 sale, $10 goes to ziro and you keep $90.</p></div>
      </div>}

      {route === 'pay' && <div className="wrap"><h2>Payment methods</h2><p className="small">Demo checkout — no real money moves. Only card brand, last 4 digits and expiry are stored.</p>
        {checkout && <div className="panel"><h3>Checkout</h3><p>{checkout.label} — <b>${checkout.amount}</b></p><button className="btn teal" onClick={payCheckout}>Pay ${checkout.amount} (demo)</button>{' '}<button className="btn ghost" onClick={() => setCheckout(null)}>Cancel</button></div>}
        <form onSubmit={addCard}><label>Name on card</label><input name="name" placeholder="Your name" /><label>Card number</label><input name="number" placeholder="Card number" /><label>Expiry</label><input name="expiry" placeholder="12/28" /><label>CVC</label><input name="cvc" placeholder="123" /><button className="btn">Add card</button></form>
        {cards.map((c, i) => <p key={i}>{c.brand} ···· {c.last4} · Expires {c.expiry}</p>)}
        <h2>Recent payments</h2>{payments.length === 0 ? <p>No payments yet.</p> : payments.map(p => <p key={p.id}>{p.label} — ${p.amount} · {p.date}</p>)}
      </div>}

      {route === 'account' && <div className="wrap"><h2>Your account</h2>{user ? <><p><b>{user.name}</b><br />{user.email}<br />Signed in with: {user.how}<br />Status: Active</p><button className="btn ghost" onClick={() => openSignin('create')}>Sign in with a different account</button>{' '}<button className="btn ghost" onClick={() => goRoute('mine')}>Your listings</button>{' '}<button className="btn ghost" onClick={() => goRoute('saved')}>Saved items</button>{' '}<button className="btn ghost" onClick={() => goRoute('pay')}>Payment methods</button>{' '}<button className="btn" onClick={() => { setUser(null); goRoute('home') }}>Sign out</button></> : <p>Not signed in. <button className="btn" onClick={() => openSignin('signin')}>Sign in</button></p>}</div>}

      {route === 'info' && info && <div className="wrap"><p className="small">{info.tag}</p><h2>{info.t}</h2><p>{info.intro}</p>
        {(info.sections || []).map(([h, b], i) => <div key={i}><h3>{h}</h3><p>{b}</p></div>)}
        {(info.bullets || []).length > 0 && <ul>{info.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
        {info.action && <button className="btn" onClick={() => openFooterLink(info.action[1])}>{info.action[0]}</button>}{' '}
        <button className="btn ghost" onClick={() => goRoute('home')}>Back to homepage</button>
      </div>}

      <footer>
        {FOOTER.map(([col, , links]) => <div key={col}><h4>{col}</h4>{links.map(([label, target]) => <button key={label} onClick={() => openFooterLink(target)}>{label}</button>)}</div>)}
      </footer>
      <p className="small" style={{ textAlign: 'center', padding: '0 0 20px' }}>ziro — List it. Sell it. Rent it. · ziro takes 10% from every sale · {SITE}</p>

      {showSignin && <div className="modal"><div className="box">
        {/* eBay-style sign-in: ZIRO's own page only asks you to pick
            Google or Facebook. There is NO name / email / password form
            in ZIRO at all — the buttons below send you to Google's and
            Facebook's own official sign-in pages, and they send you back
            here. No Apple sign-in. */}
        {oauth && oauth.phase === 'confirm' ? <>
          <h3>Create an account</h3>
          <p>We&rsquo;ll use your {oauth.provider === 'google' ? 'Google' : 'Facebook'} details to create your ziro account.</p>
          <p><b>{oauth.name}</b><br />{oauth.email}</p>
          <button className="btn teal" onClick={confirmOAuthAccount}>Create account</button>{' '}
          <button className="btn ghost" onClick={() => setOauth(null)}>Not you? Pick a different account</button>
        </> : <>
          <h3>{signinMode === 'create' ? 'Create an account' : 'Sign in to your account'}</h3>
          {signinMode === 'create'
            ? <p className="small">We&rsquo;ll use your Google or Facebook details to create your ziro account. Pick one below — you sign in on their own official page, then come straight back here.</p>
            : <p><b>New to ziro?</b> <button className="btn ghost" onClick={() => setSigninMode('create')}>Create account</button></p>}
          {signinMode === 'create' && <p><b>Already have an account?</b> <button className="btn ghost" onClick={() => setSigninMode('signin')}>Sign in</button></p>}
          {oauth && oauth.phase === 'fetching' && <div className="panel"><p>{oauth.message}</p></div>}
          {oauth && oauth.phase === 'error' && <div className="panel"><p>{oauth.message}</p><button className="btn ghost" onClick={() => setOauth(null)}>Try again</button></div>}
          {(!oauth || oauth.phase === 'error') && <>
            <button className="social" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={startGoogle}>Continue with Google</button>
            <button className="social" style={{ display: 'block', width: '100%', textAlign: 'center' }} onClick={startFacebook}>Continue with Facebook</button>
          </>}
          <p className="small">You pick your account on Google&rsquo;s or Facebook&rsquo;s own official page. No password is typed into ziro.</p>
        </>}
        <button className="btn ghost" onClick={() => setShowSignin(false)}>Back to homepage</button>
      </div></div>}

      {showSnap && <div className="modal"><div className="box"><h3>SNAP IT</h3><p>Take a photo of an item to find similar listings.</p>
        {snapPhoto && <img src={snapPhoto} alt="Your photo" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain' }} />}
        <label className="btn teal" style={{ display: 'inline-block', textAlign: 'center' }}>Take Photo<input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => onPhotoFile(e, setSnapPhoto)} /></label>{' '}
        <label>Category</label><select value={snapCat} onChange={e => setSnapCat(e.target.value)}><option>All</option>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select>
        <button className="btn" onClick={() => { setShowSnap(false); goBrowse(snapCat === 'All' ? null : { kind: 'cat', value: snapCat, title: snapCat }) }}>Find similar listings</button>{' '}
        <button className="btn ghost" onClick={() => setShowSnap(false)}>Close</button>
      </div></div>}

      {showSell && <div className="modal"><div className="box"><h3>List it — Sell form</h3><form onSubmit={submitSell}>
        <label>Your email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        <label>Store name</label><input value={form.store} onChange={e => setForm({ ...form, store: e.target.value })} placeholder="Your shop name" />
        <label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <label>Photo</label>
        <input type="file" accept="image/*" onChange={e => onPhotoFile(e, setSellPhoto)} />
        {sellPhoto && <img src={sellPhoto} alt="Your item" style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'contain' }} />}
        <label>Description</label><textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
        <label>Price ($)</label><input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <label>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select>
        <label>City</label><select value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>{CITIES.map(c => <option key={c}>{c}</option>)}</select>
        <label>Condition</label><select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })}><option>New</option><option>Like New</option><option>Used</option></select>
        <label>Shipping rate ($)</label><input type="number" value={form.shipping} onChange={e => setForm({ ...form, shipping: e.target.value })} />
        <label>Max distance (km)</label><input type="number" value={form.distance} onChange={e => setForm({ ...form, distance: e.target.value })} />
        <label>Returns</label><select value={form.returns} onChange={e => setForm({ ...form, returns: e.target.value })}><option>No returns</option><option>30-day returns</option><option>14-day returns</option></select>
        <label>Offers</label><select value={form.offers ? 'on' : 'off'} onChange={e => setForm({ ...form, offers: e.target.value === 'on' })}><option value="on">Offers on</option><option value="off">Offers off</option></select>
        <label>Quantity</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
        <label>Item specifics</label><input value={form.specifics} onChange={e => setForm({ ...form, specifics: e.target.value })} placeholder="e.g. Size: US 10 · Colour: Black" />
        <p className="small">Tip: ziro takes 10% — price 10% higher than what you want to keep. Rent rate is worked out from your price (about 4% a day), deposit is half the price.</p>
        <button className="btn">List it</button>{' '}<button type="button" className="btn ghost" onClick={() => setShowSell(false)}>Cancel</button>
      </form></div></div>}
    </div>
  )
}

function EditForm({ p, onSave }) {
  const [t, setT] = useState(p.title); const [pr, setPr] = useState(p.price); const [d, setD] = useState(p.desc)
  return <div style={{ marginTop: 10 }}><input value={t} onChange={e => setT(e.target.value)} /><input type="number" value={pr} onChange={e => setPr(Number(e.target.value))} /><input value={d} onChange={e => setD(e.target.value)} /><button className="btn" onClick={() => onSave(p.id, t, pr, d)}>Save (price drop notifies watchers)</button></div>
}
