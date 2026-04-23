// Minimal: just stamp the year. No nav toggle, no smooth-scroll JS,
// no analytics. The page is hand-written HTML; treat it that way.
const year = document.querySelector('#year');
if (year) {
  year.textContent = new Date().getFullYear();
}
