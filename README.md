<a id="lumen"></a>
<h1 align="center">Lumen</h1>

<p align="center">
  <b>Una pantalla de inicio limpia y fluida para televisores Samsung Tizen, inspirada en Apple TV.</b><br>
  <b>A clean, smooth home screen for Samsung Tizen TVs, inspired by Apple TV.</b>
</p>

<p align="center">
  <a href="#espanol"><b>🇪🇸 Leer en español</b></a>
  &nbsp;&nbsp;·&nbsp;&nbsp;
  <a href="#english"><b>🇬🇧 Read in English</b></a>
</p>

![Lumen](docs/screenshots/home.jpg)

| | |
|---|---|
| ![Top Shelf](docs/screenshots/home-2.jpg) | ![Grid](docs/screenshots/grid.jpg) |
| ![Screen saver](docs/screenshots/screensaver.jpg) | ![Settings](docs/screenshots/settings.jpg) |
| ![All apps](docs/screenshots/library.jpg) | ![Edit mode](docs/screenshots/edit.jpg) |

---

<a id="espanol"></a>

## 🇪🇸 Español

Lumen es un **launcher**: una app que muestra tus apps instaladas en una cuadrícula sencilla, con
imágenes grandes de películas y series arriba, la hora y un protector de pantalla. Sin anuncios ni
filas de la tienda. Está hecho para **televisores Samsung viejos** que se sienten lentos o llenos
de cosas, y funciona bien con su navegador antiguo.

📖 Cómo lo hice: [Cómo limpié mi televisor Samsung y lo volví a sentir moderno](https://medium.com/@jhonosorio/c%C3%B3mo-limpi%C3%A9-mi-televisor-samsung-y-lo-volv%C3%AD-a-sentir-moderno-8d1bd5a9f928)

### Qué hace

- **Cuadrícula como tvOS**: 6 apps por fila. La app enfocada crece y se inclina en 3D.
- **Top Shelf**: al enfocar una app de la primera fila (Netflix, Disney+, Prime Video, Max, Apple TV,
  Paramount+, Crunchyroll), arriba aparecen sus títulos populares con un fundido suave.
  Esto es **opcional** y usa [TMDB](https://www.themoviedb.org) (ver abajo).
- **Efecto vidrio**: el navegador del TV no tiene `backdrop-filter`, así que Lumen hace el
  desenfoque una sola vez en un canvas pequeño. Parece vidrio y no cuesta nada al navegar.
- **Tu orden**: mantén **OK** sobre una app para moverla con las flechas u ocultarla.
- **Entradas HDMI** con nombre y logo (PlayStation, Xbox, Switch…).
- **Protector de pantalla** con imágenes, la descripción completa y un reloj grande.
- **9 idiomas**: español, inglés, portugués, francés, alemán, italiano, japonés, coreano y chino.
  Por defecto usa el idioma del TV. El país también sale del TV.
- **Ajustes**: idioma, fondo, área de arriba (imágenes o clásica), bandeja de apps (vidrio,
  translúcida, sólida o sin bandeja), velocidad de las imágenes, reloj de 12/24 h, tiempo y opacidad
  del protector, apps ocultas.

Control remoto: **Verde** abre todas las apps, **Azul** o **Info** abre Ajustes, **Atrás** cierra.

### ¿En qué televisores funciona?

| Televisor | Estado |
|---|---|
| Samsung 2018 (Tizen 4.0), por ejemplo UN43NU7100 | ✅ Probado todos los días |
| Samsung 2017–2020 (Tizen 3.0 – 5.5) | 👍 Debería funcionar: el código está hecho para el viejo Chromium 56 |
| Samsung 2016 (Tizen 2.4) | 🤷 Sin probar |
| Samsung 2021 en adelante (Tizen 6+) | ⚠️ Probablemente funciona, pero puede pedir un certificado de Samsung (ver [Problemas](#problemas)) |

Lumen **no** reemplaza el inicio de Samsung (Smart Hub), porque Samsung no lo permite. Es una app
que abres y puedes dejar abierta. El botón Home del control sigue abriendo Smart Hub.

### 🤖 Instalar con Claude Code o Codex (la forma fácil)

Puedes pasarle este repositorio a un asistente de programación con IA, como
[Claude Code](https://claude.com/claude-code) o [Codex](https://openai.com/codex), y él hace todo
por ti: revisa Docker, empaqueta, instala y te explica cualquier error.

1. Activa el **Modo Desarrollador** en el TV (paso 1 de abajo). Esto solo lo puedes hacer tú, con el control.
2. Abre el asistente en una carpeta vacía y escríbele:

   ```
   Clona https://github.com/jacksonjao/lumen e instálalo en mi TV Samsung.
   La IP del TV es 192.168.1.50. Sigue el README y el archivo AGENTS.md.
   ```

3. Si quieres las imágenes de películas, dile también que te ayude a poner tu clave de TMDB.

También le puedes pedir cambios: otros colores, nuevos logos, otro orden de apps, otro idioma por defecto…

### Instalar a mano

Necesitas un computador (Mac, Linux o Windows) en la misma red del TV y
[Docker](https://www.docker.com/products/docker-desktop/) (en Mac también sirve [OrbStack](https://orbstack.dev)).
**No** necesitas Tizen Studio: el script usa las herramientas de Tizen dentro de Docker.

#### 1. Activa el Modo Desarrollador en el TV (una sola vez)

1. Busca la IP de tu computador (por ejemplo `192.168.1.20`).
2. En el TV abre **Apps**. Con el control, marca `1 2 3 4 5`.
3. Activa **Developer mode** y escribe la IP de tu computador en **Host PC IP**.
4. Reinicia el TV: mantén presionado el botón de encendido hasta que aparezca el logo de Samsung.

La IP del TV está en **Configuración > General > Red > Estado de la red > Configuración de IP**.

#### 2. Instala Lumen

```bash
git clone https://github.com/jacksonjao/lumen.git
cd lumen
sh scripts/install.sh 192.168.1.50
```

Cambia `192.168.1.50` por la IP de tu TV. El script empaqueta la app, la firma, la instala y la
abre. Lumen aparece en las apps del TV. Para actualizarla después, ejecuta el mismo comando.

En Windows, ejecuta el comando en **Git Bash** o **WSL**, con Docker Desktop abierto.

#### 3. Opcional: imágenes de películas y series (TMDB)

Lumen funciona sin esto. Sin clave, el área de arriba muestra la tarjeta de la app (modo clásico).
Con clave, muestra los títulos populares de cada app en tu país.

1. Crea una cuenta gratis en [themoviedb.org](https://www.themoviedb.org/signup).
2. Ve a **Settings > API** y pide una clave (uso personal). Copia la **API Key**.
3. Instala con la clave:

   ```bash
   TMDB_KEY=tu_clave sh scripts/install.sh 192.168.1.50
   ```

La clave se guarda en `src/js/config.local.js`. Ese archivo está en `.gitignore`, así que nunca se
sube a git. La próxima vez puedes instalar sin `TMDB_KEY`.

Sobre los datos: Lumen pide títulos nuevos solo cada 12 horas (unas 12 consultas pequeñas) y los
guarda en el TV. Navegar no usa internet.

### Probarlo en tu computador

Necesitas [Node.js](https://nodejs.org) 18 o más nuevo. No hace falta `npm install`.

```bash
node scripts/serve.mjs
```

Abre http://localhost:8080 y usa las flechas, **Enter** y **Esc**. Fuera del TV, Lumen usa apps de
ejemplo. La tecla **S** abre el protector de pantalla.

### Personalizar

- `src/js/config.js`: el orden inicial de las apps y el tiempo del protector.
- `src/js/brands.js`: colores, logos y textos de cada app. Para agregar un logo, pon el SVG en
  `src/img/marks/` y ejecuta `node scripts/build-marks.mjs`.
- `src/js/i18n.js`: todos los textos en los 9 idiomas.
- `src/css/app.css`: todo el diseño.

<a id="problemas"></a>

### Problemas

- **"Could not connect to the TV"**: revisa que el TV esté encendido, con el Modo Desarrollador
  activo, y que **Host PC IP** sea la IP del computador donde corres el script. Reinicia el TV
  después de cambiarla.
- **La instalación falla por el certificado** (común en TV nuevos): crea un certificado de Samsung
  para tu TV en [Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
  y empaqueta la carpeta `src` con él.
- **Lumen desaparece después de un reset**: las apps instaladas en Modo Desarrollador se pueden
  borrar al resetear el TV o apagar el Modo Desarrollador. Instálala de nuevo.

⬆️ [Volver arriba](#lumen) · 🇬🇧 [Read in English](#english)

---

<a id="english"></a>

## 🇬🇧 English

Lumen is a **launcher** app: it shows your installed apps in a simple grid, with big movie and show
images at the top, a clock and a screen saver. No ads and no store rows. It is made for **older
Samsung TVs** that feel slow or crowded, and it runs well on their old browser engine.

📖 The story behind it: [How I cleaned up my Samsung TV and made it feel modern again](https://medium.com/@jhonosorio/how-i-cleaned-up-my-samsung-tv-and-made-it-feel-modern-again-a81cdd173563)

### Features

- **Grid like tvOS**: 6 apps per row. The focused app grows and tilts in 3D.
- **Top Shelf**: when you focus an app in the first row (Netflix, Disney+, Prime Video, Max,
  Apple TV, Paramount+, Crunchyroll), the top area shows its popular titles with a soft fade.
  This part is **optional** and uses [TMDB](https://www.themoviedb.org) (see below).
- **Glass look**: the old TV browser has no `backdrop-filter`, so Lumen makes the blur once on a
  small canvas. It looks like glass and it costs nothing when you move around.
- **Your order**: hold **OK** on an app to move it with the arrows or to hide it.
- **HDMI inputs** with names and logos (PlayStation, Xbox, Switch…).
- **Screen saver** with movie images, the full description and a big clock.
- **9 languages**: English, Spanish, Portuguese, French, German, Italian, Japanese, Korean and
  Chinese. By default Lumen uses the TV language. The country also comes from the TV.
- **Settings**: language, wallpaper, top area (images or classic), app tray (glass, translucent,
  solid or none), image speed, 12/24-hour clock, screen saver time and clock opacity, hidden apps.

Remote control: **Green** opens All apps, **Blue** or **Info** opens Settings, **Back** closes.

### Which TVs?

| TV | Status |
|---|---|
| Samsung 2018 (Tizen 4.0), e.g. UN43NU7100 | ✅ Tested every day |
| Samsung 2017–2020 (Tizen 3.0 – 5.5) | 👍 Should work. The code is made for the old Chromium 56 engine |
| Samsung 2016 (Tizen 2.4) | 🤷 Not tested |
| Samsung 2021 and newer (Tizen 6+) | ⚠️ Probably works, but the TV may ask for a Samsung certificate (see [Problems](#problems)) |

Lumen does **not** replace the Samsung home (Smart Hub). Samsung does not allow that. Lumen is an
app that you open, and you can leave it open. The Home button on the remote still opens Smart Hub.

### 🤖 Install with Claude Code or Codex (the easy way)

You can give this repository to an AI coding assistant like
[Claude Code](https://claude.com/claude-code) or [Codex](https://openai.com/codex), and it does
everything for you: it checks Docker, packages, installs and explains any error.

1. Turn on **Developer Mode** on the TV (step 1 below). Only you can do this, with the remote.
2. Open the assistant in an empty folder and write:

   ```
   Clone https://github.com/jacksonjao/lumen and install it on my Samsung TV.
   The TV IP is 192.168.1.50. Follow the README and the AGENTS.md file.
   ```

3. If you want the movie images, also ask it to help you add your TMDB key.

You can also ask it for changes: other colors, new logos, another app order, another default language…

### Install by hand

You need a computer (Mac, Linux or Windows) on the same network as the TV, and
[Docker](https://www.docker.com/products/docker-desktop/) (on a Mac, [OrbStack](https://orbstack.dev) also works).
You do **not** need Tizen Studio: the script uses the Tizen tools inside Docker.

#### 1. Turn on Developer Mode on the TV (only once)

1. Find the IP of your computer (for example `192.168.1.20`).
2. On the TV, open **Apps**. With the remote, press `1 2 3 4 5`.
3. Turn **Developer mode** on and write your computer IP in **Host PC IP**.
4. Restart the TV: hold the power button until you see the Samsung logo.

You can see the TV IP in **Settings > General > Network > Network Status > IP Settings**.

#### 2. Install Lumen

```bash
git clone https://github.com/jacksonjao/lumen.git
cd lumen
sh scripts/install.sh 192.168.1.50
```

Change `192.168.1.50` to your TV IP. The script packages the app, signs it, installs it and opens
it. Lumen then appears in your TV apps. To update it later, run the same command again.

On Windows, run the command in **Git Bash** or **WSL**, with Docker Desktop open.

#### 3. Optional: movie and show images (TMDB)

Lumen works without this. Without a key, the top area shows the app card (classic mode).
With a key, it shows the popular titles of each app in your country.

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup).
2. Go to **Settings > API** and ask for a key (personal use). Copy the **API Key**.
3. Install with the key:

   ```bash
   TMDB_KEY=your_key_here sh scripts/install.sh 192.168.1.50
   ```

The key is saved in `src/js/config.local.js`. This file is in `.gitignore`, so it is never
uploaded to git. Next time you can run the install without `TMDB_KEY`.

About data: Lumen asks TMDB for new titles only every 12 hours (about 12 small requests) and saves
them on the TV. Moving around the screen does not use the internet.

### Try it on your computer

You need [Node.js](https://nodejs.org) 18 or newer. No `npm install` is needed.

```bash
node scripts/serve.mjs
```

Open http://localhost:8080 and use the arrows, **Enter** and **Esc**. Outside the TV, Lumen uses
example apps. Press **S** to open the screen saver.

### Customize

- `src/js/config.js`: the first order of the apps and the screen saver time.
- `src/js/brands.js`: colors, logos and texts for each app. To add a new logo, put the SVG in
  `src/img/marks/` and run `node scripts/build-marks.mjs`.
- `src/js/i18n.js`: all the texts in the 9 languages.
- `src/css/app.css`: all the design.

<a id="problems"></a>

### Problems

- **"Could not connect to the TV"**: check that the TV is on, Developer Mode is on, and that
  **Host PC IP** is the IP of the computer where you run the script. Restart the TV after you
  change it.
- **Install fails with a certificate error** (common on newer TVs): create a Samsung certificate
  for your TV in [Tizen Studio](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
  and package the `src` folder with it.
- **Lumen disappears after a reset**: apps installed in Developer Mode can be removed when you
  reset the TV or turn Developer Mode off. Install it again.

⬆️ [Back to top](#lumen) · 🇪🇸 [Leer en español](#espanol)

---

## Créditos · Credits

- Datos e imágenes de películas y series de [TMDB](https://www.themoviedb.org). This product uses
  the TMDB API but is not endorsed or certified by TMDB.
- Logos de [Simple Icons](https://simpleicons.org) (CC0) y Custom Brand Icons (MIT). Las marcas
  pertenecen a sus dueños · All brands belong to their owners. Lumen no tiene relación con Apple,
  Samsung ni ningún servicio de streaming · Lumen is not related to Apple, Samsung or any streaming service.
- Fuente [Inter](https://rsms.me/inter/) (OFL).
- La idea de filtrar apps del sistema viene de · The idea to filter system apps comes from
  [arn0-tv](https://github.com/NelsonEU/arn0-tv) (MIT).

## Licencia · License

[MIT](LICENSE)
