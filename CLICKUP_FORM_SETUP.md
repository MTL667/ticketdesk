# ClickUp Form Setup Guide

Deze guide legt uit hoe je het ClickUp formulier configureert zodat tickets correct gekoppeld worden aan gebruikers.

## 📋 **Stap 1: Custom Field Aanmaken**

1. Ga naar je ClickUp List (waar tickets worden opgeslagen)
2. Klik op **"+ Add Custom Field"** (rechts bovenaan of in de lijst instellingen)
3. Maak een veld aan met:
   - **Name**: `Email` of `Requester Email` of `E-mailadres`
   - **Type**: `Email` (aanbevolen) of `Text`
   - **Required**: ✅ Ja (zodat het altijd wordt ingevuld)

## 📝 **Stap 2: ClickUp Form Aanmaken**

1. Ga naar je ClickUp List
2. Klik op de **drie puntjes** (•••) rechtsboven → **Forms**
3. Klik op **"+ Create Form"**
4. Geef je form een naam (bv: "Nieuw Ticket Indienen")

## ⚙️ **Stap 3: Form Velden Configureren**

Voeg de volgende velden toe aan je formulier:

### **Verplichte Velden:**
1. **Task Name** (standaard aanwezig)
   - Label: "Korte omschrijving" of "Onderwerp"
   - Required: Ja

2. **Description** (standaard aanwezig)
   - Label: "Volledige beschrijving"
   - Required: Ja

3. **Email Custom Field** (die je in stap 1 hebt aangemaakt)
   - Label: "Uw e-mailadres"
   - Required: Ja
   - Help tekst: "Vul het e-mailadres in waarmee u bent ingelogd"

### **Optionele Velden:**
4. **Priority** (standaard veld)
   - Label: "Prioriteit"
   - Options: Urgent, High, Normal, Low

5. **Custom Fields voor categorisatie:**
   - Gebouw/Locatie (Dropdown)
   - Type vraag (Dropdown)
   - Afdeling (Dropdown)
   - etc.

## 🎨 **Stap 4: Form Styling**

1. Pas de form aan naar wens:
   - Voeg een welkomst bericht toe
   - Wijzig kleuren om bij je huisstijl te passen
   - Voeg een "Success Message" toe voor na het indienen

2. **Belangrijk**: Zorg dat het duidelijk is dat gebruikers hun **inlog e-mailadres** moeten invullen

## 🔗 **Stap 5: Form URL Ophalen**

1. Klik op **"Publish"** of **"Share"**
2. Kopieer de **Form URL** (iets als: `https://forms.clickup.com/f/...`)
3. Voeg deze URL toe aan Easypanel:
   - Environment Variable: `NEXT_PUBLIC_CLICKUP_FORM_URL`
   - Value: `<de_form_url_die_je_gekopieerd_hebt>`

## ✅ **Stap 6: Filtering Activeren**

Nu de custom field is geconfigureerd, kunnen we de email filtering activeren:

1. Open het bestand `app/api/tickets/route.ts`
2. Zoek deze regel:
   ```typescript
   const userTasks = tasks; // filterTasksByEmail(tasks, session.user.email);
   ```
3. Wijzig het naar:
   ```typescript
   const userTasks = filterTasksByEmail(tasks, session.user.email);
   ```
4. Commit en push naar git

## 🧪 **Testen**

1. Log in op de applicatie
2. Klik "Nieuw Ticket Aanmaken"
3. Vul het formulier in (inclusief je email!)
4. Submit
5. Ga naar "Mijn Tickets" → Je nieuwe ticket verschijnt!

## 🔍 **Troubleshooting**

### **Ticket verschijnt niet bij "Mijn Tickets"**

**Probleem**: Email adres komt niet overeen of is niet ingevuld

**Oplossing**:
1. Check in ClickUp of het email veld correct is ingevuld
2. Vergelijk met het email adres in je profiel (rechtsboven in de app)
3. Zorg dat de custom field naam "email" bevat (hoofdletterongevoelig)

### **Iedereen ziet alle tickets**

**Probleem**: Filtering is niet geactiveerd

**Oplossing**:
- Volg Stap 6 hierboven om filtering te activeren
- Rebuild en restart de container na code wijziging

### **Form laadt niet / geeft error**

**Probleem**: `NEXT_PUBLIC_CLICKUP_FORM_URL` niet correct ingesteld

**Oplossing**:
1. Check of de environment variable bestaat in Easypanel
2. Check of de URL begint met `https://forms.clickup.com/`
3. Restart de container na wijziging

## 📚 **Voorbeeld Form Configuratie**

Hier is een voorbeeld setup:

```
Form Naam: Gebouwbeheer Ticket
Velden:
  1. [Required] Onderwerp (Task Name)
  2. [Required] Beschrijving (Description) 
  3. [Required] Uw E-mail (Custom Field: Email)
  4. [Optional] Gebouw (Custom Field: Dropdown)
     - Strombeek-Bever
     - Destelbergen
     - Utrecht
     - ACEG Drive-in
  5. [Optional] Type Vraag (Custom Field: Dropdown)
     - Schade & problemen
     - Nieuwe vraag
     - Informatie
  6. [Optional] Prioriteit (Priority)
     - Urgent
     - Hoog
     - Normaal
     - Laag
  7. [Optional] Bijlagen (Attachments)
```

## 🎯 **Tips**

- ✅ Maak het email veld **verplicht** om te voorkomen dat tickets niet gekoppeld worden
- ✅ Voeg hulptekst toe: "Vul het e-mailadres in waarmee u bent ingelogd"
- ✅ Test altijd met je eigen account voordat je het uitrolt
- ✅ Overweeg om het email veld **pre-filled** te maken via URL parameters (advanced)
- ✅ Gebruik dropdown fields voor consistente categorisatie

## 🔐 **Privacy & Security**

- Email adressen worden alleen gebruikt voor filtering/koppeling
- Tickets zijn alleen zichtbaar voor ingelogde gebruikers
- ClickUp form kan publiek zijn (wordt beschermd door Azure AD login in de app)
- Overweeg reCAPTCHA toe te voegen aan het form voor extra beveiliging

## 📞 **Support**

Als je hulp nodig hebt bij het configureren van het formulier, neem dan contact op met je ClickUp administrator of check de [ClickUp Forms documentatie](https://docs.clickup.com/en/articles/856285-forms).

