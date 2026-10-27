/*
 * Títulos populares por plataforma desde TMDB, para el Top Shelf y el protector de pantalla.
 *
 * Solo pide datos una vez cada 12 horas y los guarda en el TV: al navegar no se hace ninguna
 * consulta. Sin clave o sin datos guardados, el área de arriba usa el diseño clásico.
 *
 * La clave va en js/config.local.js (fuera de git):  window.GLASS_LOCAL = { tmdbKey: '...' };
 * Sirve la "API Key" (v3) o el "API Read Access Token" (v4) de themoviedb.org → Ajustes → API.
 */
window.TMDB = (function () {
    'use strict';

    var API = 'https://api.themoviedb.org/3';
    var IMG = 'https://image.tmdb.org/t/p/w1280';
    var CACHE_KEY = 'glass.tmdb.v8';
    var MAX_AGE = 12 * 3600 * 1000;
    // Cada consulta trae 20; se guardan hasta 20 por plataforma (series y películas intercaladas)
    // para aprovechar lo que ya llega sin hacer más llamadas.
    var PER_BRAND = 20;

    // Ids de proveedor de TMDB. Varios separados por | se combinan (O lógico).
    var PROVIDERS = {
        netflix: '8',
        disneyplus: '337',
        primevideo: '119|9',
        max: '1899|384',
        appletv: '350',
        paramountplus: '531',
        crunchyroll: '283'
    };

    var status = { source: 'ninguno', updated: 0, error: null };

    // Géneros de series que TMDB no traduce al español.
    var GENRE_ES = {
        'Action & Adventure': 'Acción y aventura', 'Sci-Fi & Fantasy': 'Ciencia ficción y fantasía',
        'War & Politics': 'Guerra y política', 'Kids': 'Infantil', 'News': 'Noticias',
        'Soap': 'Telenovela', 'Talk': 'Entrevistas'
    };

    function isoDaysAgo(days) {
        return new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    }

    // País: el del TV (define qué hay en cada plataforma). Idioma: el elegido en Lumen.
    // config.js solo da valores de respaldo si el TV no los reporta.
    function settings() {
        var local = window.GLASS_LOCAL || {};
        var cfg = window.GLASS_CONFIG.tmdb || {};
        var i18n = window.I18N;
        var region = (i18n && i18n.country()) || cfg.region || 'CO';
        // En el idioma del TV se usa la variante del país (es-CO, pt-BR…); en otro idioma, la estándar.
        var language = !i18n ? (cfg.language || 'es-CO')
            : i18n.lang() === i18n.systemLang() ? i18n.lang() + '-' + region : i18n.tmdbLanguage();
        return { key: local.tmdbKey || cfg.key || '', region: region, language: language };
    }

    function request(path, params, key) {
        var v4 = key.length > 40; // el token v4 es un JWT largo; la clave v3 tiene 32 caracteres
        var q = Object.keys(params).map(function (k) { return k + '=' + encodeURIComponent(params[k]); });
        if (!v4) q.push('api_key=' + key);
        var opts = v4 ? { headers: { Authorization: 'Bearer ' + key } } : {};
        status.calls = (status.calls || 0) + 1;
        return fetch(API + path + '?' + q.join('&'), opts).then(function (r) {
            if (r.status === 401) throw new Error('badkey');
            if (!r.ok) throw new Error('down');
            return r.json();
        });
    }


    function toItem(r, kind, genres) {
        var date = r.first_air_date || r.release_date || '';
        var genre = (r.genre_ids || []).map(function (id) { return genres[id]; }).filter(Boolean)[0];
        return {
            title: r.name || r.title,
            meta: window.I18N.t(kind === 'tv' ? 'kind.tv' : 'kind.movie') + (genre ? ' · ' + genre : '') + (date ? ' · ' + date.slice(0, 4) : ''),
            // Completa: Inicio la corta en 4 líneas y el protector la muestra entera.
            blurb: r.overview,
            img: IMG + r.backdrop_path,
            popularity: r.popularity
        };
    }

    function genreMap(s) {
        return Promise.all(['tv', 'movie'].map(function (kind) {
            return request('/genre/' + kind + '/list', { language: s.language }, s.key);
        })).then(function (lists) {
            var map = {};
            var es = s.language.indexOf('es') === 0;
            lists.forEach(function (l) { (l.genres || []).forEach(function (g) { map[g.id] = (es && GENRE_ES[g.name]) || g.name; }); });
            return map;
        });
    }

    // Series y películas más populares de una plataforma en la región, intercaladas.
    function brand(key, provider, s, genres) {
        var params = {
            language: s.language,
            watch_region: s.region,
            with_watch_providers: provider,
            with_watch_monetization_types: 'flatrate',
            sort_by: 'popularity.desc',
            'vote_count.gte': 20
        };
        // Lo nuevo primero, como Apple TV: series estrenadas en los últimos 4 años y películas de los
        // últimos 2. Si así no hay suficiente, se usa la lista sin filtrar.
        var recent = { tv: { 'first_air_date.gte': isoDaysAgo(4 * 365) }, movie: { 'primary_release_date.gte': isoDaysAgo(730) } };
        function fetchKind(kind, extra) {
            var p = {};
            Object.keys(params).forEach(function (k) { p[k] = params[k]; });
            Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
            return request('/discover/' + kind, p, s.key).then(function (res) {
                return (res.results || []).filter(function (r) { return r.backdrop_path && r.overview; })
                    .map(function (r) { return toItem(r, kind, genres); });
            });
        }
        return Promise.all(['tv', 'movie'].map(function (kind) {
            return fetchKind(kind, recent[kind]).then(function (list) {
                return list.length >= 2 ? list : fetchKind(kind, {});
            });
        })).then(function (both) {
            var out = [], tv = both[0], movies = both[1];
            for (var i = 0; out.length < PER_BRAND && (i < tv.length || i < movies.length); i++) {
                if (tv[i]) out.push(tv[i]);
                if (movies[i] && out.length < PER_BRAND) out.push(movies[i]);
            }
            return out;
        });
    }

    // Caché por plataforma, cada una con su fecha: solo se consulta lo que falta o venció.
    // Lo guardado vale para un idioma y un país: si cambian, se empieza de cero.
    function readCache(s) {
        var empty = { lang: s.language, region: s.region, genres: null, brands: {} };
        try {
            var c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            return c && c.brands && c.lang === s.language && c.region === s.region ? c : empty;
        } catch (e) {
            return empty;
        }
    }

    function writeCache(c) {
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* lleno */ }
    }

    // Solo las plataformas pedidas (las de la primera fila). Sin datos reales, una plataforma usa
    // el área clásica.
    function apply(cache, keys) {
        var out = {}, oldest = 0;
        keys.forEach(function (k) {
            var b = cache.brands[k];
            if (!b || !b.list.length) return;
            out[k] = b.list;
            oldest = oldest ? Math.min(oldest, b.ts) : b.ts;
        });
        if (Object.keys(out).length) {
            window.FEATURED = out;
            status.source = 'tmdb';
            status.updated = oldest;
        }
    }

    function genresFor(s, cache) {
        var g = cache.genres;
        if (g && Date.now() - g.ts < 7 * 24 * 3600 * 1000) return Promise.resolve(g.map); // casi nunca cambian
        return genreMap(s).then(function (map) {
            cache.genres = { ts: Date.now(), map: map };
            return map;
        });
    }

    var inflight = null;

    // Al arrancar: aplicar de inmediato lo guardado (todas las marcas), antes de saber la primera fila.
    // Así al refrescar se ve enseguida el último Top Shelf, sin esperar ni mostrar otra cosa.
    function prime() {
        window.FEATURED = {};
        status.source = 'ninguno';
        var cache = readCache(settings());
        apply(cache, Object.keys(cache.brands));
    }

    // keys: claves de marca de las apps de la primera fila. Resuelve true si llegaron datos nuevos.
    function load(keys) {
        if (inflight) return inflight.then(function () { return load(keys); });
        var s = settings();
        var cache = readCache(s);
        if (!Object.keys(cache.brands).length) window.FEATURED = {};
        keys = (keys || []).filter(function (k, i, all) { return PROVIDERS[k] && all.indexOf(k) === i; });
        apply(cache, keys);
        if (!s.key) return Promise.resolve(false);

        var stale = keys.filter(function (k) {
            var b = cache.brands[k];
            return !b || Date.now() - b.ts > MAX_AGE;
        });
        if (!stale.length) return Promise.resolve(false);

        status.calls = 0;
        inflight = genresFor(s, cache).then(function (genres) {
            // Una plataforma a la vez: el TV es lento y no hay prisa.
            return stale.reduce(function (p, key) {
                return p.then(function () {
                    return brand(key, PROVIDERS[key], s, genres).then(function (list) {
                        cache.brands[key] = { ts: Date.now(), list: list };
                    }, function () { /* se reintenta en la próxima carga */ });
                });
            }, Promise.resolve());
        }).then(function () {
            writeCache(cache);
            apply(cache, keys);
            status.error = null;
            return true;
        }).catch(function (err) {
            status.error = err.message;
            console.error(err);
            return false;
        }).then(function (fresh) {
            inflight = null;
            return fresh;
        });
        return inflight;
    }

    function describe() {
        var t = window.I18N.t;
        if (!settings().key) return t('tmdb.nokey');
        if (status.source !== 'tmdb') {
            if (!status.error) return t('tmdb.loading');
            return t(status.error === 'badkey' ? 'tmdb.badkey' : 'tmdb.down');
        }
        var h = Math.round((Date.now() - status.updated) / 3600000);
        return t('tmdb.ok', { when: h < 1 ? t('tmdb.lt1') : t('tmdb.h', { n: h }) });
    }

    // Consultas hechas en la última actualización (para revisar el consumo desde el depurador).
    function lastCalls() { return status.calls || 0; }

    prime();

    // País y variante de idioma que se están usando (para Acerca de).
    function region() { return settings().region; }

    return { load: load, prime: prime, describe: describe, lastCalls: lastCalls, region: region };
})();
