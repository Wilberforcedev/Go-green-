import { useMemo, useState } from 'react';
import {
  ArrowRight, BadgeCheck, CalendarDays, Check, ChevronDown, HelpCircle,
  Clock3, Coins, Filter, Leaf, MapPin, Search, ShieldCheck, Sprout,
  TreePine, Users, Zap,
} from 'lucide-react';

type Category = 'All activities' | 'Tree planting' | 'Clean-ups' | 'Learning' | 'Clean energy';
type Activity = {
  id: string; title: string; category: Exclude<Category, 'All activities'>;
  place: string; date: string; time: string; points: number; spots: number;
  description: string; image: string; impact: string;
};
type SavedState = { joined: string[]; verified: string[]; redeemed: string[] };

const activities: Activity[] = [
  { id: 'kampala-trees', title: 'Restore the Lubigi wetland edge', category: 'Tree planting', place: 'Kampala, Uganda', date: 'Sat, 24 Oct', time: '8:30 AM · 3 hours', points: 120, spots: 18, description: 'Plant native seedlings with the community team and learn how to care for them through the first dry season.', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=960&q=85', impact: '1 native seedling planted' },
  { id: 'nairobi-clean', title: 'Saturday river clean-up', category: 'Clean-ups', place: 'Nairobi, Kenya', date: 'Sat, 24 Oct', time: '9:00 AM · 2 hours', points: 80, spots: 12, description: 'Help collect and sort litter along the river path. Gloves, bags and a short safety briefing are provided.', image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=960&q=85', impact: '2 kg of waste sorted' },
  { id: 'solar-basics', title: 'Solar for everyday living', category: 'Clean energy', place: 'Entebbe, Uganda', date: 'Sun, 25 Oct', time: '10:00 AM · 90 min', points: 60, spots: 24, description: 'A practical community session on choosing, using and maintaining small solar home systems.', image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=960&q=85', impact: '1 clean-energy workshop attended' },
  { id: 'compost-class', title: 'Turn food scraps into soil', category: 'Learning', place: 'Kisumu, Kenya', date: 'Tue, 27 Oct', time: '2:00 PM · 1 hour', points: 50, spots: 10, description: 'Learn a simple home composting method and take away a starter guide for your household.', image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=960&q=85', impact: '1 practical learning session' },
];

const rewards = [
  { id: 'seed-kit', name: 'Community seed starter kit', cost: 250, detail: 'A demo reward concept · availability to be confirmed', icon: Sprout },
  { id: 'refill', name: 'Reusable water bottle', cost: 400, detail: 'A demo reward concept · availability to be confirmed', icon: Leaf },
  { id: 'solar-light', name: 'Solar study light contribution', cost: 600, detail: 'A demo reward concept · availability to be confirmed', icon: Zap },
];

const loadState = (): SavedState => {
  try {
    const stored = localStorage.getItem('green-mates-impact-demo');
    return stored ? { joined: [], verified: [], redeemed: [], ...JSON.parse(stored) } : { joined: [], verified: [], redeemed: [] };
  } catch { return { joined: [], verified: [], redeemed: [] }; }
};

export default function ImpactHub() {
  const [saved, setSaved] = useState<SavedState>(loadState);
  const [category, setCategory] = useState<Category>('All activities');
  const [location, setLocation] = useState('All locations');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'discover' | 'my-impact' | 'organizer'>('discover');
  const [showPoints, setShowPoints] = useState(false);

  const updateSaved = (next: SavedState) => {
    setSaved(next);
    localStorage.setItem('green-mates-impact-demo', JSON.stringify(next));
  };
  const joined = activities.filter((activity) => saved.joined.includes(activity.id));
  const verified = activities.filter((activity) => saved.verified.includes(activity.id));
  const points = verified.reduce((total, activity) => total + activity.points, 0) - saved.redeemed.reduce((total, id) => total + (rewards.find((reward) => reward.id === id)?.cost ?? 0), 0);
  const filtered = useMemo(() => activities.filter((activity) => {
    const matchesCategory = category === 'All activities' || activity.category === category;
    const matchesLocation = location === 'All locations' || activity.place.includes(location);
    const matchesSearch = `${activity.title} ${activity.description} ${activity.place} ${activity.category}`.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesLocation && matchesSearch;
  }), [category, location, search]);

  const joinActivity = (id: string) => {
    if (!saved.joined.includes(id)) updateSaved({ ...saved, joined: [...saved.joined, id] });
    setTab('my-impact');
  };

  return (
    <div className="min-h-screen bg-[#f6f8f4] text-slate-900 dark:bg-gray-950 dark:text-white">
      <section className="relative overflow-hidden bg-[#123c2c] text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #b5e383 0, transparent 30%), radial-gradient(circle at 10% 100%, #4e9b68 0, transparent 38%)' }} />
        <div className="relative mx-auto max-w-7xl px-5 pb-10 pt-12 sm:px-8 sm:pb-14 sm:pt-16">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[.16em] text-lime-200"><Leaf size={14} /> Go Green Mates · Community action</div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Small actions.<br /><span className="text-lime-300">Visible impact.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-green-50/80 sm:text-lg">Find a local activity, show up with your community, and keep a clear record of the good you do.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => setTab('discover')} className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-5 py-3 font-bold text-green-950 transition hover:bg-lime-200">Find an activity <ArrowRight size={17} /></button>
              <button onClick={() => setTab('my-impact')} className="rounded-xl border border-white/25 px-5 py-3 font-semibold text-white transition hover:bg-white/10">View my impact</button>
            </div>
          </div>
          <div className="mt-10 grid max-w-3xl grid-cols-3 gap-3 sm:gap-4">
            <Stat value={`${joined.length}`} label="Joined" />
            <Stat value={`${verified.length}`} label="Verified" />
            <Stat value={`${Math.max(points, 0)}`} label="Green Points" />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="-mt-5 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {([['discover', 'Discover activities'], ['my-impact', 'My impact'], ['organizer', 'Organizer check-in']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} className={`rounded-xl px-4 py-3 text-sm font-bold transition ${tab === key ? 'bg-[#174b35] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800'}`}>{label}</button>
          ))}
        </div>

        {tab === 'discover' && <section className="pt-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div><p className="text-sm font-bold uppercase tracking-[.16em] text-green-700 dark:text-lime-300">Take part</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Find your next good thing</h2><p className="mt-2 text-slate-600 dark:text-gray-400">Activities are listed with their location, time, points and what participation means.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="relative"><Search className="absolute left-3 top-3 text-slate-400" size={18} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activities" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-green-600 sm:w-52 dark:border-gray-700 dark:bg-gray-900" /></label>
              <label className="relative"><MapPin className="absolute left-3 top-3 text-slate-400" size={17} /><select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-9 outline-none focus:border-green-600 sm:w-48 dark:border-gray-700 dark:bg-gray-900"><option>All locations</option><option>Uganda</option><option>Kenya</option></select><ChevronDown className="pointer-events-none absolute right-3 top-3 text-slate-400" size={16} /></label>
            </div>
          </div>
          <div className="mt-7 flex gap-2 overflow-x-auto pb-2">{(['All activities', 'Tree planting', 'Clean-ups', 'Learning', 'Clean energy'] as Category[]).map((item) => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold ${category === item ? 'border-green-800 bg-green-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300'}`}><Filter className="mr-1.5 inline" size={13} />{item}</button>)}</div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((activity) => {
              const isJoined = saved.joined.includes(activity.id);
              return <article key={activity.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
                <div className="relative h-44"><img src={activity.image} alt="" className="h-full w-full object-cover" /><span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-green-900">{activity.category}</span><span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#153d2c]/90 px-3 py-1 text-xs font-bold text-lime-200"><Coins size={13} /> {activity.points} pts</span></div>
                <div className="p-5"><h3 className="text-lg font-extrabold leading-snug">{activity.title}</h3><p className="mt-2 line-clamp-2 min-h-[3rem] text-sm leading-6 text-slate-600 dark:text-gray-400">{activity.description}</p><div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-gray-300"><p className="flex items-center gap-2"><MapPin size={15} className="text-green-700" />{activity.place}</p><p className="flex items-center gap-2"><CalendarDays size={15} className="text-green-700" />{activity.date} · {activity.time}</p><p className="flex items-center gap-2"><Users size={15} className="text-green-700" />{activity.spots} places available</p></div><div className="mt-5 border-t border-slate-100 pt-4 dark:border-gray-800"><p className="mb-3 text-xs text-slate-500">Impact measure: {activity.impact}</p><button onClick={() => joinActivity(activity.id)} disabled={isJoined} className="w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-default disabled:bg-green-100 disabled:text-green-900 dark:disabled:bg-green-900/50 dark:disabled:text-green-200">{isJoined ? <><Check size={16} className="mr-1 inline" /> Joined</> : 'Join this activity'}</button></div></div>
              </article>;
            })}
          </div>
          {filtered.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">No activities match those filters. Try another location or search.</div>}
        </section>}

        {tab === 'my-impact' && <section className="pt-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-green-700 dark:text-lime-300">Your community record</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">My impact</h2><p className="mt-2 text-slate-600 dark:text-gray-400">Only organizer-verified activities add points to your balance.</p></div><button onClick={() => setShowPoints(!showPoints)} className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold dark:border-gray-700 dark:bg-gray-900"><HelpCircle size={17} /> How Green Points work</button></div>
          {showPoints && <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm leading-6 text-green-950 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"><strong>Points are a participation record.</strong> Join an activity, attend it, then ask its organizer to verify you. The activity’s stated points are added only after verification. Points do not represent cash. The reward examples below are concepts and are not live offers.</div>}
          <div className="mt-7 grid gap-4 sm:grid-cols-3"><ImpactStat icon={Coins} title="Green Points" value={`${Math.max(points, 0)}`} note="From verified activities" /><ImpactStat icon={CalendarDays} title="Activities joined" value={`${joined.length}`} note="Your upcoming commitments" /><ImpactStat icon={BadgeCheck} title="Verified actions" value={`${verified.length}`} note="Confirmed by an organizer" /></div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center justify-between"><h3 className="text-xl font-extrabold">My activity</h3><span className="text-sm text-slate-500">{joined.length + verified.length} records</span></div><div className="mt-5 space-y-3">{[...joined.filter((a) => !saved.verified.includes(a.id)), ...verified].map((activity) => <div key={activity.id} className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center dark:bg-gray-800"><div><div className="flex items-center gap-2 font-bold">{activity.title}{saved.verified.includes(activity.id) && <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-800"><BadgeCheck size={12} /> Verified</span>}</div><p className="mt-1 text-sm text-slate-500">{activity.place} · {activity.date}</p></div><div className="text-sm font-extrabold text-green-800 dark:text-lime-300">{saved.verified.includes(activity.id) ? `+${activity.points} points` : 'Awaiting attendance'}</div></div>)}{joined.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center"><TreePine className="mx-auto text-green-700" /><p className="mt-3 font-bold">Your first action starts here</p><p className="mt-1 text-sm text-slate-500">Join an activity and it will appear in this list.</p><button onClick={() => setTab('discover')} className="mt-4 font-bold text-green-800">Browse activities <ArrowRight className="ml-1 inline" size={15} /></button></div>}</div></div>
            <div className="rounded-2xl bg-[#173d2d] p-6 text-white"><div className="flex items-center gap-3"><div className="rounded-xl bg-lime-300/15 p-3 text-lime-200"><Sprout /></div><div><p className="text-sm text-green-100/70">Your impact so far</p><h3 className="text-xl font-extrabold">Actions that add up</h3></div></div><div className="mt-6 space-y-4">{verified.length ? verified.map((activity) => <div key={activity.id} className="flex gap-3 border-t border-white/10 pt-4"><Check className="mt-0.5 text-lime-300" size={18} /><div><p className="font-bold">{activity.impact}</p><p className="mt-1 text-xs text-green-100/60">Recorded after organizer confirmation</p></div></div>) : <p className="rounded-xl bg-white/5 p-4 text-sm leading-6 text-green-50/75">Verified impact will appear here once an organizer confirms attendance. Activity estimates are not counted as completed impact.</p>}</div></div>
          </div>
          <div className="mt-8"><h3 className="text-2xl font-black">Reward ideas</h3><p className="mt-1 text-sm text-slate-600 dark:text-gray-400">A transparent preview of how points could support participation.</p><div className="mt-4 grid gap-4 md:grid-cols-3">{rewards.map((reward) => { const Icon = reward.icon; const redeemed = saved.redeemed.includes(reward.id); return <div key={reward.id} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center justify-between"><span className="rounded-xl bg-lime-100 p-3 text-green-800"><Icon size={20} /></span><span className="font-extrabold text-green-800 dark:text-lime-300">{reward.cost} pts</span></div><h4 className="mt-4 font-extrabold">{reward.name}</h4><p className="mt-1 text-xs leading-5 text-slate-500">{reward.detail}</p><button disabled={redeemed || points < reward.cost} onClick={() => updateSaved({ ...saved, redeemed: [...saved.redeemed, reward.id] })} className="mt-4 w-full rounded-lg border border-green-800 px-3 py-2 text-sm font-bold text-green-900 disabled:border-slate-200 disabled:text-slate-400 dark:text-green-100">{redeemed ? 'Demo claimed' : points < reward.cost ? `Need ${reward.cost - Math.max(points, 0)} more points` : 'Try demo redemption'}</button></div>; })}</div></div>
        </section>}

        {tab === 'organizer' && <section className="pt-10">
          <div className="rounded-3xl bg-[#173d2d] p-7 text-white sm:p-10"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-center"><div><p className="text-sm font-bold uppercase tracking-[.16em] text-lime-300">Organizer tools · demo</p><h2 className="mt-2 text-3xl font-black sm:text-4xl">Confirm who took part</h2><p className="mt-3 max-w-2xl leading-7 text-green-50/75">Use this check-in view to record attendance after an activity. Verification is stored in this browser only for the demo.</p></div><div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4"><ShieldCheck className="text-lime-300" /><div><p className="font-bold">Organizer check-in</p><p className="text-xs text-green-50/60">Local demo mode</p></div></div></div></div>
          <div className="mt-7 grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><h3 className="text-xl font-extrabold">Check-in steps</h3><ol className="mt-5 space-y-4 text-sm leading-6 text-slate-600 dark:text-gray-300"><li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">1</span>Select an activity after it takes place.</li><li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">2</span>Confirm only the participants who attended.</li><li className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-800">3</span>The participant sees points and impact added to their record.</li></ol><div className="mt-6 rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Production use needs organizer accounts, a shared database, audit history and abuse protection. This prototype does not securely verify identity or sync between devices.</div></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center justify-between"><div><h3 className="text-xl font-extrabold">Participant check-in</h3><p className="mt-1 text-sm text-slate-500">{joined.length} participant sign-ups in this browser</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Demo records</span></div><div className="mt-5 space-y-3">{joined.map((activity) => { const isVerified = saved.verified.includes(activity.id); return <div key={activity.id} className="flex flex-col justify-between gap-4 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center dark:bg-gray-800"><div><p className="font-bold">Demo participant</p><p className="mt-1 text-sm text-slate-500">{activity.title} · {activity.date}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><Clock3 size={13} />Attendance {isVerified ? 'confirmed' : 'not yet confirmed'}</p></div><button disabled={isVerified} onClick={() => updateSaved({ ...saved, verified: [...saved.verified, activity.id] })} className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-bold text-white disabled:bg-green-100 disabled:text-green-900 dark:disabled:bg-green-900/50 dark:disabled:text-green-200">{isVerified ? <><BadgeCheck size={15} className="mr-1 inline" /> Verified</> : 'Confirm attendance'}</button></div>; })}{joined.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center"><Users className="mx-auto text-slate-400" /><p className="mt-3 font-bold">No sign-ups to check in</p><p className="mt-1 text-sm text-slate-500">Join an activity in this browser to see the organizer flow.</p></div>}</div></div>
          </div>
        </section>}

        <div className="mt-12 flex items-start gap-3 rounded-xl border border-slate-200 bg-white/70 p-4 text-xs leading-5 text-slate-500 dark:border-gray-800 dark:bg-gray-900"><HelpCircle className="mt-0.5 shrink-0" size={16} /><p><strong>Prototype data:</strong> activities and reward concepts are sample content. Sign-ups, points and confirmations are saved locally in this browser; they are not shared with organizers or other participants. No impact claims are made until an action is verified.</p></div>
      </main>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5"><p className="text-2xl font-black sm:text-3xl">{value}</p><p className="mt-1 text-xs font-semibold text-green-50/70 sm:text-sm">{label}</p></div>; }
function ImpactStat({ icon: Icon, title, value, note }: { icon: typeof Coins; title: string; value: string; note: string }) { return <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-slate-500">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div><span className="rounded-xl bg-green-100 p-3 text-green-800 dark:bg-green-900/40 dark:text-lime-300"><Icon size={19} /></span></div><p className="mt-2 text-xs text-slate-500">{note}</p></div>; }
