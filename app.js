const form = document.getElementById("trip-form");
const sourceInput = document.getElementById("source");
const destinationInput = document.getElementById("destination");
const departureTimeInput = document.getElementById("departureTime");
const profileInput = document.getElementById("profile");
const spacingInput = document.getElementById("spacing");
const densityInput = document.getElementById("density");
const submitButton = document.getElementById("submitButton");
const resultsTitle = document.getElementById("resultsTitle");
const summary = document.getElementById("summary");
const timeline = document.getElementById("timeline");
const notice = document.getElementById("notice");
const statusBadge = document.getElementById("statusBadge");
const timelineCardTemplate = document.getElementById("timeline-card-template");

const WEATHER_CODES = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Light freezing drizzle",
  57: "Freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Light freezing rain",
  67: "Freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Storm with light hail",
  99: "Storm with heavy hail"
};

const FORECAST_HOURS_LIMIT = 16 * 24;

initialize();

function initialize() {
  departureTimeInput.value = toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000));
  form.addEventListener("submit", handleSubmit);
}

async function handleSubmit(event) {
  event.preventDefault();

  const source = sourceInput.value.trim();
  const destination = destinationInput.value.trim();
  const departureDate = new Date(departureTimeInput.value);
  const profile = profileInput.value;
  const spacingMinutes = Number(spacingInput.value);
  const density = densityInput.value;

  if (!source || !destination) {
    renderError("Please provide both a starting point and a destination.");
    return;
  }

  if (Number.isNaN(departureDate.getTime())) {
    renderError("Please choose a valid departure time.");
    return;
  }

  if (departureDate.getTime() < Date.now() - 5 * 60 * 1000) {
    renderError("Please choose a departure time in the future.");
    return;
  }

  setLoadingState(true);
  clearNotice();

  try {
    const [sourcePlace, destinationPlace] = await Promise.all([
      geocodeLocation(source),
      geocodeLocation(destination)
    ]);

    const route = await getRoute(sourcePlace, destinationPlace, profile);
    const checkpoints = buildCheckpoints(route, departureDate, spacingMinutes, density);

    const hoursUntilArrival = (checkpoints.at(-1).eta.getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntilArrival > FORECAST_HOURS_LIMIT) {
      throw new Error("This trip goes beyond the forecast range available from the weather service. Try a closer departure time or a shorter route.");
    }

    const timelineEntries = await Promise.all(checkpoints.map(loadCheckpointWeather));
    renderRoute(sourcePlace, destinationPlace, route, departureDate, timelineEntries);
    setStatus("success", "Ready");
  } catch (error) {
    renderError(error.message || "Something went wrong while building your trip forecast.");
  } finally {
    setLoadingState(false);
  }
}

async function geocodeLocation(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not look up that location. Please try again.");
  }

  const data = await response.json();
  const place = data.results?.[0];

  if (!place) {
    throw new Error(`No location match found for "${query}".`);
  }

  return {
    name: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
    latitude: place.latitude,
    longitude: place.longitude
  };
}

async function getRoute(source, destination, profile) {
  const profileMap = {
    driving: "driving",
    cycling: "cycling",
    walking: "foot"
  };

  const mode = profileMap[profile] || "driving";
  const url = new URL(`https://router.project-osrm.org/route/v1/${mode}/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}`);
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "false");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not calculate the route between those places.");
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    throw new Error("The route service could not build a path for that trip.");
  }

  return {
    distanceMeters: route.distance,
    durationSeconds: route.duration,
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude }))
  };
}

function buildCheckpoints(route, departureDate, spacingMinutes, density) {
  const maxIntermediateStopsByDensity = {
    compact: 4,
    balanced: 7,
    detailed: 10
  };

  const totalMinutes = route.durationSeconds / 60;
  const estimatedStopCount = Math.floor(totalMinutes / spacingMinutes);
  const maxIntermediateStops = maxIntermediateStopsByDensity[density] ?? 7;
  const intermediateStops = clamp(estimatedStopCount, 0, maxIntermediateStops);
  const totalStops = intermediateStops + 2;

  const coordinatesWithDistance = buildDistanceTable(route.coordinates);
  const checkpoints = [];

  for (let index = 0; index < totalStops; index += 1) {
    const fraction = totalStops === 1 ? 0 : index / (totalStops - 1);
    const offsetSeconds = route.durationSeconds * fraction;
    const eta = new Date(departureDate.getTime() + offsetSeconds * 1000);
    const point = interpolatePoint(coordinatesWithDistance, fraction);

    checkpoints.push({
      id: `${index}-${fraction.toFixed(4)}`,
      label: checkpointLabel(index, totalStops, fraction),
      eta,
      latitude: point.latitude,
      longitude: point.longitude,
      progress: fraction
    });
  }

  return checkpoints;
}

function buildDistanceTable(coordinates) {
  let cumulativeDistance = 0;
  const table = coordinates.map((point, index) => {
    if (index > 0) {
      cumulativeDistance += haversineDistance(coordinates[index - 1], point);
    }

    return {
      ...point,
      cumulativeDistance
    };
  });

  return {
    totalDistance: cumulativeDistance,
    points: table
  };
}

function interpolatePoint(distanceTable, fraction) {
  if (fraction <= 0) {
    const first = distanceTable.points[0];
    return { latitude: first.latitude, longitude: first.longitude };
  }

  if (fraction >= 1) {
    const last = distanceTable.points.at(-1);
    return { latitude: last.latitude, longitude: last.longitude };
  }

  const targetDistance = distanceTable.totalDistance * fraction;

  for (let index = 1; index < distanceTable.points.length; index += 1) {
    const previous = distanceTable.points[index - 1];
    const current = distanceTable.points[index];

    if (current.cumulativeDistance >= targetDistance) {
      const segmentDistance = current.cumulativeDistance - previous.cumulativeDistance || 1;
      const segmentProgress = (targetDistance - previous.cumulativeDistance) / segmentDistance;

      return {
        latitude: lerp(previous.latitude, current.latitude, segmentProgress),
        longitude: lerp(previous.longitude, current.longitude, segmentProgress)
      };
    }
  }

  const last = distanceTable.points.at(-1);
  return { latitude: last.latitude, longitude: last.longitude };
}

async function loadCheckpointWeather(checkpoint) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(checkpoint.latitude));
  url.searchParams.set("longitude", String(checkpoint.longitude));
  url.searchParams.set("hourly", "temperature_2m,precipitation_probability,weather_code,wind_speed_10m");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("timezone", "GMT");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("forecast_days", "16");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Weather data could not be loaded for one of the route checkpoints.");
  }

  const data = await response.json();
  const hourly = data.hourly;
  const targetIndex = findNearestHourIndex(hourly.time, checkpoint.eta);

  if (targetIndex === -1) {
    throw new Error("No matching hourly forecast was available for part of this trip.");
  }

  const weatherCode = hourly.weather_code[targetIndex];
  const temp = Math.round(hourly.temperature_2m[targetIndex]);
  const precipChance = Math.round(hourly.precipitation_probability[targetIndex]);
  const wind = Math.round(hourly.wind_speed_10m[targetIndex]);

  return {
    ...checkpoint,
    forecastTime: new Date(hourly.time[targetIndex] * 1000),
    weatherLabel: WEATHER_CODES[weatherCode] || "Unknown conditions",
    temperature: temp,
    precipitationProbability: precipChance,
    windSpeed: wind
  };
}

function findNearestHourIndex(hourlyTimestamps, targetDate) {
  let bestIndex = -1;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 0; index < hourlyTimestamps.length; index += 1) {
    const difference = Math.abs(hourlyTimestamps[index] * 1000 - targetDate.getTime());

    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return bestDifference <= 90 * 60 * 1000 ? bestIndex : -1;
}

function renderRoute(sourcePlace, destinationPlace, route, departureDate, checkpoints) {
  resultsTitle.textContent = `${sourcePlace.name} to ${destinationPlace.name}`;
  renderSummary(sourcePlace, destinationPlace, route, departureDate, checkpoints);
  renderTimeline(checkpoints);

  const roughestStop = [...checkpoints].sort((left, right) => right.precipitationProbability - left.precipitationProbability)[0];
  const latestArrival = checkpoints.at(-1).eta;
  renderNotice(
    roughestStop.precipitationProbability >= 50
      ? `Heads up: the wettest checkpoint is around ${formatTime(roughestStop.eta)} with about a ${roughestStop.precipitationProbability}% chance of precipitation.`
      : `Forecasts look fairly calm along this route. Expected arrival is ${formatDateTime(latestArrival)}.`
  );
}

function renderSummary(sourcePlace, destinationPlace, route, departureDate, checkpoints) {
  const arrivalDate = checkpoints.at(-1).eta;
  const distanceMiles = (route.distanceMeters * 0.000621371).toFixed(0);
  const hours = Math.floor(route.durationSeconds / 3600);
  const minutes = Math.round((route.durationSeconds % 3600) / 60);
  const coldestPoint = [...checkpoints].sort((left, right) => left.temperature - right.temperature)[0];
  const warmestPoint = [...checkpoints].sort((left, right) => right.temperature - left.temperature)[0];

  summary.classList.remove("empty");
  summary.innerHTML = `
    <p class="summary-route">Leaving <strong>${escapeHtml(sourcePlace.name)}</strong> at <strong>${formatDateTime(departureDate)}</strong> and heading to <strong>${escapeHtml(destinationPlace.name)}</strong>.</p>
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="label">Estimated drive</span>
        <span class="value">${hours > 0 ? `${hours} hr ` : ""}${minutes} min</span>
      </div>
      <div class="summary-stat">
        <span class="label">Distance</span>
        <span class="value">${distanceMiles} mi</span>
      </div>
      <div class="summary-stat">
        <span class="label">Arrival</span>
        <span class="value">${formatDateTime(arrivalDate)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Temperature swing</span>
        <span class="value">${coldestPoint.temperature}F to ${warmestPoint.temperature}F</span>
      </div>
    </div>
  `;
}

function renderTimeline(checkpoints) {
  timeline.classList.remove("empty");
  timeline.innerHTML = "";

  checkpoints.forEach((checkpoint) => {
    const fragment = timelineCardTemplate.content.cloneNode(true);
    fragment.querySelector(".checkpoint-label").textContent = checkpoint.label;
    fragment.querySelector(".eta-text").textContent = formatDateTime(checkpoint.eta);
    fragment.querySelector(".weather-main").textContent = `${checkpoint.weatherLabel} • ${checkpoint.temperature}F`;
    fragment.querySelector(".weather-meta").textContent = `${checkpoint.precipitationProbability}% precip • ${checkpoint.windSpeed} mph wind`;
    timeline.appendChild(fragment);
  });
}

function renderError(message) {
  setStatus("error", "Issue");
  renderNotice(message);
}

function renderNotice(message) {
  notice.textContent = message;
}

function clearNotice() {
  notice.textContent = "";
}

function setLoadingState(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? "Planning..." : "Plan trip weather";

  if (isLoading) {
    setStatus("loading", "Loading");
  }
}

function setStatus(kind, text) {
  statusBadge.className = `status-badge ${kind}`;
  statusBadge.textContent = text;
}

function checkpointLabel(index, totalStops, fraction) {
  if (index === 0) {
    return "Departure";
  }

  if (index === totalStops - 1) {
    return "Arrival";
  }

  return `${Math.round(fraction * 100)}% into trip`;
}

function toLocalInputValue(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function haversineDistance(start, end) {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latitudeDelta = toRadians(end.latitude - start.latitude);
  const longitudeDelta = toRadians(end.longitude - start.longitude);
  const startLatitude = toRadians(start.latitude);
  const endLatitude = toRadians(end.latitude);

  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
