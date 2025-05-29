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
    }, 500); // Adjust delay for fade-out effect
});