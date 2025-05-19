// js/api.js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx3uGWV-3SkkzS_H7fY4sDkb11cf9nrq3hK0-PrGfsixLEnX5RL6JMbyzTjSaZUD4zD/exec"; // BEKRÄFTA ATT DETTA ÄR DIN SENASTE WEB APP URL

async function callAppsScript(action, payload = null, method = 'GET') {
    let url = WEB_APP_URL;
    const options = {
        method: method,
        headers: {}, // Headers sätts nedan
        redirect: 'follow'
        // mode: 'cors' // Brukar inte behövas, fetch hanterar det
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
        if (params.toString().length > `action=${action}`.length || (params.toString().length > 0 && !params.has('action'))) { // Undvik dubbel action om payload är tom
             url += `?${params.toString()}`;
        } else {
             url += `?action=${action}`; // Fallback om params är tomma förutom action
        }

    } else if (method === 'POST') {
        // Använd text/plain för att skicka JSON-sträng, mer robust med Apps Script e.postData.contents
        options.headers['Content-Type'] = 'text/plain;charset=utf-8';
        options.body = JSON.stringify({ action: action, payload: payload });
    }

    console.log(`Calling Apps Script. Method: ${method}, URL: ${url.split('?')[0]}, Action: ${action}, Payload:`, payload);

    try {
        const response = await fetch(url, options);

        // Försök alltid läsa texten först, sedan parsa om det är JSON
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

        if (!responseText) { // Om svaret är helt tomt
            console.warn(`Empty response from Apps Script for action '${action}'. Assuming success with no data.`);
            return (method === 'GET' && (action.toLowerCase().includes('list') || action.toLowerCase().includes('dropdown'))) ? [] : {};
        }

        const result = JSON.parse(responseText);
        console.log("Parsed JSON result from Apps Script:", result);

        if (method === 'GET') {
            if (result.error) {
                console.error('Apps Script GET Error:', result.error);
                throw new Error(result.error);
            }
            return result;
        } else if (method === 'POST') {
            if (result.success === false) {
                console.error('Apps Script POST Error:', result.error, result.stack); // result.stack kanske inte finns
                throw new Error(result.error || 'An unknown error occurred in Apps Script (POST).');
            }
            return result.data; // Förväntar oss { success: true, data: ... }
        }

    } catch (error) {
        // Om error redan är ett Error-objekt (t.ex. från JSON.parse fail eller throw new Error ovan)
        // eller om fetch självt misslyckas (nätverksfel etc.)
        const errorMessage = error.message || 'Load failed or network error';
        console.error(`Error in callAppsScript (action: ${action}):`, errorMessage, error);
        throw new Error(errorMessage); // Kasta vidare ett Error-objekt
    }
}

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