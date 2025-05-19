// js/needUi.js
console.log("needUi.js loaded");

function renderProjectNeedsTableHTML(needsArray, projectID) {
    if (!needsArray || needsArray.length === 0) {
        return '<p>Inga behov specificerade för detta projekt ännu.</p>';
    }

    let tableRows = needsArray.map(need => `
        <tr data-needid="${need.NeedID || ''}">
            <td>${need.InstrumentName || need.InstrumentID || ''}</td>
            <td>${need.QualificationName || need.InstrumentQualificationID || ''}</td>
            <td>${need.NeededQuantity || ''}</td>
            <td>${need.DispatchType || ''}</td>
            <td>${need.NeedStatus || ''}</td>
            <td>
                <button class="btn-edit-need" data-needid="${need.NeedID}" data-projectid="${projectID}">Redigera</button>
                <button class="btn-delete-need btn-danger" data-needid="${need.NeedID}" data-projectid="${projectID}">Radera</button>
            </td>
        </tr>
    `).join('');

    return `
        <table>
            <thead>
                <tr>
                    <th>Instrument</th>
                    <th>Kvalifikation</th>
                    <th>Antal</th>
                    <th>Utskickstyp</th>
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

function renderNeedFormHTML(formType = 'create', projectID = null, needData = null) {
    const isEditMode = formType === 'edit' && needData && needData.NeedID;
    const formTitle = isEditMode ? `Redigera Behov (ID: ${needData.NeedID})` : `Lägg till Nytt Behov för Projekt: ${projectID}`;
    const submitButtonText = isEditMode ? "Spara Ändringar" : "Spara Behov";
    const currentProjectIDForForm = isEditMode ? needData.ProjectID : projectID;

    // Default values for create mode
    const defaultValues = {
        NeededQuantity: 1,
        DispatchType: 'Sequential',
        MaxParallelDispatches: 5,
        RequiresOwnAccomodation: 'NO',
        NeedStatus: 'Active',
        Notes: '',
        InstrumentID: '',
        InstrumentQualificationID: '',
        RankingListID: ''
    };

    const data = isEditMode ? needData : defaultValues;

    return `
        <h2>${formTitle}</h2>
        <div class="form-container" id="${formType}NeedFormContainer">
            <input type="hidden" id="needForm_ProjectID" name="ProjectID" value="${currentProjectIDForForm}">
            ${isEditMode ? `<input type="hidden" id="needForm_NeedID" name="NeedID" value="${data.NeedID}">` : ''}

            <div>
                <label for="needForm_Instrument">Instrument:</label>
                <select id="needForm_Instrument" name="InstrumentID" required>
                    <option value="">${isEditMode ? 'Laddar...' : 'Välj instrument...'}</option>
                </select>
            </div>

            <div>
                <label for="needForm_Qualification">Kvalifikation/Roll:</label>
                <select id="needForm_Qualification" name="InstrumentQualificationID" disabled required>
                    <option value="">Välj instrument först...</option>
                </select>
            </div>

            <div>
                <label for="needForm_RankingList">Rankningslista:</label>
                <select id="needForm_RankingList" name="RankingListID" disabled required>
                    <option value="">Välj kvalifikation först...</option>
                </select>
            </div>

            <div>
                <label for="needForm_NeededQuantity">Antal som behövs:</label>
                <input type="number" id="needForm_NeededQuantity" name="NeededQuantity" value="${data.NeededQuantity}" min="1" required>
            </div>

            <div>
                <label for="needForm_DispatchType">Utskickstyp:</label>
                <select id="needForm_DispatchType" name="DispatchType">
                    <option value="Sequential"${data.DispatchType === 'Sequential' ? ' selected' : ''}>Sekventiellt</option>
                    <option value="Parallel"${data.DispatchType === 'Parallel' ? ' selected' : ''}>Parallellt</option>
                    <option value="FCFS"${data.DispatchType === 'FCFS' ? ' selected' : ''}>Först till Kvarn (FCFS)</option>
                </select>
            </div>

            <div id="needForm_MaxParallelContainer" style="display:${data.DispatchType === 'FCFS' ? 'block' : 'none'};">
                <label for="needForm_MaxParallelDispatches">Max antal samtidiga för FCFS-batch:</label>
                <input type="number" id="needForm_MaxParallelDispatches" name="MaxParallelDispatches" value="${data.MaxParallelDispatches || 5}" min="1">
            </div>

            <div>
                <label for="needForm_RequiresAccomodation">Kräver Eget Boende:</label>
                <select id="needForm_RequiresAccomodation" name="RequiresOwnAccomodation">
                    <option value="NO"${data.RequiresOwnAccomodation === 'NO' ? ' selected' : ''}>Nej</option>
                    <option value="YES"${data.RequiresOwnAccomodation === 'YES' ? ' selected' : ''}>Ja</option>
                </select>
            </div>

            <div>
                <label for="needForm_Status">Behovsstatus:</label>
                <select id="needForm_Status" name="NeedStatus">
                    <option value="Active"${data.NeedStatus === 'Active' ? ' selected' : ''}>Aktivt</option>
                    <option value="Paused"${data.NeedStatus === 'Paused' ? ' selected' : ''}>Pausat</option>
                    <option value="Filled"${data.NeedStatus === 'Filled' ? ' selected' : ''}>Fyllt</option>
                    ${isEditMode && data.NeedStatus === 'Completed' ? '<option value="Completed" selected>Slutfört</option>' : ''}
                </select>
            </div>

            <div>
                <label for="needForm_Notes">Anteckningar för behovet:</label>
                <textarea id="needForm_Notes" name="Notes">${data.Notes || ''}</textarea>
            </div>

            <div class="form-buttons">
                <button id="btnSubmitNeedForm">${submitButtonText}</button>
                <button id="btnCancelNeedForm" type="button" class="btn-secondary" data-projectid="${currentProjectIDForForm}">Avbryt</button>
            </div>
        </div>
    `;
}