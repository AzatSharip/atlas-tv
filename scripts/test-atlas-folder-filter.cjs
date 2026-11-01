const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync('packages/app/src/utils/atlasFolders.js', 'utf8');
let now = 0;
const root = {sessionStorage: {getItem: () => null, setItem: () => {}, removeItem: () => {}}, alert: () => {}, Date: {now: () => now}, module: {exports: {}}, console};
root.globalThis = root;
vm.runInNewContext(source, root);
const a = root.module.exports;
(async () => {
    a.register('archive', 'homevideos');
    let appeared = false, max = 0, pending = 0;
    const api = {getItems: async p => {
        if (p.Recursive) {
            max = Math.max(max, ++pending);
            await new Promise(resolve => setTimeout(resolve, 1)); pending--;
            if (p.ParentId === 'error') throw Error('offline');
            if (p.ParentId === 'partial') return {Items: []};
            const found = p.ParentId === 'deep' || (p.ParentId === 'empty' && appeared);
            return {Items: found ? [{Id: 'video'}] : [], TotalRecordCount: found ? 1 : 0};
        }
        const items = ['empty', 'deep', 'error', 'partial'].map(Id => ({Id, IsFolder: true}));
        items.push({Id: 'photo', Type: 'Photo'}, {Id: 'video', Type: 'Video'});
        return {Items: items.slice(p.StartIndex, p.StartIndex + p.Limit), TotalRecordCount: items.length};
    }};
    let result = await a.list('archive', api, {Limit: 2});
    assert.deepEqual(Array.from(result.Items, i => i.Id), ['deep']);
    assert.equal(result.AtlasNextIndex, 2);
    result = await a.list('archive', api, {StartIndex: 2, Limit: 2});
    assert.deepEqual(Array.from(result.Items, i => i.Id), ['error', 'partial']);
    appeared = true; now = 31000;
    result = await a.list('archive', api, {Limit: 2});
    assert.deepEqual(Array.from(result.Items, i => i.Id), ['empty', 'deep']);
    assert.ok(max <= 4);
    a.reset(); a.register('archive', 'homevideos');
    // A delayed previous profile request cannot repopulate the next profile.
    const late = a.list('archive', api, {Limit: 2}); a.reset();
    await assert.rejects(late, /session changed/);
    console.log('Archive filter: nesting, incomplete/error preservation, pagination, expiry and session isolation PASS');
})().catch(e => { console.error(e); process.exit(1); });
