const form = document.getElementById("trip-form");
const sourceInput = document.getElementById("source");
const destinationInput = document.getElementById("destination");
const sourceSuggestions = document.getElementById("sourceSuggestions");
const destinationSuggestions = document.getElementById("destinationSuggestions");
const departureTimeInput = document.getElementById("departureTime");
const profileInput = document.getElementById("profile");
const spacingInput = document.getElementById("spacing");
const densityInput = document.getElementById("density");
const showDirectionsInput = document.getElementById("showDirections");
const submitButton = document.getElementById("submitButton");
const swapTripButton = document.getElementById("swapTrip");
const recenterMapButton = document.getElementById("recenterMap");
const toggleMarkersButton = document.getElementById("toggleMarkers");
const jumpToDirectionsButton = document.getElementById("jumpToDirections");
const resultsTitle = document.getElementById("resultsTitle");
const summary = document.getElementById("summary");
const timeline = document.getElementById("timeline");
const directionsList = document.getElementById("directionsList");
const directionsSection = document.getElementById("directionsSection");
const notice = document.getElementById("notice");
const statusBadge = document.getElementById("statusBadge");
const mapEmpty = document.getElementById("mapEmpty");
const mapLegend = document.getElementById("mapLegend");
const timelineCardTemplate = document.getElementById("timeline-card-template");
const directionStepTemplate = document.getElementById("direction-step-template");

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
const AUTOCOMPLETE_MINIMUM = 2;

const state = {
  selectedPlaces: {
    source: null,
    destination: null
  },
  suggestionTimers: {
    source: null,
    destination: null
  },
  suggestionControllers: {
    source: null,
    destination: null
  },
  map: null,
  layers: null,
  routeBounds: null,
  checkpointMarkersVisible: true,
  checkpointMarkersById: new Map(),
  routeData: null
};

initialize();

function initialize() {
  departureTimeInput.value = toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000));
  initializeMap();
  bindAutocomplete("source", sourceInput, sourceSuggestions);
  bindAutocomplete("destination", destinationInput, destinationSuggestions);
  form.addEventListener("submit", handleSubmit);
  showDirectionsInput.addEventListener("change", updateDirectionsVisibility);
  swapTripButton.addEventListener("click", handleSwapTrip);
  recenterMapButton.addEventListener("click", recenterMapToRoute);
  toggleMarkersButton.addEventListener("click", handleToggleMarkers);
  jumpToDirectionsButton.addEventListener("click", handleJumpToDirections);
  document.addEventListener("click", handleDocumentClick);
  updateDirectionsVisibility();
}

function initializeMap() {
  const map = L.map("map", {
    zoomControl: false
  }).setView([39.5, -98.35], 4);

  const streetLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  });

  const humanitarianLayer = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, HOT'
  });

  streetLayer.addTo(map);
  L.control.zoom({ position: "topright" }).addTo(map);
  L.control.scale({ metric: false }).addTo(map);
  L.control.layers(
    {
      Streets: streetLayer,
      Humanitarian: humanitarianLayer
    },
    undefined,
    { position: "bottomright" }
  ).addTo(map);

  state.map = map;
  state.layers = {
    route: L.polyline([], {
      color: "#0e8b78",
      weight: 6,
      opacity: 0.84,
      lineJoin: "round"
    }).addTo(map),
    checkpoints: L.layerGroup().addTo(map),
    directions: L.layerGroup().addTo(map)
  };
}

function bindAutocomplete(fieldName, input, suggestionBox) {
  input.addEventListener("input", () => {
    state.selectedPlaces[fieldName] = null;
    queueSuggestions(fieldName, input.value.trim(), suggestionBox);
  });

  input.addEventListener("focus", () => {
    const query = input.value.trim();
    if (query.length >= AUTOCOMPLETE_MINIMUM) {
      queueSuggestions(fieldName, query, suggestionBox, 0);
    }
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hideSuggestions(suggestionBox);
    }
  });
}

function queueSuggestions(fieldName, query, suggestionBox, delay = 250) {
  clearTimeout(state.suggestionTimers[fieldName]);

  if (query.length < AUTOCOMPLETE_MINIMUM) {
    hideSuggestions(suggestionBox);
    return;
  }

  state.suggestionTimers[fieldName] = window.setTimeout(async () => {
    if (state.suggestionControllers[fieldName]) {
      state.suggestionControllers[fieldName].abort();
    }

    const controller = new AbortController();
    state.suggestionControllers[fieldName] = controller;

    try {
      const suggestions = await fetchPlaceSuggestions(query, controller.signal);
      renderSuggestions(fieldName, suggestionBox, suggestions);
    } catch (error) {
      if (error.name !== "AbortError") {
        hideSuggestions(suggestionBox);
      }
    }
  }, delay);
}

async function fetchPlaceSuggestions(query, signal) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Suggestion lookup failed.");
  }

  const data = await response.json();
  const results = data.results ?? [];

  return results.map((place) => normalizePlace(place));
}

function renderSuggestions(fieldName, suggestionBox, places) {
  suggestionBox.innerHTML = "";

  if (!places.length) {
    hideSuggestions(suggestionBox);
    return;
  }

  places.forEach((place) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.innerHTML = `
      <span class="suggestion-main">${escapeHtml(place.shortName)}</span>
      <span class="suggestion-meta">${escapeHtml(place.context || place.country || "Suggested match")}</span>
    `;

    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    button.addEventListener("click", () => {
      selectSuggestion(fieldName, place);
      hideSuggestions(suggestionBox);
    });

    suggestionBox.appendChild(button);
  });

  suggestionBox.hidden = false;
}

function hideSuggestions(suggestionBox) {
  suggestionBox.hidden = true;
  suggestionBox.innerHTML = "";
}

function selectSuggestion(fieldName, place) {
  state.selectedPlaces[fieldName] = place;

  const targetInput = fieldName === "source" ? sourceInput : destinationInput;
  targetInput.value = place.label;
}

function handleDocumentClick(event) {
  const insideAutocomplete = event.target.closest("[data-autocomplete]");

  if (!insideAutocomplete) {
    hideSuggestions(sourceSuggestions);
    hideSuggestions(destinationSuggestions);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const departureDate = new Date(departureTimeInput.value);
  const spacingMinutes = Number(spacingInput.value);
  const density = densityInput.value;

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
      resolvePlace("source", sourceInput.value.trim()),
      resolvePlace("destination", destinationInput.value.trim())
    ]);

    const route = await getRoute(sourcePlace, destinationPlace, profileInput.value);
    const checkpoints = buildCheckpoints(route, departureDate, spacingMinutes, density);
    const forecastHorizonHours = (checkpoints.at(-1).eta.getTime() - Date.now()) / (1000 * 60 * 60);

    if (forecastHorizonHours > FORECAST_HOURS_LIMIT) {
      throw new Error("This trip stretches past the forecast window. Try a closer departure time or a shorter route.");
    }

    const checkpointEntries = await Promise.all(
      checkpoints.map((checkpoint, index) =>
        loadCheckpointBundle(checkpoint, index, checkpoints.length, sourcePlace, destinationPlace)
      )
    );

    const labeledCheckpoints = applyCheckpointLabels(checkpointEntries, sourcePlace, destinationPlace);
    const tripData = {
      sourcePlace,
      destinationPlace,
      route,
      departureDate,
      checkpoints: labeledCheckpoints,
      directions: route.directions
    };

    state.routeData = tripData;
    renderTrip(tripData);
    setStatus("success", "Ready");
  } catch (error) {
    renderError(error.message || "Something went wrong while building the route.");
  } finally {
    setLoadingState(false);
  }
}

async function resolvePlace(fieldName, value) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error("Please provide both a starting point and a destination.");
  }

  const selected = state.selectedPlaces[fieldName];
  if (selected && selected.label === trimmedValue) {
    return selected;
  }

  return geocodeLocation(trimmedValue);
}

async function geocodeLocation(query) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", query);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not look up that location.");
  }

  const data = await response.json();
  const place = data.results?.[0];

  if (!place) {
    throw new Error(`No location match found for "${query}".`);
  }

  return normalizePlace(place);
}

function normalizePlace(place) {
  const context = [place.admin1, place.country].filter(Boolean).join(", ");

  return {
    id: place.id,
    shortName: place.name,
    context,
    country: place.country,
    label: [place.name, place.admin1, place.country].filter(Boolean).join(", "),
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
  const url = new URL(
    `https://router.project-osrm.org/route/v1/${mode}/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}`
  );
  url.searchParams.set("overview", "full");
  url.searchParams.set("geometries", "geojson");
  url.searchParams.set("steps", "true");

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
    coordinates: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
    directions: flattenDirections(route.legs ?? [])
  };
}

function flattenDirections(legs) {
  return legs.flatMap((leg) => leg.steps ?? []).map((step, index) => {
    const [longitude, latitude] = step.maneuver?.location ?? [0, 0];

    return {
      index,
      instruction: formatDirectionInstruction(step),
      distanceMeters: step.distance,
      durationSeconds: step.duration,
      distanceText: formatDistance(step.distance),
      durationText: formatDuration(step.duration),
      latitude,
      longitude,
      roadName: roadName(step),
      raw: step
    };
  });
}

function buildCheckpoints(route, departureDate, spacingMinutes, density) {
  const maxIntermediateStopsByDensity = {
    compact: 5,
    balanced: 8,
    detailed: 12
  };

  const totalMinutes = route.durationSeconds / 60;
  const estimatedStopCount = Math.floor(totalMinutes / spacingMinutes);
  const maxIntermediateStops = maxIntermediateStopsByDensity[density] ?? 8;
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
      eta,
      latitude: point.latitude,
      longitude: point.longitude,
      progress: fraction
    });
  }

  return checkpoints;
}

async function loadCheckpointBundle(checkpoint, index, totalCount, sourcePlace, destinationPlace) {
  const [weather, locationName] = await Promise.all([
    loadCheckpointWeather(checkpoint),
    resolveCheckpointLocation(checkpoint, index, totalCount, sourcePlace, destinationPlace)
  ]);

  return {
    ...weather,
    locationName
  };
}

async function resolveCheckpointLocation(checkpoint, index, totalCount, sourcePlace, destinationPlace) {
  if (index === 0) {
    return sourcePlace.shortName;
  }

  if (index === totalCount - 1) {
    return destinationPlace.shortName;
  }

  try {
    const nearbyName = await reverseGeocodeNearbyPlace(checkpoint.latitude, checkpoint.longitude);
    return nearbyName;
  } catch {
    return null;
  }
}

async function reverseGeocodeNearbyPlace(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "10");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not reverse geocode.");
  }

  const data = await response.json();
  const address = data.address ?? {};

  return address.city
    || address.town
    || address.village
    || address.municipality
    || address.county
    || data.name
    || null;
}

function applyCheckpointLabels(checkpoints, sourcePlace, destinationPlace) {
  const usedNames = new Set([
    sourcePlace.shortName.toLowerCase(),
    destinationPlace.shortName.toLowerCase()
  ]);

  return checkpoints.map((checkpoint, index) => {
    if (index === 0) {
      return {
        ...checkpoint,
        label: `Depart ${sourcePlace.shortName}`,
        cityName: sourcePlace.shortName
      };
    }

    if (index === checkpoints.length - 1) {
      return {
        ...checkpoint,
        label: `Arrive ${destinationPlace.shortName}`,
        cityName: destinationPlace.shortName
      };
    }

    const cityName = checkpoint.locationName?.trim();
    const normalizedCityName = cityName?.toLowerCase();
    const hasUniqueCityName = normalizedCityName && !usedNames.has(normalizedCityName);

    if (hasUniqueCityName) {
      usedNames.add(normalizedCityName);
    }

    return {
      ...checkpoint,
      label: hasUniqueCityName ? `Near ${cityName}` : `${Math.round(checkpoint.progress * 100)}% into trip`,
      cityName: cityName || `Checkpoint ${Math.round(checkpoint.progress * 100)}%`
    };
  });
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

function renderTrip(tripData) {
  const { sourcePlace, destinationPlace, route, departureDate, checkpoints, directions } = tripData;

  resultsTitle.textContent = `${sourcePlace.shortName} to ${destinationPlace.shortName}`;
  renderSummary(sourcePlace, destinationPlace, route, departureDate, checkpoints, directions);
  renderTimeline(checkpoints);
  renderDirections(directions);
  renderMap(sourcePlace, destinationPlace, route, checkpoints);
  renderMapLegend(route, checkpoints);
  mapEmpty.classList.add("is-hidden");

  const wettestCheckpoint = [...checkpoints].sort(
    (left, right) => right.precipitationProbability - left.precipitationProbability
  )[0];

  renderNotice(
    wettestCheckpoint.precipitationProbability >= 50
      ? `Heads up: the wettest stretch is near ${wettestCheckpoint.cityName} around ${formatTime(wettestCheckpoint.eta)} with about a ${wettestCheckpoint.precipitationProbability}% precipitation chance.`
      : `Forecasts look fairly calm along this route. Click any checkpoint or direction step to focus it on the map.`
  );
}

function renderSummary(sourcePlace, destinationPlace, route, departureDate, checkpoints, directions) {
  const arrivalDate = checkpoints.at(-1).eta;
  const distanceMiles = Math.round(route.distanceMeters * 0.000621371);
  const coldestPoint = [...checkpoints].sort((left, right) => left.temperature - right.temperature)[0];
  const warmestPoint = [...checkpoints].sort((left, right) => right.temperature - left.temperature)[0];

  summary.classList.remove("empty");
  summary.innerHTML = `
    <p class="summary-route">Leaving <strong>${escapeHtml(sourcePlace.label)}</strong> at <strong>${formatDateTime(departureDate)}</strong> and routing to <strong>${escapeHtml(destinationPlace.label)}</strong>.</p>
    <p class="summary-subcopy">Sampled across nearby cities and route intervals so the forecast follows your expected arrival time, not just the start city.</p>
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="label">Estimated trip</span>
        <span class="value">${formatDuration(route.durationSeconds)}</span>
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
        <span class="label">Weather stops</span>
        <span class="value">${checkpoints.length}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Directions</span>
        <span class="value">${directions.length} steps</span>
      </div>
      <div class="summary-stat">
        <span class="label">Coldest point</span>
        <span class="value">${coldestPoint.temperature}F near ${escapeHtml(coldestPoint.cityName)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Warmest point</span>
        <span class="value">${warmestPoint.temperature}F near ${escapeHtml(warmestPoint.cityName)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Travel mode</span>
        <span class="value">${capitalize(profileInput.value)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Spacing</span>
        <span class="value">${spacingInput.value} min</span>
      </div>
      <div class="summary-stat">
        <span class="label">Forecast range</span>
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
    const card = fragment.querySelector(".timeline-card");
    card.dataset.checkpointId = checkpoint.id;
    fragment.querySelector(".checkpoint-label").textContent = checkpoint.label;
    fragment.querySelector(".eta-text").textContent = formatDateTime(checkpoint.eta);
    fragment.querySelector(".weather-main").textContent = `${checkpoint.weatherLabel} • ${checkpoint.temperature}F`;
    fragment.querySelector(".weather-meta").textContent = `${checkpoint.precipitationProbability}% precip • ${checkpoint.windSpeed} mph wind`;

    card.addEventListener("click", () => focusCheckpoint(checkpoint.id));
    timeline.appendChild(fragment);
  });
}

function renderDirections(directions) {
  directionsList.classList.remove("empty");
  directionsList.innerHTML = "";

  if (!directions.length) {
    directionsList.innerHTML = `
      <div class="empty-state compact">
        <h3>No directions</h3>
        <p>The routing service did not return turn-by-turn steps for this route.</p>
      </div>
    `;
    return;
  }

  directions.forEach((direction) => {
    const fragment = directionStepTemplate.content.cloneNode(true);
    const button = fragment.querySelector(".direction-step");
    button.dataset.directionIndex = String(direction.index);
    fragment.querySelector(".direction-index").textContent = String(direction.index + 1);
    fragment.querySelector(".direction-main").textContent = direction.instruction;
    fragment.querySelector(".direction-meta").textContent = `${direction.distanceText} • ${direction.durationText}`;

    button.addEventListener("click", () => focusDirectionStep(direction.index));
    directionsList.appendChild(fragment);
  });

  updateDirectionsVisibility();
}

function renderMap(sourcePlace, destinationPlace, route, checkpoints) {
  const routeLatLngs = route.coordinates.map((point) => [point.latitude, point.longitude]);
  state.layers.route.setLatLngs(routeLatLngs);
  state.layers.checkpoints.clearLayers();
  state.layers.directions.clearLayers();
  state.checkpointMarkersById.clear();

  checkpoints.forEach((checkpoint, index) => {
    const markerType = index === 0 ? "start" : index === checkpoints.length - 1 ? "end" : "checkpoint";
    const marker = L.marker([checkpoint.latitude, checkpoint.longitude], {
      icon: createMapIcon(markerType, index, checkpoints.length)
    });

    marker.bindPopup(buildCheckpointPopup(checkpoint));
    marker.on("click", () => highlightTimelineCard(checkpoint.id));
    marker.addTo(state.layers.checkpoints);
    state.checkpointMarkersById.set(checkpoint.id, marker);
  });

  const bounds = L.latLngBounds(routeLatLngs);
  state.routeBounds = bounds;
  state.map.fitBounds(bounds, {
    padding: [40, 40]
  });

  updateMarkerLayerVisibility();
}

function renderMapLegend(route, checkpoints) {
  const wettestCheckpoint = [...checkpoints].sort(
    (left, right) => right.precipitationProbability - left.precipitationProbability
  )[0];

  mapLegend.classList.remove("empty");
  mapLegend.innerHTML = `
    <span class="legend-chip">${capitalize(profileInput.value)}</span>
    <span class="legend-chip">${Math.round(route.distanceMeters * 0.000621371)} miles</span>
    <span class="legend-chip">${checkpoints.length} forecast checkpoints</span>
    <span class="legend-chip">Wettest near ${escapeHtml(wettestCheckpoint.cityName)}</span>
  `;
}

function focusCheckpoint(checkpointId) {
  const marker = state.checkpointMarkersById.get(checkpointId);
  const checkpoint = state.routeData?.checkpoints.find((item) => item.id === checkpointId);

  if (!marker || !checkpoint) {
    return;
  }

  if (!state.checkpointMarkersVisible) {
    state.checkpointMarkersVisible = true;
    updateMarkerLayerVisibility();
  }

  state.map.flyTo(marker.getLatLng(), Math.max(state.map.getZoom(), 9), {
    duration: 0.7
  });
  marker.openPopup();
  highlightTimelineCard(checkpointId);
}

function focusDirectionStep(directionIndex) {
  const direction = state.routeData?.directions.find((item) => item.index === directionIndex);

  if (!direction) {
    return;
  }

  state.layers.directions.clearLayers();

  const marker = L.circleMarker([direction.latitude, direction.longitude], {
    radius: 10,
    color: "#e68c2b",
    weight: 3,
    fillColor: "#fff4db",
    fillOpacity: 0.95
  }).addTo(state.layers.directions);

  marker.bindPopup(
    `<div class="popup-card"><strong>${escapeHtml(direction.instruction)}</strong><span>${escapeHtml(direction.distanceText)} • ${escapeHtml(direction.durationText)}</span></div>`
  );
  marker.openPopup();

  state.map.flyTo([direction.latitude, direction.longitude], Math.max(state.map.getZoom(), 12), {
    duration: 0.7
  });
  highlightDirectionCard(directionIndex);
}

function highlightTimelineCard(checkpointId) {
  timeline.querySelectorAll(".timeline-card").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.checkpointId === checkpointId);
  });
}

function highlightDirectionCard(directionIndex) {
  directionsList.querySelectorAll(".direction-step").forEach((card) => {
    card.classList.toggle("is-active", card.dataset.directionIndex === String(directionIndex));
  });
}

function buildCheckpointPopup(checkpoint) {
  return `
    <div class="popup-card">
      <strong>${escapeHtml(checkpoint.label)}</strong>
      <span>${escapeHtml(formatDateTime(checkpoint.eta))}</span>
      <span>${escapeHtml(`${checkpoint.weatherLabel} • ${checkpoint.temperature}F`)}</span>
      <span>${escapeHtml(`${checkpoint.precipitationProbability}% precip • ${checkpoint.windSpeed} mph wind`)}</span>
    </div>
  `;
}

function createMapIcon(type, index, totalCount) {
  const label = type === "start" ? "S" : type === "end" ? "E" : String(index);
  const className = type === "start" ? "pin-start" : type === "end" ? "pin-end" : "pin-checkpoint";

  return L.divIcon({
    className: "",
    html: `<span class="map-pin ${className}">${escapeHtml(label)}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -12]
  });
}

function handleSwapTrip() {
  const sourceValue = sourceInput.value;
  const destinationValue = destinationInput.value;
  const sourcePlace = state.selectedPlaces.source;
  const destinationPlace = state.selectedPlaces.destination;

  sourceInput.value = destinationValue;
  destinationInput.value = sourceValue;
  state.selectedPlaces.source = destinationPlace;
  state.selectedPlaces.destination = sourcePlace;
}

function recenterMapToRoute() {
  if (state.routeBounds) {
    state.map.fitBounds(state.routeBounds, {
      padding: [40, 40]
    });
  }
}

function handleToggleMarkers() {
  state.checkpointMarkersVisible = !state.checkpointMarkersVisible;
  updateMarkerLayerVisibility();
}

function updateMarkerLayerVisibility() {
  toggleMarkersButton.textContent = state.checkpointMarkersVisible ? "Hide checkpoints" : "Show checkpoints";

  if (state.checkpointMarkersVisible) {
    if (!state.map.hasLayer(state.layers.checkpoints)) {
      state.layers.checkpoints.addTo(state.map);
    }
  } else if (state.map.hasLayer(state.layers.checkpoints)) {
    state.map.removeLayer(state.layers.checkpoints);
  }
}

function handleJumpToDirections() {
  showDirectionsInput.checked = true;
  updateDirectionsVisibility();
  directionsSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

function updateDirectionsVisibility() {
  directionsSection.classList.toggle("is-hidden", !showDirectionsInput.checked);
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

function formatDirectionInstruction(step) {
  const maneuver = step.maneuver ?? {};
  const modifier = maneuver.modifier ? humanizeModifier(maneuver.modifier) : "";
  const road = roadName(step);

  switch (maneuver.type) {
    case "depart":
      return `Depart and head ${modifier || "out"} on ${road}.`;
    case "arrive":
      return `Arrive at your destination${modifier ? ` on the ${modifier}` : ""}.`;
    case "turn":
      return `Turn ${modifier || "ahead"} onto ${road}.`;
    case "continue":
      return `Continue on ${road}.`;
    case "new name":
      return `Continue as ${road}.`;
    case "merge":
      return `Merge ${modifier ? `${modifier} ` : ""}onto ${road}.`;
    case "fork":
      return `Keep ${modifier || "ahead"} to stay on ${road}.`;
    case "on ramp":
      return `Take the ${modifier || ""} ramp onto ${road}.`.replace("  ", " ");
    case "off ramp":
      return `Take the ${modifier || ""} exit toward ${road}.`.replace("  ", " ");
    case "end of road":
      return `At the end of the road, turn ${modifier || "ahead"} onto ${road}.`;
    case "roundabout":
    case "rotary":
      return `Enter the roundabout and continue toward ${road}.`;
    case "use lane":
      return `Use the lane to continue ${modifier || "ahead"} onto ${road}.`;
    default:
      return `${capitalize(maneuver.type || "Continue")} on ${road}.`;
  }
}

function roadName(step) {
  return step.name || step.ref || step.destinations || "the road ahead";
}

function humanizeModifier(modifier) {
  return modifier.replaceAll("-", " ");
}

function formatDistance(distanceMeters) {
  if (distanceMeters < 161) {
    return `${Math.round(distanceMeters * 3.28084)} ft`;
  }

  const miles = distanceMeters * 0.000621371;
  return miles >= 10 ? `${miles.toFixed(0)} mi` : `${miles.toFixed(1)} mi`;
}

function formatDuration(durationSeconds) {
  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${Math.max(minutes, 1)} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
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

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
