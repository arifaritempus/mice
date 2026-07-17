import json

files = ['src/locales/tr.json', 'src/locales/en.json']
keys_to_add = {
    "projects": {
        "accommodation": "Konaklama",
        "exportExcel": "Excel Aktar",
        "clearList": "Listeyi Temizle",
        "searchListAllColumns": "Tüm sütunlarda ara",
        "dailyInhouseControl": "Günlük Inhouse",
        "dateCount": "Tarih Sayısı",
        "searchAccommodation": "Konaklama Ara",
        "package": "Paket"
    },
    "common": {
        "copy": "Kopyala",
        "date": "Tarih"
    }
}

for filepath in files:
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    for section, keys in keys_to_add.items():
        if section not in data:
            data[section] = {}
        for k, v in keys.items():
            if k not in data[section]:
                data[section][k] = v
                
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

print("Added missing translation keys")
