import {t as localeLabel,ui as localeText} from '@/lib/i18n';
import {t as translateUi,useLanguage} from '@/lib/i18n';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { requireSupabase } from '@/lib/supabase';
import { setState, useStore } from '@/lib/store';
import { Card, CardTitle, PageTitle } from '@/components/bits';
import { AccountAvatar, AVATAR_STYLES } from '@/components/account-avatar';

export default function ProfilePage(){
  useLanguage();
 const auth=useAuth();const profile=useStore(s=>s.profile);
 const [name,setName]=useState(profile.name||auth.user?.user_metadata.full_name||'');
 const [username,setUsername]=useState(auth.user?.user_metadata.username||'');
 const [location,setLocation]=useState(profile.location);
 const [avatar,setAvatar]=useState<string>(profile.avatar||'violet');
 const [currentPassword,setCurrentPassword]=useState('');const [password,setPassword]=useState('');const [repeat,setRepeat]=useState('');
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const upload=async(file?:File)=>{if(!file)return;setError('');try{
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPG or WebP picture.');
  if(file.size>5*1024*1024)throw new Error('Choose a picture under 5 MB.');
  const image=await createImageBitmap(file);try{const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Picture processing is unavailable.');const size=Math.min(image.width,image.height);ctx.drawImage(image,(image.width-size)/2,(image.height-size)/2,size,size,0,0,192,192);setAvatar(canvas.toDataURL('image/jpeg',0.8));}finally{image.close();}
 }catch(e){setError(e instanceof Error?e.message:String(e));}};
 const save=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setMessage('');setError('');try{
  if(!name.trim())throw new Error('Enter your name.');
  if(username&&!/^[A-Za-z0-9_.-]{3,30}$/.test(username))throw new Error('Use 3–30 letters, numbers, dots, underscores or hyphens for your display username.');
  const {error}=await requireSupabase().auth.updateUser({data:{full_name:name.trim(),username}});if(error)throw error;
  setState(s=>({...s,session:s.session?{...s.session,name:name.trim()}:s.session,profile:{...s.profile,name:name.trim(),location:location.trim(),avatar}}),true,true);
  await auth.flush();setMessage('Profile saved.');
 }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const changePassword=async(e:FormEvent)=>{e.preventDefault();setBusy(true);setMessage('');setError('');try{
  if(password.length<8)throw new Error('Use a password with at least 8 characters.');if(password!==repeat)throw new Error('New passwords do not match.');if(password===currentPassword)throw new Error('Choose a different new password.');
  const client=requireSupabase();const checked=await client.auth.signInWithPassword({email:auth.user?.email||'',password:currentPassword});if(checked.error)throw new Error('Current password is incorrect or sign-in could not be verified.');
  const {error}=await client.auth.updateUser({password});if(error)throw error;
  setCurrentPassword('');setPassword('');setRepeat('');setMessage('Password changed. Use your new password the next time you sign in.');
 }catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 return <div className="space-y-6"><PageTitle eyebrow={translateUi("Your account")} title={translateUi("Profile & settings")}>{translateUi("Manage your identity, picture and account security.")}</PageTitle>{message&&<p role="status" className="rounded-xl bg-emerald-50 p-4">{localeText(message)}</p>}{error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}<Card><CardTitle title={translateUi("Personal details")}/><form onSubmit={save} className="space-y-5"><div className="flex items-center gap-4"><AccountAvatar avatar={avatar} name={name} size={88}/><div><p className="font-medium">{translateUi("Profile picture")}</p><p className="text-xs text-muted-foreground">{translateUi("Choose a default picture or upload your own. Pictures are cropped to a square.")}</p></div></div><div className="flex flex-wrap gap-3">{AVATAR_STYLES.map(style=><button key={style} type="button" aria-label={localeLabel('Choose '+style+' avatar')} aria-pressed={avatar===style} disabled={busy} className={'rounded-full border-2 p-1 '+(avatar===style?'border-violet-600':'border-transparent')} onClick={()=>setAvatar(style)}><AccountAvatar avatar={style} name={name} size={52}/></button>)}</div><label className="block text-sm">{translateUi("Upload a picture (PNG, JPG, WebP, up to 5 MB)")}<input className="field mt-2" disabled={busy} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">{translateUi("Full name")}<input required className="field mt-2" autoComplete="name" maxLength={100} value={name} onChange={e=>setName(e.target.value)}/></label><label className="text-sm">{translateUi("Display username")}<input className="field mt-2" maxLength={30} value={username} onChange={e=>setUsername(e.target.value)}/><span className="text-xs text-muted-foreground">{translateUi("For display only; sign in with your email.")}</span></label><label className="text-sm">{translateUi("Email")}<input className="field mt-2" readOnly value={auth.user?.email||''}/></label><label className="text-sm">{translateUi("Location")}<input className="field mt-2" maxLength={200} value={location} onChange={e=>setLocation(e.target.value)}/></label></div><p className="text-xs text-muted-foreground">{translateUi("Email")}{localeText(' ')}{localeText(auth.user?.email_confirmed_at?'verified':'not yet verified')}{localeText(' ')}{localeText("· Joined")}{localeText(' ')}{localeText(auth.user?.created_at?new Date(auth.user.created_at).toLocaleDateString():'—')}</p><button disabled={busy} className="btn-ink">{localeText(busy?translateUi("Saving…"):'Save profile')}</button></form></Card><Card><CardTitle title={translateUi("Change password")}/><form onSubmit={changePassword} className="max-w-md space-y-4"><label className="block text-sm">{translateUi("Current password")}<input className="field mt-2" type="password" autoComplete="current-password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)}/></label><label className="block text-sm">{translateUi("New password")}<input className="field mt-2" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="block text-sm">{translateUi("Confirm new password")}<input className="field mt-2" type="password" autoComplete="new-password" minLength={8} required value={repeat} onChange={e=>setRepeat(e.target.value)}/></label><button disabled={busy} className="btn-ink">{translateUi("Change password")}</button></form></Card></div>;
}
