
function readSettings() {
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
    if (exclusionPolicy === "byCfu") {
        exclusionValue = parseInt(document.querySelector("#excludedCFUs").value, 10) || DEFAULT_SETTINGS.exclusionValue;
    } else if (exclusionPolicy === "byExams") {
        exclusionValue = parseInt(document.querySelector("#excludedExams").value, 10) || DEFAULT_SETTINGS.exclusionValue;
    }

    if (programDuration < 0 || exclusionValue < 0) {
        writeSettings(DEFAULT_SETTINGS);
    }
    return { honorsValue, programDuration, exclusionPolicy, exclusionValue };
}
