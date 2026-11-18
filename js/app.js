/* 矿战史料馆 · 交互脚本（纯前端，可直接以 file:// 打开） */
(function () {
  "use strict";
  var EV = (window.MW_EVENTS || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  var PL = window.MW_PLACES || {}, TY = window.MW_TYPES || {}, CAT = window.MW_CATALOG || [], PERIODS = window.MW_PERIODS || {};
  var TC = { strike: "#d9a31c", violence: "#c8102e", state: "#4a4944", federal: "#1f4e79", court: "#6b3fa0", congress: "#2f6b4f", union: "#b5541c", press: "#0f0e0d" };
  var MON_EN = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  var lang = localStorageGet("mw-lang") || "zh";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function localStorageGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function localStorageSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function T(zh, en) { return lang === "zh" ? zh : en; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  /* 全文链接：站内全文 / 原始出处 / 版权期内不提供（附馆藏检索） */
  function openLink(a, title) {
    if (!a) return "";
    if (a.a === "site") return '<a href="' + esc(a.u) + '" target="_blank" rel="noopener" title="' + esc(T(a.wz, a.we)) + '">' + (a.u.indexOf("/releases/download/") >= 0 ? T("下载全文 PDF", "DOWNLOAD PDF") : T("打开全文", "OPEN FULL TEXT")) + "</a>";
    if (a.a === "ext") return '<a class="ext" href="' + esc(a.u) + '" target="_blank" rel="noopener" title="' + esc(T(a.wz, a.we)) + '">' + T("原始出处 ↗", "SOURCE ↗") + "</a>";
    if (a.we.indexOf("In copyright") !== 0) return '<span class="nof" title="' + esc(T(a.wz, a.we)) + '">' + T("本站未收", "NOT HOSTED") + "</span>";
    return '<a class="nof" href="https://search.worldcat.org/search?q=' + encodeURIComponent((title || "").replace(/[《》“”（）()]/g, " ")) + '" target="_blank" rel="noopener" title="' + esc(T(a.wz, a.we)) + '">' + T("版权期内 · 查馆藏 ↗", "IN COPYRIGHT · FIND A COPY ↗") + "</a>";
  }
  function ymd(s) { var a = s.split("-"); return { y: +a[0], m: +a[1], d: +a[2] }; }
  function monthIndex(s) { var d = ymd(s); return (d.y - 1912) * 12 + (d.m - 1); }
  function idxToYM(i) { var y = 1912 + Math.floor(i / 12), m = i % 12 + 1; return y + "-" + (m < 10 ? "0" : "") + m; }
  function dateLabel(e) {
    var d = ymd(e.date);
    if (e.prec === "year") return T(d.y + " 年", String(d.y));
    if (e.prec === "month") return T(d.y + " 年 " + d.m + " 月", MON_EN[d.m - 1] + " " + d.y);
    var s = T(d.y + " 年 " + d.m + " 月 " + d.d + " 日", d.d + " " + MON_EN[d.m - 1] + " " + d.y);
    if (e.end) { var x = ymd(e.end); s += T(" 至 " + (x.m !== d.m ? x.m + " 月 " : "") + x.d + " 日", " – " + x.d + " " + MON_EN[x.m - 1]); }
    return s;
  }
  function precLabel(e) { return e.prec === "day" ? T("精确到日", "to the day") : e.prec === "month" ? T("精确到月", "to the month") : T("精确到年", "to the year"); }
  function hl(text, words) {
    var out = esc(text);
    (words || []).slice().sort(function (a, b) { return b.length - a.length; }).forEach(function (w) {
      var re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
      out = out.replace(re, "<mark>$1</mark>");
    });
    return out;
  }

  /* ================= 语言 ================= */
  function setLang(l) {
    lang = l; document.documentElement.setAttribute("data-lang", l); document.documentElement.lang = l === "zh" ? "zh-CN" : "en"; localStorageSet("mw-lang", l);
    renderStats(); renderPresets(); renderChronFilter(); renderChron(); buildFilters(); renderArch(); bibFilters(); renderBib(); renderZh(); refreshMap(true);
    if (drawerId) openDrawer(drawerId, true);
  }
  $("#langBtn").addEventListener("click", function () { setLang(lang === "zh" ? "en" : "zh"); });

  /* ================= 首屏统计 ================= */
  function renderStats() {
    var shots = 0, texts = 0, photos = {};
    EV.forEach(function (e) { e.ev.forEach(function (x) { if (x.mode === "shot") shots++; else texts++; }); e.photos.forEach(function (p) { photos[p.img] = 1; }); });
    var prim = CAT.filter(function (c) { return c.ty[0] === "T"; }).length, sec = CAT.filter(function (c) { return c.ty[0] === "S"; }).length;
    var st = [[EV.length, T("事件", "EVENTS")], [Object.keys(PL).length, T("地点", "PLACES")], [prim, T("一手史料文件", "PRIMARY FILES")], [sec, T("研究文献", "SCHOLARSHIP")], [shots, T("红线史料截图", "MARKED PAGES")], [Object.keys(photos).length, T("历史照片", "PHOTOGRAPHS")]];
    $("#heroStats").innerHTML = st.map(function (s) { return '<div class="stat"><b>' + s[0] + "</b><span>" + s[1] + "</span></div>"; }).join("");
  }

  /* ================= 地图 ================= */
  var map = L.map("map", { minZoom: 4, maxZoom: 15, zoomSnap: 0.25, zoomDelta: 0.5, wheelPxPerZoomLevel: 90, attributionControl: true, maxBounds: [[14, -140], [58, -52]], maxBoundsViscosity: 0.8 });
  map.attributionControl.setPrefix(false);
  var blank = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  var TI = window.MW_TILES || {}, tset = {};
  Object.keys(TI).forEach(function (k) { var o = {}; TI[k].forEach(function (t) { o[t] = 1; }); tset[k] = o; });
  var IdxLayer = L.TileLayer.extend({ getTileUrl: function (c) { var z = this._getZoomForUrl(); return (tset[this.options.key] && !tset[this.options.key][z + "/" + c.x + "/" + c.y]) ? blank : L.TileLayer.prototype.getTileUrl.call(this, c); } });
  function tl(url, o) { return new IdxLayer(url, o); }
  var layers = {
    us: tl("tiles/us/{z}/{x}/{y}.webp", { key: "us", minZoom: 3, maxNativeZoom: 7, maxZoom: 15, errorTileUrl: blank, attribution: "Rand McNally / Y.M.C.A. Schools 1921 (LoC)" , bounds: [[22, -129], [53, -64]] }),
    wv: tl("tiles/wv/{z}/{x}/{y}.webp", { key: "wv", minZoom: 5, maxNativeZoom: 10, maxZoom: 15, errorTileUrl: blank, attribution: "Rand McNally 1913", bounds: [[36, -85], [41, -76]] }),
    tp: tl("tiles/topo/{z}/{x}/{y}.webp", { key: "topo", minZoom: 8, maxNativeZoom: 14, maxZoom: 15, errorTileUrl: blank, attribution: "USGS 1:62,500, 1909–24", bounds: [[37.25, -82.5], [38.5, -81.25]] })
  };
  layers.us.addTo(map); layers.wv.addTo(map); layers.tp.addTo(map);
  var ZONES = { 1: [[25, -124], [49.5, -67]], 2: [[37.1, -82.75], [40.7, -77.6]], 3: [[37.28, -82.48], [38.47, -81.28]],
    kanawha: [[38.04, -81.52], [38.27, -81.33]], march: [[37.83, -82.02], [38.27, -81.55]], blair: [[37.8, -82.04], [37.97, -81.76]], mingo: [[37.58, -82.31], [37.71, -82.11]], welch: [[37.39, -81.63], [37.47, -81.54]] };
  map.fitBounds(ZONES[3]);
  // 行军路线（示意）：马米特—伦斯溪—拉辛—佩托纳—麦迪逊—杰弗里—沙普尔斯—布莱尔—洛根
  var routePts = [[38.245, -81.570], [38.170, -81.600], [38.140, -81.660], [38.120, -81.700], [38.067, -81.819], [37.975, -81.820], [37.930, -81.830], [37.876, -81.833], [37.865, -81.870], [37.849, -81.993]];
  var route = L.layerGroup([L.polyline(routePts, { color: "#0f0e0d", weight: 9, opacity: 0.85 }), L.polyline(routePts, { color: "#e2231a", weight: 5, dashArray: "2 12", lineCap: "square" })]).addTo(map);

  function bind(id, fn) { $("#" + id).addEventListener("input", fn); $("#" + id).addEventListener("change", fn); }
  bind("lyUS", function (e) { e.target.checked ? layers.us.addTo(map) : map.removeLayer(layers.us); });
  bind("lyWV", function (e) { e.target.checked ? layers.wv.addTo(map) : map.removeLayer(layers.wv); order(); });
  bind("lyTP", function (e) { e.target.checked ? layers.tp.addTo(map) : map.removeLayer(layers.tp); order(); });
  bind("opWV", function (e) { layers.wv.setOpacity(e.target.value / 100); });
  bind("opTP", function (e) { layers.tp.setOpacity(e.target.value / 100); });
  bind("lyRoute", function (e) { e.target.checked ? route.addTo(map) : map.removeLayer(route); });
  bind("lyHeat", function () { drawHeat(); });
  function order() { layers.us.setZIndex(1); layers.wv.setZIndex(2); layers.tp.setZIndex(3); }
  order();
  $$(".map-levels > button").forEach(function (b) {
    b.addEventListener("click", function () {
      var l = +b.dataset.lvl; $$(".map-levels > button").forEach(function (x) { x.classList.toggle("on", x === b); });
      if (l >= 2 && !$("#lyWV").checked) { $("#lyWV").checked = true; layers.wv.addTo(map); }
      if (l === 3 && !$("#lyTP").checked) { $("#lyTP").checked = true; layers.tp.addTo(map); }
      order(); map.flyToBounds(ZONES[l], { duration: 1.1 });
    });
  });
  $$(".map-levels .sub button").forEach(function (b) { b.addEventListener("click", function () { map.flyToBounds(ZONES[b.dataset.zone], { duration: 1.0 }); }); });

  /* ---- 热力层 ---- */
  var heatCanvas = L.DomUtil.create("canvas", "heat-canvas");
  heatCanvas.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;z-index:350;mix-blend-mode:multiply";
  map.getPanes().overlayPane.appendChild(heatCanvas);
  function drawHeat() {
    var s = map.getSize(), tl = map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(heatCanvas, tl); heatCanvas.width = s.x; heatCanvas.height = s.y;
    var c = heatCanvas.getContext("2d"); c.clearRect(0, 0, s.x, s.y);
    if (!$("#lyHeat").checked) return;
    var z = map.getZoom(), k = Math.max(0.55, Math.min(1.9, (z - 4) / 6));
    Object.keys(agg).forEach(function (pk) {
      var a = agg[pk], p = PL[pk], pt = map.latLngToContainerPoint([p.lat, p.lon]);
      var n = a.n, r = Math.min(120, 16 + 6.5 * Math.sqrt(n)) * k, al = Math.min(0.78, 0.3 + n / 220);
      var g = c.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, r);
      g.addColorStop(0, "rgba(141,10,30," + al + ")"); g.addColorStop(0.45, "rgba(226,35,26," + al * 0.62 + ")"); g.addColorStop(0.8, "rgba(217,163,28," + al * 0.3 + ")"); g.addColorStop(1, "rgba(217,163,28,0)");
      c.fillStyle = g; c.beginPath(); c.arc(pt.x, pt.y, r, 0, 6.2832); c.fill();
    });
  }
  map.on("move zoom resize", drawHeat);

  /* ---- 标记 ---- */
  var markers = L.layerGroup().addTo(map), agg = {}, selPlace = null, range = [0, 203], fType = null;
  function inRange(e) { var i = monthIndex(e.date); return i >= range[0] && i <= range[1] && (!fType || e.type === fType); }
  function refreshMap(keepList) {
    agg = {};
    EV.filter(inRange).forEach(function (e) { var a = agg[e.place] || (agg[e.place] = { n: 0, ev: [] }); a.n += Math.max(1, e.n); a.ev.push(e); });
    markers.clearLayers();
    var z = map.getZoom();
    Object.keys(agg).forEach(function (pk) {
      var a = agg[pk], p = PL[pk], sz = Math.round(18 + 5 * Math.sqrt(a.ev.length) + (a.ev.length > 1 ? 4 : 0));
      var html = '<div class="pin' + (selPlace === pk ? " sel" : "") + '"><div class="d" style="width:' + sz + "px;height:" + sz + 'px"><span style="font-size:' + Math.round(sz * 0.55) + 'px">' + a.ev.length + "</span></div>" + (z >= 10 || (p.lvl === 1 && z < 7) || selPlace === pk ? '<div class="lab" style="transform:translate(' + (sz * 0.8 + 4) + 'px,-50%)">' + esc(T(p.zh, p.en)) + "</div>" : "") + "</div>";
      var m = L.marker([p.lat, p.lon], { icon: L.divIcon({ className: "", html: html, iconSize: [0, 0] }), riseOnHover: true });
      m.bindTooltip(T(p.zh, p.en) + " · " + a.ev.length + T(" 个事件 · ", " events · ") + a.n + T(" 件史料", " sources"), { className: "tt", direction: "top", offset: [0, -sz * 0.7] });
      m.on("click", function () { selPlace = selPlace === pk ? null : pk; refreshMap(); });
      markers.addLayer(m);
    });
    drawHeat(); renderSide(); drawHist();
    $("#tbFrom").textContent = idxToYM(range[0]); $("#tbTo").textContent = idxToYM(range[1]);
  }
  map.on("zoomend", function () { refreshMap(true); });

  function renderSide() {
    var list = EV.filter(inRange).filter(function (e) { return !selPlace || e.place === selPlace; });
    $("#sideCount").textContent = list.length;
    $("#sideList").innerHTML = list.length ? list.map(function (e) {
      var d = ymd(e.date), p = PL[e.place];
      return '<div class="side-item" data-id="' + e.id + '" style="--tc:' + TC[e.type] + '"><div class="dt">' + (e.prec === "year" ? d.y : (e.prec === "month" ? MON_EN[d.m - 1] : d.d + " " + MON_EN[d.m - 1])) + "<small>" + d.y + '</small></div><div><h5>' + esc(T(e.zt, e.et)) + "</h5><p>" + esc(T(p.zh, p.en)) + ' · <span class="cnt">' + e.n + "</span> " + T("件史料", "sources") + (e.verify ? " · " + T("日期待核", "date unverified") : "") + "</p></div></div>";
    }).join("") : '<div class="side-empty">' + T("这个时段内没有事件。拖动下方滑块，或点“全部”。", "No events in this range. Drag the slider below or choose “All”.") + "</div>";
    if (selPlace) $("#sideList").insertAdjacentHTML("afterbegin", '<div class="side-item" id="clearSel" style="--tc:#d9a31c"><div class="dt">×</div><div><h5>' + esc(T(PL[selPlace].zh, PL[selPlace].en)) + "</h5><p>" + T("点此取消地点筛选", "click to clear the place filter") + "</p></div></div>");
  }
  $("#sideList").addEventListener("click", function (ev) {
    var it = ev.target.closest(".side-item"); if (!it) return;
    if (it.id === "clearSel") { selPlace = null; refreshMap(); return; }
    openDrawer(it.dataset.id);
  });
  $("#sideList").addEventListener("mouseover", function (ev) {
    var it = ev.target.closest(".side-item[data-id]"); if (!it) return; var e = byId(it.dataset.id), p = PL[e.place];
    hoverRing.setLatLng([p.lat, p.lon]).addTo(map);
  });
  $("#sideList").addEventListener("mouseleave", function () { map.removeLayer(hoverRing); });
  var hoverRing = L.circleMarker([0, 0], { radius: 26, color: "#e2231a", weight: 5, fill: false, dashArray: "6 6" });
  function byId(id) { for (var i = 0; i < EV.length; i++) if (EV[i].id === id) return EV[i]; }
  function locate(e) {
    var p = PL[e.place]; document.getElementById("map-sec").scrollIntoView({ behavior: "smooth" });
    var zz = p.lvl === 1 ? 6 : p.lvl === 2 ? 9 : 12.5; map.flyTo([p.lat, p.lon], zz, { duration: 1.2 }); selPlace = e.place; refreshMap();
  }

  /* ================= 时间条 ================= */
  var rFrom = $("#rFrom"), rTo = $("#rTo");
  function setRange(a, b) { range = [Math.max(0, Math.min(a, b)), Math.min(203, Math.max(a, b))]; rFrom.value = range[0]; rTo.value = range[1]; refreshMap(); markPreset(); }
  rFrom.addEventListener("input", function () { if (+rFrom.value > +rTo.value) rFrom.value = rTo.value; setRange(+rFrom.value, +rTo.value); });
  rTo.addEventListener("input", function () { if (+rTo.value < +rFrom.value) rTo.value = rFrom.value; setRange(+rFrom.value, +rTo.value); });
  var PRESETS = [["all", "全部 1912—1928", "ALL 1912–1928", 0, 203], ["w1", "第一次矿战 1912—1914", "FIRST MINE WAR 1912–14", 0, 35], ["mid", "两次矿战之间 1915—1919", "BETWEEN THE WARS 1915–19", 36, 95],
    ["y20", "1920", "1920", 96, 107], ["y21", "1921", "1921", 108, 119], ["aug21", "1921 年 8—9 月", "AUG–SEP 1921", 115, 116], ["after", "余波 1922—1928", "AFTERMATH 1922–28", 120, 203]];
  function renderPresets() {
    $("#tbPresets").innerHTML = PRESETS.map(function (p) { return '<button data-k="' + p[0] + '">' + T(p[1], p[2]) + "</button>"; }).join("");
    markPreset();
    var ax = []; for (var y = 1912; y <= 1928; y += 2) ax.push("<span>" + y + "</span>"); $("#tbAxis").innerHTML = ax.join("");
  }
  function markPreset() { $$("#tbPresets button").forEach(function (b) { var p = PRESETS.filter(function (x) { return x[0] === b.dataset.k; })[0]; b.classList.toggle("on", p[3] === range[0] && p[4] === range[1]); }); }
  $("#tbPresets").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; var p = PRESETS.filter(function (x) { return x[0] === b.dataset.k; })[0]; stopPlay(); setRange(p[3], p[4]); });

  /* 直方图：全时段按月计史料数；选区高亮；选区不超过 4 个月时改按日显示 */
  var hist = $("#hist"), hctx = hist.getContext("2d"), histBins = [];
  function drawHist() {
    var w = hist.clientWidth, h = 110, dpr = window.devicePixelRatio || 1; hist.width = w * dpr; hist.height = h * dpr; hctx.setTransform(dpr, 0, 0, dpr, 0, 0); hctx.clearRect(0, 0, w, h);
    var daily = range[1] - range[0] <= 3, bins = [], i;
    if (daily) {
      var start = new Date(Date.UTC(1912 + Math.floor(range[0] / 12), range[0] % 12, 1)), end = new Date(Date.UTC(1912 + Math.floor((range[1] + 1) / 12), (range[1] + 1) % 12, 1)), nd = Math.round((end - start) / 864e5);
      for (i = 0; i < nd; i++) bins.push({ n: 0, ev: [], label: new Date(+start + i * 864e5).toISOString().slice(0, 10) });
      EV.forEach(function (e) { if (fType && e.type !== fType) return; var t = Date.parse(e.date + "T00:00:00Z"), k = Math.round((t - start) / 864e5); if (k >= 0 && k < nd) { bins[k].n += Math.max(1, e.n); bins[k].ev.push(e); } });
    } else {
      for (i = 0; i < 204; i++) bins.push({ n: 0, ev: [], label: idxToYM(i) });
      EV.forEach(function (e) { if (fType && e.type !== fType) return; var k = monthIndex(e.date); if (k >= 0 && k < 204) { bins[k].n += Math.max(1, e.n); bins[k].ev.push(e); } });
    }
    histBins = bins; hist._daily = daily;
    var ax = [], q;
    if (daily) { for (q = 0; q <= 4; q++) ax.push("<span>" + bins[Math.min(bins.length - 1, Math.round(q * (bins.length - 1) / 4))].label + "</span>"); }
    else { for (q = 1912; q <= 1928; q += 2) ax.push("<span>" + q + "</span>"); }
    $("#tbAxis").innerHTML = ax.join(""); $(".tb-sliders").style.opacity = daily ? 0.55 : 1;
    var mx = Math.max.apply(null, bins.map(function (b) { return b.n; }).concat([1])), bw = w / bins.length;
    hctx.fillStyle = "#e0d2b2"; hctx.fillRect(0, 0, w, h);
    if (!daily) { hctx.fillStyle = "rgba(200,16,46,.16)"; hctx.fillRect(range[0] * bw, 0, (range[1] - range[0] + 1) * bw, h); }
    hctx.strokeStyle = "rgba(15,14,13,.25)"; hctx.lineWidth = 1;
    bins.forEach(function (b, k) {
      var isYear = daily ? b.label.slice(8) === "01" : k % 12 === 0;
      if (isYear) { hctx.beginPath(); hctx.moveTo(k * bw + 0.5, 0); hctx.lineTo(k * bw + 0.5, h); hctx.stroke(); hctx.fillStyle = "#4a4944"; hctx.font = "600 11px Oswald, sans-serif"; hctx.fillText(daily ? b.label.slice(0, 7) : b.label.slice(0, 4), k * bw + 4, 12); }
      if (!b.n) return;
      var bh = Math.max(4, Math.sqrt(b.n / mx) * (h - 22)), on = daily || (k >= range[0] && k <= range[1]);
      hctx.fillStyle = on ? "#c8102e" : "#4a4944"; hctx.fillRect(k * bw + (daily ? 1 : 0.5), h - bh, Math.max(daily ? 3 : 1.5, bw - 1), bh);
      hctx.fillStyle = "#0f0e0d"; hctx.fillRect(k * bw + (daily ? 1 : 0.5), h - bh, Math.max(daily ? 3 : 1.5, bw - 1), 3);
    });
  }
  hist.addEventListener("mousemove", function (ev) {
    var r = hist.getBoundingClientRect(), k = Math.floor((ev.clientX - r.left) / r.width * histBins.length), b = histBins[k], tip = $("#histTip");
    if (!b) { tip.style.display = "none"; return; }
    tip.style.display = "block"; tip.style.left = (ev.clientX - r.left) + "px";
    tip.textContent = b.label + " · " + b.ev.length + T(" 事件 · ", " events · ") + b.n + T(" 件史料", " sources") + (b.ev.length ? " · " + T(b.ev[0].zt, b.ev[0].et) : "");
  });
  hist.addEventListener("mouseleave", function () { $("#histTip").style.display = "none"; });
  hist.addEventListener("click", function (ev) {
    var r = hist.getBoundingClientRect(), k = Math.floor((ev.clientX - r.left) / r.width * histBins.length), b = histBins[k]; if (!b) return; stopPlay();
    if (hist._daily) { if (b.ev.length) openDrawer(b.ev[0].id); } else setRange(k, k);
  });
  window.addEventListener("resize", drawHist);

  /* 逐事件播放 */
  var playTimer = null, playIdx = 0;
  function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; $("#playBtn").classList.remove("on"); } }
  $("#playBtn").addEventListener("click", function () {
    if (playTimer) { stopPlay(); return; }
    var list = EV.filter(function (e) { return !fType || e.type === fType; }); if (!list.length) return;
    playIdx = Math.max(0, list.findIndex(function (e) { return monthIndex(e.date) >= range[0]; }));
    $("#playBtn").classList.add("on");
    var step = function () {
      if (playIdx >= list.length) { stopPlay(); return; }
      var e = list[playIdx++], p = PL[e.place], i = monthIndex(e.date);
      selPlace = e.place; range = [i, i]; rFrom.value = i; rTo.value = i; refreshMap(); markPreset();
      map.flyTo([p.lat, p.lon], p.lvl === 1 ? 6 : p.lvl === 2 ? 8.5 : 11.5, { duration: 1.3 });
      var it = $('.side-item[data-id="' + e.id + '"]'); if (it) it.classList.add("hot");
    };
    step(); playTimer = setInterval(step, 3400);
  });

  /* ================= 年表 ================= */
  var PHASES = [["第一次矿战：潘特溪与卡宾溪", "THE FIRST MINE WAR: PAINT CREEK & CABIN CREEK", "1912—1914", 1912, 1914], ["间歇：战争、组织与禁令", "INTERLUDE: WAR, ORGANIZING, INJUNCTIONS", "1915—1919", 1915, 1919],
    ["第二次矿战：从马特万到布莱尔山", "THE SECOND MINE WAR: MATEWAN TO BLAIR MOUNTAIN", "1920—1921", 1920, 1921], ["审判与余波", "TRIALS & AFTERMATH", "1922—1928", 1922, 1928]];
  var chronType = null;
  function renderChronFilter() {
    var h = '<button data-t="" class="' + (chronType ? "" : "on") + '">' + T("全部类型", "ALL TYPES") + " · " + EV.length + "</button>";
    Object.keys(TY).forEach(function (k) { var n = EV.filter(function (e) { return e.type === k; }).length; h += '<button data-t="' + k + '" class="' + (chronType === k ? "on" : "") + '" style="--tc:' + TC[k] + '"><i></i>' + esc(T(TY[k].zh, TY[k].en)) + " · " + n + "</button>"; });
    $("#chronFilter").innerHTML = h;
  }
  $("#chronFilter").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; chronType = b.dataset.t || null; renderChronFilter(); renderChron(); });
  function thumbs(e) {
    var h = "", n = 0;
    e.photos.slice(0, 2).forEach(function (p) { h += '<div class="thumb ph" data-full="' + esc(p.img) + '" data-cap="' + esc(p.desc || p.file) + '"><img loading="lazy" src="' + esc(p.th || p.img) + '" alt=""><b>' + T("照片", "PHOTO") + "</b></div>"; n++; });
    e.ev.filter(function (x) { return x.mode === "shot"; }).slice(0, 5 - n).forEach(function (x) { h += '<div class="thumb ' + (x.kind === "secondary" ? "sec" : "") + '" data-full="' + esc(x.img) + '" data-cap="' + esc(T(x.zh, x.en) + " · " + x.loc) + '"><i class="ttl">' + esc(T(x.zh, x.en)) + '</i><img loading="lazy" src="' + esc(x.th || x.img) + '" alt="" onerror="this.style.display=\'none\'"><b>' + (x.kind === "secondary" ? T("研究", "STUDY") : T("史料", "SOURCE")) + "</b></div>"; });
    h += '<button class="more" data-id="' + e.id + '"><b>' + e.n + "</b>" + T("全部史料", "ALL SOURCES") + "</button>";
    return h;
  }
  function renderChron() {
    var out = "";
    PHASES.forEach(function (ph) {
      var list = EV.filter(function (e) { var y = +e.date.slice(0, 4); return y >= ph[3] && y <= ph[4] && (!chronType || e.type === chronType); });
      if (!list.length) return;
      out += '<div class="phase"><h3>' + T(ph[0], '<span class="en" style="display:inline!important">' + ph[1] + "</span>") + '</h3><span class="yr">' + ph[2] + "</span></div>";
      list.forEach(function (e) {
        var d = ymd(e.date), p = PL[e.place];
        out += '<article class="ev" id="ev-' + e.id + '" style="--tc:' + TC[e.type] + '"><div class="when"><div class="day">' + (e.prec === "day" ? d.d : e.prec === "month" ? MON_EN[d.m - 1] : "—") + '</div><div class="mon">' + (e.prec === "day" ? T(d.m + " 月", MON_EN[d.m - 1]) : "") + '</div><div class="yr">' + d.y + '</div><span class="prec">' + precLabel(e) + "</span></div>" +
          '<div class="card"><div class="meta"><span class="ty">' + esc(T(TY[e.type].zh, TY[e.type].en)) + '</span><span class="pl" data-loc="' + e.id + '">◆ ' + esc(T(p.zh, p.en)) + "</span>" + (e.end ? "<span>" + esc(dateLabel(e)) + "</span>" : "") + (e.verify ? '<span class="vf">' + T("日期待核", "DATE UNVERIFIED") + "</span>" : "") + "</div>" +
          "<h4>" + esc(T(e.zt, e.et)) + '</h4><p class="desc">' + esc(T(e.zd, e.ed)) + '</p><p class="basis">' + T("依据：", "Basis: ") + esc(e.basis) + '</p><div class="thumbs">' + thumbs(e) + "</div></div></article>";
      });
    });
    $("#chron").innerHTML = out || '<p style="font-family:var(--ui)">' + T("没有符合条件的事件。", "No events match.") + "</p>";
  }
  $("#chron").addEventListener("click", function (ev) {
    var m = ev.target.closest(".more"); if (m) { openDrawer(m.dataset.id); return; }
    var pl = ev.target.closest("[data-loc]"); if (pl) { locate(byId(pl.dataset.loc)); return; }
    var th = ev.target.closest(".thumb"); if (th) lightbox(th.dataset.full, th.dataset.cap);
  });

  /* ================= 事件详情 ================= */
  var drawerId = null;
  function openDrawer(id, silent) {
    var e = byId(id); if (!e) return; drawerId = id; var p = PL[e.place], h = "";
    h += '<div class="dw-date">' + esc(dateLabel(e)) + "<small>" + precLabel(e) + "</small></div>";
    h += '<h3 class="dw-title">' + esc(T(e.zt, e.et)) + '</h3><div class="dw-meta" style="--tc:' + TC[e.type] + '"><span class="ty">' + esc(T(TY[e.type].zh, TY[e.type].en)) + "</span><span>◆ " + esc(T(p.zh, p.en)) + "</span>" + (e.verify ? '<span class="vf">' + T("日期待核", "DATE UNVERIFIED") + "</span>" : "") + '<button data-loc="' + e.id + '">' + T("在地图上定位", "SHOW ON MAP") + "</button></div>";
    h += '<p class="dw-desc">' + esc(T(e.zd, e.ed)) + '</p><p class="dw-basis">' + T("年表依据：", "Basis for this entry: ") + esc(e.basis) + "</p>";
    if (e.photos.length) {
      h += '<div class="dw-h"><b>' + e.photos.length + "</b>" + T("历史照片", "PHOTOGRAPHS") + '</div><div class="photos">';
      e.photos.forEach(function (ph) { h += '<figure class="photo"><img loading="lazy" src="' + esc(ph.img) + '" data-full="' + esc(ph.img) + '" data-cap="' + esc(ph.desc || "") + '" alt=""><figcaption>' + esc(ph.desc || ph.file) + (ph.date ? " · " + esc(ph.date.replace(/date QS.*$/, "").replace(/^Taken on /, "")) : "") + (ph.lic ? " · " + esc(ph.lic) : "") + (ph.url ? ' · <a href="' + esc(ph.url) + '" target="_blank" rel="noopener">Wikimedia Commons</a>' : "") + "</figcaption></figure>"; });
      h += "</div>";
    }
    if (e.read && e.read.length) {
      var KN = { P: T("一手史料", "PRIMARY"), S: T("研究文献", "SCHOLARSHIP"), D: T("考辨", "DISCREPANCY") };
      h += '<div class="dw-h rd"><b>' + e.read.length + "</b>" + T("精读札记 · 已读原文", "CLOSE READING · READ IN THE ORIGINAL") + "</div>";
      h += '<p class="rd-lead">' + T("以下各条是读过原文段落后写的，说明每份文献对这件事说了什么、各家在哪里不一致。位置里的“PDF 第 N 页”是文件页序，引用前须翻到原页核对印刷页码。", "Each note below was written after reading the passage itself: what the source says about this event and where sources disagree. “PDF p. N” is the file's page order; check the printed page before citing.") + "</p>";
      e.read.forEach(function (x) {
        h += '<div class="rd-item k' + x.k + '"><div class="rd-head"><span class="rd-k">' + KN[x.k] + "</span>" + (x.k === "D" ? "" : "<b>" + esc(T(x.zh, x.en)) + "</b>" + (x.loc ? "<i>" + esc(x.loc) + "</i>" : "") + openLink(x.acc, x.en) + zhLink(x.acc, x.loc)) + '</div><p>' + esc(T(x.nz, x.ne)) + "</p></div>";
      });
      h += '<div class="dw-h"><b>' + e.ev.length + "</b>" + T("关键词机械匹配 · 未逐条核读", "KEYWORD MATCHES · NOT INDIVIDUALLY READ") + "</div>";
    }
    var groups = [["primary", T("一手史料", "PRIMARY SOURCES")], ["secondary", T("研究文献", "SCHOLARSHIP")]];
    groups.forEach(function (g) {
      var items = e.ev.filter(function (x) { return x.kind === g[0]; }); if (!items.length) return;
      h += '<div class="dw-h"><b>' + items.length + "</b>" + g[1] + "</div>";
      items.forEach(function (x) {
        var open = openLink(x.acc, x.en);
        if (x.mode === "shot") h += '<figure class="shot ' + (x.kind === "secondary" ? "sec" : "") + '"><img loading="lazy" src="' + esc(x.img) + '" data-full="' + esc(x.img) + '" data-cap="' + esc(T(x.zh, x.en) + " · " + x.loc) + '" alt=""><figcaption><b>' + esc(T(x.zh, x.en)) + "</b><i>" + esc(x.loc) + "</i><span>" + T("红线：", "marked: ") + esc((x.words || []).join(" + ")) + "</span>" + open + "</figcaption></figure>";
        else if (x.mode === "text") h += '<div class="txt"><blockquote>' + hl(x.text, x.words) + '</blockquote><div class="cap"><b>' + esc(T(x.zh, x.en)) + "</b>" + (x.loc ? "<i>" + esc(x.loc) + "</i>" : "") + open + "</div></div>";
        else h += '<div class="lnk"><span>' + esc(T(x.zh, x.en)) + "</span>" + open + "</div>";
      });
    });
    if (!e.ev.length && !e.photos.length) h += '<p class="dw-basis" style="margin-top:24px">' + T("史料包内没有按关键词匹配到这一事件的页面。", "No page in the collection matched this event's keywords.") + "</p>";
    $("#drawerContent").innerHTML = h; $("#drawer").classList.add("open"); $("#drawer").setAttribute("aria-hidden", "false");
    if (!silent) $(".drawer-body").scrollTop = 0;
  }
  function closeDrawer() { $("#drawer").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true"); drawerId = null; }
  $("#drawerShade").addEventListener("click", closeDrawer); $("#drawerX").addEventListener("click", closeDrawer);
  $("#drawerContent").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-loc]"); if (b) { var e = byId(b.dataset.loc); closeDrawer(); locate(e); return; }
    var im = ev.target.closest("img[data-full]"); if (im) lightbox(im.dataset.full, im.dataset.cap);
  });
  function lightbox(src, cap) { var lb = $("#lightbox"); $("img", lb).src = src; $(".lb-cap", lb).textContent = cap || ""; lb.classList.add("open"); }
  $("#lightbox").addEventListener("click", function () { $("#lightbox").classList.remove("open"); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { if ($("#lightbox").classList.contains("open")) $("#lightbox").classList.remove("open"); else closeDrawer(); } });

  /* ================= 检索库 ================= */
  var page = 0, PER = 40;
  var EXT_ZH = { pdf: "PDF", epub: "EPUB", html: "网页存档", txt: "文本", json: "文本", djvu: "DjVu", jpg: "图像", png: "图像", md: "说明" };
  function uniq(arr) { var s = {}; arr.forEach(function (x) { s[x] = (s[x] || 0) + 1; }); return s; }
  function buildFilters() {
    var keep = { fKind: $("#fKind").value, fType: $("#fType").value, fActor: $("#fActor").value, fPeriod: $("#fPeriod").value, fExt: $("#fExt").value, fSort: $("#fSort").value };
    function opts(first, map) { return '<option value="">' + first + "</option>" + map.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + "</option>"; }).join(""); }
    $("#fKind").innerHTML = opts(T("全部性质", "All kinds"), [["T", T("一手史料", "Primary sources")], ["S", T("研究文献", "Scholarship")], ["X", T("线索与参考", "Finding aids & reference")]]);
    var ty = uniq(CAT.map(function (c) { return c.ty; }));
    $("#fType").innerHTML = opts(T("全部类型", "All types"), Object.keys(ty).sort().map(function (k) { var c = CAT.filter(function (x) { return x.ty === k; })[0]; return [k, k + " " + T(c.tz, c.te) + "（" + ty[k] + "）"]; }));
    var ac = uniq(CAT.map(function (c) { return c.ac; }));
    $("#fActor").innerHTML = opts(T("全部生成主体", "All producers"), Object.keys(ac).map(function (k) { var c = CAT.filter(function (x) { return x.ac === k; })[0]; return [k, T(k, c.ae) + "（" + ac[k] + "）"]; }));
    $("#fPeriod").innerHTML = opts(T("全部时段", "All periods"), Object.keys(PERIODS).map(function (k) { return [k, PERIODS[k].replace("年以前", T("年以前", " and earlier")).replace("综合或后世", T("综合或后世", "General / later"))]; }));
    var ex = uniq(CAT.map(function (c) { return c.ext; }));
    $("#fExt").innerHTML = opts(T("全部载体", "All formats"), Object.keys(ex).sort().map(function (k) { return [k, (lang === "zh" ? (EXT_ZH[k] || k) : k.toUpperCase()) + "（" + ex[k] + "）"]; }));
    $("#fSort").innerHTML = [["rel", T("排序：相关度", "Sort: relevance")], ["ya", T("年代从早到晚", "Year, oldest first")], ["yd", T("年代从晚到早", "Year, newest first")], ["t", T("按题名", "By title")]].map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
    Object.keys(keep).forEach(function (k) { if (keep[k]) $("#" + k).value = keep[k]; });
  }
  function search() {
    var q = $("#q").value.trim().toLowerCase().split(/\s+/).filter(Boolean), kind = $("#fKind").value, ty = $("#fType").value, ac = $("#fActor").value, pe = $("#fPeriod").value, ex = $("#fExt").value, so = $("#fSort").value;
    var res = [];
    CAT.forEach(function (c) {
      if (kind && c.ty[0] !== kind) return; if (ty && c.ty !== ty) return; if (ac && c.ac !== ac) return; if (pe && c.pe !== pe) return; if (ex && c.ext !== ex) return;
      var hay = (c.t + " " + c.e + " " + (c.fn || "") + " " + c.note + " " + c.tz + " " + c.te + " " + c.ac + " " + c.ae + " " + (c.y || "")).toLowerCase(), score = 0;
      for (var i = 0; i < q.length; i++) { var k = hay.indexOf(q[i]); if (k < 0) return; score += ((c.t + " " + c.e).toLowerCase().indexOf(q[i]) >= 0 ? 5 : 1); }
      res.push([score, c]);
    });
    res.sort(function (a, b) {
      if (so === "ya") return (a[1].y || 9999) - (b[1].y || 9999); if (so === "yd") return (b[1].y || 0) - (a[1].y || 0); if (so === "t") return a[1].t.localeCompare(b[1].t);
      return b[0] - a[0] || (a[1].ty < b[1].ty ? -1 : a[1].ty > b[1].ty ? 1 : (a[1].y || 9999) - (b[1].y || 9999));
    });
    return res.map(function (r) { return r[1]; });
  }
  function renderArch() {
    var res = search(), pages = Math.max(1, Math.ceil(res.length / PER)); if (page >= pages) page = 0;
    $("#archCount").textContent = res.length;
    $("#archList").innerHTML = res.slice(page * PER, page * PER + PER).map(function (c) {
      var k = c.ty[0] === "T" ? "k1" : c.ty[0] === "S" ? "k2" : "k3";
      return '<div class="item"><div class="yy">' + (c.y || "—") + "<small>" + esc(c.ext) + '</small></div><div><h5>' + esc(T(c.t, c.e)) + '</h5><div class="tags"><span class="' + k + '">' + esc(c.ty + " " + T(c.tz, c.te)) + "</span><span>" + esc(T(c.ac, c.ae)) + "</span><span>" + esc(PERIODS[c.pe] || "") + "</span><span>" + c.mb + " MB</span></div>" + (c.note ? '<div class="path" style="color:#b9ae98;font-family:var(--ui);font-size:12.5px">' + esc(c.note) + "</div>" : "") + '<div class="path">' + esc(T(c.acc.wz, c.acc.we)) + '</div></div><span class="open">' + openLink(c.acc, c.e) + "</span></div>";
    }).join("") || '<p style="font-family:var(--ui);padding:20px 0;color:#d2c19b">' + T("没有符合条件的条目。换个词，或放宽筛选。", "Nothing matches. Try another word or loosen the filters.") + "</p>";
    var pg = "";
    if (pages > 1) for (var i = 0; i < pages; i++) { if (i < 2 || i > pages - 3 || Math.abs(i - page) < 3) pg += '<button data-p="' + i + '" class="' + (i === page ? "on" : "") + '">' + (i + 1) + "</button>"; else if (i === 2 || i === pages - 3) pg += "<span>…</span>"; }
    $("#pager").innerHTML = pg;
  }
  ["q", "fKind", "fType", "fActor", "fPeriod", "fExt", "fSort"].forEach(function (id) { $("#" + id).addEventListener("input", function () { page = 0; renderArch(); }); });
  $("#fReset").addEventListener("click", function () { $("#q").value = ""; ["fKind", "fType", "fActor", "fPeriod", "fExt"].forEach(function (id) { $("#" + id).value = ""; }); $("#fSort").value = "rel"; page = 0; renderArch(); });
  $("#pager").addEventListener("click", function (ev) { var b = ev.target.closest("button"); if (!b) return; page = +b.dataset.p; renderArch(); document.getElementById("arch-sec").scrollIntoView({ behavior: "smooth" }); });

  /* ================= 中译史料 ================= */
  var ZH = window.MW_ZH || [];
  function renderZh() {
    $("#zhBlock").style.display = ZH.length ? "" : "none";
    $("#zhList").innerHTML = ZH.map(function (z) { return '<a class="zh-card" href="' + esc(z.u) + '" target="_blank" rel="noopener"><b>' + z.y + "</b><span>" + esc(T(z.zh, z.en)) + "</span><i>" + T("约 " + Math.round(z.n / 1000) + " 千字", "c. " + Math.round(z.n / 1000) + "k characters") + "</i></a>"; }).join("");
  }
  /* 札记或史料条目如果有中译，给出跳到对应原页的链接 */
  function zhLink(acc, loc) {
    if (!acc || !acc.u) return "";
    for (var i = 0; i < ZH.length; i++) {
      var z = ZH[i]; if (!z.lib || acc.u.split("#")[0] !== z.lib) continue;
      var isPdf = /PDF/.test(loc || ""), m = isPdf ? null : (loc || "").match(/(\d{1,4})/), pg = m && z.pages.indexOf(m[1]) >= 0 ? "#p" + m[1] : "";   /* PDF 页序不等于印刷页码，不定位 */
      if (!pg && !isPdf && z.pages.length > 3) continue;   /* 长篇只在所引页码确有译文时才给链接 */
      return '<a class="zhl" href="' + esc(z.u + pg) + '" target="_blank" rel="noopener">' + T("中译", "CHINESE") + "</a>";
    }
    return "";
  }

  /* ================= 研究书目 ================= */
  var BIB = window.MW_BIBLIO || [], BT = window.MW_BIBTOPICS || {};
  function bibFilters() {
    var keep = { t: $("#bTopic").value, y: $("#bType").value, h: $("#bHave").value, s: $("#bSort").value || "topic" };
    function opts(first, list) { return '<option value="">' + first + "</option>" + list.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + "</option>"; }).join(""); }
    $("#bTopic").innerHTML = opts(T("全部主题", "All themes"), Object.keys(BT).map(function (k) { return [k, T(BT[k].zh, BT[k].en) + "（" + BIB.filter(function (b) { return b.tp === k; }).length + "）"]; }));
    var ty = {}; BIB.forEach(function (b) { ty[b.ty] = b.tz; });
    $("#bType").innerHTML = opts(T("全部类型", "All types"), Object.keys(ty).sort().map(function (k) { return [k, T(ty[k], k.replace(/-/g, " "))]; }));
    $("#bHave").innerHTML = opts(T("馆内与馆外", "Held or not"), [["1", T("馆内有全文", "Held in the collection")], ["0", T("馆内没有", "Not held")], ["u", T("题录待核", "Unverified entries")]]);
    $("#bSort").innerHTML = [["topic", T("按主题", "By theme")], ["new", T("年份由近到远", "Newest first")], ["old", T("年份由远到近", "Oldest first")], ["au", T("按作者", "By author")]].map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
    $("#bTopic").value = keep.t; $("#bType").value = keep.y; $("#bHave").value = keep.h; $("#bSort").value = keep.s;
  }
  function renderBib() {
    var q = $("#bq").value.trim().toLowerCase().split(/\s+/).filter(Boolean), ft = $("#bTopic").value, fy = $("#bType").value, fh = $("#bHave").value, so = $("#bSort").value;
    var res = BIB.filter(function (b) {
      if (ft && b.tp !== ft) return false; if (fy && b.ty !== fy) return false;
      if (fh === "1" && !b.have) return false; if (fh === "0" && b.have) return false; if (fh === "u" && b.v) return false;
      var hay = (b.au + " " + b.ti + " " + b.ve + " " + (b.y || "")).toLowerCase();
      return q.every(function (w) { return hay.indexOf(w) >= 0; });
    });
    if (so === "new") res.sort(function (a, b) { return (b.y || 0) - (a.y || 0); }); else if (so === "old") res.sort(function (a, b) { return (a.y || 9999) - (b.y || 9999); }); else if (so === "au") res.sort(function (a, b) { return a.au.localeCompare(b.au); });
    $("#bibCount").textContent = res.length;
    var h = "", last = null;
    res.forEach(function (b) {
      if (so === "topic" && b.tp !== last) { last = b.tp; h += '<h3 class="bib-h"><i>' + b.tp + "</i>" + esc(T(BT[b.tp].zh, BT[b.tp].en)) + "</h3>"; }
      var cite = (b.au ? esc(b.au) + ". " : "") + (b.ty === "book" ? "<em>" + esc(b.ti) + "</em>. " + esc(b.ve) : "“" + esc(b.ti) + ".” " + (b.ve ? "<em>" + esc(b.ve) + "</em>" : "") + (b.vol ? " " + esc(b.vol) : "") + (b.iss ? ", no. " + esc(b.iss) : "")) + (b.y ? (b.ty === "book" ? ", " : " (") + b.y + (b.ty === "book" ? "" : ")") : "") + (b.pp ? ": " + esc(b.pp) : "") + ".";
      var links = "";
      if (b.doi) links += '<a href="https://doi.org/' + esc(b.doi) + '" target="_blank" rel="noopener">DOI ↗</a>';
      else if (b.oa) links += '<a href="' + esc(b.oa) + '" target="_blank" rel="noopener">' + T("开放全文 ↗", "OPEN ACCESS ↗") + "</a>";
      if (b.acc && b.acc.a === "site") links += openLink(b.acc, b.ti);
      h += '<div class="bitem"><div class="by">' + (b.y || "—") + '</div><div><p class="cite">' + cite + '</p><div class="tags"><span class="ty">' + esc(T(b.tz, b.ty.replace(/-/g, " "))) + "</span>" + (b.have ? '<span class="hv">' + T("馆内", "HELD") + "</span>" : "") + (b.v ? "" : '<span class="uv">' + T("题录待核", "UNVERIFIED") + "</span>") + links + "</div></div></div>";
    });
    $("#bibList").innerHTML = h || '<p style="font-family:var(--ui);padding:20px 0">' + T("没有符合条件的条目。", "Nothing matches.") + "</p>";
  }
  ["bq", "bTopic", "bType", "bHave", "bSort"].forEach(function (id) { $("#" + id).addEventListener("input", renderBib); });

  /* ================= 启动 ================= */
  document.documentElement.setAttribute("data-lang", lang);
  renderStats(); renderPresets(); renderChronFilter(); renderChron(); buildFilters(); renderArch(); bibFilters(); renderBib(); renderZh(); refreshMap();
  setTimeout(function () { map.invalidateSize(); drawHist(); drawHeat(); }, 200);
})();
