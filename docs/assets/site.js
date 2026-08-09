// ─────────────────────────────────────────────────────────────────────
// Renten Countdown — gemeinsames Seiten-Skript
//
// Eine Datei für Start- und Gruß-Seite, Gegenstück zu assets/site.css. Jeder
// Block prüft selbst, ob sein Element auf der Seite steht, und tut sonst
// nichts — so trägt jede Seite nur, was sie hat.
//
// Seiteneigenes bleibt inline: die Anlass-Personalisierung des Gruß-Heros
// steht in gruss.html.
// ─────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── „Laden"-Knopf in der Kopfzeile ─────────────────────────────────
  // Der Knopf trägt den App-Store-Link statisch im Markup — der gilt ohne
  // JavaScript und für Crawler. Meldet sich der Browser als Android, zeigt
  // er stattdessen auf Google Play; sonst schickte ein einzelner Knopf die
  // halbe Besucherschaft in den falschen Store. Bewusst nur das Link-Ziel:
  // KEIN Auto-Redirect (siehe Kommentar an den Store-Buttons im Hero).
  if (/Android/i.test(navigator.userAgent)) {
    var cta = document.getElementById("nav-store");
    if (cta) cta.href = "https://play.google.com/store/apps/details?id=de.tranbao.rentencountdown";
  }

  // Der Kopfzeilen-Knopf ruht, solange die Store-Knöpfe im Hero zu sehen
  // sind — dort wäre er nur eine dritte Kopie derselben Aufforderung. Der
  // negative rootMargin ist die Höhe der Kopfzeile: er schaltet in dem
  // Moment, in dem die Knöpfe unter ihr verschwinden, nicht erst danach.
  var kopf = document.querySelector(".masthead");
  var heroStores = document.querySelector(".hero .stores");
  if (kopf && heroStores && window.IntersectionObserver) {
    kopf.dataset.cta = "ruht";
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        kopf.dataset.cta = entry.isIntersecting ? "ruht" : "wach";
      });
    }, { rootMargin: "-62px 0px 0px 0px" }).observe(heroStores);
  }

  var stillPlease = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");

  // ── Omas Rechnung ──────────────────────────────────────────────────
  // Der Zettel trägt im Markup ein Beispiel, damit ohne JavaScript nichts
  // leer bleibt; hier wird daraus ein laufender Countdown. Das Datum ist
  // dasselbe wie auf dem Countdown-Screenshot weiter unten — die Seite
  // rechnet also dieselbe Rechnung vor, die die App zeigt.
  (function rechnung() {
    var ziel = new Date(2056, 0, 1);
    var elZahl = document.getElementById("rechnung-zahl");
    var elEinheit = document.getElementById("rechnung-einheit");
    var elRest = document.getElementById("rechnung-rest");
    if (!elZahl || !elEinheit || !elRest) return;

    var zahlwort = new Intl.NumberFormat("de-DE");

    // Dieselben Umrechnungen wie in der App. 220 Arbeitstage im Jahr ist
    // der deutsche Schnitt nach Wochenenden, Feiertagen und Urlaub — die
    // Größenordnung, die auch der Countdown-Screen zeigt.
    var einheiten = [
      { name: "Tage",              rechne: function (t) { return t; } },
      { name: "Montage",           rechne: function (t) { return Math.floor(t / 7); } },
      { name: "Arbeitstage",       rechne: function (t) { return Math.round(t / 365.25 * 220); } },
      { name: "Zeitumstellungen",  rechne: function (t) { return Math.floor(t / 365.25 * 2); } },
      { name: "Steuererklärungen", rechne: function (t) { return Math.floor(t / 365.25); } }
    ];
    var i = 0;

    function restTage() {
      return Math.max(0, Math.floor((ziel - new Date()) / 86400000));
    }

    function schreibe() {
      var e = einheiten[i];
      elZahl.textContent = zahlwort.format(e.rechne(restTage()));
      elEinheit.textContent = e.name;
    }

    function schreibeRest() {
      var ms = ziel - new Date();
      if (ms <= 0) { elRest.textContent = "— du hast es geschafft"; return; }
      var rest = ms % 86400000;
      var zwei = function (n) { return (n < 10 ? "0" : "") + n; };
      elRest.textContent =
        Math.floor(rest / 3600000) + " Std. " +
        zwei(Math.floor(rest % 3600000 / 60000)) + " Min. " +
        zwei(Math.floor(rest % 60000 / 1000)) + " Sek.";
    }

    schreibe();
    schreibeRest();
    setInterval(schreibeRest, 1000);

    // Der Einheiten-Wechsel ist der einzige animierte Teil der Seite — wer
    // Bewegung abbestellt hat, behält die Tage stehen und verliert nichts
    // an Aussage.
    if (!(stillPlease && stillPlease.matches)) {
      setInterval(function () {
        elZahl.style.opacity = elEinheit.style.opacity = "0";
        setTimeout(function () {
          i = (i + 1) % einheiten.length;
          schreibe();
          elZahl.style.opacity = elEinheit.style.opacity = "1";
        }, 260);
      }, 3400);
    }
  })();

  // ── Oma-Loops: Bewegung nur, wenn gewollt und sichtbar ──────────────
  // Beide Loops stehen unter der Falte und laden mit preload="none" — sie
  // werden erst geholt, wenn sie in Sicht kommen; wer nie so weit scrollt,
  // zahlt ihre Bytes nicht. Aus dem Bild gescrollte Loops pausieren wieder.
  //
  // prefers-reduced-motion hält beide an — die CSS-Regel dafür erreicht
  // Video-Wiedergabe nicht, sie stoppt nur Animationen und Transitions.
  // Es fehlt dann nichts außer der Bewegung: jeder Poster ist exakt der
  // erste Frame seines Loops.
  //
  // Dieselbe Mechanik wie in gruss.html, mit einem Unterschied im Markup:
  // dort steht ein Loop im Hero und trägt deshalb `autoplay`, damit er
  // auch ohne JavaScript läuft. Hier steht keiner über der Falte, also
  // tragen beide nur preload="none" und warten auf das Skript.
  var loops = document.querySelectorAll(".oma-loop");

  if (loops.length && stillPlease) {
    var each = function (fn) { Array.prototype.forEach.call(loops, fn); };

    var setLoopState = function () {
      each(function (v) {
        if (stillPlease.matches) {
          v.removeAttribute("autoplay");
          v.pause();
          v.currentTime = 0;
        } else if (v.dataset.inView === "1") {
          var started = v.play();
          if (started) started.catch(function () { /* Autoplay abgelehnt — Poster bleibt stehen. */ });
        }
      });
    };

    if (window.IntersectionObserver) {
      var watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var v = entry.target;
          v.dataset.inView = entry.isIntersecting ? "1" : "0";
          if (!entry.isIntersecting) { v.pause(); return; }
          // Erst jetzt laden — vorher stand preload="none" im Markup.
          if (v.preload === "none") { v.preload = "auto"; v.load(); }
        });
        setLoopState();
      }, { threshold: 0.25 });
      each(function (v) { watcher.observe(v); });
    } else {
      each(function (v) { v.dataset.inView = "1"; if (v.preload === "none") { v.preload = "auto"; v.load(); } });
      setLoopState();
    }

    if (stillPlease.addEventListener) stillPlease.addEventListener("change", setLoopState);
  }
})();
