/*
 * Inicio, biblioteca, ajustes y protector de pantalla. Navegación solo con el control remoto.
 * Sintaxis limitada a lo que soporta Chromium 56 (nada de ?. ni ... en objetos ni padStart).
 */
(function () {
    'use strict';

    var CFG = window.GLASS_CONFIG;
    var VERSION = '1.0.0';
    var stage = document.getElementById('stage');
    var $ = function (id) { return document.getElementById(id); };
    var scale = 1;

    var KEY = {
        LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13,
        BACK: 10009, ESC: 27, BACKSPACE: 8,
        RED: 403, GREEN: 404, YELLOW: 405, BLUE: 406, INFO: 457
    };

    var LIB_COLS = 6, LIB_ROW_H = 250;

    // ---------------------------------------------------------------- Preferencias

    var PREFS_KEY = 'glass.prefs.v1';
    var prefs = (function () {
        var d = { pinned: null, hidden: [], showHidden: false, lang: 'auto', speed: 'normal', tray: 'glass', shelf: 'images', saverClock: 'high', wallpaper: 'dynamic', clock24: false, saverMin: CFG.screensaverMinutes, showInputs: true, hdmiNames: {} };
        try {
            var s = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
            Object.keys(s).forEach(function (k) { d[k] = s[k]; });
        } catch (e) { /* almacenamiento no disponible */ }
        return d;
    })();

    function savePrefs() {
        try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) { /* sin almacenamiento */ }
    }

    // ---------------------------------------------------------------- Utilidades

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
    }

    function pad2(n) { return ('0' + n).slice(-2); }

    function hue(text) {
        var h = 0;
        for (var i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 360;
        return h;
    }

    function hsl(h, s, l) {
        // Hex para que Aurora pueda calcular rgba()
        s /= 100; l /= 100;
        var k = function (n) { return (n + h / 30) % 12; };
        var a = s * Math.min(l, 1 - l);
        var f = function (n) {
            var v = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return pad2(Math.round(v * 255).toString(16));
        };
        return '#' + f(0) + f(8) + f(4);
    }

    function stagePos(el) {
        // Posición de diseño (ignora transforms), que es justo lo que el vidrio necesita.
        var x = 0, y = 0;
        while (el && el !== stage) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
        return { x: x, y: y };
    }

    function restart(el, cls) {
        el.classList.remove('in-r', 'in-l', 'in-u', 'in-d', 'bump-r', 'bump-l', 'bump-u', 'bump-d');
        void el.offsetWidth;
        el.classList.add(cls);
    }

    function svgMark(key, color) {
        var m = window.MARKS[key];
        if (!m) return '';
        return '<svg viewBox="' + m.viewBox + '"><path fill="' + (color || '#fff') + '" d="' + m.d + '"/></svg>';
    }

    var ICONS = {
        apps: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2.4"/><rect x="13" y="3" width="8" height="8" rx="2.4"/><rect x="3" y="13" width="8" height="8" rx="2.4"/><rect x="13" y="13" width="8" height="8" rx="2.4"/></svg>',
        settings: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="2.4" rx="1.2"/><rect x="3" y="15.6" width="18" height="2.4" rx="1.2"/><circle cx="8.5" cy="7.2" r="3.2"/><circle cx="15.5" cy="16.8" r="3.2"/></svg>',
        manage: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2.4"/><rect x="13" y="3" width="8" height="8" rx="2.4"/><rect x="3" y="13" width="8" height="8" rx="2.4"/><path d="M17 12.2a1 1 0 0 1 1 1V16h2.8a1 1 0 1 1 0 2H18v2.8a1 1 0 1 1-2 0V18h-2.8a1 1 0 1 1 0-2H16v-2.8a1 1 0 0 1 1-1z" transform="rotate(45 17 17)"/></svg>',
        // Un cuadro con un paisaje: el protector como "cuadro" decorativo
        saver: '<svg viewBox="0 0 24 24"><path d="M5 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zm0 2.2a.8.8 0 0 0-.8.8v9.6l4.3-4.3a1.4 1.4 0 0 1 2 0l2.7 2.7 1.7-1.7a1.4 1.4 0 0 1 2 0l2.9 2.9V6a.8.8 0 0 0-.8-.8z"/><circle cx="15.5" cy="8.5" r="1.8"/></svg>',
        input: '<svg viewBox="0 0 24 24"><path d="M5 4h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3zm0 2.2a.8.8 0 0 0-.8.8v8c0 .44.36.8.8.8h14a.8.8 0 0 0 .8-.8V7a.8.8 0 0 0-.8-.8z"/><rect x="7" y="19.4" width="10" height="2.2" rx="1.1"/></svg>'
    };

    // ---------------------------------------------------------------- Fondo y vidrio

    var imgs = { a: null, b: null };
    var bgKey = null, bgToken = 0, bgTimer = null, lastFlip = 0;

    function makeGlass(el) {
        if (el.querySelector('.gl-wrap')) return;
        var w = document.createElement('div');
        w.className = 'gl-wrap';
        w.innerHTML = '<div class="L a" data-img="glass"></div><div class="L b" data-img="glass"></div>';
        el.insertBefore(w, el.firstChild);
        ['a', 'b'].forEach(function (k) {
            if (imgs[k]) w.querySelector('.L.' + k).style.backgroundImage = 'url(' + imgs[k].glass + ')';
        });
        alignGlass(el);
    }

    // dy: cuánto se ha desplazado el elemento en pantalla (la bandeja sube con la cuadrícula).
    function alignGlass(el, dy) {
        var p = stagePos(el);
        var pos = (-p.x) + 'px ' + (-(p.y + (dy || 0))) + 'px';
        var layers = el.querySelectorAll('.gl-wrap .L');
        for (var i = 0; i < layers.length; i++) layers[i].style.backgroundPosition = pos;
    }

    // Nivel de oscurecimiento extra según el brillo (0 a 1) de la zona donde va texto:
    // 0 = foto oscura (nada extra), 1 = clara, 2 = muy clara.
    function setLevel(el, prefix, lum) {
        var level = lum > 0.6 ? 2 : lum > 0.42 ? 1 : 0;
        el.classList.toggle(prefix + '-1', level === 1);
        el.classList.toggle(prefix + '-2', level === 2);
    }

    // p = { key, colors } para una aurora o { key, img } para una foto del Top Shelf.
    function bgSet(p) {
        return p.img ? Aurora.fromImage(p.key, p.img) : Promise.resolve(Aurora.get(p.key, p.colors));
    }

    function applyBackground(p) {
        if (p.key === bgKey) return;
        bgKey = p.key;
        var token = ++bgToken;
        var set = null;
        bgSet(p).then(function (s) {
            set = s;
            if (!set) throw new Error('fondo no disponible');
            return Aurora.ready([set.sharp, set.glass]);
        }).then(function () {
            // Un fundido nuevo antes de que termine el anterior haría saltar la capa de abajo.
            var wait = Math.max(0, lastFlip + 950 - Date.now());
            return new Promise(function (r) { setTimeout(r, wait); });
        }).then(function () {
            if (token !== bgToken) return;
            var back = stage.classList.contains('flip') ? 'a' : 'b';
            imgs[back] = set;
            var layers = document.querySelectorAll('.L.' + back);
            for (var i = 0; i < layers.length; i++) {
                layers[i].style.backgroundImage = 'url(' + (layers[i].getAttribute('data-img') === 'glass' ? set.glass : set.sharp) + ')';
            }
            // Dos cuadros para que el TV pinte la capa nueva antes de empezar el fundido.
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    if (token !== bgToken) return;
                    lastFlip = Date.now();
                    stage.classList.toggle('flip');
                    // Oscurecer más detrás del texto si la foto es clara en esa zona.
                    setLevel(stage, 'lum', set.lum ? set.lum.home : 0);
                });
            });
        }).catch(function () { if (token === bgToken) bgKey = null; });
    }

    // Genera y decodifica en segundo plano los fondos de todas las apps, uno cada pocos cuadros,
    // para que el primer paso por una app no espere al canvas ni al decodificador del TV.
    var warmed = {};
    function warmBackgrounds(items) {
        var holder = $('warm');
        var queue = items.slice();
        (function next() {
            var item = queue.shift();
            if (!item) return;
            var p = paletteFor(item);
            if (p && !warmed[p.key]) {
                warmed[p.key] = true;
                bgSet(p).then(function (set) {
                    if (!set) return next();
                    // Mantenerlas referenciadas en el DOM evita que el TV descarte la versión decodificada.
                    // De las fotos solo se guarda el vidrio: las fotos grandes ocuparían demasiada memoria.
                    var d = document.createElement('div');
                    d.style.backgroundImage = p.img ? 'url(' + set.glass + ')' : 'url(' + set.sharp + '),url(' + set.glass + ')';
                    holder.appendChild(d);
                    Aurora.ready([set.glass]).then(function () { setTimeout(next, 60); });
                });
            } else {
                next();
            }
        })();
    }

    function paletteFor(item) {
        if (item && item.feature) return { key: 'f:' + item.feature.img, img: item.feature.img };
        if (prefs.wallpaper !== 'dynamic') {
            var wp = WALLPAPERS.filter(function (w) { return w.key === prefs.wallpaper; })[0] || WALLPAPERS[1];
            return { key: 'wp:' + wp.key, colors: wp.aurora };
        }
        if (!item) return null;
        if (item.brand) return { key: 'b:' + item.brand.key, colors: item.brand.aurora };
        if (item.hue !== undefined) {
            var h = item.hue;
            return { key: 'h:' + h, colors: [hsl(h, 50, 4), hsl(h, 65, 38), hsl((h + 30) % 360, 85, 68), hsl((h + 320) % 360, 55, 18)] };
        }
        return null;
    }

    function scheduleBackground(item, now) {
        var p = paletteFor(item);
        if (!p) return;
        clearTimeout(bgTimer);
        if (now) applyBackground(p);
        else bgTimer = setTimeout(function () { applyBackground(p); }, 200);
    }

    // ---------------------------------------------------------------- Datos

    var allApps = [];
    var homeApps = [];
    var hdmiList = [];

    var HDMI_NAMES = [
        { key: '', label: null },
        { key: 'playstation', label: 'PlayStation', brand: 'playstation' },
        { key: 'xbox', label: 'Xbox', brand: 'xbox' },
        { key: 'nintendoswitch', label: 'Nintendo Switch', brand: 'nintendoswitch' },
        { key: 'decoder', tkey: 'hdmi.decoder' },
        { key: 'pc', tkey: 'hdmi.pc' },
        { key: 'chromecast', label: 'Chromecast' },
        { key: 'appletv', label: 'Apple TV', brand: 'appletv' },
        { key: 'soundbar', tkey: 'hdmi.soundbar' }
    ];

    function decorate(a) {
        var brand = window.brandForApp(a);
        return {
            type: 'app',
            id: a.id,
            label: brand ? brand.label : a.name,
            brand: brand,
            iconPath: a.iconPath,
            alt: a.alt || [],
            hue: hue(a.name)
        };
    }

    // Como en tvOS: Inicio muestra todas las apps instaladas. Primero en el orden guardado (o el
    // orden por defecto de marcas), luego el resto alfabéticamente. Las ocultas no aparecen.
    function computeHome() {
        var byId = {};
        allApps.forEach(function (a) {
            byId[a.id] = a;
            a.alt.forEach(function (id) { byId[id] = a; });
        });
        var hidden = {};
        // Con "Apps ocultas: Mostrar" se ven todas, sin olvidar cuáles están marcadas como ocultas.
        if (!prefs.showHidden) (prefs.hidden || []).forEach(function (id) { if (byId[id]) hidden[byId[id].id] = true; });

        var first = [];
        if (prefs.pinned) {
            first = prefs.pinned.map(function (id) { return byId[id]; });
        } else {
            CFG.defaultOrder.forEach(function (key) {
                first.push(allApps.filter(function (a) { return a.brand && a.brand.key === key; })[0]);
            });
        }
        // Un id guardado puede ser una alternativa de otra app ya incluida: se deja una sola.
        var seen = {};
        homeApps = first.concat(allApps).filter(function (a) {
            if (!a || seen[a.id] || hidden[a.id]) return false;
            seen[a.id] = true;
            return true;
        });
    }

    function isPinned(app) {
        return (prefs.hidden || []).indexOf(app.id) < 0;
    }

    function setHidden(app, hide) {
        var list = (prefs.hidden || []).filter(function (id) { return id !== app.id; });
        if (hide) list.push(app.id);
        prefs.hidden = list;
        // Ocultar una app vuelve a activar el modo Ocultar; si no, seguiría viéndose.
        if (hide) prefs.showHidden = false;
    }

    function pinCurrentOrder() {
        prefs.pinned = homeApps.map(function (a) { return a.id; });
        savePrefs();
        // La primera fila pudo cambiar: traer de TMDB lo que falte (lo demás sale de la caché).
        loadFeaturedSoon();
    }

    function hdmiItem(src) {
        var name = HDMI_NAMES.filter(function (n) { return n.key === (prefs.hdmiNames[src.number] || ''); })[0] || HDMI_NAMES[0];
        var brand = name.brand ? window.brandByKey(name.brand) : null;
        return {
            type: 'hdmi', n: src.number,
            label: (name.tkey ? I18N.t(name.tkey) : name.label) || 'HDMI ' + src.number,
            sub: 'HDMI ' + src.number,
            brand: brand && brand.input ? brand : null,
            markKey: name.brand || null,
            hue: name.brand ? undefined : 215
        };
    }

    // ---------------------------------------------------------------- Plantillas

    function tileTint(item) {
        var t;
        if (item.brand) t = item.brand.tile;
        else if (item.hue !== undefined) t = [hsl(item.hue, 42, 40), hsl(item.hue, 48, 20)];
        else t = NEUTRAL.tile;
        return 'linear-gradient(160deg,' + t[0] + ' 0%,' + t[1] + ' 100%)';
    }

    function faceInner(item) {
        if (item.type === 'library') return ICONS.apps.replace('<svg', '<svg fill="#fff"');
        if (item.type === 'settings') return ICONS.settings.replace('<svg', '<svg fill="#fff"');
        if (item.type === 'manage') return ICONS.manage.replace('<svg', '<svg fill="#fff"');
        if (item.type === 'saver') return ICONS.saver.replace('<svg', '<svg fill="#fff"');
        if (item.type === 'hdmi') {
            return item.markKey && window.MARKS[item.markKey] ? svgMark(item.markKey, '#fff') : ICONS.input.replace('<svg', '<svg fill="#fff"');
        }
        if (item.brand && item.brand.word) return '<span class="word" style="color:' + item.brand.mark + '">' + esc(item.brand.word) + '</span>';
        if (item.brand && window.MARKS[item.brand.key]) return svgMark(item.brand.key, item.brand.mark);
        var mono = '<span class="mono">' + esc(item.label.charAt(0).toUpperCase()) + '</span>';
        if (item.iconPath) {
            var src = item.iconPath.charAt(0) === '/' ? 'file://' + item.iconPath : item.iconPath;
            return mono + '<img src="' + esc(src) + '" onload="this.previousSibling.style.display=\'none\'" onerror="this.parentNode.removeChild(this)">';
        }
        return mono;
    }

    function tileHTML(item, extra) {
        return '<div class="tile">' +
            '<div class="t-shadow"></div>' +
            '<div class="t-tilt"><div class="t-face" style="background:' + tileTint(item) + '">' + faceInner(item) + '</div>' +
            '<div class="t-gloss"></div></div>' +
            (extra || '') +
            '<div class="t-label">' + esc(item.label) + '</div></div>';
    }

    // ---------------------------------------------------------------- Hero

    var heroFlip = false, artFlip = false;

    function heroCopy(item) {
        var t = I18N.t;
        if (item.type === 'library') return { eyebrow: t('hero.library.e'), title: t('tile.library'), blurb: t('hero.library.b', { n: allApps.length }) };
        if (item.type === 'settings') return { eyebrow: t('hero.settings.e'), title: t('tile.settings'), blurb: t('hero.settings.b') };
        if (item.type === 'manage') return { eyebrow: t('hero.manage.e'), title: t('tile.manage'), blurb: t('hero.manage.b') };
        if (item.type === 'saver') return { eyebrow: t('hero.saver.e'), title: t('tile.saver'), blurb: t('hero.saver.b') };
        if (item.type === 'hdmi') return { eyebrow: t('hero.hdmi.e', { sub: item.sub }), title: item.label, blurb: t('hero.hdmi.b', { sub: item.sub }) };
        if (item.brand) {
            return {
                eyebrow: item.brand.cat ? t('cat.' + item.brand.cat) : item.brand.eyebrow,
                title: item.label,
                blurb: I18N.has('b.' + item.brand.key) ? t('b.' + item.brand.key) : t('hero.app.b')
            };
        }
        return { eyebrow: t('hero.app.e'), title: item.label, blurb: t('hero.app.b') };
    }

    function fillCopy(el, c) {
        el.querySelector('.eyebrow').textContent = c.eyebrow;
        el.querySelector('.title').textContent = c.title;
        el.querySelector('.blurb').textContent = c.blurb;
    }

    function showHero(item, copy) {
        var c = copy || heroCopy(item);
        var copies = document.querySelectorAll('#hero .copy');
        var next = copies[heroFlip ? 0 : 1], prev = copies[heroFlip ? 1 : 0];
        if (prev.querySelector('.title').textContent === c.title && prev.classList.contains('on')) return;
        if (copy) {
            // Top Shelf: solo cambia el texto; la tarjeta 3D no se usa.
            heroFlip = !heroFlip;
            fillCopy(next, c);
            prev.classList.remove('on');
            next.classList.add('on');
            return;
        }
        heroFlip = !heroFlip;
        fillCopy(next, c);
        prev.classList.remove('on');
        next.classList.add('on');

        var arts = document.querySelectorAll('.art');
        var na = arts[artFlip ? 0 : 1], pa = arts[artFlip ? 1 : 0];
        artFlip = !artFlip;
        na.innerHTML = '<div class="art-shadow"></div><div class="art-face" style="background:' + tileTint(item) + '">' +
            faceInner(item) + '</div><div class="t-gloss" style="border-radius:60px"></div>';
        pa.classList.remove('on');
        na.classList.add('on');
    }

    // ---------------------------------------------------------------- Cuadrícula de Inicio (como tvOS)

    // Las apps primero y al final los atajos (entradas HDMI, Todas las apps, Administrar apps, Ajustes), todo en una
    // sola cuadrícula. Al bajar de la primera fila la página sube y el área destacada se desvanece.
    var state = { screen: 'home', ai: 0, li: 0, oi: 0, editing: false };
    var gridItems = [];
    var COLS = 6, STEP_X = 282, ROW_H = 240, GRID_TOP = 808, SCROLL_TO = 150;

    var lastOffset = 0;

    function gridTiles() { return $('grid').children; }

    function systemItems() {
        var out = [];
        if (prefs.showInputs) hdmiList.filter(function (s) { return s.connected; }).forEach(function (s) { out.push(hdmiItem(s)); });
        out.push({ type: 'library', label: I18N.t('tile.library') });
        // Pantalla de Apps de Samsung: ahí se pueden eliminar apps (Lumen no tiene permiso para hacerlo).
        out.push({ type: 'manage', label: I18N.t('tile.manage'), id: 'com.samsung.tv.store', alt: ['org.volt.apps'] });
        out.push({ type: 'saver', label: I18N.t('tile.saver') });
        out.push({ type: 'settings', label: I18N.t('tile.settings') });
        return out;
    }

    function cellPos(i) {
        return { x: (i % COLS) * STEP_X, y: Math.floor(i / COLS) * ROW_H };
    }

    function layoutGrid() {
        var tiles = gridTiles();
        var home = state.screen === 'home';
        for (var i = 0; i < tiles.length; i++) {
            var p = cellPos(i);
            var on = home && i === state.ai;
            var s = on ? (state.editing ? 1.2 : 1.14) : 1;
            tiles[i].style.transform = 'translate3d(' + p.x + 'px,' + p.y + 'px,0) scale(' + s + ')';
            tiles[i].style.zIndex = on ? 2 : 1;
            // La primera fila va sobre el vidrio, sin nombre debajo (como tvOS).
            tiles[i].classList.toggle('r0', i < COLS);
        }
        var row = Math.floor(state.ai / COLS);
        var offset = row === 0 ? 0 : GRID_TOP + row * ROW_H - SCROLL_TO - ROW_H;
        $('page').style.transform = 'translate3d(0,' + (-offset) + 'px,0)';
        // Como en tvOS, la bandeja se estira hacia el lado de la app del borde enfocada.
        var col = state.ai % COLS, inRow0 = home && state.ai < COLS;
        $('shelf').classList.toggle('grow-l', inRow0 && col === 0);
        $('shelf').classList.toggle('grow-r', inRow0 && (col === COLS - 1 || state.ai === Math.min(COLS, gridItems.length) - 1));
        // La bandeja de vidrio sube con la página: su vidrio debe mostrar el fondo de su nueva posición.
        if (offset !== lastOffset) { alignGlass($('shelf'), -offset); lastOffset = offset; }
        stage.classList.toggle('scrolled', row > 0);
    }

    function clearFocus() {
        var f = stage.querySelectorAll('.focus');
        for (var i = 0; i < f.length; i++) f[i].classList.remove('focus');
    }

    function focusGrid(dir) {
        if (!gridItems.length) return;
        state.ai = Math.max(0, Math.min(state.ai, gridItems.length - 1));
        clearFocus();
        var tile = gridTiles()[state.ai];
        tile.classList.add('focus');
        if (dir) restart(tile.querySelector('.t-tilt'), 'in-' + dir);
        layoutGrid();
        // Como en tvOS, solo la primera fila manda en el área de arriba (fondo, título y rotación).
        // Más abajo el fondo vuelve al Grafito neutro.
        if (state.ai < COLS) onFocusItem(gridItems[state.ai]);
        else showGridBackground();
    }

    function onFocusItem(item) {
        var list = featuredFor(item);
        if (list) return showShelf(item, list);
        stopShelf();
        showHero(item);
        if (item.type !== 'library' && item.type !== 'settings' && item.type !== 'manage' && item.type !== 'saver') scheduleBackground(item);
    }

    // ---------------------------------------------------------------- Top Shelf (prueba)

    // Al enfocar una app de streaming, el fondo es una imagen grande de un título destacado que
    // rota cada pocos segundos con fundido. Los títulos vienen de TMDB (js/tmdb.js).
    // Tiempo por imagen según Ajustes → Velocidad de las imágenes: [área de arriba, protector].
    var SPEEDS = { fast: [5000, 8000], normal: [8000, 12000], slow: [14000, 20000] };
    function speed() { return SPEEDS[prefs.speed] || SPEEDS.normal; }
    var shelf = { key: null, timer: null };

    function featuredFor(item) {
        var data = window.FEATURED;
        if (prefs.shelf === 'classic') return null;
        if (!data || !item || item.type !== 'app' || !item.brand) return null;
        var list = data[item.brand.key];
        return list && list.length ? list : null;
    }

    function shuffle(arr) {
        for (var i = arr.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1)), t = arr[i];
            arr[i] = arr[j];
            arr[j] = t;
        }
        return arr;
    }

    // Orden por popularidad (el que da TMDB: lo más visto primero). Se recuerda dónde iba cada
    // plataforma: al volver sigue con el siguiente título en vez de empezar otra vez por el primero.
    var orders = {};
    function orderFor(key, list) {
        var o = orders[key];
        if (!o || o.list !== list) {
            var idx = [];
            for (var i = 0; i < list.length; i++) idx.push(i);
            o = orders[key] = { list: list, idx: idx, pos: 0, seen: false };
        }
        return o;
    }

    function advance(o) {
        o.pos = (o.pos + 1) % o.idx.length;
    }

    function showShelf(item, list, rotating) {
        var o = orderFor(item.brand.key, list);
        if (shelf.key !== item.brand.key) {
            shelf.key = item.brand.key;
            if (o.seen) advance(o);
        }
        o.seen = true;
        var f = list[o.idx[o.pos]];
        stage.classList.add('has-art');
        showHero(item, { eyebrow: I18N.t('shelf.popular', { app: item.label }), title: f.title, blurb: f.meta + ' · ' + f.blurb });
        renderDots(list.length, o.pos);
        // Los puntos van debajo del texto, con aire antes de la bandeja de apps.
        $('dots').style.top = '702px';
        scheduleBackground({ feature: f }, rotating);
        clearTimeout(shelf.timer);
        // Precargar la siguiente imagen para que el cambio no espere al decodificador.
        var nextF = list[o.idx[(o.pos + 1) % list.length]];
        if (nextF !== f) Aurora.fromImage('f:' + nextF.img, nextF.img);
        shelf.timer = setTimeout(function tick() {
            // En pausa (otra pantalla, edición o filas de abajo): solo se vuelve a programar.
            if (state.screen !== 'home' || state.editing || document.hidden || launching || state.ai >= COLS) {
                shelf.timer = setTimeout(tick, speed()[0]);
                return;
            }
            advance(o);
            showShelf(item, list, true);
        }, speed()[0]);
    }

    function showGridBackground() {
        var g = WALLPAPERS.filter(function (w) { return w.key === 'graphite'; })[0];
        clearTimeout(bgTimer);
        bgTimer = setTimeout(function () { applyBackground({ key: 'wp:graphite', colors: g.aurora }); }, 120);
    }

    // Solo se piden a TMDB las plataformas de la primera fila (las que muestran el Top Shelf).
    function topBrands() {
        return gridItems.slice(0, COLS).map(function (it) { return it.brand ? it.brand.key : null; }).filter(Boolean);
    }

    var featuredTimer = null;
    function loadFeaturedSoon() {
        clearTimeout(featuredTimer);
        featuredTimer = setTimeout(loadFeatured, 1500);
    }

    function loadFeatured() {
        if (!window.TMDB) return;
        TMDB.load(topBrands()).then(function (fresh) {
            if (state.screen === 'panel' && state.about) renderAbout();
            warmBackgrounds(firstFeatures());
            // Refrescar el área de arriba si se está viendo una app de la primera fila.
            if (state.screen === 'home' && state.ai < COLS && gridItems[state.ai]) {
                if (fresh) shelf.key = null;
                onFocusItem(gridItems[state.ai]);
            }
        });
    }

    function stopShelf() {
        clearTimeout(shelf.timer);
        shelf.key = null;
        stage.classList.remove('has-art');
    }

    // Solo las 2 primeras imágenes de cada plataforma se descargan por adelantado; las demás,
    // una por una justo antes de mostrarse (y solo si se llega a ellas).
    function firstFeatures() {
        var out = [];
        gridItems.slice(0, COLS).forEach(function (it) {
            var list = featuredFor(it);
            if (!list) return;
            // Las 2 primeras en el orden en que se verán.
            var o = orderFor(it.brand.key, list);
            o.idx.slice(o.pos, o.pos + 2).forEach(function (n) { out.push({ feature: list[n] }); });
        });
        return out;
    }

    // Como en el iPhone: máximo 7 puntos que se desplazan; los de las orillas, más pequeños, indican
    // que hay más de ese lado.
    var MAX_DOTS = 7;
    function renderDots(n, active) {
        if (n < 2) { $('dots').innerHTML = ''; return; }
        var count = Math.min(n, MAX_DOTS);
        var start = Math.max(0, Math.min(active - Math.floor(count / 2), n - count));
        var html = '';
        for (var i = start; i < start + count; i++) {
            var cls = i === active ? 'on' : (i === start && start > 0) || (i === start + count - 1 && start + count < n) ? 'sm' : '';
            html += '<i' + (cls ? ' class="' + cls + '"' : '') + '></i>';
        }
        $('dots').innerHTML = html;
    }

    function bump(el, dir) {
        if (el) restart(el, 'bump-' + dir);
    }

    // ---------------------------------------------------------------- Render

    function renderGrid() {
        var keep = gridItems[state.ai];
        gridItems = homeApps.concat(systemItems());
        $('grid').innerHTML = gridItems.map(function (it) { return tileHTML(it); }).join('');
        if (keep) {
            for (var i = 0; i < gridItems.length; i++) {
                var it = gridItems[i];
                if ((it.id && it.id === keep.id) || (!it.id && it.type === keep.type && it.n === keep.n)) { state.ai = i; break; }
            }
        }
        if (state.screen === 'home') focusGrid(); else layoutGrid();
    }

    // ---------------------------------------------------------------- Abrir apps y entradas

    var launching = false;

    function launchItem(item, tileEl) {
        if (launching) return;
        launching = true;
        var veil = $('veil');
        var r = tileEl.getBoundingClientRect(), s = stage.getBoundingClientRect();
        var x = (r.left - s.left) / scale, y = (r.top - s.top) / scale;
        var w = r.width / scale, h = r.height / scale;
        veil.className = 'veil';
        veil.style.background = tileTint(item);
        veil.querySelector('.veil-mark').innerHTML = faceInner(item);
        veil.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) scale(' + (w / 1920) + ',' + (h / 1080) + ')';
        void veil.offsetWidth;
        veil.classList.add('go');

        var done = function () {
            setTimeout(function () { hideVeil(); }, Platform.isTV ? 2500 : 900);
        };
        setTimeout(function () {
            var p = item.type === 'hdmi' ? Platform.openHdmi(item.n) : Platform.launchAny([item.id].concat(item.alt));
            p.then(done, function (err) {
                hideVeil();
                toast(I18N.t('toast.openFail', { app: item.label }));
                console.error(err);
            });
        }, 420);
    }

    function hideVeil() {
        launching = false;
        var veil = $('veil');
        if (!veil.classList.contains('go')) return;
        veil.className = 'veil out';
        setTimeout(function () { if (!launching) veil.className = 'veil'; }, 520);
    }

    // ---------------------------------------------------------------- Modo edición

    function enterEdit() {
        if (state.ai >= homeApps.length) return;
        state.editing = true;
        stage.classList.add('editing');
        var hint = $('edit-hint');
        hint.style.left = ((1920 - hint.offsetWidth) / 2) + 'px';
        makeGlass(hint);
        alignGlass(hint);
        layoutGrid();
    }

    function exitEdit() {
        state.editing = false;
        stage.classList.remove('editing');
        pinCurrentOrder();
        layoutGrid();
    }

    // Mueve la app enfocada a otra celda; las demás se desplazan con su transición de transform.
    function moveInEdit(delta, dir) {
        var from = state.ai, to = from + delta;
        var sameRow = Math.abs(delta) !== 1 || Math.floor(to / COLS) === Math.floor(from / COLS);
        if (to < 0 || to >= homeApps.length || !sameRow) return bump(gridTiles()[from].querySelector('.t-tilt'), dir);
        var grid = $('grid');
        var tile = grid.children[from];
        var app = homeApps.splice(from, 1)[0];
        homeApps.splice(to, 0, app);
        gridItems.splice(from, 1);
        gridItems.splice(to, 0, app);
        grid.removeChild(tile);
        grid.insertBefore(tile, grid.children[to] || null);
        state.ai = to;
        layoutGrid();
    }

    function removeInEdit() {
        var app = homeApps[state.ai];
        setHidden(app, true);
        homeApps.splice(state.ai, 1);
        var tile = gridTiles()[state.ai];
        tile.style.opacity = '0';
        setTimeout(function () {
            exitEdit();
            renderGrid();
        }, 220);
        toast(I18N.t('toast.hiddenEdit', { app: app.label }));
    }

    // ---------------------------------------------------------------- Biblioteca

    function openLibrary() {
        state.screen = 'library';
        var hiddenCount = allApps.length - homeApps.length;
        $('lib-sub').textContent = I18N.t('lib.count', { n: allApps.length }) +
            (hiddenCount ? ' · ' + I18N.t(hiddenCount === 1 ? 'lib.hiddenOne' : 'lib.hiddenMany', { n: hiddenCount }) : '') +
            ' · ' + I18N.t('lib.hint');
        renderLibrary();
        $('library').classList.add('open');
        state.li = Math.min(state.li, allApps.length - 1);
        focusLibrary();
    }

    function renderLibrary() {
        $('lib-grid').innerHTML = allApps.map(function (a) {
            return tileHTML(a, isPinned(a) ? '<div class="pin">✓</div>' : '');
        }).join('');
    }

    function focusLibrary(dir) {
        clearFocus();
        var tile = $('lib-grid').children[state.li];
        if (!tile) return;
        tile.classList.add('focus');
        if (dir) restart(tile.querySelector('.t-tilt'), 'in-' + dir);
        var row = Math.floor(state.li / LIB_COLS);
        var y = Math.max(0, row - 1) * LIB_ROW_H;
        $('lib-grid').style.transform = 'translate3d(0,' + (-y) + 'px,0)';
        scheduleBackground(allApps[state.li]);
    }

    function closeLibrary() {
        $('library').classList.remove('open');
        state.screen = 'home';
        focusGrid();
    }

    function togglePin() {
        var app = allApps[state.li];
        if (isPinned(app)) {
            setHidden(app, true);
            homeApps = homeApps.filter(function (a) { return a.id !== app.id; });
            toast(I18N.t('toast.hidden', { app: app.label }));
        } else {
            setHidden(app, false);
            homeApps.push(app);
            toast(I18N.t('toast.shown', { app: app.label }));
        }
        pinCurrentOrder();
        renderGrid();
        var tile = $('lib-grid').children[state.li];
        var pin = tile.querySelector('.pin');
        if (pin) tile.removeChild(pin);
        else tile.insertAdjacentHTML('beforeend', '<div class="pin">✓</div>');
    }

    // ---------------------------------------------------------------- Ajustes

    function cycle(list, current, dir) {
        var i = list.indexOf(current);
        return list[(i + dir + list.length) % list.length];
    }

    // Para valores con orden (de menos a más): no da la vuelta en los extremos. null = ya está en el borde.
    function step(list, current, dir) {
        var i = list.indexOf(current) + dir;
        return i < 0 || i >= list.length ? null : list[i];
    }

    function options() {
        var t = I18N.t;
        var o = [
            {
                label: t('opt.lang'),
                value: function () {
                    return prefs.lang === 'auto' ? t('lang.auto', { name: I18N.NAMES[I18N.systemLang()] }) : I18N.NAMES[prefs.lang];
                },
                change: function (d) {
                    prefs.lang = cycle(['auto'].concat(I18N.LANGS), prefs.lang, d);
                    applyLanguage();
                }
            },
            {
                label: t('opt.wallpaper'),
                value: function () { return t('wp.' + prefs.wallpaper); },
                change: function (d) {
                    prefs.wallpaper = cycle(WALLPAPERS.map(function (w) { return w.key; }), prefs.wallpaper, d);
                    // Más abajo de la primera fila el fondo sigue en Grafito.
                    if (state.ai < COLS) scheduleBackground(gridItems[state.ai] || null, true);
                }
            },
            {
                label: t('opt.shelf'),
                value: function () { return t(prefs.shelf === 'classic' ? 'shelf.classic' : 'shelf.images'); },
                change: function () {
                    prefs.shelf = prefs.shelf === 'classic' ? 'images' : 'classic';
                    // Si el foco está en la primera fila se refresca ya; si está más abajo, se verá al subir.
                    if (state.ai < COLS && gridItems[state.ai]) onFocusItem(gridItems[state.ai]);
                    else if (prefs.shelf === 'classic') stopShelf();
                }
            },
            {
                label: t('opt.tray'),
                value: function () { return t('tray.' + prefs.tray); },
                change: function (d) {
                    prefs.tray = cycle(['glass', 'tint', 'solid', 'none'], prefs.tray, d);
                    applyTray();
                }
            },
            {
                // Afecta la rotación del área de arriba y la del protector de pantalla.
                label: t('opt.speed'),
                value: function () { return t('speed.' + prefs.speed); },
                change: function (d) {
                    var v = step(['fast', 'normal', 'slow'], prefs.speed, d);
                    if (v === null) return false;
                    prefs.speed = v;
                    // El cambio se nota en la siguiente imagen: se reprograma con el tiempo nuevo.
                    if (state.ai < COLS && gridItems[state.ai] && featuredFor(gridItems[state.ai])) {
                        showShelf(gridItems[state.ai], featuredFor(gridItems[state.ai]));
                    }
                }
            },
            {
                label: t('opt.clock'),
                value: function () { return t(prefs.clock24 ? 'clock.24' : 'clock.12'); },
                change: function () { prefs.clock24 = !prefs.clock24; tick(); }
            },
            {
                label: t('opt.saver'),
                value: function () { return prefs.saverMin ? t('saver.min', { n: prefs.saverMin }) : t('saver.never'); },
                change: function (d) {
                    var v = step([0, 2, 5, 10, 20, 30], prefs.saverMin, d);
                    if (v === null) return false;
                    prefs.saverMin = v;
                }
            },
            {
                // Opacidad de la hora del protector: más baja deja ver el fondo, que cambia.
                label: t('opt.saverClock'),
                value: function () { return t('level.' + prefs.saverClock); },
                change: function (d) {
                    var v = step(['low', 'medium', 'high'], prefs.saverClock, d);
                    if (v === null) return false;
                    prefs.saverClock = v;
                    applySaverClock();
                }
            },
            {
                label: t('opt.inputs'),
                value: function () { return t(prefs.showInputs ? 'show' : 'hide'); },
                change: function () { prefs.showInputs = !prefs.showInputs; renderGrid(); }
            }
        ];
        hdmiList.forEach(function (src) {
            o.push({
                label: src.connected ? 'HDMI ' + src.number : t('opt.hdmiOff', { name: 'HDMI ' + src.number }),
                off: !src.connected,
                value: function () {
                    var n = HDMI_NAMES.filter(function (x) { return x.key === (prefs.hdmiNames[src.number] || ''); })[0];
                    return (n && (n.tkey ? t(n.tkey) : n.label)) || 'HDMI ' + src.number;
                },
                change: function (d) {
                    prefs.hdmiNames[src.number] = cycle(HDMI_NAMES.map(function (x) { return x.key; }), prefs.hdmiNames[src.number] || '', d);
                    renderGrid();
                }
            });
        });
        o.push({
            label: t('opt.hidden', { n: allApps.filter(function (a) { return !isPinned(a); }).length }),
            value: function () { return t(prefs.showHidden ? 'show' : 'hide'); },
            change: function () {
                prefs.showHidden = !prefs.showHidden;
                computeHome();
                renderGrid();
                loadFeaturedSoon();
            }
        });
        o.push({
            label: t('opt.reset'),
            value: function () { return 'OK'; },
            action: function () {
                prefs.pinned = null;
                prefs.hidden = [];
                computeHome();
                renderGrid();
                loadFeaturedSoon();
                toast(I18N.t('toast.reset'));
            }
        });
        o.push({
            label: t('opt.about'),
            value: function () { return '›'; },
            action: openAbout
        });
        return o;
    }

    var opts = [];

    function openPanel() {
        state.screen = 'panel';
        opts = options();
        state.oi = 0;
        renderOpts();
        state.about = false;
        $('panel').classList.remove('about-open');
        var panel = $('panel');
        makeGlass(panel);
        alignGlass(panel);
        panel.classList.add('open');
        focusOpt();
    }

    // Información de Lumen, del TV y de los datos, con los créditos que exigen TMDB y los logos.
    function renderAbout() {
        var t = I18N.t, info = Platform.deviceInfo();
        var row = function (k, v) { return '<div class="ab-row"><span>' + esc(k) + '</span><span>' + esc(v) + '</span></div>'; };
        $('about').innerHTML =
            row(t('about.version'), 'Lumen ' + VERSION) +
            row(t('about.tv'), info.model) +
            (info.firmware ? row(t('about.firmware'), info.firmware) : '') +
            row(t('about.locale'), I18N.NAMES[I18N.systemLang()] + ' · ' + (window.TMDB ? TMDB.region() : (I18N.country() || ''))) +
            row(t('about.data'), window.TMDB ? TMDB.describe() : '') +
            '<div class="ab-credits"><p>' + esc(t('tmdb.credit')) + '</p><p>' + esc(t('about.logos')) + '</p></div>' +
            '<div class="ab-back">' + esc(t('about.back')) + '</div>';
    }

    function openAbout() {
        state.about = true;
        renderAbout();
        document.querySelector('#panel h2').textContent = I18N.t('opt.about');
        $('panel').classList.add('about-open');
    }

    function closeAbout() {
        state.about = false;
        document.querySelector('#panel h2').textContent = I18N.t('set.title');
        $('panel').classList.remove('about-open');
        focusOpt();
    }

    function renderOpts() {
        $('opts').innerHTML = opts.map(function (o) {
            return '<div class="opt' + (o.off ? ' off' : '') + '"><div class="ch-fill"></div><span>' + esc(o.label) + '</span>' +
                '<span class="val">' + (o.action ? '' : '<i>‹</i>') + '<b>' + esc(o.value()) + '</b>' + (o.action ? '' : '<i>›</i>') + '</span></div>';
        }).join('');
    }

    var OPT_H = 88, OPT_VIEW = 812;
    var optTop = 0;

    function focusOpt() {
        clearFocus();
        $('opts').children[state.oi].classList.add('focus');
        // Mantener visible la opción enfocada, con una de margen hacia donde se va.
        var visible = Math.floor(OPT_VIEW / OPT_H);
        if (state.oi === 0) optTop = 0;
        if (state.oi - optTop >= visible - 1) optTop = Math.min(state.oi - visible + 2, opts.length - visible);
        if (state.oi - optTop < 1) optTop = Math.max(0, state.oi - 1);
        optTop = Math.max(0, optTop);
        $('opts').style.transform = 'translate3d(0,' + (-optTop * OPT_H) + 'px,0)';
    }

    function changeOpt(d) {
        var o = opts[state.oi];
        if (o.action) { if (d === 0) o.action(); return; }
        if (o.change(d || 1) === false) return bump($('opts').children[state.oi], d < 0 ? 'l' : 'r');
        savePrefs();
        $('opts').children[state.oi].querySelector('b').textContent = o.value();
    }

    // Estilo de la bandeja de la primera fila: vidrio, translúcida, sólida o sin bandeja.
    function applyTray() {
        stage.classList.toggle('tray-tint', prefs.tray === 'tint');
        stage.classList.toggle('tray-solid', prefs.tray === 'solid');
        stage.classList.toggle('tray-none', prefs.tray === 'none');
    }

    // Textos fijos del HTML (títulos de pantallas y la ayuda del modo edición).
    function applyStaticTexts() {
        var t = I18N.t;
        document.documentElement.lang = I18N.lang();
        document.querySelector('#panel h2').textContent = t('set.title');
        document.querySelector('.lib-head h2').textContent = t('lib.title');
        $('edit-hint').innerHTML = '<span><b>' + esc(t('edit.arrows')) + '</b> ' + esc(t('edit.move')) + '</span>' +
            '<span><b>' + esc(t('edit.hold')) + '</b> ' + esc(t('edit.hide')) + '</span>' +
            '<span><b>OK</b> ' + esc(t('edit.done')) + '</span>';
    }

    // Cambia todos los textos al idioma elegido y pide a TMDB los títulos en ese idioma.
    function applyLanguage() {
        I18N.use(prefs.lang);
        savePrefs();
        // Solo lo guardado en el idioma nuevo; si no hay, el área clásica hasta que llegue de TMDB.
        if (window.TMDB) TMDB.prime();
        applyStaticTexts();
        tick();
        renderGrid();
        if (state.screen === 'panel') {
            var oi = state.oi;
            opts = options();
            renderOpts();
            state.oi = oi;
            focusOpt();
        }
        if (state.ai < COLS && gridItems[state.ai]) { shelf.key = null; onFocusItem(gridItems[state.ai]); }
        loadFeaturedSoon();
    }

    function closePanel() {
        $('panel').classList.remove('open');
        state.screen = 'home';
        savePrefs();
        focusGrid();
    }

    // ---------------------------------------------------------------- Reloj y avisos

    function timeText(d) {
        var h = d.getHours();
        if (!prefs.clock24) h = h % 12 || 12;
        return (prefs.clock24 ? pad2(h) : h) + ':' + pad2(d.getMinutes());
    }

    function tick() {
        var d = new Date();
        $('clock-time').textContent = timeText(d);
        $('clock-date').textContent = I18N.dateShort(d);
        $('saver-time').textContent = timeText(d);
        $('saver-date').textContent = I18N.dateLong(d);
        alignGlass(document.querySelector('.clock'));
    }

    function startClock() {
        tick();
        setTimeout(function loop() {
            tick();
            setTimeout(loop, 60000 - Date.now() % 60000 + 30);
        }, 60000 - Date.now() % 60000 + 30);
    }

    var toastTimer = null;

    function toast(text) {
        var t = $('toast');
        if (!t.querySelector('span')) t.insertAdjacentHTML('beforeend', '<span></span>');
        t.querySelector('span').textContent = text;
        makeGlass(t);
        t.style.left = ((1920 - t.offsetWidth) / 2) + 'px';
        alignGlass(t);
        t.classList.add('on');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.classList.remove('on'); }, 2600);
    }

    // ---------------------------------------------------------------- Protector de pantalla

    var lastInput = Date.now();

    // Muestra las imágenes de los títulos destacados de todas las plataformas, una tras otra con
    // un fundido lento, sin movimiento. Solo hay dos capas: la visible y la siguiente.
    var saver = { list: [], i: 0, flip: false, timer: null };

    function saverList() {
        var out = [], data = window.FEATURED || {};
        Object.keys(data).forEach(function (key) {
            var b = window.brandByKey(key);
            data[key].forEach(function (f) {
                out.push({ img: f.img, title: f.title, from: b ? b.label : key, meta: f.meta, blurb: f.blurb });
            });
        });
        // Orden aleatorio: se mezclan títulos y plataformas.
        return shuffle(out);
    }

    function saverShow(item, set) {
        var lum = set && set.lum;
        setLevel($('saver'), 'info', lum ? lum.info : 0);
        setLevel($('saver'), 'clock', lum ? lum.clock : 0);
        var layers = document.querySelectorAll('.saver-img');
        var next = layers[saver.flip ? 0 : 1], prev = layers[saver.flip ? 1 : 0];
        saver.flip = !saver.flip;
        next.style.backgroundImage = 'url(' + item.img + ')';
        requestAnimationFrame(function () {
            next.classList.add('on');
            prev.classList.remove('on');
        });
        // El texto se funde junto con la imagen: sale, cambia y vuelve a entrar.
        var info = $('saver-info');
        info.classList.add('hide');
        setTimeout(function () {
            info.querySelector('.eyebrow').textContent = item.from ? I18N.t('shelf.popular', { app: item.from }) : '';
            info.querySelector('.title').textContent = item.title || '';
            info.querySelector('.blurb').textContent = [item.meta, item.blurb].filter(Boolean).join(' · ');
            info.classList.remove('hide');
        }, 700);
    }

    function saverNext() {
        if (state.screen !== 'saver') return;
        saver.i++;
        if (saver.i >= saver.list.length) {
            // Vuelta completa: barajar de nuevo, sin repetir seguido el último que se vio.
            var last = saver.list[saver.list.length - 1];
            saver.list = saverList();
            if (saver.list.length > 1 && saver.list[0].img === last.img) saver.list.push(saver.list.shift());
            saver.i = 0;
        }
        var item = saver.list[saver.i];
        // fromImage además de cargarla mide su brillo (para el contraste de la hora y el texto).
        Aurora.fromImage('f:' + item.img, item.img).then(function (set) {
            if (state.screen !== 'saver') return;
            saverShow(item, set);
            // Precarga la siguiente mientras se ve esta.
            var nextItem = saver.list[(saver.i + 1) % saver.list.length];
            Aurora.fromImage('f:' + nextItem.img, nextItem.img);
            saver.timer = setTimeout(saverNext, speed()[1]);
        });
    }

    var SAVER_CLOCK = {
        high: { opacity: 1 },
        medium: { opacity: 0.75 },
        low: { opacity: 0.55 }
    };

    function applySaverClock() {
        var c = SAVER_CLOCK[prefs.saverClock] || SAVER_CLOCK.high;
        // Solo la hora: es lo único que queda fijo; la información cambia con cada imagen.
        document.querySelector('.saver-clock').style.opacity = c.opacity;
    }

    function openSaver() {
        applySaverClock();
        state.prevScreen = state.screen;
        state.screen = 'saver';
        saver.list = saverList();
        $('saver').classList.add('on');
        if (!saver.list.length) {
            var set = imgs[stage.classList.contains('flip') ? 'b' : 'a'];
            if (set) saverShow({ img: set.sharp, title: '', from: '' });
            return;
        }
        saver.i = -1;
        saverNext();
    }

    function closeSaver() {
        clearTimeout(saver.timer);
        $('saver').classList.remove('on');
        state.screen = state.prevScreen || 'home';
    }

    setInterval(function () {
        if (state.screen === 'saver' || !prefs.saverMin || document.hidden || launching) return;
        if (Date.now() - lastInput > prefs.saverMin * 60000) openSaver();
    }, 10000);

    // ---------------------------------------------------------------- Teclado / control remoto

    var lastMove = 0, held = {};
    var enterDown = false, enterLong = false, enterTimer = null;

    function isBack(k) { return k === KEY.BACK || k === KEY.ESC || k === KEY.BACKSPACE; }

    function onKey(e) {
        var k = e.keyCode;
        lastInput = Date.now();

        if (state.screen === 'saver') {
            e.preventDefault();
            if (k !== KEY.ENTER || !enterDown) closeSaver();
            return;
        }
        if (launching) { e.preventDefault(); return; }

        if (k === KEY.ENTER) {
            e.preventDefault();
            if (enterDown) return;
            enterDown = true;
            enterLong = false;
            enterTimer = setTimeout(function () { enterLong = true; onLongPress(); }, 600);
            return;
        }
        enterDown = false;
        clearTimeout(enterTimer);

        if (k >= 37 && k <= 40) {
            e.preventDefault();
            // Pulsaciones sueltas siempre cuentan; solo se frena la repetición al mantener la tecla.
            var now = Date.now();
            if (held[k] && now - lastMove < 110) return;
            held[k] = true;
            lastMove = now;
            move(k === KEY.LEFT ? 'l' : k === KEY.RIGHT ? 'r' : k === KEY.UP ? 'u' : 'd');
            return;
        }
        if (isBack(k)) { e.preventDefault(); back(); return; }
        if (k === KEY.GREEN && state.screen === 'home') openLibrary();
        // Solo en la vista previa web: S abre el protector de pantalla para probarlo.
        if (k === 83 && !Platform.isTV) openSaver();
        if ((k === KEY.BLUE || k === KEY.INFO) && state.screen === 'home') openPanel();
    }

    function onKeyUp(e) {
        held[e.keyCode] = false;
        if (e.keyCode !== KEY.ENTER) return;
        e.preventDefault();
        clearTimeout(enterTimer);
        if (enterDown && !enterLong) select();
        enterDown = false;
        enterLong = false;
    }

    function move(dir) {
        var h = dir === 'l' || dir === 'r', delta = dir === 'r' || dir === 'd' ? 1 : -1;

        if (state.screen === 'home') {
            var step = h ? delta : delta * COLS;
            if (state.editing) {
                if (step === COLS && state.ai + COLS >= homeApps.length && state.ai < homeApps.length - 1) step = homeApps.length - 1 - state.ai;
                return moveInEdit(step, dir);
            }
            var n = gridItems.length, ai = state.ai;
            var next = ai + step;
            if (h && Math.floor(next / COLS) !== Math.floor(ai / COLS)) next = -1;
            // Bajar a una fila incompleta lleva al último elemento, como en tvOS.
            if (!h && next >= n && Math.floor(ai / COLS) < Math.floor((n - 1) / COLS)) next = n - 1;
            if (next < 0 || next >= n) return bump(gridTiles()[ai].querySelector('.t-tilt'), dir);
            state.ai = next;
            return focusGrid(dir);
        }

        if (state.screen === 'library') {
            var n = allApps.length, li = state.li;
            var next = h ? li + delta : li + delta * LIB_COLS;
            if (h && Math.floor(next / LIB_COLS) !== Math.floor(li / LIB_COLS)) next = -1;
            if (!h && next >= n && Math.floor(li / LIB_COLS) < Math.floor((n - 1) / LIB_COLS)) next = n - 1;
            if (next < 0 || next >= n) return bump($('lib-grid').children[li].querySelector('.t-tilt'), dir);
            state.li = next;
            return focusLibrary(dir);
        }

        if (state.screen === 'panel') {
            if (state.about) return; // en Acerca de no hay nada que mover
            if (h) return changeOpt(delta);
            var oi = state.oi + delta;
            if (oi < 0 || oi >= opts.length) return bump($('opts').children[state.oi], dir);
            state.oi = oi;
            focusOpt();
        }
    }

    function select() {
        if (state.screen === 'home') {
            if (state.editing) return exitEdit();
            var it = gridItems[state.ai];
            if (!it) return;
            if (it.type === 'library') return openLibrary();
            if (it.type === 'settings') return openPanel();
            if (it.type === 'saver') return openSaver();
            return launchItem(it, gridTiles()[state.ai]);
        }
        if (state.screen === 'library') {
            var a = allApps[state.li];
            if (a) launchItem(a, $('lib-grid').children[state.li]);
            return;
        }
        if (state.screen === 'panel' && !state.about) changeOpt(0);
    }

    function onLongPress() {
        if (state.screen === 'home' && state.editing) removeInEdit();
        else if (state.screen === 'home') enterEdit();
        else if (state.screen === 'library') togglePin();
    }

    function back() {
        if (state.screen === 'library') return closeLibrary();
        if (state.screen === 'panel') return state.about ? closeAbout() : closePanel();
        if (state.editing) return exitEdit();
        // Atrás en la cuadrícula vuelve arriba, como en tvOS.
        if (state.ai > 0) { state.ai = 0; return focusGrid('u'); }
        // En Inicio no hay a dónde volver: el botón Home del control lleva al Smart Hub.
    }

    // ---------------------------------------------------------------- Arranque

    function fit() {
        scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
        var x = (window.innerWidth - 1920 * scale) / 2, y = (window.innerHeight - 1080 * scale) / 2;
        stage.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
    }

    function loadApps() {
        return Platform.apps().then(function (list) {
            allApps = list.map(decorate).sort(function (a, b) { return a.label.localeCompare(b.label, 'es'); });
            computeHome();
        }).catch(function (err) {
            console.error(err);
            toast(I18N.t('toast.appsFail'));
        });
    }

    function loadInputs() {
        return Platform.hdmiSources().then(function (list) { hdmiList = list; }, function () { hdmiList = []; });
    }

    function init() {
        fit();
        window.addEventListener('resize', fit);
        document.querySelector('.grain').style.backgroundImage = 'url(' + Aurora.grain() + ')';
        makeGlass(document.querySelector('.clock'));
        makeGlass($('shelf'));
        startClock();
        Platform.registerKeys();
        document.addEventListener('keydown', onKey);
        document.addEventListener('keyup', onKeyUp);

        // Primer fondo pintado directo (sin fundido ni espera) para no arrancar en negro mientras
        // carga la primera foto del Top Shelf.
        var first = paletteFor({ hue: 222 });
        imgs.a = Aurora.get(first.key, first.colors);
        var layersA = document.querySelectorAll('.L.a');
        for (var i = 0; i < layersA.length; i++) {
            layersA[i].style.backgroundImage = 'url(' + (layersA[i].getAttribute('data-img') === 'glass' ? imgs.a.glass : imgs.a.sharp) + ')';
        }

        Promise.all([loadApps(), loadInputs()]).then(function () {
            renderGrid();
            scheduleBackground(gridItems[state.ai] || { hue: 222 }, true);
            // Primero las de Inicio (las que se recorren más), después la biblioteca y las entradas.
            setTimeout(function () { warmBackgrounds(gridItems.concat(firstFeatures(), allApps)); }, 1500);
            // Títulos reales de TMDB (o los guardados, si tienen menos de 12 horas).
            setTimeout(loadFeatured, 2500);
        });

        // Al volver de otra app: quitar el velo y refrescar por si se instaló algo.
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) return;
            hideVeil();
            lastInput = Date.now();
            loadApps().then(renderGrid);
        });
    }

    // Primero el idioma y el país del TV (definen los textos y el catálogo de TMDB), luego todo lo demás.
    function start() {
        Platform.locale().then(function (loc) {
            I18N.setSystem(loc);
            I18N.use(prefs.lang);
            // Releer lo guardado de TMDB ahora que se conocen el idioma y el país.
            if (window.TMDB) TMDB.prime();
            applyStaticTexts();
            applyTray();
            init();
        });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start);
    else start();
})();
