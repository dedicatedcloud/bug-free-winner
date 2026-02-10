/* Simple progressive enhancement script */
(function () {
  const out = document.querySelector("#js-status");
  if (out) {
    out.textContent = "JavaScript loaded ✓";
    out.setAttribute("aria-live", "polite");
  }

  // Example: simple client-side nav highlighter
  const here = location.pathname.replace(/\/+$/,'') || '/';
  document.querySelectorAll('.nav a[href]').forEach(a=>{
    const target = a.getAttribute('href').replace(/\/+$/,'') || '/';
    if (target === here) a.setAttribute('aria-current','page');
  });
})();
