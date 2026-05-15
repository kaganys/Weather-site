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
const languageToggleButton = document.getElementById("languageToggle");

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

const WEATHER_CODES_HE = {
  0: "שמיים בהירים",
  1: "בהיר ברובו",
  2: "מעונן חלקית",
  3: "מעונן",
  45: "ערפל",
  48: "ערפל קופא",
  51: "טפטוף קל",
  53: "טפטוף",
  55: "טפטוף כבד",
  56: "טפטוף קופא קל",
  57: "טפטוף קופא",
  61: "גשם קל",
  63: "גשם",
  65: "גשם כבד",
  66: "גשם קופא קל",
  67: "גשם קופא",
  71: "שלג קל",
  73: "שלג",
  75: "שלג כבד",
  77: "גרגרי שלג",
  80: "ממטרי גשם",
  81: "ממטרים כבדים",
  82: "ממטרים חזקים",
  85: "ממטרי שלג",
  86: "ממטרי שלג כבדים",
  95: "סופת רעמים",
  96: "סופה עם ברד קל",
  99: "סופה עם ברד כבד"
};

const CHECKPOINT_INTERVAL_MINUTES = 30;
const FORECAST_HOURS_LIMIT = 16 * 24;
const AUTOCOMPLETE_MINIMUM = 3;
const STORAGE_KEYS = {
  recentTrips: "routeWeatherRecentTripsV2",
  preferences: "routeWeatherPreferencesV2"
};

const I18N = {
  en: {
    pageTitle: "Road Weather Planner",
    languageButton: "עברית",
    heroEyebrow: "Route Weather Studio",
    heroTitle: "Better route planning, cleaner directions, and weather every 30 minutes.",
    heroCopy: "Type addresses with live suggestions, set when you leave, and get a map-first trip plan that follows the forecast city by city as you move down the road.",
    heroPills: ["Live address suggestions", "Turn-by-turn directions", "30-minute weather checkpoints"],
    tripSetupEyebrow: "Trip Setup",
    tripSetupTitle: "Build your route",
    tripSetupCopy: "Search real places, adjust departure time, and choose whether you want the directions panel shown.",
    sourceLabel: "Starting address",
    destinationLabel: "Destination address",
    useMyLocation: "Use my location",
    live: "Live",
    swapRoute: "Swap route",
    sourcePlaceholder: "350 5th Ave, New York, NY",
    destinationPlaceholder: "1 Washington Sq, San Jose, CA",
    departureTime: "Departure time",
    travelMode: "Travel mode",
    units: "Units",
    tripNotes: "Trip notes",
    tripNotesPlaceholder: "Shabbos stop, food, pickup, gear, or route notes",
    unitsImperial: "Imperial",
    unitsMetric: "Metric",
    quickTimes: ["Leave in 30 min", "Leave in 2 hr", "Tomorrow 8 AM"],
    quickDepartureChoices: "Quick departure choices",
    showDirectionsTitle: "Show actual directions",
    showDirectionsCopy: "Keep a dedicated turn-by-turn directions panel beside the forecast timeline.",
    plannerNoteHtml: "<strong>Sampling:</strong> weather checkpoints are placed automatically every 30 minutes along the route.",
    buildTripForecast: "Build trip forecast",
    savedEyebrow: "Saved",
    recentTrips: "Recent trips",
    clear: "Clear",
    recentTripsEmpty: "Recent trips you plan will show up here.",
    tripBoardEyebrow: "Trip Board",
    defaultResultsTitle: "Plan a route to light up the map.",
    ready: "Ready",
    summaryEmpty: "Your route summary will appear here.",
    copySummary: "Copy summary",
    copyShareLink: "Copy share link",
    exportTrip: "Export trip",
    printPlan: "Print plan",
    recenter: "Recenter",
    hideCheckpoints: "Hide checkpoints",
    showCheckpoints: "Show checkpoints",
    hideShuls: "Hide Orthodox shuls",
    showShuls: "Show Orthodox shuls",
    fullscreenMap: "Fullscreen map",
    openGoDaven: "Open GoDaven",
    jumpToDirections: "Jump to directions",
    mapReadyTitle: "Map ready for your route",
    mapReadyCopy: "Once you choose addresses, the trip path, weather cities, and direction focus points will show here.",
    mapLegendEmpty: "Route details and forecast highlights will appear here.",
    atGlanceEyebrow: "At A Glance",
    atGlanceTitle: "What this trip board shows",
    featureList: [
      "Address suggestions while you type.",
      "Weather stops every 30 minutes.",
      "Clickable forecast cities on the route.",
      "Orthodox synagogue icons for the visible map area.",
      "Turn-by-turn directions tied to the same route."
    ],
    forecastEyebrow: "Forecast Route",
    weatherCityByCity: "Weather city by city",
    every30: "Every 30 minutes",
    noRouteTitle: "No route yet",
    noRouteCopy: "Start with two addresses and a departure time to build your live route forecast.",
    directionsEyebrow: "Directions",
    actualDirections: "Actual turn-by-turn steps",
    tapStepToFocus: "Tap a step to focus it on the map",
    directionsOverviewEmpty: "Build a route to see the full directions overview.",
    filterDirectionSteps: "Filter direction steps",
    majorStepsOnly: "Major steps only",
    directionsWaitingTitle: "Directions waiting",
    directionsWaitingCopy: "Build a route to see the step list here.",
    openGoogleMaps: "Open in Google Maps",
    openOpenStreetMap: "Open in OpenStreetMap",
    openWaze: "Open in Waze",
    loading: "Loading",
    issue: "Issue",
    searchingAddresses: "Searching addresses...",
    suggestionLookupFailed: "Suggestion lookup failed.",
    noMatchingAddresses: "No matching addresses yet.",
    departureFutureError: "Please choose a departure time in the future.",
    validDepartureError: "Please choose a valid departure time.",
    bothAddressesError: "Please provide both a starting address and a destination.",
    addressLookupError: "Could not look up that address.",
    noAddressMatch: (query) => `No address match found for "${query}".`,
    routeCalcError: "Could not calculate the route between those places.",
    routeBuildError: "The route service could not build a path for that trip.",
    forecastWindowError: "This trip stretches past the forecast window. Try a closer departure time or a shorter route.",
    weatherLoadError: "Weather data could not be loaded for one of the route checkpoints.",
    noHourlyForecastError: "No matching hourly forecast was available for part of this trip.",
    unknownConditions: "Unknown conditions",
    routeBuiltNotice: "Route built. Click any checkpoint or direction step to focus it on the map.",
    wetStretchNotice: (city, time, precip) => `Watch the stretch near ${city} around ${time}. It currently shows about a ${precip}% precipitation chance.`,
    useLocationUnsupported: "Your browser does not support location access.",
    usingLocationNotice: (name) => `Using your current location: ${name}.`,
    locationAccessError: "Could not access your location. Check browser permission and try again.",
    noShulsFoundNotice: "No Orthodox shuls were found in this map view from OpenStreetMap tags. Try zooming in further or use the GoDaven button for a broader database.",
    loadedRecentTrip: (index) => `Loaded recent trip ${index}.`,
    recentTripsCleared: "Recent trips cleared.",
    summaryCopied: "Trip summary copied.",
    summaryCopyFailed: "Could not copy automatically. Try export instead.",
    shareCopied: "Share link copied.",
    shareCopyFailed: "Could not copy automatically. You can still export the trip.",
    exportDone: "Trip itinerary exported.",
    nothingToCopy: "Plan a route first so there is something to copy.",
    nothingToShare: "Plan a route first so there is a share link.",
    nothingToExport: "Plan a route first so there is something to export.",
    nothingToPrint: "Plan a route first so there is something to print.",
    noDirectionsTitle: "No directions",
    noDirectionsCopy: "The routing service did not return turn-by-turn steps for this route.",
    noMatchingStepsTitle: "No matching steps",
    noMatchingStepsCopy: "Try clearing the filter or turning off major-steps-only.",
    routeFrom: "From",
    routeTo: "To",
    routeOverview: "Route",
    estimatedTrip: "Estimated trip",
    distance: "Distance",
    arrival: "Arrival",
    weatherStops: "Weather stops",
    directionsCount: "Directions",
    stepsCount: (count) => `${count} steps`,
    coldestPoint: "Coldest point",
    warmestPoint: "Warmest point",
    travelModeLabel: "Travel mode",
    sampling: "Sampling",
    forecastSpread: "Forecast spread",
    averageSpeed: "Average speed",
    weatherRisk: "Weather risk",
    sunriseAtStart: "Sunrise at start",
    sunsetAtArrival: "Sunset at arrival",
    arrivalLight: "Arrival light",
    notes: "Notes",
    summarySubcopy: "Weather is sampled every 30 minutes along the route, then labeled with nearby cities whenever possible.",
    checkpointsPlaced: (count) => `${count} weather checkpoints placed across the route.`,
    coldestNear: (temperature, city) => `${temperature} near ${city}`,
    warmestNear: (temperature, city) => `${temperature} near ${city}`,
    rangeText: (start, end) => `${start} to ${end}`,
    elapsedOffset: (minutes) => `+${minutes} min`,
    precipShort: "precip",
    windWord: "wind",
    depart: (name) => `Depart ${name}`,
    arrive: (name) => `Arrive ${name}`,
    near: (name) => `Near ${name}`,
    minIntoTrip: (minutes) => `${minutes} min into trip`,
    stopAtMin: (minutes) => `Stop at ${minutes} min`,
    routeSummaryLine: (source, departure, destination) => `Leaving <strong>${source}</strong> at <strong>${departure}</strong> and heading to <strong>${destination}</strong>.`,
    routeRiskCalm: "Mostly calm route",
    routeRiskSome: "Some weather risk",
    routeRiskRough: "Rough stretch likely",
    beforeSunrise: "Before sunrise",
    afterSunset: "After sunset",
    nearSunset: "Near sunset",
    daylight: "Daylight",
    orthodoxShulsInView: (count) => `${count} Orthodox shuls in view`,
    noShulsInView: "No Orthodox shuls found in current view",
    shulLayerHidden: "Orthodox shul layer hidden",
    wettestNear: (city) => `Wettest near ${city}`,
    currentLocationLookupError: "Could not look up your current location.",
    sunriseSunsetError: "Could not load sunrise and sunset times.",
    orthodoxSynagogue: "Orthodox synagogue",
    denomination: "Denomination",
    routeText: (duration, distance, steps) => `${duration} • ${distance} • ${steps} steps`,
    savedTripLine: (date, profile) => `${date} • ${profile}`,
    tripTextHeader: (source, destination) => `Trip: ${source} -> ${destination}`,
    departureText: "Departure",
    arrivalText: "Arrival",
    avgSpeedText: "Average speed",
    weatherRiskText: "Weather risk",
    sunriseText: "Sunrise at start",
    sunsetText: "Sunset at destination",
    weatherCheckpointsText: "Weather checkpoints",
    weatherCheckpointsSection: "Weather checkpoints:",
    directionsSectionText: "Directions:",
    useMyLocationBusy: "Locating...",
    profileDriving: "Driving",
    profileCycling: "Cycling",
    profileWalking: "Walking",
    statusNoRoute: "No route yet",
    buildTripForecastBusy: "Building route...",
    routeBuiltStatus: "Route built",
    roadAhead: "the road ahead"
  },
  he: {
    pageTitle: "מתכנן מזג אוויר לדרך",
    languageButton: "English",
    heroEyebrow: "סטודיו מזג אוויר לדרך",
    heroTitle: "תכנון דרך טוב יותר, הוראות נקיות יותר, ומזג אוויר כל 30 דקות.",
    heroCopy: "הקלד כתובות עם הצעות חיות, קבע זמן יציאה, וקבל תוכנית נסיעה ממוקדת מפה שעוקבת אחרי התחזית עיר אחר עיר לאורך הדרך.",
    heroPills: ["הצעות כתובת חיות", "הוראות פנייה אחר פנייה", "נקודות מזג אוויר כל 30 דקות"],
    tripSetupEyebrow: "הגדרת נסיעה",
    tripSetupTitle: "בנה את המסלול שלך",
    tripSetupCopy: "חפש מקומות אמיתיים, עדכן את זמן היציאה, ובחר אם להציג את חלונית ההוראות.",
    sourceLabel: "כתובת מוצא",
    destinationLabel: "כתובת יעד",
    useMyLocation: "השתמש במיקום שלי",
    live: "חי",
    swapRoute: "החלף מסלול",
    sourcePlaceholder: "350 5th Ave, New York, NY",
    destinationPlaceholder: "1 Washington Sq, San Jose, CA",
    departureTime: "זמן יציאה",
    travelMode: "אמצעי נסיעה",
    units: "יחידות",
    tripNotes: "הערות לנסיעה",
    tripNotesPlaceholder: "שבת, אוכל, איסוף, ציוד או הערות למסלול",
    unitsImperial: "אימפריאלי",
    unitsMetric: "מטרי",
    quickTimes: ["יוצא בעוד 30 דק׳", "יוצא בעוד שעתיים", "מחר ב-8:00"],
    quickDepartureChoices: "בחירות מהירות ליציאה",
    showDirectionsTitle: "הצג הוראות מלאות",
    showDirectionsCopy: "השאר חלונית ייעודית של הוראות פנייה אחר פנייה לצד ציר מזג האוויר.",
    plannerNoteHtml: "<strong>דגימה:</strong> נקודות מזג האוויר ממוקמות אוטומטית כל 30 דקות לאורך המסלול.",
    buildTripForecast: "בנה תחזית לנסיעה",
    savedEyebrow: "שמור",
    recentTrips: "נסיעות אחרונות",
    clear: "נקה",
    recentTripsEmpty: "נסיעות שתתכנן יופיעו כאן.",
    tripBoardEyebrow: "לוח נסיעה",
    defaultResultsTitle: "תכנן מסלול כדי להאיר את המפה.",
    ready: "מוכן",
    summaryEmpty: "סיכום המסלול שלך יופיע כאן.",
    copySummary: "העתק סיכום",
    copyShareLink: "העתק קישור שיתוף",
    exportTrip: "ייצא נסיעה",
    printPlan: "הדפס תוכנית",
    recenter: "מרכז מחדש",
    hideCheckpoints: "הסתר תחנות",
    showCheckpoints: "הצג תחנות",
    hideShuls: "הסתר בתי כנסת אורתודוקסיים",
    showShuls: "הצג בתי כנסת אורתודוקסיים",
    fullscreenMap: "מפה במסך מלא",
    openGoDaven: "פתח GoDaven",
    jumpToDirections: "עבור להוראות",
    mapReadyTitle: "המפה מוכנה למסלול שלך",
    mapReadyCopy: "לאחר שתבחר כתובות, המסלול, ערי מזג האוויר ונקודות ההוראות יופיעו כאן.",
    mapLegendEmpty: "פרטי המסלול והדגשות התחזית יופיעו כאן.",
    atGlanceEyebrow: "במבט מהיר",
    atGlanceTitle: "מה לוח הנסיעה מציג",
    featureList: [
      "הצעות כתובת בזמן הקלדה.",
      "תחנות מזג אוויר כל 30 דקות.",
      "ערי תחזית לחיצות לאורך המסלול.",
      "סמלי בתי כנסת אורתודוקסיים באזור המפה הנראה.",
      "הוראות פנייה אחר פנייה המשויכות לאותו מסלול."
    ],
    forecastEyebrow: "תחזית למסלול",
    weatherCityByCity: "מזג האוויר עיר אחר עיר",
    every30: "כל 30 דקות",
    noRouteTitle: "עדיין אין מסלול",
    noRouteCopy: "התחל בשתי כתובות ובזמן יציאה כדי לבנות תחזית חיה למסלול שלך.",
    directionsEyebrow: "הוראות",
    actualDirections: "הוראות פנייה אחר פנייה",
    tapStepToFocus: "לחץ על שלב כדי למקד אותו במפה",
    directionsOverviewEmpty: "בנה מסלול כדי לראות כאן את סיכום ההוראות המלא.",
    filterDirectionSteps: "סנן שלבי הוראות",
    majorStepsOnly: "רק שלבים מרכזיים",
    directionsWaitingTitle: "הוראות ממתינות",
    directionsWaitingCopy: "בנה מסלול כדי לראות כאן את רשימת הצעדים.",
    openGoogleMaps: "פתח ב-Google Maps",
    openOpenStreetMap: "פתח ב-OpenStreetMap",
    openWaze: "פתח ב-Waze",
    loading: "טוען",
    issue: "בעיה",
    searchingAddresses: "מחפש כתובות...",
    suggestionLookupFailed: "חיפוש ההצעות נכשל.",
    noMatchingAddresses: "עדיין אין כתובות תואמות.",
    departureFutureError: "אנא בחר זמן יציאה בעתיד.",
    validDepartureError: "אנא בחר זמן יציאה תקין.",
    bothAddressesError: "אנא ספק גם כתובת מוצא וגם יעד.",
    addressLookupError: "לא ניתן היה למצוא את הכתובת הזו.",
    noAddressMatch: (query) => `לא נמצאה כתובת תואמת עבור "${query}".`,
    routeCalcError: "לא ניתן היה לחשב מסלול בין המקומות האלה.",
    routeBuildError: "שירות המסלולים לא הצליח לבנות נתיב לנסיעה הזו.",
    forecastWindowError: "הנסיעה הזו חורגת מטווח התחזית. נסה זמן יציאה קרוב יותר או מסלול קצר יותר.",
    weatherLoadError: "לא ניתן היה לטעון נתוני מזג אוויר עבור אחת מנקודות המסלול.",
    noHourlyForecastError: "לא הייתה תחזית שעתית תואמת לחלק מהנסיעה.",
    unknownConditions: "תנאים לא ידועים",
    routeBuiltNotice: "המסלול נבנה. לחץ על כל תחנה או שלב הוראות כדי למקד אותו במפה.",
    wetStretchNotice: (city, time, precip) => `שים לב לקטע ליד ${city} סביב ${time}. כרגע יש שם בערך ${precip}% סיכוי למשקעים.`,
    useLocationUnsupported: "הדפדפן שלך לא תומך בגישה למיקום.",
    usingLocationNotice: (name) => `משתמש במיקום הנוכחי שלך: ${name}.`,
    locationAccessError: "לא ניתן היה לגשת למיקום שלך. בדוק הרשאות דפדפן ונסה שוב.",
    noShulsFoundNotice: "לא נמצאו בתי כנסת אורתודוקסיים בתצוגת המפה הזו מתוך תגיות OpenStreetMap. נסה להתקרב יותר או השתמש בכפתור GoDaven למסד נתונים רחב יותר.",
    loadedRecentTrip: (index) => `נטענה נסיעה אחרונה מספר ${index}.`,
    recentTripsCleared: "הנסיעות האחרונות נוקו.",
    summaryCopied: "סיכום הנסיעה הועתק.",
    summaryCopyFailed: "לא ניתן היה להעתיק אוטומטית. נסה לייצא במקום.",
    shareCopied: "קישור השיתוף הועתק.",
    shareCopyFailed: "לא ניתן היה להעתיק אוטומטית. עדיין אפשר לייצא את הנסיעה.",
    exportDone: "מסלול הנסיעה יוצא.",
    nothingToCopy: "תכנן קודם מסלול כדי שיהיה מה להעתיק.",
    nothingToShare: "תכנן קודם מסלול כדי שיהיה קישור שיתוף.",
    nothingToExport: "תכנן קודם מסלול כדי שיהיה מה לייצא.",
    nothingToPrint: "תכנן קודם מסלול כדי שיהיה מה להדפיס.",
    noDirectionsTitle: "אין הוראות",
    noDirectionsCopy: "שירות המסלולים לא החזיר הוראות פנייה אחר פנייה למסלול הזה.",
    noMatchingStepsTitle: "אין שלבים תואמים",
    noMatchingStepsCopy: "נסה לנקות את המסנן או לכבות \"רק שלבים מרכזיים\".",
    routeFrom: "מ",
    routeTo: "אל",
    routeOverview: "מסלול",
    estimatedTrip: "משך משוער",
    distance: "מרחק",
    arrival: "הגעה",
    weatherStops: "תחנות מזג אוויר",
    directionsCount: "הוראות",
    stepsCount: (count) => `${count} שלבים`,
    coldestPoint: "הנקודה הקרה ביותר",
    warmestPoint: "הנקודה החמה ביותר",
    travelModeLabel: "אמצעי נסיעה",
    sampling: "דגימה",
    forecastSpread: "טווח תחזית",
    averageSpeed: "מהירות ממוצעת",
    weatherRisk: "סיכון מזג אוויר",
    sunriseAtStart: "זריחה בתחילת המסלול",
    sunsetAtArrival: "שקיעה בהגעה",
    arrivalLight: "תאורה בהגעה",
    notes: "הערות",
    summarySubcopy: "מזג האוויר נדגם כל 30 דקות לאורך המסלול ואז מסומן בשמות ערים סמוכות כשאפשר.",
    checkpointsPlaced: (count) => `${count} נקודות מזג אוויר הוצבו לאורך המסלול.`,
    coldestNear: (temperature, city) => `${temperature} ליד ${city}`,
    warmestNear: (temperature, city) => `${temperature} ליד ${city}`,
    rangeText: (start, end) => `${start} עד ${end}`,
    elapsedOffset: (minutes) => `+${minutes} דק׳`,
    precipShort: "משקעים",
    windWord: "רוח",
    depart: (name) => `יציאה מ${name}`,
    arrive: (name) => `הגעה ל${name}`,
    near: (name) => `ליד ${name}`,
    minIntoTrip: (minutes) => `${minutes} דקות מתחילת הנסיעה`,
    stopAtMin: (minutes) => `עצירה אחרי ${minutes} דקות`,
    routeSummaryLine: (source, departure, destination) => `יוצאים מ<strong>${source}</strong> בשעה <strong>${departure}</strong> ונוסעים אל <strong>${destination}</strong>.`,
    routeRiskCalm: "מסלול רגוע ברובו",
    routeRiskSome: "יש מעט סיכון מזג אוויר",
    routeRiskRough: "צפוי קטע מאתגר",
    beforeSunrise: "לפני הזריחה",
    afterSunset: "אחרי השקיעה",
    nearSunset: "קרוב לשקיעה",
    daylight: "אור יום",
    orthodoxShulsInView: (count) => `${count} בתי כנסת אורתודוקסיים בתצוגה`,
    noShulsInView: "לא נמצאו בתי כנסת אורתודוקסיים בתצוגה הנוכחית",
    shulLayerHidden: "שכבת בתי הכנסת מוסתרת",
    wettestNear: (city) => `הכי רטוב ליד ${city}`,
    currentLocationLookupError: "לא ניתן היה לזהות את המיקום הנוכחי שלך.",
    sunriseSunsetError: "לא ניתן היה לטעון זמני זריחה ושקיעה.",
    orthodoxSynagogue: "בית כנסת אורתודוקסי",
    denomination: "נוסח",
    routeText: (duration, distance, steps) => `${duration} • ${distance} • ${steps} שלבים`,
    savedTripLine: (date, profile) => `${date} • ${profile}`,
    tripTextHeader: (source, destination) => `נסיעה: ${source} -> ${destination}`,
    departureText: "יציאה",
    arrivalText: "הגעה",
    avgSpeedText: "מהירות ממוצעת",
    weatherRiskText: "סיכון מזג אוויר",
    sunriseText: "זריחה בתחילה",
    sunsetText: "שקיעה ביעד",
    weatherCheckpointsText: "נקודות מזג אוויר",
    weatherCheckpointsSection: "נקודות מזג אוויר:",
    directionsSectionText: "הוראות:",
    useMyLocationBusy: "מאתר...",
    profileDriving: "נהיגה",
    profileCycling: "אופניים",
    profileWalking: "הליכה",
    statusNoRoute: "עדיין אין מסלול",
    buildTripForecastBusy: "בונה מסלול...",
    routeBuiltStatus: "המסלול נבנה",
    roadAhead: "הכביש שלפנים"
  }
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
    language: "en",
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
  applyLanguage();
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
  languageToggleButton.addEventListener("click", handleLanguageToggle);
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
  const url = new URL(window.location.href);
  const urlLanguage = url.searchParams.get("lang") === "he" || window.location.pathname.replace(/\/+$/, "").endsWith("/he")
    ? "he"
    : null;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.preferences) || "{}");
    state.preferences.language = urlLanguage || (saved.language === "he" ? "he" : "en");
    state.preferences.units = saved.units === "metric" ? "metric" : "imperial";
    state.preferences.directionFilter = typeof saved.directionFilter === "string" ? saved.directionFilter : "";
    state.preferences.majorStepsOnly = Boolean(saved.majorStepsOnly);
  } catch {
    state.preferences.language = urlLanguage || "en";
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

function t(key, ...args) {
  const dictionary = I18N[state.preferences.language] || I18N.en;
  const value = dictionary[key] ?? I18N.en[key];
  return typeof value === "function" ? value(...args) : value;
}

function applyLanguage() {
  const isHebrew = state.preferences.language === "he";
  document.documentElement.lang = isHebrew ? "he" : "en";
  document.documentElement.dir = isHebrew ? "rtl" : "ltr";
  document.title = t("pageTitle");
  languageToggleButton.textContent = t("languageButton");

  const heroEyebrows = document.querySelectorAll(".eyebrow");
  heroEyebrows[0].textContent = t("heroEyebrow");
  document.querySelector(".hero h1").textContent = t("heroTitle");
  document.querySelector(".hero-copy").textContent = t("heroCopy");
  document.querySelectorAll(".hero-pill").forEach((pill, index) => {
    pill.textContent = t("heroPills")[index];
  });

  heroEyebrows[1].textContent = t("tripSetupEyebrow");
  document.querySelector(".panel-intro h2").textContent = t("tripSetupTitle");
  document.querySelector(".panel-intro p:last-child").textContent = t("tripSetupCopy");

  document.querySelector('label[for="source"]').textContent = t("sourceLabel");
  document.querySelector('label[for="destination"]').textContent = t("destinationLabel");
  document.querySelector('label[for="departureTime"]').textContent = t("departureTime");
  document.querySelector('label[for="profile"]').textContent = t("travelMode");
  document.querySelector('label[for="units"]').textContent = t("units");
  document.querySelector('label[for="tripNotes"]').textContent = t("tripNotes");
  document.querySelector('#profile option[value="driving"]').textContent = t("profileDriving");
  document.querySelector('#profile option[value="cycling"]').textContent = t("profileCycling");
  document.querySelector('#profile option[value="walking"]').textContent = t("profileWalking");
  document.querySelector('#units option[value="imperial"]').textContent = t("unitsImperial");
  document.querySelector('#units option[value="metric"]').textContent = t("unitsMetric");
  document.querySelector(".quick-times").setAttribute("aria-label", t("quickDepartureChoices"));
  document.querySelectorAll(".field-tag").forEach((tag) => {
    tag.textContent = t("live");
  });
  useMyLocationButton.textContent = t("useMyLocation");
  swapTripButton.textContent = t("swapRoute");
  swapTripButton.setAttribute("aria-label", t("swapRoute"));
  sourceInput.placeholder = t("sourcePlaceholder");
  destinationInput.placeholder = t("destinationPlaceholder");
  tripNotesInput.placeholder = t("tripNotesPlaceholder");
  quickTimeButtons.forEach((button, index) => {
    button.textContent = t("quickTimes")[index];
  });
  document.querySelector(".toggle-copy strong").textContent = t("showDirectionsTitle");
  document.querySelector(".toggle-copy small").textContent = t("showDirectionsCopy");
  document.querySelector(".planner-note").innerHTML = t("plannerNoteHtml");
  submitButton.textContent = submitButton.disabled ? t("buildTripForecastBusy") : t("buildTripForecast");

  heroEyebrows[2].textContent = t("savedEyebrow");
  document.querySelector(".recent-panel h3").textContent = t("recentTrips");
  clearRecentTripsButton.textContent = t("clear");
  if (!state.recentTrips.length) {
    recentTrips.innerHTML = `<p>${escapeHtml(t("recentTripsEmpty"))}</p>`;
  }

  heroEyebrows[3].textContent = t("tripBoardEyebrow");
  if (statusBadge.classList.contains("loading")) {
    statusBadge.textContent = t("loading");
  } else if (statusBadge.classList.contains("error")) {
    statusBadge.textContent = t("issue");
  } else if (statusBadge.classList.contains("success")) {
    statusBadge.textContent = t("routeBuiltStatus");
  } else {
    statusBadge.textContent = t("ready");
  }

  if (!state.routeData) {
    resultsTitle.textContent = t("defaultResultsTitle");
  }
  if (summary.classList.contains("empty")) {
    summary.innerHTML = `<p>${escapeHtml(t("summaryEmpty"))}</p>`;
  }
  copySummaryButton.textContent = t("copySummary");
  copyShareLinkButton.textContent = t("copyShareLink");
  exportTripButton.textContent = t("exportTrip");
  printTripButton.textContent = t("printPlan");
  recenterMapButton.textContent = t("recenter");
  toggleMarkersButton.textContent = state.checkpointMarkersVisible ? t("hideCheckpoints") : t("showCheckpoints");
  toggleSynagoguesButton.textContent = state.synagoguesVisible ? t("hideShuls") : t("showShuls");
  fullscreenMapButton.textContent = t("fullscreenMap");
  document.getElementById("openGoDaven").textContent = t("openGoDaven");
  jumpToDirectionsButton.textContent = t("jumpToDirections");

  if (!state.routeData) {
    document.querySelector("#mapEmpty h3").textContent = t("mapReadyTitle");
    document.querySelector("#mapEmpty p").textContent = t("mapReadyCopy");
    mapLegend.innerHTML = `<span>${escapeHtml(t("mapLegendEmpty"))}</span>`;
  }

  heroEyebrows[4].textContent = t("atGlanceEyebrow");
  document.querySelector(".map-sidecard h3").textContent = t("atGlanceTitle");
  document.querySelectorAll(".feature-list li").forEach((item, index) => {
    item.textContent = t("featureList")[index];
  });

  heroEyebrows[5].textContent = t("forecastEyebrow");
  document.querySelector(".content-grid .subpanel h3").textContent = t("weatherCityByCity");
  document.querySelector(".content-grid .section-note").textContent = t("every30");
  if (timeline.classList.contains("empty")) {
    const empty = timeline.querySelector(".empty-state");
    if (empty) {
      empty.querySelector("h3").textContent = t("noRouteTitle");
      empty.querySelector("p").textContent = t("noRouteCopy");
    }
  }

  heroEyebrows[6].textContent = t("directionsEyebrow");
  document.querySelector("#directionsSection h3").textContent = t("actualDirections");
  document.querySelector("#directionsSection .section-note").textContent = t("tapStepToFocus");
  if (directionsOverview.classList.contains("empty")) {
    directionsOverview.innerHTML = `<p>${escapeHtml(t("directionsOverviewEmpty"))}</p>`;
  }
  directionFilterInput.placeholder = t("filterDirectionSteps");
  document.querySelector(".mini-toggle span").textContent = t("majorStepsOnly");
  if (directionsList.classList.contains("empty")) {
    const empty = directionsList.querySelector(".empty-state");
    if (empty) {
      empty.querySelector("h3").textContent = t("directionsWaitingTitle");
      empty.querySelector("p").textContent = t("directionsWaitingCopy");
    }
  }

  renderRecentTrips();
  rerenderCurrentTrip();
}

function handleLanguageToggle() {
  state.preferences.language = state.preferences.language === "he" ? "en" : "he";
  savePreferences();
  updateLanguageUrl();
  applyLanguage();
}

function updateLanguageUrl() {
  const url = new URL(window.location.href);
  if (state.preferences.language === "he") {
    url.searchParams.set("lang", "he");
  } else {
    url.searchParams.delete("lang");
  }

  window.history.replaceState({}, "", url);
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
    recentTrips.innerHTML = `<p>${escapeHtml(t("recentTripsEmpty"))}</p>`;
    return;
  }

  recentTrips.classList.remove("empty");

  state.recentTrips.forEach((trip, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-trip";
    button.innerHTML = `
      <strong>${escapeHtml(trip.sourceShort)} → ${escapeHtml(trip.destinationShort)}</strong>
      <span>${escapeHtml(t("savedTripLine", formatSavedTripDate(trip.departureTime), profileLabel(trip.profile)))}</span>
    `;
    button.addEventListener("click", () => {
      applySavedTrip(trip);
      renderNotice(t("loadedRecentTrip", index + 1));
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

  renderSuggestionState(fieldName, suggestionBox, t("searchingAddresses"));

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
        renderSuggestionState(fieldName, suggestionBox, t("suggestionLookupFailed"));
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
    throw new Error(t("suggestionLookupFailed"));
  }

  const results = await response.json();
  return results.map(normalizeNominatimPlace);
}

function renderSuggestions(fieldName, suggestionBox) {
  const suggestions = state.suggestionResults[fieldName];
  const activeIndex = state.suggestionIndex[fieldName];
  suggestionBox.innerHTML = "";

  if (!suggestions.length) {
    renderSuggestionState(fieldName, suggestionBox, t("noMatchingAddresses"));
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
    renderError(t("validDepartureError"));
    return;
  }

  if (departureDate.getTime() < Date.now() - 5 * 60 * 1000) {
    renderError(t("departureFutureError"));
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
      throw new Error(t("forecastWindowError"));
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
    setStatus("success", t("routeBuiltStatus"));
  } catch (error) {
    renderError(error.message || t("routeBuildError"));
  } finally {
    setLoadingState(false);
  }
}

async function resolvePlace(fieldName, value) {
  if (!value) {
    throw new Error(t("bothAddressesError"));
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
    throw new Error(t("addressLookupError"));
  }

  const results = await response.json();
  const place = results[0];

  if (!place) {
    throw new Error(t("noAddressMatch", query));
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
    throw new Error(t("currentLocationLookupError"));
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
    throw new Error(t("sunriseSunsetError"));
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
    throw new Error(t("routeCalcError"));
  }

  const data = await response.json();
  const route = data.routes?.[0];

  if (!route?.geometry?.coordinates?.length) {
    throw new Error(t("routeBuildError"));
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
      maneuverType: step.maneuver?.type || "",
      maneuverModifier: step.maneuver?.modifier || "",
      name: step.name || "",
      ref: step.ref || "",
      destinations: step.destinations || "",
      roadName: roadName(step),
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
        label: t("depart", sourcePlace.shortName),
        cityName: sourcePlace.shortName
      };
    }

    if (index === checkpoints.length - 1) {
      return {
        ...checkpoint,
        label: t("arrive", destinationPlace.shortName),
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
      label: uniqueCityName ? t("near", cityName) : t("minIntoTrip", checkpoint.elapsedMinutes),
      cityName: cityName || t("stopAtMin", checkpoint.elapsedMinutes)
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
    throw new Error(t("weatherLoadError"));
  }

  const data = await response.json();
  const hourly = data.hourly;
  const targetIndex = findNearestHourIndex(hourly.time, checkpoint.eta);

  if (targetIndex === -1) {
    throw new Error(t("noHourlyForecastError"));
  }

  return {
    ...checkpoint,
    forecastTime: new Date(hourly.time[targetIndex] * 1000),
    weatherCode: hourly.weather_code[targetIndex],
    weatherLabel: getWeatherLabel(hourly.weather_code[targetIndex]),
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

  refreshDirectionPresentation(directions);
  resultsTitle.textContent = `${sourcePlace.shortName} → ${destinationPlace.shortName}`;
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
      ? t("wetStretchNotice", wettestCheckpoint.cityName, formatTime(wettestCheckpoint.eta), wettestCheckpoint.precipitationProbability)
      : t("routeBuiltNotice")
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
    <p class="summary-route">${t("routeSummaryLine", escapeHtml(sourcePlace.label), formatDateTime(departureDate), escapeHtml(destinationPlace.label))}</p>
    <p class="summary-subcopy">${escapeHtml(t("summarySubcopy"))}</p>
    <div class="summary-progress">
      <div class="progress-track">
        <span class="progress-line"></span>
        ${progressMarkup}
      </div>
      <p class="summary-subcopy">${escapeHtml(t("checkpointsPlaced", checkpoints.length))}</p>
    </div>
    <div class="summary-grid">
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("estimatedTrip"))}</span>
        <span class="value">${formatDuration(route.durationSeconds)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("distance"))}</span>
        <span class="value">${formatDistanceFromMeters(route.distanceMeters)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("arrival"))}</span>
        <span class="value">${formatDateTime(arrivalDate)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("weatherStops"))}</span>
        <span class="value">${checkpoints.length}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("directionsCount"))}</span>
        <span class="value">${escapeHtml(t("stepsCount", directions.length))}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("coldestPoint"))}</span>
        <span class="value">${escapeHtml(t("coldestNear", formatTemperature(coldestPoint.temperature), coldestPoint.cityName))}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("warmestPoint"))}</span>
        <span class="value">${escapeHtml(t("warmestNear", formatTemperature(warmestPoint.temperature), warmestPoint.cityName))}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("travelModeLabel"))}</span>
        <span class="value">${profileLabel(profileInput.value)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("sampling"))}</span>
        <span class="value">${escapeHtml(t("every30"))}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("forecastSpread"))}</span>
        <span class="value">${escapeHtml(t("rangeText", formatTemperature(coldestPoint.temperature), formatTemperature(warmestPoint.temperature)))}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("averageSpeed"))}</span>
        <span class="value">${formatSpeedFromMetersPerSecond(averageSpeed)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("weatherRisk"))}</span>
        <span class="value">${escapeHtml(routeRisk.label)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("sunriseAtStart"))}</span>
        <span class="value">${formatTime(sunData.departure.sunrise)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("sunsetAtArrival"))}</span>
        <span class="value">${formatTime(sunData.arrival.sunset)}</span>
      </div>
      <div class="summary-stat">
        <span class="label">${escapeHtml(t("arrivalLight"))}</span>
        <span class="value">${escapeHtml(arrivalLight)}</span>
      </div>
    </div>
    ${notes ? `<p class="summary-subcopy"><strong>${escapeHtml(t("notes"))}:</strong> ${escapeHtml(notes)}</p>` : ""}
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
    fragment.querySelector(".eta-text").textContent = `${formatDateTime(checkpoint.eta)} • ${t("elapsedOffset", checkpoint.elapsedMinutes)}`;
    fragment.querySelector(".weather-main").textContent = `${getWeatherLabel(checkpoint.weatherCode)} • ${formatTemperature(checkpoint.temperature)}`;
    fragment.querySelector(".weather-meta").textContent = `${checkpoint.precipitationProbability}% ${t("precipShort")} • ${formatWind(checkpoint.windSpeed)}`;

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
        <h3>${escapeHtml(t("noDirectionsTitle"))}</h3>
        <p>${escapeHtml(t("noDirectionsCopy"))}</p>
      </div>
    `;
    return;
  }

  const filteredDirections = getVisibleDirections(directions);

  if (!filteredDirections.length) {
    directionsList.innerHTML = `
      <div class="empty-state compact">
        <h3>${escapeHtml(t("noMatchingStepsTitle"))}</h3>
        <p>${escapeHtml(t("noMatchingStepsCopy"))}</p>
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
    <p><strong>${escapeHtml(t("routeFrom"))}:</strong> ${escapeHtml(sourcePlace.label)}</p>
    <p><strong>${escapeHtml(t("routeTo"))}:</strong> ${escapeHtml(destinationPlace.label)}</p>
    <p><strong>${escapeHtml(t("routeOverview"))}:</strong> ${escapeHtml(t("routeText", formatDuration(route.durationSeconds), formatDistanceFromMeters(route.distanceMeters), directions.length))}</p>
    <div class="directions-actions">
      <a class="directions-link" href="${escapeHtml(googleMapsUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t("openGoogleMaps"))}</a>
      <a class="directions-link" href="${escapeHtml(openStreetMapUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t("openOpenStreetMap"))}</a>
      <a class="directions-link" href="${escapeHtml(wazeUrl)}" target="_blank" rel="noreferrer">${escapeHtml(t("openWaze"))}</a>
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
      ? t("orthodoxShulsInView", state.synagogueMarkersCount)
      : t("noShulsInView")
    : t("shulLayerHidden");

  mapLegend.classList.remove("empty");
  mapLegend.innerHTML = `
    <span class="legend-chip">${profileLabel(profileInput.value)}</span>
    <span class="legend-chip">${formatDistanceFromMeters(route.distanceMeters)}</span>
    <span class="legend-chip">${escapeHtml(t("checkpointsPlaced", checkpoints.length))}</span>
    <span class="legend-chip">${escapeHtml(synagogueText)}</span>
    <span class="legend-chip">${escapeHtml(t("wettestNear", wettestCheckpoint.cityName))}</span>
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
      <span>${escapeHtml(`${getWeatherLabel(checkpoint.weatherCode)} • ${formatTemperature(checkpoint.temperature)}`)}</span>
      <span>${escapeHtml(`${checkpoint.precipitationProbability}% ${t("precipShort")} • ${formatWind(checkpoint.windSpeed)}`)}</span>
    </div>
  `;
}

function createMapIcon(type, index) {
  const label = type === "start"
    ? state.preferences.language === "he" ? "מ" : "S"
    : type === "end"
      ? state.preferences.language === "he" ? "י" : "E"
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
  toggleMarkersButton.textContent = state.checkpointMarkersVisible ? t("hideCheckpoints") : t("showCheckpoints");

  if (state.checkpointMarkersVisible) {
    if (!state.map.hasLayer(state.layers.checkpoints)) {
      state.layers.checkpoints.addTo(state.map);
    }
  } else if (state.map.hasLayer(state.layers.checkpoints)) {
    state.map.removeLayer(state.layers.checkpoints);
  }
}

function updateSynagogueLayerVisibility() {
  toggleSynagoguesButton.textContent = state.synagoguesVisible ? t("hideShuls") : t("showShuls");

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
    refreshDirectionPresentation(state.routeData.directions);
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
    renderNotice(t("nothingToCopy"));
    return;
  }

  const copied = await copyText(buildTripSummaryText(state.routeData));
  renderNotice(copied ? t("summaryCopied") : t("summaryCopyFailed"));
}

async function handleCopyShareLink() {
  if (!state.routeData) {
    renderNotice(t("nothingToShare"));
    return;
  }

  const shareUrl = getTripShareUrl(state.routeData);
  const copied = await copyText(shareUrl);
  renderNotice(copied ? t("shareCopied") : t("shareCopyFailed"));
}

function handleExportTrip() {
  if (!state.routeData) {
    renderNotice(t("nothingToExport"));
    return;
  }

  const text = buildTripSummaryText(state.routeData, true);
  downloadTextFile(`trip-plan-${Date.now()}.txt`, text);
  renderNotice(t("exportDone"));
}

function handlePrintTrip() {
  if (!state.routeData) {
    renderNotice(t("nothingToPrint"));
    return;
  }

  window.print();
}

function handleClearRecentTrips() {
  state.recentTrips = [];
  saveRecentTrips();
  renderRecentTrips();
  renderNotice(t("recentTripsCleared"));
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

  refreshDirectionPresentation(state.routeData.directions);
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
  if (state.preferences.language === "he") {
    url.searchParams.set("lang", "he");
  } else {
    url.searchParams.delete("lang");
  }

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
    renderNotice(t("useLocationUnsupported"));
    return;
  }

  useMyLocationButton.disabled = true;
  useMyLocationButton.textContent = t("useMyLocationBusy");
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
    renderNotice(t("usingLocationNotice", place.shortName));

    if (state.map) {
      state.map.flyTo([place.latitude, place.longitude], Math.max(state.map.getZoom(), 12), {
        duration: 0.7
      });
    }
  } catch (error) {
    renderNotice(t("locationAccessError"));
  } finally {
    useMyLocationButton.disabled = false;
    useMyLocationButton.textContent = t("useMyLocation");
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
    throw new Error(t("noShulsFoundNotice"));
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
    name: tags.name || t("orthodoxSynagogue"),
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
    renderNotice(t("noShulsFoundNotice"));
  }
}

function buildSynagoguePopup(synagogue) {
  const detailLines = [
    synagogue.address,
    `${t("denomination")}: ${humanizeSynagogueDenomination(synagogue.denomination)}`,
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
  setStatus("error", t("issue"));
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
  submitButton.textContent = isLoading ? t("buildTripForecastBusy") : t("buildTripForecast");

  if (isLoading) {
    setStatus("loading", t("loading"));
  }
}

function setStatus(kind, text) {
  statusBadge.className = `status-badge ${kind}`;
  statusBadge.textContent = text;
}

function getWeatherLabel(code) {
  if (state.preferences.language === "he") {
    return WEATHER_CODES_HE[code] || WEATHER_CODES[code] || t("unknownConditions");
  }

  return WEATHER_CODES[code] || t("unknownConditions");
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
  const maneuver = step.maneuver ?? {
    type: step.maneuverType,
    modifier: step.maneuverModifier
  };
  const modifier = maneuver.modifier ? humanizeModifier(maneuver.modifier) : "";
  const road = roadName(step);

  if (state.preferences.language === "he") {
    switch (maneuver.type) {
      case "depart":
        return `צא והמשך ${modifier || "ישר"} על ${road}.`;
      case "arrive":
        return `הגע ליעד${modifier ? ` מצד ${modifier}` : ""}.`;
      case "turn":
        return `פנה ${modifier || "ישר"} אל ${road}.`;
      case "continue":
        return `המשך על ${road}.`;
      case "new name":
        return `המשך כ-${road}.`;
      case "merge":
        return `השתלב ${modifier ? `${modifier} ` : ""}אל ${road}.`.replace("  ", " ");
      case "fork":
        return `הישאר ${modifier || "ישר"} כדי להישאר על ${road}.`;
      case "on ramp":
        return `קח את הרמפה ${modifier || ""} אל ${road}.`.replace("  ", " ");
      case "off ramp":
        return `קח את היציאה ${modifier || ""} לכיוון ${road}.`.replace("  ", " ");
      case "end of road":
        return `בסוף הדרך פנה ${modifier || "ישר"} אל ${road}.`;
      case "roundabout":
      case "rotary":
        return `היכנס לכיכר והמשך לכיוון ${road}.`;
      case "use lane":
        return `השתמש בנתיב כדי להמשיך ${modifier || "ישר"} אל ${road}.`;
      default:
        return `המשך על ${road}.`;
    }
  }

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
  return step.name || step.ref || step.destinations || t("roadAhead");
}

function refreshDirectionPresentation(directions) {
  directions.forEach((direction) => {
    direction.roadName = roadName(direction);
    direction.instruction = formatDirectionInstruction(direction);
    direction.distanceText = formatDistance(direction.distanceMeters);
    direction.durationText = formatDuration(direction.durationSeconds);
  });
}

function humanizeModifier(modifier) {
  const normalized = modifier.replaceAll("-", " ");
  if (state.preferences.language !== "he") {
    return normalized;
  }

  const translations = {
    left: "שמאלה",
    right: "ימינה",
    straight: "ישר",
    "slight left": "שמאלה קלות",
    "slight right": "ימינה קלות",
    "sharp left": "שמאלה חד",
    "sharp right": "ימינה חד",
    uturn: "פרסה"
  };

  return translations[normalized] || normalized;
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
    return state.preferences.language === "he"
      ? `${Math.round(distanceMeters * 3.28084)} רגל`
      : `${Math.round(distanceMeters * 3.28084)} ft`;
  }

  const miles = distanceMeters * 0.000621371;
  const value = miles >= 10 ? miles.toFixed(0) : miles.toFixed(1);
  return state.preferences.language === "he" ? `${value} מייל` : `${value} mi`;
}

function formatDistanceFromMeters(distanceMeters) {
  if (state.preferences.units === "metric") {
    if (distanceMeters < 1000) {
      return state.preferences.language === "he"
        ? `${Math.round(distanceMeters)} מ׳`
        : `${Math.round(distanceMeters)} m`;
    }

    const kilometers = distanceMeters / 1000;
    const value = kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1);
    return state.preferences.language === "he" ? `${value} ק״מ` : `${value} km`;
  }

  return formatDistance(distanceMeters);
}

function formatDuration(durationSeconds) {
  const totalMinutes = Math.round(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return state.preferences.language === "he"
      ? `${Math.max(minutes, 1)} דק׳`
      : `${Math.max(minutes, 1)} min`;
  }

  if (minutes === 0) {
    return state.preferences.language === "he" ? `${hours} ש׳` : `${hours} hr`;
  }

  return state.preferences.language === "he"
    ? `${hours} ש׳ ${minutes} דק׳`
    : `${hours} hr ${minutes} min`;
}

function formatTemperature(fahrenheitValue) {
  if (state.preferences.units === "metric") {
    return `${Math.round((fahrenheitValue - 32) * (5 / 9))}°C`;
  }

  return `${fahrenheitValue}°F`;
}

function formatWind(mphValue) {
  if (state.preferences.units === "metric") {
    return `${Math.round(mphValue * 1.60934)} km/h ${t("windWord")}`;
  }

  return `${mphValue} mph ${t("windWord")}`;
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
  return new Intl.DateTimeFormat(state.preferences.language === "he" ? "he-IL" : "en-US", {
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
  return new Intl.DateTimeFormat(state.preferences.language === "he" ? "he-IL" : "en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function getRouteRisk(checkpoints) {
  const maxPrecip = Math.max(...checkpoints.map((checkpoint) => checkpoint.precipitationProbability));
  const severeCode = checkpoints.some((checkpoint) => checkpoint.weatherCode >= 95);

  if (severeCode || maxPrecip >= 75) {
    return { label: t("routeRiskRough") };
  }

  if (maxPrecip >= 40) {
    return { label: t("routeRiskSome") };
  }

  return { label: t("routeRiskCalm") };
}

function describeLightCondition(date, sunData) {
  if (date < sunData.sunrise) {
    return t("beforeSunrise");
  }

  if (date > sunData.sunset) {
    return t("afterSunset");
  }

  const hoursToSunset = (sunData.sunset.getTime() - date.getTime()) / (1000 * 60 * 60);
  return hoursToSunset < 1.5 ? t("nearSunset") : t("daylight");
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
  if (state.preferences.language === "he") {
    url.searchParams.set("lang", "he");
  } else {
    url.searchParams.delete("lang");
  }

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
    t("tripTextHeader", sourcePlace.label, destinationPlace.label),
    `${t("departureText")}: ${formatDateTime(departureDate)}`,
    `${t("arrivalText")}: ${formatDateTime(arrivalDate)} (${describeLightCondition(arrivalDate, sunData.arrival)})`,
    `${t("travelMode")}: ${profileLabel(profileInput.value)}`,
    `${t("distance")}: ${formatDistanceFromMeters(route.distanceMeters)}`,
    `${t("estimatedTrip")}: ${formatDuration(route.durationSeconds)}`,
    `${t("avgSpeedText")}: ${formatSpeedFromMetersPerSecond(route.distanceMeters / route.durationSeconds)}`,
    `${t("weatherRiskText")}: ${risk}`,
    `${t("sunriseText")}: ${formatTime(sunData.departure.sunrise)}`,
    `${t("sunsetText")}: ${formatTime(sunData.arrival.sunset)}`,
    `${t("weatherCheckpointsText")}: ${checkpoints.length}`
  ];

  if (notes) {
    lines.push(`${t("notes")}: ${notes}`);
  }

  if (includeSteps) {
    lines.push("");
    lines.push(t("weatherCheckpointsSection"));
    checkpoints.forEach((checkpoint) => {
      lines.push(`- ${checkpoint.label} | ${formatDateTime(checkpoint.eta)} | ${getWeatherLabel(checkpoint.weatherCode)}, ${formatTemperature(checkpoint.temperature)}, ${checkpoint.precipitationProbability}% ${t("precipShort")}, ${formatWind(checkpoint.windSpeed)}`);
    });
    lines.push("");
    lines.push(t("directionsSectionText"));
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

function profileLabel(profile) {
  if (profile === "cycling") {
    return t("profileCycling");
  }

  if (profile === "walking") {
    return t("profileWalking");
  }

  return t("profileDriving");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
