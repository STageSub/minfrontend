// js/musicianUi.js
console.log("musicianUi.js loaded");

function renderMusiciansViewHTML() {
    return `
        <h2>Musikerhantering</h2>
        <div class="form-buttons">
            <button id="btnGoToCreateMusicianForm" class="btn-primary">Skapa Ny Musiker</button>
            <button id="btnRefreshMusicians" class="btn-secondary">Ladda Om Musikerlistan</button>
        </div>
        <div id="musiciansTableContainer">Laddar musikerlistan...</div>
    `;
}

function renderMusiciansTableHTML(musiciansArray) {
    if (!musiciansArray || musiciansArray.length === 0) {
        return '<p>Inga musiker hittades.</p>';
    }

    let tableRows = musiciansArray.map(musician => `
        <tr data-musician-id="${musician.musicianId}">
            <td>${musician.firstName || ''} ${musician.lastName || ''}</td>
            <td>${musician.email || ''}</td>
            <td>${musician.phone || ''}</td>
            <td>${musician.primaryInstrumentName || 'Ej angett'}</td>
            <td>${musician.status || ''}</td>
            <td>
                <button class="btn-edit-musician" data-id="${musician.musicianId}">Redigera</button>
                <!-- <button class="btn-view-musician-details" data-id="${musician.musicianId}">Visa</button> -->
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Namn</th>
                    <th>E-post</th>
                    <th>Telefon</th>
                    <th>Primärt Instrument</th>
                    <th>Status</th>
                    <th>Åtgärder</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
    `;
}


function renderMusicianFormHTML(formType = 'create', musicianData = null) {
    const isEditMode = formType === 'edit' && musicianData && musicianData.musicianId;
    const formTitle = isEditMode ? `Redigera Musiker: ${musicianData.firstName || ''} ${musicianData.lastName || ''}` : 'Skapa Ny Musiker';
    const submitButtonText = isEditMode ? "Spara Ändringar" : "Spara Musiker";

    const data = isEditMode ? musicianData : {
        firstName: '', lastName: '', email: '', phone: '',
        primaryInstrumentId: '', hasOwnAccomodation: 'NO', notes: '', status: 'Active',
        qualifications: [] // För befintliga kvalifikationer i redigeringsläge
    };

    let existingQualificationsHTML = '';
    if (isEditMode && data.qualifications && data.qualifications.length > 0) {
        existingQualificationsHTML = `
            <h4>Befintliga Kvalifikationer:</h4>
            <ul class="existing-qualifications-list">
                ${data.qualifications.map(q => `<li>${q.instrumentName || 'Okänt instrument'} - ${q.specificRoleName || 'Okänd roll'}</li>`).join('')}
            </ul>
            <p class="info">För att ändra kvalifikationer, kontakta administratör (denna funktion är inte implementerad i formuläret än).</p>
        `;
        // Om du vill tillåta redigering av kvalifikationer här, behöver UI byggas för det.
        // Just nu visas de bara.
    }


    return `
        <h2>${formTitle}</h2>
        <div class="form-container" id="${formType}MusicianFormContainer">
            ${isEditMode ? `<input type="hidden" id="musicianForm_MusicianId" name="musicianId" value="${data.musicianId}">` : ''}

            <div>
                <label for="musicianForm_FirstName">Förnamn:</label>
                <input type="text" id="musicianForm_FirstName" name="firstName" value="${data.firstName}" required>
            </div>
            <div>
                <label for="musicianForm_LastName">Efternamn:</label>
                <input type="text" id="musicianForm_LastName" name="lastName" value="${data.lastName}" required>
            </div>
            <div>
                <label for="musicianForm_Email">E-post:</label>
                <input type="email" id="musicianForm_Email" name="email" value="${data.email}" required>
            </div>
            <div>
                <label for="musicianForm_Phone">Telefon:</label>
                <input type="tel" id="musicianForm_Phone" name="phone" value="${data.phone}">
            </div>
            <div>
                <label for="musicianForm_PrimaryInstrument">Primärt Instrument:</label>
                <select id="musicianForm_PrimaryInstrument" name="primaryInstrumentId">
                    <option value="">Laddar instrument...</option>
                </select>
            </div>
            <div>
                <label for="musicianForm_HasOwnAccomodation">Har Eget Boende:</label>
                <select id="musicianForm_HasOwnAccomodation" name="hasOwnAccomodation">
                    <option value="NO"${data.hasOwnAccomodation === 'NO' ? ' selected' : ''}>Nej</option>
                    <option value="YES"${data.hasOwnAccomodation === 'YES' ? ' selected' : ''}>Ja</option>
                </select>
            </div>
            <div>
                <label for="musicianForm_Status">Status:</label>
                <select id="musicianForm_Status" name="status">
                    <option value="Active"${data.status === 'Active' ? ' selected' : ''}>Aktiv</option>
                    <option value="Inactive"${data.status === 'Inactive' ? ' selected' : ''}>Inaktiv</option>
                    <option value="DoNotContact"${data.status === 'DoNotContact' ? ' selected' : ''}>Kontakta Ej</option>
                </select>
            </div>
            <div>
                <label for="musicianForm_Notes">Anteckningar:</label>
                <textarea id="musicianForm_Notes" name="notes">${data.notes}</textarea>
            </div>

            ${existingQualificationsHTML}

            ${!isEditMode ? `
            <div class="qualifications-section">
                <h3>Lägg till Kvalifikationer</h3>
                <div id="musicianForm_QualificationsContainer">
                    <!-- Rader för kvalifikationer läggs till här av JS -->
                </div>
                <button type="button" id="btnAddMusicianQualificationRow" class="btn-secondary" style="margin-top:10px;">Lägg till Kvalifikationsrad</button>
            </div>
            ` : ''}


            <div class="form-buttons" style="margin-top:20px;">
                <button id="btnSubmitMusicianForm">${submitButtonText}</button>
                <button id="btnCancelMusicianForm" type="button" class="btn-secondary">Avbryt</button>
            </div>
        </div>
    `;
}

// För att skapa en ny kvalifikationsrad dynamiskt (används vid "Skapa Musiker")
function renderMusicianQualificationRowHTML(rowId) {
    return `
        <div class="qualification-row" id="qualRow_${rowId}">
            <select id="musicianQualificationInstrument_${rowId}" name="qualificationInstrument" data-rowid="${rowId}">
                <option value="">Välj instrument...</option>
            </select>
            <select id="musicianInstrumentQualification_${rowId}" name="instrumentQualificationId" data-rowid="${rowId}" disabled>
                <option value="">Välj instrument först...</option>
            </select>
            <button type="button" class="btn-remove-qualification-row btn-danger" data-rowid="${rowId}">X</button>
        </div>
    `;
}