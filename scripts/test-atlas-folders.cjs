const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '../packages/app/src/utils/atlasFolders.js'), 'utf8');
const id = 'test-home-library';
function setup() {
  const state = {}, alerts = [];
  const window = {sessionStorage: {getItem: k => state[k], setItem: (k, v) => state[k] = v}, alert: m => alerts.push(m)};
  vm.runInNewContext(source, {window});
  window.AtlasFolders.register(id, 'homevideos');
  return {a: window.AtlasFolders, alerts};
}
(async () => {
  const {a, alerts} = setup();
  assert.equal(a.isArchive('unknown'), false);
  a.register('other-home-videos', 'homevideos');
  assert.equal(a.isArchive('other-home-videos'), true);
  a.register('movies', 'movies');
  assert.equal(a.isArchive('movies'), false);
  const stack = [{id: '2017', name: '2017'}, {id: 'iphone', name: 'iPhone 2017'}];
  a.save(id, stack);
  assert.equal(JSON.stringify(a.restore(id)), JSON.stringify(stack));
  a.save(id, stack.slice(0, 1)); // Back must still move up, never restore the deeper folder.
  assert.equal(a.restore(id).length, 1);
  assert.equal(a.restore('movies').length, 0);
  const all = Array.from({length: 320}, (_, i) => ({Id: String(i), Type: 'Video', Name: String(i)}));
  all[7] = {Id: 'folder', Type: 'Folder', IsFolder: true};
  all[160] = {Id: 'photo', Type: 'Photo'};
  all[161] = {Id: 'metadata-only', Type: 'Video', MediaStreams: [{Type: 'Data'}]};
  const calls = [];
  const api = {getItems: async p => {
    calls.push(p);
    return {Items: all.slice(p.StartIndex, p.StartIndex + p.Limit), TotalRecordCount: all.length};
  }};
  await a.list(id, api, {ParentId: 'iphone', StartIndex: 150, Limit: 150, SortOrder: 'Ascending'});
  a.select(id, all[155]);
  let played;
  await a.play(all[155], {audioIndex: 2}, o => played = o);
  assert.equal(played.audioIndex, 2);
  assert.equal(played.videoQueue[0].Id, '155');
  assert.equal(played.videoQueue.at(-1).Id, '319');
  assert.equal(played.videoQueue.length, 163);
  assert.ok(!played.videoQueue.some(v => v.Id === 'metadata-only'));
  assert.equal(a.preferRemuxMov, true);
  for (const rotation of [-90, 90, 270]) {
    const portrait = {Type: 'Video', Width: 1920, Height: 1080, Rotation: rotation};
    assert.equal(a.streamWidth(portrait, true), 1080);
    assert.equal(a.streamHeight(portrait, true), 1920);
    assert.equal(a.displayAspect({MediaStreams: [portrait]}, 16/9, true), 9/16);
    assert.equal(a.streamWidth(portrait, false), 1920);
    assert.equal(a.displayAspect({MediaStreams: [portrait]}, 16/9, false), 16/9);
  }
  assert.equal(a.streamWidth(null, true), 0);
  assert.equal(a.streamHeight({Width:1920, Height:1080, Rotation:180}, true), 1080);
  assert.deepEqual(calls.slice(1).map(p => p.StartIndex), [0, 150, 300]);
  a.select(id, all[161]);
  let invalidStarts = 0;
  await a.play(all[161], null, () => invalidStarts++);
  assert.equal(invalidStarts, 0);
  assert.ok(played.videoQueue.every(v => v.Type === 'Video'));
  assert.ok(calls.slice(1).every(p => p.ParentId === 'iphone' && p.Recursive === false));
  a.select(id, all[319]);
  await a.play(all[319], null, o => played = o);
  assert.equal(played.videoQueue.length, 1); // No loop or jump into another folder.
  a.select('movies', all[155]);
  await a.play(all[155], null, o => played = o);
  assert.equal(played, null); // Ordinary films remain ordinary films.
  assert.equal(a.preferRemuxMov, false);
  assert.equal(a.streamWidth({Width:1920, Height:1080, Rotation:-90}, true), 1920);
  assert.equal(a.displayAspect({MediaStreams:[{Type:'Video',Rotation:-90}]}, 16/9, true), 16/9);
  a.select(id, all[155]);
  const explicit = {videoQueue: [all[155], all[200]]};
  await a.play(all[155], explicit, o => played = o);
  assert.equal(played, explicit); // Existing playlists win.
  await a.list(id, {getItems: async () => ({Items: [], TotalRecordCount: 0})}, {ParentId: 'empty'});
  a.select(id, all[155]);
  let starts = 0;
  await a.play(all[155], null, () => starts++);
  assert.equal(starts, 1);
  assert.equal(alerts.length, 2); // Metadata-only and missing-item messages.
  console.log('PASS: folder restore/back, 320-item pagination, selected-start, folder/photo exclusion, last-item stop, movie isolation, explicit playlist, missing-item fallback');
})().catch(e => {console.error(e); process.exitCode = 1;});
