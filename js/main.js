// js/main.js
console.log("main.js loaded");

// DOM elements cached
const contentArea = document.getElementById('contentArea');

// Global state
let currentView = 'dashboard';
let currentProjectID = null; // Used for context when navigating back, e.g. from need form to project details
let currentNeedID = null;
let currentMusicianID = null;
let musicianQualificationRowCounter = 0;


// --- VIEW LOADING LOGIC ---
async function loadView(viewName, params = null) {
    console.log("loadView CALLED. View:", viewName, "Params:", params);
    currentView = viewName.split('/')[0]; // e.g. 'projects' from 'projects/create'
    setActiveNavLink(currentView); // uiUtils.js
    showLoading(true); // uiUtils.js
    showMessage(''); // uiUtils.js - clear previous messages

    if (!contentArea) {
        console.error("CRITICAL: contentArea not found!");
        showMessage("Internt fel: Gränssnittet kan inte ritas om.", "error");
        showLoading(false);
        return;
    }
    contentArea.innerHTML = ''; // Clear previous content

    try {
        switch (viewName) {
            case 'dashboard':
                contentArea.innerHTML = '<h2>Dashboard</h2><p>Välkommen till StageSub! Här kommer en översikt att visas.</p>';
                break;

            // --- Project Views ---
            case 'projects':
                await loadProjectsListView();
                break;
            case 'createProjectForm':
                await loadCreateProjectFormView();
                break;
            case 'projectDetails':
                if (params) { // params should be projectID
                    currentProjectID = params;
                    await loadProjectDetailsView(params);
                } else {
                    showMessage("Projekt-ID saknas för att visa detaljer.", "error");
                    loadView('projects');
                }
                break;
            case 'editProjectForm':
                 if (params) { // params should be projectID
                    currentProjectID = params;
                    await loadEditProjectFormView(params);
                } else {
                    showMessage("Projekt-ID saknas för att redigera.", "error");
                    loadView('projects');
                }
                break;

            // --- Need Views (within a project context) ---
            case 'createNeedForm': // params should be projectID
                if (params) {
                    currentProjectID = params; // Set context
                    await loadCreateNeedFormView(params);
                } else {
                    showMessage("Projekt-ID saknas för att skapa behov.", "error");
                    loadView('projects');
                }
                break;
            case 'editNeedForm': // params should be { needID, projectID }
                if (params && params.needID && params.projectID) {
                    currentProjectID = params.projectID; // Set context
                    currentNeedID = params.needID;
                    await loadEditNeedFormView(params.needID, params.projectID);
                } else {
                    showMessage("Nödvändig information saknas för att redigera behov.", "error");
                    if (currentProjectID) loadView('projectDetails', currentProjectID);
                    else loadView('projects');
                }
                break;

            // --- Musician Views ---
            case 'musicians':
                await loadMusiciansListView();
                break;
            case 'createMusicianForm':
                await loadCreateMusicianFormView();
                break;
            case 'editMusicianForm': // params should be musicianID
                 if (params) {
                    currentMusicianID = params;
                    await loadEditMusicianFormView(params);
                } else {
                    showMessage("Musiker-ID saknas för att redigera.", "error");
                    loadView('musicians');
                }
                break;

            default:
                contentArea.innerHTML = `<p>Okänd vy: ${viewName}</p>`;
                console.warn("Unknown view requested:", viewName);
        }
    } catch (error) {
        console.error(`Error loading view '${viewName}':`, error);
        showMessage(`Ett fel uppstod när vyn skulle laddas: ${error.message}`, "error");
        // Optionally, navigate to a safe view like dashboard or projects list on critical error
        // if (currentView !== 'dashboard') loadView('dashboard');
    } finally {
        showLoading(false);
    }
}

// --- PROJECT VIEW HANDLERS ---
async function loadProjectsListView() {
    contentArea.innerHTML = renderProjectsViewHTML(); // projectUi.js
    await fetchProjectsData();
    setupProjectListViewEventListeners(); // eventHandlers.js
}

async function fetchProjectsData() {
    const tableContainer = document.getElementById('projectsTableContainer');
    if (tableContainer) tableContainer.innerHTML = '<p><em>Hämtar projekt...</em></p>';
    showLoading(true);
    try {
        const projectsArray = await apiGetProjectsForList(); // api.js
        if (tableContainer) tableContainer.innerHTML = renderProjectsTableHTML(projectsArray); // projectUi.js
        else console.error("fetchProjectsData: projectsTableContainer not found after HTML render.");
    } catch (error) {
        console.error("fetchProjectsData Error:", error);
        if (tableContainer) tableContainer.innerHTML = `<p class="error">Kunde inte ladda projekt: ${error.message}</p>`;
        showMessage(`Fel vid hämtning av projekt: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function loadCreateProjectFormView() {
    contentArea.innerHTML = renderCreateProjectFormHTML(); // projectUi.js
    setupCreateProjectFormEventListeners(); // eventHandlers.js
}

async function handleSubmitNewProject() {
    const form = document.getElementById('createProjectFormContainer');
    if (!form) {
        showMessage("Formuläret hittades inte.", "error");
        return;
    }
    // Basic validation (can be expanded)
    const projectNameInput = form.querySelector('#newProjectName');
    if (!projectNameInput.value.trim()) {
        showMessage("Projektnamn måste fyllas i.", "error");
        projectNameInput.focus();
        return;
    }

    const projectData = {
        ProjectName: projectNameInput.value.trim(),
        WeekNumber: form.querySelector('#newWeekNumber').value,
        RehearsalSchedule: form.querySelector('#newRehearsalSchedule').value,
        ConcertSchedule: form.querySelector('#newConcertSchedule').value,
        ResponseDeadlineHours: form.querySelector('#newResponseDeadlineHours').value,
        DriveFolderID: form.querySelector('#newDriveFolderID').value,
        ProjectStatus: form.querySelector('#newProjectStatus').value,
        Notes: form.querySelector('#newProjectNotes').value
    };

    showLoading(true);
    try {
        const response = await apiCreateNewProject(projectData); // api.js
        showMessage(`Projektet "${response.ProjectName || projectData.ProjectName}" (ID: ${response.ProjectID}) har sparats!`, 'success');
        loadView('projects'); // Navigate back to projects list
    } catch (error) {
        console.error("handleSubmitNewProject Error:", error);
        showMessage(`Kunde inte spara projekt: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function loadProjectDetailsView(projectID) {
    contentArea.innerHTML = '<p><em>Laddar projektdetaljer...</em></p>';
    showLoading(true);
    try {
        const projectData = await apiGetProjectDetails(projectID); // api.js
        if (projectData && !projectData.error) {
            contentArea.innerHTML = renderProjectDetailsHTML(projectData); // projectUi.js
            await fetchAndDisplayProjectNeeds(projectID); // Fetch and display needs for this project
        } else {
            const errorMsg = projectData && projectData.error ? projectData.error : "Okänt fel.";
            contentArea.innerHTML = `<p class="error">Kunde inte ladda projektdetaljer: ${errorMsg}</p><button onclick="loadView('projects')">Tillbaka till Projekt</button>`;
            showMessage(`Fel: ${errorMsg}`, "error");
        }
        setupProjectDetailsViewEventListeners(projectID); // eventHandlers.js
    } catch (error) {
        console.error("loadProjectDetailsView Error:", error);
        contentArea.innerHTML = `<p class="error">Kunde inte ladda projektdetaljer: ${error.message}</p><button onclick="loadView('projects')">Tillbaka till Projekt</button>`;
        showMessage(`Fel vid laddning av projektdetaljer: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function fetchAndDisplayProjectNeeds(projectID) {
    const needsContainer = document.getElementById('projectNeedsTableContainer');
    if (!needsContainer) {
        console.warn("fetchAndDisplayProjectNeeds: projectNeedsTableContainer not found.");
        return;
    }
    needsContainer.innerHTML = '<p><em>Laddar behov...</em></p>';
    try {
        // Assuming apiGetProjectDetails returns projectData which includes a 'needs' array.
        // If needs are fetched separately, you'd call a specific API here.
        // For now, we rely on projectData passed to loadProjectDetailsView containing needs.
        const projectData = await apiGetProjectDetails(projectID); // Re-fetch or use cached if available
        if (projectData && projectData.needs) {
            needsContainer.innerHTML = renderProjectNeedsTableHTML(projectData.needs, projectID); // needUi.js
        } else {
            needsContainer.innerHTML = '<p>Inga behov hittades eller kunde inte laddas.</p>';
        }
    } catch (error) {
        console.error(`Error fetching needs for project ${projectID}:`, error);
        needsContainer.innerHTML = `<p class="error">Kunde inte ladda behov: ${error.message}</p>`;
    }
}


async function loadEditProjectFormView(projectID) {
    contentArea.innerHTML = '<p><em>Laddar projekt för redigering...</em></p>';
    showLoading(true);
    try {
        const projectData = await apiGetProjectDetails(projectID);
        if (projectData && !projectData.error) {
            contentArea.innerHTML = renderEditProjectFormHTML(projectData); // projectUi.js
            setupEditProjectFormEventListeners(projectID); // eventHandlers.js
        } else {
            const errorMsg = projectData && projectData.error ? projectData.error : "Okänt fel.";
            contentArea.innerHTML = `<p class="error">Kunde inte ladda projekt för redigering: ${errorMsg}</p><button onclick="loadView('projects')">Tillbaka</button>`;
        }
    } catch (error) {
        console.error("loadEditProjectFormView Error:", error);
        contentArea.innerHTML = `<p class="error">Kunde inte ladda projekt för redigering: ${error.message}</p><button onclick="loadView('projects')">Tillbaka</button>`;
    } finally {
        showLoading(false);
    }
}

async function handleSubmitUpdateProject(projectID) {
    const form = document.getElementById('editProjectFormContainer');
    if (!form) {
        showMessage("Redigeringsformuläret hittades inte.", "error");
        return;
    }
    const projectNameInput = form.querySelector('#editProjectName');
    if (!projectNameInput.value.trim()) {
        showMessage("Projektnamn måste fyllas i.", "error");
        projectNameInput.focus();
        return;
    }

    const projectData = {
        ProjectID: projectID, // Already have this from context
        ProjectName: projectNameInput.value.trim(),
        WeekNumber: form.querySelector('#editWeekNumber').value,
        RehearsalSchedule: form.querySelector('#editRehearsalSchedule').value,
        ConcertSchedule: form.querySelector('#editConcertSchedule').value,
        ResponseDeadlineHours: form.querySelector('#editResponseDeadlineHours').value,
        DriveFolderID: form.querySelector('#editDriveFolderID').value,
        ProjectStatus: form.querySelector('#editProjectStatus').value,
        Notes: form.querySelector('#editProjectNotes').value
    };

    showLoading(true);
    try {
        const response = await apiUpdateExistingProject(projectData);
        showMessage(`Projekt "${response.ProjectName || projectData.ProjectName}" (ID: ${response.ProjectID}) har uppdaterats!`, 'success');
        loadView('projectDetails', response.ProjectID); // Go to details view of the updated project
    } catch (error) {
        console.error("handleSubmitUpdateProject Error:", error);
        showMessage(`Kunde inte uppdatera projekt: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}


// --- NEED VIEW HANDLERS & HELPERS ---
async function loadCreateNeedFormView(projectID) {
    contentArea.innerHTML = renderNeedFormHTML('create', projectID); // needUi.js
    setupNeedFormEventListeners('create', projectID); // eventHandlers.js
    toggleMaxParallelForFCFS('needForm_MaxParallelContainer', 'needForm_DispatchType'); // Initial check

    // Populate instrument dropdown
    showLoading(true);
    try {
        const instruments = await apiGetInstrumentsForDropdown();
        populateDropdown('needForm_Instrument', instruments, 'Välj instrument...');
    } catch (error) {
        populateDropdown('needForm_Instrument', [], 'Kunde inte ladda instrument');
        showMessage("Kunde inte ladda instrumentlistan.", "error");
    } finally {
        showLoading(false);
    }
}

async function loadEditNeedFormView(needID, projectID) {
    contentArea.innerHTML = '<p><em>Laddar behov för redigering...</em></p>';
    showLoading(true);
    try {
        const needData = await apiGetNeedDetailsForEdit(needID); // api.js
        if (needData && !needData.error) {
            contentArea.innerHTML = renderNeedFormHTML('edit', projectID, needData); // needUi.js
            setupNeedFormEventListeners('edit', projectID, needID); // eventHandlers.js
            toggleMaxParallelForFCFS('needForm_MaxParallelContainer', 'needForm_DispatchType'); // Initial check

            // Pre-populate and select dropdowns
            const instruments = await apiGetInstrumentsForDropdown();
            populateDropdown('needForm_Instrument', instruments, 'Välj instrument...', needData.InstrumentID);

            if (needData.InstrumentID) {
                const qualifications = await apiGetQualificationsForInstrument(needData.InstrumentID);
                populateDropdown('needForm_Qualification', qualifications, 'Välj kvalifikation...', needData.InstrumentQualificationID);
                document.getElementById('needForm_Qualification').disabled = false;

                if (needData.InstrumentQualificationID) {
                    const rankingLists = await apiGetRankingListsForQualification(needData.InstrumentQualificationID);
                    populateDropdown('needForm_RankingList', rankingLists, 'Välj rankningslista...', needData.RankingListID);
                    document.getElementById('needForm_RankingList').disabled = false;
                }
            }
        } else {
            const errorMsg = needData && needData.error ? needData.error : "Okänt fel.";
            contentArea.innerHTML = `<p class="error">Kunde inte ladda behovsdetaljer: ${errorMsg}</p>`;
        }
    } catch (error) {
        console.error("loadEditNeedFormView Error:", error);
        contentArea.innerHTML = `<p class="error">Kunde inte ladda behovsdetaljer: ${error.message}</p>`;
    } finally {
        showLoading(false);
    }
}

async function handleNeedInstrumentChange(instrumentID, qualificationToSelect = null, rankingListToSelect = null) {
    const qualSelect = document.getElementById('needForm_Qualification');
    const rankSelect = document.getElementById('needForm_RankingList');

    qualSelect.innerHTML = '<option value="">Välj instrument först...</option>';
    qualSelect.disabled = true;
    rankSelect.innerHTML = '<option value="">Välj kvalifikation först...</option>';
    rankSelect.disabled = true;

    if (instrumentID) {
        try {
            showLoading(true);
            const qualifications = await apiGetQualificationsForInstrument(instrumentID);
            populateDropdown('needForm_Qualification', qualifications, 'Välj kvalifikation...', qualificationToSelect);
            qualSelect.disabled = false;
            // If a qualification was pre-selected (e.g. during edit form load), trigger its change
            if (qualificationToSelect && qualSelect.value === qualificationToSelect) {
                 await handleNeedQualificationChange(qualificationToSelect, rankingListToSelect);
            }
        } catch (error) {
            showMessage("Kunde inte ladda kvalifikationer.", "error");
        } finally {
            showLoading(false);
        }
    }
}

async function handleNeedQualificationChange(instrumentQualificationID, rankingListToSelect = null) {
    const rankSelect = document.getElementById('needForm_RankingList');
    rankSelect.innerHTML = '<option value="">Välj kvalifikation först...</option>';
    rankSelect.disabled = true;

    if (instrumentQualificationID) {
        try {
            showLoading(true);
            const rankingLists = await apiGetRankingListsForQualification(instrumentQualificationID);
            populateDropdown('needForm_RankingList', rankingLists, 'Välj rankningslista...', rankingListToSelect);
            rankSelect.disabled = false;
        } catch (error) {
            showMessage("Kunde inte ladda rankningslistor.", "error");
        } finally {
            showLoading(false);
        }
    }
}


function toggleMaxParallelForFCFS(containerId, selectId) {
    const dispatchTypeSelect = document.getElementById(selectId);
    const container = document.getElementById(containerId);
    if (dispatchTypeSelect && container) {
        container.style.display = dispatchTypeSelect.value === 'FCFS' ? 'block' : 'none';
    }
}

async function handleSubmitNewNeed(projectID) {
    const form = document.getElementById('createNeedFormContainer'); // Se till att detta är rätt ID för din "Skapa Behov"-form
    if (!validateNeedForm(form)) return; // Din befintliga validering för obligatoriska fält etc.

    const needData = { // Samla in data från formuläret
        ProjectID: projectID, // Kommer från parametern
        InstrumentID: form.querySelector('#needForm_Instrument').value,
        InstrumentQualificationID: form.querySelector('#needForm_Qualification').value,
        RankingListID: form.querySelector('#needForm_RankingList').value,
        NeededQuantity: form.querySelector('#needForm_NeededQuantity').value,
        DispatchType: form.querySelector('#needForm_DispatchType').value,
        MaxParallelDispatches: form.querySelector('#needForm_DispatchType').value === 'FCFS' ? form.querySelector('#needForm_MaxParallelDispatches').value : null,
        RequiresOwnAccomodation: form.querySelector('#needForm_RequiresAccomodation').value,
        NeedStatus: form.querySelector('#needForm_Status').value, // Se till att du har detta fält i formen
        Notes: form.querySelector('#needForm_Notes').value
    };

    showLoading(true);
    try {
        // apiCreateNewNeed anropar callAppsScript som hanterar {success: true/false, data/error}
        const responseData = await apiCreateNewNeed(needData); // responseData är `data`-delen från ett lyckat anrop

        // Om vi når hit var anropet lyckat (inget fel kastades av apiCreateNewNeed)
        showMessage(`Behov (ID: ${responseData.NeedID}) har sparats för projekt ${responseData.ProjectID || projectID}!`, 'success');
        loadView('projectDetails', responseData.ProjectID || projectID);

    } catch (error) {
        // Fel som kastas av apiCreateNewNeed (t.ex. från backend-valideringen eller andra serverfel)
        // `error.message` bör nu innehålla det specifika felmeddelandet från backend.
        console.error("handleSubmitNewNeed - Error caught:", error);
        showMessage(`Kunde inte spara behov: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function handleSubmitUpdateNeed(needID, projectID) {
    const form = document.getElementById('editNeedFormContainer');
    if (!validateNeedForm(form)) return;

    const needData = {
        NeedID: needID,
        ProjectID: projectID,
        InstrumentID: form.querySelector('#needForm_Instrument').value,
        InstrumentQualificationID: form.querySelector('#needForm_Qualification').value,
        RankingListID: form.querySelector('#needForm_RankingList').value,
        NeededQuantity: form.querySelector('#needForm_NeededQuantity').value,
        DispatchType: form.querySelector('#needForm_DispatchType').value,
        MaxParallelDispatches: form.querySelector('#needForm_DispatchType').value === 'FCFS' ? form.querySelector('#needForm_MaxParallelDispatches').value : null,
        RequiresOwnAccomodation: form.querySelector('#needForm_RequiresAccomodation').value,
        NeedStatus: form.querySelector('#needForm_Status').value,
        Notes: form.querySelector('#needForm_Notes').value
    };

    showLoading(true);
    try {
        const response = await apiUpdateExistingNeed(needData); // api.js
        showMessage(`Behov (ID: ${response.NeedID || needID}) har uppdaterats!`, 'success');
        loadView('projectDetails', response.ProjectID || projectID);
    } catch (error) {
        showMessage(`Kunde inte uppdatera behov: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

function validateNeedForm(formElement) {
    if (!formElement) {
        showMessage("Formuläret hittades inte.", "error");
        return false;
    }
    const instrument = formElement.querySelector('#needForm_Instrument').value;
    const qualification = formElement.querySelector('#needForm_Qualification').value;
    const rankingList = formElement.querySelector('#needForm_RankingList').value;
    const quantity = formElement.querySelector('#needForm_NeededQuantity').value;

    if (!instrument) { showMessage("Välj ett instrument.", "error"); return false; }
    if (!qualification) { showMessage("Välj en kvalifikation/roll.", "error"); return false; }
    if (!rankingList) { showMessage("Välj en rankningslista.", "error"); return false; }
    if (parseInt(quantity) < 1 || isNaN(parseInt(quantity))) { showMessage("Ange ett giltigt antal (minst 1).", "error"); return false; }

    if (formElement.querySelector('#needForm_DispatchType').value === 'FCFS') {
        const maxParallel = formElement.querySelector('#needForm_MaxParallelDispatches').value;
        if (parseInt(maxParallel) < 1 || isNaN(parseInt(maxParallel))) {
            showMessage("Ange ett giltigt maxantal för FCFS-batchen (minst 1).", "error"); return false;
        }
    }
    return true;
}

// I main.js
async function handleDeleteNeed(needID, projectID) {
    console.log("handleDeleteNeed attempting to delete. Received needID:", needID, "(Type:", typeof needID + ") for projectID:", projectID);

    if (!needID || typeof needID === 'object') {
        showMessage("Ogiltigt ID för radering av behov. Internt fel.", "error");
        console.error("handleDeleteNeed: Invalid needID detected before API call. Value:", needID);
        return;
    }
    if (!projectID) {
        // Detta är mindre kritiskt för själva raderingen, men viktigt för navigering efteråt.
        console.warn("handleDeleteNeed: projectID is missing or undefined. Navigation after delete might be affected.");
    }

    const confirmation = confirm(`Är du säker på att du vill radera Behov ID: ${needID}? Detta kan inte ångras och tar även bort alla relaterade svar.`);
    if (confirmation) {
        showLoading(true);
        try {
            // apiDeleteNeed skickar { needID: "sträng-id" } som payload i POST-anropet.
            // `response` här är `result.data` från `callAppsScript` i `api.js`.
            // Vi förväntar oss att `response` från en lyckad `apiDeleteNeed`
            // innehåller minst `deletedNeedID` och helst `projectID` från backend.
            const response = await apiDeleteNeed(needID); // apiDeleteNeed tar emot en sträng

            // Logga svaret från backend för att se vad vi faktiskt får
            console.log("handleDeleteNeed - Response from apiDeleteNeed:", response);

            if (response && response.deletedNeedID) {
                 showMessage(`Behov (ID: ${response.deletedNeedID}) har raderats!`, 'success');
                 // Använd projekt-ID från svaret om det finns, annars det vi skickade med,
                 // eller currentProjectID som en sista utväg.
                 const navigateToProjectID = response.projectID || projectID || currentProjectID;
                 if (navigateToProjectID) {
                    loadView('projectDetails', navigateToProjectID);
                 } else {
                    console.warn("handleDeleteNeed: Could not determine projectID to navigate to. Going to projects list.");
                    loadView('projects');
                    showMessage('Navigerar till projektlistan då aktuellt projekt-ID är okänt.', 'info');
                 }
            } else if (response && response.error) { // Om backend returnerar ett specifikt fel i data-delen
                 showMessage(`Kunde inte radera behov: ${response.error}`, "error");
            }
             else {
                // Om backend-svaret är oväntat men inget direkt fel har kastats av api.js
                showMessage(`Radering av behov för ID ${needID} kan ha utförts, men oväntat svar från servern. Uppdaterar vyn.`, 'info');
                const navigateToProjectID = projectID || currentProjectID;
                 if (navigateToProjectID) {
                    loadView('projectDetails', navigateToProjectID);
                 } else {
                    loadView('projects');
                 }
            }
        } catch (error) {
            // Fel som kastas av apiDeleteNeed (via callAppsScript) eller nätverksfel
            // onFailure i uiUtils.js bör redan ha visat ett meddelande via showMessage.
            console.error("handleDeleteNeed - Error caught:", error);
            // showMessage(`Kunde inte radera behov: ${error.message}`, "error"); // Kan vara redundant om onFailure redan körts
        } finally {
            showLoading(false);
        }
    } else {
        console.log("Radera behov avbröts av användaren.");
    }
}


// --- MUSICIAN VIEW HANDLERS ---
async function loadMusiciansListView() {
    contentArea.innerHTML = renderMusiciansViewHTML(); // musicianUi.js
    await fetchAndDisplayMusicians();
    setupMusiciansListViewEventListeners(); // eventHandlers.js
}

async function fetchAndDisplayMusicians() {
    const tableContainer = document.getElementById('musiciansTableContainer');
    if (tableContainer) tableContainer.innerHTML = '<p><em>Hämtar musiker...</em></p>';
    showLoading(true);
    try {
        const musiciansArray = await apiGetMusiciansList(); // api.js
        if (tableContainer) tableContainer.innerHTML = renderMusiciansTableHTML(musiciansArray); // musicianUi.js
    } catch (error) {
        console.error("fetchAndDisplayMusicians Error:", error);
        if (tableContainer) tableContainer.innerHTML = `<p class="error">Kunde inte ladda musiker: ${error.message}</p>`;
        showMessage(`Fel vid hämtning av musiker: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function loadCreateMusicianFormView() {
    contentArea.innerHTML = renderMusicianFormHTML('create'); // musicianUi.js
    musicianQualificationRowCounter = 0; // Reset for new form
    setupMusicianFormEventListeners('create'); // eventHandlers.js
    showLoading(true);
    try {
        const instruments = await apiGetInstrumentsForDropdown();
        populateDropdown('musicianForm_PrimaryInstrument', instruments, 'Välj primärt instrument...');
        // Initial call to add one qualification row? Or let user click.
        // handleAddMusicianQualificationRow(); // Optional: start with one row
    } catch (error) {
        showMessage("Kunde inte ladda instrument för musikerformulär.", "error");
        populateDropdown('musicianForm_PrimaryInstrument', [], 'Laddningsfel...');
    } finally {
        showLoading(false);
    }
}

async function loadEditMusicianFormView(musicianID) {
    contentArea.innerHTML = '<p><em>Laddar musiker för redigering...</em></p>';
    showLoading(true);
    try {
        const musicianData = await apiGetMusicianDetailsForEdit(musicianID);
        if (musicianData && !musicianData.error) {
            contentArea.innerHTML = renderMusicianFormHTML('edit', musicianData); // musicianUi.js
            setupMusicianFormEventListeners('edit', musicianID); // eventHandlers.js

            const instruments = await apiGetInstrumentsForDropdown();
            populateDropdown('musicianForm_PrimaryInstrument', instruments, 'Välj primärt instrument...', musicianData.primaryInstrumentId);
        } else {
             const errorMsg = musicianData && musicianData.error ? musicianData.error : "Okänt fel.";
            contentArea.innerHTML = `<p class="error">Kunde inte ladda musiker för redigering: ${errorMsg}</p><button onclick="loadView('musicians')">Tillbaka</button>`;
        }
    } catch (error) {
        console.error("loadEditMusicianFormView Error:", error);
        contentArea.innerHTML = `<p class="error">Kunde inte ladda musiker för redigering: ${error.message}</p><button onclick="loadView('musicians')">Tillbaka</button>`;
    } finally {
        showLoading(false);
    }
}

async function handleSubmitNewMusician() {
    const form = document.getElementById('createMusicianFormContainer');
    if (!validateMusicianForm(form)) return;

    const qualifications = [];
    form.querySelectorAll('.qualification-row').forEach(row => {
        const instrumentQualId = row.querySelector('select[name="instrumentQualificationId"]')?.value;
        if (instrumentQualId) {
            qualifications.push({ instrumentQualificationId: instrumentQualId });
        }
    });

    const musicianData = {
        firstName: form.querySelector('#musicianForm_FirstName').value.trim(),
        lastName: form.querySelector('#musicianForm_LastName').value.trim(),
        email: form.querySelector('#musicianForm_Email').value.trim(),
        phone: form.querySelector('#musicianForm_Phone').value.trim(),
        primaryInstrumentId: form.querySelector('#musicianForm_PrimaryInstrument').value,
        hasOwnAccomodation: form.querySelector('#musicianForm_HasOwnAccomodation').value,
        status: form.querySelector('#musicianForm_Status').value,
        notes: form.querySelector('#musicianForm_Notes').value.trim(),
        qualifications: qualifications // Array of { instrumentQualificationId: "..." }
    };

    showLoading(true);
    try {
        const response = await apiCreateNewMusician(musicianData); // api.js
        showMessage(response.message || `Musiker ${musicianData.firstName} ${musicianData.lastName} har sparats!`, 'success');
        loadView('musicians');
    } catch (error) {
        showMessage(`Kunde inte spara musiker: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}

async function handleSubmitUpdateMusician(musicianID) {
    const form = document.getElementById('editMusicianFormContainer');
     if (!validateMusicianForm(form, true)) return; // true for isEdit

    const musicianData = {
        musicianId: musicianID,
        firstName: form.querySelector('#musicianForm_FirstName').value.trim(),
        lastName: form.querySelector('#musicianForm_LastName').value.trim(),
        email: form.querySelector('#musicianForm_Email').value.trim(),
        phone: form.querySelector('#musicianForm_Phone').value.trim(),
        primaryInstrumentId: form.querySelector('#musicianForm_PrimaryInstrument').value,
        hasOwnAccomodation: form.querySelector('#musicianForm_HasOwnAccomodation').value,
        status: form.querySelector('#musicianForm_Status').value,
        notes: form.querySelector('#musicianForm_Notes').value.trim()
        // Qualification updates are handled separately or not at all in this basic form
    };

    showLoading(true);
    try {
        const response = await apiUpdateExistingMusician(musicianData); // api.js
        showMessage(response.message || `Musiker ${musicianData.firstName} ${musicianData.lastName} har uppdaterats!`, 'success');
        loadView('musicians');
    } catch (error) {
        showMessage(`Kunde inte uppdatera musiker: ${error.message}`, "error");
    } finally {
        showLoading(false);
    }
}


function validateMusicianForm(formElement, isEdit = false) {
    if (!formElement) {
        showMessage("Musikerformuläret hittades inte.", "error");
        return false;
    }
    const firstName = formElement.querySelector('#musicianForm_FirstName').value.trim();
    const lastName = formElement.querySelector('#musicianForm_LastName').value.trim();
    const email = formElement.querySelector('#musicianForm_Email').value.trim();

    if (!firstName) { showMessage("Förnamn måste fyllas i.", "error"); return false; }
    if (!lastName) { showMessage("Efternamn måste fyllas i.", "error"); return false; }
    if (!email) { showMessage("E-post måste fyllas i.", "error"); return false; }
    // Add more specific email validation if needed

    if (!isEdit) { // Only validate qualifications for new musicians if they are added
        let allQualsValid = true;
        formElement.querySelectorAll('.qualification-row').forEach(row => {
            const inst = row.querySelector('select[name="qualificationInstrument"]')?.value;
            const qual = row.querySelector('select[name="instrumentQualificationId"]')?.value;
            if (inst && !qual) { // Instrument selected but not qualification
                showMessage("Välj en kvalifikation för varje valt instrument, eller ta bort raden.", "error");
                allQualsValid = false;
            }
        });
        if (!allQualsValid) return false;
    }
    return true;
}


async function handleAddMusicianQualificationRow() {
    musicianQualificationRowCounter++;
    const rowId = musicianQualificationRowCounter;
    const container = document.getElementById('musicianForm_QualificationsContainer');
    if (container) {
        const newRowHTML = renderMusicianQualificationRowHTML(rowId); // musicianUi.js
        container.insertAdjacentHTML('beforeend', newRowHTML);

        try {
            const instruments = await apiGetInstrumentsForDropdown();
            populateDropdown(`musicianQualificationInstrument_${rowId}`, instruments, 'Välj instrument...');
        } catch (error) {
            populateDropdown(`musicianQualificationInstrument_${rowId}`, [], 'Laddningsfel...');
            showMessage("Kunde inte ladda instrument för kvalifikationsrad.", "error");
        }
    }
}

function handleRemoveMusicianQualificationRow(rowId) {
    const rowToRemove = document.getElementById(`qualRow_${rowId}`);
    if (rowToRemove) {
        rowToRemove.remove();
    }
}

async function handleMusicianQualificationInstrumentChange(rowId, instrumentID) {
    const qualSelectId = `musicianInstrumentQualification_${rowId}`;
    const qualSelect = document.getElementById(qualSelectId);

    if (!qualSelect) return;
    qualSelect.innerHTML = '<option value="">Välj instrument först...</option>';
    qualSelect.disabled = true;

    if (instrumentID) {
        try {
            showLoading(true); // Consider a more subtle loading indicator for dropdowns
            const qualifications = await apiGetQualificationsForInstrument(instrumentID);
            populateDropdown(qualSelectId, qualifications, 'Välj kvalifikation...');
            qualSelect.disabled = false;
        } catch (error) {
            showMessage("Kunde inte ladda kvalifikationer för instrumentet.", "error");
        } finally {
            showLoading(false);
        }
    }
}


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");
    if (!contentArea || !loadingIndicator || !messageArea) {
        console.error("CRITICAL: One or more essential UI elements are missing. App cannot start.");
        document.body.innerHTML = "<p style='color:red; font-weight:bold; padding:20px;'>CRITICAL ERROR: Essential UI elements not found. App cannot start. Check console.</p>";
        return;
    }
    setupGlobalEventListeners(); // eventHandlers.js
    loadView('dashboard'); // Load initial view
});

