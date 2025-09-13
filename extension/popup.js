
const DEFAULT_SETTINGS = {
    honorsValue: 33,
    programDuration: 180,
    exclusionPolicy: "none",
    exclusionValue: 0
};

function parseNewSettings() {
    let honorsValueStr = document.querySelector("#honorsValue").value;
    let honorsValue = parseInt(honorsValueStr, 10) || DEFAULT_SETTINGS.honorsValue;

    let programDuration = document.querySelector('input[name="programDuration"]:checked').value;
    if (programDuration === "custom") {
        programDuration = parseInt(document.querySelector("#customProgramDuration").value, 10) || DEFAULT_SETTINGS.programDuration;
    } else {
        programDuration = parseInt(programDuration, 10) || DEFAULT_SETTINGS.programDuration;
    }

    let exclusionPolicy = document.querySelector('input[name="exclusionPolicy"]:checked').value;
    let exclusionValue = DEFAULT_SETTINGS.exclusionValue;
    if (exclusionPolicy === "credits") {
        exclusionValue = parseInt(document.querySelector("#excludedCredits").value, 10) || DEFAULT_SETTINGS.exclusionValue;
    } else if (exclusionPolicy === "exams") {
        exclusionValue = parseInt(document.querySelector("#excludedExams").value, 10) || DEFAULT_SETTINGS.exclusionValue;
    }

    if (programDuration < 0 || exclusionValue < 0) {
        updatePopup(DEFAULT_SETTINGS);
    }
    return { honorsValue, programDuration, exclusionPolicy, exclusionValue };
}

function updatePopup(settings) {
    const s = { ...DEFAULT_SETTINGS, ...settings };

    document.querySelector("#honorsValue").value = s.honorsValue.toString();

    const durationRadios = document.querySelectorAll('input[name="programDuration"]');
    let matchedRadio = false;
    durationRadios.forEach(r => {
        if (parseInt(r.value, 10) === s.programDuration && r.value !== "custom") {
            r.checked = true;
            matchedRadio = true;
        }
    });
    if (!matchedRadio) {
        document.querySelector('input[name="programDuration"][value="custom"]').checked = true;
        document.querySelector("#customProgramDuration").value = s.programDuration;
    }

    document.querySelector(`input[name="exclusionPolicy"][value="${s.exclusionPolicy}"]`).checked = true;
    if (s.exclusionPolicy === "credits") {
        document.querySelector("#excludedCredits").value = s.exclusionValue;
    } else if (s.exclusionPolicy === "exams") {
        document.querySelector("#excludedExams").value = s.exclusionValue;
    }
}

function saveSettings() {
    const newSettings = parseNewSettings();
    chrome.storage.local.set({ settings: newSettings });
}

function loadSettings() {
    chrome.storage.local.get("settings").then((result) => {
        updatePopup(result.settings || DEFAULT_SETTINGS);
    });
}

function attachAutoSave() {
    const inputs = document.querySelectorAll("input, select");
    inputs.forEach(el => {
        el.addEventListener("change", saveSettings);
        el.addEventListener("input", saveSettings);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadSettings();
    attachAutoSave();
});
