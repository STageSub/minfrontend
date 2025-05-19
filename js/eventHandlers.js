// js/eventHandlers.js
console.log("eventHandlers.js loaded");

function setupGlobalEventListeners() {
    document.getElementById('nav-dashboard').addEventListener('click', (e) => { e.preventDefault(); loadView('dashboard'); });
    document.getElementById('nav-projects').addEventListener('click', (e) => { e.preventDefault(); loadView('projects'); });
    document.getElementById('nav-musicians').addEventListener('click', (e) => { e.preventDefault(); loadView('musicians'); });
    console.log("Global event listeners set up.");
}

function setupProjectListViewEventListeners() {
    document.getElementById('btnGoToCreateProjectForm')?.addEventListener('click', () => loadView('createProjectForm'));
    document.getElementById('btnRefreshProjects')?.addEventListener('click', fetchProjectsData);

    const projectsTableContainer = document.getElementById('projectsTableContainer');
    projectsTableContainer?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-view-project-details')) {
            loadView('projectDetails', e.target.dataset.id);
        } else if (e.target.classList.contains('btn-edit-project')) {
            loadView('editProjectForm', e.target.dataset.id);
        }
    });
    console.log("Project list view event listeners potentially set up.");
}

function setupCreateProjectFormEventListeners() {
    document.getElementById('btnSubmitNewProject')?.addEventListener('click', handleSubmitNewProject);
    document.getElementById('btnCancelCreateProject')?.addEventListener('click', () => loadView('projects'));
    console.log("Create project form event listeners potentially set up.");
}

function setupProjectDetailsViewEventListeners(projectID) {
    document.getElementById('btnBackToProjectsFromDetails')?.addEventListener('click', () => loadView('projects'));
    document.getElementById('btnGoToEditProjectForm')?.addEventListener('click', (e) => loadView('editProjectForm', e.target.dataset.id));
    document.getElementById('btnGoToCreateNeedForm')?.addEventListener('click', (e) => loadView('createNeedForm', e.target.dataset.projectid));

    const needsTableContainer = document.getElementById('projectNeedsTableContainer');
    needsTableContainer?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-need')) {
            loadView('editNeedForm', { needID: e.target.dataset.needid, projectID: e.target.dataset.projectid });
        } else if (e.target.classList.contains('btn-delete-need')) {
            handleDeleteNeed(e.target.dataset.needid, e.target.dataset.projectid);
        }
    });
}

function setupEditProjectFormEventListeners(projectID) {
    document.getElementById('btnSubmitUpdateProject')?.addEventListener('click', () => handleSubmitUpdateProject(projectID));
    document.getElementById('btnCancelEditProject')?.addEventListener('click', (e) => loadView('projectDetails', e.target.dataset.id));
}


function setupNeedFormEventListeners(formType = 'create', projectID = null, needID = null) {
    const dispatchTypeSelect = document.getElementById('needForm_DispatchType');
    dispatchTypeSelect?.addEventListener('change', () => {
        toggleMaxParallelForFCFS('needForm_MaxParallelContainer', 'needForm_DispatchType');
    });

    const instrumentSelect = document.getElementById('needForm_Instrument');
    instrumentSelect?.addEventListener('change', (e) => {
        handleNeedInstrumentChange(e.target.value);
    });

    const qualificationSelect = document.getElementById('needForm_Qualification');
    qualificationSelect?.addEventListener('change', (e) => {
        handleNeedQualificationChange(e.target.value);
    });

    document.getElementById('btnSubmitNeedForm')?.addEventListener('click', async () => {
        if (formType === 'create') {
            await handleSubmitNewNeed(projectID);
        } else {
            await handleSubmitUpdateNeed(needID, projectID);
        }
    });
    document.getElementById('btnCancelNeedForm')?.addEventListener('click', (e) => {
        const targetProjectID = e.target.dataset.projectid;
        if (targetProjectID) {
            loadView('projectDetails', targetProjectID);
        } else {
            console.warn("CancelNeedForm: No projectID found, returning to projects list.");
            loadView('projects');
        }
    });
}

function setupMusiciansListViewEventListeners() {
    document.getElementById('btnGoToCreateMusicianForm')?.addEventListener('click', () => loadView('createMusicianForm'));
    document.getElementById('btnRefreshMusicians')?.addEventListener('click', fetchAndDisplayMusicians);

    const musiciansTableContainer = document.getElementById('musiciansTableContainer');
    musiciansTableContainer?.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-edit-musician')) {
            loadView('editMusicianForm', e.target.dataset.id);
        }
        // Add other actions like view details if needed
    });
}

function setupMusicianFormEventListeners(formType = 'create', musicianID = null) {
    if (formType === 'create') {
        document.getElementById('btnAddMusicianQualificationRow')?.addEventListener('click', handleAddMusicianQualificationRow);
        // Event delegation for dynamically added remove buttons
        document.getElementById('musicianForm_QualificationsContainer')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-qualification-row')) {
                handleRemoveMusicianQualificationRow(e.target.dataset.rowid);
            }
        });
         // Event delegation for dynamically added instrument selects
        document.getElementById('musicianForm_QualificationsContainer')?.addEventListener('change', (e) => {
            if (e.target.matches('select[name="qualificationInstrument"]')) {
                 handleMusicianQualificationInstrumentChange(e.target.dataset.rowid, e.target.value);
            }
        });
    }
     if (formType === 'edit' || formType === 'create') {
        document.getElementById('btnSubmitMusicianForm')?.addEventListener('click', async () => {
            if (formType === 'create') {
                await handleSubmitNewMusician();
            } else {
                await handleSubmitUpdateMusician(musicianID);
            }
        });
    }
    document.getElementById('btnCancelMusicianForm')?.addEventListener('click', () => loadView('musicians'));
}