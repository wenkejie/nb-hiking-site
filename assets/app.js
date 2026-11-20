/* ==========================================================================
   宁波徒步图鉴 · 交互逻辑
   ========================================================================== */

(function () {
  "use strict";

  var DATA = window.ROUTES || [];

  /* ---------------------------------------------------------------- 图标 */

  var ICON = {
    ruler:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="1" y="6" width="14" height="4" fill="#b07c43"/>' +
      '<rect x="3" y="4" width="1" height="8" fill="#5b3a1e"/>' +
      '<rect x="7" y="4" width="1" height="8" fill="#5b3a1e"/>' +
      '<rect x="11" y="4" width="1" height="8" fill="#5b3a1e"/>' +
      '<rect x="1" y="6" width="14" height="1" fill="#d9a869"/></svg>',
    clock:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="3" y="2" width="10" height="12" fill="#fdf4e0" stroke="#5b3a1e" stroke-width="2"/>' +
      '<rect x="7" y="4" width="2" height="5" fill="#5b3a1e"/>' +
      '<rect x="8" y="8" width="4" height="2" fill="#5b3a1e"/></svg>',
    mountain:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<polygon points="1,14 6,4 9,9 11,6 15,14" fill="#5f8c37"/>' +
      '<polygon points="4,7 6,4 8,7" fill="#fdf4e0"/>' +
      '<rect x="1" y="14" width="14" height="2" fill="#4c7329"/></svg>',
    slope:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<polygon points="1,14 15,14 15,4" fill="#c4452f"/>' +
      '<polygon points="1,14 15,14 15,9" fill="#e07a4a"/>' +
      '<rect x="1" y="14" width="14" height="2" fill="#5b3a1e"/></svg>',
    pin:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<rect x="5" y="1" width="6" height="2" fill="#c4452f"/>' +
      '<rect x="4" y="3" width="8" height="4" fill="#c4452f"/>' +
      '<rect x="5" y="7" width="6" height="2" fill="#c4452f"/>' +
      '<rect x="6" y="9" width="4" height="2" fill="#c4452f"/>' +
      '<rect x="7" y="11" width="2" height="3" fill="#98311f"/>' +
      '<rect x="6" y="3" width="4" height="3" fill="#fdf4e0"/></svg>',
    track:
      '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" aria-hidden="true">' +
      '<path d="M2 12h3V8h3V4h5" fill="none" stroke="#5b3a1e" stroke-width="2"/>' +
      '<rect x="1" y="11" width="3" height="3" fill="#6ba84f"/>' +
      '<rect x="12" y="2" width="3" height="3" fill="#c4452f"/></svg>'
  };

  var STAR_PATH =
    "M8 0.5 L10.1 5.4 L15.4 5.4 L11.1 8.7 L12.7 13.9 L8 10.9 L3.3 13.9 L4.9 8.7 L0.6 5.4 L5.9 5.4 Z";

  function starRow(score) {
    var html = '<span class="stars" aria-label="难度 ' + score + ' 星">';
    for (var i = 0; i < 4; i++) {
      var fill = Math.max(0, Math.min(1, score - i));
      var pct = Math.round(fill * 100);
      html +=
        '<span class="star">' +
        '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="' + STAR_PATH +
        '" fill="#d6c2a2" stroke="#a08863" stroke-width="1"/></svg>' +
        (pct > 0
          ? '<span class="star-fg" style="width:' + pct + '%">' +
            '<svg viewBox="0 0 16 16" shape-rendering="crispEdges"><path d="' + STAR_PATH +
            '" fill="#e8b33d" stroke="#a9741a" stroke-width="1"/></svg></span>'
          : "") +
        "</span>";
    }
    return html + "</span>";
  }

  /* ------------------------------------------------------------ 派生字段 */

  var TIERS = [
    { max: 1.5, label: "轻松", color: "#6ba84f", deep: "#4a7c2f" },
    { max: 2.5, label: "中等", color: "#dda03a", deep: "#b07c1e" },
    { max: 3.5, label: "较难", color: "#cd6334", deep: "#9c4520" },
    { max: 9,   label: "困难", color: "#8b4a86", deep: "#66325f" }
  ];

  function tierOf(score) {
    for (var i = 0; i < TIERS.length; i++) if (score <= TIERS[i].max) return TIERS[i];
    return TIERS[TIERS.length - 1];
  }

  var TAG_RULES = [
    { key: "瀑布", re: /瀑|潭/ },
    { key: "古道", re: /古道/ },
    { key: "赏花", re: /樱花|梨花|桃花/ },
    { key: "风车", re: /风车/ },
    { key: "水库", re: /水库/ },
    { key: "禅寺", re: /寺|庵|禅/ },
    { key: "溯溪", re: /溯溪/ },
    { key: "海岸", re: /海岸|沙滩/ }
  ];

  function tagsOf(name) {
    var out = [];
    for (var i = 0; i < TAG_RULES.length; i++) {
      if (TAG_RULES[i].re.test(name)) out.push(TAG_RULES[i].key);
    }
    return out;
  }

  function typeOf(name) {
    if (/穿越/.test(name)) return "穿越线";
    if (/8字/.test(name)) return "8 字环线";
    if (/小环/.test(name)) return "小环线";
    if (/爱心线/.test(name)) return "爱心线";
    if (/环线/.test(name)) return "环线";
    return "线路";
  }

  /* 预处理 */
  DATA.forEach(function (r) {
    r.tier = tierOf(r.stars);
    r.tags = tagsOf(r.name);
    r.type = typeOf(r.name);
    r.density = Math.round((r.ascent / r.km) * 10) / 10;
  });

  var MAX_DENSITY = DATA.reduce(function (m, r) { return Math.max(m, r.density); }, 0);

  /* ---------------------------------------------------------------- 状态 */

  var LS_DONE = "nbhike.done.v2";
  var LS_FAV = "nbhike.fav.v2";

  /* v1 存的是序号 id，数据扩充后序号会变，故改存轨迹号；
     这里保留一张旧序号 -> 轨迹号的对照，首次加载时迁移，避免打卡记录丢失。 */
  var LEGACY_ID_TRACK = ("1:8207714,2:7185931,3:6769378,4:6550065,5:9015043,6:6748068,7:6911234,8:6401007,9:6697910,10:8265563,11:112795,12:7808856,13:8461871,14:7271808,15:6859496,16:6587747,17:7685705,18:6599346,19:7787371,20:6794094,21:8448916,22:6363191,23:8256118,24:6852468,25:7355509,26:6694481,27:7766185,28:6654960,29:6486026,30:6882783,31:9120044,32:6223578,33:7214169,34:7811167,35:6386740,36:6822450,37:7932107,38:8871016,39:7704606,40:7449298,41:7701349,42:8535473,43:6905988,44:6207479,45:8279521,46:7344234,47:5692139,48:6965168,49:7348074,50:6624957,51:6289739,52:7519190,53:6859480,54:8444166,55:8392683,56:8375597,57:6607147,58:2495170,59:7329347,60:6647912,61:6269350,62:6717610,63:7635686,64:7980803,65:6827047,66:7763009,67:6236237,68:6948032,69:7340351,70:7521999,71:6819053,72:5177993,73:5149375,74:6530559,75:6653216,76:6811577,77:8337420,78:8741718,79:8429541,80:7952795")
    .split(",").reduce(function (m, kv) {
      var p = kv.split(":");
      m[p[0]] = p[1];
      return m;
    }, {});

  function loadSet(key) {
    try {
      var raw = localStorage.getItem(key);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  }
  function saveSet(key, set) {
    try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch (e) {}
  }

  function loadLegacy(oldKey, newKey) {
    try {
      var raw = localStorage.getItem(oldKey);
      if (!raw) return null;
      var out = JSON.parse(raw).map(function (id) { return LEGACY_ID_TRACK[id]; })
        .filter(function (t) { return !!t; });
      localStorage.removeItem(oldKey);
      localStorage.setItem(newKey, JSON.stringify(out));
      return new Set(out);
    } catch (e) { return null; }
  }

  var doneSet = loadLegacy("nbhike.done.v1", LS_DONE) || loadSet(LS_DONE);
  var favSet = loadLegacy("nbhike.fav.v1", LS_FAV) || loadSet(LS_FAV);

  var state = {
    q: "",
    districts: new Set(),
    diffs: new Set(),
    tiers: new Set(),
    lens: new Set(),
    ascs: new Set(),
    tags: new Set(),
    sort: "default",
    onlyFav: false,
    onlyDone: false,
    onlyUndone: false
  };

  var LEN_BUCKETS = [
    { key: "lt8", label: "8km 内", test: function (r) { return r.km < 8; } },
    { key: "8to10", label: "8–10km", test: function (r) { return r.km >= 8 && r.km < 10; } },
    { key: "10to12", label: "10–12km", test: function (r) { return r.km >= 10 && r.km < 12; } },
    { key: "gt12", label: "12km 以上", test: function (r) { return r.km >= 12; } }
  ];

  var ASC_BUCKETS = [
    { key: "lt400", label: "400m 内", test: function (r) { return r.ascent < 400; } },
    { key: "400to600", label: "400–600m", test: function (r) { return r.ascent >= 400 && r.ascent < 600; } },
    { key: "600to800", label: "600–800m", test: function (r) { return r.ascent >= 600 && r.ascent < 800; } },
    { key: "gt800", label: "800m 以上", test: function (r) { return r.ascent >= 800; } }
  ];

  /* ------------------------------------------------------------ DOM 引用 */

  var $ = function (id) { return document.getElementById(id); };

  var grid = $("grid");
  var emptyBox = $("empty");
  var resultCount = $("resultCount");
  var modal = $("modal");
  var modalBody = $("modalBody");
  var modalTitle = $("modalTitle");
  var toastEl = $("toast");

  /* ------------------------------------------------------------ 工具函数 */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtHours(h) {
    var hh = Math.floor(h);
    var mm = Math.round((h - hh) * 60);
    if (hh === 0) return mm + " 分";
    if (mm === 0) return hh + " 小时";
    return hh + " 小时 " + mm + " 分";
  }

  var toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1700);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        toast("已复制轨迹号 " + text);
      }).catch(function () { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); toast("已复制轨迹号 " + text); }
    catch (e) { toast("复制失败，请手动记录：" + text); }
    document.body.removeChild(ta);
  }

  /* ------------------------------------------------------------ 构建筛选 */

  function countBy(list, test) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (test(list[i])) n++;
    return n;
  }

  function chipHTML(value, label, count, pressed) {
    return '<button class="chip" type="button" data-value="' + esc(value) + '" aria-pressed="' +
      (pressed ? "true" : "false") + '">' + esc(label) +
      '<span class="chip-count">' + count + "</span></button>";
  }

  function tierChipHTML(tier, count, pressed) {
    return '<button class="chip chip-tier" type="button" data-value="' + esc(tier.label) +
      '" aria-pressed="' + (pressed ? "true" : "false") +
      '" style="--tier:' + tier.color + ";--tier-deep:" + tier.deep + '">' +
      esc(tier.label) + '<span class="chip-count">' + count + "</span></button>";
  }

  function buildChips() {
    /* 区县 */
    var dmap = {};
    DATA.forEach(function (r) { dmap[r.district] = (dmap[r.district] || 0) + 1; });
    var districts = Object.keys(dmap).sort(function (a, b) { return dmap[b] - dmap[a]; });
    $("districtChips").innerHTML = districts.map(function (d) {
      return chipHTML(d, d, dmap[d], state.districts.has(d));
    }).join("");

    /* 难度 */
    var smap = {};
    DATA.forEach(function (r) { smap[r.stars] = (smap[r.stars] || 0) + 1; });
    var scores = Object.keys(smap).map(Number).sort(function (a, b) { return a - b; });
    $("diffChips").innerHTML = scores.map(function (s) {
      var label = "★".repeat(Math.floor(s)) + (s % 1 ? "☆" : "");
      return chipHTML(String(s), label, smap[s], state.diffs.has(s));
    }).join("");

    /* 评级（强度档位） */
    $("tierChips").innerHTML = TIERS.map(function (t) {
      var n = DATA.filter(function (r) { return r.tier.label === t.label; }).length;
      return tierChipHTML(t, n, state.tiers.has(t.label));
    }).join("");

    /* 里程 */
    $("lenChips").innerHTML = LEN_BUCKETS.map(function (b) {
      return chipHTML(b.key, b.label, countBy(DATA, b.test), state.lens.has(b.key));
    }).join("");

    /* 爬升 */
    $("ascChips").innerHTML = ASC_BUCKETS.map(function (b) {
      return chipHTML(b.key, b.label, countBy(DATA, b.test), state.ascs.has(b.key));
    }).join("");

    /* 特色 */
    var tmap = {};
    DATA.forEach(function (r) { r.tags.forEach(function (t) { tmap[t] = (tmap[t] || 0) + 1; }); });
    var tkeys = Object.keys(tmap).sort(function (a, b) { return tmap[b] - tmap[a]; });
    $("tagChips").innerHTML = tkeys.map(function (t) {
      return chipHTML(t, t, tmap[t], state.tags.has(t));
    }).join("");
  }

  /* ------------------------------------------------------------ 过滤逻辑 */

  function filtered() {
    var q = state.q.trim().toLowerCase();

    var out = DATA.filter(function (r) {
      if (q) {
        var hay = (r.name + " " + r.nav + " " + r.district + " " + (r.area || "") + " " + r.tags.join(" ")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      if (state.districts.size && !state.districts.has(r.district)) return false;
      if (state.diffs.size && !state.diffs.has(r.stars)) return false;
      if (state.tiers.size && !state.tiers.has(r.tier.label)) return false;
      if (state.lens.size) {
        var okL = false;
        state.lens.forEach(function (k) {
          var b = LEN_BUCKETS.filter(function (x) { return x.key === k; })[0];
          if (b && b.test(r)) okL = true;
        });
        if (!okL) return false;
      }
      if (state.ascs.size) {
        var okA = false;
        state.ascs.forEach(function (k) {
          var b = ASC_BUCKETS.filter(function (x) { return x.key === k; })[0];
          if (b && b.test(r)) okA = true;
        });
        if (!okA) return false;
      }
      if (state.tags.size) {
        var okT = false;
        state.tags.forEach(function (t) { if (r.tags.indexOf(t) > -1) okT = true; });
        if (!okT) return false;
      }
      if (state.onlyFav && !favSet.has(r.track)) return false;
      if (state.onlyDone && !doneSet.has(r.track)) return false;
      if (state.onlyUndone && doneSet.has(r.track)) return false;
      return true;
    });

    var s = state.sort;
    var cmp = {
      default: function (a, b) { return a.id - b.id; },
      lenAsc: function (a, b) { return a.km - b.km || a.id - b.id; },
      lenDesc: function (a, b) { return b.km - a.km || a.id - b.id; },
      ascAsc: function (a, b) { return a.ascent - b.ascent || a.id - b.id; },
      ascDesc: function (a, b) { return b.ascent - a.ascent || a.id - b.id; },
      diffAsc: function (a, b) { return a.stars - b.stars || a.km - b.km; },
      diffDesc: function (a, b) { return b.stars - a.stars || b.km - a.km; },
      verDesc: function (a, b) { return b.versions - a.versions || a.km - b.km; }
    }[s] || function (a, b) { return a.id - b.id; };

    return out.sort(cmp);
  }

  /* ------------------------------------------------------------ 渲染卡片 */

  function cardHTML(r, i) {
    var isDone = doneSet.has(r.track);
    var isFav = favSet.has(r.track);
    var cls = "card" + (isDone ? " is-done" : "") + (isFav ? " is-fav" : "");
    var delay = i < 12 ? ' style="animation-delay:' + i * 22 + 'ms"' : "";

    var badges = "";
    if (isFav) badges += '<span class="badge-fav" title="已收藏">♥</span>';
    if (isDone) badges += '<span class="badge-done" title="已打卡"></span>';

    var tags = r.tags.slice(0, 2).map(function (t) {
      return '<span class="mini-tag">' + esc(t) + "</span>";
    }).join("");

    return '<button type="button" class="' + cls + '" data-id="' + r.id + '"' + delay + ">" +
      '<span class="card-top">' +
        '<span class="card-idx">#' + String(r.id).padStart(2, "0") + "</span>" +
        '<span class="card-marks">' +
          '<span class="tier-mini" style="background:' + r.tier.color + ";border-color:" + r.tier.deep + '">' +
            esc(r.tier.label) + "</span>" +
          starRow(r.stars) +
        "</span>" +
      "</span>" +
      '<span class="card-title">' + esc(r.name) + "</span>" +
      '<span class="card-sub">' +
        '<span class="district-tag">' + esc(r.district) + "</span>" +
        '<span class="dot">·</span>' +
        '<span class="nav">' + esc(r.nav) + "</span>" +
      "</span>" +
      '<span class="card-stats">' +
        '<span class="card-stat"><span class="cs-val">' + r.km.toFixed(1) + "<em>km</em></span><span class=\"cs-lab\">里程</span></span>" +
        '<span class="card-stat"><span class="cs-val">' + r.hours.toFixed(1) + "<em>h</em></span><span class=\"cs-lab\">用时</span></span>" +
        '<span class="card-stat"><span class="cs-val">' + r.ascent + "<em>m</em></span><span class=\"cs-lab\">爬升</span></span>" +
      "</span>" +
      (tags || badges
        ? '<span class="card-foot">' +
            '<span class="tags">' + tags + "</span>" +
            '<span class="card-badges">' + badges + "</span>" +
          "</span>"
        : "") +
    "</button>";
  }

  function render() {
    var list = filtered();

    grid.innerHTML = list.map(cardHTML).join("");
    emptyBox.hidden = list.length > 0;
    grid.hidden = list.length === 0;

    resultCount.innerHTML = "共 <b>" + list.length + "</b> 条路线" +
      (list.length !== DATA.length ? '（全部 ' + DATA.length + " 条）" : "");

    /* 顶栏进度 */
    var doneN = doneSet.size;
    $("progressFill").style.width = (doneN / DATA.length * 100) + "%";
    $("progressText").textContent = doneN + "/" + DATA.length;

    /* 快捷按钮状态 */
    $("favOnly").setAttribute("aria-pressed", state.onlyFav ? "true" : "false");
    $("doneOnly").setAttribute("aria-pressed", state.onlyDone ? "true" : "false");
    $("undoneOnly").setAttribute("aria-pressed", state.onlyUndone ? "true" : "false");
  }

  /* --------------------------------------------------- 六只脚轨迹图 / 剖面 */

  var TRACKS = window.TRACKS || {};
  var PHOTOS = window.PHOTOS || {};

  function trackOf(r) { return TRACKS[String(r.track)] || null; }

  function decodePath(p) {
    var out = [], x = 0, y = 0, segs = p.split(";");
    for (var i = 0; i < segs.length; i++) {
      var a = segs[i].split(",");
      x += parseInt(a[0], 36);
      y += parseInt(a[1], 36);
      out.push([x, y]);
    }
    return out;
  }

  function pathD(pts) {
    var d = "M" + pts[0][0] + "," + pts[0][1];
    for (var i = 1; i < pts.length; i++) d += "L" + pts[i][0] + "," + pts[i][1];
    return d;
  }

  function fmtSpan(m) {
    return m >= 1000 ? (m / 1000).toFixed(m >= 10000 ? 0 : 1) + "km" : Math.round(m) + "m";
  }

  function niceScale(across) {
    var target = across * 0.28;
    var steps = [50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000];
    var pick = steps[0];
    for (var i = 0; i < steps.length; i++) if (steps[i] <= target) pick = steps[i];
    return pick;
  }

  /* 归一化坐标 → 像素风轨迹示意图 */
  function routeMapHTML(t) {
    var pts = decodePath(t.p);
    if (pts.length < 2) return "";

    var VW = 1000, VH = Math.max(t.h, 1);
    var pad = Math.round(Math.max(VW, VH) * 0.06) + 18;
    var d = pathD(pts);
    var start = pts[0], end = pts[pts.length - 1];

    var mPerUnit = t.w / 1000;
    var barM = niceScale(t.w);
    var barU = Math.round(barM / mPerUnit);
    var barLabel = barM >= 1000 ? (barM / 1000) + " km" : barM + " m";

    var dots = "";
    if (t.f && t.f.length) {
      var step = Math.max(1, Math.ceil(t.f.length / 14));
      for (var i = 0; i < t.f.length; i += step) {
        dots += '<circle cx="' + t.f[i][0] + '" cy="' + t.f[i][1] + '" r="13" class="fp-dot"/>';
      }
    }

    var spanH = t.h * t.w / 1000;
    var rot = t.rot || 0;

    // 比例尺：底衬一块米白板，避免与网格线混在一起
    var scaleX = pad + 22;
    var scaleY = VH + pad - 46;

    return (
      '<div class="routemap">' +
        '<svg viewBox="' + -pad + " " + -pad + " " + (VW + pad * 2) + " " + (VH + pad * 2) +
          '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="线路轨迹示意图">' +
          '<path d="' + d + '" class="rm-casing"/>' +
          '<path d="' + d + '" class="rm-line"/>' +
          dots +
          '<circle cx="' + start[0] + '" cy="' + start[1] + '" r="25" class="rm-start"/>' +
          '<rect x="' + (end[0] - 27) + '" y="' + (end[1] - 27) + '" width="54" height="54" class="rm-end"/>' +
          '<g class="rm-scale" transform="translate(' + scaleX + "," + scaleY + ')">' +
            '<rect class="plate" x="-18" y="-52" width="' + (barU + 36) + '" height="84"/>' +
            '<rect x="0" y="0" width="' + barU + '" height="16" class="bar"/>' +
            '<rect x="0" y="0" width="' + Math.round(barU / 2) + '" height="16" class="bar alt"/>' +
            '<rect x="0" y="0" width="5" height="26" class="tick"/>' +
            '<rect x="' + (barU - 5) + '" y="0" width="5" height="26" class="tick"/>' +
            '<text x="0" y="-18">0</text>' +
            '<text x="' + barU + '" y="-18" text-anchor="end">' + barLabel + "</text>" +
          "</g>" +
        "</svg>" +
        '<div class="rm-compass" aria-hidden="true">' +
          "<b>N</b>" +
          '<svg viewBox="0 0 40 40" style="transform:rotate(' + rot + 'deg)">' +
            '<path d="M20,7 L25,23 L15,23 Z" fill="#c4452f" stroke="#2b1a0c" stroke-width="2"/>' +
            '<path d="M20,33 L25,23 L15,23 Z" fill="#5b3a1e" stroke="#2b1a0c" stroke-width="2"/>' +
          "</svg>" +
        "</div>" +
      "</div>" +
      '<div class="rm-caption">' +
        "<span>轨迹范围 " + fmtSpan(t.w) + " × " + fmtSpan(spanH) + "</span>" +
        (t.f && t.f.length ? "<span>沿途 " + t.f.length + " 个脚印点</span>" : "") +
        "<span>绿点起 · 红框终 · 示意图非导航用</span>" +
      "</div>"
    );
  }

  /* 海拔剖面 */
  function elevHTML(t) {
    var e = t.e || [];
    if (e.length < 3) return "";

    var lo = Math.min.apply(null, e), hi = Math.max.apply(null, e);
    var span = Math.max(hi - lo, 12);
    var W = 1000, H = 190, padT = 30, padB = 34;
    var innerH = H - padT - padB;

    var pts = [], i;
    for (i = 0; i < e.length; i++) {
      pts.push([
        Math.round(i / (e.length - 1) * W),
        Math.round(padT + innerH - (e[i] - lo) / span * innerH)
      ]);
    }

    var line = pathD(pts);
    var base = padT + innerH;
    var area = line + "L" + W + "," + base + "L0," + base + "Z";

    var grid = "";
    for (var g = 1; g <= 2; g++) {
      var gy = Math.round(padT + innerH * g / 3);
      grid += '<line x1="0" y1="' + gy + '" x2="' + W + '" y2="' + gy + '" class="eg"/>';
    }

    var totalKm = t.m && t.m.d ? t.m.d : 0;
    var axis = "";
    if (totalKm > 0) {
      for (var k = 0; k <= 4; k++) {
        var lab = k === 0 ? "0" : (totalKm * k / 4).toFixed(1);
        axis += "<span>" + lab + (k === 4 ? " km" : "") + "</span>";
      }
    }

    return (
      '<div class="elev">' +
        '<div class="elev-head"><span>海拔剖面</span><span>' + lo + "–" + hi + " m</span></div>" +
        '<svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none" role="img" aria-label="海拔剖面图">' +
          grid +
          '<path d="' + area + '" class="e-area"/>' +
          '<path d="' + line + '" class="e-line"/>' +
        "</svg>" +
        '<div class="elev-axis">' + axis + "</div>" +
      "</div>"
    );
  }

  /* ------------------------------------------------ 真实地图（瓦片叠加） */

  var SVG_NS = "http://www.w3.org/2000/svg";

  /* 高德瓦片：GCJ-02 + Web Mercator，与六只脚轨迹坐标同一坐标系，无需纠偏 */
  var TILE_URL = {
    street: function (x, y, z) {
      return "https://webrd0" + (1 + (x + y) % 4) +
        ".is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x=" + x + "&y=" + y + "&z=" + z;
    },
    sat: function (x, y, z) {
      return "https://webst0" + (1 + (x + y) % 4) +
        ".is.autonavi.com/appmaptile?style=6&x=" + x + "&y=" + y + "&z=" + z;
    }
  };

  /* 归一化坐标 → 经纬度，参数见 tracks.js 的 g 字段 */
  function toLatLng(g, nx, ny) {
    var rx = nx / g[7] + g[5];
    var ry = ny / g[7] + g[6];
    var c = Math.cos(g[4]), s = Math.sin(g[4]);
    var bx = rx * c + ry * s;
    var by = -rx * s + ry * c;
    return [-by / g[3] + g[1], bx / g[2] + g[0]];
  }

  function lng2x(lng, z) { return (lng + 180) / 360 * Math.pow(2, z); }
  function lat2y(lat, z) {
    var s = Math.sin(lat * Math.PI / 180);
    return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Math.pow(2, z);
  }

  function buildRealMap(trk, mode) {
    var geo = decodePath(trk.p).map(function (p) { return toLatLng(trk.g, p[0], p[1]); });
    var bb = trk.bb;

    var el = document.createElement("div");
    el.className = "realmap";

    var layer = document.createElement("div");
    layer.className = "rm-tiles";
    el.appendChild(layer);

    var svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "rm-overlay");
    el.appendChild(svg);

    var ctrl = document.createElement("div");
    ctrl.className = "rm-zoom";
    ctrl.innerHTML = '<button type="button" data-z="1" aria-label="放大">+</button>' +
                     '<button type="button" data-z="-1" aria-label="缩小">-</button>';
    el.appendChild(ctrl);

    var attrib = document.createElement("span");
    attrib.className = "rm-attrib";
    attrib.textContent = "© 高德地图";
    el.appendChild(attrib);

    var offline = document.createElement("div");
    offline.className = "rm-offline";
    offline.hidden = true;
    offline.textContent = "地图瓦片加载失败，请检查网络后重试";
    el.appendChild(offline);

    var tileOk = 0, tileFail = 0;

    var st = { z: 15, cx: 0, cy: 0, tiles: {}, raf: 0, drag: null };

    function clamp() {
      var n = Math.pow(2, st.z) * 256;
      st.cx = Math.min(n, Math.max(0, st.cx));
      st.cy = Math.min(n, Math.max(0, st.cy));
    }

    function fit() {
      var w = el.clientWidth || 600, h = el.clientHeight || 300;
      var z = 17;
      for (; z > 10; z--) {
        var dx = (lng2x(bb[2], z) - lng2x(bb[0], z)) * 256;
        var dy = (lat2y(bb[1], z) - lat2y(bb[3], z)) * 256;
        if (dx <= w - 64 && dy <= h - 64) break;
      }
      st.z = z;
      st.cx = (lng2x(bb[0], z) + lng2x(bb[2], z)) / 2 * 256;
      st.cy = (lat2y(bb[1], z) + lat2y(bb[3], z)) / 2 * 256;
      clamp();
    }

    function render() {
      st.raf = 0;
      var w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;

      var n = Math.pow(2, st.z);
      var left = st.cx - w / 2, top = st.cy - h / 2;
      var x0 = Math.max(0, Math.floor(left / 256));
      var x1 = Math.min(n - 1, Math.floor((left + w) / 256));
      var y0 = Math.max(0, Math.floor(top / 256));
      var y1 = Math.min(n - 1, Math.floor((top + h) / 256));
      var keep = {}, k, tx, ty, im, key;

      for (tx = x0; tx <= x1; tx++) {
        for (ty = y0; ty <= y1; ty++) {
          key = st.z + "/" + tx + "/" + ty;
          keep[key] = 1;
          im = st.tiles[key];
          if (!im) {
            im = document.createElement("img");
            im.className = "rm-tile";
            im.alt = "";
            im.draggable = false;
            im.onload = function () { tileOk++; };
            im.onerror = function () {
              tileFail++;
              im.style.opacity = "0";   // 别把浏览器的碎图标露出来
              if (!tileOk && tileFail >= 3) offline.hidden = false;
            };
            im.src = TILE_URL[mode](tx, ty, st.z);
            layer.appendChild(im);
            st.tiles[key] = im;
          }
          im.style.transform = "translate(" + Math.round(tx * 256 - left) + "px," +
            Math.round(ty * 256 - top) + "px)";
        }
      }
      for (k in st.tiles) {
        if (!keep[k]) { layer.removeChild(st.tiles[k]); delete st.tiles[k]; }
      }

      var d = "", i, px, py;
      for (i = 0; i < geo.length; i++) {
        px = lng2x(geo[i][1], st.z) * 256 - left;
        py = lat2y(geo[i][0], st.z) * 256 - top;
        d += (i ? "L" : "M") + px.toFixed(1) + "," + py.toFixed(1);
      }
      var a = geo[0], b = geo[geo.length - 1];
      var ax = lng2x(a[1], st.z) * 256 - left, ay = lat2y(a[0], st.z) * 256 - top;
      var bx = lng2x(b[1], st.z) * 256 - left, by = lat2y(b[0], st.z) * 256 - top;

      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      svg.innerHTML =
        '<path d="' + d + '" class="rt-casing"/>' +
        '<path d="' + d + '" class="rt-line"/>' +
        '<circle cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="7" class="rt-start"/>' +
        '<rect x="' + (bx - 7).toFixed(1) + '" y="' + (by - 7).toFixed(1) +
          '" width="14" height="14" class="rt-end"/>';
    }

    function schedule() {
      if (!st.raf) st.raf = requestAnimationFrame(render);
    }

    el.addEventListener("pointerdown", function (e) {
      if (e.target.closest(".rm-zoom")) return;
      st.drag = { x: e.clientX, y: e.clientY, cx: st.cx, cy: st.cy };
      el.setPointerCapture(e.pointerId);
      el.classList.add("dragging");
    });

    el.addEventListener("pointermove", function (e) {
      if (!st.drag) return;
      st.cx = st.drag.cx - (e.clientX - st.drag.x);
      st.cy = st.drag.cy - (e.clientY - st.drag.y);
      clamp();
      schedule();
    });

    function endDrag(e) {
      if (!st.drag) return;
      st.drag = null;
      el.classList.remove("dragging");
      if (e && e.pointerId != null && el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    ctrl.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-z]");
      if (!btn) return;
      e.stopPropagation();
      var nz = Math.max(10, Math.min(17, st.z + Number(btn.dataset.z)));
      if (nz === st.z) return;
      var k = Math.pow(2, nz - st.z);
      st.cx *= k;
      st.cy *= k;
      st.z = nz;
      clamp();
      schedule();
    });

    el.__start = function () { fit(); render(); };
    return el;
  }

  /* ------------------------------------------------------------ 详情弹窗 */

  var lastFocus = null;

  function openModal(id) {
    var r = DATA.filter(function (x) { return x.id === id; })[0];
    if (!r) return;

    if (modal.hidden) lastFocus = document.activeElement;
    modalTitle.textContent = "#" + String(r.id).padStart(2, "0") + " " + r.name;

    var isDone = doneSet.has(r.track);
    var isFav = favSet.has(r.track);
    var tier = r.tier;
    var pct = Math.min(100, Math.round(r.density / MAX_DENSITY * 100));
    var level = r.density < 30 ? "平缓" : r.density < 50 ? "适中" : r.density < 70 ? "偏陡" : "陡峭";

    var amapUrl = "https://uri.amap.com/search?keyword=" + encodeURIComponent(r.nav) + "&city=" + encodeURIComponent("宁波") + "&callnative=0";

    var trk = trackOf(r);
    var mapHTML = trk
      ? '<div class="map-tabs" role="group" aria-label="地图类型">' +
          '<button class="map-tab on" type="button" data-mode="sketch" aria-pressed="true">示意图</button>' +
          '<button class="map-tab" type="button" data-mode="street" aria-pressed="false">街道</button>' +
          '<button class="map-tab" type="button" data-mode="sat" aria-pressed="false">卫星</button>' +
        "</div>" +
        '<div class="map-host" id="mapHost">' + routeMapHTML(trk) + "</div>"
      : "";
    var elevBlock = trk ? elevHTML(trk) : "";

    // 轨迹号取不到数据时的说明（源表个别编号指向非宁波轨迹）
    var noTrackHTML = trk ? "" :
      '<div class="notrack">' +
        "<b>暂无线路图</b>" +
        "<span>轨迹号 " + esc(r.track) + " 在六只脚上未匹配到宁波范围内的轨迹，可能已被删除或编号有误。下方里程、爬升等数据仍来自汇总表。</span>" +
      "</div>";

    var storyHTML = "";
    if (trk && trk.s) {
      storyHTML =
        '<div class="story">' +
          '<div class="story-head"><span>路线指引</span><span class="story-src">原作者手记</span></div>' +
          '<p class="story-body">' + esc(trk.s) + "</p>" +
        "</div>";
    }

    var shots = PHOTOS[String(r.track)] || [];
    var shotsHTML = "";
    if (shots.length) {
      shotsHTML =
        '<div class="shots">' +
          '<div class="shots-head"><span>沿途实拍</span>' +
            '<span class="shots-src">' + shots.length + " 张 · 六只脚作者上传</span></div>" +
          '<div class="shots-strip">' +
            shots.map(function (p, i) {
              return '<button class="shot" type="button" data-shot="' + i + '" aria-label="查看第 ' + (i + 1) + ' 张实拍">' +
                '<img src="assets/' + p[0] + '" alt="" loading="lazy" decoding="async" width="' + p[1] + '" height="' + p[2] + '">' +
                (p[3] ? "<em>" + p[3] + "m</em>" : "") +
              "</button>";
            }).join("") +
          "</div>" +
        "</div>";
    }

    var tagHTML = r.tags.length
      ? r.tags.map(function (t) { return '<span class="mini-tag">' + esc(t) + "</span>"; }).join("")
      : '<span class="mini-tag">无特征标签</span>';

    modalBody.innerHTML =
      '<div class="detail-head">' +
        '<span class="district-tag">' + esc(r.district) + "</span>" +
        (r.area ? '<span class="district-tag" style="background:#7a4a86">' + esc(r.area) + "</span>" : "") +
        '<span class="detail-tier" style="background:' + tier.color + ";border-color:" + tier.deep + '">' + tier.label + "</span>" +
        starRow(r.stars) +
      "</div>" +

      noTrackHTML +
      mapHTML +
      elevBlock +

      '<div class="detail-stats">' +
        '<div class="detail-stat">' + ICON.ruler + "<b>" + r.km.toFixed(1) + "<em>km</em></b><span>里程</span></div>" +
        '<div class="detail-stat">' + ICON.clock + "<b>" + r.hours.toFixed(1) + "<em>h</em></b><span>参考用时</span></div>" +
        '<div class="detail-stat">' + ICON.mountain + "<b>" + r.ascent + "<em>m</em></b><span>累计爬升</span></div>" +
        '<div class="detail-stat">' + ICON.slope + "<b>" + r.density.toFixed(1) + "<em>m/km</em></b><span>爬升密度</span></div>" +
      "</div>" +

      '<div class="meter">' +
        '<div class="meter-head"><span>坡度强度</span><span>' + r.density.toFixed(1) + " m/km · " + level + "</span></div>" +
        '<div class="meter-track"><i style="width:' + pct + "%;background:" + tier.color + '"></i></div>' +
      "</div>" +

      '<div class="detail-rows">' +
        '<div class="detail-row"><span class="dr-key">集合点</span><span class="dr-val">' + esc(r.nav) +
          ' <a class="link-btn" href="' + amapUrl + '" target="_blank" rel="noopener">高德导航</a></span></div>' +
        '<div class="detail-row"><span class="dr-key">轨迹号</span><span class="dr-val mono">' + esc(r.track) +
          ' <button class="link-btn green" type="button" data-copy="' + esc(r.track) + '">复制</button></span></div>' +
        '<div class="detail-row"><span class="dr-key">线路类型</span><span class="dr-val">' + esc(r.type) + "</span></div>" +
        '<div class="detail-row"><span class="dr-key">参考用时</span><span class="dr-val">' + fmtHours(r.hours) + "</span></div>" +
        '<div class="detail-row"><span class="dr-key">线路特色</span><span class="dr-val">' + tagHTML + "</span></div>" +
        (r.sharer
          ? '<div class="detail-row"><span class="dr-key">轨迹分享</span><span class="dr-val">' + esc(r.sharer) + "</span></div>"
          : "") +
        '<div class="detail-row"><span class="dr-key">数据收录</span><span class="dr-val">' +
          (r.versions > 1
            ? r.versions + " 份源表交叉印证" + (r.versions >= 4 ? "（最可靠）" : "")
            : "大集合单次收录") + "</span></div>" +
      "</div>" +

      storyHTML +

      shotsHTML +

      '<div class="detail-actions">' +
        '<button class="btn ' + (isDone ? "btn-green" : "") + '" type="button" id="mDone">' +
          (isDone ? '<i class="tick"></i>' : "") + (isDone ? "已打卡（点击取消）" : "标记为已打卡") + "</button>" +
        '<button class="btn" type="button" id="mFav">' +
          '<i class="heart' + (isFav ? " on" : "") + '">♥</i>' +
          (isFav ? "已收藏（点击取消）" : "收藏这条") + "</button>" +
      "</div>" +

      (trk
        ? '<p class="detail-note">轨迹图、海拔剖面与路线指引抓取自六只脚行程 <a class="src-link" href="https://www.foooooot.com/trip/' +
          encodeURIComponent(r.track) + '/" target="_blank" rel="noopener">' + esc(r.track) + "</a>" +
          (trk.m && trk.m.by ? "（作者 " + esc(trk.m.by) + "）" : "") +
          "，仅作个人参考；示意图非导航用途。山区信号较弱，请提前下载离线地图并结伴出行。</p>"
        : '<p class="detail-note">里程、用时、爬升均为汇总表实测值；轨迹号可在「六只脚」App 中搜索，下载 GPX 后离线使用。山区信号较弱，请提前下载离线地图并结伴出行。</p>');

    modal.hidden = false;
    document.body.style.overflow = "hidden";

    $("mDone").addEventListener("click", function () {
      if (doneSet.has(r.track)) { doneSet.delete(r.track); toast("已取消打卡"); }
      else { doneSet.add(r.track); toast("打卡成功！" + doneSet.size + "/" + DATA.length); }
      saveSet(LS_DONE, doneSet);
      render();
      openModal(r.id);
    });

    $("mFav").addEventListener("click", function () {
      if (favSet.has(r.track)) { favSet.delete(r.track); toast("已取消收藏"); }
      else { favSet.add(r.track); toast("已加入收藏"); }
      saveSet(LS_FAV, favSet);
      render();
      openModal(r.id);
    });

    bindMapTabs(trk);
    bindShots(shots);

    var copyBtn = modalBody.querySelector("[data-copy]");
    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        copyText(copyBtn.getAttribute("data-copy"));
      });
    }

    modal.querySelector(".modal-close").focus();
  }

  /* -------------------------------------------------- 地图切换 / 实拍灯箱 */

  function bindMapTabs(trk) {
    var host = $("mapHost");
    if (!host) return;
    var tabs = modalBody.querySelectorAll(".map-tab");
    var sketch = host.innerHTML;
    var ready = !!(trk && trk.g && trk.bb);

    Array.prototype.forEach.call(tabs, function (btn) {
      if (!ready && btn.dataset.mode !== "sketch") {
        btn.disabled = true;
        btn.classList.add("is-off");
        return;
      }
      btn.addEventListener("click", function () {
        if (btn.classList.contains("on")) return;
        Array.prototype.forEach.call(tabs, function (b) {
          var on = b === btn;
          b.classList.toggle("on", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        if (btn.dataset.mode === "sketch") {
          host.innerHTML = sketch;
        } else {
          host.innerHTML = "";
          var map = buildRealMap(trk, btn.dataset.mode);
          host.appendChild(map);
          map.__start();
        }
      });
    });
  }

  function bindShots(shots) {
    var strip = modalBody.querySelector(".shots-strip");
    if (!strip || !shots || !shots.length) return;
    strip.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-shot]");
      if (!btn) return;
      openLightbox(shots, Number(btn.dataset.shot));
    });
  }

  var lb = null, lbIdx = 0, lbList = null;

  function ensureLightbox() {
    if (lb) return lb;
    lb = document.createElement("div");
    lb.className = "lightbox";
    lb.hidden = true;
    lb.innerHTML =
      '<button class="lb-btn lb-close" type="button" aria-label="关闭"></button>' +
      '<button class="lb-btn lb-prev" type="button" aria-label="上一张"></button>' +
      '<figure class="lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button class="lb-btn lb-next" type="button" aria-label="下一张"></button>';
    document.body.appendChild(lb);
    lb.addEventListener("click", function (e) {
      if (e.target.closest(".lb-close") || e.target === lb) { closeLightbox(); return; }
      if (e.target.closest(".lb-prev")) stepLightbox(-1);
      if (e.target.closest(".lb-next")) stepLightbox(1);
    });
    return lb;
  }

  function paintLightbox() {
    var p = lbList[lbIdx];
    var img = lb.querySelector("img");
    img.src = "assets/" + p[0];
    img.width = p[1];
    img.height = p[2];
    lb.querySelector("figcaption").textContent =
      (p[3] ? "海拔 " + p[3] + " m · " : "") + (lbIdx + 1) + " / " + lbList.length;
    var many = lbList.length > 1;
    lb.querySelector(".lb-prev").hidden = !many;
    lb.querySelector(".lb-next").hidden = !many;
  }

  function openLightbox(list, i) {
    ensureLightbox();
    lbList = list;
    lbIdx = i;
    lb.hidden = false;
    document.body.classList.add("lb-open");
    paintLightbox();
    lb.querySelector(".lb-close").focus();
  }

  function stepLightbox(d) {
    if (!lbList || lbList.length < 2) return;
    lbIdx = (lbIdx + d + lbList.length) % lbList.length;
    paintLightbox();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.classList.remove("lb-open");
  }

  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  /* ------------------------------------------------------------ 事件绑定 */

  /* 卡片点击 */
  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (card) openModal(Number(card.getAttribute("data-id")));
  });

  /* 弹窗关闭 */
  modal.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeModal();
  });

  document.addEventListener("keydown", function (e) {
    if (lb && !lb.hidden) {
      if (e.key === "Escape") { closeLightbox(); e.preventDefault(); return; }
      if (e.key === "ArrowLeft") { stepLightbox(-1); e.preventDefault(); return; }
      if (e.key === "ArrowRight") { stepLightbox(1); e.preventDefault(); return; }
    }
    if (e.key === "Escape" && !modal.hidden) closeModal();
  });

  /* 搜索 */
  var qTimer = null;
  $("q").addEventListener("input", function (e) {
    var v = e.target.value;
    clearTimeout(qTimer);
    qTimer = setTimeout(function () { state.q = v; render(); }, 120);
  });

  /* chips 通用点击 */
  function bindChipGroup(elId, set, parse) {
    $(elId).addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      var val = parse(chip.getAttribute("data-value"));
      if (set.has(val)) set.delete(val); else set.add(val);
      chip.setAttribute("aria-pressed", set.has(val) ? "true" : "false");
      render();
    });
  }
  bindChipGroup("districtChips", state.districts, String);
  bindChipGroup("diffChips", state.diffs, Number);
  bindChipGroup("tierChips", state.tiers, String);
  bindChipGroup("lenChips", state.lens, String);
  bindChipGroup("ascChips", state.ascs, String);
  bindChipGroup("tagChips", state.tags, String);

  /* 排序 */
  $("sort").addEventListener("change", function (e) {
    state.sort = e.target.value;
    render();
  });

  /* 快捷开关 */
  function bindToggle(elId, key, exclusive) {
    $(elId).addEventListener("click", function () {
      state[key] = !state[key];
      if (exclusive && state[key]) {
        exclusive.forEach(function (k) { state[k] = false; });
      }
      render();
    });
  }
  bindToggle("favOnly", "onlyFav");
  bindToggle("doneOnly", "onlyDone", ["onlyUndone"]);
  bindToggle("undoneOnly", "onlyUndone", ["onlyDone"]);

  /* 重置 */
  function resetAll() {
    state.q = "";
    $("q").value = "";
    state.districts.clear();
    state.diffs.clear();
    state.tiers.clear();
    state.lens.clear();
    state.ascs.clear();
    state.tags.clear();
    state.onlyFav = state.onlyDone = state.onlyUndone = false;
    state.sort = "default";
    $("sort").value = "default";
    buildChips();
    render();
  }
  $("resetBtn").addEventListener("click", resetAll);
  $("emptyReset").addEventListener("click", resetAll);

  /* 移动端筛选折叠 */
  var filterBody = $("filterBody");
  $("filterToggle").addEventListener("click", function () {
    var open = filterBody.classList.toggle("open");
    this.setAttribute("aria-expanded", open ? "true" : "false");
    $("filterToggleText").textContent = open ? "收起" : "展开";
  });

  /* 随机一条 */
  $("randomBtn").addEventListener("click", function () {
    var pool = filtered();
    if (!pool.length) pool = DATA;
    var pick = pool[Math.floor(Math.random() * pool.length)];
    openModal(pick.id);
  });

  /* ------------------------------------------------------------ 初始化 */

  function initStats() {
    var totalKm = DATA.reduce(function (s, r) { return s + r.km; }, 0);
    var districts = {};
    DATA.forEach(function (r) { districts[r.district] = 1; });
    var maxAscent = DATA.reduce(function (m, r) { return Math.max(m, r.ascent); }, 0);

    $("statCount").textContent = DATA.length;
    $("statDistrict").textContent = Object.keys(districts).length;
    $("statKm").textContent = Math.round(totalKm);
    $("statAscent").textContent = maxAscent;
  }

  buildChips();
  initStats();
  render();
})();
