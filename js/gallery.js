(function () {
  const DIR = "assets/gallery/";
  const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
  const items = (typeof MEDIA !== "undefined" ? MEDIA : []).map(n => ({
    name: n, url: DIR + encodeURIComponent(n), video: VIDEO.test(n)
  }));

  const $ = id => document.getElementById(id);
  const grid = $("grid"), lb = $("lb"), stage = $("stage"), dlAll = $("dlAll");
  let cur = 0, media = null, lastFocus = null;

  if (!items.length) { $("empty").hidden = false; return; }
  const photos = items.filter(i => !i.video).length, videos = items.length - photos;
  $("count").textContent = [photos && photos + " фото", videos && videos + " видео"].filter(Boolean).join(", ");
  dlAll.hidden = false;

  items.forEach((it, i) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tile"; b.setAttribute("aria-label", "Открыть " + it.name);
    if (it.video) {
      b.innerHTML = '<video preload="metadata" muted playsinline src="' + it.url + '#t=0.5"></video><span class="badge">Видео</span>';
    } else {
      b.innerHTML = '<img loading="lazy" alt="" src="' + it.url + '">';
    }
    b.addEventListener("click", () => open(i));
    grid.appendChild(b);
  });

  function show() {
    const it = items[cur];
    if (media) media.remove();
    media = document.createElement(it.video ? "video" : "img");
    media.src = it.url;
    if (it.video) { media.controls = true; media.autoplay = true; media.playsInline = true; }
    else media.alt = it.name;
    stage.appendChild(media);
    $("lbCount").textContent = (cur + 1) + " из " + items.length;
    $("lbName").textContent = it.name;
    const a = $("lbDl"); a.href = it.url; a.setAttribute("download", it.name);
  }
  function open(i) { lastFocus = document.activeElement; cur = i; lb.classList.add("open"); document.body.style.overflow = "hidden"; show(); $("lbClose").focus(); }
  function close() {
    lb.classList.remove("open"); document.body.style.overflow = "";
    if (media) { media.remove(); media = null; }
    if (lastFocus) lastFocus.focus();
  }
  function go(d) { cur = (cur + d + items.length) % items.length; show(); }

  $("lbClose").onclick = close;
  $("prev").onclick = () => go(-1);
  $("next").onclick = () => go(1);
  lb.addEventListener("click", e => { if (e.target === lb || e.target === stage) close(); });
  document.addEventListener("keydown", e => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") go(-1);
    else if (e.key === "ArrowRight") go(1);
  });
  let sx = null;
  stage.addEventListener("touchstart", e => { sx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
  });

  // Скачать всё одним ZIP-архивом
  dlAll.addEventListener("click", async () => {
    const label = dlAll.textContent; dlAll.disabled = true;
    try {
      if (typeof JSZip === "undefined") throw new Error("no jszip");
      const zip = new JSZip();
      for (let i = 0; i < items.length; i++) {
        dlAll.textContent = "Собираю " + (i + 1) + " из " + items.length + "…";
        const r = await fetch(items[i].url);
        if (!r.ok) throw new Error(items[i].name);
        zip.file(items[i].name, await r.blob(), { compression: "STORE" });
      }
      dlAll.textContent = "Готовлю архив…";
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "plus-minus-8-foto-video.zip";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) {
      alert("Не удалось собрать архив. Скачайте файлы по одному: откройте файл и нажмите «Скачать». Проблемный файл: " + (err.message || ""));
    } finally { dlAll.textContent = label; dlAll.disabled = false; }
  });
})();
