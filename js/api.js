// js/api.js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyfKb_0dwpmcAuU5-UyxuODN7TqCvDori2QlZuwII-K5X65_Df7j151NASsuXv2y4kpyA/exec";

async function callAppsScript(action, payload = null, method = 'GET') {
    let url = WEB_APP_URL;
    const options = {
        method: method,
        headers: {},
        redirect: 'follow'
    };

    if (method === 'GET') {
        const params = new URLSearchParams();
        params.append('action', action);
        if (payload) {
            for (const key in payload) {
                if (payload.hasOwnProperty(key) && payload[key] !== null && typeof payload[key] !== 'undefined') {
                    params.append(key, payload[key]);
                }
            }
        }
        // Använd en enklare URL-konstruktion för GET
        url += `?${params.toString()}`;

    } else if (method === 'POST') {
        // Denna del är korrekt för att *förbereda* POST-anropet
        options.headers['Content-Type'] = 'text/plain;charset=utf-8';
        options.body = JSON.stringify({ action: action, payload: payload });
    }
    
    // Flytta console.log hit så den alltid körs innan fetch
    console.log(`Calling Apps Script. Method: ${method}, Action: ${action}, Full URL (for GET): ${method === 'GET' ? url : WEB_APP_URL}, Payload (for POST):`, method === 'POST' ? payload : '(GET request)');

    try {
        const response = await fetch(url, options); // 'url' är nu korrekt för både GET och POST
                                                  // För POST innehåller 'url' bara WEB_APP_URL utan parametrar, vilket är rätt.

        const responseText = await response.text();
        console.log(`Response text from Apps Script (Action: ${action}, Status: ${response.status}):`, responseText);

        if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}, statusText: ${response.statusText}`;
            if (responseText) {
                try {
                    const errorJson = JSON.parse(responseText);
                    if (errorJson && errorJson.error) {
                        errorMsg = errorJson.error;
                    } else {
                         errorMsg += `. Response: ${responseText}`;
                    }
                } catch (e) {
                    errorMsg += `. Raw Response: ${responseText}`;
                }
            }
            console.error('Network response was not ok:', errorMsg);
            throw new Error(errorMsg);
        }

        if (!responseText) {
            console.warn(`Empty response from Apps Script for action '${action}'. Assuming success with no data.`);
            return (method === 'GET' && (action.toLowerCase().includes('list') || action.toLowerCase().includes('dropdown'))) ? [] : {};
        }

        // ===============================================================
        // 'result' definieras HÄR, tillgängligt för resten av try-blocket
        // ===============================================================
        const result = JSON.parse(responseText);
        console.log("Parsed JSON result from Apps Script:", result);

        if (method === 'GET') {
            if (result.error) {
                console.error('Apps Script GET Error:', result.error);
                throw new Error(result.error);
            }
            return result;
        } else if (method === 'POST') {
            // Nu väljer vi hur vi hanterar POST-svaret.
            // Alternativ 1 (rekommenderat baserat på din Apps Script-retur):
            // Antag att om 'result' har en 'error'-egenskap, är det ett applikationsfel.
            // Annars är hela 'result' den data vi vill ha.
            if (result.error) {
                console.error('Apps Script POST Error (Application Level):', result.error);
                throw new Error(result.error);
            }
            return result; // Returnera hela 'result'-objektet direkt

            // Alternativ 2 (om din backend ALLTID returnerade { success: true, data: ... }):
            // if (result.success === false) {
            //     console.error('Apps Script POST Error:', result.error, result.stack);
            //     throw new Error(result.error || 'An unknown error occurred in Apps Script (POST).');
            // }
            // return result.data;
        }

    } catch (error) {
        const errorMessage = error.message || 'Load failed or network error';
        console.error(`Error in callAppsScript (action: ${action}):`, errorMessage, error.stack); // Lade till error.stack
        throw new Error(errorMessage);
    }
}

// ... (resten av din api.js är oförändrad) ...

// --- PROJEKT API ---
function apiGetProjectsForList() {
    return callAppsScript('getProjectsForList', null, 'GET');
}
function apiCreateNewProject(projectData) {
    return callAppsScript('createNewProject', projectData, 'POST');
}
function apiGetProjectDetails(projectID) {
    return callAppsScript('getProjectDetailsForFrontend', { projectID: projectID }, 'GET');
}
function apiUpdateExistingProject(projectDataWithID) {
    return callAppsScript('updateExistingProject', projectDataWithID, 'POST');
}

// --- BEHOV API ---
function apiGetNeedDetailsForEdit(needID) {
    return callAppsScript('getNeedDetailsForEdit', { needID: needID }, 'GET');
}
function apiCreateNewNeed(needData) {
    return callAppsScript('createNewNeed', needData, 'POST');
}
function apiUpdateExistingNeed(needData) {
    return callAppsScript('updateExistingNeed', needData, 'POST');
}
function apiDeleteNeed(needID) {
    return callAppsScript('deleteNeedFromSheet', { needID: needID }, 'POST');
}

// --- DROPDOWNS / DATA API ---
function apiGetInstrumentsForDropdown() {
    return callAppsScript('getInstrumentsForDropdown', null, 'GET');
}
function apiGetQualificationsForInstrument(instrumentID) {
    return callAppsScript('getQualificationsForInstrumentForDropdown', { instrumentID: instrumentID }, 'GET');
}
function apiGetRankingListsForQualification(instrumentQualificationID) {
    return callAppsScript('getRankingListsForQualificationForDropdown', { instrumentQualificationID: instrumentQualificationID }, 'GET');
}

// --- MUSIKER API ---
function apiGetMusiciansList() {
    return callAppsScript('getMusiciansListForFrontend', null, 'GET');
}
function apiCreateNewMusician(musicianData) {
    return callAppsScript('createNewMusician', musicianData, 'POST');
}
function apiGetMusicianDetailsForEdit(musicianId) {
    return callAppsScript('getMusicianDetailsForEdit', { musicianId: musicianId }, 'GET');
}
function apiUpdateExistingMusician(musicianData) {
    return callAppsScript('updateExistingMusician', musicianData, 'POST');
}