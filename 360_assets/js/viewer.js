(() => {
  const rootPath = window.SITE360_ROOT || "";
  const fixedProjectId = window.SITE360_PROJECT_ID || null;

  function withRoot(path) {
    if (!path) return path;
    if (/^(https?:)?\/\//.test(path) || path.startsWith("/")) return path;
    return rootPath + path;
  }

  function getInitialParams(project) {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedImg = urlParams.get("img");
    const requestedTitle = urlParams.get("title");
    const firstRoom = project.rooms && project.rooms[0];

    return {
      img: requestedImg || (firstRoom ? firstRoom.file : null),
      title: requestedTitle || (firstRoom ? firstRoom.name : project.name),
    };
  }

  fetch(withRoot("data.json"))
    .then((response) => response.json())
    .then((data) => {
      const urlParams = new URLSearchParams(window.location.search);
      const projectId = fixedProjectId || urlParams.get("projectId");
      const currentProject = data.projects.find((p) => p.id === projectId);

      if (!currentProject) {
        document.body.innerHTML = '<div class="viewer-error">Projeto 360º não encontrado.</div>';
        return;
      }

      const { img } = getInitialParams(currentProject);
      if (!img) {
        document.body.innerHTML = '<div class="viewer-error">Este projeto ainda não tem salas configuradas.</div>';
        return;
      }

      document.title = currentProject.name;

      const switcherToggle = document.getElementById("room-switcher-toggle");
      const roomSwitcher = document.getElementById("room-switcher");

      if (switcherToggle && roomSwitcher) {
        switcherToggle.addEventListener("click", function (e) {
          e.stopPropagation();
          roomSwitcher.classList.toggle("open");
          switcherToggle.classList.toggle("open");
        });
        document.addEventListener("click", function () {
          roomSwitcher.classList.remove("open");
          switcherToggle.classList.remove("open");
        });
        roomSwitcher.addEventListener("click", function (e) {
          e.stopPropagation();
        });
      }

      const topviewImage = document.getElementById("topview-image");
      if (topviewImage && currentProject.topViewImage) topviewImage.src = withRoot(currentProject.topViewImage);

      const generateSceneId = (file) => file.replace(/\W/g, "_");

      const scenes = {};
      currentProject.rooms.forEach((room) => {
        const sceneId = generateSceneId(room.file);
        scenes[sceneId] = {
          title: room.name,
          panorama: withRoot("img/" + room.file),
          autoLoad: true,
          hotSpots: [],
        };
      });

      (currentProject.hotspots || []).forEach((hotspot) => {
        const fromId = generateSceneId(hotspot.from);
        const toId = generateSceneId(hotspot.to);
        if (scenes[fromId] && scenes[toId]) {
          scenes[fromId].hotSpots.push({
            pitch: hotspot.pitch,
            yaw: hotspot.yaw,
            type: "scene",
            text: hotspot.text,
            sceneId: toId,
          });
        }
      });

      const currentSceneId = generateSceneId(img);
      const firstScene = scenes[currentSceneId] ? currentSceneId : generateSceneId(currentProject.rooms[0].file);

      const viewer = pannellum.viewer("panorama", {
        default: {
          firstScene,
          sceneFadeDuration: 1000,
        },
        scenes,
      });

      if (roomSwitcher) {
        roomSwitcher.innerHTML = "";
        currentProject.rooms.forEach((room) => {
          const a = document.createElement("a");
          a.href = "#";
          a.textContent = room.name;
          if (generateSceneId(room.file) === firstScene) a.classList.add("active");
          a.addEventListener("click", (e) => {
            e.preventDefault();
            const sceneId = generateSceneId(room.file);
            viewer.loadScene(sceneId);
            Array.from(roomSwitcher.children).forEach((el) => el.classList.remove("active"));
            a.classList.add("active");
            roomSwitcher.classList.remove("open");
            if (switcherToggle) switcherToggle.classList.remove("open");
          });
          roomSwitcher.appendChild(a);
        });
      }

      const shareButton = document.getElementById("share-button");
      if (shareButton) {
        shareButton.onclick = function () {
          navigator.clipboard.writeText(window.location.href);
          const feedback = document.getElementById("share-feedback");
          if (feedback) {
            feedback.classList.add("visible");
            setTimeout(() => feedback.classList.remove("visible"), 1500);
          }
        };
      }

      viewer.on("scenechange", function (newSceneId) {
        const currentRoom = currentProject.rooms.find((room) => generateSceneId(room.file) === newSceneId);
        if (!currentRoom || !roomSwitcher) return;
        Array.from(roomSwitcher.children).forEach((a) => {
          a.classList.toggle("active", a.textContent === currentRoom.name);
        });
      });

      const topviewBtn = document.getElementById("topview-button");
      const topviewOverlay = document.getElementById("topview-overlay");
      const topviewHotspotsContainer = document.getElementById("topview-hotspots-container");

      if (topviewBtn && topviewOverlay && topviewHotspotsContainer && currentProject.topViewImage) {
        topviewHotspotsContainer.innerHTML = "";
        (currentProject.topViewHotspots || []).forEach((hotspot) => {
          const div = document.createElement("div");
          div.className = "topview-hotspot";
          div.style.left = hotspot.left;
          div.style.top = hotspot.top;
          div.dataset.target = hotspot.target;
          div.title = hotspot.title;
          topviewHotspotsContainer.appendChild(div);
        });

        topviewBtn.addEventListener("click", () => topviewOverlay.classList.toggle("active"));
        topviewOverlay.addEventListener("click", (e) => {
          if (e.target === topviewOverlay) topviewOverlay.classList.remove("active");
        });
        topviewOverlay.addEventListener("mousemove", (e) => {
          const x = (e.clientX / window.innerWidth - 0.5) * 2;
          const y = (e.clientY / window.innerHeight - 0.5) * 2;
          topviewImage.style.transform = `scale(1.02) translate(${x * 10}px, ${y * 10}px)`;
        });
        topviewHotspotsContainer.querySelectorAll(".topview-hotspot").forEach((hotspot) => {
          hotspot.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = hotspot.dataset.target;
            const sceneId = generateSceneId(target);
            if (scenes[sceneId]) {
              viewer.loadScene(sceneId);
              topviewOverlay.classList.remove("active");
            }
          });
        });
      } else if (topviewBtn) {
        topviewBtn.style.display = "none";
      }

      // ===== GALLERY & LIGHTBOX =====
      const renderFolder = currentProject.rooms[0].file.split("/")[0];
      const imagesFolder = withRoot("img/" + renderFolder + "/Imagens/");

      const imagesBtn = document.getElementById("images-button");
      const galleryOverlay = document.getElementById("gallery-overlay");
      const galleryGrid = document.getElementById("gallery-grid");
      const galleryClose = document.getElementById("gallery-close");
      const lightbox = document.getElementById("lightbox");
      const lightboxImg = document.getElementById("lightbox-img");
      const lightboxCaption = document.getElementById("lightbox-caption");
      const lightboxClose = document.getElementById("lightbox-close");
      const lightboxPrev = document.getElementById("lightbox-prev");
      const lightboxNext = document.getElementById("lightbox-next");
      const wrapper = document.getElementById("lightbox-img-wrapper");

      let galleryImages = [];
      let currentLightboxIndex = 0;
      let scale = 1, translateX = 0, translateY = 0, isDragging = false, startX = 0, startY = 0;

      if (currentProject.images && currentProject.images.length > 0) {
        galleryImages = currentProject.images.map((item) => ({
          src: imagesFolder + item.file,
          caption: item.caption || item.file.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        }));
        if (imagesBtn) imagesBtn.style.display = "";
      } else if (currentProject.hasImages && currentProject.imagesFiles) {
        galleryImages = currentProject.imagesFiles.map((f) => ({
          src: imagesFolder + f,
          caption: f.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
        }));
        if (imagesBtn) imagesBtn.style.display = "";
      }

      function buildGallery() {
        galleryGrid.innerHTML = "";
        galleryImages.forEach((image, index) => {
          const item = document.createElement("div");
          item.className = "gallery-item";
          const imgEl = document.createElement("img");
          imgEl.src = image.src;
          imgEl.alt = image.caption;
          imgEl.loading = "lazy";
          imgEl.addEventListener("click", () => openLightbox(index));
          item.appendChild(imgEl);
          const cap = document.createElement("div");
          cap.className = "gallery-item-caption";
          cap.textContent = image.caption;
          item.appendChild(cap);
          galleryGrid.appendChild(item);
        });
      }

      function resetZoom() {
        scale = 1; translateX = 0; translateY = 0;
        lightboxImg.style.transform = "scale(1)";
        wrapper.style.cursor = "default";
      }
      function applyTransform() { lightboxImg.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`; }
      function openLightbox(index) { currentLightboxIndex = index; updateLightbox(); lightbox.classList.add("active"); }
      function closeLightbox() { lightbox.classList.remove("active"); resetZoom(); }
      function updateLightbox() {
        const image = galleryImages[currentLightboxIndex];
        lightboxImg.src = image.src;
        lightboxImg.alt = image.caption;
        lightboxCaption.textContent = image.caption + " (" + (currentLightboxIndex + 1) + " / " + galleryImages.length + ")";
        resetZoom();
        lightboxPrev.style.display = galleryImages.length > 1 ? "" : "none";
        lightboxNext.style.display = galleryImages.length > 1 ? "" : "none";
      }

      if (imagesBtn && galleryOverlay && galleryGrid && galleryImages.length) {
        lightboxPrev.addEventListener("click", (e) => { e.stopPropagation(); currentLightboxIndex = (currentLightboxIndex - 1 + galleryImages.length) % galleryImages.length; updateLightbox(); });
        lightboxNext.addEventListener("click", (e) => { e.stopPropagation(); currentLightboxIndex = (currentLightboxIndex + 1) % galleryImages.length; updateLightbox(); });
        lightboxClose.addEventListener("click", closeLightbox);
        lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
        document.addEventListener("keydown", (e) => {
          if (lightbox.classList.contains("active")) {
            if (e.key === "Escape") closeLightbox();
            if (e.key === "ArrowLeft") lightboxPrev.click();
            if (e.key === "ArrowRight") lightboxNext.click();
          }
          if (e.key === "Escape" && galleryOverlay.classList.contains("active")) galleryOverlay.classList.remove("active");
        });
        wrapper.addEventListener("wheel", (e) => { e.preventDefault(); scale = Math.min(Math.max(1, scale + (e.deltaY < 0 ? 0.2 : -0.2)), 6); if (scale === 1) { translateX = 0; translateY = 0; } applyTransform(); wrapper.style.cursor = scale > 1 ? "grab" : "default"; }, { passive: false });
        wrapper.addEventListener("mousedown", (e) => { if (scale <= 1) return; isDragging = true; startX = e.clientX - translateX * scale; startY = e.clientY - translateY * scale; wrapper.style.cursor = "grabbing"; });
        window.addEventListener("mousemove", (e) => { if (!isDragging) return; translateX = (e.clientX - startX) / scale; translateY = (e.clientY - startY) / scale; applyTransform(); });
        window.addEventListener("mouseup", () => { isDragging = false; if (scale > 1) wrapper.style.cursor = "grab"; });
        wrapper.addEventListener("dblclick", () => { if (scale > 1) resetZoom(); else { scale = 2.5; applyTransform(); wrapper.style.cursor = "grab"; } });
        let lastTouchDist = null;
        wrapper.addEventListener("touchstart", (e) => { if (e.touches.length === 2) lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
        wrapper.addEventListener("touchmove", (e) => { if (e.touches.length === 2 && lastTouchDist) { const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); scale = Math.min(Math.max(1, scale * (dist / lastTouchDist)), 6); lastTouchDist = dist; if (scale === 1) { translateX = 0; translateY = 0; } applyTransform(); } }, { passive: true });
        wrapper.addEventListener("touchend", () => { lastTouchDist = null; });
        imagesBtn.addEventListener("click", () => { buildGallery(); galleryOverlay.classList.add("active"); });
        galleryClose.addEventListener("click", () => galleryOverlay.classList.remove("active"));
        galleryOverlay.addEventListener("click", (e) => { if (e.target === galleryOverlay) galleryOverlay.classList.remove("active"); });
      }
    })
    .catch((error) => {
      document.body.innerHTML = '<div class="viewer-error">Não foi possível carregar este projeto 360º.</div>';
      console.error(error);
    });
})();
