import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, BadgeCheck, CalendarDays, Check, Coins, Leaf, LogOut, MapPin, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { supabase, type Activity, type ActivitySignup } from '../lib/supabase';

type PointEntry = { points: number };
type Category = Activity['category'];
const toLocalDateTime = (value: string) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export default function ImpactHub() {
  const { configured, loading: authLoading, user, role } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [signups, setSignups] = useState<ActivitySignup[]>([]);
  const [pointEntries, setPointEntries] = useState<PointEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All activities' | Category>('All activities');

  const loadData = useCallback(async () => {
    if (!supabase || !user) { setBusy(false); return; }
    setBusy(true);
    setError('');
    const [activityResult, signupResult, pointsResult] = await Promise.all([
      supabase.from('activity_listing').select('*').order('starts_at'),
      supabase.from('activity_signups')
        .select('id,activity_id,participant_id,status,created_at,activity:activities(title,starts_at,place,points),participant:profiles(display_name)')
        .order('created_at', { ascending: false }),
      supabase.from('point_ledger').select('points').eq('participant_id', user.id),
    ]);
    if (activityResult.error) setError(activityResult.error.message);
    else setActivities((activityResult.data ?? []) as Activity[]);
    if (signupResult.error) setError(signupResult.error.message);
    else setSignups((signupResult.data ?? []) as unknown as ActivitySignup[]);
    if (pointsResult.error) setError(pointsResult.error.message);
    else setPointEntries((pointsResult.data ?? []) as PointEntry[]);
    setBusy(false);
  }, [user]);

  useEffect(() => { if (!authLoading) void loadData(); }, [authLoading, loadData]);

  const joinActivity = async (activityId: string) => {
    if (!supabase) return;
    setError(''); setMessage('');
    const { error: joinError } = await supabase.rpc('join_activity', { activity_uuid: activityId });
    if (joinError) setError(joinError.message);
    else { setMessage('You are registered. The organizer can confirm your attendance after the activity.'); await loadData(); }
  };

  const verifyAttendance = async (signupId: string) => {
    if (!supabase) return;
    setError(''); setMessage('');
    const { data, error: verifyError } = await supabase.rpc('verify_attendance', { signup_uuid: signupId });
    if (verifyError) setError(verifyError.message);
    else { setMessage(`Attendance confirmed. ${data ?? 0} Green Points added.`); await loadData(); }
  };

  const signOut = async () => { if (supabase) await supabase.auth.signOut(); };
  const filtered = activities.filter((activity) => {
    const matchesCategory = filter === 'All activities' || activity.category === filter;
    const text = `${activity.title} ${activity.description} ${activity.place} ${activity.category}`.toLowerCase();
    return matchesCategory && text.includes(query.toLowerCase());
  });
  const mySignups = signups.filter((signup) => signup.participant_id === user?.id);
  const pointsTotal = pointEntries.reduce((total, entry) => total + entry.points, 0);
  const organizerSignups = signups.filter((signup) => activities.some((activity) => activity.id === signup.activity_id && (role === 'admin' || activity.organizer_id === user?.id)));

  if (!configured) return <SetupNotice />;
  if (authLoading) return <PageMessage>Checking your account…</PageMessage>;
  if (!user) return <AuthPanel />;

  return (
    <div className="min-h-screen bg-[#f6f8f4] text-slate-900 dark:bg-gray-950 dark:text-white">
      <section className="bg-[#123c2c] text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center">
          <div><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-lime-200"><Leaf size={14} /> Go Green Mates</div><h1 className="text-4xl font-black sm:text-6xl">Small actions.<br /><span className="text-lime-300">Visible impact.</span></h1><p className="mt-4 max-w-xl leading-7 text-green-50/80">Join community activities and keep a verified record of your participation.</p></div>
          <div className="flex items-center gap-3"><div className="rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-sm text-green-50/70">Green Points</p><p className="mt-1 text-3xl font-black">{pointsTotal}</p></div><button onClick={() => void signOut()} className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-3 font-semibold hover:bg-white/10" aria-label="Sign out"><LogOut size={17} /> Sign out</button></div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {message && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">{message}</div>}
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900"><AlertCircle className="mt-0.5 shrink-0" size={17} />{error}</div>}
        {role === 'organizer' || role === 'admin' ? <OrganizerForm onCreated={loadData} userId={user.id} role={role} activities={activities} /> : null}

        <section aria-labelledby="discover-heading" className="mt-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-sm font-bold uppercase tracking-widest text-green-700 dark:text-lime-300">Discover</p><h2 id="discover-heading" className="mt-1 text-3xl font-black">Community activities</h2><p className="mt-2 text-slate-600 dark:text-gray-400">Listings are published by organizers. Points are awarded only after attendance is verified.</p></div><div className="flex flex-col gap-3 sm:flex-row"><label className="sr-only" htmlFor="activity-search">Search activities</label><input id="activity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activities" className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white" /><label className="sr-only" htmlFor="activity-category">Filter by category</label><select id="activity-category" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white"><option>All activities</option><option>Tree planting</option><option>Clean-ups</option><option>Learning</option><option>Clean energy</option></select></div></div>
          {busy ? <PageMessage>Loading activities…</PageMessage> : filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-600 dark:border-gray-700 dark:text-gray-300">No published activities match your search yet.</div> : <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{filtered.map((activity) => {
            const signup = mySignups.find((item) => item.activity_id === activity.id && item.status !== 'cancelled');
            return <article key={activity.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"><div className="h-44 bg-green-100 dark:bg-green-950">{activity.image_url ? <img src={activity.image_url} alt="" loading="lazy" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-green-800 dark:text-green-300"><Leaf size={44} /></div>}</div><div className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-green-700 dark:text-lime-300">{activity.category}</p><h3 className="mt-2 text-xl font-extrabold">{activity.title}</h3><p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-slate-600 dark:text-gray-400">{activity.description}</p><div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-gray-300"><p className="flex items-center gap-2"><MapPin size={15} />{activity.place}</p><p className="flex items-center gap-2"><CalendarDays size={15} />{new Date(activity.starts_at).toLocaleString()}</p><p className="flex items-center gap-2"><Users size={15} />{activity.spots_remaining} places remaining</p><p className="flex items-center gap-2"><Coins size={15} />{activity.points} points after verification</p></div><div className="mt-4 border-t border-slate-100 pt-4 dark:border-gray-800"><p className="text-xs text-slate-500">Impact measure: {activity.impact_measure}</p>{activity.impact_source_url && <a className="mt-1 inline-block text-xs text-green-800 underline dark:text-lime-300" href={activity.impact_source_url} target="_blank" rel="noreferrer">View supporting source</a>}<button onClick={() => void joinActivity(activity.id)} disabled={Boolean(signup) || role !== 'participant' || activity.spots_remaining < 1 || new Date(activity.starts_at).getTime() <= Date.now()} className="mt-4 w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300">{signup ? 'You are registered' : role !== 'participant' ? 'Participants can join' : 'Join this activity'}</button></div></div></article>;
          })}</div>}
        </section>

        <section aria-labelledby="my-activity-heading" className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center gap-3"><BadgeCheck className="text-green-700 dark:text-lime-300" /><div><h2 id="my-activity-heading" className="text-2xl font-black">My activity</h2><p className="text-sm text-slate-600 dark:text-gray-400">Your sign-ups and verified participation.</p></div></div><div className="mt-5 space-y-3">{mySignups.map((signup) => <div key={signup.id} className="flex flex-col justify-between gap-2 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center dark:bg-gray-800"><div><p className="font-bold">{signup.activity?.title ?? 'Activity'}</p><p className="mt-1 text-sm text-slate-500">{signup.activity?.place} · {signup.activity?.starts_at ? new Date(signup.activity.starts_at).toLocaleString() : ''}</p></div><span className="inline-flex items-center gap-2 text-sm font-bold text-green-800 dark:text-lime-300">{signup.status === 'attended' ? <><Check size={16} /> Verified · {signup.activity?.points ?? 0} points</> : 'Registered'}</span></div>)}{mySignups.length === 0 && <p className="text-sm text-slate-500">You have not joined an activity yet.</p>}</div></section>

        {(role === 'organizer' || role === 'admin') && <section aria-labelledby="checkin-heading" className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"><div className="flex items-center gap-3"><ShieldCheck className="text-green-700 dark:text-lime-300" /><div><h2 id="checkin-heading" className="text-2xl font-black">Organizer check-in</h2><p className="text-sm text-slate-600 dark:text-gray-400">Attendance confirmation creates the participant’s points ledger entry on the server.</p></div></div><div className="mt-5 space-y-3">{organizerSignups.map((signup) => <div key={signup.id} className="flex flex-col justify-between gap-3 rounded-xl bg-slate-50 p-4 sm:flex-row sm:items-center dark:bg-gray-800"><div><p className="font-bold">{signup.participant?.display_name || 'Participant'}</p><p className="mt-1 text-sm text-slate-500">{signup.activity?.title} · {signup.activity?.starts_at ? new Date(signup.activity.starts_at).toLocaleDateString() : ''}</p></div><button onClick={() => void verifyAttendance(signup.id)} disabled={signup.status === 'attended' || signup.status === 'cancelled'} className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-600 dark:disabled:bg-gray-700 dark:disabled:text-gray-300">{signup.status === 'attended' ? 'Attendance verified' : signup.status === 'cancelled' ? 'Cancelled' : 'Confirm attendance'}</button></div>)}{organizerSignups.length === 0 && <p className="text-sm text-slate-500">No participant sign-ups for your published activities yet.</p>}</div></section>}

        <p className="mt-8 text-xs leading-5 text-slate-500">Impact measures are organizer-submitted descriptions. Where a source is provided, it is linked on the activity. Green Points are participation records and do not represent cash.</p>
      </main>
    </div>
  );
}

function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(''); setNotice('');
    const result = mode === 'signup'
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError(result.error.message);
    else if (mode === 'signup' && !result.data.session) setNotice('Check your email to confirm your account, then sign in.');
    setBusy(false);
  };

  return <section className="mx-auto max-w-xl px-5 py-16"><div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm dark:border-gray-800 dark:bg-gray-900"><p className="text-sm font-bold uppercase tracking-widest text-green-700 dark:text-lime-300">Impact Hub</p><h1 className="mt-2 text-3xl font-black">{mode === 'signup' ? 'Create your account' : 'Sign in to continue'}</h1><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-gray-400">Sign-ups and points are linked to your account and stored in the shared Go Green Mates database.</p><form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">{mode === 'signup' && <label className="block text-sm font-semibold">Your name<input required maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800" /></label>}<label className="block text-sm font-semibold">Email<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800" /></label><label className="block text-sm font-semibold">Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 dark:border-gray-700 dark:bg-gray-800" /></label><button disabled={busy} className="w-full rounded-xl bg-green-800 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-60">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form>{notice && <p role="status" className="mt-4 text-sm text-green-800">{notice}</p>}{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setNotice(''); }} className="mt-5 text-sm font-semibold text-green-800 underline dark:text-lime-300">{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></div></section>;
}

function OrganizerForm({ onCreated, userId, role, activities }: { onCreated: () => Promise<void>; userId: string; role: string | null; activities: Activity[] }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', category: 'Tree planting' as Category, place: '', starts_at: '', capacity: 20, points: 50, description: '', image_url: '', impact_measure: '', impact_source_url: '' });

  const editActivity = (activity: Activity) => {
    setEditingId(activity.id);
    setForm({ title: activity.title, category: activity.category, place: activity.place, starts_at: toLocalDateTime(activity.starts_at), capacity: activity.capacity, points: activity.points, description: activity.description, image_url: activity.image_url ?? '', impact_measure: activity.impact_measure, impact_source_url: activity.impact_source_url ?? '' });
    setExpanded(true);
    setError('');
  };

  const clearForm = () => {
    setEditingId(null);
    setForm({ title: '', category: 'Tree planting', place: '', starts_at: '', capacity: 20, points: 50, description: '', image_url: '', impact_measure: '', impact_source_url: '' });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError('');
    const values = { ...form, starts_at: new Date(form.starts_at).toISOString(), image_url: form.image_url || null, impact_source_url: form.impact_source_url || null };
    const result = editingId
      ? await supabase.from('activities').update(values).eq('id', editingId)
      : await supabase.from('activities').insert({ ...values, organizer_id: userId, status: 'published' });
    if (result.error) setError(result.error.message);
    else { clearForm(); setExpanded(false); await onCreated(); }
    setBusy(false);
  };

  return <section className="mb-10 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900 dark:bg-green-950/30"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold uppercase tracking-wider text-green-800 dark:text-lime-300">Organizer tools</p><h2 className="mt-1 text-xl font-extrabold">Publish and update activities</h2></div><button onClick={() => { if (expanded) { clearForm(); setError(''); } setExpanded(!expanded); }} className="rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white">{expanded ? 'Close form' : 'Add activity'}</button></div><div className="mt-4 space-y-2">{activities.filter((activity) => role === 'admin' || activity.organizer_id === userId).map((activity) => <div key={activity.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 p-3 text-sm dark:bg-gray-900"><span className="font-semibold">{activity.title} · {activity.spots_remaining} places left</span><button onClick={() => editActivity(activity)} className="rounded-lg border border-green-800 px-3 py-1.5 font-semibold text-green-900 dark:text-lime-300">Edit activity</button></div>)}</div>{expanded && <form onSubmit={(event) => void submit(event)} className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold">Activity title<input required minLength={5} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900"><option>Tree planting</option><option>Clean-ups</option><option>Learning</option><option>Clean energy</option></select></label><label className="text-sm font-semibold">Location<input required value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold">Date and time<input required type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold">Places available<input required type="number" min={1} max={5000} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold">Points after verified attendance<input required type="number" min={0} max={10000} value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold md:col-span-2">Description<textarea required minLength={20} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" rows={3} /></label><label className="text-sm font-semibold">Impact measure<input required maxLength={240} placeholder="What will be measured?" value={form.impact_measure} onChange={(e) => setForm({ ...form, impact_measure: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold">Evidence or source URL (optional)<input type="url" placeholder="https://…" value={form.impact_source_url} onChange={(e) => setForm({ ...form, impact_source_url: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label><label className="text-sm font-semibold md:col-span-2">Image URL (optional)<input type="url" placeholder="https://…" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 p-3 dark:border-gray-700 dark:bg-gray-900" /></label>{error && <p role="alert" className="text-sm text-red-700 md:col-span-2">{error}</p>}<button disabled={busy} className="rounded-xl bg-green-800 px-4 py-3 font-bold text-white disabled:opacity-60 md:col-span-2">{busy ? 'Saving…' : editingId ? 'Save activity updates' : 'Publish activity'}</button></form>}</section>;
}

function SetupNotice() {
  return <div className="mx-auto max-w-3xl px-5 py-20"><div className="rounded-2xl border border-amber-300 bg-amber-50 p-7 text-amber-950"><h1 className="text-3xl font-black">Impact Hub setup required</h1><p className="mt-3 leading-7">Connect a Supabase project and apply the migration before enabling accounts, registrations, organizer verification or points. This page does not fall back to browser-only records.</p><p className="mt-4 text-sm">See <code>README.md</code> for the setup steps.</p></div></div>;
}

function PageMessage({ children }: { children: string }) { return <div className="mx-auto max-w-7xl px-5 py-12 text-sm text-slate-600 dark:text-gray-300">{children}</div>; }
