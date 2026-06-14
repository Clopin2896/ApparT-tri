const STORAGE_KEY = "apparttri.data.v1";
const BACKUP_DATE_KEY = "apparttri.lastBackup";
const STATUSES = ["À voir", "Contacté", "À visiter", "Visité", "Favori", "Refusé"];

const elements = {
    form: document.querySelector("#apartment-form"),
    formTitle: document.querySelector("#form-title"),
    formEyebrow: document.querySelector("#form-eyebrow"),
    apartmentId: document.querySelector("#apartment-id"),
    title: document.querySelector("#title"),
    city: document.querySelector("#city"),
    price: document.querySelector("#price"),
    surface: document.querySelector("#surface"),
    rooms: document.querySelector("#rooms"),
    rating: document.querySelector("#rating"),
    status: document.querySelector("#status"),
    listingUrl: document.querySelector("#listing-url"),
    comments: document.querySelector("#comments"),
    saveButton: document.querySelector("#save-button"),
    cancelEdit: document.querySelector("#cancel-edit"),
    toggleForm: document.querySelector("#toggle-form"),
    count: document.querySelector("#apartment-count"),
    rows: document.querySelector("#apartment-rows"),
    tableWrapper: document.querySelector("#table-wrapper"),
    emptyState: document.querySelector("#empty-state"),
    cityFilter: document.querySelector("#city-filter"),
    sort: document.querySelector("#sort"),
    message: document.querySelector("#message"),
    exportButton: document.querySelector("#export-button"),
    importButton: document.querySelector("#import-button"),
    importFile: document.querySelector("#import-file"),
    importDialog: document.querySelector("#import-dialog"),
    importSummary: document.querySelector("#import-summary"),
    backupStatus: document.querySelector("#backup-status"),
    installButton: document.querySelector("#install-button"),
};

let apartments = loadApartments();
let pendingImport = null;
let installPrompt = null;

function loadApartments() {
    try {
        const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        return Array.isArray(stored) ? stored.filter(isValidApartment) : [];
    } catch (_error) {
        return [];
    }
}

function saveApartments() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(apartments));
}

function isValidApartment(item) {
    return item
        && typeof item.id === "string"
        && typeof item.title === "string"
        && typeof item.city === "string"
        && typeof item.listingUrl === "string"
        && typeof item.comments === "string"
        && Number.isFinite(Number(item.price))
        && Number(item.surface) > 0
        && Number(item.rooms) >= 1
        && Number(item.rating) >= 1
        && Number(item.rating) <= 10
        && STATUSES.includes(item.status)
        && !Number.isNaN(Date.parse(item.createdAt))
        && !Number.isNaN(Date.parse(item.updatedAt));
}

function createId() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatMoney(value, decimals = 2) {
    return new Intl.NumberFormat("fr-FR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

function formatDate(value) {
    return new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

function showMessage(text, type = "success") {
    elements.message.innerHTML = `<div class="message message-${type}">${escapeHtml(text)}</div>`;
    window.setTimeout(() => {
        elements.message.innerHTML = "";
    }, 3500);
}

function getVisibleApartments() {
    const city = elements.cityFilter.value;
    const visible = city
        ? apartments.filter((apartment) => apartment.city === city)
        : [...apartments];

    const sorters = {
        updated: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        price_asc: (a, b) => a.price - b.price,
        price_desc: (a, b) => b.price - a.price,
        surface_asc: (a, b) => a.surface - b.surface,
        surface_desc: (a, b) => b.surface - a.surface,
        rating_asc: (a, b) => a.rating - b.rating,
        rating_desc: (a, b) => b.rating - a.rating,
    };
    return visible.sort(sorters[elements.sort.value] || sorters.updated);
}

function renderCities() {
    const selected = elements.cityFilter.value;
    const cities = [...new Set(apartments.map((item) => item.city))]
        .sort((a, b) => a.localeCompare(b, "fr"));

    elements.cityFilter.innerHTML = '<option value="">Toutes les villes</option>';
    cities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        option.selected = city === selected;
        elements.cityFilter.append(option);
    });
}

function render() {
    renderCities();
    const visible = getVisibleApartments();
    elements.count.textContent = `${visible.length} appartement${visible.length === 1 ? "" : "s"}`;
    elements.tableWrapper.hidden = visible.length === 0;
    elements.emptyState.hidden = visible.length !== 0;

    elements.rows.innerHTML = visible.map((apartment) => {
        const comments = apartment.comments
            ? `<details><summary>Voir les commentaires</summary><p>${escapeHtml(apartment.comments)}</p></details>`
            : "";
        const announcement = apartment.listingUrl
            ? `<a class="text-link" href="${escapeHtml(apartment.listingUrl)}" target="_blank" rel="noopener noreferrer">Annonce</a>`
            : "";
        const statusOptions = STATUSES.map((status) => (
            `<option value="${escapeHtml(status)}" ${status === apartment.status ? "selected" : ""}>${escapeHtml(status)}</option>`
        )).join("");
        const pricePerSqm = apartment.price / apartment.surface;

        return `
            <tr>
                <td data-label="Appartement">
                    <strong>${escapeHtml(apartment.title)}</strong>
                    <span class="muted">${escapeHtml(apartment.city)}</span>
                    <span class="updated-at">Modifié le ${formatDate(apartment.updatedAt)}</span>
                    ${comments}
                </td>
                <td data-label="Prix">
                    ${formatMoney(apartment.price)} €
                    <span class="muted price-per-sqm">${formatMoney(pricePerSqm, 0)} €/m²</span>
                </td>
                <td data-label="Surface">${formatMoney(apartment.surface, 1)} m²</td>
                <td data-label="Pièces">${apartment.rooms}</td>
                <td data-label="Note"><span class="rating">${apartment.rating}/10</span></td>
                <td data-label="Statut">
                    <select class="status-select" data-status-id="${apartment.id}">${statusOptions}</select>
                </td>
                <td data-label="Actions">
                    <div class="row-actions">
                        ${announcement}
                        <button class="text-link" type="button" data-edit-id="${apartment.id}">Modifier</button>
                        <button class="danger-link" type="button" data-delete-id="${apartment.id}">Supprimer</button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

function readForm() {
    return {
        title: elements.title.value.trim(),
        city: elements.city.value.trim(),
        price: Number(elements.price.value),
        surface: Number(elements.surface.value),
        rooms: Number(elements.rooms.value),
        rating: Number(elements.rating.value),
        status: elements.status.value,
        listingUrl: elements.listingUrl.value.trim(),
        comments: elements.comments.value.trim(),
    };
}

function resetForm() {
    elements.form.reset();
    elements.rating.value = "5";
    elements.status.value = "À voir";
    elements.apartmentId.value = "";
    elements.formTitle.textContent = "Ajouter un appartement";
    elements.formEyebrow.textContent = "Nouvelle piste";
    elements.saveButton.textContent = "Ajouter à ma sélection";
    elements.cancelEdit.hidden = true;
}

function editApartment(id) {
    const apartment = apartments.find((item) => item.id === id);
    if (!apartment) return;

    elements.apartmentId.value = apartment.id;
    elements.title.value = apartment.title;
    elements.city.value = apartment.city;
    elements.price.value = apartment.price;
    elements.surface.value = apartment.surface;
    elements.rooms.value = apartment.rooms;
    elements.rating.value = apartment.rating;
    elements.status.value = apartment.status;
    elements.listingUrl.value = apartment.listingUrl;
    elements.comments.value = apartment.comments;
    elements.formTitle.textContent = "Modifier l'appartement";
    elements.formEyebrow.textContent = "Mise à jour";
    elements.saveButton.textContent = "Enregistrer les modifications";
    elements.cancelEdit.hidden = false;
    elements.form.hidden = false;
    elements.toggleForm.textContent = "Masquer le formulaire";
    elements.form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteApartment(id) {
    const apartment = apartments.find((item) => item.id === id);
    if (!apartment || !window.confirm(`Supprimer définitivement « ${apartment.title} » ?`)) {
        return;
    }
    apartments = apartments.filter((item) => item.id !== id);
    saveApartments();
    render();
    showMessage("Appartement supprimé.");
}

function updateStatus(id, status) {
    const apartment = apartments.find((item) => item.id === id);
    if (!apartment || !STATUSES.includes(status)) return;
    apartment.status = status;
    apartment.updatedAt = new Date().toISOString();
    saveApartments();
    render();
    showMessage("Statut mis à jour.");
}

function updateBackupStatus() {
    const lastBackup = localStorage.getItem(BACKUP_DATE_KEY);
    elements.backupStatus.textContent = lastBackup
        ? `Dernier export sur cet appareil : ${formatDate(lastBackup)}.`
        : "Aucune sauvegarde exportée sur cet appareil.";
}

function exportData() {
    const exportedAt = new Date().toISOString();
    const backup = {
        application: "AppartTri",
        formatVersion: 1,
        exportedAt,
        apartments,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `apparttri-sauvegarde-${exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    localStorage.setItem(BACKUP_DATE_KEY, exportedAt);
    updateBackupStatus();
    showMessage(`${apartments.length} appartement(s) exporté(s).`);
}

function validateBackup(data) {
    if (
        !data
        || data.application !== "AppartTri"
        || data.formatVersion !== 1
        || !Array.isArray(data.apartments)
        || !data.apartments.every(isValidApartment)
    ) {
        throw new Error("Ce fichier n'est pas une sauvegarde Appart'Tri valide.");
    }
    return data;
}

function applyImport(mode) {
    if (!pendingImport) return;
    if (mode === "replace") {
        apartments = pendingImport.apartments;
    } else {
        const merged = new Map(apartments.map((item) => [item.id, item]));
        pendingImport.apartments.forEach((incoming) => {
            const existing = merged.get(incoming.id);
            if (!existing || new Date(incoming.updatedAt) >= new Date(existing.updatedAt)) {
                merged.set(incoming.id, incoming);
            }
        });
        apartments = [...merged.values()];
    }
    saveApartments();
    resetForm();
    render();
    showMessage(`${pendingImport.apartments.length} appartement(s) importé(s).`);
    pendingImport = null;
}

elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = readForm();
    const now = new Date().toISOString();
    const id = elements.apartmentId.value;

    if (id) {
        const index = apartments.findIndex((item) => item.id === id);
        if (index !== -1) {
            apartments[index] = {
                ...apartments[index],
                ...values,
                updatedAt: now,
            };
        }
        showMessage("Appartement modifié.");
    } else {
        apartments.push({
            id: createId(),
            ...values,
            createdAt: now,
            updatedAt: now,
        });
        showMessage("Appartement ajouté.");
    }

    saveApartments();
    resetForm();
    render();
});

elements.rows.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");
    if (editButton) editApartment(editButton.dataset.editId);
    if (deleteButton) deleteApartment(deleteButton.dataset.deleteId);
});

elements.rows.addEventListener("change", (event) => {
    const select = event.target.closest("[data-status-id]");
    if (select) updateStatus(select.dataset.statusId, select.value);
});

elements.cityFilter.addEventListener("change", render);
elements.sort.addEventListener("change", render);
elements.cancelEdit.addEventListener("click", resetForm);
elements.toggleForm.addEventListener("click", () => {
    elements.form.hidden = !elements.form.hidden;
    elements.toggleForm.textContent = elements.form.hidden
        ? "Afficher le formulaire"
        : "Masquer le formulaire";
});
elements.exportButton.addEventListener("click", exportData);
elements.importButton.addEventListener("click", () => elements.importFile.click());
elements.importFile.addEventListener("change", async () => {
    const [file] = elements.importFile.files;
    if (!file) return;
    try {
        pendingImport = validateBackup(JSON.parse(await file.text()));
        elements.importSummary.textContent =
            `${pendingImport.apartments.length} appartement(s), exportés le ${formatDate(pendingImport.exportedAt)}.`;
        elements.importDialog.showModal();
    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        elements.importFile.value = "";
    }
});
elements.importDialog.addEventListener("close", () => {
    const mode = elements.importDialog.returnValue;
    if (mode === "merge" || mode === "replace") {
        applyImport(mode);
    } else {
        pendingImport = null;
    }
});

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    elements.installButton.hidden = false;
});
elements.installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    elements.installButton.hidden = true;
});
window.addEventListener("appinstalled", () => {
    showMessage("Appart'Tri est installé sur cet appareil.");
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js");
}

updateBackupStatus();
render();
