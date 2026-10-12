/* ============================================================
   Remplit les morceaux communs à toutes les pages depuis site.json.
   Dans le HTML, un élément avec data-site="..." est rempli ici :
     nav     → la navbar           facts   → les infos perso
     footer  → le pied de page     socials → la liste des réseaux
     email   → l'adresse e-mail (lien mailto)
   Les liens du JSON sont relatifs à la racine du site.
   ============================================================ */
(function () {
    'use strict';

    // Racine du site = dossier de ce script, quelle que soit la page
    var base = document.currentScript.src.replace(/site\.js(\?.*)?$/, '');

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text) e.textContent = text;
        return e;
    }

    function icon(name, color, small) {
        var s = el('span', 'pxi' + (small ? ' small' : '') + (color ? ' ' + color : '') + ' pxi-' + name);
        s.setAttribute('aria-hidden', 'true');
        return s;
    }

    // Compare deux adresses sans tenir compte de « index.html »
    function samePage(a, b) {
        function clean(u) { return decodeURI(new URL(u, location.href).pathname).replace(/index\.html$/, ''); }
        return clean(a) === clean(b);
    }

    function fillNav(nav, data) {
        nav.textContent = '';
        var title = el('p', 'panel-title');
        title.appendChild(icon('menu'));
        title.appendChild(document.createTextNode(data.titre));
        nav.appendChild(title);

        var ul = el('ul');
        data.liens.forEach(function (l) {
            var a = el('a');
            a.href = base + l.lien;
            if (samePage(a.href, location.href)) a.setAttribute('aria-current', 'page');
            a.appendChild(icon(l.icone, l.couleur));
            a.appendChild(document.createTextNode(l.texte));
            var li = el('li');
            li.appendChild(a);
            ul.appendChild(li);
        });
        nav.appendChild(ul);
    }

    function fillFacts(ul, infos) {
        ul.textContent = '';
        infos.forEach(function (f) {
            var li = el('li');
            li.appendChild(icon(f.icone, f.couleur, true));
            li.appendChild(document.createTextNode(f.texte));
            ul.appendChild(li);
        });
    }

    function fillSocials(ul, reseaux) {
        ul.textContent = '';
        reseaux.forEach(function (r) {
            var a = el('a', 'link-row');
            a.href = r.lien;
            if (!/^mailto:/.test(r.lien)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            a.appendChild(icon(r.icone, r.couleur));
            var label = el('span', 'label');
            label.appendChild(el('b', '', r.nom));
            label.appendChild(el('span', '', r.detail));
            a.appendChild(label);
            var li = el('li');
            li.appendChild(a);
            ul.appendChild(li);
        });
    }

    function fillFooter(footer, liens) {
        footer.textContent = '';
        liens.forEach(function (l, i) {
            if (i) footer.appendChild(document.createTextNode(' · '));
            var a = el('a', '', l.texte);
            a.href = base + l.lien;
            footer.appendChild(a);
        });
    }

    function each(name, fn) {
        Array.prototype.forEach.call(document.querySelectorAll('[data-site="' + name + '"]'), fn);
    }

    fetch(base + 'site.json', { cache: 'no-cache' })
        .then(function (r) { return r.json(); })
        .then(function (site) {
            each('nav', function (n) { fillNav(n, site.navbar); });
            each('facts', function (n) { fillFacts(n, site.infos); });
            each('socials', function (n) { fillSocials(n, site.reseaux); });
            each('footer', function (n) { fillFooter(n, site.piedDePage); });
            each('email', function (n) { n.textContent = site.email; n.href = 'mailto:' + site.email; });

            // "ocean" = scène pixel art, autre valeur = ancien dégradé
            if (site.fond === 'ocean') {
                document.documentElement.classList.add('has-ocean');
                var s = document.createElement('script');
                s.src = base + 'ocean.js';
                document.body.appendChild(s);
            }
        })
        .catch(function (e) { console.error('site.json illisible :', e); });
})();
