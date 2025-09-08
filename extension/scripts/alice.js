"use strict";

function predictWith95CI(x) {
	if (x < 18 || x > 30) {
		return {
			val: NaN,
			lower: NaN,
			upper: NaN
		};
	}
	const ses = [4.028666215623055, 3.3386414826098014, 2.77486491572064, 2.344159539859904, 2.047313529760881, 1.8716019067649696, 1.7881642893469032, 1.7601429216805495, 1.7554935896873967, 1.7550205493971243, 1.7547579109517102, 1.766210287167336, 1.8154961601834838];
    const x2 = -0.27050574;
    const x1 = 17.42744807;
    const intercept = -166.18817266;
    const q = 1.9657953681092568

    let y = x*x*x2 + x*x1 + intercept;
    let approx_se = ses[Math.round(x) - 18];
    let CI = q * approx_se;

	return {
		value: y,
		CI
	};
}

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
 * persistenza dei dati
 * layout responsive
 * schermata previsione
 * * */

const almalaureaData = [{"numero_laureati":54,"eta_alla_laurea_media":23.1,"voto_esami_medio":26.9,"voto_finale_medio":106.8,"durata_studi_media":3.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Biologia","postcorso":"Biotecnologie (L-2)"},{"numero_laureati":114,"eta_alla_laurea_media":24.3,"voto_esami_medio":25.9,"voto_finale_medio":101.7,"durata_studi_media":4.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Biologia","postcorso":"Scienze biologiche (L-13)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Biologia","postcorso":"Scienze biologiche molecolari (12)"},{"numero_laureati":36,"eta_alla_laurea_media":25.6,"voto_esami_medio":25.2,"voto_finale_medio":99.8,"durata_studi_media":5.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Biologia","postcorso":"Scienze naturali ed ambientali (L-32)"},{"numero_laureati":44,"eta_alla_laurea_media":24.1,"voto_esami_medio":26,"voto_finale_medio":102.9,"durata_studi_media":5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Chimica e chimica industriale","postcorso":"Chimica (L-27)"},{"numero_laureati":14,"eta_alla_laurea_media":24.5,"voto_esami_medio":24.9,"voto_finale_medio":98.9,"durata_studi_media":5.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Chimica e chimica industriale","postcorso":"Chimica per l'industria e l'ambiente (L-27)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Cinema, musica e teatro (23)"},{"numero_laureati":193,"eta_alla_laurea_media":25.8,"voto_esami_medio":27.7,"voto_finale_medio":106.7,"durata_studi_media":4.4,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Discipline dello spettacolo e della comunicazione (L-3,L-20)"},{"numero_laureati":79,"eta_alla_laurea_media":26.3,"voto_esami_medio":27.8,"voto_finale_medio":105.6,"durata_studi_media":4.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Filosofia (L-5)"},{"numero_laureati":3,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Scienze dei beni culturali (13)"},{"numero_laureati":85,"eta_alla_laurea_media":26.1,"voto_esami_medio":27.3,"voto_finale_medio":104.3,"durata_studi_media":4.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Scienze dei beni culturali (L-1)"},{"numero_laureati":19,"eta_alla_laurea_media":28.4,"voto_esami_medio":27.3,"voto_finale_medio":106.9,"durata_studi_media":4.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Scienze per la pace: cooperazione internazionale e trasformazione dei conflitti (L-37)"},{"numero_laureati":67,"eta_alla_laurea_media":29.8,"voto_esami_medio":27.8,"voto_finale_medio":106.6,"durata_studi_media":4.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Civiltà e forme del sapere","postcorso":"Storia (L-42)"},{"numero_laureati":111,"eta_alla_laurea_media":24.1,"voto_esami_medio":25,"voto_finale_medio":99.3,"durata_studi_media":4.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Banca, finanza e mercati finanziari (L-18)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Economia aziendale (17)"},{"numero_laureati":274,"eta_alla_laurea_media":23.8,"voto_esami_medio":25.1,"voto_finale_medio":99.7,"durata_studi_media":4.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Economia aziendale (L-18)"},{"numero_laureati":111,"eta_alla_laurea_media":23.9,"voto_esami_medio":25.4,"voto_finale_medio":100.7,"durata_studi_media":4.1,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Economia e commercio (L-33)"},{"numero_laureati":27,"eta_alla_laurea_media":25,"voto_esami_medio":25.4,"voto_finale_medio":100.7,"durata_studi_media":4.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Economia e legislazione dei sistemi logistici (L-18)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Economia, amministrazione e diritto delle imprese (17)"},{"numero_laureati":63,"eta_alla_laurea_media":22.8,"voto_esami_medio":26,"voto_finale_medio":104.7,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Economia e management","postcorso":"Management for business and economics - management per il business e l'economia (L-18)"},{"numero_laureati":52,"eta_alla_laurea_media":26.8,"voto_esami_medio":24.2,"voto_finale_medio":98,"durata_studi_media":5.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Farmacia","postcorso":"Scienze dei prodotti erboristici e della salute - già scienze erboristiche (L-29)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Informatica umanistica (5)"},{"numero_laureati":56,"eta_alla_laurea_media":24.7,"voto_esami_medio":26.3,"voto_finale_medio":103.7,"durata_studi_media":4.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Informatica umanistica (L-10)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Letterature europee per l'editoria e la produzione culturale (L-10)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Letterature europee per l'editorie e la produzione culturale (5)"},{"numero_laureati":3,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Lettere (5)"},{"numero_laureati":122,"eta_alla_laurea_media":24.1,"voto_esami_medio":27.2,"voto_finale_medio":105.6,"durata_studi_media":4.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Lettere (L-10)"},{"numero_laureati":0,"eta_alla_laurea_media":45.7,"voto_esami_medio":26.6,"voto_finale_medio":103.9,"durata_studi_media":4.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Lingua e cultura italiana per stranieri (L-10)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Lingue e letterature straniere (11)"},{"numero_laureati":112,"eta_alla_laurea_media":26.3,"voto_esami_medio":26.4,"voto_finale_medio":102.2,"durata_studi_media":5.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Filologia, letteratura e linguistica","postcorso":"Lingue, letterature e comunicazione interculturale - già lingue e letterature straniere (L-11)"},{"numero_laureati":131,"eta_alla_laurea_media":23,"voto_esami_medio":25.7,"voto_finale_medio":101.9,"durata_studi_media":3.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Fisica","postcorso":"Fisica (L-30)"},{"numero_laureati":3,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Giurisprudenza","postcorso":"Diritto applicato (2)"},{"numero_laureati":46,"eta_alla_laurea_media":27.6,"voto_esami_medio":25.3,"voto_finale_medio":98.9,"durata_studi_media":6.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Giurisprudenza","postcorso":"Diritto dell'impresa, del lavoro e delle pubbliche amministrazioni (L-14)"},{"numero_laureati":169,"eta_alla_laurea_media":24.5,"voto_esami_medio":25.2,"voto_finale_medio":99.3,"durata_studi_media":4.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Informatica","postcorso":"Informatica (L-31)"},{"numero_laureati":104,"eta_alla_laurea_media":23.8,"voto_esami_medio":25.4,"voto_finale_medio":103.1,"durata_studi_media":4.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria aerospaziale (L-9)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria chimica (10)"},{"numero_laureati":43,"eta_alla_laurea_media":23.6,"voto_esami_medio":24.9,"voto_finale_medio":101.6,"durata_studi_media":4.4,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria chimica (L-9)"},{"numero_laureati":40,"eta_alla_laurea_media":25.3,"voto_esami_medio":24.7,"voto_finale_medio":99.4,"durata_studi_media":5.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria civile ambientale e edile (L-7,L-23)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria civile e ambientale (L-7)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria edile (4)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria edile (L-23)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria energetica (10)"},{"numero_laureati":121,"eta_alla_laurea_media":24.4,"voto_esami_medio":24.4,"voto_finale_medio":100,"durata_studi_media":5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria gestionale (L-9)"},{"numero_laureati":52,"eta_alla_laurea_media":24,"voto_esami_medio":25.3,"voto_finale_medio":104.1,"durata_studi_media":4.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria meccanica (L-9)"},{"numero_laureati":17,"eta_alla_laurea_media":23.3,"voto_esami_medio":25.8,"voto_finale_medio":105.3,"durata_studi_media":3.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria per il design industriale (L-4,L-9)"},{"numero_laureati":53,"eta_alla_laurea_media":24.3,"voto_esami_medio":24.6,"voto_finale_medio":99.6,"durata_studi_media":4.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria dell'energia (L-9)"},{"numero_laureati":137,"eta_alla_laurea_media":24.2,"voto_esami_medio":24.5,"voto_finale_medio":98.9,"durata_studi_media":4.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria biomedica (L-8, ex L-9)"},{"numero_laureati":17,"eta_alla_laurea_media":25,"voto_esami_medio":25.3,"voto_finale_medio":102.8,"durata_studi_media":5.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria delle telecomunicazioni - sede di Pisa (L-8)"},{"numero_laureati":44,"eta_alla_laurea_media":24.6,"voto_esami_medio":25.7,"voto_finale_medio":103.2,"durata_studi_media":5.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria elettronica (L-8)"},{"numero_laureati":105,"eta_alla_laurea_media":24.3,"voto_esami_medio":25.5,"voto_finale_medio":102.4,"durata_studi_media":4.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria informatica (L-8)"},{"numero_laureati":64,"eta_alla_laurea_media":22.6,"voto_esami_medio":23.9,"voto_finale_medio":95.1,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ingegneria dell'informazione","postcorso":"Scienze marittime e navali (L/DS)"},{"numero_laureati":58,"eta_alla_laurea_media":23.7,"voto_esami_medio":25.7,"voto_finale_medio":105.4,"durata_studi_media":4.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Matematica","postcorso":"Matematica (L-35)"},{"numero_laureati":16,"eta_alla_laurea_media":28,"voto_esami_medio":28.4,"voto_finale_medio":112.8,"durata_studi_media":3.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Dietistica (L/SNT3)"},{"numero_laureati":313,"eta_alla_laurea_media":25.1,"voto_esami_medio":26.5,"voto_finale_medio":107.4,"durata_studi_media":4.1,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Infermieristica (L/SNT1)"},{"numero_laureati":17,"eta_alla_laurea_media":23.1,"voto_esami_medio":27.7,"voto_finale_medio":110.6,"durata_studi_media":3.4,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Ostetricia (L/SNT1)"},{"numero_laureati":65,"eta_alla_laurea_media":24.9,"voto_esami_medio":26.2,"voto_finale_medio":107,"durata_studi_media":4.2,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Scienze motorie (L-22)"},{"numero_laureati":11,"eta_alla_laurea_media":24.1,"voto_esami_medio":28,"voto_finale_medio":112.7,"durata_studi_media":4,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Tecnica della riabilitazione psichiatrica (L/SNT2)"},{"numero_laureati":15,"eta_alla_laurea_media":26.3,"voto_esami_medio":27.6,"voto_finale_medio":109.7,"durata_studi_media":4.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Medicina clinica e sperimentale","postcorso":"Terapia della neuro e psicomotricità dell'età evolutiva (L/SNT2)"},{"numero_laureati":17,"eta_alla_laurea_media":27.1,"voto_esami_medio":27.4,"voto_finale_medio":108.2,"durata_studi_media":4.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Igiene dentale (L/SNT3)"},{"numero_laureati":16,"eta_alla_laurea_media":24.6,"voto_esami_medio":28,"voto_finale_medio":111.5,"durata_studi_media":3.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Logopedia (L/SNT2)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Logopedia (SNT/2)"},{"numero_laureati":60,"eta_alla_laurea_media":23.8,"voto_esami_medio":26.9,"voto_finale_medio":105.3,"durata_studi_media":3.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Scienze e tecniche di psicologia clinica e sperimentale - già scienze e tecniche di psicologia clinica e della salute (L-24)"},{"numero_laureati":12,"eta_alla_laurea_media":31.5,"voto_esami_medio":26.1,"voto_finale_medio":105.8,"durata_studi_media":4.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Tecniche audioprotesiche (L/SNT3)"},{"numero_laureati":13,"eta_alla_laurea_media":27.3,"voto_esami_medio":27.4,"voto_finale_medio":111.1,"durata_studi_media":3.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Tecniche di laboratorio biomedico (L/SNT3)"},{"numero_laureati":19,"eta_alla_laurea_media":25.2,"voto_esami_medio":26.9,"voto_finale_medio":107.6,"durata_studi_media":3.9,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Fisioterapia (L/SNT2)"},{"numero_laureati":10,"eta_alla_laurea_media":32,"voto_esami_medio":27.1,"voto_finale_medio":108.8,"durata_studi_media":4.1,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Podologia (L/SNT2)"},{"numero_laureati":17,"eta_alla_laurea_media":24.3,"voto_esami_medio":26.3,"voto_finale_medio":109,"durata_studi_media":3.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Tecniche della prevenzione nell'ambiente e nei luoghi di lavoro (L/SNT4)"},{"numero_laureati":15,"eta_alla_laurea_media":24,"voto_esami_medio":27.1,"voto_finale_medio":108,"durata_studi_media":4.4,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Tecniche di radiologia medica, per immagini e radioterapia (L/SNT3)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Gestione del verde urbano e del paesaggio (20)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Scienze agrarie (20)"},{"numero_laureati":53,"eta_alla_laurea_media":24.8,"voto_esami_medio":25.4,"voto_finale_medio":102.3,"durata_studi_media":4.7,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Scienze agrarie (L-25)"},{"numero_laureati":40,"eta_alla_laurea_media":26.2,"voto_esami_medio":24.6,"voto_finale_medio":100.5,"durata_studi_media":5.1,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Viticoltura ed enologia (L-26)"},{"numero_laureati":15,"eta_alla_laurea_media":23.9,"voto_esami_medio":26.3,"voto_finale_medio":101.7,"durata_studi_media":4.5,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze della Terra","postcorso":"Scienze geologiche (L-34)"},{"numero_laureati":91,"eta_alla_laurea_media":25.3,"voto_esami_medio":25.7,"voto_finale_medio":100.1,"durata_studi_media":4.8,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze politiche","postcorso":"Scienze del servizio sociale (L-39, ex L-40)"},{"numero_laureati":55,"eta_alla_laurea_media":23.9,"voto_esami_medio":26.9,"voto_finale_medio":103.3,"durata_studi_media":3.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze politiche","postcorso":"Scienze del turismo (L-15)"},{"numero_laureati":141,"eta_alla_laurea_media":24.9,"voto_esami_medio":25.7,"voto_finale_medio":100.4,"durata_studi_media":4.3,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze politiche","postcorso":"Scienze politiche - già scienze politiche, internazionali e dell'amministrazione (L-36, ex L-16)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze politiche","postcorso":"Scienze politiche e internazionali (15)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze politiche","postcorso":"Servizio sociale (6)"},{"numero_laureati":9,"eta_alla_laurea_media":25.7,"voto_esami_medio":25.4,"voto_finale_medio":102.1,"durata_studi_media":6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze veterinarie","postcorso":"Scienze e tecnologie delle produzioni animali (L-38)"},{"numero_laureati":36,"eta_alla_laurea_media":25.1,"voto_esami_medio":26.4,"voto_finale_medio":104.7,"durata_studi_media":4.6,"ateneo":"Pisa","corstipo":"Laurea di primo livello","facolta":"Scienze veterinarie","postcorso":"Tecniche di allevamento animale ed educazione cinofila (L-38)"},{"numero_laureati":30,"eta_alla_laurea_media":29,"voto_esami_medio":27.8,"voto_finale_medio":109.3,"durata_studi_media":5.2,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Civiltà e forme del sapere","postcorso":"Scienze della formazione primaria (LM-85bis)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Farmacia","postcorso":"Chimica e tecnologia farmaceutiche (14/S)"},{"numero_laureati":53,"eta_alla_laurea_media":26.3,"voto_esami_medio":26.2,"voto_finale_medio":107.1,"durata_studi_media":7.1,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Farmacia","postcorso":"Chimica e tecnologia farmaceutiche (LM-13)"},{"numero_laureati":3,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Farmacia","postcorso":"Farmacia (14/S)"},{"numero_laureati":53,"eta_alla_laurea_media":26.4,"voto_esami_medio":26,"voto_finale_medio":106,"durata_studi_media":6.5,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Farmacia","postcorso":"Farmacia (LM-13)"},{"numero_laureati":8,"eta_alla_laurea_media":25.1,"voto_esami_medio":26.6,"voto_finale_medio":103.5,"durata_studi_media":5.6,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Giurisprudenza","postcorso":"Giurisprudenza - Accademia Navale di Livorno (LMG/01)"},{"numero_laureati":157,"eta_alla_laurea_media":27.9,"voto_esami_medio":26.6,"voto_finale_medio":103.6,"durata_studi_media":7.7,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Giurisprudenza","postcorso":"Giurisprudenza - sede di Pisa (LMG/01)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria edile-architettura (4/S)"},{"numero_laureati":38,"eta_alla_laurea_media":27.2,"voto_esami_medio":26.7,"voto_finale_medio":109.6,"durata_studi_media":7.8,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria edile-architettura (LM-4 c.u.)"},{"numero_laureati":17,"eta_alla_laurea_media":26.6,"voto_esami_medio":27.7,"voto_finale_medio":110.4,"durata_studi_media":7,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Odontoiatria e protesi dentaria (LM-46)"},{"numero_laureati":6,"eta_alla_laurea_media":41.3,"voto_esami_medio":25.9,"voto_finale_medio":105,"durata_studi_media":22.1,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Medicina e chirurgia (46/S)"},{"numero_laureati":197,"eta_alla_laurea_media":27,"voto_esami_medio":27.3,"voto_finale_medio":109.4,"durata_studi_media":7.4,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Medicina e chirurgia (LM-41)"},{"numero_laureati":42,"eta_alla_laurea_media":27.7,"voto_esami_medio":26.6,"voto_finale_medio":108.9,"durata_studi_media":7.4,"ateneo":"Pisa","corstipo":"Laurea magistrale a ciclo unico","facolta":"Scienze veterinarie","postcorso":"Medicina veterinaria (LM-42)"},{"numero_laureati":16,"eta_alla_laurea_media":27.1,"voto_esami_medio":27.7,"voto_finale_medio":107.4,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Biologia applicata alla biomedicina (LM-6)"},{"numero_laureati":3,"eta_alla_laurea_media":26.1,"voto_esami_medio":24.8,"voto_finale_medio":97.2,"durata_studi_media":1.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Biologia marina (LM-6)"},{"numero_laureati":20,"eta_alla_laurea_media":27,"voto_esami_medio":28.2,"voto_finale_medio":109.3,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Biologia molecolare e cellulare (LM-6)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Biotechnologies and applied artificial intelligence for health - biotecnologie e intelligenza artificiale applicata per la salute (LM-9)"},{"numero_laureati":24,"eta_alla_laurea_media":26.5,"voto_esami_medio":28.1,"voto_finale_medio":108.8,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Biotecnologie molecolari - già biotecnologie molecolari e industriali (LM-8)"},{"numero_laureati":18,"eta_alla_laurea_media":28.2,"voto_esami_medio":28.1,"voto_finale_medio":109.5,"durata_studi_media":3.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Conservazione ed evoluzione (LM-60,LM-6)"},{"numero_laureati":9,"eta_alla_laurea_media":27.7,"voto_esami_medio":29,"voto_finale_medio":111.7,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Biologia","postcorso":"Neuroscience - neuroscienze (LM-6)"},{"numero_laureati":46,"eta_alla_laurea_media":26.5,"voto_esami_medio":28.1,"voto_finale_medio":110.5,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Chimica e chimica industriale","postcorso":"Chimica (LM-54)"},{"numero_laureati":20,"eta_alla_laurea_media":26.7,"voto_esami_medio":27.4,"voto_finale_medio":109.2,"durata_studi_media":2.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Chimica e chimica industriale","postcorso":"Chimica industriale (LM-71)"},{"numero_laureati":26,"eta_alla_laurea_media":29.5,"voto_esami_medio":28.4,"voto_finale_medio":108.3,"durata_studi_media":4,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Archeologia (LM-2)"},{"numero_laureati":56,"eta_alla_laurea_media":29.6,"voto_esami_medio":29.2,"voto_finale_medio":111.6,"durata_studi_media":3.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Filosofia e forme del sapere (LM-78)"},{"numero_laureati":23,"eta_alla_laurea_media":29.6,"voto_esami_medio":29,"voto_finale_medio":110.2,"durata_studi_media":4.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Orientalistica: egitto, vicino e medio oriente (LM-2)"},{"numero_laureati":14,"eta_alla_laurea_media":28.1,"voto_esami_medio":27.8,"voto_finale_medio":107.9,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Scienze per la pace: trasformazione dei conflitti e cooperazione allo sviluppo (LM-81)"},{"numero_laureati":69,"eta_alla_laurea_media":29.8,"voto_esami_medio":28.7,"voto_finale_medio":110.3,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Storia dell'arte - già storia e forme delle arti visive, dello spettacolo e dei nuovi media (LM-89, ex LM-65)"},{"numero_laureati":59,"eta_alla_laurea_media":34.7,"voto_esami_medio":28.5,"voto_finale_medio":109.1,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Civiltà e forme del sapere","postcorso":"Storia e civiltà (LM-84)"},{"numero_laureati":62,"eta_alla_laurea_media":26.4,"voto_esami_medio":27.4,"voto_finale_medio":107.4,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Banca, finanza aziendale e mercati finanziari (LM-77)"},{"numero_laureati":42,"eta_alla_laurea_media":26.2,"voto_esami_medio":27.1,"voto_finale_medio":106.1,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Consulenza professionale alle aziende (LM-77)"},{"numero_laureati":29,"eta_alla_laurea_media":26.1,"voto_esami_medio":28.1,"voto_finale_medio":109.1,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Economics - scienze economiche (LM-56)"},{"numero_laureati":18,"eta_alla_laurea_media":26.8,"voto_esami_medio":27.2,"voto_finale_medio":108.2,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Management e controllo dei processi logistici (LM-77)"},{"numero_laureati":51,"eta_alla_laurea_media":26.3,"voto_esami_medio":27.7,"voto_finale_medio":108.9,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Marketing e ricerche di mercato (LM-77)"},{"numero_laureati":139,"eta_alla_laurea_media":26.2,"voto_esami_medio":27.9,"voto_finale_medio":109,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Economia e management","postcorso":"Strategia, management e controllo (LM-77)"},{"numero_laureati":78,"eta_alla_laurea_media":27.9,"voto_esami_medio":26.9,"voto_finale_medio":106.8,"durata_studi_media":3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Farmacia","postcorso":"Scienze della nutrizione umana (LM-61)"},{"numero_laureati":29,"eta_alla_laurea_media":25.3,"voto_esami_medio":29.3,"voto_finale_medio":111.9,"durata_studi_media":2.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Filologia, letteratura e linguistica","postcorso":"Filologia e storia dell'antichità (LM-15)"},{"numero_laureati":40,"eta_alla_laurea_media":27.2,"voto_esami_medio":28.8,"voto_finale_medio":112.1,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Filologia, letteratura e linguistica","postcorso":"Informatica umanistica (LM-43)"},{"numero_laureati":79,"eta_alla_laurea_media":28.2,"voto_esami_medio":28.4,"voto_finale_medio":109.1,"durata_studi_media":3.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Filologia, letteratura e linguistica","postcorso":"Italianistica - già lingua e letteratura italiana (LM-14)"},{"numero_laureati":32,"eta_alla_laurea_media":28.1,"voto_esami_medio":28.3,"voto_finale_medio":110.1,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Filologia, letteratura e linguistica","postcorso":"Lingue, letterature e filologie euro-americane - già lingue e letterature moderne euroamericane (LM-37)"},{"numero_laureati":55,"eta_alla_laurea_media":27.4,"voto_esami_medio":27.6,"voto_finale_medio":107.8,"durata_studi_media":3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Filologia, letteratura e linguistica","postcorso":"Linguistica e traduzione (LM-39)"},{"numero_laureati":86,"eta_alla_laurea_media":26.4,"voto_esami_medio":28.7,"voto_finale_medio":110.7,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Fisica","postcorso":"Fisica (LM-17)"},{"numero_laureati":24,"eta_alla_laurea_media":29.6,"voto_esami_medio":28,"voto_finale_medio":108.2,"durata_studi_media":1.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Giurisprudenza","postcorso":"Diritto dell'innovazione per l'impresa e le istituzioni (LM/SC-GIUR)"},{"numero_laureati":10,"eta_alla_laurea_media":24.5,"voto_esami_medio":26.6,"voto_finale_medio":106.2,"durata_studi_media":1.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Giurisprudenza","postcorso":"Scienze del governo e dell'amministrazione del mare (LM/DS)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Giurisprudenza","postcorso":"Scienze per la pace: trasformazione dei conflitti e cooperazione allo sviluppo (LM-81)"},{"numero_laureati":52,"eta_alla_laurea_media":26.8,"voto_esami_medio":28.2,"voto_finale_medio":110,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Informatica","postcorso":"Computer science - informatica (LM-18)"},{"numero_laureati":8,"eta_alla_laurea_media":30.3,"voto_esami_medio":23.6,"voto_finale_medio":92.1,"durata_studi_media":3.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Informatica","postcorso":"Computer science and networking - informatica e networking (LM-18)"},{"numero_laureati":5,"eta_alla_laurea_media":25.3,"voto_esami_medio":28.9,"voto_finale_medio":113,"durata_studi_media":2.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Informatica","postcorso":"Data science and business informatics - scienza dei dati e informatica per l'azienda (LM-18,LM-Data)"},{"numero_laureati":35,"eta_alla_laurea_media":27.1,"voto_esami_medio":27.3,"voto_finale_medio":106.1,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Informatica","postcorso":"Data science and business informatics - scienza dei dati per l'economia e per l'azienda  (LM-18, ex LM-91)"},{"numero_laureati":60,"eta_alla_laurea_media":27.3,"voto_esami_medio":26.6,"voto_finale_medio":106.6,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria aerospaziale (LM-20)"},{"numero_laureati":35,"eta_alla_laurea_media":26.6,"voto_esami_medio":26.1,"voto_finale_medio":105.4,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria chimica (LM-22)"},{"numero_laureati":18,"eta_alla_laurea_media":27.9,"voto_esami_medio":27.3,"voto_finale_medio":106,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria dei veicoli (LM-33)"},{"numero_laureati":28,"eta_alla_laurea_media":27.8,"voto_esami_medio":27.5,"voto_finale_medio":106,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria meccanica (LM-33)"},{"numero_laureati":15,"eta_alla_laurea_media":30,"voto_esami_medio":26.5,"voto_finale_medio":106.3,"durata_studi_media":5.3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Ingegneria strutturale e edile - già ingegneria edile e delle costruzioni civili (LM-23,LM-24)"},{"numero_laureati":19,"eta_alla_laurea_media":26.2,"voto_esami_medio":27,"voto_finale_medio":107.2,"durata_studi_media":2.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Materials and nanotechnology - materiali e nanotecnologie (LM-53)"},{"numero_laureati":7,"eta_alla_laurea_media":28.1,"voto_esami_medio":27.9,"voto_finale_medio":111.6,"durata_studi_media":3.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Nuclear engineering - ingegneria nucleare (LM-30, ex LM-26)"},{"numero_laureati":2,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria civile e industriale","postcorso":"Technology and production of paper and cardboard - tecnologia e produzione della carta e del cartone (LM-33)"},{"numero_laureati":11,"eta_alla_laurea_media":30.5,"voto_esami_medio":26,"voto_finale_medio":103.8,"durata_studi_media":4.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria delle infrastrutture civili e dell'ambiente - già ingegneria idraulica, dei trasporti e del territorio (LM-23)"},{"numero_laureati":9,"eta_alla_laurea_media":29.6,"voto_esami_medio":26.8,"voto_finale_medio":108.2,"durata_studi_media":4.7,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria elettrica (LM-28)"},{"numero_laureati":26,"eta_alla_laurea_media":26.7,"voto_esami_medio":26.6,"voto_finale_medio":107.4,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria energetica (LM-30)"},{"numero_laureati":1,"eta_alla_laurea_media":null,"voto_esami_medio":null,"voto_finale_medio":null,"durata_studi_media":null,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria gestionale (34/S)"},{"numero_laureati":62,"eta_alla_laurea_media":26.3,"voto_esami_medio":26.9,"voto_finale_medio":107.5,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'energia, dei sistemi, del territorio e delle costruzioni","postcorso":"Ingegneria gestionale (LM-31)"},{"numero_laureati":38,"eta_alla_laurea_media":26.2,"voto_esami_medio":27.6,"voto_finale_medio":109.4,"durata_studi_media":2.7,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Artificial intelligence and data engineering - intelligenza artificiale e ingegneria dei dati (LM-32)"},{"numero_laureati":17,"eta_alla_laurea_media":25.5,"voto_esami_medio":28.2,"voto_finale_medio":111.5,"durata_studi_media":2.7,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Bionics engineering - ingegneria bionica (LM-21)"},{"numero_laureati":22,"eta_alla_laurea_media":26,"voto_esami_medio":28.5,"voto_finale_medio":111.9,"durata_studi_media":3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Computer engineering - ingegneria informatica (LM-32)"},{"numero_laureati":31,"eta_alla_laurea_media":27.4,"voto_esami_medio":26.7,"voto_finale_medio":104.7,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Cybersecurity - sicurezza informatica (LM-66)"},{"numero_laureati":67,"eta_alla_laurea_media":28.1,"voto_esami_medio":27.3,"voto_finale_medio":108.9,"durata_studi_media":3.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria biomedica (LM-21)"},{"numero_laureati":10,"eta_alla_laurea_media":26.6,"voto_esami_medio":27.4,"voto_finale_medio":108.2,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria delle telecomunicazioni (LM-27)"},{"numero_laureati":25,"eta_alla_laurea_media":26.2,"voto_esami_medio":28,"voto_finale_medio":111,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria elettronica (LM-29)"},{"numero_laureati":71,"eta_alla_laurea_media":27.5,"voto_esami_medio":27.5,"voto_finale_medio":109.8,"durata_studi_media":3.7,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ingegneria dell'informazione","postcorso":"Ingegneria robotica e dell'automazione (LM-25)"},{"numero_laureati":57,"eta_alla_laurea_media":25.8,"voto_esami_medio":28.6,"voto_finale_medio":112.1,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Matematica","postcorso":"Matematica (LM-40)"},{"numero_laureati":32,"eta_alla_laurea_media":30.3,"voto_esami_medio":27.1,"voto_finale_medio":109.6,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Medicina clinica e sperimentale","postcorso":"Scienze e tecniche delle attività motorie preventive e adattate (LM-67)"},{"numero_laureati":19,"eta_alla_laurea_media":42.8,"voto_esami_medio":29,"voto_finale_medio":112.7,"durata_studi_media":2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Medicina clinica e sperimentale","postcorso":"Scienze infermieristiche e ostetriche (LM/SNT1)"},{"numero_laureati":64,"eta_alla_laurea_media":28.2,"voto_esami_medio":28.3,"voto_finale_medio":111.1,"durata_studi_media":2.4,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Patologia chirurgica, medica, molecolare e dell'area critica","postcorso":"Psicologia clinica e scienze comportamentali - già psicologia clinica e della salute (LM-51)"},{"numero_laureati":8,"eta_alla_laurea_media":36,"voto_esami_medio":29.3,"voto_finale_medio":113,"durata_studi_media":2.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Ricerca traslazionale e delle nuove tecnologie in medicina e chirurgia","postcorso":"Scienze riabilitative delle professioni sanitarie (LM/SNT2)"},{"numero_laureati":60,"eta_alla_laurea_media":27.1,"voto_esami_medio":26.5,"voto_finale_medio":108.2,"durata_studi_media":2.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Biosicurezza e qualità degli alimenti (LM-7,LM-70)"},{"numero_laureati":20,"eta_alla_laurea_media":25.9,"voto_esami_medio":28,"voto_finale_medio":112.2,"durata_studi_media":2.4,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Biotecnologie vegetali e microbiche (LM-7)"},{"numero_laureati":12,"eta_alla_laurea_media":27.9,"voto_esami_medio":28.4,"voto_finale_medio":111.8,"durata_studi_media":2.4,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Innovazione sostenibile in viticoltura ed enologia (LM-70)"},{"numero_laureati":17,"eta_alla_laurea_media":30.4,"voto_esami_medio":28.2,"voto_finale_medio":112.3,"durata_studi_media":2.3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Progettazione e gestione del verde urbano e del paesaggio (LM-69)"},{"numero_laureati":33,"eta_alla_laurea_media":27.3,"voto_esami_medio":27.9,"voto_finale_medio":110.6,"durata_studi_media":2.9,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze agrarie, alimentari e agro-ambientali","postcorso":"Sistemi agricoli sostenibili - già produzioni agroalimentari e gestione degli agroecosistemi (LM-69)"},{"numero_laureati":9,"eta_alla_laurea_media":28.7,"voto_esami_medio":26.9,"voto_finale_medio":105.3,"durata_studi_media":3.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze della Terra","postcorso":"Exploration and applied geophysics - geofisica di esplorazione e applicata (LM-79)"},{"numero_laureati":17,"eta_alla_laurea_media":27.9,"voto_esami_medio":28.1,"voto_finale_medio":110.6,"durata_studi_media":2.8,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze della Terra","postcorso":"Scienze ambientali (LM-75)"},{"numero_laureati":29,"eta_alla_laurea_media":27.8,"voto_esami_medio":28.2,"voto_finale_medio":109.2,"durata_studi_media":3.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze della Terra","postcorso":"Scienze e tecnologie geologiche (LM-74)"},{"numero_laureati":46,"eta_alla_laurea_media":27,"voto_esami_medio":26.5,"voto_finale_medio":104,"durata_studi_media":3.2,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Comunicazione d'impresa e politica delle risorse umane (LM-59)"},{"numero_laureati":44,"eta_alla_laurea_media":28.7,"voto_esami_medio":27.1,"voto_finale_medio":107,"durata_studi_media":3.4,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Gestione e innovazione dei servizi sociali, imprenditorialità sociale e management del terzo settore - già sociologia e management dei servizi sociali (LM-87, ex LM-88)"},{"numero_laureati":17,"eta_alla_laurea_media":26.5,"voto_esami_medio":28.1,"voto_finale_medio":110.1,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Progettazione e gestione dei sistemi turistici mediterranei (LM-49)"},{"numero_laureati":8,"eta_alla_laurea_media":33.9,"voto_esami_medio":26.6,"voto_finale_medio":105.9,"durata_studi_media":4.3,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Scienze delle pubbliche amministrazioni (LM-63)"},{"numero_laureati":51,"eta_alla_laurea_media":25.6,"voto_esami_medio":26.8,"voto_finale_medio":105.9,"durata_studi_media":1.5,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Scienze marittime e navali (LM/DS)"},{"numero_laureati":27,"eta_alla_laurea_media":27.8,"voto_esami_medio":28.1,"voto_finale_medio":109.9,"durata_studi_media":3.1,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze politiche","postcorso":"Unione europea, processi globali e sostenibilità dello sviluppo - già studi internazionali (LM-52)"},{"numero_laureati":6,"eta_alla_laurea_media":29.3,"voto_esami_medio":26.9,"voto_finale_medio":110.8,"durata_studi_media":2.6,"ateneo":"Pisa","corstipo":"Laurea magistrale biennale","facolta":"Scienze veterinarie","postcorso":"Sistemi zootecnici sostenibili - già scienze e tecnologie delle produzioni animali (LM-86)"}];
let selectedAlmalaureaProfile = null;

setTimeout(init, 3000);

// Config
const HONORS_VALUE = 33;
const EXTENSION_TAG = "unipi-plus-plus"; // Class name used by all extension-spawned elements

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
	tbody.querySelectorAll(`input[type=checkbox].${EXTENSION_TAG}`).forEach(cb => {
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
		checkbox.className = EXTENSION_TAG;
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
			let checkbox = cells[0].querySelector("input[type=checkbox]." + EXTENSION_TAG);

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
    if (almalaureaData.length === 0) {
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
    const corstipi = [...new Set(almalaureaData.map(d => d.corstipo))];
    populateDropdown(corstipoSelect, corstipi, "un tipo di corso");

    // Event Listeners
    corstipoSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const filteredByCorso = almalaureaData.filter(d => d.corstipo === selectedCorstipo);
        const facolta = [...new Set(filteredByCorso.map(d => d.facolta))];
        populateDropdown(facoltaSelect, facolta, "una facoltà");
        populateDropdown(postcorsoSelect, [], "un corso di laurea");
        clearAlmalaureaStats();
    });

    facoltaSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
        const filtered = almalaureaData.filter(d => d.corstipo === selectedCorstipo && d.facolta === selectedFacolta);
        const postcorsi = [...new Set(filtered.map(d => d.postcorso))];
        populateDropdown(postcorsoSelect, postcorsi, "un corso di laurea");
        clearAlmalaureaStats();
    });

    postcorsoSelect.addEventListener("change", () => {
        const selectedCorstipo = corstipoSelect.value;
        const selectedFacolta = facoltaSelect.value;
        const selectedPostcorso = postcorsoSelect.value;
        
        selectedAlmalaureaProfile = almalaureaData.find(d => 
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
	
	let prediction = predictWith95CI(metrics.almaLaureaAverage);

	weightedAverageValue.textContent = metrics.weightedAverage;
	averageValue.textContent = metrics.average;
	gradePredictionValue.textContent = prediction.value >= 110.5 ? "110L" : Math.round(prediction.value);
	gradePredictionValueCI.textContent = "±" + Math.round(prediction.CI);
	
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