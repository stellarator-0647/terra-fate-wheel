import test from 'node:test';
import assert from 'node:assert/strict';
import {issueDraft,issueLink,feedbackMarkup,thanksMarkup,REPOSITORY_URL,INSPIRATION_URL} from '../dist/community.js';

test('feedback preserves Unicode and punctuation through the GitHub draft URL',()=>{
 const draft=issueDraft({category:'玩法与平衡',title:'“冬痕” & 召唤物',body:'希望保留完整描述：10%→20%，不是 &body=另一条意见。',device:'手机'}),url=new URL(issueLink(draft));
 assert.equal(url.origin,'https://github.com');assert.equal(url.pathname,new URL(REPOSITORY_URL).pathname+'/issues/new');assert.equal(url.searchParams.get('title'),draft.title);assert.equal(url.searchParams.get('body'),draft.body);assert.equal(url.searchParams.get('template'),'suggestion.md');
});
test('long feedback uses a paste path without cutting the locally prepared body',()=>{
 const draft=issueDraft({category:'问题反馈',title:'长反馈',body:'中文'.repeat(900)}),url=new URL(issueLink(draft));assert.ok(!url.searchParams.has('body'));assert.ok(url.href.length<7500);assert.ok(draft.body.includes('中文'.repeat(900)));
});
test('feedback form escapes persisted text and ending thanks has real source links',()=>{
 const html=feedbackMarkup({title:'"><script>alert(1)</script>',body:'</textarea><img src=x onerror=alert(1)>'});assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(!html.includes('feedback-title'));assert.ok(html.includes('&lt;img'));const thanks=thanksMarkup();assert.ok(thanks.includes(INSPIRATION_URL));assert.ok(thanks.includes(REPOSITORY_URL));assert.ok(thanks.includes('免费的'));assert.ok(thanks.includes('Star'));
});

test('feedback needs no separate title and derives a bounded Unicode title from the content',()=>{
 const draft=issueDraft({category:'界面与手机适配',body:'手机上查看召唤物不方便。希望增加折叠按钮',device:'手机'});
 assert.equal(draft.title,'[界面与手机适配] 手机上查看召唤物不方便');
 assert.ok(draft.body.includes('希望增加折叠按钮'));
 const long=issueDraft({body:'😀'.repeat(90)});assert.equal(Array.from(long.title.replace('[其他建议] ','')).length,64);
 assert.ok(!feedbackMarkup().includes('一句话概括'));
});
