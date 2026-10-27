/*
 * Apariencia por marca. `match` se compara con el nombre de cada app instalada.
 *   cat     categoría (texto pequeño del área clásica), traducida en js/i18n.js ('cat.*')
 *   eyebrow texto fijo en lugar de la categoría (nombres propios, no se traducen)
 *   La frase de cada marca está en js/i18n.js ('b.<clave>').
 *   tile    degradado del ícono [arriba, abajo]
 *   mark    color del logo
 *   aurora  paleta del fondo [base, principal, acento, profundo]
 */
window.BRANDS = [
    { key: 'netflix', label: 'Netflix', match: /netflix/i, tile: ['#1c1c1f', '#050505'], mark: '#E50914',
        aurora: ['#0b0204', '#c3111b', '#ff5a5f', '#3a0a10'], cat: 'seriesMovies' },
    { key: 'youtube', label: 'YouTube', match: /youtube(?!.*kids)/i, tile: ['#ffffff', '#e8e8ed'], mark: '#FF0033',
        aurora: ['#0d0406', '#b5121b', '#ff6b6b', '#2f0b1c'], cat: 'videos' },
    { key: 'primevideo', label: 'Prime Video', match: /prime ?video|amazon/i, tile: ['#1d3b5c', '#0a1626'], mark: '#ffffff',
        aurora: ['#02101c', '#0f63b8', '#3fb4ff', '#06203f'], cat: 'seriesMovies' },
    { key: 'disneyplus', label: 'Disney+', match: /disney/i, tile: ['#1f4396', '#0a1a4a'], mark: '#ffffff',
        aurora: ['#030a24', '#1a3fa8', '#4dc3ff', '#1a0f5c'], eyebrow: 'Disney · Pixar · Marvel · Star Wars' },
    { key: 'max', label: 'Max', match: /hbo|^max\b|\bmax$/i, tile: ['#0a3cff', '#00168f'], mark: '#ffffff', word: 'max',
        aurora: ['#00041a', '#0030f0', '#6a8bff', '#16005e'], cat: 'hboMore' },
    { key: 'appletv', label: 'Apple TV', match: /apple ?tv|aria-video/i, tile: ['#2c2c31', '#0b0b0d'], mark: '#ffffff',
        aurora: ['#050507', '#3a3f52', '#8a93b8', '#1a1d2e'], eyebrow: 'Apple Originals' },
    { key: 'applemusic', label: 'Apple Music', match: /apple ?music/i, tile: ['#ff5a76', '#f5203e'], mark: '#ffffff',
        aurora: ['#160208', '#c0142f', '#ff7a93', '#4a0a3a'], cat: 'music' },
    { key: 'spotify', label: 'Spotify', match: /spotify/i, tile: ['#1f1f1f', '#0a0a0a'], mark: '#1ED760',
        aurora: ['#020a05', '#0f7a37', '#1ED760', '#0a2a24'], cat: 'musicPodcasts' },
    { key: 'paramountplus', label: 'Paramount+', match: /paramount/i, tile: ['#0b66ff', '#0033a0'], mark: '#ffffff',
        aurora: ['#000c26', '#0050d6', '#5c9dff', '#001a55'], cat: 'seriesMovies' },
    { key: 'crunchyroll', label: 'Crunchyroll', match: /crunchyroll/i, tile: ['#ff8a3d', '#f06414'], mark: '#ffffff',
        aurora: ['#160800', '#c4520f', '#ffa15c', '#3a1600'], cat: 'anime' },
    { key: 'plex', label: 'Plex', match: /plex/i, tile: ['#2b2d31', '#121314'], mark: '#EBAF00',
        aurora: ['#0d0a00', '#8a6400', '#f2c230', '#2a2000'], cat: 'library' },
    { key: 'twitch', label: 'Twitch', match: /twitch/i, tile: ['#a970ff', '#772ce8'], mark: '#ffffff',
        aurora: ['#0d0420', '#5b1fd1', '#b58cff', '#1d0a4a'], cat: 'live' },
    { key: 'dazn', label: 'DAZN', match: /dazn/i, tile: ['#1d1d1f', '#000000'], mark: '#F8FC00',
        aurora: ['#050500', '#5c5e00', '#e8ec2a', '#1a1a00'], cat: 'sports' },
    { key: 'tubi', label: 'Tubi', match: /tubi/i, tile: ['#7b2bff', '#4a00b0'], mark: '#FFF200',
        aurora: ['#0b0220', '#5a18d6', '#c49bff', '#22054f'], cat: 'free' },
    { key: 'kick', label: 'Kick', match: /\bkick\b/i, tile: ['#141716', '#000000'], mark: '#53FC18',
        aurora: ['#010a02', '#1f8a0a', '#6dff3a', '#062a10'], cat: 'live' },
    { key: 'vimeo', label: 'Vimeo', match: /vimeo/i, tile: ['#1ab7ea', '#0d86b3'], mark: '#ffffff',
        aurora: ['#011420', '#0b7fb0', '#5fd4ff', '#06304a'], cat: 'videos' },
    { key: 'movistar', label: 'Movistar TV', match: /movistar/i, tile: ['#1fb1ff', '#0b6fb3'], mark: '#ffffff',
        aurora: ['#011420', '#0b72c4', '#5fc4ff', '#06304a'], cat: 'tv' },

    // Consolas y dispositivos para las entradas HDMI
    { key: 'playstation', label: 'PlayStation', input: true, tile: ['#1f5fd1', '#00308f'], mark: '#ffffff',
        aurora: ['#010820', '#0b47b8', '#5c95ff', '#06123f'], cat: 'console' },
    { key: 'xbox', label: 'Xbox', input: true, tile: ['#1a9e1a', '#0b5c0b'], mark: '#ffffff',
        aurora: ['#010d02', '#0f7a10', '#5fe05f', '#06300a'], cat: 'console' },
    { key: 'nintendoswitch', label: 'Nintendo Switch', input: true, tile: ['#ff2a3a', '#c4000f'], mark: '#ffffff',
        aurora: ['#140103', '#b80012', '#ff6b78', '#3a0510'], cat: 'console' }
];

// Fondos fijos que se pueden elegir en Ajustes ("Dinámico" usa la paleta de la app enfocada).
window.WALLPAPERS = [
    { key: 'dynamic', label: 'Dinámico' },
    { key: 'aurora', label: 'Aurora', aurora: ['#020814', '#1b6f8a', '#7af0c8', '#2a1660'] },
    { key: 'sunset', label: 'Atardecer', aurora: ['#12040c', '#d2462e', '#ffb35c', '#4a0f4a'] },
    { key: 'ocean', label: 'Océano', aurora: ['#010a18', '#0d4fa8', '#45c6ff', '#062a5c'] },
    { key: 'lilac', label: 'Lila', aurora: ['#0a0614', '#6a3ad1', '#f09bd8', '#1f1050'] },
    { key: 'graphite', label: 'Grafito', aurora: ['#060607', '#3a3c44', '#9aa0b4', '#16171c'] }
];

// Paleta neutra para apps sin marca conocida y para los atajos del dock.
window.NEUTRAL = { tile: ['#3a3d47', '#1c1d22'], aurora: ['#05060c', '#2d4a8a', '#8fb4ff', '#2a1a5c'] };

window.brandByKey = function (key) {
    for (var i = 0; i < window.BRANDS.length; i++) if (window.BRANDS[i].key === key) return window.BRANDS[i];
    return null;
};

window.brandForApp = function (app) {
    // Solo el nombre: los ids internos engañan (YouTube Kids tiene "YouTubeTV" en el suyo).
    for (var i = 0; i < window.BRANDS.length; i++) {
        var b = window.BRANDS[i];
        if (b.match && b.match.test(app.name)) return b;
    }
    return null;
};
