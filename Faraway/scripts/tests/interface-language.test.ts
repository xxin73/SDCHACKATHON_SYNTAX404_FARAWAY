import test from 'node:test';
import assert from 'node:assert/strict';
import {setLanguage,t} from '../../artifacts/faraway/src/lib/i18n';
import translations from '../../artifacts/faraway/src/lib/translations.json';
test('interface language switches between English, Chinese and Malay',()=>{
 setLanguage('en');assert.equal(t('Match score'),'Match score');
 setLanguage('zh');assert.equal(t('Match score'),'匹配分数');
 setLanguage('ms');assert.equal(t('Match score'),'Skor padanan');
 setLanguage('en');
});
test('canonical skill names, source URLs and unknown content retain original text',()=>{
 for(const language of ['en','zh','ms'] as const){setLanguage(language);assert.equal(t('Python'),'Python');assert.equal(t('C++'),'C++');assert.equal(t('https://www.bls.gov/'),'https://www.bls.gov/');assert.equal(t('User supplied career name'),'User supplied career name');}
 setLanguage('en');
});
test('every dictionary entry has both Chinese and Malay content',()=>{
 for(const [source,entry] of Object.entries(translations)){assert.ok(entry.zh.trim(),source+' missing Chinese');assert.ok(entry.ms.trim(),source+' missing Malay');}
});
