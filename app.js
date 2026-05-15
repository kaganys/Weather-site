const form = document.getElementById("trip-form");
const sourceInput = document.getElementById("source");
const destinationInput = document.getElementById("destination");
const sourceSuggestions = document.getElementById("sourceSuggestions");
const destinationSuggestions = document.getElementById("destinationSuggestions");
const departureTimeInput = document.getElementById("departureTime");
const profileInput = document.getElementById("profile");
const unitsInput = document.getElementById("units");
const tripNotesInput = document.getElementById("tripNotes");
const showDirectionsInput = document.getElementById("showDirections");
const useMyLocationButton = document.getElementById("useMyLocation");
const submitButton = document.getElementById("submitButton");
const swapTripButton = document.getElementById("swapTrip");
const recenterMapButton = document.getElementById("recenterMap");
const toggleMarkersButton = document.getElementById("toggleMarkers");
const toggleSynagoguesButton = document.getElementById("toggleSynagogues");
const fullscreenMapButton = document.getElementById("fullscreenMap");
const jumpToDirectionsButton = document.getElementById("jumpToDirections");
const copySummaryButton = document.getElementById("copySummary");
const copyShareLinkButton = document.getElementById("copyShareLink");
const exportTripButton = document.getElementById("exportTrip");
const printTripButton = document.getElementById("printTrip");
const clearRecentTripsButton = document.getElementById("clearRecentTrips");
const resultsTitle = document.getElementById("resultsTitle");
const summary = document.getElementById("summary");
const recentTrips = document.getElementById("recentTrips");
const timeline = document.getElementById("timeline");
const directionsList = document.getElementById("directionsList");
const directionsOverview = document.getElementById("directionsOverview");
const directionsSection = document.getElementById("directionsSection");
const directionFilterInput = document.getElementById("directionFilter");
const majorStepsOnlyInput = document.getElementById("majorStepsOnly");
const notice = document.getElementById("notice");
const statusBadge = document.getElementById("statusBadge");
const mapEmpty = document.getElementById("mapEmpty");
const mapLegend = document.getElementById("mapLegend");
const timelineCardTemplate = document.getElementById("timeline-card-template");
const directionStepTemplate = document.getElementById("direction-step-template");
const quickTimeButtons = Array.from(document.querySelectorAll(".quick-time"));

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

const CHECKPOINT_INTERVAL_MINUTES = 30;
const FORECAST_HOURS_LIMIT = 16 * 24;
const AUTOCOMPLETE_MINIMUM = 3;
const STORAGE_KEYS = {
  recentTrips: "routeWeatherRecentTripsV2",
  preferences: "routeWeatherPreferencesV2"
};

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
  suggestionResults: {
    source: [],
    destination: []
  },
  suggestionIndex: {
    source: -1,
    destination: -1
  },
  reverseGeocodeCache: new Map(),
  map: null,
  layers: null,
  routeBounds: null,
  checkpointMarkersVisible: true,
  synagoguesVisible: true,
  synagogueFetchTimer: null,
  synagogueFetchController: null,
  synagogueMarkersCount: 0,
  recentTrips: [],
  preferences: {
    units: "imperial",
    directionFilter: "",
    majorStepsOnly: false
  },
  checkpointMarkersById: new Map(),
  routeData: null
};

initialize();

function initialize() {
  loadPreferences();
  applyPreferencesToInputs();
  loadRecentTrips();
  renderRecentTrips();
  departureTimeInput.value = toLocalInputValue(new Date(Date.now() + 30 * 60 * 1000));
  initializeMap();
  bindAutocomplete("source", sourceInput, sourceSuggestions);
  bindAutocomplete("destination", destinationInput, destinationSuggestions);
  bindQuickTimeButtons();
  form.addEventListener("submit", handleSubmit);
  showDirectionsInput.addEventListener("change", updateDirectionsVisibility);
  useMyLocationButton.addEventListener("click", handleUseMyLocation);
  unitsInput.addEventListener("change", handleUnitsChange);
  swapTripButton.addEventListener("click", handleSwapTrip);
  recenterMapButton.addEventListener("click", recenterMapToRoute);
  toggleMarkersButton.addEventListener("click", handleToggleMarkers);
  toggleSynagoguesButton.addEventListener("click", handleToggleSynagogues);
  fullscreenMapButton.addEventListener("click", handleFullscreenMap);
  jumpToDirectionsButton.addEventListener("click", handleJumpToDirections);
  copySummaryButton.addEventListener("click", handleCopySummary);
  copyShareLinkButton.addEventListener("click", handleCopyShareLink);
  exportTripButton.addEventListener("click", handleExportTrip);
  printTripButton.addEventListener("click", handlePrintTrip);
  clearRecentTripsButton.addEventListener("click", handleClearRecentTrips);
  directionFilterInput.addEventListener("input", handleDirectionPreferencesChange);
  majorStepsOnlyInput.addEventListener("change", handleDirectionPreferencesChange);
  document.addEventListener("click", handleDocumentClick);
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("fullscreenchange", () => {
    fullscreenMapButton.classList.toggle("is-active", Boolean(document.fullscreenElement));
    window.setTimeout(() => state.map?.invalidateSize(), 150);
  });
  updateDirectionsVisibility();
  restoreTripFromUrl();
}

function loadPreferences() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.preferences) || "{}");
    state.preferences.units = saved.units === "metric" ? "metric" : "imperial";
    state.preferences.directionFilter = typeof saved.directionFilter === "string" ? saved.directionFilter : "";
    state.preferences.majorStepsOnly = Boolean(saved.majorStepsOnly);
  } catch {
    state.preferences.units = "imperial";
    state.preferences.directionFilter = "";
    state.preferences.majorStepsOnly = false;
  }
}

function savePreferences() {
  localStorage.setItem(STORAGE_KEYS.preferences, JSON.stringify(state.preferences));
}

function applyPreferencesToInputs() {
  unitsInput.value = state.preferences.units;
  directionFilterInput.value = state.preferences.directionFilter;
  majorStepsOnlyInput.checked = state.preferences.majorStepsOnly;
}

function loadRecentTrips() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.recentTrips) || "[]");
    state.recentTrips = Array.isArray(saved) ? saved.slice(0, 6) : [];
  } catch {
    state.recentTrips = [];
  }
}

function saveRecentTrips() {
  localStorage.setItem(STORAGE_KEYS.recentTrips, JSON.stringify(state.recentTrips.slice(0, 6)));
}

function renderRecentTrips() {
  recentTrips.innerHTML = "";

  if (!state.recentTrips.length) {
    recentTrips.classList.add("empty");
    recentTrips.innerHTML = "<p>Recent trips you plan will show up here.</p>";
    return;
  }

  recentTrips.classList.remove("empty");

  state.recentTrips.forEach((trip, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-trip";
    button.innerHTML = `
      <strong>${escapeHtml(trip.sourceShort)} to ${escapeHtml(trip.destinationShort)}</strong>
      <span>${escapeHtml(formatSavedTripDate(trip.departureTime))} • ${escapeHtml(capitalize(trip.profile))}</span>
    `;
    button.addEventListener("click", () => {
      applySavedTrip(trip);
      renderNotice(`Loaded recent trip ${index + 1}.`);
    });
    recentTrips.appendChild(button);
  });
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
      color: "#0b8b77",
      weight: 6,
      opacity: 0.84,
      lineJoin: "round"
    }).addTo(map),
    checkpoints: L.layerGroup().addTo(map),
    synagogues: L.layerGroup().addTo(map),
    directions: L.layerGroup().addTo(map)
  };

  map.on("moveend", scheduleSynagogueRefresh);
}

function bindAutocomplete(fieldName, input, suggestionBox) {
  input.addEventListener("input", () => {
    state.selectedPlaces[fieldName] = null;
    queueSuggestions(fieldName, input.value.trim(), suggestionBox);
  });

  input.addEventListener("focus", () => {
    const field = input.closest(".autocomplete-field");
    field?.classList.remove("is-open");
  });

  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      hideSuggestions(fieldName, suggestionBox);
    }, 120);
  });

  input.addEventListener("keydown", (event) => {
    handleAutocompleteKeydown(event, fieldName, suggestionBox);
  });
}

function bindQuickTimeButtons() {
  quickTimeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const shiftMinutes = Number(button.dataset.departureShift);
      const preset = button.dataset.departurePreset;

      if (!Number.isNaN(shiftMinutes)) {
        departureTimeInput.value = toLocalInputValue(new Date(Date.now() + shiftMinutes * 60 * 1000));
        return;
      }

      if (preset === "tomorrow-8") {
        const tomorrowMorning = new Date();
        tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
        tomorrowMorning.setHours(8, 0, 0, 0);
        departureTimeInput.value = toLocalInputValue(tomorrowMorning);
      }
    });
  });
}

function queueSuggestions(fieldName, query, suggestionBox, delay = 140) {
  clearTimeout(state.suggestionTimers[fieldName]);

  if (query.length < AUTOCOMPLETE_MINIMUM) {
    state.suggestionResults[fieldName] = [];
    state.suggestionIndex[fieldName] = -1;
    hideSuggestions(fieldName, suggestionBox);
    return;
  }

  renderSuggestionState(fieldName, suggestionBox, "Searching addresses...");

  state.suggestionTimers[fieldName] = window.setTimeout(async () => {
    if (state.suggestionControllers[fieldName]) {
      state.suggestionControllers[fieldName].abort();
    }

    const controller = new AbortController();
    state.suggestionControllers[fieldName] = controller;

    try {
      const suggestions = await fetchPlaceSuggestions(query, controller.signal);
      state.suggestionResults[fieldName] = suggestions;
      state.suggestionIndex[fieldName] = suggestions.length ? 0 : -1;
      renderSuggestions(fieldName, suggestionBox);
    } catch (error) {
      if (error.name !== "AbortError") {
        renderSuggestionState(fieldName, suggestionBox, "Suggestion lookup failed.");
      }
    }
  }, delay);
}

function handleAutocompleteKeydown(event, fieldName, suggestionBox) {
  const suggestions = state.suggestionResults[fieldName];
  const hasSuggestionsOpen = !suggestionBox.hidden && suggestions.length > 0;

  if (event.key === "Escape") {
    hideSuggestions(fieldName, suggestionBox);
    return;
  }

  if (event.key === "ArrowDown" && hasSuggestionsOpen) {
    event.preventDefault();
    state.suggestionIndex[fieldName] = (state.suggestionIndex[fieldName] + 1) % suggestions.length;
    renderSuggestions(fieldName, suggestionBox);
    return;
  }

  if (event.key === "ArrowUp" && hasSuggestionsOpen) {
    event.preventDefault();
    state.suggestionIndex[fieldName] = (state.suggestionIndex[fieldName] - 1 + suggestions.length) % suggestions.length;
    renderSuggestions(fieldName, suggestionBox);
    return;
  }

  if (event.key === "Enter" && hasSuggestionsOpen && state.suggestionIndex[fieldName] >= 0) {
    event.preventDefault();
    const selected = suggestions[state.suggestionIndex[fieldName]];
    selectSuggestion(fieldName, selected);
    hideSuggestions(fieldName, suggestionBox);
  }
}

async function fetchPlaceSuggestions(query, signal) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Suggestion lookup failed.");
  }

  const results = await response.json();
  return results.map(normalizeNominatimPlace);
}

function renderSuggestions(fieldName, suggestionBox) {
  const suggestions = state.suggestionResults[fieldName];
  const activeIndex = state.suggestionIndex[fieldName];
  suggestionBox.innerHTML = "";

  if (!suggestions.length) {
    renderSuggestionState(fieldName, suggestionBox, "No matching addresses yet.");
    return;
  }

  suggestions.forEach((place, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `suggestion-item${index === activeIndex ? " is-active" : ""}`;
    button.innerHTML = `
      <span class="suggestion-main">${escapeHtml(place.shortName)}</span>
      <span class="suggestion-meta">${escapeHtml(place.context)}</span>
    `;

    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      selectSuggestion(fieldName, place);
      hideSuggestions(fieldName, suggestionBox);
    });

    button.addEventListener("mouseenter", () => {
      state.suggestionIndex[fieldName] = index;
      renderSuggestions(fieldName, suggestionBox);
    });

    suggestionBox.appendChild(button);
  });

  suggestionBox.hidden = false;
  setAutocompleteOpen(fieldName, true);
}

function renderSuggestionState(fieldName, suggestionBox, message) {
  suggestionBox.hidden = false;
  suggestionBox.innerHTML = `<div class="suggestion-state">${escapeHtml(message)}</div>`;
  setAutocompleteOpen(fieldName, true);
}

function hideSuggestions(fieldName, suggestionBox) {
  clearTimeout(state.suggestionTimers[fieldName]);

  if (state.suggestionControllers[fieldName]) {
    state.suggestionControllers[fieldName].abort();
    state.suggestionControllers[fieldName] = null;
  }

  suggestionBox.hidden = true;
  suggestionBox.innerHTML = "";
  setAutocompleteOpen(fieldName, false);
}

function selectSuggestion(fieldName, place) {
  state.selectedPlaces[fieldName] = place;
  const input = fieldName === "source" ? sourceInput : destinationInput;
  input.value = place.label;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function handleDocumentClick(event) {
  const insideAutocomplete = event.target.closest("[data-autocomplete]");

  if (!insideAutocomplete) {
    hideSuggestions("source", sourceSuggestions);
    hideSuggestions("destination", destinationSuggestions);
  }
}

function setAutocompleteOpen(fieldName, isOpen) {
  const input = fieldName === "source" ? sourceInput : destinationInput;
  const field = input.closest(".autocomplete-field");
  field?.classList.toggle("is-open", isOpen);
}

async function handleSubmit(event) {
  event.preventDefault();

  const departureDate = new Date(departureTimeInput.value);
  const notes = tripNotesInput.value.trim();

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
    const checkpoints = buildCheckpoints(route, departureDate);
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
    const [departureSun, arrivalSun] = await Promise.all([
      loadSunData(sourcePlace, departureDate),
      loadSunData(destinationPlace, checkpoints.at(-1).eta)
    ]);
    const tripData = {
      sourcePlace,
      destinationPlace,
      route,
      departureDate,
      notes,
      sunData: {
        departure: departureSun,
        arrival: arrivalSun
      },
      checkpoints: labeledCheckpoints,
      directions: route.directions
    };

    state.routeData = tripData;
    renderTrip(tripData);
    saveTripToRecents(tripData);
    updateUrlFromTrip(tripData);
    setStatus("success", "Ready");
  } catch (error) {
    renderError(error.message || "Something went wrong while building the route.");
  } finally {
    setLoadingState(false);
  }
}

async function resolvePlace(fieldName, value) {
  if (!value) {
    throw new Error("Please provide both a starting address and a destination.");
  }

  const selected = state.selectedPlaces[fieldName];
  if (selected && selected.label === value) {
    return selected;
  }

  return geocodeLocation(value);
}

async function geocodeLocation(query) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not look up that address.");
  }

  const results = await response.json();
  const place = results[0];

  if (!place) {
    throw new Error(`No address match found for "${query}".`);
  }

  return normalizeNominatimPlace(place);
}

async function reverseGeocodeFullPlace(latitude, longitude) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Could not look up your current location.");
  }

  const place = await response.json();
  return normalizeNominatimPlace(place);
}

async function loadSunData(place, date) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(place.latitude));
  url.searchParams.set("longitude", String(place.longitude));
  url.searchParams.set("daily", "sunrise,sunset");
  url.searchParams.set("timezone", "GMT");
  url.searchParams.set("timeformat", "unixtime");
  url.searchParams.set("forecast_days", "16");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Could not load sunrise and sunset times.");
  }

  const data = await response.json();
  const index = findNearestDayIndex(data.daily.time, date);

  return {
    sunrise: new Date(data.daily.sunrise[index] * 1000),
    sunset: new Date(data.daily.sunset[index] * 1000)
  };
}

function normalizeNominatimPlace(place) {
  const address = place.address ?? {};
  const mainName = [
    address.house_number,
    address.road || address.pedestrian || address.cycleway || address.footway
  ].filter(Boolean).join(" ").trim();

  const fallbackName = place.name
    || mainName
    || address.city
    || address.town
    || address.village
    || address.suburb
    || place.display_name;

  const context = [
    address.city || address.town || address.village || address.hamlet || address.suburb,
    address.state,
    address.country
  ].filter(Boolean).join(", ");

  return {
    id: place.place_id,
    shortName: fallbackName,
    context: context || place.display_name,
    label: place.display_name,
    latitude: Number(place.lat),
    longitude: Number(place.lon)
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
      longitude
    };
  });
}

function buildCheckpoints(route, departureDate) {
  const totalDurationSeconds = route.durationSeconds;
  const totalDurationMinutes = totalDurationSeconds / 60;
  const elapsedMinutes = [0];

  for (let minutes = CHECKPOINT_INTERVAL_MINUTES; minutes < totalDurationMinutes; minutes += CHECKPOINT_INTERVAL_MINUTES) {
    elapsedMinutes.push(minutes);
  }

  elapsedMinutes.push(totalDurationMinutes);

  const coordinatesWithDistance = buildDistanceTable(route.coordinates);

  return elapsedMinutes.map((minutes, index) => {
    const progress = totalDurationMinutes === 0 ? 0 : minutes / totalDurationMinutes;
    const eta = new Date(departureDate.getTime() + minutes * 60 * 1000);
    const point = interpolatePoint(coordinatesWithDistance, progress);

    return {
      id: `${index}-${minutes.toFixed(2)}`,
      eta,
      latitude: point.latitude,
      longitude: point.longitude,
      progress,
      elapsedMinutes: Math.round(minutes)
    };
  });
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

  const cacheKey = `${checkpoint.latitude.toFixed(2)},${checkpoint.longitude.toFixed(2)}`;
  if (state.reverseGeocodeCache.has(cacheKey)) {
    return state.reverseGeocodeCache.get(cacheKey);
  }

  try {
    const nearbyName = await reverseGeocodeNearbyPlace(checkpoint.latitude, checkpoint.longitude);
    state.reverseGeocodeCache.set(cacheKey, nearbyName);
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

  const response = await fetch(url, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error("Reverse geocode failed.");
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
    const uniqueCityName = normalizedCityName && !usedNames.has(normalizedCityName);

    if (uniqueCityName) {
      usedNames.add(normalizedCityName);
    }

    return {
      ...checkpoint,
      label: uniqueCityName ? `Near ${cityName}` : `${checkpoint.elapsedMinutes} min into trip`,
      cityName: cityName || `Stop at ${checkpoint.elapsedMinutes} min`
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

  return {
    ...checkpoint,
    forecastTime: new Date(hourly.time[targetIndex] * 1000),
    weatherCode: hourly.weather_code[targetIndex],
    weatherLabel: WEATHER_CODES[hourly.weather_code[targetIndex]] || "Unknown conditions",
    temperature: Math.round(hourly.temperature_2m[targetIndex]),
    precipitationProbability: Math.round(hourly.precipitation_probability[targetIndex]),
    windSpeed: Math.round(hourly.wind_speed_10m[targetIndex])
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

function findNearestDayIndex(dayTimestamps, targetDate) {
  let bestIndex = 0;
  let bestDifference = Number.POSITIVE_INFINITY;

  for (let index = 0; index < dayTimestamps.length; index += 1) {
    const difference = Math.abs(dayTimestamps[index] * 1000 - targetDate.getTime());
    if (difference < bestDifference) {
      bestDifference = difference;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function renderTrip(tripData) {
  const { sourcePlace, destinationPlace, route, departureDate, checkpoints, directions } = tripData;

  resultsTitle.textContent = `${sourcePlace.shortName} to ${destinationPlace.shortName}`;
  renderSummary(tripData);
  renderTimeline(checkpoints);
  renderDirections(tripData);
  renderMap(sourcePlace, destinationPlace, route, checkpoints);
  renderMapLegend(route, checkpoints);
  mapEmpty.classList.add("is-hidden");
  scheduleSynagogueRefresh();

  const wettestCheckpoint = [...checkpoints].sort(
    (left, right) => right.precipitationProbability - left.precipitationProbability
  )[0];

  renderNotice(
    wettestCheckpoint.precipitationProbability >= 50
      ? `Watch the stretch near ${wettestCheckpoint.cityName} around ${formatTime(wettestCheckpoint.eta)}. It currently shows about a ${wettestCheckpoint.precipitationProbability}% precipitation chance.`
      : "Route built. Click any checkpoint or direction step to focus it on the map."
  );
}

function renderSummary(tripData) {
  const { sourcePlace, destinationPlace, route, departureDate, checkpoints, directions, notes, sunData } = tripData;
  const arrivalDate = checkpoints.at(-1).eta;
  const coldestPoint = [...checkpoints].sort((left, right) => left.temperature - right.temperature)[0];
  const warmestPoint = [...checkpoints].sort((left, right) => right.temperature - left.temperature)[0];
  const averageSpeed = route.distanceMeters / route.durationSeconds;
  const routeRisk = getRouteRisk(checkpoints);
  const arrivalLight = describeLightCondition(arrivalDate, sunData.arrival);
  const progressMarkup = buildProgressMarkup(checkpoints);

  summary.classList.remove("empty");
  summary.innerHTML = `
    <p class="summary-route">Leaving <strong>${escapeHtml(sourcePlace.label)}</strong> at <strong>${formatDateTime(departureDate)}</strong> and heading to <strong>${escapeHtml(destinationPlace.label)}</strong>.</p>
    <p class="summary-subcopy">Weather is sampled every 30 minutes along the route, then labeled with nearby cities whenever possible.</p>
    <div class="summary-progress">
      <div class="progress-track">
        <span class="progress-line"></span>
        ${progressMarkup}
      </div>
      <p class="summary-subcopy">${checkpoints.length} weather checkpoints placed across the route.</p>
    </div>
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="label">Estimated trip</span>
        <span class="value">${formatDuration(route.durationSeconds)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Distance</span>
        <span class="value">${formatDistanceFromMeters(route.distanceMeters)}</span>
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
        <span class="value">${formatTemperature(coldestPoint.temperature)} near ${escapeHtml(coldestPoint.cityName)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Warmest point</span>
        <span class="value">${formatTemperature(warmestPoint.temperature)} near ${escapeHtml(warmestPoint.cityName)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Travel mode</span>
        <span class="value">${capitalize(profileInput.value)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Sampling</span>
        <span class="value">Every 30 min</span>
      </div>
      <div class="summary-stat">
        <span class="label">Forecast spread</span>
        <span class="value">${formatTemperature(coldestPoint.temperature)} to ${formatTemperature(warmestPoint.temperature)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Average speed</span>
        <span class="value">${formatSpeedFromMetersPerSecond(averageSpeed)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Weather risk</span>
        <span class="value">${escapeHtml(routeRisk.label)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Sunrise at start</span>
        <span class="value">${formatTime(sunData.departure.sunrise)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Sunset at arrival</span>
        <span class="value">${formatTime(sunData.arrival.sunset)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">Arrival light</span>
        <span class="value">${escapeHtml(arrivalLight)}</span>
      </div>
    </div>
    ${notes ? `<p class="summary-subcopy"><strong>Notes:</strong> ${escapeHtml(notes)}</p>` : ""}
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
    fragment.querySelector(".eta-text").textContent = `${formatDateTime(checkpoint.eta)} • +${checkpoint.elapsedMinutes} min`;
    fragment.querySelector(".weather-main").textContent = `${checkpoint.weatherLabel} • ${formatTemperature(checkpoint.temperature)}`;
    fragment.querySelector(".weather-meta").textContent = `${checkpoint.precipitationProbability}% precip • ${formatWind(checkpoint.windSpeed)}`;

    card.addEventListener("click", () => focusCheckpoint(checkpoint.id));
    timeline.appendChild(fragment);
  });
}

function renderDirections(tripData) {
  const { directions, sourcePlace, destinationPlace, route } = tripData;
  directionsList.classList.remove("empty");
  directionsList.innerHTML = "";
  renderDirectionsOverview(sourcePlace, destinationPlace, route, directions);

  if (!directions.length) {
    directionsList.innerHTML = `
      <div class="empty-state compact">
        <h3>No directions</h3>
        <p>The routing service did not return turn-by-turn steps for this route.</p>
      </div>
    `;
    return;
  }

  const filteredDirections = getVisibleDirections(directions);

  if (!filteredDirections.length) {
    directionsList.innerHTML = `
      <div class="empty-state compact">
        <h3>No matching steps</h3>
        <p>Try clearing the filter or turning off major-steps-only.</p>
      </div>
    `;
    return;
  }

  filteredDirections.forEach((direction) => {
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

function renderDirectionsOverview(sourcePlace, destinationPlace, route, directions) {
  directionsOverview.classList.remove("empty");
  const googleMapsUrl = buildGoogleMapsUrl(sourcePlace, destinationPlace);
  const openStreetMapUrl = buildOpenStreetMapDirectionsUrl(sourcePlace, destinationPlace);
  const wazeUrl = buildWazeUrl(destinationPlace);

  directionsOverview.innerHTML = `
    <p><strong>From:</strong> ${escapeHtml(sourcePlace.label)}</p>
    <p><strong>To:</strong> ${escapeHtml(destinationPlace.label)}</p>
    <p><strong>Route:</strong> ${escapeHtml(formatDuration(route.durationSeconds))} • ${escapeHtml(formatDistanceFromMeters(route.distanceMeters))} • ${escapeHtml(String(directions.length))} steps</p>
    <div class="directions-actions">
      <a class="directions-link" href="${escapeHtml(googleMapsUrl)}" target="_blank" rel="noreferrer">Open in Google Maps</a>
      <a class="directions-link" href="${escapeHtml(openStreetMapUrl)}" target="_blank" rel="noreferrer">Open in OpenStreetMap</a>
      <a class="directions-link" href="${escapeHtml(wazeUrl)}" target="_blank" rel="noreferrer">Open in Waze</a>
    </div>
  `;
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
      icon: createMapIcon(markerType, index)
    });

    marker.bindPopup(buildCheckpointPopup(checkpoint));
    marker.on("click", () => highlightTimelineCard(checkpoint.id));
    marker.addTo(state.layers.checkpoints);
    state.checkpointMarkersById.set(checkpoint.id, marker);
  });

  state.routeBounds = L.latLngBounds(routeLatLngs);
  state.map.fitBounds(state.routeBounds, {
    padding: [40, 40]
  });
  state.map.invalidateSize();
  updateMarkerLayerVisibility();
}

function renderMapLegend(route, checkpoints) {
  const wettestCheckpoint = [...checkpoints].sort(
    (left, right) => right.precipitationProbability - left.precipitationProbability
  )[0];
  const synagogueText = state.synagoguesVisible
    ? state.synagogueMarkersCount > 0
      ? `${state.synagogueMarkersCount} Orthodox shuls in view`
      : "No Orthodox shuls found in current view"
    : "Orthodox shul layer hidden";

  mapLegend.classList.remove("empty");
  mapLegend.innerHTML = `
    <span class="legend-chip">${capitalize(profileInput.value)}</span>
    <span class="legend-chip">${formatDistanceFromMeters(route.distanceMeters)}</span>
    <span class="legend-chip">${checkpoints.length} half-hour weather stops</span>
    <span class="legend-chip">${synagogueText}</span>
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
    color: "#e68f2f",
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
      <span>${escapeHtml(`${checkpoint.weatherLabel} • ${formatTemperature(checkpoint.temperature)}`)}</span>
      <span>${escapeHtml(`${checkpoint.precipitationProbability}% precip • ${formatWind(checkpoint.windSpeed)}`)}</span>
    </div>
  `;
}

function createMapIcon(type, index) {
  const label = type === "start"
    ? "S"
    : type === "end"
      ? "E"
      : type === "synagogue"
        ? "\u2721"
        : String(index);
  const className = type === "start"
    ? "pin-start"
    : type === "end"
      ? "pin-end"
      : type === "synagogue"
        ? "pin-synagogue"
        : "pin-checkpoint";

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

function handleToggleSynagogues() {
  state.synagoguesVisible = !state.synagoguesVisible;
  updateSynagogueLayerVisibility();

  if (state.synagoguesVisible) {
    scheduleSynagogueRefresh();
  }
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

function updateSynagogueLayerVisibility() {
  toggleSynagoguesButton.textContent = state.synagoguesVisible ? "Hide Orthodox shuls" : "Show Orthodox shuls";

  if (state.synagoguesVisible) {
    if (!state.map.hasLayer(state.layers.synagogues)) {
      state.layers.synagogues.addTo(state.map);
    }
  } else if (state.map.hasLayer(state.layers.synagogues)) {
    state.map.removeLayer(state.layers.synagogues);
  }

  if (state.routeData) {
    renderMapLegend(state.routeData.route, state.routeData.checkpoints);
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

function handleUnitsChange() {
  state.preferences.units = unitsInput.value === "metric" ? "metric" : "imperial";
  savePreferences();
  rerenderCurrentTrip();
  if (state.routeData) {
    updateUrlFromTrip(state.routeData);
  }
}

function handleDirectionPreferencesChange() {
  state.preferences.directionFilter = directionFilterInput.value.trim();
  state.preferences.majorStepsOnly = majorStepsOnlyInput.checked;
  savePreferences();
  if (state.routeData) {
    renderDirections(state.routeData);
  }
}

function handleFullscreenMap() {
  const mapShell = document.querySelector(".map-shell");
  if (!mapShell) {
    return;
  }

  if (document.fullscreenElement) {
    void document.exitFullscreen();
    fullscreenMapButton.classList.remove("is-active");
    return;
  }

  void mapShell.requestFullscreen();
  fullscreenMapButton.classList.add("is-active");
}

async function handleCopySummary() {
  if (!state.routeData) {
    renderNotice("Plan a route first so there is something to copy.");
    return;
  }

  const copied = await copyText(buildTripSummaryText(state.routeData));
  renderNotice(copied ? "Trip summary copied." : "Could not copy automatically. Try export instead.");
}

async function handleCopyShareLink() {
  if (!state.routeData) {
    renderNotice("Plan a route first so there is a share link.");
    return;
  }

  const shareUrl = getTripShareUrl(state.routeData);
  const copied = await copyText(shareUrl);
  renderNotice(copied ? "Share link copied." : "Could not copy automatically. You can still export the trip.");
}

function handleExportTrip() {
  if (!state.routeData) {
    renderNotice("Plan a route first so there is something to export.");
    return;
  }

  const text = buildTripSummaryText(state.routeData, true);
  downloadTextFile(`trip-plan-${Date.now()}.txt`, text);
  renderNotice("Trip itinerary exported.");
}

function handlePrintTrip() {
  if (!state.routeData) {
    renderNotice("Plan a route first so there is something to print.");
    return;
  }

  window.print();
}

function handleClearRecentTrips() {
  state.recentTrips = [];
  saveRecentTrips();
  renderRecentTrips();
  renderNotice("Recent trips cleared.");
}

function handleGlobalKeydown(event) {
  if (event.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
    event.preventDefault();
    sourceInput.focus();
  }
}

function rerenderCurrentTrip() {
  if (!state.routeData) {
    return;
  }

  renderSummary(state.routeData);
  renderTimeline(state.routeData.checkpoints);
  renderDirections(state.routeData);
  renderMapLegend(state.routeData.route, state.routeData.checkpoints);
}

function saveTripToRecents(tripData) {
  const entry = {
    source: tripData.sourcePlace.label,
    destination: tripData.destinationPlace.label,
    sourceShort: tripData.sourcePlace.shortName,
    destinationShort: tripData.destinationPlace.shortName,
    departureTime: departureTimeInput.value,
    profile: profileInput.value,
    units: state.preferences.units,
    notes: tripData.notes,
    showDirections: showDirectionsInput.checked
  };

  state.recentTrips = [
    entry,
    ...state.recentTrips.filter((trip) => !(
      trip.source === entry.source
      && trip.destination === entry.destination
      && trip.departureTime === entry.departureTime
      && trip.profile === entry.profile
    ))
  ].slice(0, 6);

  saveRecentTrips();
  renderRecentTrips();
}

function applySavedTrip(trip) {
  sourceInput.value = trip.source;
  destinationInput.value = trip.destination;
  departureTimeInput.value = trip.departureTime;
  profileInput.value = trip.profile;
  unitsInput.value = trip.units || "imperial";
  tripNotesInput.value = trip.notes || "";
  showDirectionsInput.checked = trip.showDirections !== false;
  state.preferences.units = unitsInput.value;
  savePreferences();
  updateDirectionsVisibility();
  form.requestSubmit();
}

function updateUrlFromTrip(tripData) {
  const url = new URL(window.location.href);
  url.searchParams.set("source", tripData.sourcePlace.label);
  url.searchParams.set("destination", tripData.destinationPlace.label);
  url.searchParams.set("departure", departureTimeInput.value);
  url.searchParams.set("profile", profileInput.value);
  url.searchParams.set("units", state.preferences.units);
  url.searchParams.set("directions", showDirectionsInput.checked ? "1" : "0");

  if (tripData.notes) {
    url.searchParams.set("notes", tripData.notes);
  } else {
    url.searchParams.delete("notes");
  }

  window.history.replaceState({}, "", url);
}

function restoreTripFromUrl() {
  const url = new URL(window.location.href);
  const source = url.searchParams.get("source");
  const destination = url.searchParams.get("destination");
  const departure = url.searchParams.get("departure");
  const profile = url.searchParams.get("profile");
  const units = url.searchParams.get("units");
  const notes = url.searchParams.get("notes");
  const directions = url.searchParams.get("directions");

  if (source) {
    sourceInput.value = source;
  }
  if (destination) {
    destinationInput.value = destination;
  }
  if (departure) {
    departureTimeInput.value = departure;
  }
  if (profile && ["driving", "cycling", "walking"].includes(profile)) {
    profileInput.value = profile;
  }
  if (units && ["imperial", "metric"].includes(units)) {
    state.preferences.units = units;
    unitsInput.value = units;
  }
  if (notes) {
    tripNotesInput.value = notes;
  }
  if (directions === "0") {
    showDirectionsInput.checked = false;
    updateDirectionsVisibility();
  }

  if (source && destination && departure) {
    window.setTimeout(() => {
      form.requestSubmit();
    }, 0);
  }
}

async function handleUseMyLocation() {
  if (!("geolocation" in navigator)) {
    renderNotice("Your browser does not support location access.");
    return;
  }

  useMyLocationButton.disabled = true;
  useMyLocationButton.textContent = "Locating...";
  clearNotice();

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      });
    });

    const place = await reverseGeocodeFullPlace(
      position.coords.latitude,
      position.coords.longitude
    );

    state.selectedPlaces.source = place;
    sourceInput.value = place.label;
    sourceInput.dispatchEvent(new Event("change", { bubbles: true }));
    renderNotice(`Using your current location: ${place.shortName}.`);

    if (state.map) {
      state.map.flyTo([place.latitude, place.longitude], Math.max(state.map.getZoom(), 12), {
        duration: 0.7
      });
    }
  } catch (error) {
    renderNotice("Could not access your location. Check browser permission and try again.");
  } finally {
    useMyLocationButton.disabled = false;
    useMyLocationButton.textContent = "Use my location";
  }
}

function scheduleSynagogueRefresh() {
  clearTimeout(state.synagogueFetchTimer);
  state.synagogueFetchTimer = window.setTimeout(() => {
    void refreshSynagogueMarkers();
  }, 250);
}

async function refreshSynagogueMarkers() {
  if (!state.map || !state.synagoguesVisible) {
    return;
  }

  if (state.map.getZoom() < 7) {
    state.layers.synagogues.clearLayers();
    state.synagogueMarkersCount = 0;

    if (state.routeData) {
      renderMapLegend(state.routeData.route, state.routeData.checkpoints);
    }

    return;
  }

  if (state.synagogueFetchController) {
    state.synagogueFetchController.abort();
  }

  const controller = new AbortController();
  state.synagogueFetchController = controller;

  try {
    const synagogues = await fetchOrthodoxSynagogues(state.map.getBounds(), controller.signal);
    renderSynagogueMarkers(synagogues);

    if (state.routeData) {
      renderMapLegend(state.routeData.route, state.routeData.checkpoints);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      state.layers.synagogues.clearLayers();
      state.synagogueMarkersCount = 0;
    }
  }
}

async function fetchOrthodoxSynagogues(bounds, signal) {
  const south = bounds.getSouth();
  const west = bounds.getWest();
  const north = bounds.getNorth();
  const east = bounds.getEast();
  const denominationPattern = "orthodox|modern_orthodox|neo_orthodox|orthodox_ashkenaz|orthodox_sefard|ultra_orthodox|hasidic|haredi|chassidic|lubavitch";
  const orthodoxNamePattern = "(?i)(orthodox|shul|shtiebel|shtibel|chabad|lubavitch|young israel|beis |bais |beth |ohev|ohel|agudas|agudath|yeshiva|kollel|minyan|sefard|sephard)";
  const query = `
[out:json][timeout:20];
(
  node["religion"="jewish"]["amenity"="place_of_worship"](${south},${west},${north},${east});
  way["religion"="jewish"]["amenity"="place_of_worship"](${south},${west},${north},${east});
  relation["religion"="jewish"]["amenity"="place_of_worship"](${south},${west},${north},${east});
  node["building"="synagogue"](${south},${west},${north},${east});
  way["building"="synagogue"](${south},${west},${north},${east});
  relation["building"="synagogue"](${south},${west},${north},${east});
  node["amenity"="place_of_worship"]["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
  way["amenity"="place_of_worship"]["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
  relation["amenity"="place_of_worship"]["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
  node["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
  way["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
  relation["name"~"${orthodoxNamePattern}"](${south},${west},${north},${east});
);
out center tags;
  `.trim();

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
    signal,
    headers: {
      "Content-Type": "text/plain"
    }
  });

  if (!response.ok) {
    throw new Error("Could not load Orthodox synagogues for this map area.");
  }

  const data = await response.json();
  const matches = (data.elements ?? [])
    .map((element) => normalizeSynagogue(element))
    .filter((synagogue) => isLikelyOrthodoxSynagogue(synagogue));

  const uniqueMatches = dedupeSynagogues(matches);
  return uniqueMatches;
}

function normalizeSynagogue(element) {
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};
  const addressBits = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").trim(),
    tags["addr:city"] || tags["addr:town"] || tags["addr:village"],
    tags["addr:country"]
  ].filter(Boolean);

  return {
    id: `${element.type}-${element.id}`,
    latitude,
    longitude,
    name: tags.name || "Orthodox synagogue",
    denomination: tags.denomination || "orthodox",
    operator: tags.operator || "",
    brand: tags.brand || "",
    description: tags.description || "",
    address: addressBits.join(", "),
    website: tags.website || tags.contact_website || "",
    phone: tags.phone || tags.contact_phone || ""
  };
}

function isLikelyOrthodoxSynagogue(synagogue) {
  const haystack = [
    synagogue.name,
    synagogue.denomination,
    synagogue.operator,
    synagogue.brand,
    synagogue.description
  ].join(" ").toLowerCase();

  const orthodoxSignals = [
    "orthodox",
    "modern orthodox",
    "neo orthodox",
    "chabad",
    "lubavitch",
    "hasid",
    "chasid",
    "haredi",
    "shul",
    "beis",
    "bais",
    "ohel",
    "yeshiva"
  ];

  return orthodoxSignals.some((signal) => haystack.includes(signal));
}

function dedupeSynagogues(synagogues) {
  const seen = new Set();

  return synagogues.filter((synagogue) => {
    const key = [
      synagogue.name.toLowerCase(),
      synagogue.latitude.toFixed(5),
      synagogue.longitude.toFixed(5)
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function renderSynagogueMarkers(synagogues) {
  state.layers.synagogues.clearLayers();

  synagogues
    .filter((synagogue) => Number.isFinite(synagogue.latitude) && Number.isFinite(synagogue.longitude))
    .forEach((synagogue) => {
      const marker = L.marker([synagogue.latitude, synagogue.longitude], {
        icon: createMapIcon("synagogue")
      });

      marker.bindPopup(buildSynagoguePopup(synagogue));
      marker.addTo(state.layers.synagogues);
    });

  state.synagogueMarkersCount = synagogues.length;

  if (state.synagoguesVisible && synagogues.length === 0 && state.routeData) {
    renderNotice("No Orthodox shuls were found in this map view from OpenStreetMap tags. Try zooming in further or use the GoDaven button for a broader database.");
  }
}

function buildSynagoguePopup(synagogue) {
  const detailLines = [
    synagogue.address,
    `Denomination: ${humanizeSynagogueDenomination(synagogue.denomination)}`,
    synagogue.phone,
    synagogue.website
  ].filter(Boolean);

  return `
    <div class="popup-card">
      <strong>${escapeHtml(synagogue.name)}</strong>
      ${detailLines.map((line) => `<span>${escapeHtml(line)}</span>`).join("")}
    </div>
  `;
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
  submitButton.textContent = isLoading ? "Building route..." : "Build trip forecast";

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

function humanizeSynagogueDenomination(denomination) {
  return denomination.replaceAll("_", " ");
}

function buildGoogleMapsUrl(sourcePlace, destinationPlace) {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", `${sourcePlace.latitude},${sourcePlace.longitude}`);
  url.searchParams.set("destination", `${destinationPlace.latitude},${destinationPlace.longitude}`);
  url.searchParams.set("travelmode", profileInput.value === "walking" ? "walking" : profileInput.value === "cycling" ? "bicycling" : "driving");
  return url.toString();
}

function buildOpenStreetMapDirectionsUrl(sourcePlace, destinationPlace) {
  const engine = profileInput.value === "walking" ? "foot" : profileInput.value === "cycling" ? "cycle" : "fossgis_osrm_car";
  const url = new URL("https://www.openstreetmap.org/directions");
  url.searchParams.set("engine", engine);
  url.searchParams.set("route", `${sourcePlace.latitude},${sourcePlace.longitude};${destinationPlace.latitude},${destinationPlace.longitude}`);
  return url.toString();
}

function buildWazeUrl(destinationPlace) {
  const url = new URL("https://www.waze.com/ul");
  url.searchParams.set("ll", `${destinationPlace.latitude},${destinationPlace.longitude}`);
  url.searchParams.set("navigate", "yes");
  return url.toString();
}

function formatDistance(distanceMeters) {
  if (distanceMeters < 161) {
    return `${Math.round(distanceMeters * 3.28084)} ft`;
  }

  const miles = distanceMeters * 0.000621371;
  return miles >= 10 ? `${miles.toFixed(0)} mi` : `${miles.toFixed(1)} mi`;
}

function formatDistanceFromMeters(distanceMeters) {
  if (state.preferences.units === "metric") {
    if (distanceMeters < 1000) {
      return `${Math.round(distanceMeters)} m`;
    }

    const kilometers = distanceMeters / 1000;
    return kilometers >= 10 ? `${kilometers.toFixed(0)} km` : `${kilometers.toFixed(1)} km`;
  }

  return formatDistance(distanceMeters);
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

function formatTemperature(fahrenheitValue) {
  if (state.preferences.units === "metric") {
    return `${Math.round((fahrenheitValue - 32) * (5 / 9))}C`;
  }

  return `${fahrenheitValue}F`;
}

function formatWind(mphValue) {
  if (state.preferences.units === "metric") {
    return `${Math.round(mphValue * 1.60934)} km/h wind`;
  }

  return `${mphValue} mph wind`;
}

function formatSpeedFromMetersPerSecond(metersPerSecond) {
  if (state.preferences.units === "metric") {
    return `${Math.round(metersPerSecond * 3.6)} km/h`;
  }

  return `${Math.round(metersPerSecond * 2.23694)} mph`;
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

function formatSavedTripDate(localInputValue) {
  return formatDateTime(new Date(localInputValue));
}

function formatTime(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getRouteRisk(checkpoints) {
  const maxPrecip = Math.max(...checkpoints.map((checkpoint) => checkpoint.precipitationProbability));
  const severeCode = checkpoints.some((checkpoint) => checkpoint.weatherCode >= 95);

  if (severeCode || maxPrecip >= 75) {
    return { label: "Rough stretch likely" };
  }

  if (maxPrecip >= 40) {
    return { label: "Some weather risk" };
  }

  return { label: "Mostly calm route" };
}

function describeLightCondition(date, sunData) {
  if (date < sunData.sunrise) {
    return "Before sunrise";
  }

  if (date > sunData.sunset) {
    return "After sunset";
  }

  const hoursToSunset = (sunData.sunset.getTime() - date.getTime()) / (1000 * 60 * 60);
  return hoursToSunset < 1.5 ? "Near sunset" : "Daylight";
}

function buildProgressMarkup(checkpoints) {
  const cappedCount = Math.min(checkpoints.length, 12);
  const indexes = Array.from({ length: cappedCount }, (_, index) => Math.round(index * ((checkpoints.length - 1) / Math.max(cappedCount - 1, 1))));
  return indexes.map(() => '<span class="progress-stop"></span>').join("");
}

function getVisibleDirections(directions) {
  const filterTerm = state.preferences.directionFilter.toLowerCase();
  return directions.filter((direction) => {
    const matchesText = !filterTerm
      || direction.instruction.toLowerCase().includes(filterTerm)
      || direction.roadName.toLowerCase().includes(filterTerm);
    const matchesMajor = !state.preferences.majorStepsOnly || direction.distanceMeters >= 500;
    return matchesText && matchesMajor;
  });
}

function getTripShareUrl(tripData) {
  const url = new URL(window.location.href);
  url.searchParams.set("source", tripData.sourcePlace.label);
  url.searchParams.set("destination", tripData.destinationPlace.label);
  url.searchParams.set("departure", departureTimeInput.value);
  url.searchParams.set("profile", profileInput.value);
  url.searchParams.set("units", state.preferences.units);
  url.searchParams.set("directions", showDirectionsInput.checked ? "1" : "0");

  if (tripData.notes) {
    url.searchParams.set("notes", tripData.notes);
  } else {
    url.searchParams.delete("notes");
  }

  return url.toString();
}

function buildTripSummaryText(tripData, includeSteps = false) {
  const { sourcePlace, destinationPlace, route, departureDate, checkpoints, directions, notes, sunData } = tripData;
  const arrivalDate = checkpoints.at(-1).eta;
  const risk = getRouteRisk(checkpoints).label;
  const lines = [
    `Trip: ${sourcePlace.label} -> ${destinationPlace.label}`,
    `Departure: ${formatDateTime(departureDate)}`,
    `Arrival: ${formatDateTime(arrivalDate)} (${describeLightCondition(arrivalDate, sunData.arrival)})`,
    `Travel mode: ${capitalize(profileInput.value)}`,
    `Distance: ${formatDistanceFromMeters(route.distanceMeters)}`,
    `Duration: ${formatDuration(route.durationSeconds)}`,
    `Average speed: ${formatSpeedFromMetersPerSecond(route.distanceMeters / route.durationSeconds)}`,
    `Weather risk: ${risk}`,
    `Sunrise at start: ${formatTime(sunData.departure.sunrise)}`,
    `Sunset at destination: ${formatTime(sunData.arrival.sunset)}`,
    `Weather checkpoints: ${checkpoints.length}`
  ];

  if (notes) {
    lines.push(`Notes: ${notes}`);
  }

  if (includeSteps) {
    lines.push("");
    lines.push("Weather checkpoints:");
    checkpoints.forEach((checkpoint) => {
      lines.push(`- ${checkpoint.label} | ${formatDateTime(checkpoint.eta)} | ${checkpoint.weatherLabel}, ${formatTemperature(checkpoint.temperature)}, ${checkpoint.precipitationProbability}% precip, ${formatWind(checkpoint.windSpeed)}`);
    });
    lines.push("");
    lines.push("Directions:");
    directions.forEach((direction) => {
      lines.push(`- ${direction.instruction} (${direction.distanceText}, ${direction.durationText})`);
    });
  }

  return lines.join("\n");
}

function downloadTextFile(filename, contents) {
  const blob = new Blob([contents], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyText(value) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
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
