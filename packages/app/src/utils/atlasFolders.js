/* Home-video queue and Tizen rotation compatibility. No media filesystem writes. */
(function (root) {
    'use strict';
    let archives = {};
    function isArchive(id) { return archives[id] === true; }
    function register(id, type) { archives[id] = type === 'homevideos'; }
    let contexts = {}, selection = null;
    function restore(id) {
        if (!isArchive(id)) return [];
        try { return JSON.parse(root.sessionStorage.getItem('atlas_folder_' + id) || '[]'); }
        catch (_) { return []; }
    }
    function save(id, stack) {
        if (!isArchive(id)) return;
        try { root.sessionStorage.setItem('atlas_folder_' + id, JSON.stringify(stack)); }
        catch (_) { /* Session-memory storage may be unavailable; viewing still works. */ }
    }
    let presence = {}, epoch = 0;
    function reset() {
        epoch++; presence = {}; contexts = {}; selection = null; archives = {};
        root.AtlasFolders.preferRemuxMov = false;
        try {
            Object.keys(root.sessionStorage).filter(k => k.indexOf('atlas_folder_') === 0)
                .forEach(k => root.sessionStorage.removeItem(k));
        } catch (_) { /* Storage is optional. */ }
    }
    async function hasVideo(api, folder) {
        const cached = presence[folder.Id];
        if (cached && Date.now() - cached.at < 30000) return cached.value;
        try {
            const result = await api.getItems({ParentId: folder.Id, Recursive: true,
                MediaTypes: 'Video', IsFolder: false, Limit: 1, EnableTotalRecordCount: true});
            // A partial or malformed response is not evidence of an empty branch.
            const value = !(Array.isArray(result.Items) && result.TotalRecordCount === 0 &&
                result.Items.length === 0);
            presence[folder.Id] = {at: Date.now(), value: value};
            return value;
        } catch (_) { return true; }
    }
    async function list(id, api, params) {
        if (!isArchive(id)) return api.getItems(params);
        contexts[id] = {api: api, params: Object.assign({}, params)};
        const generation = epoch;
        let offset = params.StartIndex || 0;
        // Skip empty pages without letting filtered counts corrupt the server offset.
        for (;;) {
            const result = await api.getItems(Object.assign({}, params, {StartIndex: offset}));
            const batch = result.Items || [], visible = [];
            for (let start = 0; start < batch.length; start += 4) {
                const group = batch.slice(start, start + 4);
                const keep = await Promise.all(group.map(item => item.IsFolder
                    ? hasVideo(api, item) : Promise.resolve(item.MediaType === 'Video' || item.Type === 'Video')));
                group.forEach((item, i) => { if (keep[i]) visible.push(item); });
            }
            if (generation !== epoch) throw new Error('Archive session changed');
            offset += batch.length;
            if (visible.length || !batch.length || offset >= result.TotalRecordCount || batch.length < (params.Limit || 150)) {
                return Object.assign({}, result, {Items: visible, AtlasNextIndex: offset});
            }
        }
    }
    function select(id, item, search) {
        selection = isArchive(id) && item.Type === 'Video' && !item.IsFolder && contexts[id]
            ? {id: item.Id, context: contexts[id], search: (search || '').trim().toLowerCase()}
            : null;
    }
    function matches(item) {
        return !!(selection && item.Type === 'Video' && !item.IsFolder && selection.id === item.Id);
    }
    function collect(context) {
        let items = [], seen = {}, offset = 0;
        function page() {
            let params = Object.assign({}, context.params, {
                StartIndex: offset, Limit: 150, Recursive: false, EnableTotalRecordCount: true,
                Fields: (context.params.Fields || '') + ',MediaStreams'
            });
            return context.api.getItems(params).then(function (result) {
                let batch = result.Items || [];
                if (!batch.length) return items;
                let added = 0;
                batch.forEach(function (item) {
                    if (!seen[item.Id]) { seen[item.Id] = true; items.push(item); added++; }
                });
                if (!added) throw new Error('Archive pagination made no progress');
                offset += batch.length;
                if (offset >= result.TotalRecordCount || batch.length < 150) return items;
                return page();
            });
        }
        return page();
    }
    function play(item, options, start) {
        let chosen = selection;
        root.AtlasFolders.preferRemuxMov = matches(item);
        if (!chosen || chosen.id !== item.Id || (options && options.videoQueue)) {
            start(options); return Promise.resolve();
        }
        return collect(chosen.context).then(function (items) {
            let queue = items.filter(function (entry) {
                return !entry.IsFolder && entry.Type === 'Video' &&
                    (!Array.isArray(entry.MediaStreams) || entry.MediaStreams.some(function (stream) { return stream.Type === 'Video'; })) && (!chosen.search ||
                    (entry.SortName || entry.Name || '').toLowerCase().indexOf(chosen.search) >= 0);
            });
            let index = queue.findIndex(function (entry) { return entry.Id === item.Id; });
            let selected = items.find(function (entry) { return entry.Id === item.Id; });
            if (index < 0 && selected && Array.isArray(selected.MediaStreams) &&
                !selected.MediaStreams.some(function (stream) { return stream.Type === 'Video'; })) {
                root.alert('В этом файле нет видеодорожки. Выберите другое видео.');
                return;
            }
            if (index < 0) throw new Error('Selected video is no longer in this folder');
            start(Object.assign({}, options || {}, {videoQueue: queue.slice(index)}));
        }).catch(function () {
            root.alert('Не удалось загрузить очередь папки. Запускается только выбранное видео.');
            start(options);
        });
    }
    function rotated(stream, transcoding) {
        return !!(root.AtlasFolders.preferRemuxMov && transcoding && stream &&
            Math.abs(Number(stream.Rotation) % 180) === 90);
    }
    function streamWidth(stream, transcoding) {
        return Number(stream && stream[rotated(stream, transcoding) ? 'Height' : 'Width']) || 0;
    }
    function streamHeight(stream, transcoding) {
        return Number(stream && stream[rotated(stream, transcoding) ? 'Width' : 'Height']) || 0;
    }
    function displayAspect(source, original, transcoding) {
        let stream = source && (source.MediaStreams || []).find(function(s) { return s.Type === 'Video'; });
        return rotated(stream, transcoding) && original > 0 ? 1 / original : original;
    }
    let adapter = {reset: reset, register: register, restore: restore, save: save, list: list, select: select, play: play,
        streamWidth: streamWidth, streamHeight: streamHeight, displayAspect: displayAspect,
        matches: matches, isArchive: isArchive};
    root.AtlasFolders = adapter;
    if (typeof module !== 'undefined') module.exports = adapter;
})(typeof window !== 'undefined' ? window : globalThis);
