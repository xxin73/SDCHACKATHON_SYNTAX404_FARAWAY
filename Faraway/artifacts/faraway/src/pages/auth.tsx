import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Mail, User, Building2, Sparkles, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useStore } from '@/lib/store';
import { Aurora, LOGO, Magnetic, SpectrumIcon, Tilt } from '@/components/spectrum';
import { cn } from '@/lib/utils';
import { FloatingLoginVisual } from '@/components/floating-login-visual';
import { SdcMission } from '@/components/sdc-mission';
import { LandingSections } from '@/components/landing-sections';


export function Login() {
  useLanguage();
  const [, nav] = useLocation();
  const [email, setEmail] = useState('');
  const [showEmail, setShowEmail] = useState(new URLSearchParams(window.location.search).has('verify'));
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = () => nav('/mode');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try { await auth.signIn(email.trim(), password); go(); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden">
      <Aurora />
      <div className="mx-auto grid min-h-[100dvh] max-w-[1360px] gap-8 px-6 py-8 lg:grid-cols-[1fr_0.85fr] lg:gap-14 lg:px-14">
        <div className="flex flex-col">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl border bg-white shadow-md"><img src={LOGO} alt="Faraway logo" className="h-11 w-11 object-contain" /></div>
            <span className="font-mono text-sm tracking-[0.35em]">{localeText("FARAWAY")}</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.9 }} className="mt-[8vh]">
            <p className="eyebrow mb-4">{translateUi("Career & education compass · Malaysia")}</p>
            <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl xl:text-7xl">{translateUi("Where")}{localeText(' ')}<em className="spectrum-text">{translateUi("possibilities")}</em><br />{translateUi("take you.")}</h1>
            <p className="mt-6 max-w-md text-muted-foreground">{translateUi("Explore your skills, compare possible AI futures, and turn a career goal into a practical learning plan.")}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9 }} className="mt-10 w-full max-w-sm space-y-3">

            {!showEmail ? (
              <button onClick={() => setShowEmail(true)} className="btn-ink w-full py-3" data-testid="button-login-email"><Mail className="h-4 w-4" />{translateUi("Continue with email")}</button>
            ) : (
              <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} onSubmit={submit} className="space-y-3">
                <input aria-label={translateUi("Email")} autoComplete="email" autoFocus type="email" required placeholder={localeLabel("you@university.edu.my")} value={email} onChange={(e) => setEmail(e.target.value)} className="field py-3" data-testid="input-login-email" />
                <input aria-label={translateUi("Password")} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={translateUi("Password")} className="field py-3" data-testid="input-login-password" />
                {(error || auth.error) && <p className="text-sm text-red-700" role="alert">{localeText(error || auth.error)}</p>}
                <button disabled={busy} className="btn-ink w-full py-3" data-testid="button-login-submit">{localeText(busy ? translateUi("Signing in…") : translateUi("Sign in"))} <ArrowRight className="h-4 w-4" /></button>
              </motion.form>
            )}
            <p role="status" className="text-sm">{localeText(new URLSearchParams(window.location.search).has('verify') ? 'Account created. Open the confirmation email on any device, then sign in here. You can keep this page open.' : '')}</p><p className="text-xs text-muted-foreground">{translateUi("Your profile and progress save securely to your account")}</p><p className="text-right text-sm text-muted-foreground">{translateUi("New to Faraway?")}{localeText(' ')}<Link href="/register" className="font-medium text-foreground underline-offset-4 hover:underline" data-testid="link-signup">{translateUi("Create account")}</Link></p>
          </motion.div>
        </div>

        <div className="hidden lg:block">
          <FloatingLoginVisual />
        </div>
      </div>
      <LandingSections />
      <SdcMission />
    </div>
  );
}

export function Register() {
  useLanguage();
  const [, nav] = useLocation();
  const [name, setName] = useState(''); const [email, setEmail] = useState('');
  const auth = useAuth();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const signedIn = await auth.signUp(name.trim(), email.trim(), password);
      if (signedIn) nav('/mode');
      else nav('/login?verify=1');
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setBusy(false); }
  };
  return (
    <div className="relative grid min-h-[100dvh] place-items-center px-5 py-10">
      <Aurora />
      <Link href="/login" className="absolute left-6 top-6 flex items-center gap-2" data-testid="link-back-login"><img src={LOGO} alt="Faraway" className="h-9 w-9 object-contain" /><span className="font-mono text-xs tracking-[0.3em]">{localeText("FARAWAY")}</span></Link>
      <Tilt max={3} className="w-full max-w-md">
        <motion.form onSubmit={submit} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="glass spectrum-border rounded-[2rem] p-8 sm:p-10">
          <p className="eyebrow">{translateUi("Sign up")}</p>
          <h1 className="mt-2 font-display text-4xl">{translateUi("Start charting.")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{translateUi("Create an account to save your personal profile and skill assessments.")}</p>
          <label className="mt-8 block text-sm font-medium">{translateUi("Full name")}</label>
          <input aria-label={translateUi("Full name")} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={localeLabel("Nurul Izzati binti Hassan")} className="field mt-2 py-3" data-testid="input-register-name" />
          <label className="mt-5 block text-sm font-medium">{translateUi("Email")}</label>
          <input aria-label={translateUi("Email")} autoComplete="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={localeLabel("izzati@gmail.com")} className="field mt-2 py-3" data-testid="input-register-email" />
          <label htmlFor="register-password" className="mt-5 block text-sm font-medium">{translateUi("Password")}</label>
          <input id="register-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder={translateUi("At least 8 characters")} className="field mt-2 py-3" data-testid="input-register-password" />
          {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
          {notice && <p className="mt-3 text-sm" role="status">{notice}</p>}
          <div className="mt-10 flex justify-center"><Magnetic><button disabled={busy} className="btn-ink px-10 py-3" data-testid="button-register-enter">{localeText(busy ? translateUi("Creating account…") : translateUi("Create account"))} <ArrowRight className="h-4 w-4" /></button></Magnetic></div>
          <p className="mt-6 text-center text-sm text-muted-foreground">{translateUi("Already have one?")}{localeText(' ')}<Link href="/login" className="font-medium text-foreground hover:underline" data-testid="link-login">{translateUi("Log in")}</Link></p>
        </motion.form>
      </Tilt>
    </div>
  );
}

export function Mode() {
  useLanguage();
  const [, nav] = useLocation();
  const name = useStore((s) => s.session?.name ?? '');
  const [hover, setHover] = useState<'p' | 'o' | null>(null);
  const [organization, setOrganization] = useState(false);
  const choose = (m: 'personal' | 'organization') => { if(m==='organization'){setOrganization(true);return;} try { localStorage.setItem('faraway_mode', m); } catch { /* ignore */ } nav(m === 'personal' ? '/' : '/organization'); };
  const opts = [
    { k: 'p' as const, m: 'personal' as const, icon: User, title: 'Personal', sub: 'Fresh graduate, job seeker, or a worker whose role is shifting under AI.' },
    { k: 'o' as const, m: 'organization' as const, icon: Building2, title: 'Organization', sub: 'HR manager, TVET centre or university career office planning for a team.' },
  ];
  return (
    <div className="relative min-h-[100dvh] px-5 py-8 sm:px-10">
      <Aurora />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-6xl flex-col">
        <div className="flex items-center gap-3"><img src={LOGO} alt="Faraway" className="h-10 w-10 object-contain" /><span className="font-mono text-xs tracking-[0.3em]">{localeText("FARAWAY")}</span></div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }} className="glass mt-[8vh] rounded-[2.25rem] p-8 sm:p-14">
          <div className="flex items-center gap-3"><SpectrumIcon icon={Compass} size={26} /><p className="eyebrow">{<>{localeLabel('Welcome')}{name ? ', '+name.split(' ')[0] : ''}</>}</p></div>
          <h1 className="mt-5 font-display text-5xl leading-[1] sm:text-7xl">{localeText(organization ? translateUi("Which organisation are you supporting?") : translateUi("Who are you exploring for?"))}</h1>
          <p className="mt-4 max-w-xl text-muted-foreground">{translateUi("Faraway tunes its compass differently for one person charting a career and for an organisation charting many.")}</p>
        </motion.div>
        <div className="mt-6 grid flex-1 gap-6 pb-6 md:grid-cols-2">
          {organization ? <><button className="glass glass-hover rounded-[2rem] p-8 text-left" data-testid="button-org-company" onClick={()=>{localStorage.setItem('faraway_org_kind','company');localStorage.setItem('faraway_mode','organization');nav('/organization?kind=company');}}><Building2 className="mb-4"/><h2 className="font-display text-3xl">{translateUi("HR manager / employer")}</h2><p className="mt-3">{translateUi("Reskill employees and track workforce learning.")}</p></button><button className="glass glass-hover rounded-[2rem] p-8 text-left" data-testid="button-org-university" onClick={()=>{localStorage.setItem('faraway_org_kind','university');localStorage.setItem('faraway_mode','organization');nav('/organization?kind=university');}}><Building2 className="mb-4"/><h2 className="font-display text-3xl">{translateUi("University / TVET career centre")}</h2><p className="mt-3">{translateUi("Assess student readiness and plan learning pathways.")}</p></button><button className="btn-ghost" onClick={()=>setOrganization(false)}>{translateUi("Back to workspace choice")}</button></> : opts.map((o, i) => (
            <motion.button key={o.k} onClick={() => choose(o.m)} onMouseEnter={() => setHover(o.k)} onMouseLeave={() => setHover(null)} data-testid={`button-mode-${o.m}`}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.1, duration: 0.8 }} whileTap={{ scale: 0.985 }}
              className={cn('glass glass-hover group relative flex min-h-[220px] flex-col justify-between rounded-[2.25rem] p-8 text-left', hover === o.k && 'spectrum-border')}>
              <div className="flex items-start justify-between">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border bg-white shadow-md transition-transform group-hover:-rotate-6 group-hover:scale-105"><SpectrumIcon icon={o.icon} size={30} still={hover !== o.k} /></div>
                <Sparkles className={cn('h-5 w-5 text-muted-foreground transition-opacity', hover === o.k ? 'opacity-100' : 'opacity-0')} />
              </div>
              <div>
                <p className="font-display text-4xl">{translateUi(o.title)}</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">{translateUi(o.sub)}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">{translateUi("Continue")}{localeText(' ')}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

