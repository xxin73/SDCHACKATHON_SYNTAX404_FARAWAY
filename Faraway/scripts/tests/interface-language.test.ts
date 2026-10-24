import test from 'node:test';
import assert from 'node:assert/strict';
import {setLanguage,t,ui,getLanguage} from '../../artifacts/faraway/src/lib/i18n';
import catalogue from '../../artifacts/faraway/src/data/expanded-catalogue.json';
import zh from '../../artifacts/faraway/src/lib/locales/zh.json';
import ms from '../../artifacts/faraway/src/lib/locales/ms.json';
test('all three language selections are loaded before being committed',async()=>{
 await setLanguage('en');assert.equal(t('Match score'),'Match score');
 await setLanguage('zh');assert.equal(getLanguage(),'zh');assert.equal(t('Match score'),'匹配分数');
 await setLanguage('ms');assert.equal(t('Match score'),'Skor padanan');
 await setLanguage('en');
});
test('catalogue occupation and course descriptions have both language entries',()=>{
 for(const locale of [zh,ms])for(const item of [...catalogue.careers,...catalogue.courses])for(const key of ['title','description','blurb','qualificationNote'] as const){const source=(item as any)[key];if(typeof source==='string'&&source.trim())assert.ok((locale as Record<string,string>)[source],`Missing ${key}: ${source.slice(0,80)}`);}
});
test('localization preserves numbers, programming names, URLs and React values',async()=>{
 for(const language of ['en','zh','ms'] as const){await setLanguage(language);assert.equal(ui(83.3),83.3);assert.equal(t('Python'),'Python');assert.equal(t('C++'),'C++');assert.equal(t('https://www.bls.gov/'),'https://www.bls.gov/');assert.equal(t('constructor'),'constructor');}
 await setLanguage('en');
});
