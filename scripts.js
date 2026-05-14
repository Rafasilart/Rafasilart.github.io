document.addEventListener("DOMContentLoaded", function() {
    const backToTop = document.querySelector(".back-to-top");
  
    window.addEventListener("scroll", function() {
      if (window.scrollY > 200) {
        backToTop.style.display = "block";
      } else {
        backToTop.style.display = "none";
      }
    });
  
    backToTop.addEventListener("click", function() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

window.addEventListener("load", function() {
    const preloader = document.querySelector(".preloader");
    preloader.style.opacity = "0";
    setTimeout(() => {
        preloader.style.display = "none";
    }, 500);

    /* FIX: o browser faz scroll para #Focus antes do CSS carregar, causando
       layout desformatado em mobile. Cancelar o scroll automático do browser
       e só fazer scroll depois de tudo estar renderizado corretamente. */
    const hash = window.location.hash;
    if (hash) {
        window.scrollTo(0, 0);
        setTimeout(() => {
            const target = document.querySelector(hash);
            if (target) {
                target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("#nav-links a");
    const currentPath = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const linkPath = link.getAttribute("href").split("/").pop();
        if (linkPath === currentPath || (linkPath === "index.html" && currentPath === "")) {
            link.classList.add("active");
        }
    });
});
