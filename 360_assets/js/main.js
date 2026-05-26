(() => {
  const rootPath = window.SITE360_ROOT || "";
  const projectBasePath = window.SITE360_PROJECT_BASE || "360/";
  const excludeProjects = new Set(window.SITE360_EXCLUDE_PROJECTS || []);

  fetch(rootPath + "data.json")
    .then((res) => res.json())
    .then((data) => {
      const container = document.getElementById("project-list");
      if (!container) return;

      container.innerHTML = "";

      data.projects
        .filter((project) => !excludeProjects.has(project.id))
        .forEach((project) => {
        const card = document.createElement("a");
        card.className = "project-card";
        card.href = `${projectBasePath}${project.id}/`;
        card.setAttribute("aria-label", `Abrir ${project.name}`);

        const imgDiv = document.createElement("div");
        imgDiv.className = "project-image";
        imgDiv.style.backgroundImage = `url('${rootPath}${project.mainImage}')`;

        const overlay = document.createElement("div");
        overlay.className = "project-overlay";
        const icon = document.createElement("img");
        icon.src = rootPath + "img/360icon.webp";
        icon.alt = "360º";
        icon.className = "icon-360";
        overlay.appendChild(icon);
        imgDiv.appendChild(overlay);

        const info = document.createElement("div");
        info.className = "project-info";

        const title = document.createElement("div");
        title.className = "project-title";
        title.textContent = project.name;
        info.appendChild(title);

        const description = document.createElement("div");
        description.className = "project-description";
        description.textContent = `${project.rooms.length} espaços 360º`;
        info.appendChild(description);

        card.appendChild(imgDiv);
        card.appendChild(info);
        container.appendChild(card);
      });
    })
    .catch((error) => {
      const container = document.getElementById("project-list");
      if (container) container.textContent = "Não foi possível carregar os projetos 360º.";
      console.error(error);
    });
})();
