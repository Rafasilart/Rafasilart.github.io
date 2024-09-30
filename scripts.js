document.addEventListener("DOMContentLoaded", () => {
    const projectLinks = document.querySelectorAll('.project-link');

    const options = {
        root: null, // Usa a viewport do navegador
        rootMargin: '0px',
        threshold: 0.1 // Ativa quando 10% do elemento está visível
    };

    const callback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Para não observar novamente
            }
        });
    };

    const observer = new IntersectionObserver(callback, options);
    projectLinks.forEach(link => observer.observe(link));
});
