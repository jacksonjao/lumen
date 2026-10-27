/*
 * Fondos tipo aurora generados en un canvas diminuto. Se pintan una sola vez por paleta:
 *   sharp  320x180, el navegador lo escala a 1920x1080 y queda suave por naturaleza
 *   glass  la misma imagen muy desenfocada, para simular vidrio sin backdrop-filter
 *          (Chromium 56 del TV no lo soporta)
 */
window.Aurora = (function () {
    'use strict';

    var W = 320, H = 180;
    var cache = {};

    function rgba(hex, a) {
        var n = parseInt(hex.slice(1), 16);
        return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
    }

    function canvas(w, h) {
        var c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        return c;
    }

    // [x, y, radio, color, alfa] en proporciones del lienzo. Brillo arriba a la derecha (zona del arte),
    // la parte baja más oscura para que las filas de apps se lean bien.
    function blobs(p) {
        var base = p[0], main = p[1], accent = p[2], deep = p[3];
        return [
            [0.05, 0.05, 0.55, deep, 0.9],
            [0.78, 0.18, 0.62, main, 0.95],
            [0.92, 0.02, 0.32, accent, 0.75],
            [0.48, 0.55, 0.42, main, 0.35],
            [0.15, 0.95, 0.55, deep, 0.7],
            [0.95, 0.95, 0.45, deep, 0.6],
            [0.5, 1.15, 0.6, base, 0.9]
        ];
    }

    function paint(palette) {
        var c = canvas(W, H);
        var x = c.getContext('2d');
        x.fillStyle = palette[0];
        x.fillRect(0, 0, W, H);
        blobs(palette).forEach(function (b) {
            var cx = b[0] * W, cy = b[1] * H, r = b[2] * W;
            var g = x.createRadialGradient(cx, cy, 0, cx, cy, r);
            g.addColorStop(0, rgba(b[3], b[4]));
            g.addColorStop(0.55, rgba(b[3], b[4] * 0.45));
            g.addColorStop(1, rgba(b[3], 0));
            x.fillStyle = g;
            x.fillRect(0, 0, W, H);
        });
        return c;
    }

    // photo: las fotos tienen mucho más detalle y contraste que una aurora; con más desenfoque y menos
    // saturación el vidrio se ve igual de suave que sobre un fondo plano.
    function blur(src, photo) {
        var c = canvas(160, 90);
        var x = c.getContext('2d');
        if ('filter' in x) {
            // El vidrio real aclara y satura lo que tiene detrás; se hornea aquí para no pagar filtros en vivo.
            x.filter = photo ? 'blur(11px) saturate(1.05) brightness(1.06)' : 'blur(7px) saturate(1.25) brightness(1.12)';
            // Dibujar más grande que el lienzo: el desenfoque oscurece los bordes (mezcla con transparente)
            // y ese borde quedaría como un marco dentro de la bandeja, que está cerca del borde inferior.
            var m = photo ? 26 : 16;
            x.drawImage(src, -m, -m * 0.5625, 160 + 2 * m, 90 + 2 * m * 0.5625);
            return c;
        }
        // Sin ctx.filter: reducir y volver a ampliar ya desenfoca bastante.
        var tiny = canvas(24, 14);
        tiny.getContext('2d').drawImage(src, 0, 0, 24, 14);
        x.imageSmoothingEnabled = true;
        x.drawImage(tiny, 0, 0, 160, 90);
        return c;
    }

    function get(key, palette) {
        if (cache[key]) return cache[key];
        var sharp = paint(palette);
        cache[key] = {
            sharp: sharp.toDataURL('image/jpeg', 0.92),
            glass: blur(sharp).toDataURL('image/jpeg', 0.9)
        };
        return cache[key];
    }

    // Brillo promedio (0 = negro, 1 = blanco) de un rectángulo del lienzo, en proporciones.
    function brightness(c, x0, y0, x1, y1) {
        try {
            var x = c.getContext('2d');
            var px = x.getImageData(Math.round(x0 * W), Math.round(y0 * H), Math.round((x1 - x0) * W), Math.round((y1 - y0) * H)).data;
            var sum = 0, n = 0;
            for (var i = 0; i < px.length; i += 16) { // uno de cada 4 píxeles basta
                sum += 0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2];
                n++;
            }
            return n ? sum / n / 255 : 0;
        } catch (e) {
            return 0; // sin permiso para leer la imagen: se trata como oscura
        }
    }

    // Brillo de las zonas donde va texto encima de la foto, para oscurecer solo lo necesario.
    function zones(c) {
        return {
            home: brightness(c, 0.04, 0.26, 0.56, 0.66),   // texto del área de arriba en Inicio
            info: brightness(c, 0.04, 0.40, 0.66, 0.92),   // descripción del protector
            clock: brightness(c, 0.72, 0.05, 0.97, 0.26)   // hora del protector
        };
    }

    // Fondo a partir de una foto (Top Shelf): la foto tal cual y su versión de vidrio desenfocada.
    var pending = {};
    function fromImage(key, url) {
        if (cache[key]) return Promise.resolve(cache[key]);
        if (pending[key]) return pending[key];
        pending[key] = new Promise(function (resolve) {
            var img = new Image();
            // Las fotos de TMDB vienen de otro dominio: sin esto el canvas no podría leerlas.
            if (/^https?:/.test(url)) img.crossOrigin = 'anonymous';
            img.onload = function () {
                var c = canvas(W, H);
                c.getContext('2d').drawImage(img, 0, 0, W, H);
                cache[key] = { sharp: url, glass: blur(c, true).toDataURL('image/jpeg', 0.9), lum: zones(c) };
                resolve(cache[key]);
            };
            img.onerror = function () { resolve(null); };
            img.src = url;
        });
        return pending[key];
    }

    // Grano fino para que el degradado ampliado no muestre bandas.
    function grain() {
        var c = canvas(160, 160);
        var x = c.getContext('2d');
        var img = x.createImageData(160, 160);
        for (var i = 0; i < img.data.length; i += 4) {
            var v = Math.random() * 255 | 0;
            img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
            img.data[i + 3] = 22;
        }
        x.putImageData(img, 0, 0);
        return c.toDataURL('image/png');
    }

    // Las imágenes data: se decodifican de forma asíncrona; esperamos antes del fundido.
    function ready(urls) {
        return Promise.all(urls.map(function (u) {
            return new Promise(function (resolve) {
                var i = new Image();
                if (/^https?:/.test(u)) i.crossOrigin = 'anonymous'; // misma petición que fromImage (caché compartida)
                i.onload = i.onerror = function () { resolve(); };
                i.src = u;
            });
        }));
    }

    return { get: get, fromImage: fromImage, grain: grain, ready: ready };
})();
