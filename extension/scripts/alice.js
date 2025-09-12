
/**
 * timeout di 3s è unreliable asf
 * fare i dati almalaurea in inglese?
 * persistenza dei dati (magari divisi per matricola sarebbe top)
 * layout responsive
 * schermata previsione
 * * */

"use strict";

setTimeout(init, 3000);

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName === "local") {
		global.extensionSettings = changes.settings.newValue;
		updateGUI();
	}
});

// Global variables
const global = {
	selectedAlmalaureaStats: null,
	extensionSettings: DEFAULT_SETTINGS,
	suitableCredits: 0, 
	parsedExams: []

}

// GUI elements
const GUI = {
	// Academic year filter
	academicYearFilter: null,

    // Charts
    gradeDistributionCanvas: null,
    gradeDistributionChart: null,
    examsCanvas: null,
    examsChart: null,

    // Credits progress bar
    creditsProgress: null,
    creditsProgressTextLeft: null,
    creditsProgressTextRight: null,
    creditsProgressTextLeftmost: null,
    creditsProgressTextRightmost: null,

    // User stats
    weightedAverageValue: null,
    arithmeticAverageValue: null,
    finalGradePredictionValue: null,
    finalGradePredictionValuePI: null,

    // AlmaLaurea stats
    almalaureaVotoEsamiValue: null,
    almalaureaVotoFinaleValue: null,
    almalaureaEtaAllaLaureaValue: null,
    almalaureaDurataStudiValue: null,
    almalaureaStatsBottomText: null
};

async function init() {
	const localStorageQueryResult = await chrome.storage.local.get("settings");
	global.extensionSettings = localStorageQueryResult.settings;
	
	const table = document.querySelector("#tableLibretto");
	if (table == null) { return; } // The user is in the career selection page
	const tbody = table.querySelector("tbody");
	const rows = tbody.querySelectorAll("tr");

	insertCheckboxes(rows);
	global.parsedExams = parseExams(rows);
	drawLayout();
	updateGUI();

	// Add listeners to the checkboxes
	tbody.querySelectorAll(`input[type=checkbox].upp-checkbox`).forEach(cb => {
		cb.addEventListener("change", () => {
			updateGUI();
		});
	});
}

function insertCheckboxes(rows) {
	rows.forEach(row => {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "includeInAverage";
		checkbox.className = "upp-checkbox";

		// False by default
		checkbox.checked = false;

		// Insert the checkbox left to the exam name
		row.firstElementChild.insertBefore(checkbox, row.firstElementChild.firstElementChild)
	});
}

function parseExams(rows) {
	let parsedExams = []
	for (const row of rows) {
		const cells = row.querySelectorAll("td");
		const checkbox = cells[0].querySelector("input[type=checkbox].upp-checkbox");

		// Do not count the exam if it contains either:
		// - #sovran (attività sovrannumeraria) -> Extra activities
		// - #debito (debito formativo / OFA)	-> Knowledge you were supposed to have before starting the degree
		if (row.querySelector("#sovran") || row.querySelector("#debito")) {
			checkbox.disabled = true;
			continue;
		}

		// A mandatory exam has not been completed yet by the student
		if (!cells[5].textContent.includes("-")) {
			checkbox.disabled = true;
			continue;
		}

		// Removes the 5-letter exam code and " - " 
		//  (e.g, "075II - COMUNICAZIONI NUMERICHE" -> "COMUNICAZIONI NUMERICHE")
		const name = cells[0].textContent.slice(8).trim().replaceAll("\n", ""); 
		const credits = parseInt(cells[2].textContent, 10);

		// (e.g. "28 - 21/09/2022" -> 28, "21/09/2022")
		const grade_and_date = cells[5].textContent.split("-").map(s => s.trim());
		const date = parseDateDDMMYY(grade_and_date[1])

		let grade = grade_and_date[0];
		let excludedCredits = 0;
		if (grade === "IDO") { 
			// The exam does not havea a grade, just a "passed")
			grade = NaN;
			checkbox.disabled = true;
			excludedCredits = credits; 
		} else if (grade === "30L") { 
			grade = 31; // Later it will be converted to the actual honors value
		} else { 
			grade = parseInt(grade, 10); 
		}
		
		// FIXME: Debug - use random grades
		let gradeTmp = Math.round(Math.random() * 13 + 18)
		if (isNaN(grade)) { gradeTmp = grade; }
		
		checkbox.checked = true;
		parsedExams.push({name, credits, excludedCredits, grade : gradeTmp, date, checkbox});
	}
	return parsedExams;
}

/**
 * Parses DD/MM/YY strings into a JS Date object
 */
function parseDateDDMMYY(date_string) {
	const parts = date_string.split("/");
	const day = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
	const year = parseInt(parts[2], 10);
	return new Date(year, month, day);
}

function drawLayout() {
	// Draw the main display box below #libretto-inlineForms
	const target = document.getElementById("libretto-inlineForms");
	const mainDiv = document.createElement("div");
	mainDiv.className = "upp-main-container";
	target.insertAdjacentElement("afterend", mainDiv);

		// User stats
	const userStatsDiv = document.createElement("div");
	userStatsDiv.style.gridColumn = "1";
	userStatsDiv.style.gridRow = "1";
	mainDiv.appendChild(userStatsDiv);
	
			// User stats -> Title
	const userStatsTitleDiv = document.createElement("div");
	userStatsTitleDiv.className = "upp-horizontal-flexbox-center"
	userStatsTitleDiv.style.gap = "1em";
	userStatsTitleDiv.style.marginBottom = "1em";
	userStatsDiv.appendChild(userStatsTitleDiv);

				// User stats -> Title -> Text
	const userStatsTitle = document.createElement("h3");
	userStatsTitle.textContent = "Le tue statistiche";
	userStatsTitle.style.margin = "0";
	userStatsTitleDiv.appendChild(userStatsTitle);
	
				// User stats -> Title -> Academic Year Filter
    GUI.academicYearFilter = document.createElement("select");
    GUI.academicYearFilter.style.padding = "5px";
    GUI.academicYearFilter.addEventListener("change", updateGUI);
    userStatsTitleDiv.appendChild(GUI.academicYearFilter);
	
			// User stats -> Most important stats
	const bigStatsDiv = document.createElement("div");
	bigStatsDiv.className = "upp-horizontal-flexbox-even";
	userStatsDiv.appendChild(bigStatsDiv);

				// User stats -> Most important stats -> Weighted average
	const weightedAverageDiv = document.createElement("div");
	weightedAverageDiv.className = "upp-vertical-flexbox-center";
	bigStatsDiv.appendChild(weightedAverageDiv);

	const weightedAverageLabel = document.createElement("span");
	weightedAverageLabel.textContent = "Media ponderata";
	weightedAverageDiv.appendChild(weightedAverageLabel);
	
	GUI.weightedAverageValue = document.createElement("span");
	GUI.weightedAverageValue.textContent = "-";
	GUI.weightedAverageValue.className = "upp-statistic-big";
	weightedAverageDiv.appendChild(GUI.weightedAverageValue);

				// User stats -> Most important stats -> Arithmetic average
	const arithmeticAverageDiv = document.createElement("div");
	arithmeticAverageDiv.className = "upp-vertical-flexbox-center";
	bigStatsDiv.appendChild(arithmeticAverageDiv);
	
	const arithmeticAverageLabel = document.createElement("span");
	arithmeticAverageLabel.textContent = "Media aritmetica";
	arithmeticAverageDiv.appendChild(arithmeticAverageLabel);
	
	GUI.arithmeticAverageValue = document.createElement("span");
	GUI.arithmeticAverageValue.textContent = "-";
	GUI.arithmeticAverageValue.className = "upp-statistic-big";
	arithmeticAverageDiv.appendChild(GUI.arithmeticAverageValue);

				// User stats -> Most important stats -> Predicted final grade
	const finalGradePredictionDiv = document.createElement("div");
	finalGradePredictionDiv.className = "upp-vertical-flexbox-center";
	bigStatsDiv.appendChild(finalGradePredictionDiv);

	const finalGradePredictionLabel = document.createElement("span");
	finalGradePredictionLabel.textContent = "Voto previsto";
	addTooltip(finalGradePredictionLabel, "Il voto di laurea viene stimato confrontando la tua media aritmetica con quella dei laureati tra il 2022 ed il 2024 in tutto l'ateneo.\nÈ possibile affermare con il 95% di sicurezza che il tuo vero voto di laurea ricadrà nel range indicato dal ±");
	finalGradePredictionDiv.appendChild(finalGradePredictionLabel);

	const finalGradePredictionValueDiv = document.createElement("div");
	finalGradePredictionValueDiv.className = "upp-horizontal-flexbox-center";
	finalGradePredictionDiv.appendChild(finalGradePredictionValueDiv);
	
	GUI.finalGradePredictionValue = document.createElement("span");
	GUI.finalGradePredictionValue.textContent = "-";
	GUI.finalGradePredictionValue.className = "upp-statistic-big";
	finalGradePredictionValueDiv.appendChild(GUI.finalGradePredictionValue);
	
	GUI.finalGradePredictionValuePI = document.createElement("span");
	GUI.finalGradePredictionValuePI.textContent = "-";
	GUI.finalGradePredictionValuePI.style.letterSpacing = "0.1em";
	GUI.finalGradePredictionValuePI.style.marginLeft = "0.1em";
	GUI.finalGradePredictionValuePI.style.marginBottom = "0.1em";
	finalGradePredictionValueDiv.appendChild(GUI.finalGradePredictionValuePI);

			// User stats -> Progress bar
	const creditsProgressBarDiv = document.createElement("div");
	creditsProgressBarDiv.className = "upp-progress-bar-container";
	userStatsDiv.appendChild(creditsProgressBarDiv);
	
	GUI.creditsProgress = document.createElement("div");
	GUI.creditsProgress.className = "upp-progress-bar";
	creditsProgressBarDiv.appendChild(GUI.creditsProgress);
	
	GUI.creditsProgressTextLeft = document.createElement("div");
	GUI.creditsProgressTextLeft.className = "upp-progress-bar-text";
	GUI.creditsProgress.appendChild(GUI.creditsProgressTextLeft);

	GUI.creditsProgressTextRight = document.createElement("div");
	GUI.creditsProgressTextRight.className = "upp-progress-bar-text";
	GUI.creditsProgressTextRight.style.color = "#000000";
	creditsProgressBarDiv.appendChild(GUI.creditsProgressTextRight);

	GUI.creditsProgressTextLeftmost = document.createElement("div");
	GUI.creditsProgressTextLeftmost.className = "upp-progress-bar-text";
	GUI.creditsProgressTextLeftmost.style.position = "absolute";
	GUI.creditsProgressTextLeftmost.style.left = "0";
	creditsProgressBarDiv.appendChild(GUI.creditsProgressTextLeftmost);
	
	GUI.creditsProgressTextRightmost = document.createElement("div");
	GUI.creditsProgressTextRightmost.className = "upp-progress-bar-text";
	GUI.creditsProgressTextRightmost.style.position = "absolute";
	GUI.creditsProgressTextRightmost.style.right = "0";
	GUI.creditsProgressTextRightmost.style.color = "#000000";
	creditsProgressBarDiv.appendChild(GUI.creditsProgressTextRightmost);

			// User stats -> Grade distribution canvas
	const gradeDistributionDiv = document.createElement("div");
	gradeDistributionDiv.className = "upp-grade-distribution-chart-container"
	userStatsDiv.appendChild(gradeDistributionDiv);

	GUI.gradeDistributionCanvas = document.createElement("canvas");
	gradeDistributionDiv.appendChild(GUI.gradeDistributionCanvas);
	
		// AlmaLaurea stats
	const almalaureaStatsDiv = document.createElement("div");
	almalaureaStatsDiv.style.gridRow = "1";
	almalaureaStatsDiv.style.gridColumn = "2";
	mainDiv.appendChild(almalaureaStatsDiv);
	
			// AlmaLaurea stats -> Title
	const almalaureaTitle = document.createElement("h3");
	almalaureaTitle.textContent = "Statistiche medie ateneo (AlmaLaurea)";
	almalaureaTitle.className = "upp-almalaurea-title upp-horizontal-flexbox-center"
	almalaureaStatsDiv.appendChild(almalaureaTitle);
	
			// AlmaLaurea stats -> Filters
	drawAlmalaureaFilters(almalaureaStatsDiv);

			// Almalaurea stats -> Most important stats
	const bigAlmalaureaStatsDiv = document.createElement("div");
	bigAlmalaureaStatsDiv.className = "upp-horizontal-flexbox-even";
	almalaureaStatsDiv.appendChild(bigAlmalaureaStatsDiv);

				// Almalaurea stats -> Most important stats -> Voto esami
	const almalaureaVotoEsamiDiv = document.createElement("div");
	almalaureaVotoEsamiDiv.className = "upp-vertical-flexbox-center";
	bigAlmalaureaStatsDiv.appendChild(almalaureaVotoEsamiDiv);

	const almalaureaVotoEsamiLabel = document.createElement("span");
	almalaureaVotoEsamiLabel.textContent = "Voto esami";
	addTooltip(almalaureaVotoEsamiLabel, "AlmaLaurea calcola questo valore come la media aritmetica dei voti degli esami considerando 30L come 30. Per questo motivo, il valore è leggermente inferiore alla vera media aritmetica del corso selezionato");
	almalaureaVotoEsamiDiv.appendChild(almalaureaVotoEsamiLabel);
	
	GUI.almalaureaVotoEsamiValue = document.createElement("span");
	GUI.almalaureaVotoEsamiValue.textContent = "-";
	GUI.almalaureaVotoEsamiValue.className = "upp-statistic-big";
	almalaureaVotoEsamiDiv.appendChild(GUI.almalaureaVotoEsamiValue);

				// Almalaurea stats -> Most important stats -> Voto finale
	const almalaureaVotoFinaleDiv = document.createElement("div");
	almalaureaVotoFinaleDiv.className = "upp-vertical-flexbox-center";
	bigAlmalaureaStatsDiv.appendChild(almalaureaVotoFinaleDiv);
	
	const almalaureaVotoFinaleLabel = document.createElement("span");
	almalaureaVotoFinaleLabel.textContent = "Voto finale";
	addTooltip(almalaureaVotoFinaleLabel, "AlmaLaurea calcola questo valore considerando 110L come 113");
	almalaureaVotoFinaleDiv.appendChild(almalaureaVotoFinaleLabel);
	
	GUI.almalaureaVotoFinaleValue = document.createElement("span");
	GUI.almalaureaVotoFinaleValue.textContent = "-";
	GUI.almalaureaVotoFinaleValue.className = "upp-statistic-big";
	almalaureaVotoFinaleDiv.appendChild(GUI.almalaureaVotoFinaleValue);

				// Almalaurea stats -> Most important stats -> Età alla laurea
	const almalaureaEtaAllaLaureaDiv = document.createElement("div");
	almalaureaEtaAllaLaureaDiv.className = "upp-vertical-flexbox-center";
	bigAlmalaureaStatsDiv.appendChild(almalaureaEtaAllaLaureaDiv);
	
	const almalaureaEtaAllaLaureaLabel = document.createElement("span");
	almalaureaEtaAllaLaureaLabel.textContent = "Età alla laurea";
	almalaureaEtaAllaLaureaDiv.appendChild(almalaureaEtaAllaLaureaLabel);
	
	GUI.almalaureaEtaAllaLaureaValue = document.createElement("span");
	GUI.almalaureaEtaAllaLaureaValue.textContent = "-";
	GUI.almalaureaEtaAllaLaureaValue.className = "upp-statistic-big";
	almalaureaEtaAllaLaureaDiv.appendChild(GUI.almalaureaEtaAllaLaureaValue);

				// Almalaurea stats -> Most important stats -> Durata studi
	const almalaureaDurataStudiDiv = document.createElement("div");
	almalaureaDurataStudiDiv.className = "upp-vertical-flexbox-center";
	bigAlmalaureaStatsDiv.appendChild(almalaureaDurataStudiDiv);
	
	const almalaureaDurataStudiLabel = document.createElement("span");
	almalaureaDurataStudiLabel.textContent = "Durata studi";
	almalaureaDurataStudiDiv.appendChild(almalaureaDurataStudiLabel);
	
	GUI.almalaureaDurataStudiValue = document.createElement("span");
	GUI.almalaureaDurataStudiValue.textContent = "-";
	GUI.almalaureaDurataStudiValue.className = "upp-statistic-big";
	almalaureaDurataStudiDiv.appendChild(GUI.almalaureaDurataStudiValue);

					// Almalaurea stats -> Bottom text
	GUI.almalaureaStatsBottomText = document.createElement("div");
	GUI.almalaureaStatsBottomText.className = "upp-horizontal-flexbox-center upp-info-text";
	GUI.almalaureaStatsBottomText.textContent = "Seleziona un corso di laurea per visualizzane le statistiche";
	almalaureaStatsDiv.appendChild(GUI.almalaureaStatsBottomText);

		// Time series chart
	const timeSeriesDiv = document.createElement("div");
	timeSeriesDiv.style.gridColumn = "1 / span 2";
	timeSeriesDiv.style.gridRow = "2";
	timeSeriesDiv.style.height = "300px";
	timeSeriesDiv.style.maxHeight = "300px";
	timeSeriesDiv.style.width = "100%";
	mainDiv.appendChild(timeSeriesDiv);

	GUI.examsCanvas = document.createElement("canvas");
	timeSeriesDiv.appendChild(GUI.examsCanvas);
}

function addTooltip(element, text) {
	element.classList.add("upp-label-with-tooltip");
	
	const tooltip = document.createElement("div");
	tooltip.className = "upp-tooltip";
	tooltip.textContent = "?";
	element.appendChild(tooltip);

	const tooltipText = document.createElement("div");
	tooltipText.className = "upp-tooltip-text"
	tooltipText.textContent = text;
	tooltip.appendChild(tooltipText);
}

function drawAlmalaureaFilters(container) {

    const createSelect = (id, labelText) => {
        const div = document.createElement("div");
        div.style.marginBottom = ".75em";
        container.appendChild(div);

        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = labelText;
        label.style.display = "block";
        label.style.fontWeight = "normal";
        label.style.marginBottom = ".1em";
        label.style.marginLeft = "1em";
		div.appendChild(label);

        const select = document.createElement("select");
        select.id = id;
        select.className = "upp-almalaurea-filter";
        select.style.width = "100%";
        select.style.padding = ".5em";
		select.required = true;
        div.appendChild(select);
        
        return select;
    };

	const populateSelect = (select, items, placeholder) => {
        select.innerHTML = `<option value="" invalid selected>- Seleziona ${placeholder} -</option>`;
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
    };

    const corstipoSelect = createSelect("upp-almalaurea-corstipo", "Tipo di corso");
    const facoltaSelect = createSelect("upp-almalaurea-facolta", "Facoltà / Dipartimento");
    const postcorsoSelect = createSelect("upp-almalaurea-postcorso", "Corso di laurea");

    const corstipoItems = [...new Set(almaLaureaData.map(d => d.corstipo))];
    populateSelect(corstipoSelect, corstipoItems, "un tipo di corso");

    corstipoSelect.addEventListener("change", () => {
		const selectedCorstipo = corstipoSelect.value;
		facoltaSelect.innerHTML = "";
		postcorsoSelect.innerHTML = "";
		clearAlmalaureaStats();
		if (selectedCorstipo == "") { return; }

        const filteredAlmaLaureaData = almaLaureaData.filter(d => d.corstipo === selectedCorstipo);
        const facoltaItems = [...new Set(filteredAlmaLaureaData.map(d => d.facolta))];
        populateSelect(facoltaSelect, facoltaItems, "una facoltà / dipartimento");
    });

    facoltaSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
		clearAlmalaureaStats();
		postcorsoSelect.innerHTML = "";
		if (selectedFacolta == "") { return; }

        const filteredAlmaLaureaData = almaLaureaData.filter(d => d.corstipo === selectedCorstipo && d.facolta === selectedFacolta);
        const postcorsoItems = [...new Set(filteredAlmaLaureaData.map(d => d.postcorso))];
        populateSelect(postcorsoSelect, postcorsoItems, "un corso di laurea");
    });

    postcorsoSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
        const selectedPostcorso = postcorsoSelect.value;
		if (selectedPostcorso == "") { 
			clearAlmalaureaStats();
			return;
		}
        
        global.selectedAlmalaureaStats = almaLaureaData.find(d => 
            d.corstipo === selectedCorstipo && 
            d.facolta === selectedFacolta && 
            d.postcorso === selectedPostcorso
        );
		updateAlmalaureaStats();
    });
}

function clearAlmalaureaStats() {
	GUI.almalaureaVotoEsamiValue.textContent = "-";
	GUI.almalaureaVotoFinaleValue.textContent = "-";
	GUI.almalaureaEtaAllaLaureaValue.textContent = "-";
	GUI.almalaureaDurataStudiValue.textContent = "-";
    GUI.almalaureaStatsBottomText.textContent = "Seleziona un corso di laurea per visualizzane le statistiche";
    if (global.selectedAlmalaureaStats != null) {
		global.selectedAlmalaureaStats = null;
		updateGUI(); // Delete the average line
	} 
}

function updateAlmalaureaStats() {
	const stats = global.selectedAlmalaureaStats;
	
	// If any of the stats are null, the degree program does
	//  not have enough graduates to compute meaningful stats
	if (Object.values(stats).some(value => value == null)) {
		clearAlmalaureaStats();
		GUI.almalaureaStatsBottomText.textContent = "Il corso selezionato ha avuto troppi pochi laureati nel 2024 (" + stats.numero_laureati + ")";	
	}
	else {
		GUI.almalaureaVotoEsamiValue.textContent = stats.voto_esami_medio;
		GUI.almalaureaVotoFinaleValue.textContent = stats.voto_finale_medio;
		GUI.almalaureaEtaAllaLaureaValue.textContent = stats.eta_alla_laurea_media;
		GUI.almalaureaDurataStudiValue.textContent = stats.durata_studi_media;
		GUI.almalaureaStatsBottomText.textContent = "Statistiche basate su " + stats.numero_laureati + " laureati nel 2024";
		updateGUI(); // Re-draw the new average line
	}
}

function updateGUI() {
	const exams = computeExcludedCredits(
		global.parsedExams,
		global.extensionSettings.exclusionPolicy,
		global.extensionSettings.exclusionValue
	)
	const selectedAcademicYear = updateAcademicYearFilter();
	const filteredExams = filterExamsByAcademicYear(exams, selectedAcademicYear);
	const userStats = computeUserStats(
		filteredExams,
		global.extensionSettings.honorsValue,
		global.extensionSettings.exclusionPolicy,
		global.extensionSettings.exclusionValue
	);
	const finalGradePrediction = predictFinalGradeWith95PI(userStats.almaLaureaAverage);
	const scatterData = computeScatterData(filteredExams, global.extensionSettings.honorsValue);

	GUI.arithmeticAverageValue.textContent = userStats.arithmeticAverage;
	GUI.weightedAverageValue.textContent = userStats.weightedAverage;
	GUI.finalGradePredictionValue.textContent = finalGradePrediction.value >= 110.5 ? "110L" : Math.round(finalGradePrediction.value);
	GUI.finalGradePredictionValuePI.textContent = "±" + Math.round(finalGradePrediction.predictionInterval);
	
	updateCreditsProgressBar(
		userStats.validCredits + userStats.excludedCredits,
		global.extensionSettings.programDuration
	);
	updateGradeDistributionChart(userStats.gradeDistribution, global.extensionSettings.honorsValue);
	updateExamsChart(scatterData);
}

function updateAcademicYearFilter() {
	const selectedExams = global.parsedExams.filter(exam => exam.checkbox.checked === true);
	const academicYears = [...new Set(
		selectedExams.map(exam => dateToAcademicYear(exam.date))
	)].sort();

    const previousValue = GUI.academicYearFilter.value;

    // Remove all current options
    GUI.academicYearFilter.innerHTML = "";

    // Create the "all" option
    let allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Tutti gli anni";
    GUI.academicYearFilter.appendChild(allOption);

    // Create options for each academic year
    academicYears.forEach(year => {
        let option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        GUI.academicYearFilter.appendChild(option);
    });

    // Restore previous selection if possible, otherwise fallback to "all"
    if ([...GUI.academicYearFilter.options].some(opt => opt.value === previousValue)) {
        GUI.academicYearFilter.value = previousValue;
    } else {
        GUI.academicYearFilter.value = "all";
    }

	return GUI.academicYearFilter.value;
}

/**
 * Determines the academic year (e.g., "2024/2025") in which a given date falls.
 * An academic year runs from October 1st to September 31st
 */
function dateToAcademicYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (October is 9)
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}/${startYear + 1}`;
}

function computeExcludedCredits(exams, exclusionPolicy, exclusionValue) {
	// Sort a copy of the exams array
	exams = Array.from(exams).sort((a, b) => {
		// If the grade is the same, sort by credits descending
		if (a.grade === b.grade) { return b.credits - a.credits; }
		// Otherwise sort by grade ascending
		return a.grade - b.grade;
	});	

	exams.forEach(exam => {
		if (isNaN(exam.grade)) { 
			exam.excludedCredits = exam.credits;
			return;
		}
		if (exclusionValue <= 0 || exclusionPolicy == "none") { 
			exam.excludedCredits = 0;
			return;
		}
		if (exclusionPolicy == "exams") {
			exclusionValue--;
			exam.excludedCredits = exam.credits;
		}
		if (exclusionPolicy == "credits") {
			let excludedCredits = Math.min(exclusionValue, exam.credits);
			exclusionValue -= excludedCredits;
			exam.excludedCredits = excludedCredits;
		}
	});

	return exams;
}

function computeUserStats(exams, honorsValue) {
	let validCredits = 0;
	let excludedCredits = 0;
	let validExamsCount = 0;
	let excludedExamsCount = 0;
	let totalWeighted = 0;
	let totalArithmetic = 0;
	let totalAlmaLaurea = 0;

	let gradeDistribution = {};
	for (let i = 18; i <= 31; i++) { gradeDistribution[i] = 0; }

	exams.forEach(exam => {
		excludedCredits += exam.excludedCredits;
		let examValidCredits = exam.credits - exam.excludedCredits;
		if (examValidCredits <= 0) {
			excludedExamsCount++;
			return;
		}
		validExamsCount++;
		validCredits += examValidCredits;

		let examGrade = exam.grade === 31 ? honorsValue : exam.grade;
		totalArithmetic += examGrade;
		totalWeighted += examGrade * examValidCredits;
		totalAlmaLaurea += examGrade > 30 ? 30 : examGrade;
		
		gradeDistribution[exam.grade]++;
	});

	const weightedAverageRaw = validCredits > 0 ? (totalWeighted / validCredits) : 0;
	const arithmeticAverageRaw = validExamsCount > 0 ? (totalArithmetic / validExamsCount) : 0;
	const almaLaureaAverageRaw = validExamsCount > 0 ? (totalAlmaLaurea / validExamsCount) : 0;

	return {
		arithmeticAverage: arithmeticAverageRaw.toFixed(2),
		weightedAverage: weightedAverageRaw.toFixed(2),
		almaLaureaAverage: almaLaureaAverageRaw.toFixed(2),
		validCredits,
		excludedCredits,
		validExamsCount,
		excludedExamsCount,
		gradeDistribution
	};
}

/**
 * Returns a sorted list of exams that are checked and match the slected academic year
 */ 
function filterExamsByAcademicYear(exams, academicYear) {
    const filteredExams = exams.filter(exam => {
        if (!exam.checkbox.checked) { return false; }
        if (academicYear === "all") { return true; }
        return dateToAcademicYear(exam.date) === academicYear;
    });
    return filteredExams.sort((a, b) => a.date - b.date);
}

function predictFinalGradeWith95PI(almaLaureaAverage) {
	// [ y = x^2 * a + x * b + c ] (Quadratic model)
	const a = -0.27050574;
    const b = 17.42744807;
    const c = -166.18817266;
	let x = almaLaureaAverage;
    let y = x*x * a + x * b + c;

	// [ prediction interval = z-quantile * standard error of the prediction ]
	// The standard errors are approximated for integer values of the prediction variable x
	//  (i didn't have time to implement the precise formula, approximated values are fine)
	const standardErrors = [4.028666215623055, 3.3386414826098014, 2.77486491572064, 2.344159539859904, 2.047313529760881, 1.8716019067649696, 1.7881642893469032, 1.7601429216805495, 1.7554935896873967, 1.7550205493971243, 1.7547579109517102, 1.766210287167336, 1.8154961601834838];
	// z-quantile for the 95% prediction interval (residuals are assumed to be normally distributed)
	const zQuantile = 1.9657953681092568;
    let predictionInterval = zQuantile * standardErrors[Math.round(x) - 18];

	// The model is trained on data aggregated by degree programs (the only available data i found), it would have
	//  been better if it was trained directly on (arithmetic average of a single graduate -> final grade) pairs
	return {
		value: y,
		predictionInterval
	};
}

function computeScatterData(exams, honorsValue) {	
	const scatterPoints = [];
	exams.forEach(exam => {
		if (isNaN(exam.grade)) { return; }
		scatterPoints.push({
			x: exam.date,
			y: exam.grade === 31 ? honorsValue : exam.grade,
			validCredits: exam.credits - exam.excludedCredits,
			name: exam.name,
			gradeText: exam.grade === 31 ? "30L" : exam.grade,
			creditsText: exam.excludedCredits === 0 ? exam.credits : exam.credits + " (" + exam.excludedCredits + " non conteggiati)"
		});
	});

    scatterPoints.sort((a, b) => a.x - b.x);

	const averageLines = [];
	let runningCredits = 0;
	let runningWeighted = 0;
	let runningTotal = 0;

	scatterPoints.forEach((point, index) => {
		runningCredits += point.validCredits;
		runningWeighted += point.y * point.validCredits;
		runningTotal += point.y;
		
		averageLines.push({
			x: point.x,
			weightedAverage: runningWeighted / runningCredits,
			arithmeticAverage: runningTotal / (index + 1)
		});
	});

	return {
		scatterPoints,
		averageLines
	};
}

function updateCreditsProgressBar(achievedCredits, totalCredits) {
	let precentage = Math.round(achievedCredits / totalCredits * 100);
	let creditsText = achievedCredits + "/" + totalCredits + " CFU";
	
	GUI.creditsProgressTextLeft.textContent = "";
	GUI.creditsProgressTextRight.textContent = "";
	GUI.creditsProgressTextLeftmost.textContent = "";
	GUI.creditsProgressTextRightmost.textContent = "";
	GUI.creditsProgressTextRight.style.position = "absolute";
	GUI.creditsProgress.style.width = precentage + "%";

	if (precentage < 15) {
		GUI.creditsProgressTextRight.textContent = precentage + " %";
		GUI.creditsProgressTextRight.style.position = "relative";
		GUI.creditsProgressTextRightmost.textContent = creditsText;
	}
	else if (precentage < 50) {
		GUI.creditsProgressTextLeft.textContent = precentage + " %";
		GUI.creditsProgressTextRightmost.textContent = creditsText;
	}
	else {
		GUI.creditsProgressTextLeft.textContent = precentage + " % ";
		GUI.creditsProgressTextLeftmost.textContent = creditsText;
	}
}

function updateGradeDistributionChart(gradeDistribution, honorsValue) {
	const ctx = GUI.gradeDistributionCanvas.getContext("2d");
	
	if (GUI.gradeDistributionChart) {
		GUI.gradeDistributionChart.destroy();
	}

	const labels = [];
	const distribution = [];
	const backgroundColors = [];

	for (let i = 18; i <= 30; i++) {
		labels.push(i.toString());
		distribution.push(gradeDistribution[i]);
		backgroundColors.push(computeExamColor(i));
	}

	if (honorsValue > 30) {
		labels.push("30L");
		distribution.push(gradeDistribution[31]);
		backgroundColors.push(computeExamColor(31));
	}
	else {
		distribution[distribution.length - 1] = gradeDistribution[31];
	}
	
	GUI.gradeDistributionChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: labels,
			datasets: [{
				data: distribution,
				backgroundColor: backgroundColors,
				borderColor: backgroundColors.map(computeBorderColor),
				borderWidth: 3
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					ticks: { stepSize: 1 }
				}
			},
			plugins: { legend: { display: false } }
		}
	});
}

function computeExamColor(grade) {
	if (grade > 30) { return "rgba(255, 215, 0, 0.5)"; }
	const intensity = (grade - 18) / 12;
	return `rgba(${255 - Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)}, 50, 0.5)`;
}

function computeBorderColor(examColor) {
	return examColor.replace("0.5", "1");	
}

function updateExamsChart(scatterData) {
    const ctx = GUI.examsCanvas.getContext("2d");
    
    if (GUI.examsChart) {
        GUI.examsChart.destroy();
    }

    const datasets = [
		// Scatter points
        {
            label: "Esami",
            data: scatterData.scatterPoints,
            type: "scatter",
            backgroundColor: (context) => computeExamColor(context.parsed.y),
    		borderColor: (context) => computeBorderColor(computeExamColor(context.parsed.y)),
            borderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8
        },
        // Weighted average line
        {
            label: "Media ponderata",
            data: scatterData.averageLines.map(point => ({
                x: point.x,
                y: point.weightedAverage
            })),
            type: "line",
            borderColor: "rgba(37, 99, 235, 1)",
            backgroundColor: "rgba(37, 99, 235, 0.5)",
            borderWidth: 3,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0
        },
        // Arithmetic average line
        {
            label: "Media aritmetica",
            data: scatterData.averageLines.map(point => ({
                x: point.x,
                y: point.arithmeticAverage
            })),
            type: "line",
            borderColor: "rgba(172, 38, 220, 1)",
            backgroundColor: "rgba(205, 38, 220, 0.5)",
            borderWidth: 3,
            fill: false,
            tension: 0.2,
            pointRadius: 0,
            pointHoverRadius: 0,
            borderDash: [5, 5]
        }
    ];
    
    // Add AlmaLaurea average line
    if (global.selectedAlmalaureaStats) {
        const averageGrade = global.selectedAlmalaureaStats.voto_esami_medio;
        const firstDate = scatterData.scatterPoints[0].x;
        const lastDate = scatterData.scatterPoints[scatterData.scatterPoints.length - 1].x;

        datasets.push({
            label: "Media AlmaLaurea",
            data: [
                { x: firstDate, y: averageGrade },
                { x: lastDate, y: averageGrade }
            ],
            type: "line",
            borderColor: "rgba(65, 65, 65, 1)",
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            borderDash: [5, 5]
        });
    }

    // Plugin to draw vertical lines at the beginning of each year
    const yearDividerPlugin = {
        id: "yearDivider",
        afterDatasetsDraw(chart) {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;

            // Get the start and end year from the chart's time scale
            const startYear = new Date(x.min).getFullYear();
            const endYear = new Date(x.max).getFullYear();

            ctx.save();
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;

            for (let year = startYear + 1; year <= endYear; year++) {
                // Get the pixel position for January 1st of the current year
                const lineDate = new Date(year, 0, 1);
                const xPos = x.getPixelForValue(lineDate.getTime());

                // Draw the line
                ctx.beginPath();
                ctx.moveTo(xPos, top);
                ctx.lineTo(xPos, bottom);
                ctx.stroke();
            }

            ctx.restore();
        }
    };

    GUI.examsChart = new Chart(ctx, {
        type: "scatter",
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: "point" },
            plugins: {
                tooltip: {
                    filter: function(tooltipItem) {
                        // Only show tooltip for scatter points (exam grades)
                        return tooltipItem.datasetIndex === 0;
                    },
                    callbacks: {
                        title: function(context) {
							const point = context[0].raw;
							return point.name || "";
                        },
                        label: function(context) {
							const point = context.raw;
							return [
								`Voto: ${point.gradeText}`,
								`CFU: ${point.creditsText}`,
								`Data: ${point.x.toLocaleDateString("it-IT")}`
							];
                        }
                    }
                },
                legend: {
                    display: true,
                    position: "top"
                }
            },
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "month",
                        displayFormats: { day: "dd/MM/yy" }
                    }
                },
                y: { ticks: { stepSize: 1 } }
            }
        },
        // Register the custom plugin with the chart instance
        plugins: [yearDividerPlugin]
    });
}
