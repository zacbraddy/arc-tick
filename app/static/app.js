const el = (id) => document.getElementById(id);

const BAND_ORDER = ["optimal", "good", "improve"];
const BAND_LABEL = { optimal: "Optimal", good: "Good", improve: "Needs work" };

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return body;
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* The scale spans the full width of every band the marker defines. Bands are
   laid out in value order, not in optimal/good/improve order, so that the tick
   sits in a place that means something. */
function scaleFor(ranges) {
  const bands = BAND_ORDER.map((band) => ({
    band,
    min: ranges[band].min,
    max: ranges[band].max,
  })).sort((a, b) => a.min - b.min);

  const low = bands[0].min;
  const high = bands[bands.length - 1].max;
  const span = high - low || 1;

  return { bands, low, high, span };
}

function renderMarker(result) {
  const { bands, low, high, span } = scaleFor(result.ranges);
  const offset = Math.min(100, Math.max(0, ((result.value - low) / span) * 100));

  const node = document.createElement("article");
  node.className = "marker";
  node.innerHTML = `
    <div class="marker-head">
      <span class="marker-name"></span>
      <span>
        <span class="marker-value"></span><span class="marker-unit"></span>
        <span class="marker-status status-${result.status}"></span>
      </span>
    </div>
    <div class="scale-wrap">
      <div class="scale">
        ${bands
          .map(
            (b) =>
              `<div class="band band-${b.band}" style="width:${
                ((b.max - b.min) / span) * 100
              }%"></div>`
          )
          .join("")}
      </div>
      <div class="tick" style="left:${offset}%"></div>
    </div>
    <div class="scale-labels"><span class="low"></span><span class="high"></span></div>
    <div class="history">
      <button type="button" class="history-toggle" aria-expanded="false"
        aria-controls="history-${result.biomarker_id}">History</button>
      <div class="history-panel" id="history-${result.biomarker_id}" hidden></div>
    </div>
  `;

  node.querySelector(".marker-name").textContent = result.name;
  node.querySelector(".marker-value").textContent = result.value;
  node.querySelector(".marker-unit").textContent = result.unit;
  node.querySelector(".marker-status").textContent =
    BAND_LABEL[result.status] ?? result.status;
  node.querySelector(".low").textContent = low;
  node.querySelector(".high").textContent = high;

  const toggle = node.querySelector(".history-toggle");
  const panel = node.querySelector(".history-panel");
  toggle.addEventListener("click", () =>
    toggleHistory(toggle, panel, result.biomarker_id)
  );
  return node;
}

function toggleHistory(button, panel, biomarkerId) {
  const open = panel.hidden;
  panel.hidden = !open;
  button.setAttribute("aria-expanded", String(open));
  if (open && !panel.dataset.loaded) loadHistory(panel, biomarkerId);
}

function historyMessage(panel, text) {
  const message = document.createElement("p");
  message.className = "history-message";
  message.textContent = text;
  panel.replaceChildren(message);
}

const DAY_MS = 24 * 60 * 60 * 1000;

const tickDate = (ms) => formatDate(new Date(ms).toISOString());

const validBand = (band) =>
  Boolean(band) && Number.isFinite(band.min) && Number.isFinite(band.max) && band.max > band.min;

// Optimal paints last so it wins wherever real data overlaps.
const BAND_PAINT_ORDER = ["improve", "good", "optimal"];

let cachedBandColours;
function bandColours() {
  if (!cachedBandColours) {
    const css = getComputedStyle(document.documentElement);
    cachedBandColours = Object.fromEntries(
      BAND_PAINT_ORDER.map((band) => [band, css.getPropertyValue(`--${band}`).trim()])
    );
  }
  return cachedBandColours;
}

/* Each draw's own ranges (ADR-0002) fill from its x to the next draw's x, so
   bands step where the lab changed them. Left of the first draw stays empty. */
const bandPlugin = {
  id: "asAtDrawBands",
  beforeDatasetsDraw(chart) {
    const data = chart.data.datasets[0].data;
    const { ctx, chartArea, scales: { x, y } } = chart;
    const colour = bandColours();

    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top, chartArea.width, chartArea.height);
    ctx.clip();
    ctx.globalAlpha = 0.15;
    data.forEach(({ x: at, point }, i) => {
      const x0 = x.getPixelForValue(at);
      const x1 = i + 1 < data.length ? x.getPixelForValue(data[i + 1].x) : chartArea.right;
      for (const name of BAND_PAINT_ORDER) {
        const band = point.ranges?.[name];
        if (!validBand(band)) continue;
        const top = y.getPixelForValue(band.max);
        ctx.fillStyle = colour[name];
        ctx.fillRect(x0, top, x1 - x0, y.getPixelForValue(band.min) - top);
      }
    });
    ctx.restore();
  },
};

function valueExtent(points) {
  const values = points.flatMap((p) => [
    p.value,
    ...BAND_ORDER.map((name) => p.ranges?.[name])
      .filter(validBand)
      .flatMap((band) => [band.min, band.max]),
  ]);
  return { suggestedMin: Math.min(...values), suggestedMax: Math.max(...values) };
}

function historyChartOptions(points) {
  const x = {
    type: "linear",
    ticks: {
      // Linear ticks fall on round ms values, so close draws can repeat a date.
      callback: (ms, i, ticks) =>
        i > 0 && tickDate(ticks[i - 1].value) === tickDate(ms) ? "" : tickDate(ms),
    },
  };
  if (points.length === 1) {
    const only = Date.parse(points[0].tested_at);
    x.min = only - 30 * DAY_MS;
    x.max = only + 30 * DAY_MS;
  } else {
    // Room right of the latest draw, or its as-at-draw bands are a sliver at the edge.
    const first = Date.parse(points[0].tested_at);
    const last = Date.parse(points[points.length - 1].tested_at);
    x.suggestedMax = last + Math.max(30 * DAY_MS, (last - first) * 0.15);
  }

  return {
    animation: false,
    maintainAspectRatio: false,
    scales: { x, y: valueExtent(points) },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => formatDate(items[0].raw.point.tested_at),
          label: ({ raw: { point } }) =>
            `${point.value} ${point.unit} · ${BAND_LABEL[point.status] ?? point.status}`,
          afterLabel: ({ raw: { point } }) => {
            const optimal = point.ranges?.optimal;
            return validBand(optimal) ? `Optimal ${optimal.min}–${optimal.max} ${point.unit}` : "";
          },
        },
      },
    },
  };
}

async function loadHistory(panel, biomarkerId) {
  if (typeof Chart === "undefined") {
    panel.dataset.loaded = "true";
    return historyMessage(panel, "Chart unavailable");
  }

  panel.dataset.loaded = "loading";
  historyMessage(panel, "Loading…");

  let data;
  try {
    ({ data } = await api(`/api/biomarkers/${encodeURIComponent(biomarkerId)}/history`));
  } catch (err) {
    delete panel.dataset.loaded;
    historyMessage(panel, err.message);
    return;
  }

  panel.dataset.loaded = "true";
  const { biomarker, points } = data;
  if (points.length === 0) return historyMessage(panel, "No history yet");

  const wrap = document.createElement("div");
  wrap.className = "history-chart";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", `${biomarker.name} history, ${biomarker.unit}`);
  wrap.append(canvas);
  panel.replaceChildren(wrap);

  new Chart(canvas, {
    type: "line",
    data: {
      datasets: [
        {
          data: points.map((p) => ({ x: Date.parse(p.tested_at), y: p.value, point: p })),
          borderColor: "#2f6f62",
          pointRadius: 3,
        },
      ],
    },
    options: historyChartOptions(points),
    plugins: [bandPlugin],
  });
}

function renderResults(results) {
  const root = el("results");
  root.replaceChildren();

  if (results.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "No results yet. They appear here after your first draw.";
    root.append(empty);
    return;
  }

  let category = null;
  for (const result of results) {
    if (result.category !== category) {
      category = result.category;
      const heading = document.createElement("h2");
      heading.className = "category";
      heading.textContent = category;
      root.append(heading);
    }
    root.append(renderMarker(result));
  }
}

async function showDashboard(user) {
  el("signin").hidden = true;
  el("dashboard").hidden = false;
  el("whoami").textContent = user.name;

  const { data, meta } = await api("/api/home");
  renderResults(data.results);

  const latest = meta.tested_at || data.results[0]?.tested_at;
  el("drawn").textContent = latest ? `Drawn ${formatDate(latest)}` : "";
}

function showSignIn(message) {
  el("dashboard").hidden = true;
  el("signin").hidden = false;
  const error = el("signin-error");
  error.hidden = !message;
  error.textContent = message || "";
}

el("signin-button").addEventListener("click", async () => {
  const email = el("email").value.trim();
  if (!email) {
    showSignIn("Enter an email address to sign in.");
    return;
  }
  try {
    const { data } = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    await showDashboard(data.user);
  } catch (err) {
    showSignIn(err.message);
  }
});

el("email").addEventListener("keydown", (event) => {
  if (event.key === "Enter") el("signin-button").click();
});

el("signout-button").addEventListener("click", async () => {
  await api("/api/auth/logout", { method: "POST" });
  el("email").value = "";
  showSignIn();
});

(async function start() {
  try {
    const { data } = await api("/api/me");
    await showDashboard(data.user);
  } catch {
    showSignIn();
  }
})();
