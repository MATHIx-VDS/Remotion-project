/* Infos à compléter : une seule fois ici, puis relancer l'export (node export.js).
   Tant qu'une valeur reste entre crochets, elle s'affiche encadrée en orange sur les visuels. */
window.INFOS = {
  LIEU: '[LIEU]',
  INSCRIPTION: '[INSCRIPTION]',
  TARIF: '[TARIF]',
};
document.querySelectorAll('[data-info]').forEach((el) => {
  const v = window.INFOS[el.dataset.info] || '';
  el.textContent = v;
  el.classList.toggle('ph', /^\[.*\]$/.test(v));
});
