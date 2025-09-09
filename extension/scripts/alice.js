
"use strict";

setTimeout(init, 3000);

/**
 * rivedi il codice
 * 
 * aggiorna il dropdown degli anni se tolgo esami
 * timeout di 3s è unreliable asf
 * non aggiornare ogni volta che cambio dal dropdown almalaurea (almeno i due selettivi sopra)
 * sconta voto + basso / cfu + bassi
 * non collassare tutto se le stats almalaurea sono null ma rimetti -
 * 
 * 		
 * schermata impostazioni
 * 		fixare la percentuale di completamento, default 180 o 300 e poi 60 all'anno
 * persistenza dei dati (magari divisi per matricola sarebbe top)
 * layout responsive
 * schermata previsione
 * * */

let selectedAlmalaureaProfile = null;

let settings = readSettings();


// Config
const HONORS_VALUE = 33;

let suitableECTS = 0; // ECTS that contribute to the total but without an associated grade
let exams = [];
let distributionChart = null;
let timeChart = null;

let ECTSprogress = null;
let ECTSprogressTextLeft = null;
let ECTSprogressTextRight = null;
let ECTSprogressTextLeftmost = null;
let ECTSprogressTextRightmost = null;

let weightedAverageValue = null;
let averageValue = null;
let gradePredictionValue = null;
let gradePredictionValueCI = null;

let almalaureaVotoEsamiValue = null;
let almalaureaVotoFinaleValue = null;
let almalaureaEtaAllaLaureaValue = null;
let almalaureaDurataStudiValue = null;

let histogramCanvas = null;
let timeSeriesCanvas = null;

// --- Start of New Code ---
let almalaureaStatsText = null; 
// --- End of New Code ---

async function init() {
	const table = document.querySelector("#tableLibretto");
	const tbody = table.querySelector("tbody");
	const rows = tbody.querySelectorAll("tr");

	insertCheckboxes(rows);
	parseExams(rows);
	drawLayout();
	updateMetrics();

	// Add listeners to the checkboxes
	tbody.querySelectorAll(`input[type=checkbox].upp-checkbox`).forEach(cb => {
		cb.addEventListener("change", () => {
			updateMetrics();
		});
	});
}


function insertCheckboxes(rows) {
	rows.forEach(row => {
		const checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = "includeInMetrics";
		checkbox.className = "upp-checkbox";
		checkbox.style.marginRight = "10px";
		checkbox.style.width = "16px";
		checkbox.style.height = "16px";
		checkbox.style.cursor = "pointer";

		// False by default
		checkbox.checked = false;

		// Insert the checkbox left to the exam name
		row.firstElementChild.insertBefore(checkbox, row.firstElementChild.firstElementChild)
	});
}

function parseExams(rows) {
	for (let row of rows) {
		try {
			let cells = row.querySelectorAll("td");
			let checkbox = cells[0].querySelector("input[type=checkbox].upp-checkbox");

			// Removes the 5-letter exam code and " - " 
			//  (e.g, "075II - COMUNICAZIONI NUMERICHE" -> "COMUNICAZIONI NUMERICHE")
			let exam = cells[0].textContent.slice(8).replace("\n", "").trim(); 

			let ects = parseInt(cells[2].textContent, 10);

			// (e.g. "28 - 21/09/2022" -> 28, "21/09/2022")
			if (!cells[5].textContent.includes("-")) {
				checkbox.disabled = true;
				continue;
			}
			let grade_and_date = cells[5].textContent.split("-").map(s => s.trim());
			let grade = grade_and_date[0].includes("L") ? HONORS_VALUE : parseInt(grade_and_date[0], 10); 
			let date = parseDateDDMMYY(grade_and_date[1])
				
			// The grade can be NaN if grade_and_date[0] = "IDO" (a.k.a. "suitable")
			if (isNaN(grade)) {
				if (row.querySelector("#sovran") || row.querySelector("#debito")) {
					checkbox.disabled = true; // Do not let the user select these kind of exams without a grade
				}
				else {
					suitableECTS += ects
					checkbox.checked = true;
					checkbox.disabled = true; // Do not let the user select these kind of exams without a grade
				}
				continue;
			}
		
			if (exam.length <= 0 || isNaN(ects) || ects <= 0 || grade < 18) {
				console.error("Unable to parse row:")
				console.error(row)
				console.error({exam, ects, grade, date})
				checkbox.disabled = true;
				continue;
			}

			// Do not count the exam if it contains either:
			// - #sovran (attività sovrannumeraria) -> Extra activities
			// - #debito (debito formativo / OFA)	-> Knowledge you were supposed to have before starting the degree
			if (row.querySelector("#sovran") || row.querySelector("#debito")) {
				continue;
			}
	
			let gradetmp = Math.round(Math.random() * 14 + 18)
			grade = gradetmp > 30 ? HONORS_VALUE : gradetmp;

			checkbox.checked = true;
			exams.push({exam, ects, grade, date, checkbox});
		}
		catch(error) {
			console.error(error);
			continue; 
		}
	}
}

// Parses DD/MM/YY strings into a JS Date object
function parseDateDDMMYY(date_string) {
	const parts = date_string.split('/');
	const day = parseInt(parts[0], 10);
	const month = parseInt(parts[1], 10) - 1; // Months are 0-based in JS
	const year = parseInt(parts[2], 10);
	return new Date(year, month, day);
}

// Helper to determine the academic year for a given date
// An academic year runs from October 1st to September 31st
function getAcademicYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed (October is 9)
    const startYear = month >= 9 ? year : year - 1;
    return `${startYear}/${startYear + 1}`;
}


function drawLayout() {

	// Draw the main display box below #libretto-inlineForms
	const target = document.getElementById("libretto-inlineForms");
	let mainDiv = document.createElement("div");
	mainDiv.className = "upp-main-container";
	target.insertAdjacentElement("afterend", mainDiv);

		// User stats
	let userStatsDiv = document.createElement("div");
	userStatsDiv.style.gridColumn = "1";
	userStatsDiv.style.gridRow = "1";
	mainDiv.appendChild(userStatsDiv);
	
			// User stats -> Title
	let userStatsTitleDiv = document.createElement("div");
	userStatsTitleDiv.className = "upp-horizontal-flexbox-center"
	userStatsTitleDiv.style.gap = "1em";
	userStatsTitleDiv.style.marginBottom = "1em";
	userStatsDiv.appendChild(userStatsTitleDiv);

	let userStatsTitle = document.createElement("h3");
	userStatsTitle.textContent = "Le tue statistiche";
	userStatsTitle.style.margin = "0";
	userStatsTitleDiv.appendChild(userStatsTitle);
	
			// User stats -> Academic Year Filter
    const academicYears = [...new Set(exams.map(exam => getAcademicYear(exam.date)))].sort();
    
    let filterSelect = document.createElement("select");
    filterSelect.id = "year-filter";
    filterSelect.style.padding = "5px";

    let allOption = document.createElement("option");
    allOption.value = "all";
    allOption.textContent = "Tutti gli anni";
    filterSelect.appendChild(allOption);

    academicYears.forEach(year => {
        let option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        filterSelect.appendChild(option);
    });
    
    filterSelect.addEventListener("change", updateMetrics);
    userStatsTitleDiv.appendChild(filterSelect);
	
			// User stats -> Most important stats
	let bigStatsDiv = document.createElement("div");
	bigStatsDiv.className = "upp-horizontal-flexbox-even";
	userStatsDiv.appendChild(bigStatsDiv);

				// User stats -> Most important stats -> Weighted average
	let weightedAverageDiv = document.createElement("div");
	weightedAverageDiv.className = "upp-vertical-flexbox-center";
	let weightedAverageLabel = document.createElement("span");
	weightedAverageLabel.textContent = "Media ponderata";
	weightedAverageDiv.appendChild(weightedAverageLabel);
	weightedAverageValue = document.createElement("span");
	weightedAverageValue.textContent = "-";
	weightedAverageValue.className = "upp-statistic-big";
	
	weightedAverageDiv.appendChild(weightedAverageValue);
	bigStatsDiv.appendChild(weightedAverageDiv);

				// User stats -> Most important stats -> average
	let averageDiv = document.createElement("div");
	averageDiv.className = "upp-vertical-flexbox-center";
	let averageLabel = document.createElement("span");
	averageLabel.textContent = "Media aritmetica";
	averageDiv.appendChild(averageLabel);
	averageValue = document.createElement("span");
	averageValue.textContent = "-";
	averageValue.className = "upp-statistic-big";
	averageDiv.appendChild(averageValue);
	bigStatsDiv.appendChild(averageDiv);

				// User stats -> Most important stats -> Predicted final grade
	let gradePredictionDiv = document.createElement("div");
	gradePredictionDiv.className = "upp-vertical-flexbox-center";
	let gradePredictionLabel = document.createElement("span");
	gradePredictionLabel.textContent = "Voto previsto";
	addTooltip(gradePredictionLabel, "Il voto di laurea viene stimato confrontando la tua media aritmetica con quella dei laureati tra il 2022 ed il 2024 in tutto l'ateneo.\nÈ possibile affermare con il 95% di sicurezza che il tuo vero voto di laurea ricadrà nel range indicato dal ±");
	gradePredictionDiv.appendChild(gradePredictionLabel);
	let gradePredictionValueDiv = document.createElement("div");
	gradePredictionValueDiv.className = "upp-horizontal-flexbox-center";
	gradePredictionValue = document.createElement("span");
	gradePredictionValue.textContent = "-";
	gradePredictionValue.className = "upp-statistic-big";
	gradePredictionValueCI = document.createElement("span");
	gradePredictionValueCI.textContent = "-";
	gradePredictionValueCI.style.letterSpacing = "0.1em";
	gradePredictionValueCI.style.marginLeft = "0.1em";
	gradePredictionValueCI.style.marginBottom = "0.1em";
	gradePredictionValueDiv.appendChild(gradePredictionValue);
	gradePredictionValueDiv.appendChild(gradePredictionValueCI);
	gradePredictionDiv.appendChild(gradePredictionValueDiv);
	bigStatsDiv.appendChild(gradePredictionDiv);

			// User stats -> Progress bar
	let ECTSprogressBarDiv = document.createElement("div");
	ECTSprogressBarDiv.className = "upp-progress-bar-container";
	userStatsDiv.appendChild(ECTSprogressBarDiv);
	
	ECTSprogress = document.createElement("div");
	ECTSprogress.className = "upp-progress-bar";
	ECTSprogressBarDiv.appendChild(ECTSprogress);
	
	ECTSprogressTextLeft = document.createElement("div");
	ECTSprogressTextLeft.className = "upp-progress-bar-text";
	ECTSprogress.appendChild(ECTSprogressTextLeft);

	ECTSprogressTextRight = document.createElement("div");
	ECTSprogressTextRight.className = "upp-progress-bar-text";
	ECTSprogressTextRight.style.color = "#000000";
	ECTSprogressBarDiv.appendChild(ECTSprogressTextRight);

	ECTSprogressTextLeftmost = document.createElement("div");
	ECTSprogressTextLeftmost.className = "upp-progress-bar-text";
	ECTSprogressTextLeftmost.style.position = "absolute";
	ECTSprogressTextLeftmost.style.left = "0";
	ECTSprogressBarDiv.appendChild(ECTSprogressTextLeftmost);
	
	ECTSprogressTextRightmost = document.createElement("div");
	ECTSprogressTextRightmost.className = "upp-progress-bar-text";
	ECTSprogressTextRightmost.style.position = "absolute";
	ECTSprogressTextRightmost.style.right = "0";
	ECTSprogressTextRightmost.style.color = "#000000";
	ECTSprogressBarDiv.appendChild(ECTSprogressTextRightmost);

			// User stats -> Histogram canvas
	let histogramDiv = document.createElement("div");
	histogramDiv.className = "upp-histogram-canvas-container"
	histogramCanvas = document.createElement("canvas");
	histogramCanvas.id = "grades-histogram";
	histogramDiv.appendChild(histogramCanvas);
	userStatsDiv.appendChild(histogramDiv);
	
		// AlmaLaurea stats
	let almalaureaStatsDiv = document.createElement("div");
	almalaureaStatsDiv.style.gridRow = "1";
	almalaureaStatsDiv.style.gridColumn = "2";
	mainDiv.appendChild(almalaureaStatsDiv);
	
			// AlmaLaurea stats -> Title
	let almalaureaTitle = document.createElement("h3");
	almalaureaTitle.textContent = "Statistiche medie ateneo (AlmaLaurea)";
	almalaureaTitle.className = "upp-almalaurea-title upp-horizontal-flexbox-center"
	almalaureaStatsDiv.appendChild(almalaureaTitle);
	
			// AlmaLaurea stats -> Filters
	drawAlmalaureaFilters(almalaureaStatsDiv);

			// Almalaurea stats -> Most important stats
	let bigAlmalaureaStatsDiv = document.createElement("div");
	bigAlmalaureaStatsDiv.className = "upp-horizontal-flexbox-even";
	almalaureaStatsDiv.appendChild(bigAlmalaureaStatsDiv);

				// Almalaurea stats -> Most important stats -> Voto esami
	let almalaureaVotoEsamiDiv = document.createElement("div");
	almalaureaVotoEsamiDiv.className = "upp-vertical-flexbox-center";
	let almalaureaVotoEsamiLabel = document.createElement("span");
	almalaureaVotoEsamiLabel.textContent = "Voto esami";
	addTooltip(almalaureaVotoEsamiLabel, "AlmaLaurea calcola questo valore come la media aritmetica dei voti degli esami considerando 30L come 30. Per questo motivo, il valore è leggermente inferiore alla vera media aritmetica del corso selezionato");
	almalaureaVotoEsamiDiv.appendChild(almalaureaVotoEsamiLabel);
	almalaureaVotoEsamiValue = document.createElement("span");
	almalaureaVotoEsamiValue.textContent = "-";
	almalaureaVotoEsamiValue.className = "upp-statistic-big";
	almalaureaVotoEsamiDiv.appendChild(almalaureaVotoEsamiValue);
	bigAlmalaureaStatsDiv.appendChild(almalaureaVotoEsamiDiv);

				// Almalaurea stats -> Most important stats -> Voto finale
	let almalaureaVotoFinaleDiv = document.createElement("div");
	almalaureaVotoFinaleDiv.className = "upp-vertical-flexbox-center";
	let almalaureaVotoFinaleLabel = document.createElement("span");
	almalaureaVotoFinaleLabel.textContent = "Voto finale";
	addTooltip(almalaureaVotoFinaleLabel, "AlmaLaurea calcola questo valore considerando 110L come 113");
	almalaureaVotoFinaleDiv.appendChild(almalaureaVotoFinaleLabel);
	almalaureaVotoFinaleValue = document.createElement("span");
	almalaureaVotoFinaleValue.textContent = "-";
	almalaureaVotoFinaleValue.className = "upp-statistic-big";
	almalaureaVotoFinaleDiv.appendChild(almalaureaVotoFinaleValue);
	bigAlmalaureaStatsDiv.appendChild(almalaureaVotoFinaleDiv);

				// Almalaurea stats -> Most important stats -> Età alla laurea
	let almalaureaEtaAllaLaureaDiv = document.createElement("div");
	almalaureaEtaAllaLaureaDiv.className = "upp-vertical-flexbox-center";
	let almalaureaEtaAllaLaureaLabel = document.createElement("span");
	almalaureaEtaAllaLaureaLabel.textContent = "Età alla laurea";
	almalaureaEtaAllaLaureaDiv.appendChild(almalaureaEtaAllaLaureaLabel);
	almalaureaEtaAllaLaureaValue = document.createElement("span");
	almalaureaEtaAllaLaureaValue.textContent = "-";
	almalaureaEtaAllaLaureaValue.className = "upp-statistic-big";
	almalaureaEtaAllaLaureaDiv.appendChild(almalaureaEtaAllaLaureaValue);
	bigAlmalaureaStatsDiv.appendChild(almalaureaEtaAllaLaureaDiv);

				// Almalaurea stats -> Most important stats -> Durata studi
	let almalaureaDurataStudiDiv = document.createElement("div");
	almalaureaDurataStudiDiv.className = "upp-vertical-flexbox-center";
	let almalaureaDurataStudiLabel = document.createElement("span");
	almalaureaDurataStudiLabel.textContent = "Durata studi";
	almalaureaDurataStudiDiv.appendChild(almalaureaDurataStudiLabel);
	almalaureaDurataStudiValue = document.createElement("span");
	almalaureaDurataStudiValue.textContent = "-";
	almalaureaDurataStudiValue.className = "upp-statistic-big";
	almalaureaDurataStudiDiv.appendChild(almalaureaDurataStudiValue);
	bigAlmalaureaStatsDiv.appendChild(almalaureaDurataStudiDiv);

					// Almalaurea stats -> Bottom text
	almalaureaStatsText = document.createElement("div");
	almalaureaStatsText.className = "upp-horizontal-flexbox-center upp-info-text";
	almalaureaStatsText.textContent = "Seleziona un corso di laurea per visualizzane le statistiche";
	almalaureaStatsDiv.appendChild(almalaureaStatsText);

		// Time series chart
	let timeSeriesDiv = document.createElement("div");
	timeSeriesDiv.style.gridColumn = "1 / span 2";
	timeSeriesDiv.style.gridRow = "2";
	timeSeriesDiv.style.height = "300px";
	timeSeriesDiv.style.maxHeight = "300px";
	timeSeriesDiv.style.width = "100%";
	timeSeriesCanvas = document.createElement("canvas");
	timeSeriesCanvas.id = "time-series-chart";
	timeSeriesDiv.appendChild(timeSeriesCanvas);
	mainDiv.appendChild(timeSeriesDiv);
}

function addTooltip(element, text) {
	element.className = element.className + " upp-label-with-tooltip";
	
	let tooltip = document.createElement("div");
	tooltip.className = "upp-tooltip";
	tooltip.textContent = "?";
	element.appendChild(tooltip);

	let tooltipText = document.createElement("div");
	tooltipText.className = "upp-tooltip-text"
	tooltipText.textContent = text;
	tooltip.appendChild(tooltipText);
}

// --- Start of New Code ---
function drawAlmalaureaFilters(container) {
    if (almaLaureaData.length === 0) {
        container.innerHTML += "<p>Dati AlmaLaurea non disponibili.</p>";
        return;
    }

    const createSelect = (id, labelText) => {
        const div = document.createElement("div");
        div.style.marginBottom = "10px";
        
        const label = document.createElement("label");
        label.htmlFor = id;
        label.textContent = labelText;
        label.style.display = "block";
        label.style.marginBottom = ".1em";
        label.style.fontWeight = "normal";
        label.style.marginLeft = "1em";

        const select = document.createElement("select");
        select.id = id;
        select.style.width = "100%";
        select.style.padding = "5px";
        
        div.appendChild(label);
        div.appendChild(select);
        container.appendChild(div);
        return select;
    };

    const corstipoSelect = createSelect("almalaurea-corstipo", "Tipo di corso");
    const facoltaSelect = createSelect("almalaurea-facolta", "Facoltà / Dipartimento");
    const postcorsoSelect = createSelect("almalaurea-postcorso", "Corso di laurea");

    const populateDropdown = (select, items, placeholder) => {
        select.innerHTML = `<option value="">-- Seleziona ${placeholder} --</option>`;
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item;
            option.textContent = item;
            select.appendChild(option);
        });
    };

    // Initial population
    const corstipi = [...new Set(almaLaureaData.map(d => d.corstipo))];
    populateDropdown(corstipoSelect, corstipi, "un tipo di corso");

    // Event Listeners
    corstipoSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const filteredByCorso = almaLaureaData.filter(d => d.corstipo === selectedCorstipo);
        const facolta = [...new Set(filteredByCorso.map(d => d.facolta))];
        populateDropdown(facoltaSelect, facolta, "una facoltà");
        populateDropdown(postcorsoSelect, [], "un corso di laurea");
        clearAlmalaureaStats();
    });

    facoltaSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
        const filtered = almaLaureaData.filter(d => d.corstipo === selectedCorstipo && d.facolta === selectedFacolta);
        const postcorsi = [...new Set(filtered.map(d => d.postcorso))];
        populateDropdown(postcorsoSelect, postcorsi, "un corso di laurea");
        clearAlmalaureaStats();
    });

    postcorsoSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
        const selectedPostcorso = postcorsoSelect.value;
        
        selectedAlmalaureaProfile = almaLaureaData.find(d => 
            d.corstipo === selectedCorstipo && 
            d.facolta === selectedFacolta && 
            d.postcorso === selectedPostcorso
        );
        
        displayAlmalaureaStats();
        updateMetrics(); // To redraw chart with the new line
    });
}

function displayAlmalaureaStats() {
    if (selectedAlmalaureaProfile) {
        const stats = selectedAlmalaureaProfile;
		almalaureaVotoEsamiValue.textContent = stats.voto_esami_medio;
		almalaureaVotoFinaleValue.textContent = stats.voto_finale_medio;
		almalaureaEtaAllaLaureaValue.textContent = stats.eta_alla_laurea_media;
		almalaureaDurataStudiValue.textContent = stats.durata_studi_media;
		almalaureaStatsText.textContent = "Statistiche basate su " + stats.numero_laureati + " laureati nel 2024"
    } else {
        clearAlmalaureaStats();
    }
}


function predictFinalGradeWith95PI(almaLaureaAverage) {
	if (almaLaureaAverage < 18 || almaLaureaAverage > 30) {
		console.error("Unable to predict the final grade with an almaLaureaAverage of " + almaLaureaAverage);
		return { value: NaN, predictionInterval: NaN }
	}

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


function clearAlmalaureaStats() {
    selectedAlmalaureaProfile = null;
    almalaureaStatsText.textContent = "Seleziona un corso di laurea per visualizzarne le statistiche";
    updateMetrics(); // Redraw chart without the line
}
// --- End of New Code ---

// Returns a sorted list of exams that are checked and match the year filter
function getFilteredExams() {
    const selectedYear = document.getElementById("year-filter").value;
    
    const filtered = exams.filter(exam => {
        if (!exam.checkbox.checked) {
            return false;
        }
        if (selectedYear === "all") {
            return true;
        }
        return getAcademicYear(exam.date) === selectedYear;
    });

    return filtered.sort((a, b) => a.date - b.date); // Sort by date
}

function updateMetrics() {
	const metrics = computeMetrics();
	const scatterData = computeScatterData();
	
	let prediction = predictFinalGradeWith95PI(metrics.almaLaureaAverage);

	weightedAverageValue.textContent = metrics.weightedAverage;
	averageValue.textContent = metrics.average;
	gradePredictionValue.textContent = prediction.value >= 110.5 ? "110L" : Math.round(prediction.value);
	gradePredictionValueCI.textContent = "±" + Math.round(prediction.predictionInterval);
	
	updateProgressBar(metrics.totalCFU);
	updateHistogram(metrics.gradeDistribution);
	updateTimeChart(scatterData);
}

function updateProgressBar(achievedECTS, totalECTS=180) {
	// FIXME: così suitable è sempre in ogni anno lol
	let precentage = Math.round((achievedECTS + suitableECTS) / totalECTS * 100);
	let cfu_text = (achievedECTS + suitableECTS) + "/" + totalECTS + " CFU";
	
	ECTSprogressTextLeft.textContent = "";
	ECTSprogressTextRight.textContent = "";
	ECTSprogressTextLeftmost.textContent = "";
	ECTSprogressTextRightmost.textContent = "";
	ECTSprogressTextRight.style.position = "absolute";

	ECTSprogress.style.width = precentage + "%";

	if (precentage < 15) {
		ECTSprogressTextRight.textContent = precentage + " %";
		ECTSprogressTextRight.style.position = "relative";
		ECTSprogressTextRightmost.textContent = cfu_text;
	}
	else if (precentage < 50) {
		ECTSprogressTextLeft.textContent = precentage + " %";
		ECTSprogressTextRightmost.textContent = cfu_text;
	}
	else if (precentage < 80) {
		ECTSprogressPercentage.textContent = cfu;
		ECTSprogressTextLeftmost.textContent = cfu_text;
	}
	else {
		ECTSprogressTextLeft.textContent = precentage + " % ";
		ECTSprogressTextLeftmost.textContent = cfu_text;
	}
}

function updateHistogram(gradeDistribution) {
	const ctx = histogramCanvas.getContext('2d');
	
	if (distributionChart) {
		distributionChart.destroy();
	}

	const labels = [];
	const data = [];
	const backgroundColors = [];

	// Add regular grades (18-30)
	for (let i = 18; i <= 30; i++) {
		labels.push(i.toString());
		data.push(gradeDistribution[i]);
		// Color gradient from red to green
		const intensity = (i - 18) / 12;
		backgroundColors.push(`rgba(${255 - Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)}, 50, 0.7)`);
	}

	// Add 30L
	labels.push('30L');
	data.push(gradeDistribution['30L']);
	backgroundColors.push('rgba(255, 215, 0, 0.8)'); // Gold color for honors

	distributionChart = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
				label: 'Numero di esami',
				data: data,
				backgroundColor: backgroundColors,
				borderColor: backgroundColors.map(color => color.replace('0.7', '1').replace('0.8', '1')),
				borderWidth: 1
			}]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			scales: {
				y: {
					beginAtZero: true,
					ticks: {
						stepSize: 1
					}
				}
			},
			plugins: {
				legend: {
					display: false
				}
			}
		}
	});
}
function updateTimeChart(scatterData) {
    const ctx = timeSeriesCanvas.getContext('2d');
    
    if (timeChart) {
        timeChart.destroy();
    }

    if (scatterData.scatterPoints.length === 0) {
        return;
    }

    const datasets = [
        // Scatter plot for individual exam grades
        {
            label: 'Esami',
            data: scatterData.scatterPoints,
            type: 'scatter',
            backgroundColor: function(context) {
                const point = context.parsed;
                if (point.y > 30) return 'rgba(255, 215, 0, 0.8)'; // Gold for 30L
                // Color gradient from red to green based on grade
                const intensity = (point.y - 18) / 12;
                return `rgba(${255 - Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)}, 50, 0.8)`;
            },
            borderColor: function(context) {
                const point = context.parsed;
                if (point.y > 30) return 'rgba(255, 215, 0, 1)'; // Gold for 30L
                const intensity = (point.y - 18) / 12;
                return `rgba(${255 - Math.floor(intensity * 255)}, ${Math.floor(intensity * 255)}, 50, 1)`;
            },
            borderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8
        },
        // Weighted average line
        {
            label: 'Media ponderata',
            data: scatterData.averageLines.map(point => ({
                x: point.x,
                y: point.weightedAverage
            })),
            type: 'line',
            borderColor: 'rgba(37, 99, 235, 1)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 5
        },
        // Arithmetic average line
        {
            label: 'Media aritmetica',
            data: scatterData.averageLines.map(point => ({
                x: point.x,
                y: point.arithmeticAverage
            })),
            type: 'line',
            borderColor: 'rgba(172, 38, 220, 1)',
            backgroundColor: 'rgba(220, 38, 38, 0.1)',
            borderWidth: 3,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 5,
            borderDash: [5, 5] // Dashed line to distinguish from weighted average
        }
    ];
    
    // Add AlmaLaurea average grade line if a profile is selected
    if (selectedAlmalaureaProfile && scatterData.scatterPoints.length > 0) {
        const averageGrade = selectedAlmalaureaProfile.voto_esami_medio;
        const firstDate = scatterData.scatterPoints[0].x;
        const lastDate = scatterData.scatterPoints[scatterData.scatterPoints.length - 1].x;

        datasets.push({
            label: "Media AlmaLaurea",
            data: [
                { x: firstDate, y: averageGrade },
                { x: lastDate, y: averageGrade }
            ],
            type: 'line',
            borderColor: 'rgba(65, 65, 65, 1)',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            borderDash: [8, 4]
        });
    }

    // --- Start of New Code ---
    // Plugin to draw vertical lines at the beginning of each year
    const yearDividerPlugin = {
        id: 'yearDivider',
        afterDatasetsDraw(chart) {
            const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;

            // Get the start and end year from the chart's time scale
            const startYear = new Date(x.min).getFullYear();
            const endYear = new Date(x.max).getFullYear();

            ctx.save();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.lineWidth = 1;

            // Loop from the year *after* the start year up to the end year
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
    // --- End of New Code ---

    timeChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'point'
            },
            plugins: {
                tooltip: {
                    filter: function(tooltipItem) {
                        // Only show tooltip for scatter points (exam grades)
                        return tooltipItem.datasetIndex === 0;
                    },
                    callbacks: {
                        title: function(context) {
                            const dataIndex = context[0].dataIndex;
                            const point = scatterData.scatterPoints[dataIndex];
                            return point.exam;
                        },
                        label: function(context) {
                            const dataIndex = context.dataIndex;
                            const point = scatterData.scatterPoints[dataIndex];
                            const gradeDisplay = point.originalGrade === HONORS_VALUE ? '30L' : point.originalGrade;
                            return [
                                `Voto: ${gradeDisplay}`,
                                `CFU: ${point.ects}`,
                                `Data: ${point.x.toLocaleDateString('it-IT')}`
                            ];
                        }
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'month',
                        displayFormats: {
                            day: 'dd/MM/yy'
                        }
                    }
                },
                y: {
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        },
        // --- Start of New Code ---
        // Register the custom plugin with the chart instance
        plugins: [yearDividerPlugin]
        // --- End of New Code ---
    });
}

function computeMetrics() {
	const filteredExams = getFilteredExams();

	let totalCFU = 0;
	let totalWeighted = 0;
	let totalAlmaLaurea = 0;
	let total = 0;
	let examsPassed = 0;
	let gradeDistribution = {};

	// Initialize grade distribution
	for (let i = 18; i <= 30; i++) {
		gradeDistribution[i] = 0;
	}
	gradeDistribution["30L"] = 0;

	// First pass to calculate totals
	filteredExams.forEach(exam => {
		totalCFU += exam.ects;
		totalWeighted += exam.grade * exam.ects;
		totalAlmaLaurea += exam.grade > 30 ? 30 : exam.grade;
		total += exam.grade;
		examsPassed++;
		
		// Count grade distribution
		if (exam.grade === HONORS_VALUE) {
			gradeDistribution["30L"]++;
		} else {
			gradeDistribution[exam.grade]++;
		}
	});

	const weightedAverageRaw = totalCFU > 0 ? (totalWeighted / totalCFU) : 0;
	const averageRaw = examsPassed > 0 ? (total / examsPassed) : 0;
	const almaLaureaAverageRaw = examsPassed > 0 ? (totalAlmaLaurea / examsPassed) : 0;

	// Second pass to calculate weighted standard deviation
    let sumOfWeightedSquaredDiffs = 0;
    filteredExams.forEach(exam => {
        sumOfWeightedSquaredDiffs += exam.ects * Math.pow(exam.grade - weightedAverageRaw, 2);
    });
	
	const weightedVariance = totalCFU > 0 ? (sumOfWeightedSquaredDiffs / totalCFU) : 0;
    const stdDeviation = Math.sqrt(weightedVariance);

	return {
		average: averageRaw.toFixed(2),
		weightedAverage: weightedAverageRaw.toFixed(2),
		almaLaureaAverage: almaLaureaAverageRaw.toFixed(2),
		stdDeviation: stdDeviation.toFixed(2),
		totalCFU,
		examsPassed,
		gradeDistribution
	};
}

function computeScatterData() {
	const checkedExams = getFilteredExams();
	
	// Group exams by date to handle visual shifting for same-date exams
	const examsByDate = {};
	checkedExams.forEach(exam => {
		const dateKey = exam.date.toDateString();
		if (!examsByDate[dateKey]) {
			examsByDate[dateKey] = [];
		}
		examsByDate[dateKey].push(exam);
	});

	// Create scatter points with visual shifting for same-date exams
	const scatterPoints = [];
	Object.entries(examsByDate).forEach(([dateKey, dateExams]) => {
		dateExams.forEach((exam, index) => {
			// Add slight time offset for visual separation (in milliseconds)
			const offsetHours = (index - Math.floor(dateExams.length / 2)) * 2; // 2 hours apart
			const adjustedDate = new Date(exam.date.getTime() + offsetHours * 60 * 60 * 1000);
			
			scatterPoints.push({
				x: adjustedDate,
				y: exam.grade,
				exam: exam.exam,
				originalGrade: exam.grade,
				ects: exam.ects
			});
		});
	});
    
    // Re-sort points by adjusted date for correct line drawing
    scatterPoints.sort((a, b) => a.x - b.x);

	// Calculate running averages for the line charts
	const averageLines = [];
	let runningCFU = 0;
	let runningWeighted = 0;
	let runningTotal = 0;

    // Use the original sorted list for calculating running average to maintain logical order
	checkedExams.forEach((exam, index) => {
		runningCFU += exam.ects;
		runningWeighted += exam.grade * exam.ects;
		runningTotal += exam.grade;
		
		averageLines.push({
			x: exam.date,
			weightedAverage: runningWeighted / runningCFU,
			arithmeticAverage: runningTotal / (index + 1)
		});
	});

	return {
		scatterPoints,
		averageLines
	};
}