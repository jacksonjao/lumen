/*
 * Todo lo que toca al TV pasa por aquí. Fuera del TV (navegador) usa datos simulados,
 * así el diseño y la navegación se prueban igual sin instalar nada.
 */
(function () {
    'use strict';

    var isTV = typeof window.tizen !== 'undefined' && !!window.tizen.application;

    var MOCK_APPS = [
        ['org.tizen.netflix-app', 'Netflix'], ['9Ur5IzDKqV.TizenYouTube', 'YouTube'],
        ['org.tizen.primevideo', 'Prime Video'], ['MCmYXNxgcu.DisneyPlus', 'Disney+'],
        ['cj37Ni3qXM.HBONow', 'HBO Max'], ['com.samsung.tv.aria-video', 'Apple TV'],
        ['rJeHak5zRg.Spotify', 'Spotify - Música y podcasts'], ['3KA0pm7a7V.ParamountPlus', 'Paramount+'],
        ['gZ7Nr5ATBn.Crunchyroll', 'Crunchyroll'], ['kIciSQlYEM.plex', 'Plex'],
        ['org.tizen.browser', 'Internet'], ['3201710015037', 'Samsung TV Plus'],
        ['com.samsung.tv.gallery', 'Galería'], ['QBA3qXl8rv.Kick', 'Kick'],
        ['xqqJ00GGlE.IPTVSmartersPro', 'IPTV Smarters Pro'], ['MLu0nCwAWT.Vix', 'ViX'],
        ['3201608010191', 'Deezer'], ['org.tizen.apple.apple-music', 'Apple Music'],
        ['PvWgqxV3Xa.YouTubeTV', 'YouTube Kids'], ['vbUQClczfR.Wuakitv', 'Rakuten TV']
    ].map(function (a) { return { id: a[0], name: a[1], show: true, iconPath: '' }; });

    function withTimeout(promise, ms, what) {
        return new Promise(function (resolve, reject) {
            var t = setTimeout(function () { reject(new Error(what + ': el TV no respondió')); }, ms);
            promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
        });
    }

    function tizenCall(fn, what) {
        return withTimeout(new Promise(function (resolve, reject) {
            try { fn(resolve, reject); } catch (e) { reject(e); }
        }), 8000, what);
    }

    function selfId() {
        try { return tizen.application.getCurrentApplication().appInfo.id; } catch (e) { return null; }
    }

    // Ids de tienda ("AbCdEfGhIj.Nombre") o numéricos; algunas apps vienen preinstaladas con ids de sistema.
    var STORE_ID = /^[A-Za-z0-9]{10}\.[A-Za-z0-9_-]+$/;
    var NUMERIC_ID = /^\d{9,13}$/;
    var SYSTEM_OK = ['org.tizen.netflix-app', 'org.tizen.primevideo', 'org.tizen.browser',
        'org.tizen.apple.apple-music', 'com.samsung.tv.aria-video', 'com.samsung.tv.gallery'];
    var NOISE = /service|worker|preview|promotion|plugin|launcher|test|sdk|^ep[ -]|factory|daemon|dummy|agent|e-?manual|account|adplayer|privacy|security|widget|update|samsung ?promotion/i;

    function isConsumer(app) {
        if (SYSTEM_OK.indexOf(app.id) >= 0) return true;
        if (!app.show || !app.name) return false;
        if (!STORE_ID.test(app.id) && !NUMERIC_ID.test(app.id)) return false;
        // Solo el nombre: hay apps reales con ids "ruidosos" (Prime Video es AmazonIgnitionLauncher2).
        return !NOISE.test(app.name);
    }

    function cleanName(name) {
        return (name.split(/\s+[-:|–]\s+/)[0] || name).trim();
    }

    function apps() {
        var p = isTV
            ? tizenCall(function (ok, err) { tizen.application.getAppsInfo(ok, err); }, 'Lista de apps')
            : Promise.resolve(MOCK_APPS);
        var me = selfId();
        return p.then(function (list) {
            // El TV puede traer la misma app dos veces (Netflix preinstalada y la de la tienda).
            // Se muestra una sola; las demás quedan como alternativas por si la elegida no abre.
            var byName = {}, out = [];
            Array.prototype.slice.call(list).forEach(function (a) {
                if (a.id === me || !isConsumer(a)) return;
                var name = cleanName(a.name), key = name.toLowerCase();
                var prev = byName[key];
                if (!prev) {
                    prev = byName[key] = { id: a.id, name: name, iconPath: a.iconPath || '', alt: [] };
                    out.push(prev);
                } else if (prev.id !== a.id && prev.alt.indexOf(a.id) < 0) {
                    // La preinstalada del sistema tiene prioridad.
                    if (SYSTEM_OK.indexOf(a.id) >= 0) { prev.alt.push(prev.id); prev.id = a.id; }
                    else prev.alt.push(a.id);
                }
            });
            return out;
        });
    }

    // Abre la app; si falla, prueba con sus alternativas (otras instalaciones de la misma app).
    function launchAny(ids) {
        return ids.slice(1).reduce(function (p, id) {
            return p.catch(function () { return launch(id); });
        }, launch(ids[0]));
    }

    function launch(id) {
        if (!isTV) {
            console.log('[mock] launch', id);
            return new Promise(function (r) { setTimeout(r, 400); });
        }
        return tizenCall(function (ok, err) { tizen.application.launch(id, ok, err); }, 'Abrir app');
    }

    // [{ number: 1, connected: true }, ...] solo HDMI
    function hdmiSources() {
        if (!isTV) {
            return Promise.resolve([{ number: 1, connected: true }, { number: 2, connected: true }, { number: 3, connected: false }]);
        }
        return tizenCall(function (ok, err) {
            tizen.systeminfo.getPropertyValue('VIDEOSOURCE', ok, err);
        }, 'Entradas').then(function (info) {
            var out = [];
            (info.connected || []).forEach(function (s) { if (s.type === 'HDMI') out.push({ number: s.number, connected: true, raw: s }); });
            (info.disconnected || []).forEach(function (s) { if (s.type === 'HDMI') out.push({ number: s.number, connected: false, raw: s }); });
            return out.sort(function (a, b) { return a.number - b.number; });
        });
    }

    function openHdmi(n) {
        if (!isTV) {
            console.log('[mock] HDMI', n);
            return new Promise(function (r) { setTimeout(r, 400); });
        }
        return hdmiSources().then(function (list) {
            var src = list.filter(function (s) { return s.number === n; })[0];
            if (!src) throw new Error('El TV no reporta HDMI ' + n);
            return tizenCall(function (ok, err) { tizen.tvwindow.setSource(src.raw, ok, err, 'MAIN'); }, 'Cambiar entrada');
        }).then(function () {
            // Abre el visor de TV con la fuente nueva; si no existe en este firmware, nos ocultamos.
            return launch('org.tizen.tv-viewer').catch(function () { hide(); });
        });
    }

    function hide() {
        try { tizen.application.getCurrentApplication().hide(); } catch (e) { /* navegador */ }
    }

    function registerKeys() {
        if (!isTV || !tizen.tvinputdevice) return;
        ['ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue', 'Info'].forEach(function (k) {
            try { tizen.tvinputdevice.registerKey(k); } catch (e) { /* tecla no disponible */ }
        });
    }

    // Idioma y país configurados en el TV ({ language: 'es_CO', country: 'CO' }). En el navegador,
    // los del sistema. Si el TV no responde a tiempo, se sigue con lo del navegador.
    function locale() {
        var fallback = { language: navigator.language || 'es-CO', country: null };
        if (!isTV || !tizen.systeminfo) return Promise.resolve(fallback);
        return withTimeout(new Promise(function (resolve, reject) {
            try {
                tizen.systeminfo.getPropertyValue('LOCALE', function (l) {
                    resolve({ language: l.language, country: serviceCountry() });
                }, reject);
            } catch (e) { reject(e); }
        }), 1500, 'Idioma').catch(function () { return fallback; });
    }

    // País de servicio del Smart Hub (donde está registrado el TV), p. ej. "CO". Es el dato fiable:
    // el "country" de LOCALE es un formato regional ("en_US") y el del idioma puede ser de otro país.
    function serviceCountry() {
        try {
            var pi = webapis.productinfo;
            var c = String(pi.getSystemConfig(pi.ProductInfoConfigKey.CONFIG_KEY_SERVICE_COUNTRY) || '').toUpperCase();
            return /^[A-Z]{2}$/.test(c) ? c : null;
        } catch (e) {
            return null;
        }
    }

    function deviceInfo() {
        var info = { model: 'Vista previa', firmware: navigator.userAgent.match(/Chrome\/[\d.]+/) ? navigator.userAgent.match(/Chrome\/[\d.]+/)[0] : '' };
        if (!isTV) return info;
        try { info.model = webapis.productinfo.getRealModel() || webapis.productinfo.getModel(); } catch (e) { info.model = 'Samsung TV'; }
        try { info.firmware = webapis.productinfo.getFirmware(); } catch (e) { /* sin webapis */ }
        return info;
    }

    window.Platform = {
        isTV: isTV,
        apps: apps,
        launch: launch,
        launchAny: launchAny,
        hdmiSources: hdmiSources,
        openHdmi: openHdmi,
        hide: hide,
        registerKeys: registerKeys,
        deviceInfo: deviceInfo,
        locale: locale
    };
})();
