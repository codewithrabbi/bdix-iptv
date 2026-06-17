import { auth, db } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { collection, getDocs, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// DOM Refs
const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");
const loginEmail = document.getElementById("login-email");
const loginPass = document.getElementById("login-pass");
const loginBtn = document.getElementById("login-btn");
const authError = document.getElementById("auth-error");
const logoutBtn = document.getElementById("logout-btn");
const adminUserEmail = document.getElementById("admin-user-email");

const catList = document.getElementById("admin-categories");
const newCatName = document.getElementById("new-cat-name");
const addCatBtn = document.getElementById("add-cat-btn");

const channelList = document.getElementById("admin-channels");
const showAddModalBtn = document.getElementById("show-add-modal-btn");
const deleteSelectedBtn = document.getElementById("delete-selected-btn");
const selectedCount = document.getElementById("selected-count");
const selectAllCheckbox = document.getElementById("select-all-channels");
let selectedChannels = new Set();
const adminFilterCategory = document.getElementById("admin-filter-category");
const adminSearchChannel = document.getElementById("admin-search-channel");
const formPanel = document.getElementById("channel-form-panel");
const formTitle = document.getElementById("form-title");
const saveChannelBtn = document.getElementById("save-channel-btn");
const cancelChannelBtn = document.getElementById("cancel-channel-btn");
const chStatus = document.getElementById("channel-status");

// Form Inputs
const inDocId = document.getElementById("ch-doc-id");
const inId = document.getElementById("ch-id");
const inName = document.getElementById("ch-name");
const inCat = document.getElementById("ch-category");
const inLogo = document.getElementById("ch-logo");
const inStream = document.getElementById("ch-stream");

let CHANNELS = [];
let CATEGORIES = [];

// ── Authentication ─────────────────────────────────────
onAuthStateChanged(auth, (user) => {
  if (user) {
    authSection.style.display = "none";
    dashboardSection.style.display = "flex";
    adminUserEmail.textContent = user.email;
    loadData();
  } else {
    authSection.style.display = "flex";
    dashboardSection.style.display = "none";
  }
});

loginBtn.addEventListener("click", async () => {
  const email = loginEmail.value;
  const pass = loginPass.value;
  try {
    loginBtn.disabled = true;
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (err) {
    authError.textContent = err.message;
  }
  loginBtn.disabled = false;
});

logoutBtn.addEventListener("click", () => signOut(auth));

// ── Custom UI ──────────────────────────────────────────
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  const isError = type === "error";
  const bgColor = isError ? "bg-red-500/10 border-red-500/50 text-red-400" : "bg-emerald-500/10 border-emerald-500/50 text-emerald-400";
  const icon = isError 
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  toast.className = `flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-md transform transition-all duration-300 translate-y-10 opacity-0 ${bgColor}`;
  toast.innerHTML = `${icon} <span class="font-medium text-sm">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.remove("translate-y-10", "opacity-0"), 10);
  setTimeout(() => {
    toast.classList.add("translate-y-10", "opacity-0");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function customConfirm(message, title = "Confirm Action") {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirm-modal");
    document.getElementById("confirm-title").textContent = title;
    document.getElementById("confirm-message").textContent = message;
    const okBtn = document.getElementById("confirm-ok-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    
    modal.classList.remove("hidden");
    setTimeout(() => {
      modal.classList.remove("opacity-0");
      modal.querySelector("div").classList.remove("scale-95");
    }, 10);
    
    const cleanup = () => {
      modal.classList.add("opacity-0");
      modal.querySelector("div").classList.add("scale-95");
      setTimeout(() => modal.classList.add("hidden"), 300);
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    };
    
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

// ── Load Data ──────────────────────────────────────────
function loadData() {
  // Listen to Categories
  onSnapshot(collection(db, "categories"), (snap) => {
    CATEGORIES = [];
    catList.innerHTML = "";
    inCat.innerHTML = '<option value="">-- Select Category --</option>';
    if (adminFilterCategory) adminFilterCategory.innerHTML = '<option value="">All Categories</option>';
    snap.forEach((d) => {
      CATEGORIES.push(d.data().name);
      // Update UI list
      const li = document.createElement("li");
      li.className = "flex justify-between items-center px-4 py-2.5 hover:bg-card-hover rounded-lg group transition-colors";
      li.innerHTML = `
        <span class="font-medium text-slate-200">${d.data().name}</span> 
        <button class="delete opacity-0 group-hover:opacity-100 text-slate-500 hover:text-primary transition-all p-1" data-id="${d.id}" title="Delete">
          <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      `;
      catList.appendChild(li);
      // Update Form select
      const opt = document.createElement("option");
      opt.value = d.data().name;
      opt.textContent = d.data().name;
      inCat.appendChild(opt);
      
      if (adminFilterCategory && d.data().name !== "All") {
        const filterOpt = document.createElement("option");
        filterOpt.value = d.data().name;
        filterOpt.textContent = d.data().name;
        adminFilterCategory.appendChild(filterOpt);
      }
    });
  });

  // Listen to Channels
  const q = query(collection(db, "channels"), orderBy("id", "asc"));
  onSnapshot(q, (snap) => {
    CHANNELS = [];
    snap.forEach((d) => {
      CHANNELS.push({ docId: d.id, ...d.data() });
    });
    renderAdminChannels();
  });
}

// ── Render Admin Channels ──────────────────────────────
function renderAdminChannels() {
  channelList.innerHTML = "";
  const filterText = adminSearchChannel?.value || "";
  const lowerFilter = filterText.toLowerCase();
  const filterCat = adminFilterCategory?.value || "";
  
  CHANNELS.forEach((ch) => {
    if (filterCat && ch.category !== filterCat) return;
    if (filterText && !ch.name.toLowerCase().includes(lowerFilter) && !ch.category.toLowerCase().includes(lowerFilter) && !ch.id.toString().includes(lowerFilter)) {
      return;
    }
    
    const tr = document.createElement("tr");
    tr.className = "hover:bg-card-hover transition-colors group border-b border-border-color last:border-0";
    tr.innerHTML = `
      <td class="px-5 py-3 text-center">
        <input type="checkbox" class="channel-checkbox w-4 h-4 rounded border-border-color cursor-pointer bg-dark accent-primary" value="${ch.docId}" ${selectedChannels.has(ch.docId) ? 'checked' : ''}>
      </td>
      <td class="px-5 py-3 text-slate-400 w-16">${ch.id}</td>
      <td class="px-5 py-3 font-medium text-white">${ch.name}</td>
      <td class="px-5 py-3 text-slate-400">
        <span class="bg-dark border border-border-color px-2 py-1 rounded text-xs">${ch.category}</span>
      </td>
      <td class="px-5 py-3 text-right">
        <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button class="edit text-slate-400 hover:text-blue-400 bg-dark hover:bg-blue-400/10 p-1.5 rounded transition-colors" data-doc="${ch.docId}" title="Edit">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button class="delete text-slate-400 hover:text-primary bg-dark hover:bg-primary/10 p-1.5 rounded transition-colors" data-doc="${ch.docId}" title="Delete">
            <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    channelList.appendChild(tr);
  });
  updateBulkDeleteUI();
}

function updateBulkDeleteUI() {
  const countSpan = document.getElementById("selected-count");
  if (selectedChannels.size > 0) {
    deleteSelectedBtn.classList.remove("hidden");
    deleteSelectedBtn.classList.add("flex");
    if (countSpan) countSpan.textContent = selectedChannels.size;
  } else {
    deleteSelectedBtn.classList.add("hidden");
    deleteSelectedBtn.classList.remove("flex");
  }
  
  const visibleCheckboxes = document.querySelectorAll(".channel-checkbox");
  if (visibleCheckboxes.length > 0) {
    selectAllCheckbox.checked = Array.from(visibleCheckboxes).every(cb => cb.checked);
  } else {
    selectAllCheckbox.checked = false;
  }
}

channelList.addEventListener("change", (e) => {
  if (e.target.classList.contains("channel-checkbox")) {
    if (e.target.checked) {
      selectedChannels.add(e.target.value);
    } else {
      selectedChannels.delete(e.target.value);
    }
    updateBulkDeleteUI();
  }
});

selectAllCheckbox?.addEventListener("change", (e) => {
  const visibleCheckboxes = document.querySelectorAll(".channel-checkbox");
  visibleCheckboxes.forEach(cb => {
    cb.checked = e.target.checked;
    if (e.target.checked) {
      selectedChannels.add(cb.value);
    } else {
      selectedChannels.delete(cb.value);
    }
  });
  updateBulkDeleteUI();
});

deleteSelectedBtn?.addEventListener("click", async () => {
  if (selectedChannels.size === 0) return;
  const isConfirmed = await customConfirm(`Are you sure you want to delete ${selectedChannels.size} selected channels?`, "Delete Channels");
  if (isConfirmed) {
    deleteSelectedBtn.disabled = true;
    const countSpan = document.getElementById("selected-count");
    if (countSpan) countSpan.textContent = "Deleting...";
    
    try {
      const deletePromises = Array.from(selectedChannels).map(docId => 
        deleteDoc(doc(db, "channels", docId))
      );
      await Promise.all(deletePromises);
      selectedChannels.clear();
      updateBulkDeleteUI();
      showToast(`${deletePromises.length} channels deleted successfully`, "success");
    } catch (err) {
      showToast("Error deleting channels: " + err.message, "error");
    }
    
    deleteSelectedBtn.disabled = false;
  }
});

adminSearchChannel?.addEventListener("input", () => renderAdminChannels());
adminFilterCategory?.addEventListener("change", () => renderAdminChannels());
// ── Categories CRUD ────────────────────────────────────
addCatBtn.addEventListener("click", async () => {
  const name = newCatName.value.trim();
  if (!name) return;
  addCatBtn.disabled = true;
  try {
    await setDoc(doc(collection(db, "categories"), name), { name });
    newCatName.value = "";
    showToast("Category added successfully", "success");
  } catch (e) {
    showToast("Error adding category: " + e.message, "error");
  }
  addCatBtn.disabled = false;
});

catList.addEventListener("click", async (e) => {
  if (e.target.classList.contains("delete")) {
    const isConfirmed = await customConfirm("Are you sure you want to delete this category?", "Delete Category");
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, "categories", e.target.dataset.id));
        showToast("Category deleted successfully", "success");
      } catch (err) {
        showToast("Error deleting category: " + err.message, "error");
      }
    }
  }
});

// ── Channels CRUD ──────────────────────────────────────
showAddModalBtn.addEventListener("click", () => {
  formTitle.textContent = "Add New Channel";
  inDocId.value = "";
  inId.value = CHANNELS.length > 0 ? Math.max(...CHANNELS.map(c => c.id)) + 1 : 1;
  inName.value = "";
  inLogo.value = "";
  inStream.value = "";
  chStatus.textContent = "";
  formPanel.style.display = "block";
  formPanel.scrollIntoView({ behavior: "smooth" });
});

cancelChannelBtn.addEventListener("click", () => {
  formPanel.style.display = "none";
});

channelList.addEventListener("click", async (e) => {
  const docId = e.target.dataset.doc;
  if (!docId) return;

  if (e.target.classList.contains("delete")) {
    const isConfirmed = await customConfirm("Are you sure you want to delete this channel?", "Delete Channel");
    if (isConfirmed) {
      try {
        await deleteDoc(doc(db, "channels", docId));
        showToast("Channel deleted successfully", "success");
      } catch (err) {
        showToast("Error deleting channel: " + err.message, "error");
      }
    }
  } else if (e.target.classList.contains("edit")) {
    const ch = CHANNELS.find(c => c.docId === docId);
    if (!ch) return;
    
    formTitle.textContent = "Edit Channel";
    inDocId.value = ch.docId;
    inId.value = ch.id;
    inName.value = ch.name;
    inCat.value = ch.category;
    inLogo.value = ch.logo;
    inStream.value = ch.streamUrl;
    chStatus.textContent = "";
    formPanel.style.display = "block";
    formPanel.scrollIntoView({ behavior: "smooth" });
  }
});

saveChannelBtn.addEventListener("click", async () => {
  const cId = parseInt(inId.value);
  const name = inName.value.trim();
  const cat = inCat.value;
  const logo = inLogo.value.trim();
  const stream = inStream.value.trim();

  if (!cId || !name || !stream) {
    chStatus.textContent = "Error: ID, Name, and Stream URL are required.";
    chStatus.className = "ml-4 text-sm font-medium text-primary";
    return;
  }

  saveChannelBtn.disabled = true;
  chStatus.textContent = "Saving...";
  chStatus.className = "ml-4 text-sm font-medium text-slate-400";

  try {
    const docId = inDocId.value || cId.toString(); // Use existing ID or ID number as doc ID
    await setDoc(doc(db, "channels", docId), {
      id: cId,
      name,
      category: cat,
      logo,
      streamUrl: stream,
      featured: false,
      updatedAt: new Date().toISOString()
    });
    
    showToast("Channel saved successfully!", "success");
    chStatus.textContent = "";
    setTimeout(() => { formPanel.style.display = "none"; }, 1500);
  } catch (err) {
    showToast("Error saving channel: " + err.message, "error");
    chStatus.textContent = "";
  }
  
  saveChannelBtn.disabled = false;
});
