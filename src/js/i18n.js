/*
 * Idiomas de la interfaz. Por defecto se usa el del TV; en Ajustes se puede elegir otro.
 * t('clave', { var: valor }) devuelve el texto en el idioma activo (o en inglés si falta).
 */
window.I18N = (function () {
    'use strict';

    var LANGS = ['es', 'en', 'pt', 'fr', 'de', 'it', 'ja', 'ko', 'zh'];

    var NAMES = {
        es: 'Español', en: 'English', pt: 'Português', fr: 'Français', de: 'Deutsch',
        it: 'Italiano', ja: '日本語', ko: '한국어', zh: '中文'
    };

    // Variante de idioma para TMDB cuando el país del TV no coincide con el idioma elegido.
    var TMDB_DEFAULT = {
        es: 'es-ES', en: 'en-US', pt: 'pt-BR', fr: 'fr-FR', de: 'de-DE',
        it: 'it-IT', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN'
    };

    var DATES = {
        es: {
            days: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
            months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + M[d.getMonth()].slice(0, 3); },
            long: function (d, D, M) { return cap(D[d.getDay()]) + ', ' + d.getDate() + ' de ' + M[d.getMonth()]; }
        },
        en: {
            days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 3) + ', ' + M[d.getMonth()].slice(0, 3) + ' ' + d.getDate(); },
            long: function (d, D, M) { return D[d.getDay()] + ', ' + M[d.getMonth()] + ' ' + d.getDate(); }
        },
        pt: {
            days: ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'],
            months: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 3) + ', ' + d.getDate() + ' ' + M[d.getMonth()].slice(0, 3); },
            long: function (d, D, M) { return cap(D[d.getDay()]) + ', ' + d.getDate() + ' de ' + M[d.getMonth()]; }
        },
        fr: {
            days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
            months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 3) + '. ' + d.getDate() + ' ' + M[d.getMonth()]; },
            long: function (d, D, M) { return cap(D[d.getDay()]) + ' ' + d.getDate() + ' ' + M[d.getMonth()]; }
        },
        de: {
            days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
            months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 2) + '., ' + d.getDate() + '. ' + M[d.getMonth()].slice(0, 3) + '.'; },
            long: function (d, D, M) { return D[d.getDay()] + ', ' + d.getDate() + '. ' + M[d.getMonth()]; }
        },
        it: {
            days: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
            months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
            short: function (d, D, M) { return D[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + M[d.getMonth()].slice(0, 3); },
            long: function (d, D, M) { return cap(D[d.getDay()]) + ' ' + d.getDate() + ' ' + M[d.getMonth()]; }
        },
        ja: {
            days: ['日', '月', '火', '水', '木', '金', '土'],
            short: function (d, D) { return (d.getMonth() + 1) + '月' + d.getDate() + '日(' + D[d.getDay()] + ')'; },
            long: function (d, D) { return (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + D[d.getDay()] + '曜日'; }
        },
        ko: {
            days: ['일', '월', '화', '수', '목', '금', '토'],
            short: function (d, D) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 (' + D[d.getDay()] + ')'; },
            long: function (d, D) { return (d.getMonth() + 1) + '월 ' + d.getDate() + '일 ' + D[d.getDay()] + '요일'; }
        },
        zh: {
            days: ['日', '一', '二', '三', '四', '五', '六'],
            short: function (d, D) { return (d.getMonth() + 1) + '月' + d.getDate() + '日 周' + D[d.getDay()]; },
            long: function (d, D) { return (d.getMonth() + 1) + '月' + d.getDate() + '日 星期' + D[d.getDay()]; }
        }
    };

    // Columnas: es, en, pt, fr, de, it, ja, ko, zh
    var ROWS = {

        'tile.library': ['Todas las apps', 'All Apps', 'Todos os apps', 'Toutes les apps', 'Alle Apps', 'Tutte le app', 'すべてのアプリ', '모든 앱', '所有应用'],
        'tile.manage': ['Administrar apps', 'Manage Apps', 'Gerenciar apps', 'Gérer les apps', 'Apps verwalten', 'Gestisci app', 'アプリを管理', '앱 관리', '管理应用'],
        'tile.saver': ['Protector de pantalla', 'Screen Saver', 'Proteção de tela', 'Économiseur d’écran', 'Bildschirmschoner', 'Salvaschermo', 'スクリーンセーバー', '화면 보호기', '屏幕保护程序'],
        'hero.saver.e': ['Ambiente', 'Ambient', 'Ambiente', 'Ambiance', 'Ambiente', 'Ambiente', 'アンビエント', '앰비언트', '氛围'],
        'hero.saver.b': ['Imágenes de tus plataformas con la hora, como un cuadro. Cualquier tecla vuelve a Inicio.', 'Images from your services with the time, like a picture frame. Any key returns Home.', 'Imagens das suas plataformas com a hora, como um quadro. Qualquer tecla volta ao Início.', 'Images de vos services avec l’heure, comme un tableau. Une touche pour revenir à l’accueil.', 'Bilder deiner Dienste mit Uhrzeit, wie ein Bilderrahmen. Jede Taste führt zurück.', 'Immagini dei tuoi servizi con l’ora, come un quadro. Qualsiasi tasto torna alla Home.', 'サービスの画像と時刻を額縁のように表示。いずれかのキーでホームへ。', '서비스 이미지와 시간을 액자처럼 보여줘요. 아무 키나 누르면 홈으로.', '像相框一样显示你的服务图片和时间。按任意键返回主屏幕。'],
        'tile.settings': ['Ajustes', 'Settings', 'Ajustes', 'Réglages', 'Einstellungen', 'Impostazioni', '設定', '설정', '设置'],

        'hero.library.e': ['Biblioteca', 'Library', 'Biblioteca', 'Bibliothèque', 'Mediathek', 'Libreria', 'ライブラリ', '보관함', '资料库'],
        'hero.library.b': ['{n} apps instaladas en este TV.', '{n} apps installed on this TV.', '{n} apps instalados nesta TV.', '{n} apps installées sur ce téléviseur.', '{n} Apps auf diesem Fernseher installiert.', '{n} app installate su questo TV.', 'このテレビに {n} 個のアプリがあります。', '이 TV에 앱 {n}개가 설치되어 있어요.', '此电视已安装 {n} 个应用。'],
        'hero.settings.e': ['Personaliza', 'Personalize', 'Personalize', 'Personnaliser', 'Anpassen', 'Personalizza', 'カスタマイズ', '맞춤 설정', '个性化'],
        'hero.settings.b': ['Fondo, reloj, protector de pantalla e idioma.', 'Wallpaper, clock, screen saver and language.', 'Fundo, relógio, proteção de tela e idioma.', 'Fond, horloge, économiseur d’écran et langue.', 'Hintergrund, Uhr, Bildschirmschoner und Sprache.', 'Sfondo, orologio, salvaschermo e lingua.', '壁紙、時計、スクリーンセーバー、言語。', '배경, 시계, 화면 보호기, 언어.', '背景、时钟、屏幕保护程序和语言。'],
        'hero.manage.e': ['Samsung', 'Samsung', 'Samsung', 'Samsung', 'Samsung', 'Samsung', 'Samsung', 'Samsung', 'Samsung'],
        'hero.manage.b': ['Abre la pantalla de Apps de Samsung para eliminar o actualizar apps.', 'Open Samsung’s Apps screen to delete or update apps.', 'Abre a tela de Apps da Samsung para excluir ou atualizar apps.', 'Ouvre l’écran Apps de Samsung pour supprimer ou mettre à jour des apps.', 'Öffnet Samsungs App-Bildschirm zum Löschen oder Aktualisieren.', 'Apre la schermata App di Samsung per eliminare o aggiornare app.', 'Samsungのアプリ画面を開いて削除や更新ができます。', '삼성 앱 화면을 열어 앱을 삭제하거나 업데이트해요.', '打开三星应用界面以删除或更新应用。'],
        'hero.hdmi.e': ['Entrada · {sub}', 'Input · {sub}', 'Entrada · {sub}', 'Entrée · {sub}', 'Eingang · {sub}', 'Ingresso · {sub}', '入力 · {sub}', '입력 · {sub}', '输入 · {sub}'],
        'hero.hdmi.b': ['Cambiar el TV a {sub}.', 'Switch the TV to {sub}.', 'Mudar a TV para {sub}.', 'Passer le téléviseur sur {sub}.', 'Fernseher auf {sub} umschalten.', 'Passa il TV a {sub}.', 'テレビを {sub} に切り替えます。', 'TV를 {sub}(으)로 전환해요.', '将电视切换到 {sub}。'],
        'hero.app.e': ['App', 'App', 'App', 'App', 'App', 'App', 'アプリ', '앱', '应用'],
        'hero.app.b': ['Pulsa OK para abrir.', 'Press OK to open.', 'Pressione OK para abrir.', 'Appuyez sur OK pour ouvrir.', 'Zum Öffnen OK drücken.', 'Premi OK per aprire.', 'OKを押して開きます。', 'OK를 눌러 열어요.', '按 OK 打开。'],

        'shelf.popular': ['Popular en {app}', 'Popular on {app}', 'Em alta no {app}', 'Populaire sur {app}', 'Beliebt bei {app}', 'Popolare su {app}', '{app}で人気', '{app} 인기', '{app} 热门'],
        'kind.tv': ['Serie', 'Series', 'Série', 'Série', 'Serie', 'Serie', 'シリーズ', '시리즈', '剧集'],
        'kind.movie': ['Película', 'Movie', 'Filme', 'Film', 'Film', 'Film', '映画', '영화', '电影'],

        'hdmi.decoder': ['Decodificador', 'Set-top box', 'Decodificador', 'Décodeur', 'Receiver', 'Decoder', 'セットトップボックス', '셋톱박스', '机顶盒'],
        'hdmi.pc': ['Computador', 'Computer', 'Computador', 'Ordinateur', 'Computer', 'Computer', 'パソコン', '컴퓨터', '电脑'],
        'hdmi.soundbar': ['Barra de sonido', 'Soundbar', 'Soundbar', 'Barre de son', 'Soundbar', 'Soundbar', 'サウンドバー', '사운드바', '回音壁'],

        'toast.openFail': ['No se pudo abrir {app}', 'Couldn’t open {app}', 'Não foi possível abrir {app}', 'Impossible d’ouvrir {app}', '{app} konnte nicht geöffnet werden', 'Impossibile aprire {app}', '{app}を開けませんでした', '{app}을(를) 열 수 없어요', '无法打开 {app}'],
        'toast.hidden': ['{app} se ocultó de Inicio', '{app} hidden from Home', '{app} oculto do Início', '{app} masquée de l’accueil', '{app} auf dem Startbildschirm ausgeblendet', '{app} nascosta dalla Home', '{app}をホームから非表示にしました', '{app}을(를) 홈에서 숨겼어요', '已从主屏幕隐藏 {app}'],
        'toast.shown': ['{app} vuelve a estar en Inicio', '{app} is back on Home', '{app} voltou ao Início', '{app} est de retour sur l’accueil', '{app} ist wieder auf dem Startbildschirm', '{app} è di nuovo nella Home', '{app}をホームに戻しました', '{app}이(가) 홈에 다시 표시돼요', '{app} 已回到主屏幕'],
        'toast.hiddenEdit': ['{app} se ocultó. Puedes mostrarla de nuevo desde Todas las apps', '{app} hidden. You can show it again from All Apps', '{app} oculto. Você pode mostrá-lo de novo em Todos os apps', '{app} masquée. Vous pouvez la réafficher depuis Toutes les apps', '{app} ausgeblendet. Unter „Alle Apps“ wieder einblenden', '{app} nascosta. Puoi mostrarla di nuovo da Tutte le app', '{app}を非表示にしました。「すべてのアプリ」から戻せます', '{app}을(를) 숨겼어요. 모든 앱에서 다시 표시할 수 있어요', '已隐藏 {app}。可在“所有应用”中重新显示'],
        'toast.reset': ['Inicio restablecido', 'Home reset', 'Início redefinido', 'Accueil réinitialisé', 'Startbildschirm zurückgesetzt', 'Home ripristinata', 'ホームをリセットしました', '홈을 초기화했어요', '主屏幕已重置'],
        'toast.appsFail': ['No se pudo leer la lista de apps', 'Couldn’t read the app list', 'Não foi possível ler a lista de apps', 'Impossible de lire la liste des apps', 'App-Liste konnte nicht gelesen werden', 'Impossibile leggere l’elenco delle app', 'アプリ一覧を読み込めませんでした', '앱 목록을 읽을 수 없어요', '无法读取应用列表'],

        'lib.title': ['Apps', 'Apps', 'Apps', 'Apps', 'Apps', 'App', 'アプリ', '앱', '应用'],
        'lib.count': ['{n} apps', '{n} apps', '{n} apps', '{n} apps', '{n} Apps', '{n} app', '{n} 個のアプリ', '앱 {n}개', '{n} 个应用'],
        'lib.hiddenOne': ['{n} oculta', '{n} hidden', '{n} oculto', '{n} masquée', '{n} ausgeblendet', '{n} nascosta', '{n} 個非表示', '{n}개 숨김', '{n} 个已隐藏'],
        'lib.hiddenMany': ['{n} ocultas', '{n} hidden', '{n} ocultos', '{n} masquées', '{n} ausgeblendet', '{n} nascoste', '{n} 個非表示', '{n}개 숨김', '{n} 个已隐藏'],
        'lib.hint': ['Mantén OK presionado para mostrar u ocultar en Inicio', 'Hold OK to show or hide on Home', 'Mantenha OK pressionado para mostrar ou ocultar no Início', 'Maintenez OK pour afficher ou masquer sur l’accueil', 'OK gedrückt halten zum Ein- oder Ausblenden', 'Tieni premuto OK per mostrare o nascondere nella Home', 'OKを長押しでホームに表示/非表示', 'OK를 길게 눌러 홈에 표시하거나 숨겨요', '长按 OK 可在主屏幕显示或隐藏'],

        'edit.arrows': ['Flechas', 'Arrows', 'Setas', 'Flèches', 'Pfeile', 'Frecce', '矢印', '화살표', '方向键'],
        'edit.move': ['Mover', 'Move', 'Mover', 'Déplacer', 'Bewegen', 'Sposta', '移動', '이동', '移动'],
        'edit.hold': ['Mantén OK', 'Hold OK', 'Segure OK', 'Maintenir OK', 'OK halten', 'Tieni OK', 'OK長押し', 'OK 길게', '长按 OK'],
        'edit.hide': ['Ocultar', 'Hide', 'Ocultar', 'Masquer', 'Ausblenden', 'Nascondi', '非表示', '숨기기', '隐藏'],
        'edit.done': ['Listo', 'Done', 'Pronto', 'Terminé', 'Fertig', 'Fine', '完了', '완료', '完成'],

        'set.title': ['Ajustes', 'Settings', 'Ajustes', 'Réglages', 'Einstellungen', 'Impostazioni', '設定', '설정', '设置'],
        'opt.lang': ['Idioma', 'Language', 'Idioma', 'Langue', 'Sprache', 'Lingua', '言語', '언어', '语言'],
        'lang.auto': ['Automático ({name})', 'Automatic ({name})', 'Automático ({name})', 'Automatique ({name})', 'Automatisch ({name})', 'Automatica ({name})', '自動（{name}）', '자동 ({name})', '自动（{name}）'],
        'opt.wallpaper': ['Fondo', 'Wallpaper', 'Fundo', 'Fond', 'Hintergrund', 'Sfondo', '壁紙', '배경', '背景'],
        'wp.dynamic': ['Dinámico', 'Dynamic', 'Dinâmico', 'Dynamique', 'Dynamisch', 'Dinamico', 'ダイナミック', '다이내믹', '动态'],
        'wp.aurora': ['Aurora', 'Aurora', 'Aurora', 'Aurore', 'Polarlicht', 'Aurora', 'オーロラ', '오로라', '极光'],
        'wp.sunset': ['Atardecer', 'Sunset', 'Pôr do sol', 'Coucher de soleil', 'Sonnenuntergang', 'Tramonto', '夕焼け', '노을', '日落'],
        'wp.ocean': ['Océano', 'Ocean', 'Oceano', 'Océan', 'Ozean', 'Oceano', '海', '바다', '海洋'],
        'wp.lilac': ['Lila', 'Lilac', 'Lilás', 'Lilas', 'Flieder', 'Lilla', 'ライラック', '라일락', '丁香'],
        'wp.graphite': ['Grafito', 'Graphite', 'Grafite', 'Graphite', 'Graphit', 'Grafite', 'グラファイト', '그래파이트', '石墨'],
        'opt.shelf': ['Área destacada', 'Top Shelf', 'Área em destaque', 'Zone à la une', 'Top-Bereich', 'Area in evidenza', 'トップシェルフ', '상단 영역', '顶部区域'],
        'shelf.images': ['Imágenes', 'Images', 'Imagens', 'Images', 'Bilder', 'Immagini', '画像', '이미지', '图片'],
        'shelf.classic': ['Clásico', 'Classic', 'Clássico', 'Classique', 'Klassisch', 'Classico', 'クラシック', '클래식', '经典'],
        'opt.tray': ['Bandeja de apps', 'App tray', 'Bandeja de apps', 'Plateau d’apps', 'App-Leiste', 'Vassoio app', 'アプリトレイ', '앱 트레이', '应用托盘'],
        'tray.glass': ['Vidrio', 'Glass', 'Vidro', 'Verre', 'Glas', 'Vetro', 'ガラス', '유리', '玻璃'],
        'tray.tint': ['Translúcida', 'Translucent', 'Translúcida', 'Translucide', 'Durchscheinend', 'Traslucido', '半透明', '반투명', '半透明'],
        'tray.solid': ['Sólida', 'Solid', 'Sólida', 'Opaque', 'Deckend', 'Solido', '不透明', '불투명', '实心'],
        'tray.none': ['Sin bandeja', 'No tray', 'Sem bandeja', 'Sans plateau', 'Ohne Leiste', 'Senza vassoio', 'なし', '없음', '无托盘'],
        'opt.speed': ['Velocidad de las imágenes', 'Image speed', 'Velocidade das imagens', 'Vitesse des images', 'Bildwechsel', 'Velocità delle immagini', '画像の切り替え速度', '이미지 전환 속도', '图片切换速度'],
        'speed.fast': ['Rápida', 'Fast', 'Rápida', 'Rapide', 'Schnell', 'Veloce', '速い', '빠르게', '快'],
        'speed.normal': ['Normal', 'Normal', 'Normal', 'Normale', 'Normal', 'Normale', '普通', '보통', '正常'],
        'speed.slow': ['Lenta', 'Slow', 'Lenta', 'Lente', 'Langsam', 'Lenta', '遅い', '느리게', '慢'],
        'opt.clock': ['Formato de hora', 'Time format', 'Formato de hora', 'Format de l’heure', 'Zeitformat', 'Formato ora', '時刻の形式', '시간 형식', '时间格式'],
        'clock.12': ['12 horas', '12-hour', '12 horas', '12 heures', '12 Stunden', '12 ore', '12時間', '12시간', '12 小时'],
        'clock.24': ['24 horas', '24-hour', '24 horas', '24 heures', '24 Stunden', '24 ore', '24時間', '24시간', '24 小时'],
        'opt.saver': ['Protector de pantalla', 'Screen saver', 'Proteção de tela', 'Économiseur d’écran', 'Bildschirmschoner', 'Salvaschermo', 'スクリーンセーバー', '화면 보호기', '屏幕保护程序'],
        'saver.never': ['Nunca', 'Never', 'Nunca', 'Jamais', 'Nie', 'Mai', 'なし', '사용 안 함', '从不'],
        'saver.min': ['{n} min', '{n} min', '{n} min', '{n} min', '{n} Min.', '{n} min', '{n}分', '{n}분', '{n} 分钟'],
        'opt.saverClock': ['Hora del protector', 'Screen saver clock', 'Relógio da proteção', 'Horloge de l’économiseur', 'Uhr im Bildschirmschoner', 'Orologio del salvaschermo', 'セーバーの時計', '화면 보호기 시계', '屏保时钟'],
        'level.high': ['Alta', 'High', 'Alta', 'Élevée', 'Hoch', 'Alta', '高', '높음', '高'],
        'level.medium': ['Media', 'Medium', 'Média', 'Moyenne', 'Mittel', 'Media', '中', '중간', '中'],
        'level.low': ['Baja', 'Low', 'Baixa', 'Faible', 'Niedrig', 'Bassa', '低', '낮음', '低'],
        'opt.inputs': ['Entradas en Inicio', 'Inputs on Home', 'Entradas no Início', 'Entrées sur l’accueil', 'Eingänge auf Start', 'Ingressi nella Home', 'ホームに入力を表示', '홈에 입력 표시', '主屏幕显示输入源'],
        'show': ['Mostrar', 'Show', 'Mostrar', 'Afficher', 'Anzeigen', 'Mostra', '表示', '표시', '显示'],
        'hide': ['Ocultar', 'Hide', 'Ocultar', 'Masquer', 'Ausblenden', 'Nascondi', '非表示', '숨기기', '隐藏'],
        'opt.hdmiOff': ['{name} · sin conectar', '{name} · not connected', '{name} · desconectado', '{name} · non connecté', '{name} · nicht verbunden', '{name} · non collegato', '{name} · 未接続', '{name} · 연결 안 됨', '{name} · 未连接'],
        'opt.hidden': ['Apps ocultas ({n})', 'Hidden apps ({n})', 'Apps ocultos ({n})', 'Apps masquées ({n})', 'Ausgeblendete Apps ({n})', 'App nascoste ({n})', '非表示のアプリ（{n}）', '숨긴 앱 ({n})', '隐藏的应用（{n}）'],
        'opt.reset': ['Restablecer Inicio', 'Reset Home', 'Redefinir Início', 'Réinitialiser l’accueil', 'Start zurücksetzen', 'Ripristina Home', 'ホームをリセット', '홈 초기화', '重置主屏幕'],

        'opt.about': ['Acerca de', 'About', 'Sobre', 'À propos', 'Info', 'Informazioni', '情報', '정보', '关于'],
        'about.version': ['Versión', 'Version', 'Versão', 'Version', 'Version', 'Versione', 'バージョン', '버전', '版本'],
        'about.tv': ['TV', 'TV', 'TV', 'Téléviseur', 'Fernseher', 'TV', 'テレビ', 'TV', '电视'],
        'about.firmware': ['Firmware', 'Firmware', 'Firmware', 'Micrologiciel', 'Firmware', 'Firmware', 'ファームウェア', '펌웨어', '固件'],
        'about.locale': ['Idioma y país del TV', 'TV language and country', 'Idioma e país da TV', 'Langue et pays du téléviseur', 'Sprache und Land des Fernsehers', 'Lingua e paese del TV', 'テレビの言語と国', 'TV 언어 및 국가', '电视语言和国家/地区'],
        'about.data': ['Títulos destacados', 'Featured titles', 'Títulos em destaque', 'Titres à la une', 'Empfohlene Titel', 'Titoli in evidenza', 'おすすめ作品', '추천 콘텐츠', '精选内容'],
        'about.logos': ['Logos de marcas: Simple Icons (CC0) y Custom Brand Icons (MIT). Las marcas pertenecen a sus dueños.', 'Brand logos: Simple Icons (CC0) and Custom Brand Icons (MIT). Trademarks belong to their owners.', 'Logos: Simple Icons (CC0) e Custom Brand Icons (MIT). As marcas pertencem aos seus donos.', 'Logos : Simple Icons (CC0) et Custom Brand Icons (MIT). Les marques appartiennent à leurs propriétaires.', 'Logos: Simple Icons (CC0) und Custom Brand Icons (MIT). Marken gehören ihren Inhabern.', 'Loghi: Simple Icons (CC0) e Custom Brand Icons (MIT). I marchi appartengono ai rispettivi proprietari.', 'ロゴ: Simple Icons（CC0）、Custom Brand Icons（MIT）。商標は各所有者に帰属します。', '로고: Simple Icons(CC0), Custom Brand Icons(MIT). 상표는 각 소유자에게 있어요.', '标志：Simple Icons（CC0）和 Custom Brand Icons（MIT）。商标归其所有者所有。'],
        'about.back': ['Pulsa Atrás para volver', 'Press Back to return', 'Pressione Voltar para retornar', 'Appuyez sur Retour pour revenir', 'Zum Zurückkehren „Zurück“ drücken', 'Premi Indietro per tornare', '戻るボタンで戻ります', '뒤로 버튼을 눌러 돌아가요', '按返回键返回'],

        'tmdb.ok': ['Datos de TMDB · actualizados {when}', 'TMDB data · updated {when}', 'Dados do TMDB · atualizados {when}', 'Données TMDB · mises à jour {when}', 'TMDB-Daten · aktualisiert {when}', 'Dati TMDB · aggiornati {when}', 'TMDBのデータ · {when}に更新', 'TMDB 데이터 · {when} 업데이트', 'TMDB 数据 · {when}更新'],
        'tmdb.lt1': ['hace menos de 1 h', 'less than 1 h ago', 'há menos de 1 h', 'il y a moins d’1 h', 'vor weniger als 1 Std.', 'meno di 1 h fa', '1時間以内', '1시간 이내', '不到 1 小时前'],
        'tmdb.h': ['hace {n} h', '{n} h ago', 'há {n} h', 'il y a {n} h', 'vor {n} Std.', '{n} h fa', '{n}時間前', '{n}시간 전', '{n} 小时前'],
        'tmdb.loading': ['TMDB: cargando…', 'TMDB: loading…', 'TMDB: carregando…', 'TMDB : chargement…', 'TMDB: wird geladen …', 'TMDB: caricamento…', 'TMDB: 読み込み中…', 'TMDB: 불러오는 중…', 'TMDB：正在加载…'],
        'tmdb.badkey': ['TMDB: la clave no es válida', 'TMDB: the key isn’t valid', 'TMDB: a chave não é válida', 'TMDB : la clé n’est pas valide', 'TMDB: Schlüssel ungültig', 'TMDB: chiave non valida', 'TMDB: キーが無効です', 'TMDB: 키가 유효하지 않아요', 'TMDB：密钥无效'],
        'tmdb.down': ['TMDB: no respondió', 'TMDB: not responding', 'TMDB: não respondeu', 'TMDB : pas de réponse', 'TMDB: keine Antwort', 'TMDB: nessuna risposta', 'TMDB: 応答がありません', 'TMDB: 응답이 없어요', 'TMDB：无响应'],
        'tmdb.nokey': ['Sin clave de TMDB: área de arriba en modo clásico', 'No TMDB key: Top Shelf in classic mode', 'Sem chave do TMDB: área de cima no modo clássico', 'Pas de clé TMDB : zone du haut en mode classique', 'Kein TMDB-Schlüssel: Top-Bereich klassisch', 'Nessuna chiave TMDB: area in alto in modalità classica', 'TMDBキーなし: トップはクラシック表示', 'TMDB 키 없음: 상단 영역은 클래식 모드', '无 TMDB 密钥：顶部区域为经典模式'],
        'tmdb.credit': ['Usa la API de TMDB, pero no está respaldado ni certificado por TMDB.', 'This product uses the TMDB API but is not endorsed or certified by TMDB.', 'Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.', 'Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.', 'Dieses Produkt nutzt die TMDB-API, ist aber nicht von TMDB unterstützt oder zertifiziert.', 'Questo prodotto usa l’API di TMDB ma non è approvato né certificato da TMDB.', '本製品はTMDB APIを使用していますが、TMDBによる承認・認定は受けていません。', '이 제품은 TMDB API를 사용하지만 TMDB의 보증이나 인증을 받지 않았어요.', '本产品使用 TMDB API，但未获得 TMDB 的认可或认证。'],

        // Categorías (línea pequeña de arriba en el modo clásico)
        'cat.seriesMovies': ['Series y películas', 'Series and movies', 'Séries e filmes', 'Séries et films', 'Serien und Filme', 'Serie e film', 'シリーズと映画', '시리즈와 영화', '剧集和电影'],
        'cat.videos': ['Videos', 'Videos', 'Vídeos', 'Vidéos', 'Videos', 'Video', '動画', '동영상', '视频'],
        'cat.hboMore': ['HBO y más', 'HBO and more', 'HBO e mais', 'HBO et plus', 'HBO und mehr', 'HBO e altro', 'HBOほか', 'HBO 외', 'HBO 及更多'],
        'cat.music': ['Música', 'Music', 'Música', 'Musique', 'Musik', 'Musica', '音楽', '음악', '音乐'],
        'cat.musicPodcasts': ['Música y podcasts', 'Music and podcasts', 'Música e podcasts', 'Musique et podcasts', 'Musik und Podcasts', 'Musica e podcast', '音楽とポッドキャスト', '음악과 팟캐스트', '音乐和播客'],
        'cat.anime': ['Anime', 'Anime', 'Anime', 'Anime', 'Anime', 'Anime', 'アニメ', '애니메이션', '动漫'],
        'cat.library': ['Tu biblioteca', 'Your library', 'Sua biblioteca', 'Votre bibliothèque', 'Deine Mediathek', 'La tua libreria', 'あなたのライブラリ', '내 보관함', '你的资料库'],
        'cat.live': ['En vivo', 'Live', 'Ao vivo', 'En direct', 'Live', 'In diretta', 'ライブ', '라이브', '直播'],
        'cat.sports': ['Deportes', 'Sports', 'Esportes', 'Sports', 'Sport', 'Sport', 'スポーツ', '스포츠', '体育'],
        'cat.free': ['Gratis', 'Free', 'Grátis', 'Gratuit', 'Kostenlos', 'Gratis', '無料', '무료', '免费'],
        'cat.tv': ['Televisión', 'Television', 'Televisão', 'Télévision', 'Fernsehen', 'Televisione', 'テレビ', 'TV', '电视'],
        'cat.console': ['Consola', 'Console', 'Console', 'Console', 'Konsole', 'Console', 'ゲーム機', '콘솔', '游戏机'],

        // Frase de cada marca (modo clásico)
        'b.netflix': ['Continúa justo donde lo dejaste.', 'Pick up right where you left off.', 'Continue de onde parou.', 'Reprenez là où vous vous êtes arrêté.', 'Mach genau dort weiter, wo du aufgehört hast.', 'Riprendi da dove avevi lasciato.', '続きからすぐに再生。', '보던 곳에서 바로 이어서.', '从上次离开的地方继续。'],
        'b.youtube': ['Tus suscripciones y lo que es tendencia.', 'Your subscriptions and what’s trending.', 'Suas inscrições e o que está em alta.', 'Vos abonnements et les tendances.', 'Deine Abos und was gerade angesagt ist.', 'I tuoi iscritti e le tendenze.', '登録チャンネルと急上昇。', '구독과 인기 동영상.', '你的订阅和热门内容。'],
        'b.primevideo': ['Originales de Amazon y mucho más.', 'Amazon Originals and much more.', 'Originais da Amazon e muito mais.', 'Les Amazon Originals et bien plus.', 'Amazon Originals und vieles mehr.', 'Amazon Originals e molto altro.', 'Amazonオリジナルなど。', '아마존 오리지널 외 다양한 콘텐츠.', 'Amazon 原创及更多内容。'],
        'b.disneyplus': ['Historias para toda la familia.', 'Stories for the whole family.', 'Histórias para toda a família.', 'Des histoires pour toute la famille.', 'Geschichten für die ganze Familie.', 'Storie per tutta la famiglia.', '家族みんなで楽しめる物語。', '온 가족을 위한 이야기.', '适合全家人的故事。'],
        'b.max': ['Series que dan de qué hablar.', 'Shows everyone is talking about.', 'Séries que dão o que falar.', 'Les séries dont tout le monde parle.', 'Serien, über die alle reden.', 'Serie di cui tutti parlano.', '話題のシリーズ。', '모두가 이야기하는 시리즈.', '大家都在谈论的剧集。'],
        'b.appletv': ['Cine y series de Apple TV.', 'Movies and shows from Apple TV.', 'Filmes e séries da Apple TV.', 'Films et séries d’Apple TV.', 'Filme und Serien von Apple TV.', 'Film e serie di Apple TV.', 'Apple TVの映画とシリーズ。', 'Apple TV의 영화와 시리즈.', 'Apple TV 的电影和剧集。'],
        'b.applemusic': ['Más de 100 millones de canciones.', 'Over 100 million songs.', 'Mais de 100 milhões de músicas.', 'Plus de 100 millions de titres.', 'Über 100 Millionen Songs.', 'Oltre 100 milioni di brani.', '1億曲以上。', '1억 곡 이상.', '超过 1 亿首歌曲。'],
        'b.spotify': ['La banda sonora de la sala.', 'The soundtrack for your living room.', 'A trilha sonora da sala.', 'La bande-son du salon.', 'Der Soundtrack fürs Wohnzimmer.', 'La colonna sonora del salotto.', 'リビングのサウンドトラック。', '거실의 사운드트랙.', '客厅的背景音乐。'],
        'b.paramountplus': ['Una montaña de entretenimiento.', 'A mountain of entertainment.', 'Uma montanha de entretenimento.', 'Une montagne de divertissement.', 'Ein Berg voller Unterhaltung.', 'Una montagna di intrattenimento.', 'エンタメの山。', '엔터테인먼트의 산.', '海量娱乐内容。'],
        'b.crunchyroll': ['Simulcasts y clásicos del anime.', 'Simulcasts and anime classics.', 'Simulcasts e clássicos do anime.', 'Simulcasts et classiques de l’anime.', 'Simulcasts und Anime-Klassiker.', 'Simulcast e classici dell’anime.', '同時配信と名作アニメ。', '동시 방영과 애니 명작.', '同步放送与经典动漫。'],
        'b.plex': ['Tus películas, en cualquier pantalla.', 'Your movies, on any screen.', 'Seus filmes, em qualquer tela.', 'Vos films, sur tous les écrans.', 'Deine Filme auf jedem Bildschirm.', 'I tuoi film, su ogni schermo.', 'あなたの映画をどの画面でも。', '내 영화를 어떤 화면에서나.', '你的电影，任何屏幕都能看。'],
        'b.twitch': ['Streams en directo.', 'Live streams.', 'Transmissões ao vivo.', 'Streams en direct.', 'Livestreams.', 'Stream in diretta.', 'ライブ配信。', '라이브 스트림.', '直播。'],
        'b.dazn': ['Deporte en vivo y bajo demanda.', 'Live and on-demand sports.', 'Esportes ao vivo e sob demanda.', 'Sport en direct et à la demande.', 'Sport live und auf Abruf.', 'Sport in diretta e on demand.', 'ライブとオンデマンドのスポーツ。', '실시간 및 주문형 스포츠.', '直播和点播体育。'],
        'b.tubi': ['Películas y series sin costo.', 'Movies and shows at no cost.', 'Filmes e séries sem custo.', 'Films et séries gratuits.', 'Filme und Serien kostenlos.', 'Film e serie gratis.', '映画とシリーズが無料。', '무료 영화와 시리즈.', '免费电影和剧集。'],
        'b.kick': ['Streams en directo.', 'Live streams.', 'Transmissões ao vivo.', 'Streams en direct.', 'Livestreams.', 'Stream in diretta.', 'ライブ配信。', '라이브 스트림.', '直播。'],
        'b.vimeo': ['Cine independiente y creadores.', 'Independent film and creators.', 'Cinema independente e criadores.', 'Cinéma indépendant et créateurs.', 'Independent-Filme und Creator.', 'Cinema indipendente e creator.', 'インディー映画とクリエイター。', '독립 영화와 크리에이터.', '独立电影与创作者。'],
        'b.movistar': ['Canales en vivo y a la carta.', 'Live and on-demand channels.', 'Canais ao vivo e sob demanda.', 'Chaînes en direct et à la demande.', 'Live-Sender und auf Abruf.', 'Canali in diretta e on demand.', 'ライブとオンデマンドのチャンネル。', '실시간 및 주문형 채널.', '直播和点播频道。'],
        'b.playstation': ['Cambia a tu PlayStation.', 'Switch to your PlayStation.', 'Mude para o seu PlayStation.', 'Passez à votre PlayStation.', 'Zu deiner PlayStation wechseln.', 'Passa alla tua PlayStation.', 'PlayStationに切り替えます。', 'PlayStation으로 전환해요.', '切换到你的 PlayStation。'],
        'b.xbox': ['Cambia a tu Xbox.', 'Switch to your Xbox.', 'Mude para o seu Xbox.', 'Passez à votre Xbox.', 'Zu deiner Xbox wechseln.', 'Passa alla tua Xbox.', 'Xboxに切り替えます。', 'Xbox로 전환해요.', '切换到你的 Xbox。'],
        'b.nintendoswitch': ['Cambia a tu Nintendo Switch.', 'Switch to your Nintendo Switch.', 'Mude para o seu Nintendo Switch.', 'Passez à votre Nintendo Switch.', 'Zu deiner Nintendo Switch wechseln.', 'Passa alla tua Nintendo Switch.', 'Nintendo Switchに切り替えます。', 'Nintendo Switch로 전환해요.', '切换到你的 Nintendo Switch。']
    };

    var system = { lang: 'es', country: null };
    var current = 'es';

    function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    function supported(lang) { return LANGS.indexOf(lang) >= 0 ? lang : null; }

    // El idioma del TV llega como "es_CO", "en-US", "pt_BR"…
    function parseLocale(str) {
        var m = String(str || '').match(/^([a-zA-Z]{2,3})(?:[-_]([a-zA-Z]{2}))?/);
        return m ? { lang: m[1].toLowerCase(), country: m[2] ? m[2].toUpperCase() : null } : { lang: null, country: null };
    }

    // locale.country es el país de servicio del TV (platform.js); sin él, TMDB usa el de config.js.
    function setSystem(locale) {
        var p = parseLocale(locale && locale.language);
        system.lang = supported(p.lang) || 'en';
        var c = locale && locale.country;
        system.country = c && /^[A-Z]{2}$/.test(c) ? c : null;
    }

    function use(pref) { current = pref && pref !== 'auto' && supported(pref) ? pref : system.lang; }

    function t(key, vars) {
        var row = ROWS[key];
        var text = row ? (row[LANGS.indexOf(current)] || row[1]) : key;
        if (vars) Object.keys(vars).forEach(function (k) { text = text.split('{' + k + '}').join(vars[k]); });
        return text;
    }

    function has(key) { return !!ROWS[key]; }

    function dateShort(d) { var f = DATES[current]; return f.short(d, f.days, f.months); }
    function dateLong(d) { var f = DATES[current]; return f.long(d, f.days, f.months); }

    // Idioma para TMDB: con la variante del país del TV si es el mismo idioma (es-CO, pt-BR…).
    function tmdbLanguage() {
        return current === system.lang && system.country ? current + '-' + system.country : TMDB_DEFAULT[current];
    }

    return {
        LANGS: LANGS,
        NAMES: NAMES,
        t: t,
        has: has,
        use: use,
        setSystem: setSystem,
        parseLocale: parseLocale,
        lang: function () { return current; },
        systemLang: function () { return system.lang; },
        country: function () { return system.country; },
        dateShort: dateShort,
        dateLong: dateLong,
        tmdbLanguage: tmdbLanguage
    };
})();
