
const DEFAULT_SETTINGS = {
    honorsValue: 33,
    programDuration: 180,
    exclusionPolicy: "none",
    exclusionValue: 0
};

function writeSettings(settings) {
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
    if (s.exclusionPolicy === "byCfu") {
        document.querySelector("#excludedCFUs").value = s.exclusionValue;
    } else if (s.exclusionPolicy === "byExams") {
        document.querySelector("#excludedExams").value = s.exclusionValue;
    }
}

function saveSettings() {
    const settings = readSettings();
    chrome.storage.sync.set({ settings });
}

function loadSettings() {
    chrome.storage.sync.get("settings", (data) => {
        if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError);
            writeSettings(DEFAULT_SETTINGS);
            return;
        }
        writeSettings(data.settings || DEFAULT_SETTINGS);
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
