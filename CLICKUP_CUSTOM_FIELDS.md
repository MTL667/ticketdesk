# ClickUp Custom Fields Setup

Deze guide legt uit hoe je ClickUp custom fields configureert zodat je dashboards kunt maken met de ticket data.

## ✨ Nieuwe Feature: Dynamische Dropdown Velden

**De app laadt nu automatisch de dropdown opties vanuit ClickUp!** Dit betekent:
- ✅ Je kunt dropdown opties toevoegen/wijzigen in ClickUp zonder code aan te passen
- ✅ Alle opties worden automatisch gesynchroniseerd
- ✅ Beheer alles centraal vanuit ClickUp
- ✅ Fallback naar standaard opties als ClickUp niet bereikbaar is

## Waarom Custom Fields?

Met custom fields kun je in ClickUp:
- 📊 Dashboards maken met filters op Type vraag, Gebouw, Toepassingsgebied
- 📈 Statistieken bekijken per categorie
- 🔍 Eenvoudig filteren en sorteren
- 📉 Reports genereren
- 🔄 Centraal dropdown opties beheren

## Stap 1: Custom Fields Aanmaken in ClickUp

1. Ga naar je ClickUp List (waar tickets worden opgeslagen)
2. Klik op **Add Custom Field** (rechtsboven of in de lijst instellingen)
3. Maak de volgende 4 custom fields aan:

### Field 1: Type vraag
- **Name:** `Type vraag`
- **Type:** `Dropdown` (Single Select)
- **Options:**
  - Schade & problemen / Dommages et problèmes
  - Nieuwe vraag / Nouvelle demande
  - Informatie / Information
  - Andere / Autres

### Field 2: Gebouw
- **Name:** `Gebouw`
- **Type:** `Dropdown` (Single Select)
- **Options:**
  - Strombeek-Bever
  - Destelbergen
  - Utrecht
  - ACEG Drive-in
  - Andere / Autres

### Field 3: Toepassingsgebied
- **Name:** `Toepassingsgebied`
- **Type:** `Dropdown` (Single Select)
- **Options:**
  - Werkplek / Lieu de travail
  - Gebouwschil / Enveloppe du bâtiment
  - Sanitair / Sanitaire
  - Elektriciteit / Électricité
  - Keuken / Cuisine
  - Verwarming / Chauffage
  - Drank/koffie / Boissons/Café
  - Parking
  - Andere / Autres

### Field 4: Requester Email
- **Name:** `Requester Email`
- **Type:** `Text`

## Stap 2: Klaar! 

**Dat is alles!** De app laadt nu automatisch de dropdown opties vanuit je ClickUp custom fields.

### Opties Toevoegen/Wijzigen

Om dropdown opties aan te passen:
1. Ga naar je ClickUp List
2. Klik op de custom field (bv. "Type vraag")
3. Voeg toe, wijzig, of verwijder opties
4. De wijzigingen zijn **direct** beschikbaar in de app (na refresh)

### Optioneel: Custom Field IDs Ophalen (voor debugging)

Als je de field IDs wilt zien voor debugging:

1. Installeer de benodigde dependency lokaal:
```bash
npm install
```

2. Run het helper script:
```bash
npm run get-fields
```

3. Je krijgt output zoals:
```
📋 Custom Fields in your ClickUp List:

Field: Type vraag
  ID: 12345678-abcd-1234-abcd-123456789012
  Type: drop_down
  Options:
    - Schade & problemen / Dommages et problèmes (ID: 0)
    - Nieuwe vraag / Nouvelle demande (ID: 1)
  ...
```

## Stap 3: Environment Variables (Optioneel voor extra features)

**Let op:** Environment variables zijn **niet verplicht** voor basis functionaliteit. De app werkt zonder deze variabelen en laadt automatisch de dropdown opties uit ClickUp.

Deze variabelen zijn alleen nodig als je:
- Custom field data wilt gebruiken in dashboards
- Advanced filtering wilt in ClickUp
- Custom field exports wilt maken

### Lokaal (voor development):

Run `npm run get-fields` om de IDs op te halen, dan voeg toe aan `.env.local`:
```bash
CLICKUP_FIELD_TYPE_VRAAG=12345678-abcd-1234-abcd-123456789012
CLICKUP_FIELD_GEBOUW=87654321-dcba-4321-dcba-210987654321
CLICKUP_FIELD_TOEPASSINGSGEBIED=11111111-2222-3333-4444-555555555555
CLICKUP_FIELD_REQUESTER_EMAIL=99999999-8888-7777-6666-444444444444
```

### Productie (Easypanel):

1. Ga naar Easypanel dashboard
2. Selecteer je Ticketdesk app
3. Ga naar **Environment Variables**
4. Voeg dezelfde variabelen toe als hierboven
5. **Rebuild/Restart** de container

## Stap 4: Testen

1. Deploy je app (push naar git voor Easypanel)
2. Maak een nieuw ticket aan via de web interface
3. Check in ClickUp of de custom fields correct zijn ingevuld
4. Je kunt nu dashboards en filters maken!

## ClickUp Dashboards Maken

Met de custom fields kun je nu:

### Eenvoudig Filteren:
- Klik op een column header in ClickUp
- Kies "Filter"
- Selecteer je custom field en filter op waarde

### Dashboard Maken:
1. Ga naar je Space in ClickUp
2. Klik op "Dashboards"
3. Maak een nieuw dashboard
4. Voeg widgets toe:
   - **Bar Chart**: Tickets per Gebouw
   - **Pie Chart**: Verdeling Type vraag
   - **Table**: Lijst met filters op Toepassingsgebied
   - **Custom**: Eigen combinaties

### Reports:
- Gebruik de custom fields in ClickUp's reporting functie
- Exporteer data naar Excel/CSV met de custom field waarden

## Troubleshooting

### Custom fields worden niet ingevuld
- Check of de Field IDs correct zijn in je environment variables
- Herstart de applicatie na het toevoegen van environment variables
- Check de logs voor errors

### Verkeerde waardes in custom fields
- Zorg dat de dropdown opties in ClickUp **exact** overeenkomen met de waardes in de code
- Let op hoofdletters en spaties

### Script werkt niet
```bash
# Installeer dependencies opnieuw
npm install

# Check of tsx geïnstalleerd is
npx tsx --version
```

## Voordelen

✅ **Dynamische Dropdowns**: Beheer alle opties centraal in ClickUp  
✅ **Geen Code Wijzigingen**: Voeg opties toe zonder deployment  
✅ **Beter overzicht**: Filter tickets direct op categorie  
✅ **Dashboards**: Maak grafieken en statistieken  
✅ **Rapportage**: Exporteer gefilterde data  
✅ **Automatisering**: Gebruik ClickUp automations op basis van deze fields  
✅ **Integraties**: Gebruik de data in ClickUp integraties (Slack, etc.)  
✅ **Fallback**: Werkt ook als ClickUp tijdelijk niet bereikbaar is

## Hoe Werkt Het? (Technisch)

### Automatisch Laden van Opties

1. **Bij formulier laden**: De app roept `/api/fields` aan
2. **API haalt data op**: Van ClickUp List custom fields endpoint
3. **Dropdowns worden gevuld**: Met de actuele opties uit ClickUp
4. **Caching**: Resultaten worden 1 uur gecached voor performance
5. **Fallback**: Als ClickUp niet bereikbaar is, worden standaard opties gebruikt

### Bij Ticket Aanmaken

1. **Gebruiker selecteert optie**: Bv. "Strombeek-Bever"
2. **Option ID wordt verstuurd**: De unieke ClickUp option ID
3. **Custom field wordt ingevuld**: In ClickUp met de correcte waarde
4. **Dashboard ready**: Direct beschikbaar voor filtering en rapportage

## Optioneel: Extra Custom Fields

Je kunt nog meer custom fields toevoegen, bijvoorbeeld:
- **Urgentie**: Dropdown met urgentie levels
- **Locatie Details**: Text field voor specifieke locatie in gebouw
- **Kosten**: Number field voor geschatte kosten
- **Verantwoordelijke**: User field voor assigned person

Deze worden automatisch geladen als je ze dezelfde namen geeft in ClickUp!

