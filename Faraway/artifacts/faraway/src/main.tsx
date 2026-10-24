import {initializeLanguage} from '@/lib/i18n';
import './localized-type.css';
import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

const boot=document.getElementById('root')!;
let preferred='en';try{preferred=localStorage.getItem('faraway_language_v1')??'en';}catch{}
const welcome=document.createElement('div');welcome.className='language-boot';
const brand=document.createElement('span');brand.textContent='FARAWAY';
const line=document.createElement('p');line.textContent=preferred==='zh'?'让每一种可能，照亮你的前路。':preferred==='ms'?'Langkah baharu, masa depan bermakna.':'A new direction. A world of possibilities.';
welcome.append(brand,line);boot.replaceChildren(welcome);

void initializeLanguage().then(()=>createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
)).catch((error)=>{
 const host=document.getElementById('root')!;
 const message=document.createElement('p');message.textContent=error instanceof Error?error.message:'Language resources could not be loaded.';
 const retry=document.createElement('button');retry.textContent=/[\u3400-\u9fff]/.test(message.textContent)?'重新加载':message.textContent.includes('bahasa')?'Muat semula':'Reload';retry.onclick=()=>window.location.reload();
 host.replaceChildren(message,retry);
});
