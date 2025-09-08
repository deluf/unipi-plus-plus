
import requests
from bs4 import BeautifulSoup
import pandas as pd
import json
import re
from time import sleep

base_url = "https://www2.almalaurea.it/cgi-php/universita/statistiche/solotendine.php"

def scrape_corso(anno, ateneo, corstipo, facolta, postcorso):
    base_url = "https://www2.almalaurea.it/cgi-php/universita/statistiche/visualizza.php"
    url = base_url + f"?anno={anno}&corstipo={corstipo}&ateneo={ateneo}&facolta={facolta}&gruppo=tutti&livello=tutti&area4=tutti&pa={ateneo}&classe=tutti&postcorso={postcorso}&isstella=0&presiui=tutti&disaggregazione=&LANG=it&CONFIG=profilo"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")

    graduates_count = int(soup.select_one("#dati1 > [data-oid=\"206\"] > td").get_text(strip=True))
    try:
        text = soup.select_one("#dati2").get_text(strip=True)
        match = re.search(r"Età alla laurea \(medie, in anni\)\s*([\d,]+)", text)
        mean_graduation_age = float(match.group(1).replace(",","."))
        text = soup.select_one("#dati5").get_text()
        match = re.search(r"Punteggio degli esami \(medie, in 30-mi\)\s*([\d,]+)", text)
        mean_exams_grade = float(match.group(1).replace(",","."))
        match = re.search(r"Voto di laurea \(medie, in 110-mi\)\s*([\d,]+)", text)
        mean_final_grade = float(match.group(1).replace(",","."))
        match = re.search(r"Durata degli studi \(medie, in anni; per 100 con titolo in Atenei non telematici\)\s*([\d,]+)", text)
        mean_study_years = float(match.group(1).replace(",","."))
    except:
        print(f"\tImpossibile recuperare i dati - Il corso di laurea ha registrato solamente {graduates_count} laureati")
        mean_graduation_age = None
        mean_exams_grade = None
        mean_final_grade = None
        mean_study_years = None

    return {
        "numero_laureati": graduates_count,
        "eta_alla_laurea_media": mean_graduation_age,
        "voto_esami_medio": mean_exams_grade,
        "voto_finale_medio": mean_final_grade,
        "durata_studi_media": mean_study_years,
        "ateneo": ateneo_dict[ateneo],
        "corstipo": corstipo_dict[corstipo],
        "facolta": facolta_dict[facolta],
        "postcorso": postcorso_dict[postcorso]
    }


print("# Seleziona l'anno")
url = base_url + f"?anno=tutti&corstipo=tutti&ateneo=tutti&facolta=tutti&gruppo=tutti&livello=tutti&area4=tutti&pa=tutti&classe=tutti&postcorso=tutti&isstella=0&presiui=tutti&disaggregazione=&LANG=it&CONFIG=profilo&tiporeport=1"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")
anno_select = soup.find("select", {"name": "anno"})
if not anno_select:
    exit("Impossibile recuperare la lista degli anni")
anno_list = []
for anno_option in anno_select.find_all("option"):
    anno_value = anno_option.get("value")
    if anno_value == "tutti": continue
    anno_list.append(anno_value)
    print(f" {anno_value}")
anno_choice = input("> ")
if anno_choice not in anno_list:
    exit("Devi inserire un anno tra quelli in lista")


print("\n# Seleziona l'ateneo")
url = base_url + f"?anno={anno_choice}&corstipo=tutti&ateneo=tutti&facolta=tutti&gruppo=tutti&livello=tutti&area4=tutti&pa=tutti&classe=tutti&postcorso=tutti&isstella=0&presiui=tutti&disaggregazione=&LANG=it&CONFIG=profilo&tiporeport=1"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")
ateneo_select = soup.find("select", {"name": "ateneo"})
if not ateneo_select:
    exit("Impossibile recuperare la lista degli atenei")
ateneo_dict = {}
for ateneo_option in ateneo_select.find_all("option"):
    ateneo_text = ateneo_option.text.strip()
    ateneo_value = ateneo_option.get("value")
    if ateneo_value == "tutti": continue
    ateneo_dict[ateneo_value] = ateneo_text
    print(f" {ateneo_value}: {ateneo_text}")
ateneo_choice = input("> ")
if ateneo_choice not in ateneo_dict.keys():
    exit("Devi inserire il codice numerico di un ateneo tra quelli in lista")


url = base_url + f"?anno={anno_choice}&corstipo=tutti&ateneo={ateneo_choice}&facolta=tutti&gruppo=tutti&livello=tutti&area4=tutti&pa=tutti&classe=tutti&postcorso=tutti&isstella=0&presiui=tutti&disaggregazione=&LANG=it&CONFIG=profilo&tiporeport=1"
response = requests.get(url)
soup = BeautifulSoup(response.text, "html.parser")


print("\n# Seleziona la facoltà/dipartimento")
facolta_dict = {}
facolta_select = soup.find("select", {"name": "facolta"})
if not facolta_select:
    exit("Impossibile recuperare la lista delle facoltà")
for facolta_option in facolta_select.find_all("option"):
    facolta_text = facolta_option.text.strip().replace(" (Dip.)", "")   
    facolta_value = facolta_option.get("value")
    if facolta_value == "tutti": 
        facolta_value = "0"
        facolta_text = "Tutti"
    else:
        facolta_dict[facolta_value] = facolta_text
    print(f" {facolta_value}: {facolta_text}")
facolta_choice = input("> ")
if facolta_choice != "0" and facolta_choice not in facolta_dict.keys():
    exit("Devi inserire il codice numerico di una facoltà/dipartimento tra quelle in lista")


print("\n# Seleziona il tipo di corso")
corstipo_select = soup.find("select", {"name": "corstipo"})
if not corstipo_select:
    exit("Impossibile recuperare la lista delle tipologie di corso")
corstipo_dict = {}
for corstipo_option in corstipo_select.find_all("option"):
    corstipo_text = corstipo_option.text.strip().capitalize()
    corstipo_value = corstipo_option.get("value")
    if corstipo_value == "tutti":
        corstipo_value = "0"
        corstipo_text = "Tutti"
    else:
        corstipo_dict[corstipo_value] = corstipo_text
    print(f" {corstipo_value}\t: {corstipo_text}")
corstipo_choice = input("> ")
if corstipo_choice != "0" and corstipo_choice not in corstipo_dict.keys():
    exit("Devi inserire una tipologia di corso tra quelle in lista")


def extract_postcorso_dict(anno, ateneo, corstipo, facolta, verbose=False):
    url = base_url + f"?anno={anno}&corstipo={corstipo}&ateneo={ateneo}&facolta={facolta}&gruppo=tutti&livello=tutti&area4=tutti&pa={ateneo}&classe=tutti&postcorso=tutti&isstella=0&presiui=tutti&disaggregazione=&LANG=it&CONFIG=profilo&tiporeport=1"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    postcorso_select = soup.find("select", {"name": "postcorso"})
    if not postcorso_select:
        exit("Impossibile recuperare la lista dei corsi di laurea")
    postcorso_dict = {}
    for postcorso_option in postcorso_select.find_all("option"):
        postcorso_text = postcorso_option.text.strip()
        postcorso_text = postcorso_text[0].upper() + postcorso_text[1:] # Capitalize the first letter only
        postcorso_value = postcorso_option.get("value")
        if postcorso_value == "tutti": 
            postcorso_value = "0"
            postcorso_text = "Tutti"
        else:
            postcorso_dict[postcorso_value] = postcorso_text
        if verbose: print(f" {postcorso_value}: {postcorso_text}")
    return postcorso_dict

postcorso_choice = "0"
if corstipo_choice != "0" and facolta_choice != "0":
    print("\n# Seleziona il corso di laurea")
    postcorso_dict = extract_postcorso_dict(anno_choice, ateneo_choice, corstipo_choice, facolta_choice, True)
    postcorso_choice = input("> ")
    if postcorso_choice != "0" and postcorso_choice not in postcorso_dict.keys():
        exit("Devi inserire il codice numerico di un corso tra quelli in lista")


print("")
scraped_data = []
for corstipo_value, corstipo_text in corstipo_dict.items():
    if (corstipo_choice != "0" and corstipo_choice != corstipo_value): continue
    
    for facolta_value, facolta_text in facolta_dict.items():
        if (facolta_choice != "0" and facolta_choice != facolta_value): continue

        postcorso_dict = extract_postcorso_dict(anno_choice, ateneo_choice, corstipo_value, facolta_value)
        for postcorso_value, postcorso_text in postcorso_dict.items():
            if (postcorso_choice != "0" and postcorso_choice != postcorso_value): continue

            print(f"Scraping: {facolta_text} -> {corstipo_text} -> {postcorso_text}")
            scraped_corso = scrape_corso(anno_choice, ateneo_choice, corstipo_value, facolta_value, postcorso_value)
            scraped_data.append(scraped_corso)
            sleep(2) # Avoid getting rate limited. Please don't sue me :)

with open(f"dati_{anno_choice}_{ateneo_dict[ateneo_choice]}.json", "w", encoding="utf-8") as f:
    json.dump(scraped_data, f, ensure_ascii=False, indent=4)
exit(f"\nDati salvati in \"dati_{anno_choice}_{ateneo_dict[ateneo_choice]}.json\"")
