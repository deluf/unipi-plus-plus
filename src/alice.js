"use strict";

// Constants
	// How the university identifies an honors grade (30 cum laude).
	// Must be "30L", this is a mandatory constraint
const HONORS_TEXT = "30L";
	// To operate with numerical grades only, HONORS_TEXT is represented as 31.
	// The actual value assigned to 30L might be different than that 
	//  (the user can set it in extensionSettings.honorsValue).
	// Must be 31 to ensure continuity with the other grades, otherwise things break.
	//  (For example, there are usually loops from 18 to 31 to include all grades)
const HONORS_GRADE = 31;
	// Must be 18 to ensure continuity with the other grades, otherwise things break
const MIN_GRADE = 18;
	// Limits the dynamic range of each color map to preserve visibility on a gray background
const COLOR_MAP_LIMITS = {
	interpolateMagma: { scale: 0.9, offset: 0 },
	interpolateViridis: { scale: 0.9, offset: 0 },
	interpolateCividis: { scale: 0.9, offset: 0 },
	interpolateCubehelixDefault: { scale: 0.8, offset: 0 },
	interpolateRdPu: { scale: 0.7, offset: 0.3 },
	interpolatePuBuGn: { scale: 0.7, offset: 0.3 },
	interpolateGreys: { scale: 0.7, offset: 0.3 }
};
const FORCED_REFRESH_THRESHOLD_SECONDS = 60;

// Global variables
const global = {
	selectedAlmalaureaStats: null,
	lastCompleteUserStats: null,
	extensionSettings: {},
	parsedExams: []
};

// GUI elements
const GUI = {
	// Exam table (element already present in the website)
	examTable: document.querySelector("#tableLibretto tbody"),

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
    almalaureaStatsBottomText: null,

	// Forecast
	forecastTable: null,
	forecastCreditsSelect: null
};

init();
async function init() {
	let uncheckedExams, lastForcedRefreshTimestamp, localStorage;
	try {
		localStorage = await chrome.storage.local.get("settings");
		global.extensionSettings = {
			...DEFAULT_SETTINGS,
			...localStorage.settings
		};

		localStorage = await chrome.storage.local.get("uncheckedExams");
		uncheckedExams = localStorage.uncheckedExams ? localStorage.uncheckedExams : [];

		localStorage = await chrome.storage.local.get("lastForcedRefreshTimestamp");
		lastForcedRefreshTimestamp = localStorage.lastForcedRefreshTimestamp ? 
			localStorage.lastForcedRefreshTimestamp : 0; // Jan 1, 1970, 00:00:00 UTC
	}
	catch {
		global.extensionSettings = DEFAULT_SETTINGS;
		uncheckedExams = []
	}

	try {
		drawLayout();
	} catch (err) {
		console.log(err.message);
		return; // Stop the execution
	}

	/**
	 * It looks like that the exams table is either dinamically loaded or has something to do with caching.
	 * When the cache is disabled in the developer tools, the exams table is NOT available in the DOM until a few
	 *  hundrer milliseconds, after which only the first page of exams is loaded (fine for every degree program
	 *  except 5-year ones, where exams are most likely >= 30).
	 * Otherwise, the exams table is immediately available in the DOM and always contains all exams.
	 * 
	 * 	We therefore adopt this strategy:
	 * Aggressively fetch the exams table as soon as the website loads. If it is empty then reload the page
	 *  to force caching. On the next reload, the exams table should be fully and immediately available in the DOM.
	 * If, for any reason, this does not happen, the page does not reload a second time thanks to the saved timestamp.
	 */
	let rows = document.querySelectorAll("#tableLibretto tbody tr");
	global.parsedExams = parseExams(rows, uncheckedExams);

	const nowTimestamp = new Date().getTime();
	const secondsSinceLastForcedRefresh = (nowTimestamp - lastForcedRefreshTimestamp) / 1000;
	if (global.parsedExams.length === 0 && secondsSinceLastForcedRefresh > FORCED_REFRESH_THRESHOLD_SECONDS) {
		await chrome.storage.local.set({ lastForcedRefreshTimestamp: nowTimestamp });
		location.reload(); 
		return;
	};

	if (global.parsedExams.length === 0) {
		console.log("[init()] Even after a forced reload, the exams table is still empty")
		// Continue anyway, only the visible exams will be considered once loaded - this is still fine for 90% of users
	}

	updateGUI();

	// If the user changes any option in the extension's popup, update the GUI
	chrome.storage.onChanged.addListener((changes, areaName) => {
		if (areaName === "local" && changes.settings) {
			global.extensionSettings = changes.settings.newValue;
			updateGUI();
		}
	});

	/**
	 * Every time the exam table changes (i.e., it loads for the first time or it is distributed 
	 *  on more pages and the user changes the page) the front-end framework used by the website
	 *  MIGHT reset the checkboxes (for unknown reasons to mankind). IF necessary, this function
	 *  re-adds them.
	 */
	new MutationObserver(() => { onExamTableRefresh(uncheckedExams) }).observe(
		GUI.examTable,
		{ childList: true /* watch for added/removed/modified children (rows) */ }
	)
}

function onExamTableRefresh(uncheckedExams) {
	const visibleRows = Array.from(GUI.examTable.rows);
	if (visibleRows.length === 0) { return; }
	if (visibleRows.some(row => row.querySelector("input[type=checkbox].upp-checkbox") != null)) { return; }

	insertCheckboxes(visibleRows, uncheckedExams);
	const visibleExams = parseExams(visibleRows, uncheckedExams);

	if (global.parsedExams.length === 0) {
		global.parsedExams = visibleExams;
		updateGUI();
		return;
	}
	
	for (const visibleExam of visibleExams) {
		// Find if the visible exam has already been parsed
		const existingExamMatched = global.parsedExams.find(existingExam => existingExam.name === visibleExam.name);
		// If yes, just update its checkbox
		if (existingExamMatched) { existingExamMatched.checkbox = visibleExam.checkbox; }
		// If not, add it to the list
		else { global.parsedExams.push(visibleExam); }
	}
	updateGUI();
}

function insertCheckboxes(rows, uncheckedExams) {
	rows.forEach(row => {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "includeInAverage";
		checkbox.className = "upp-checkbox";
		checkbox.checked = false;
		
		// Insert the checkbox left to the exam name
		row.firstElementChild.insertBefore(checkbox, row.firstElementChild.firstElementChild)

		const examName = extractExamName(row);
		checkbox.addEventListener("change", () => {
			if (!global.parsedExams.some(exam => 
				(exam.checkbox.checked === true) && !isNaN(exam.grade)
			)) { 
				alert("Devi selezionare almeno un esame");
				checkbox.checked = true;
				return;
			}
			if (!checkbox.checked && !uncheckedExams.includes(examName)) {
				uncheckedExams.push(examName);
			}
			else if (checkbox.checked && uncheckedExams.includes(examName)) {
        		uncheckedExams.splice(uncheckedExams.indexOf(examName), 1);
			}
			chrome.storage.local.set({ uncheckedExams: uncheckedExams });
			updateGUI();
		});
	});
}

function parseExams(rows, uncheckedExams) {
	let parsedExams = [];
	for (const row of rows) {
		const cells = row.querySelectorAll("td");
		
		let checkbox = row.querySelector("input[type=checkbox].upp-checkbox");
		// Create a dummy checkbox if none exists - it will (hopefully) be overwritten later anyway.
		// Why creating it if it will be overwritten? The updateGUI functions assumes that each exam
		//  is always assigned to a GUI checkbox (reads the checkbox.checked value)
		if (checkbox == null) {
			checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.checked = false;
		}

		/** Example of a row element
<tr>
  <td>
    <a ... >591AA - ANALISI I</a>		(name)
    <div>
      <a id="ad_piano" ...></a>		 (here there might be sovran or debito icons, in this case it's ad_piano)
    </div>
  </td>
  <td>...</td>						
  <td>12</td>					   		(credits)
  <td>...</td>		
  <td>...</td>
  <td>28&nbsp;-&nbsp;21/09/2022</td>	(grade and date - might be empty)
</tr>
		 */
		const creditsCellIndex = 2;
		const gradeAndDateCellIndex = 5;

		// Do not count the exam if it contains either:
		// - #sovran (attività sovrannumeraria) -> Extra activities
		// - #debito (debito formativo / OFA)	-> Knowledge you were supposed to have before starting the degree
		if (row.querySelector("#sovran") || row.querySelector("#debito")) {
			checkbox.disabled = true;
			continue;
		}

		// A mandatory exam has not been completed yet by the student
		if (!cells[gradeAndDateCellIndex].textContent.includes("-")) {
			checkbox.disabled = true;
			continue;
		}

		const name = extractExamName(row);
		const credits = parseInt(cells[creditsCellIndex].textContent, 10);

		// (e.g. "28 - 21/09/2022" -> 28, "21/09/2022")
		const grade_and_date = cells[gradeAndDateCellIndex].textContent.split("-").map(s => s.trim());
		const date = parseDateDDMMYY(grade_and_date[1])

		let grade = grade_and_date[0];
		let excludedCredits = 0;
		if (grade === HONORS_TEXT) { 
			grade = HONORS_GRADE; // Later it will be converted to the actual honors value
		} else if (isNaN(grade)) { 
			// The exam does not havea a grade, just a "passed")
			grade = NaN;
			checkbox.disabled = true;
			excludedCredits = credits; 
		} else { 
			grade = parseInt(grade, 10); 
		}
		
		if (uncheckedExams.includes(name)) {
			checkbox.checked = false;
		} else {
			checkbox.checked = true;
		}
		parsedExams.push({name, credits, excludedCredits, grade, date, checkbox});
	}
	return parsedExams;
}

/**
 * Removes the 5-letter exam code and " - "
 * (e.g, "075II - COMUNICAZIONI NUMERICHE" -> "COMUNICAZIONI NUMERICHE")
 */
function extractExamName(row) {
	const charactersToSkip = 8;
	return row.querySelector("td").textContent.slice(charactersToSkip).trim().replaceAll("\n", ""); 
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
	if (target == null) { throw new Error("[drawLayout] Career selection screen detected"); }
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

		// Secondary stats
	const secondaryStatsDiv = document.createElement("div");
	secondaryStatsDiv.style.gridRow = "1";
	secondaryStatsDiv.style.gridColumn = "2";
	mainDiv.appendChild(secondaryStatsDiv);

			// Secondary stats -> Title
	const secondaryStatsTitle = document.createElement("div");
	secondaryStatsTitle.className = "upp-horizontal-flexbox-even"
	secondaryStatsDiv.appendChild(secondaryStatsTitle);

				// Secondary stats -> Title -> AlmaLaurea
	const almalaureaTitle = document.createElement("h3");
	almalaureaTitle.textContent = "Statistiche medie ateneo";
	almalaureaTitle.className = "upp-secondary-title selected"
	secondaryStatsTitle.appendChild(almalaureaTitle);

				// Secondary stats -> Title -> Forecast
	const forecastTitle = document.createElement("h3");
	forecastTitle.textContent = "Previsioni";
	forecastTitle.className = "upp-secondary-title"
	secondaryStatsTitle.appendChild(forecastTitle);

			// Secondary stats -> Body
	const secondaryStatsBody = document.createElement("div");
	secondaryStatsBody.className = "upp-horizontal-flexbox-even"
	secondaryStatsDiv.appendChild(secondaryStatsBody);

				// Secondary stats -> Body -> AlmaLaurea
	const almalaureaStatsDiv = document.createElement("div");
	almalaureaStatsDiv.style.display = "block";
	almalaureaStatsDiv.style.width = "100%";
	secondaryStatsBody.appendChild(almalaureaStatsDiv);

					// Secondary stats -> Body -> AlmaLaurea -> Filters
	drawAlmalaureaFilters(almalaureaStatsDiv);

					// Secondary stats -> Body -> AlmaLaurea -> Most important stats
	const bigAlmalaureaStatsDiv = document.createElement("div");
	bigAlmalaureaStatsDiv.className = "upp-horizontal-flexbox-even";
	almalaureaStatsDiv.appendChild(bigAlmalaureaStatsDiv);

						// Secondary stats -> Body -> AlmaLaurea -> Most important stats -> Voto esami
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

						// Secondary stats -> Body -> AlmaLaurea -> Most important stats -> Voto finale
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

						// Secondary stats -> Body -> AlmaLaurea -> Most important stats -> Età alla laurea
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

						// Secondary stats -> Body -> AlmaLaurea -> Most important stats -> Durata studi
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

					// Secondary stats -> Body -> AlmaLaurea -> Bottom text
	GUI.almalaureaStatsBottomText = document.createElement("div");
	GUI.almalaureaStatsBottomText.className = "upp-horizontal-flexbox-center upp-info-text";
	GUI.almalaureaStatsBottomText.textContent = "Seleziona un corso di laurea per visualizzane le statistiche";
	almalaureaStatsDiv.appendChild(GUI.almalaureaStatsBottomText);

				// Secondary stats -> Body -> Forecast
	const forecastDiv = document.createElement("div");
	forecastDiv.style.width = "100%";
	forecastDiv.style.display = "none";
	secondaryStatsBody.appendChild(forecastDiv);

					// Secondary stats -> Body -> Forecast -> Credits
	const forecastCreditsDiv = document.createElement("div");
	forecastCreditsDiv.className = "upp-horizontal-flexbox-center";
	forecastCreditsDiv.style.marginBottom = ".75em";
	forecastDiv.appendChild(forecastCreditsDiv);

	const forecastCreditsText = document.createElement("span");
	forecastCreditsText.textContent = "Crediti del prossimo esame: ";
	forecastCreditsText.style.marginRight = ".5em";
	forecastCreditsDiv.appendChild(forecastCreditsText);
	
	GUI.forecastCreditsSelect = document.createElement("select");
	GUI.forecastCreditsSelect.style.textAlign = "center";
	GUI.forecastCreditsSelect.style.padding = "5px";
	forecastCreditsDiv.appendChild(GUI.forecastCreditsSelect);

	const preferredCredits = [3, 6, 9, 12, 15];
	preferredCredits.forEach(val => {
		const option = document.createElement("option");
		option.value = val;
		option.textContent = val;
		if (val === 9) { option.selected = true; }
		GUI.forecastCreditsSelect.appendChild(option);
	});

	const separator = document.createElement("option");
	separator.disabled = true;
	separator.textContent = "─";
	GUI.forecastCreditsSelect.appendChild(separator);

	const maxCreditsAllowedInForecast = 30; // Purely stylistical choice
	for (let i = 1; i <= maxCreditsAllowedInForecast; i++) {
		if (!preferredCredits.includes(i)) {
			const option = document.createElement("option");
			option.value = i;
			option.textContent = i;
			GUI.forecastCreditsSelect.appendChild(option);
		}
	}

					// Secondary stats -> Body -> Forecast -> Table
	GUI.forecastTable = createEmptyForecastTable();
	forecastDiv.appendChild(GUI.forecastTable);

				// Secondary stats -> Forecast -> Event listeners
	almalaureaTitle.addEventListener("click", () => {
		if (almalaureaStatsDiv.style.display != "none") { return; }
		almalaureaStatsDiv.style.display = "block";
		forecastDiv.style.display = "none";
		forecastTitle.classList.toggle("selected");
		almalaureaTitle.classList.toggle("selected");
	});

	forecastTitle.addEventListener("click", () => {
		if (forecastDiv.style.display != "none") { return; }
		almalaureaStatsDiv.style.display = "none";
		forecastDiv.style.display = "block";
		forecastTitle.classList.toggle("selected");
		almalaureaTitle.classList.toggle("selected");
	});

	GUI.forecastCreditsSelect.addEventListener("change", updateForecastTable);

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

    const corstipoItems = [...new Set(ALMALAUREA_DATA.map(d => d.corstipo))];
    populateSelect(corstipoSelect, corstipoItems, "un tipo di corso");

    corstipoSelect.addEventListener("change", () => {
		const selectedCorstipo = corstipoSelect.value;
		facoltaSelect.innerHTML = "";
		postcorsoSelect.innerHTML = "";
		clearAlmalaureaStats();
		if (selectedCorstipo == "") { return; }

        const filteredAlmaLaureaData = ALMALAUREA_DATA.filter(d => d.corstipo === selectedCorstipo);
        const facoltaItems = [...new Set(filteredAlmaLaureaData.map(d => d.facolta))];
        populateSelect(facoltaSelect, facoltaItems, "una facoltà / dipartimento");
    });

    facoltaSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
		clearAlmalaureaStats();
		postcorsoSelect.innerHTML = "";
		if (selectedFacolta == "") { return; }

        const filteredAlmaLaureaData = ALMALAUREA_DATA.filter(d => d.corstipo === selectedCorstipo && d.facolta === selectedFacolta);
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
        
        global.selectedAlmalaureaStats = ALMALAUREA_DATA.find(d => 
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
		GUI.almalaureaStatsBottomText.textContent = "Statistiche basate su " + stats.numero_laureati + " laureati nel 2024 (AlmaLaurea)";
		updateGUI(); // Re-draw the new average line
	}
}

function createEmptyForecastTable() {
	const table = document.createElement("table");
	table.className = "upp-forecast-table";

	function createRow(values) {
		const tr = document.createElement("tr");
		if (values.length === 1) {
			const td = document.createElement("td");
			td.textContent = values[0];
			td.colSpan = 14;
			td.className = "upp-forecast-table-header";
			tr.appendChild(td);
		}
		else {
			values.forEach(val => {
				const td = document.createElement("td");
				td.textContent = val;
				td.style.border = "1px solid #969696";
				tr.appendChild(td);
			});
		}
		return tr;
	}

	const grades = [
		...Array.from({ length: HONORS_GRADE - MIN_GRADE }, (_, i) => String(MIN_GRADE + i)), // [18, 30]
		HONORS_TEXT	// Add 30L
	];

	table.appendChild(createRow(grades));
	table.appendChild(createRow(["Media ponderata"]));
	table.appendChild(createRow(grades.map(() => "-")));
	table.appendChild(createRow(grades.map(() => "-")));
	table.appendChild(createRow(["Media aritmetica"]));
	table.appendChild(createRow(grades.map(() => "-")));
	table.appendChild(createRow(grades.map(() => "-")));

	return table;
}

function updateForecastTable() {
	const table = GUI.forecastTable;
	const examCredits = parseInt(GUI.forecastCreditsSelect.value);
	const stats = global.lastCompleteUserStats;
	const honorsValue = global.extensionSettings.honorsValue;

	if (stats == null) { 
		console.log("[updateForecastTable] No available user stats");
		return;
	}

	const gradeRowIndex = 0;
	const weightedAverageRowIndex = 2;
	const weightedAverageOffsetRowIndex = 3;
	const arithmeticdAverageRowIndex = 5;
	const arithmeticdAverageOffsetRowIndex = 6;

	const gradeRowColormapAlpha = 48; // [0, 255], 48 is light so black text stays visible
	const decimalPrecision = 2;

	for (let i = MIN_GRADE; i <= HONORS_GRADE; i++) {
		const grade = i < HONORS_GRADE ? i : honorsValue;
		const cellIndex = i - MIN_GRADE; 
		
		const newWeightedAverage = 
			(stats.weightedAverage * (stats.validCredits + stats.excludedCredits) + grade * examCredits) /
			(examCredits + stats.validCredits + stats.excludedCredits);
		const weightedAverageOffset = newWeightedAverage - stats.weightedAverage;

		const newArithmeticAverage = 
			(stats.arithmeticAverage * stats.validExamsCount + grade) / 
			(stats.validExamsCount + 1);
		const arithmeticAverageOffset = newArithmeticAverage - stats.arithmeticAverage;
		
		table.rows[gradeRowIndex].cells[cellIndex].style.backgroundColor = computeExamColor(i, gradeRowColormapAlpha);
		
		table.rows[weightedAverageRowIndex].cells[cellIndex].textContent = newWeightedAverage.toFixed(decimalPrecision);
		table.rows[weightedAverageOffsetRowIndex].cells[cellIndex].textContent = weightedAverageOffset.toFixed(decimalPrecision);
		table.rows[weightedAverageOffsetRowIndex].cells[cellIndex].style.color = weightedAverageOffset < 0 ? "red" : "green";

		table.rows[arithmeticdAverageRowIndex].cells[cellIndex].textContent = newArithmeticAverage.toFixed(decimalPrecision);
		table.rows[arithmeticdAverageOffsetRowIndex].cells[cellIndex].textContent = arithmeticAverageOffset.toFixed(decimalPrecision);
		table.rows[arithmeticdAverageOffsetRowIndex].cells[cellIndex].style.color = arithmeticAverageOffset < 0 ? "red" : "green";
	}
}

function updateGUI() {
	if (global.parsedExams.length === 0) { 
		console.log("[updateGUI]: Ignoring requested GUI update - Empty exams list");
		return; 
	}
	
	const selectedExams = global.parsedExams.filter(exam => exam.checkbox.checked === true);
	const gradedSelectedExams = selectedExams.filter(exam => !isNaN(exam.grade));
	const selectedAcademicYear = updateAcademicYearFilter(gradedSelectedExams);
	
	const selectedExamsWithAdjustedCredits = computeExcludedCredits(
		selectedExams,
		global.extensionSettings.exclusionPolicy,
		global.extensionSettings.exclusionValue
	)

	if (!selectedExamsWithAdjustedCredits.some(
		exam => !isNaN(exam.grade) && (exam.credits - exam.excludedCredits > 0)
	)) { 
		alert("Non è presente alcun esame valido. Rivedi i criteri di esclusione nelle imposazioni dell'estensione")
		resetGUI();
		return; 
	}

	let exams = selectedExamsWithAdjustedCredits;
	let userStats = computeUserStats(	
		selectedExamsWithAdjustedCredits,
		global.extensionSettings.honorsValue,
		global.extensionSettings.exclusionPolicy,
		global.extensionSettings.exclusionValue
	); 
	global.lastCompleteUserStats = userStats;

	if (selectedAcademicYear !== "all") {
		exams = filterExamsByAcademicYear(exams, selectedAcademicYear);
		// There are no valid exams in the selected academic year, only update the scatter chart (with empty dots)
		if (!exams.some(exam => !isNaN(exam.grade) && (exam.credits - exam.excludedCredits > 0))) { 
			resetGUI();
			const scatterData = computeScatterData(exams, global.extensionSettings.honorsValue);
			updateExamsChart(scatterData, global.selectedAlmalaureaStats);
			return; 
		}
		userStats = computeUserStats(
			exams,
			global.extensionSettings.honorsValue,
			global.extensionSettings.exclusionPolicy,
			global.extensionSettings.exclusionValue
		);
	}

	const finalGradePrediction = predictFinalGradeWith95PI(userStats.almaLaureaAverage);
	const scatterData = computeScatterData(exams, global.extensionSettings.honorsValue);

	const decimalPrecision = 2;
	GUI.arithmeticAverageValue.textContent = userStats.arithmeticAverage.toFixed(decimalPrecision);
	GUI.weightedAverageValue.textContent = userStats.weightedAverage.toFixed(decimalPrecision);
	GUI.finalGradePredictionValue.textContent = finalGradePrediction.value >= 110.5 ?
		"110L" : Math.round(finalGradePrediction.value); // 110.5 is a purely stylistical threshold
	GUI.finalGradePredictionValuePI.textContent = "±" + Math.round(finalGradePrediction.predictionInterval);
	
	updateCreditsProgressBar(
		userStats.validCredits + userStats.excludedCredits,
		global.extensionSettings.programDuration
	);
	updateGradeDistributionChart(userStats.gradeDistribution, global.extensionSettings.honorsValue);
	updateExamsChart(scatterData, global.selectedAlmalaureaStats);
	updateForecastTable();
}

function resetGUI() {
	// User stats
	GUI.weightedAverageValue.textContent = "-";
	GUI.arithmeticAverageValue.textContent = "-";
	GUI.finalGradePredictionValue.textContent = "-";
	GUI.finalGradePredictionValuePI.textContent = "-";
	// Progress bar
	GUI.creditsProgressTextLeft.textContent = "";
	GUI.creditsProgressTextRight.textContent = "";
	GUI.creditsProgressTextLeftmost.textContent = "";
	GUI.creditsProgressTextRightmost.textContent = "";
	GUI.creditsProgressTextRight.style.position = "absolute";
	GUI.creditsProgress.style.width = "0%";
	// Charts
	if (GUI.gradeDistributionChart) { GUI.gradeDistributionChart.destroy(); }
    if (GUI.examsChart) { GUI.examsChart.destroy(); }
}

function updateAcademicYearFilter(gradedSelectedExams) {
	const academicYears = [...new Set(
		gradedSelectedExams.map(exam => dateToAcademicYear(exam.date))
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
	const october = 9; // Months are 0-indexed in JS
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const startYear = month >= october ? year : year - 1;
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
	for (let i = MIN_GRADE; i <= HONORS_GRADE; i++) { gradeDistribution[i] = 0; }

	exams.forEach(exam => {
		excludedCredits += exam.excludedCredits;
		let examValidCredits = exam.credits - exam.excludedCredits;
		if (examValidCredits <= 0) {
			excludedExamsCount++;
			return;
		}
		validExamsCount++;
		validCredits += examValidCredits;

		let examGrade = exam.grade === HONORS_GRADE ? honorsValue : exam.grade;
		totalArithmetic += examGrade;
		totalWeighted += examGrade * examValidCredits;
		// AlmaLaurea caps the grade at 30
		totalAlmaLaurea += exam.grade === HONORS_GRADE ? 30 : exam.grade;
		
		gradeDistribution[exam.grade]++;
	});

	return {
		arithmeticAverage: totalArithmetic / validExamsCount,
		weightedAverage: totalWeighted / validCredits,
		almaLaureaAverage: totalAlmaLaurea / validExamsCount,
		validCredits,
		excludedCredits,
		validExamsCount,
		excludedExamsCount,
		gradeDistribution
	};
}

function filterExamsByAcademicYear(exams, academicYear) {
    const filteredExams = exams.filter(exam => {
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
	let x = almaLaureaAverage; // 18 to 30, by design
    let y = x*x * a + x * b + c;

	// [ prediction interval = z-quantile * standard error of the prediction ]
	// The standard errors are approximated for integer values of the prediction variable x
	//  (i didn't have time to implement the precise formula, approximated values are fine)
	const standardErrors = [4.028666215623055, 3.3386414826098014, 2.77486491572064, 2.344159539859904, 2.047313529760881, 1.8716019067649696, 1.7881642893469032, 1.7601429216805495, 1.7554935896873967, 1.7550205493971243, 1.7547579109517102, 1.766210287167336, 1.8154961601834838];
	// z-quantile for the 95% prediction interval (residuals are assumed to be normally distributed)
	const zQuantile = 1.9657953681092568;
    let predictionInterval = zQuantile * standardErrors[Math.round(x) - MIN_GRADE];

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
			// Coordinates
			x: exam.date,
			y: exam.grade === HONORS_GRADE ? honorsValue : exam.grade,
			// Running average and color computations
			originalGrade: exam.grade,
			validCredits: exam.credits - exam.excludedCredits,
			excludedCredits: exam.excludedCredits,
			// Tooltip display values
			name: exam.name,
			gradeText: exam.grade === HONORS_GRADE ? HONORS_TEXT : exam.grade,
			creditsText: exam.excludedCredits === 0 ? exam.credits : exam.credits + " (" + exam.excludedCredits + " non conteggiati)"
		});
	});

    scatterPoints.sort((a, b) => a.x - b.x);

	const averageLines = [];
	let runningCredits = 0;
	let runningWeighted = 0;
	let runningTotal = 0;
	let runningExams = 0;

	scatterPoints.forEach((point) => {
		if (point.validCredits === 0) { return; }
		runningCredits += point.validCredits;
		runningWeighted += point.y * point.validCredits;
		runningTotal += point.y;
		runningExams++;
		
		averageLines.push({
			x: point.x,
			weightedAverage: runningWeighted / runningCredits,
			arithmeticAverage: runningTotal / runningExams
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

	if (precentage < 20) { // Progress bar too little to contain text
		GUI.creditsProgressTextRight.textContent = precentage + " %";
		GUI.creditsProgressTextRight.style.position = "relative";
		GUI.creditsProgressTextRightmost.textContent = creditsText;
	}
	else if (precentage < 50) { // Progress bar big enough to contain the percentage text
		GUI.creditsProgressTextLeft.textContent = precentage + " %";
		GUI.creditsProgressTextRightmost.textContent = creditsText;
	}
	else { // Progress bar too big to read the credits on the far right, move them to the far left
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
	const borderColors = [];

	for (let i = MIN_GRADE; i < HONORS_GRADE; i++) {
		labels.push(i.toString());
		distribution.push(gradeDistribution[i]);
		backgroundColors.push(computeExamBackgroundColor(i));
		borderColors.push(computeExamBorderColor(i));
	}

	if (honorsValue > 30) {
		labels.push(HONORS_TEXT);
		distribution.push(gradeDistribution[HONORS_GRADE]);
		backgroundColors.push(computeExamBackgroundColor(HONORS_GRADE));
		borderColors.push(computeExamBorderColor(HONORS_GRADE));
	}
	else {
		distribution[distribution.length - 1] += gradeDistribution[HONORS_GRADE];
	}
	
	GUI.gradeDistributionChart = new Chart(ctx, {
		type: "bar",
		data: {
			labels: labels,
			datasets: [{
				data: distribution,
				backgroundColor: backgroundColors,
				borderColor: borderColors,
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

function computeExamBackgroundColor(grade, excludedCredits = 0) {
	const alpha = excludedCredits > 0 ? 0 : 128;
	return computeExamColor(grade, alpha);
}

function computeExamBorderColor(grade) {
	const alpha = 255;
	return computeExamColor(grade, alpha);
}

/**
 * Computes the hex value of the color associated with the specified grade and alpha
 * - The grade must be in the range [18, 31]
 * - Alpha must be in the range [0, 255]
 */
function computeExamColor(grade, alpha) {
	const gradeNormalized = (grade - MIN_GRADE) / (HONORS_GRADE - MIN_GRADE);
	const limits = COLOR_MAP_LIMITS[global.extensionSettings.colorMap];
	const tone = gradeNormalized * limits.scale + limits.offset;
	const color = d3[global.extensionSettings.colorMap](tone);
	if (color.length === 7) {
		// Color was returned in hex format
		return color + alpha.toString(16).padStart(2, "0");
	} else {
		// Color was returned in RGB format
		return color.replace(")", ", " + (alpha/255).toFixed(1) + ")");
	}
}

function updateExamsChart(scatterData, almaLaureaStats) {
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
            backgroundColor: (context) => computeExamBackgroundColor(
				context.raw.originalGrade, context.raw.excludedCredits),
    		borderColor: (context) => computeExamBorderColor(context.raw.originalGrade),
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
    if (almaLaureaStats) {
        const averageGrade = almaLaureaStats.voto_esami_medio;
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
							if (!context[0]) { return; }
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
