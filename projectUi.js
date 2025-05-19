// js/projectUi.js
console.log("projectUi.js loaded");

function renderProjectsViewHTML() {
    return `
        <h2>Projekthantering</h2>
        <div class="form-buttons">
            <button id="btnGoToCreateProjectForm" class="btn-primary">Skapa Nytt Projekt</button>
            <button id="btnRefreshProjects" class="btn-secondary">Ladda Om Projektlistan</button>
        </div>
        <div id="projectsTableContainer">Laddar projektlistan...</div>
    `;
}

function renderProjectsTableHTML(projectsArray) {
    if (!projectsArray || projectsArray.length === 0) {
        return '<p>Inga projekt hittades eller så returnerades ingen data.</p>';
    }

    let tableRows = projectsArray.map(project => `
        <tr data-projectid="${project.ProjectID}">
            <td>${project.ProjectID || 'Saknas'}</td>
            <td>${project.ProjectName || 'Saknas'}</td>
            <td>${project.WeekNumber || ''}</td>
            <td>${project.ProjectStatus || ''}</td>
            <td>
                <button class="btn-view-project-details" data-id="${project.ProjectID}">Visa</button>
                <button class="btn-edit-project" data-id="${project.ProjectID}">Redigera</button>
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>ProjektID</th>
                    <th>Projektnamn</th>
                    <th>Vecka</th>
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

function renderCreateProjectFormHTML() {
    // Note: IDs must be unique if this form is rendered multiple times without clearing
    return `
        <h2>Skapa Nytt Projekt</h2>
        <div class="form-container" id="createProjectFormContainer">
            <div>
                <label for="newProjectName">Projektnamn:</label>
                <input type="text" id="newProjectName" name="ProjectName" required>
            </div>
            <div>
                <label for="newWeekNumber">Veckonummer:</label>
                <input type="number" id="newWeekNumber" name="WeekNumber">
            </div>
            <div>
                <label for="newRehearsalSchedule">Repetitioner (text):</label>
                <textarea id="newRehearsalSchedule" name="RehearsalSchedule"></textarea>
            </div>
            <div>
                <label for="newConcertSchedule">Konsertdagar (text):</label>
                <textarea id="newConcertSchedule" name="ConcertSchedule"></textarea>
            </div>
            <div>
                <label for="newResponseDeadlineHours">Svarsdeadline (timmar, 0 för ingen):</label>
                <input type="number" id="newResponseDeadlineHours" name="ResponseDeadlineHours" value="24">
            </div>
            <div>
                <label for="newDriveFolderID">Google Drive Mapp-ID (valfritt):</label>
                <input type="text" id="newDriveFolderID" name="DriveFolderID">
            </div>
            <div>
                <label for="newProjectStatus">Projektstatus:</label>
                <select id="newProjectStatus" name="ProjectStatus">
                    <option value="Planned" selected>Planerat</option>
                    <option value="Active">Aktivt</option>
                    <option value="Paused">Pausat</option>
                </select>
            </div>
            <div>
                <label for="newProjectNotes">Anteckningar:</label>
                <textarea id="newProjectNotes" name="Notes"></textarea>
            </div>
            <div class="form-buttons">
                <button id="btnSubmitNewProject">Spara Projekt</button>
                <button id="btnCancelCreateProject" type="button" class="btn-secondary">Avbryt</button>
            </div>
        </div>
    `;
}

function renderProjectDetailsHTML(projectData) {
    if (!projectData) return '<p>Kunde inte ladda projektinformation.</p>';
    if (projectData.error) return `<p class="error">Fel: ${projectData.error}</p>`;

    // Needs table will be rendered separately by displayProjectNeedsTable
    return `
        <h2>Projektdetaljer: ${projectData.ProjectName || projectData.ProjectID}</h2>
        <div class="details-view">
            <p><strong>ProjektID:</strong> <span>${projectData.ProjectID || ''}</span></p>
            <p><strong>Projektnamn:</strong> <span>${projectData.ProjectName || ''}</span></p>
            <p><strong>Veckonummer:</strong> <span>${projectData.WeekNumber || ''}</span></p>
            <p><strong>Repetitioner:</strong> <pre>${projectData.RehearsalSchedule || '<i>Ej angivet</i>'}</pre></p>
            <p><strong>Konsertdagar:</strong> <pre>${projectData.ConcertSchedule || '<i>Ej angivet</i>'}</pre></p>
            <p><strong>Svarsdeadline (timmar):</strong> <span>${projectData.ResponseDeadlineHours === null || typeof projectData.ResponseDeadlineHours === 'undefined' || projectData.ResponseDeadlineHours === '' ? 'Ingen' : projectData.ResponseDeadlineHours}</span></p>
            <p><strong>Drive Mapp-ID:</strong> <span>${projectData.DriveFolderID || '<i>Ej specificerat</i>'}</span></p>
            <p><strong>Status:</strong> <span>${projectData.ProjectStatus || ''}</span></p>
            <p><strong>Anteckningar:</strong> <pre>${projectData.Notes || '<i>Inga anteckningar</i>'}</pre></p>
            <p><strong>Senast Ändrad:</strong> <span>${projectData.LastModified ? new Date(projectData.LastModified).toLocaleString('sv-SE') : ''}</span></p>
            <p><strong>Skapad Datum:</strong> <span>${projectData.CreatedDate ? new Date(projectData.CreatedDate).toLocaleString('sv-SE') : ''}</span></p>
        </div>
        <div class="form-buttons">
            <button id="btnBackToProjectsFromDetails" class="btn-secondary">Tillbaka till Projekt</button>
            <button id="btnGoToEditProjectForm" data-id="${projectData.ProjectID}">Redigera Projekt</button>
        </div>
        <hr>
        <h3>Behov för detta projekt:</h3>
        <button id="btnGoToCreateNeedForm" data-projectid="${projectData.ProjectID}">Lägg till Nytt Behov</button>
        <div id="projectNeedsTableContainer">Laddar behov...</div>
    `;
}


function renderEditProjectFormHTML(projectData) {
    if (!projectData || projectData.error) {
        return '<p class="error">Kunde inte ladda projektdata för redigering.</p>';
    }
    return `
        <h2>Redigera Projekt: ${projectData.ProjectName || projectData.ProjectID}</h2>
        <div class="form-container" id="editProjectFormContainer">
            <input type="hidden" id="editProjectID" name="ProjectID" value="${projectData.ProjectID}">
            <div>
                <label for="editProjectName">Projektnamn:</label>
                <input type="text" id="editProjectName" name="ProjectName" value="${projectData.ProjectName || ''}" required>
            </div>
            <div>
                <label for="editWeekNumber">Veckonummer:</label>
                <input type="number" id="editWeekNumber" name="WeekNumber" value="${projectData.WeekNumber || ''}">
            </div>
            <div>
                <label for="editRehearsalSchedule">Repetitioner:</label>
                <textarea id="editRehearsalSchedule" name="RehearsalSchedule">${projectData.RehearsalSchedule || ''}</textarea>
            </div>
            <div>
                <label for="editConcertSchedule">Konsertdagar:</label>
                <textarea id="editConcertSchedule" name="ConcertSchedule">${projectData.ConcertSchedule || ''}</textarea>
            </div>
            <div>
                <label for="editResponseDeadlineHours">Svarsdeadline (timmar, 0 för ingen):</label>
                <input type="number" id="editResponseDeadlineHours" name="ResponseDeadlineHours" value="${projectData.ResponseDeadlineHours === null || typeof projectData.ResponseDeadlineHours === 'undefined' || projectData.ResponseDeadlineHours === '' ? '' : projectData.ResponseDeadlineHours}">
            </div>
            <div>
                <label for="editDriveFolderID">Google Drive Mapp-ID:</label>
                <input type="text" id="editDriveFolderID" name="DriveFolderID" value="${projectData.DriveFolderID || ''}">
            </div>
            <div>
                <label for="editProjectStatus">Projektstatus:</label>
                <select id="editProjectStatus" name="ProjectStatus">
                    <option value="Planned"${projectData.ProjectStatus === 'Planned' ? ' selected' : ''}>Planerat</option>
                    <option value="Active"${projectData.ProjectStatus === 'Active' ? ' selected' : ''}>Aktivt</option>
                    <option value="Paused"${projectData.ProjectStatus === 'Paused' ? ' selected' : ''}>Pausat</option>
                    <option value="Completed"${projectData.ProjectStatus === 'Completed' ? ' selected' : ''}>Slutfört</option>
                    <option value="Archived"${projectData.ProjectStatus === 'Archived' ? ' selected' : ''}>Arkiverat</option>
                </select>
            </div>
            <div>
                <label for="editProjectNotes">Anteckningar:</label>
                <textarea id="editProjectNotes" name="Notes">${projectData.Notes || ''}</textarea>
            </div>
            <div class="form-buttons">
                <button id="btnSubmitUpdateProject">Spara Ändringar</button>
                <button id="btnCancelEditProject" type="button" class="btn-secondary" data-id="${projectData.ProjectID}">Avbryt</button>
            </div>
        </div>
    `;
}