export function skillError(value:string):string {
 const s=value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim();
 if(s.length<2||s.length>80)return 'Enter a skill between 2 and 80 characters.';
 if(!/^[\p{L}\p{N} +#.&/'()–-]+$/u.test(s)||!/[\p{L}]/u.test(s))return 'Enter a skill name, without links or special symbols.';
 if(/\b(?:fuck(?:ing|er)?|shit|bullshit|bitch|asshole|bastard|cunt|dick|porn|nigger|nigga)\b|操你|傻逼|他妈|妈的/i.test(s))return 'Please enter an appropriate skill name.';
 return '';
}
export function cleanSkill(value:string){return value.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').trim().replace(/\s+/g,' ');}
