import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import { AccountAvatar } from './account-avatar';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { motion } from 'framer-motion';
import { Atom, BarChart3, Briefcase, Brain, LogOut, RotateCcw, Building2, LayoutGrid } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { resetJourney, useStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { useRecommendations } from '@/lib/recommendations';
import { rankCareers } from '@/lib/match';
import { cn } from '@/lib/utils';
import { Aurora, LOGO, Magnetic, SpectrumIcon } from './spectrum';

const CRUMB: Record<string, string> = {
  '/profile':'Profile & settings', '/': 'Personal', '/pathway': 'Explore pathway', '/analysis': 'Skill analysis', '/plan': 'Study plan', '/progress': 'Learning progress', '/organization': 'Organization', '/evidence': 'Evidence & assumptions',
};

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'FA';
}

export function Shell({ children }: { children: ReactNode }) {
  useLanguage();
  const [loc] = useLocation();
  const auth = useAuth();
  const recommendations = useRecommendations();
  const [resetError, setResetError] = useState('');
  const search = useSearch();
  useEffect(() => { window.scrollTo(0, 0); }, [loc, search]);
  const orgView = new URLSearchParams(search).get("view") || "overview";
  const session = useStore((s) => s.session);
  const profile = useStore((s) => s.profile);
  const scenario = useStore((s) => s.scenario);
  const plan = useStore((s) => s.plan);
  const target = plan.target;
  const jobHref = '/jobs/' + (target || (profile.stream ? rankCareers(profile, scenario)[0].career.id : 'data-analyst'));

  const isOrg = loc.startsWith('/organization');
  const items = isOrg ? [
    {href:'/organization?view=structure',label:'Departments & teams',icon:Building2,match:()=>orgView==='structure'},
    {href:'/organization?view=people',label:'People directory',icon:Building2,match:()=>orgView==='people'},
    {href:'/organization?view=analysis',label:'Workforce intelligence',icon:BarChart3,match:()=>orgView==='analysis'},
    {href:'/organization?view=plan',label:'Learning plans',icon:Brain,match:()=>orgView==='plan'},
    {href:'/organization?view=progress',label:'Team progress',icon:Briefcase,match:()=>orgView==='progress'},
  ] : [
    { href: '/pathway', label: 'Explore pathway', icon: Atom, match: (l: string) => l.startsWith('/pathway') },
    { href: '/analysis', label: 'Skill analysis', icon: BarChart3, match: (l: string) => l.startsWith('/analysis') },
    { href: jobHref, label: 'Career target', icon: Briefcase, match: (l: string) => l.startsWith('/jobs') },
    { href: '/plan', label: 'Study plan', icon: Brain, match: (l: string) => l.startsWith('/plan') },
    { href: '/progress', label: 'Learning progress', icon: Briefcase, match: (l: string) => l.startsWith('/progress') },
  ];
  const mobileItems = isOrg ? [
    {href:'/organization?view=overview',label:'Home',icon:LayoutGrid,active:orgView==='overview'},
    {href:'/organization?view=structure',label:localStorage.getItem(`faraway_org_kind_v4:${auth.user?.id||'demo'}`)==='university'?'Programmes':'Departments',icon:Building2,active:orgView==='structure'},
    {href:'/organization?view=people',label:'People',icon:Building2,active:orgView==='people'},
    {href:'/organization?view=analysis',label:'Insights',icon:BarChart3,active:orgView==='analysis'},
    {href:'/organization?view=plan',label:'Plans',icon:Brain,active:orgView==='plan'},
    {href:'/organization?view=progress',label:'Progress',icon:Briefcase,active:orgView==='progress'},
  ] : [
    {href:'/',label:'Home',icon:LayoutGrid,active:loc==='/'},
    {href:'/pathway',label:'Explore',icon:Atom,active:loc==='/pathway'},
    {href:'/analysis',label:'Insights',icon:BarChart3,active:loc==='/analysis'},
    {href:jobHref,label:'Career',icon:Briefcase,active:loc.startsWith('/jobs')},
    {href:'/plan',label:'Plan',icon:Brain,active:loc==='/plan'},
    {href:'/progress',label:'Progress',icon:Briefcase,active:loc==='/progress'},
  ];
  const crumb = loc.startsWith('/jobs') ? 'Career target' : CRUMB[loc] ?? 'Personal';
  const name = session?.name ?? 'Guest';

  return (
    <div className="relative min-h-[100dvh]">
      <Aurora />
      {/* Left icon rail */}
      <nav aria-label={translateUi("Primary")} className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r bg-white/80 pt-5 backdrop-blur-xl md:flex">
        <Link href={isOrg ? "/organization" : "/"} className="hidden md:mb-8 md:block" data-testid="link-home-logo" aria-label={translateUi("Faraway home")}>
          <motion.img src={LOGO} alt="Faraway" className="h-11 w-11 object-contain drop-shadow-[0_2px_6px_rgba(200,150,0,.25)]" whileHover={{ rotate: 25 }} transition={{ type: 'spring', stiffness: 200 }} />
        </Link>
        <Link href={isOrg ? "/organization" : "/"} className="md:hidden" data-testid="link-home-mobile" aria-label={translateUi("Dashboard")}><div className={cn('grid h-11 w-11 place-items-center rounded-2xl', loc === '/' && 'bg-white shadow-md')}><SpectrumIcon icon={LayoutGrid} size={20} still={loc !== '/'} /></div></Link>
        {items.map((it, i) => {
          const active = it.match(loc);
          return (
            <Magnetic key={it.label} strength={0.35} className="mb-5 shrink-0">
              <Link href={it.href} data-testid={`nav-${it.label.toLowerCase().replace(/\W+/g, '-')}`} aria-label={translateUi(it.label)} className="group relative block">
                <div className={cn('relative grid h-12 w-12 place-items-center rounded-2xl transition-all duration-300', active ? 'bg-white shadow-[0_10px_30px_-12px_hsl(250_60%_40%/.45)]' : 'hover:bg-white hover:shadow-md')}>
                  {active && <motion.span layoutId="rail-active" className="spectrum-border absolute inset-0 rounded-2xl" />}
                  <SpectrumIcon icon={it.icon} size={22} still={!active} />
                </div>
                <span className="pointer-events-none absolute left-[60px] top-1/2 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs text-white opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 md:block">{translateUi(it.label)}</span>
              </Link>
            </Magnetic>
          );
        })}
      </nav>

      <nav aria-label={translateUi("Mobile navigation")} className="mobile-bottom-nav md:hidden" style={{gridTemplateColumns:`repeat(${mobileItems.length},minmax(0,1fr))`}}>{mobileItems.map(({href,label,icon:I,active})=><Link key={label} href={href} aria-current={active?'page':undefined} className={cn('mobile-nav-item',active&&'is-active')}><span className="mobile-nav-icon"><I size={21} strokeWidth={active?2.2:1.7}/></span><span>{translateUi(label)}</span></Link>)}</nav>
      <div className="md:pl-[76px]">
        <header className="app-header mx-auto max-w-[1280px] px-4 pt-4 sm:px-8 md:px-12">
          <div className="flex items-center justify-between">
            <nav aria-label={translateUi("Breadcrumb")} className="flex items-center gap-2 text-sm" data-testid="text-breadcrumb">
              <img src={LOGO} alt="" className="h-7 w-7 object-contain md:hidden" />
              <Link href="/mode" className="hidden text-muted-foreground transition-colors hover:text-foreground sm:block" data-testid="link-crumb-workspace">{translateUi("Workspace")}</Link>
              <span className="hidden text-muted-foreground/50 sm:block">/</span>
              <span className="font-medium">{translateUi(crumb)}</span>
            </nav>
            <div className="flex items-center gap-3"><Link href="/evidence" className="hidden text-xs text-muted-foreground underline sm:block">{translateUi("Evidence & sources")}</Link><Link href="/mode" className="btn-ghost text-xs" data-testid="switch-workspace"><span className="sm:hidden">{translateUi("Switch")}</span><span className="hidden sm:inline">{translateUi("Switch workspace")}</span></Link><DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="group flex flex-col items-center gap-1 outline-none" data-testid="button-avatar">
                  <span className="spectrum-border relative grid h-10 w-10 place-items-center rounded-full bg-white font-mono text-xs font-medium shadow-md transition-transform group-hover:scale-105"><AccountAvatar avatar={profile.avatar} name={name}/></span>
                  <span className="hidden max-w-[110px] truncate text-[10.5px] text-muted-foreground sm:block">{name.split(' ')[0]}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel><p className="font-medium">{name}</p><p className="text-xs font-normal text-muted-foreground">{localeText(session?.email)}</p></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/profile">{translateUi("Profile & settings")}</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link href="/organization" data-testid="menu-organization"><Building2 className="mr-2 h-4 w-4" />{translateUi("Organization view")}</Link></DropdownMenuItem>
                <DropdownMenuItem onClick={async () => { setResetError(""); resetJourney(); try { await auth.flush(); await recommendations.clearJourneyHistory(); } catch (e) { setResetError(e instanceof Error ? e.message : String(e)); } }} data-testid="menu-reset"><RotateCcw className="mr-2 h-4 w-4" />{translateUi("Restart journey")}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => void auth.signOut()} data-testid="menu-signout"><LogOut className="mr-2 h-4 w-4" />{translateUi("Sign out")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu></div>
          </div>
          <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-[hsl(232_30%_88%)] to-transparent" />
        </header>
        <motion.main key={loc} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          className="app-main mx-auto max-w-[1280px] px-4 pb-28 pt-6 sm:px-8 md:px-12 md:pb-20">
          {auth.user && <div className="mb-4 text-sm" role="status" aria-live="polite">{auth.syncStatus.phase === 'saving' ? translateUi("Saving your personal profile…") : auth.syncStatus.phase === 'save-error' ? <><span role="alert">{localeText(auth.syncStatus.error)}{' '}{localeLabel("Keep this tab open.")}</span> <button className="underline" onClick={() => void auth.retry()}>{translateUi("Retry save")}</button></> : translateUi("Personal profile and skills saved to your account.")}</div>}
          {auth.error && <p className="mb-4 text-sm" role="alert">{localeText(auth.error)}</p>}
          {resetError && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">{localeText(resetError)}</p>}
          {localeText(children)}
          <footer className="mt-12 border-t pt-5 text-xs text-muted-foreground">{localeText("Faraway · Personal profiles and learning progress sync to your account. Organisation records are stored in this browser. Scenario figures and catalogue course estimates are illustrative; source links and learning resources are identified separately.")}{localeText(' ')}<Link href="/evidence" className="underline">{translateUi("Review or update evidence")}</Link></footer>
        </motion.main>
      </div>
    </div>
  );
}
