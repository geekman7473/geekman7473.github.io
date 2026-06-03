// Builds a sticky left-margin Table of Contents for blog posts.
// Walks .post h1/h2/h3 (with ids), wires scrollspy highlighting via
// IntersectionObserver, and stays out of the way on narrow viewports
// (CSS hides the aside under 1200px).
(function () {
  var aside = document.getElementById('post-toc');
  if (!aside) return;
  var nav = aside.querySelector('.post-toc__nav');
  var post = document.querySelector('section.post');
  if (!nav || !post) return;

  var headings = Array.prototype.slice.call(
    post.querySelectorAll('h1[id], h2[id], h3[id]')
  );
  if (headings.length < 2) return; // not worth showing for tiny posts

  // Normalize: treat the first h1 (if any) as the only L1; otherwise use h2 as L1.
  var hasH1 = headings.some(function (h) { return h.tagName === 'H1'; });
  var ul = document.createElement('ul');
  ul.className = 'post-toc__list';
  var lastL1Item = null;
  var lastL1Sub = null;

  headings.forEach(function (h) {
    var level = h.tagName === 'H1' ? 1 : (h.tagName === 'H2' ? (hasH1 ? 2 : 1) : (hasH1 ? 3 : 2));
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    a.dataset.tocTarget = h.id;

    var li = document.createElement('li');
    li.className = 'post-toc__item post-toc__item--l' + level;
    li.appendChild(a);

    if (level === 1) {
      ul.appendChild(li);
      lastL1Item = li;
      lastL1Sub = null;
    } else {
      var parent = lastL1Item || ul;
      if (parent === ul) {
        ul.appendChild(li);
      } else {
        if (!lastL1Sub) {
          lastL1Sub = document.createElement('ul');
          lastL1Sub.className = 'post-toc__sublist';
          lastL1Item.appendChild(lastL1Sub);
        }
        lastL1Sub.appendChild(li);
      }
    }
  });

  nav.appendChild(ul);
  aside.hidden = false;

  // Scrollspy: highlight the heading nearest the top of the viewport.
  var linkById = {};
  nav.querySelectorAll('a[data-toc-target]').forEach(function (a) {
    linkById[a.dataset.tocTarget] = a;
  });

  var visible = new Set();
  function updateActive() {
    // Pick the topmost visible heading; if none, the last one above the fold.
    var pick = null;
    if (visible.size > 0) {
      var arr = Array.from(visible);
      arr.sort(function (a, b) { return a.getBoundingClientRect().top - b.getBoundingClientRect().top; });
      pick = arr[0];
    } else {
      // Fallback: nearest heading above current scroll position.
      var scrollY = window.scrollY + 80;
      for (var i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= scrollY) pick = headings[i];
        else break;
      }
    }
    Object.keys(linkById).forEach(function (id) {
      linkById[id].classList.toggle('is-active', !!pick && pick.id === id);
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target);
        else visible.delete(e.target);
      });
      updateActive();
    }, { rootMargin: '0px 0px -70% 0px', threshold: 0 });
    headings.forEach(function (h) { io.observe(h); });
  }

  updateActive();
  window.addEventListener('hashchange', updateActive);
})();
