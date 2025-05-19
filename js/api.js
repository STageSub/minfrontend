// js/api.js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyfKb_0dwpmcAuU5-UyxuODN7TqCvDori2QlZuwII-K5X65_Df7j151NASsuXv2y4kpyA/exec"; // Din Web App URL

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
        if (params.toString()) {
            url += `?${params.toString()}`;
        } else if (action) { // Ensure action is appended if no other params
             url += `?action=${action}`;
        }
    } else if (method === 'POST') {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ action: action, payload: payload });
    }

    console.log(`Calling Apps Script. Method: ${method}, URL: ${url.split('?')[0]}, Action: ${action}, Payload:`, payload);


    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorData;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                errorData = await response.json();
            } else {
                const textError = await response.text();
                errorData = { error: `HTTP error! status: ${response.status}, statusText: ${response.statusText}. Response: ${textError}` };
            }
            console.error('Network response was not ok:', errorData);
            throw new Error(errorData.error || `Request failed with status ${response.status}`);
        }

        const result = await response.json();
        console.log("Received from Apps Script:", result);


        // Anpassning för att hantera backendens struktur
        // Om backend-svaret INTE har en { success: true/false, data: ... } wrapper,
        // utan direkt returnerar datan (för GET) eller ett resultatobjekt (för POST som kan inkludera success/error).
        if (method === 'GET') {
            // För GET, anta att `result` är den rådata vi vill ha om det inte är ett felobjekt.
            // Din doGet returnerar direkt data eller ett { error: "..." } objekt.
            if (result.error) {
                console.error('Apps Script GET Error:', result.error);
                throw new Error(result.error);
            }
            return result; // `result` är datan
        } else if (method === 'POST') {
            // För POST, förvänta dig { success: true, data: ... } eller { success: false, error: ... }
            if (result.success === false) {
                console.error('Apps Script POST Error:', result.error, result.stack);
                throw new Error(result.error || 'An unknown error occurred in Apps Script (POST).');
            }
            return result.data; // Returnera bara 'data'-delen vid framgång för POST
        }

    } catch (error) {
        console.error(`Error in callAppsScript (action: ${action}):`, error);
        throw error;
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