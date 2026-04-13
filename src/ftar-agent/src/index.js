import { ManagerClient } from "../../flexatar-package/src/ftar-manager/default-manager-client.js"

function log() {
  console.log("[FTAR_AGENT]", ...arguments)
}

const STORAGE_KEYS = {
  templates: "_assistant_templates_",
  calls: "_assistant_calls_",
}

const state = {
  templates: [],
  calls: [],
  selectedFlexatarId: null,
  selectedCallFlexatarId: null,
  defaultFlexatarId: null,
  flexatarList: [],
  templatesSeeded: false,
  editingTemplateId: null,
  editingCallId: null,
  loadingCalls: new Set(),
  loadingLinks: new Set(),
}

const elements = {
  tabCalls: document.getElementById("tabCalls"),
  tabTemplates: document.getElementById("tabTemplates"),
  callsTab: document.getElementById("callsTab"),
  templatesTab: document.getElementById("templatesTab"),
  appContainer: document.getElementById("appContainer"),
  authWarning: document.getElementById("authWarning"),
  createCallBtn: document.getElementById("createCallBtn"),
  callForm: document.getElementById("callForm"),
  templateForm: document.getElementById("templateForm"),
  callFormError: document.getElementById("callFormError"),
  templateFormError: document.getElementById("templateFormError"),
  callsList: document.getElementById("callsList"),
  templatesList: document.getElementById("templatesList"),
  callsEmpty: document.getElementById("callsEmpty"),
  templatesEmpty: document.getElementById("templatesEmpty"),
  callTemplateId: document.getElementById("callTemplateId"),
  callTemplateName: document.getElementById("callTemplateName"),
  saveTemplateFromCallBtn: document.getElementById("saveTemplateFromCallBtn"),
  callAdditionalInstructions: document.getElementById("callAdditionalInstructions"),
  callLinkName: document.getElementById("callLinkName"),
  callMyName: document.getElementById("callMyName"),
  callInstructions: document.getElementById("callInstructions"),
  callAbout: document.getElementById("callAbout"),
  callAgentLanguage: document.getElementById("callAgentLanguage"),
  callResponseLanguage: document.getElementById("callResponseLanguage"),
  callVoiceId: document.getElementById("callVoiceId"),
  callMaxTalk: document.getElementById("callMaxTalk"),
  callFlexatarChooser: document.getElementById("callFlexatarChooser"),
  callFlexatarSelectedPreview: document.getElementById("callFlexatarSelectedPreview"),
  saveCallBtn: document.getElementById("saveCallBtn"),
  cancelCallBtn: document.getElementById("cancelCallBtn"),
  linkModal: document.getElementById("linkModal"),
  linkModalValue: document.getElementById("linkModalValue"),
  linkModalStatus: document.getElementById("linkModalStatus"),
  linkModalCopy: document.getElementById("linkModalCopy"),
  linkModalClose: document.getElementById("linkModalClose"),
  templateName: document.getElementById("templateName"),
  templateMyName: document.getElementById("templateMyName"),
  templateInstructions: document.getElementById("templateInstructions"),
  templateAbout: document.getElementById("templateAbout"),
  templateAgentLanguage: document.getElementById("templateAgentLanguage"),
  templateResponseLanguage: document.getElementById("templateResponseLanguage"),
  templateVoiceId: document.getElementById("templateVoiceId"),
  templateMaxTalk: document.getElementById("templateMaxTalk"),
  flexatarChooser: document.getElementById("flexatarChooser"),
  flexatarSelectedPreview: document.getElementById("flexatarSelectedPreview"),
  saveTemplateBtn: document.getElementById("saveTemplateBtn"),
  cancelTemplateBtn: document.getElementById("cancelTemplateBtn"),
}

const managerClient = new ManagerClient({
  closeButton: document.getElementById("closeButton"),
  incomingMessageHandler: (msg) => {
    handleIncoming(msg)
    log("message from manager", msg)
  },
  onClose: () => {},
  onReady: (connection) => {
    requestTemplates()
    requestCalls()

    connection.ready.then(async () => {
      log("connection to manager ready")
      const list = await connection.getList({ preview: true })
      setFlexatarList(list)
      const currentFtarLink = await connection.getCurrentFtar()
      if (currentFtarLink && currentFtarLink.id) {
        state.defaultFlexatarId = currentFtarLink.id
        if (!state.selectedFlexatarId) {
          state.selectedFlexatarId = currentFtarLink.id
        }
        if (!state.selectedCallFlexatarId) {
          state.selectedCallFlexatarId = currentFtarLink.id
        }
        updateFlexatarSelection()
        updateCallFlexatarSelection()
      }
    })
     managerClient.sendMessage({ isAutorizedRequest: true })

  },
  opts:{
    managerConnection:true
  }
})

function handleIncoming(msg) {
  if (msg.retriveJsonWithKey) {
    const { keyPrefix, value } = msg.retriveJsonWithKey
    if (keyPrefix === STORAGE_KEYS.templates) {
      state.templates = Array.isArray(value) ? value : []
      normalizeTemplateFlexatars()
      renderTemplates()
      refreshTemplateSelect()
      return
    }
    if (keyPrefix === STORAGE_KEYS.calls) {
      state.calls = Array.isArray(value) ? value : []
      renderCalls()
      return
    }
  }

  if (msg.agentCallResponses) {
    const { callId, responses } = msg.agentCallResponses
    updateCallResponses(callId, responses)
  }

  if (msg.agentCallLink) {
    const { callId, link } = msg.agentCallLink
    updateCallLink(callId, link)
  }
  if (msg.isAutorizedResponse) {
    const authorized = msg.isAutorizedResponse.value
    if (elements.authWarning) {
      elements.authWarning.classList.toggle("hidden", authorized)
    }
    if (elements.appContainer) {
      elements.appContainer.classList.toggle("hidden", !authorized)
    }
  }
}

function requestTemplates() {
  managerClient.sendMessage({
    retriveJsonWithKey: {
      keyPrefix: STORAGE_KEYS.templates,
      keyModifier: "",
    },
  })
}

function requestCalls() {
  managerClient.sendMessage({
    retriveJsonWithKey: {
      keyPrefix: STORAGE_KEYS.calls,
      keyModifier: "",
    },
  })
}

function storeTemplates() {
  managerClient.sendMessage({
    storeJsonWithKey: {
      keyPrefix: STORAGE_KEYS.templates,
      keyModifier: "",
      json: state.templates,
    },
  })
}

function storeCalls() {
  managerClient.sendMessage({
    storeJsonWithKey: {
      keyPrefix: STORAGE_KEYS.calls,
      keyModifier: "",
      json: state.calls,
    },
  })
}

function setActiveTab(tabName) {
  const isCalls = tabName === "calls"
  elements.tabCalls.classList.toggle("active", isCalls)
  elements.tabTemplates.classList.toggle("active", !isCalls)
  elements.callsTab.classList.toggle("hidden", !isCalls)
  elements.templatesTab.classList.toggle("hidden", isCalls)
}

function openForm(formEl) {
  formEl.classList.remove("hidden")
}

function closeForm(formEl) {
  formEl.classList.add("hidden")
}

function setFormError(el, message) {
  el.textContent = message || ""
}

function resetTemplateForm() {
  elements.templateName.value = ""
  elements.templateMyName.value = ""
  elements.templateInstructions.value = ""
  elements.templateAbout.value = ""
  elements.templateAgentLanguage.value = "English"
  elements.templateResponseLanguage.value = "English"
  elements.templateVoiceId.value = "alloy"
  elements.templateMaxTalk.value = ""
  state.selectedFlexatarId = state.defaultFlexatarId || null
  state.editingTemplateId = null
  elements.flexatarSelectedPreview.style.backgroundImage = ""
  elements.flexatarSelectedPreview.textContent = ""
  elements.flexatarChooser.querySelectorAll(".chooser-item").forEach((item) => {
    item.classList.remove("selected")
  })
  updateFlexatarSelection()
  setFormError(elements.templateFormError, "")
}

function resetCallForm() {
  elements.callTemplateId.value = ""
  elements.callTemplateName.value = ""
  elements.callAdditionalInstructions.value = ""
  elements.callLinkName.value = ""
  elements.callMyName.value = ""
  elements.callInstructions.value = ""
  elements.callAbout.value = ""
  elements.callAgentLanguage.value = "English"
  elements.callResponseLanguage.value = "English"
  elements.callVoiceId.value = "alloy"
  elements.callMaxTalk.value = "5"
  state.selectedCallFlexatarId = state.defaultFlexatarId || null
  state.editingCallId = null
  elements.callFlexatarSelectedPreview.style.backgroundImage = ""
  elements.callFlexatarSelectedPreview.textContent = ""
  elements.callFlexatarChooser.querySelectorAll(".chooser-item").forEach((item) => {
    item.classList.remove("selected")
  })
  updateCallFlexatarSelection()
  if (elements.saveCallBtn) {
    elements.saveCallBtn.textContent = "Save"
    elements.saveCallBtn.disabled = false
  }
  setFormError(elements.callFormError, "")
}

function generateId(prefix) {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

function validateTemplateData(data) {
  const name = (data.name || "").trim()
  const myName = (data.myName || "").trim()
  const instructions = (data.instructions || "").trim()
  const about = (data.about || "").trim()
  const voiceId = data.voiceId
  const maxTalk = Number(data.maxTalkTime)
  const flexatarId = data.flexatarId
  const agentLanguage = (data.agentLanguage || "").trim()
  const responseLanguage = (data.responseLanguage || "").trim()

  if (!name) return "Template Name is required."
  if (name.length > 100) return "Template Name must be 100 characters or less."
  if (!myName) return "My Name is required."
  if (myName.length > 100) return "My Name must be 100 characters or less."
  if (!instructions) return "Instructions are required."
  if (instructions.length > 20000) return "Instructions must be 20000 characters or less."
  if (about && about.length > 1000) return "About Me must be 1000 characters or less."
  if (!agentLanguage) return "Agent Speech Language is required."
  if (agentLanguage.length > 100) return "Agent Speech Language must be 100 characters or less."
  if (!responseLanguage) return "Response Language is required."
  if (responseLanguage.length > 100) return "Response Language must be 100 characters or less."
  if (!voiceId) return "Voice Id is required."
  if (!Number.isInteger(maxTalk) || maxTalk < 1 || maxTalk > 180) {
    return "Max Talk Time must be a whole number between 1 and 180."
  }
  if (!flexatarId) return "Flexatar Id is required."

  return null
}

function getTemplateFormData() {
  return {
    name: elements.templateName.value.trim(),
    myName: elements.templateMyName.value.trim(),
    instructions: elements.templateInstructions.value.trim(),
    about: elements.templateAbout.value.trim(),
    agentLanguage: elements.templateAgentLanguage.value,
    responseLanguage: elements.templateResponseLanguage.value,
    voiceId: elements.templateVoiceId.value,
    maxTalkTime: Number(elements.templateMaxTalk.value),
    flexatarId: state.selectedFlexatarId,
  }
}

function validateCallInput() {
  const additionalInstructions = elements.callAdditionalInstructions.value.trim()
  const linkName = elements.callLinkName.value.trim()

  if (additionalInstructions.length > 20000) return "Additional Instructions must be 20000 characters or less."
  if (!linkName) return "Link Name is required."
  if (linkName.length > 100) return "Link Name must be 100 characters or less."

  return null
}

function addTemplate() {
  const templateData = getTemplateFormData()
  const error = validateTemplateData(templateData)
  if (error) {
    setFormError(elements.templateFormError, error)
    return
  }

  const template = {
    id: state.editingTemplateId || generateId("tpl"),
    name: templateData.name,
    myName: templateData.myName,
    instructions: templateData.instructions,
    about: templateData.about,
    agentLanguage: templateData.agentLanguage,
    responseLanguage: templateData.responseLanguage,
    voiceId: templateData.voiceId,
    maxTalkTime: templateData.maxTalkTime,
    flexatarId: templateData.flexatarId,
    createdAt: new Date().toISOString(),
  }

  if (state.editingTemplateId) {
    state.templates = state.templates.map((item) => (item.id === state.editingTemplateId ? template : item))
  } else {
    state.templates.unshift(template)
  }
  state.editingTemplateId = null
  storeTemplates()
  renderTemplates()
  refreshTemplateSelect()
  resetTemplateForm()
  closeForm(elements.templateForm)
}

function addCall() {
  const error = validateCallInput()
  if (error) {
    setFormError(elements.callFormError, error)
    return
  }

  const call = {
    id: state.editingCallId || generateId("call"),
    templateId: elements.callTemplateId.value,
    additionalInstructions: elements.callAdditionalInstructions.value.trim(),
    linkName: elements.callLinkName.value.trim(),
    myName: elements.callMyName.value.trim(),
    instructions: elements.callInstructions.value.trim(),
    about: elements.callAbout.value.trim(),
    agentLanguage: elements.callAgentLanguage.value,
    responseLanguage: elements.callResponseLanguage.value,
    voiceId: elements.callVoiceId.value,
    maxTalkTime: Number(elements.callMaxTalk.value) || null,
    flexatarId: state.selectedCallFlexatarId,
    responses: [],
    link: null,
    createdAt: new Date().toISOString(),
  }

  if (state.editingCallId) {
    state.calls = state.calls.map((item) => (item.id === state.editingCallId ? call : item))
  } else {
    state.calls.unshift(call)
  }
  state.editingCallId = null
  storeCalls()
  renderCalls()
  resetCallForm()
  closeForm(elements.callForm)
}

function deleteTemplate(id) {
  state.templates = state.templates.filter((item) => item.id !== id)
  storeTemplates()
  renderTemplates()
  refreshTemplateSelect()
}

function deleteCall(id) {
  state.calls = state.calls.filter((item) => item.id !== id)
  storeCalls()
  renderCalls()
}

function editTemplate(id) {
  const template = state.templates.find((item) => item.id === id)
  if (!template) return
  state.editingTemplateId = id
  setActiveTab("templates")
  openForm(elements.templateForm)
  elements.templateName.value = template.name || ""
  elements.templateMyName.value = template.myName || ""
  elements.templateInstructions.value = template.instructions || ""
  elements.templateAbout.value = template.about || ""
  elements.templateAgentLanguage.value = template.agentLanguage || "English"
  elements.templateResponseLanguage.value = template.responseLanguage || "English"
  elements.templateVoiceId.value = template.voiceId || "alloy"
  elements.templateMaxTalk.value = template.maxTalkTime || ""
  state.selectedFlexatarId = template.flexatarId || state.defaultFlexatarId || (state.flexatarList[0] && state.flexatarList[0].id) || null
  updateFlexatarSelection()
  setFormError(elements.templateFormError, "")
}

function editCall(id) {
  const call = state.calls.find((item) => item.id === id)
  if (!call) return
  state.editingCallId = id
  setActiveTab("calls")
  openForm(elements.callForm)
  elements.callTemplateId.value = call.templateId || ""
  applyTemplateToCallForm(elements.callTemplateId.value)
  elements.callAdditionalInstructions.value = call.additionalInstructions || ""
  elements.callLinkName.value = call.linkName || ""
  elements.callMyName.value = call.myName || ""
  elements.callInstructions.value = call.instructions || ""
  elements.callAbout.value = call.about || ""
  elements.callAgentLanguage.value = call.agentLanguage || "English"
  elements.callResponseLanguage.value = call.responseLanguage || "English"
  elements.callVoiceId.value = call.voiceId || "alloy"
  elements.callMaxTalk.value = call.maxTalkTime || "5"
  state.selectedCallFlexatarId = call.flexatarId || state.defaultFlexatarId || (state.flexatarList[0] && state.flexatarList[0].id) || null
  updateCallFlexatarSelection()
  if (elements.saveCallBtn) {
    elements.saveCallBtn.textContent = "Save"
    elements.saveCallBtn.disabled = Boolean(call.callLink)
  }
  setFormError(elements.callFormError, "")
}

function updateCallResponses(callId, responses) {
  const target = state.calls.find((call) => call.id === callId)
  if (!target) return
  target.responses = Array.isArray(responses) ? responses : []
  storeCalls()
  renderCalls()
}

function updateCallLink(callId, link) {
  const target = state.calls.find((call) => call.id === callId)
  if (!target) return
  target.link = link || null
  storeCalls()
  renderCalls()
}

function requestCallLink(callId) {
  const call = state.calls.find((item) => item.id === callId)
  if (!call) return
  if (call.callLink) {
    showLinkModal(call.callLink)
    return
  }
  state.loadingLinks.add(callId)
  renderCalls()

  fetch("https://vgen.flexatar-sdk.com/pageapi/get-agent-call-link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // callId: call.id,
      templateId: call.templateId,
      additionalInstructions: call.additionalInstructions,
      linkName: call.linkName,
      myName: call.myName,
      instructions: call.instructions,
      about: call.about,
      agentLanguage: call.agentLanguage,
      responseLanguage: call.responseLanguage,
      voiceId: call.voiceId,
      maxTalkTime: call.maxTalkTime,
      flexatarId: call.flexatarId,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to obtain call link")
      }
      const data = await res.json()
      call.dateKey = data.dateKey
      call.callId = data.callId
      call.callLink = data.callLink
      storeCalls()
      renderCalls()
      showLinkModal(call.callLink)
    })
    .catch((err) => {
      console.error(err)
    })
    .finally(() => {
      state.loadingLinks.delete(callId)
      renderCalls()
    })
}

function requestResponses(callId) {
  const call = state.calls.find((item) => item.id === callId)
  if (!call) return
  if (!call.dateKey || !call.callId) {
    console.error("Call info unavailable for responses")
    return
  }
  state.loadingCalls.add(callId)
  renderCalls()
  fetch("https://vgen.flexatar-sdk.com/pageapi/get-agent-talk-result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      date: call.dateKey,
      id: call.callId,
    }),
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error("Failed to obtain call responses")
      }
      const data = await res.json()
      if (data && Array.isArray(data.assertions)) {
        call.assertions = data.assertions
        call.responses = data.assertions
      } else if (data && data.summary) {
        call.responseSummary = data.summary
        call.responses = [data.summary]
      } else {
        call.responseSummary = ""
        call.responses = []
        call.assertions = []
      }
      storeCalls()
      renderCalls()
    })
    .catch((err) => {
      console.error(err)
    })
    .finally(() => {
      state.loadingCalls.delete(callId)
      renderCalls()
    })
}

function renderTemplates() {
  elements.templatesList.innerHTML = ""
  elements.templatesEmpty.classList.toggle("hidden", state.templates.length > 0)

  state.templates.forEach((template) => {
    const card = document.createElement("div")
    card.className = "card"

    const title = document.createElement("div")
    title.className = "card-title"
    title.textContent = template.name

    const meta = document.createElement("div")
    meta.className = "card-meta"
    meta.textContent = `Voice: ${template.voiceId} | Max: ${template.maxTalkTime} min`

    const flexatarThumb = document.createElement("div")
    flexatarThumb.className = "template-flexatar-thumb"
    const previewUrl = getFlexatarPreviewUrl(template.flexatarId)
    if (previewUrl) {
      const img = document.createElement("img")
      img.className = "template-flexatar-image"
      img.src = previewUrl
      img.alt = ""
      img.loading = "lazy"
      img.decoding = "async"
      flexatarThumb.appendChild(img)
    }

    const details = document.createElement("div")
    details.className = "card-meta"
    details.textContent = `My name: ${template.myName}`

    const actions = document.createElement("div")
    actions.className = "card-actions"

    const deleteBtn = document.createElement("button")
    deleteBtn.textContent = "Delete"
    deleteBtn.type = "button"
    deleteBtn.onclick = () => deleteTemplate(template.id)

    const editBtn = document.createElement("button")
    editBtn.textContent = "Edit"
    editBtn.type = "button"
    editBtn.onclick = () => editTemplate(template.id)

    actions.appendChild(deleteBtn)
    actions.appendChild(editBtn)

    card.appendChild(title)
    card.appendChild(meta)
    card.appendChild(flexatarThumb)
    card.appendChild(details)
    card.appendChild(actions)

    elements.templatesList.appendChild(card)
  })
}

function renderCalls() {
  elements.callsList.innerHTML = ""
  elements.callsEmpty.classList.toggle("hidden", state.calls.length > 0)

  state.calls.forEach((call) => {
    const template = state.templates.find((t) => t.id === call.templateId)
    const card = document.createElement("div")
    card.className = "card"

    const title = document.createElement("div")
    title.className = "card-title"
    title.textContent = call.linkName

    const flexatarThumb = document.createElement("div")
    flexatarThumb.className = "template-flexatar-thumb"
    const previewUrl = getFlexatarPreviewUrl(call.flexatarId)
    if (previewUrl) {
      const img = document.createElement("img")
      img.className = "template-flexatar-image"
      img.src = previewUrl
      img.alt = ""
      img.loading = "lazy"
      img.decoding = "async"
      flexatarThumb.appendChild(img)
    }

    const linkBadge = document.createElement("span")
    linkBadge.className = "badge"
    linkBadge.textContent = call.callLink ? `Link ready` : "Link not generated"

    const responsesBlock = document.createElement("div")
    responsesBlock.className = "card-meta"
    responsesBlock.textContent = "Responses:"

    const responsesList = document.createElement("ul")
    responsesList.className = "response-list"

    if (call.responses && call.responses.length > 0) {
      call.responses.forEach((item) => {
        const li = document.createElement("li")
        if (item && typeof item === "object") {
          const agent = typeof item.agent === "string" ? item.agent : ""
          const human = typeof item.human === "string" ? item.human : ""
          const agentSpan = document.createElement("strong")
          agentSpan.textContent = agent
          li.appendChild(agentSpan)
          if (agent && human) {
            li.appendChild(document.createTextNode(" "))
          }
          if (human) {
            li.appendChild(document.createTextNode(human))
          }
        } else {
          li.textContent = String(item)
        }
        responsesList.appendChild(li)
      })
    } else {
      const li = document.createElement("li")
      li.textContent = "No responses yet."
      responsesList.appendChild(li)
    }

    const actions = document.createElement("div")
    actions.className = "card-actions"

    const getLinkBtn = document.createElement("button")
    getLinkBtn.type = "button"
    getLinkBtn.textContent = call.callLink ? "Show link" : "Get link"
    if (state.loadingLinks.has(call.id)) {
      getLinkBtn.disabled = true
      getLinkBtn.classList.add("loading")
    }
    getLinkBtn.onclick = () => requestCallLink(call.id)

    const refreshBtn = document.createElement("button")
    refreshBtn.type = "button"
    refreshBtn.textContent = "Refresh responses"
    if (state.loadingCalls.has(call.id)) {
      refreshBtn.disabled = true
      refreshBtn.classList.add("loading")
    }
    refreshBtn.onclick = () => requestResponses(call.id)

    const editBtn = document.createElement("button")
    editBtn.type = "button"
    editBtn.textContent = call.callLink ? "View" : "Edit"
    editBtn.onclick = () => editCall(call.id)

    const deleteBtn = document.createElement("button")
    deleteBtn.type = "button"
    deleteBtn.textContent = "Delete"
    deleteBtn.onclick = () => deleteCall(call.id)

    actions.appendChild(getLinkBtn)
    actions.appendChild(refreshBtn)
    actions.appendChild(editBtn)
    actions.appendChild(deleteBtn)

    card.appendChild(title)
    card.appendChild(flexatarThumb)
    card.appendChild(linkBadge)
    card.appendChild(responsesBlock)
    card.appendChild(responsesList)
    card.appendChild(actions)

    elements.callsList.appendChild(card)
  })
}

function refreshTemplateSelect() {
  elements.callTemplateId.innerHTML = ""

  if (state.templates.length === 0) {
    const defaultOption = document.createElement("option")
    defaultOption.value = ""
    defaultOption.textContent = "Select template"
    elements.callTemplateId.appendChild(defaultOption)
    clearCallTemplateFields()
    return
  }

  state.templates.forEach((template) => {
    const option = document.createElement("option")
    option.value = template.id
    option.textContent = template.name
    elements.callTemplateId.appendChild(option)
  })

  if (!elements.callTemplateId.value && state.templates.length > 0) {
    elements.callTemplateId.value = state.templates[0].id
  }
  if (elements.callTemplateId.value) {
    applyTemplateToCallForm(elements.callTemplateId.value)
  }
}

function previewToUrl(item) {
  if (!item) return null
  if (item.previewUrl) return item.previewUrl
  if (typeof item.preview === "string") {
    item.previewUrl = item.preview
    return item.previewUrl
  }
  if (item.preview instanceof Blob) {
    item.previewUrl = URL.createObjectURL(item.preview)
    return item.previewUrl
  }
  if (item.preview instanceof ArrayBuffer) {
    item.previewUrl = URL.createObjectURL(new Blob([item.preview], { type: "image/jpeg" }))
    return item.previewUrl
  }
  if (ArrayBuffer.isView(item.preview)) {
    item.previewUrl = URL.createObjectURL(new Blob([item.preview.buffer], { type: "image/jpeg" }))
    return item.previewUrl
  }
  return null
}

function renderFlexatarChooser() {
  elements.flexatarChooser.innerHTML = ""
  state.flexatarList.forEach((option) => {
    const item = document.createElement("div")
    item.className = "chooser-item"
    item.dataset.flexatarId = option.id

    const image = document.createElement("img")
    image.className = "chooser-image"
    image.alt = ""
    image.loading = "lazy"
    image.decoding = "async"

    const previewUrl = previewToUrl(option)
    if (previewUrl) {
      image.src = previewUrl
    } else {
      image.classList.add("chooser-image-placeholder")
    }
    if (previewUrl) {
      item.dataset.previewUrl = previewUrl
    }

    item.appendChild(image)

    item.onclick = () => {
      state.selectedFlexatarId = option.id
      updateFlexatarSelection()
    }

    elements.flexatarChooser.appendChild(item)
  })
  updateFlexatarSelection()
}

function renderCallFlexatarChooser() {
  elements.callFlexatarChooser.innerHTML = ""
  state.flexatarList.forEach((option) => {
    const item = document.createElement("div")
    item.className = "chooser-item"
    item.dataset.flexatarId = option.id

    const image = document.createElement("img")
    image.className = "chooser-image"
    image.alt = ""
    image.loading = "lazy"
    image.decoding = "async"

    const previewUrl = previewToUrl(option)
    if (previewUrl) {
      image.src = previewUrl
      item.dataset.previewUrl = previewUrl
    } else {
      image.classList.add("chooser-image-placeholder")
    }

    item.appendChild(image)

    item.onclick = () => {
      state.selectedCallFlexatarId = option.id
      updateCallFlexatarSelection()
    }

    elements.callFlexatarChooser.appendChild(item)
  })
  updateCallFlexatarSelection()
}

function updateFlexatarSelection() {
  const selectedId = state.selectedFlexatarId || state.defaultFlexatarId
  state.selectedFlexatarId = selectedId
  elements.flexatarChooser.querySelectorAll(".chooser-item").forEach((item) => {
    const isSelected = item.dataset.flexatarId === selectedId
    item.classList.toggle("selected", isSelected)
    if (isSelected) {
      const previewUrl = item.dataset.previewUrl
      if (previewUrl) {
        elements.flexatarSelectedPreview.style.backgroundImage = `url(${previewUrl})`
        elements.flexatarSelectedPreview.style.backgroundSize = "cover"
        elements.flexatarSelectedPreview.style.backgroundPosition = "center"
      } else {
        elements.flexatarSelectedPreview.style.backgroundImage = ""
      }
    }
  })
  if (!selectedId) {
    elements.flexatarSelectedPreview.style.backgroundImage = ""
  }
}

function updateCallFlexatarSelection() {
  const selectedId = state.selectedCallFlexatarId || state.defaultFlexatarId
  state.selectedCallFlexatarId = selectedId
  elements.callFlexatarChooser.querySelectorAll(".chooser-item").forEach((item) => {
    const isSelected = item.dataset.flexatarId === selectedId
    item.classList.toggle("selected", isSelected)
    if (isSelected) {
      const previewUrl = item.dataset.previewUrl
      if (previewUrl) {
        elements.callFlexatarSelectedPreview.style.backgroundImage = `url(${previewUrl})`
        elements.callFlexatarSelectedPreview.style.backgroundSize = "cover"
        elements.callFlexatarSelectedPreview.style.backgroundPosition = "center"
      } else {
        elements.callFlexatarSelectedPreview.style.backgroundImage = ""
      }
    }
  })
  if (!selectedId) {
    elements.callFlexatarSelectedPreview.style.backgroundImage = ""
  }
}

function setFlexatarList(list) {
  state.flexatarList = Array.isArray(list) ? list : []
  renderFlexatarChooser()
  renderCallFlexatarChooser()
  normalizeTemplateFlexatars()
  renderTemplates()
  renderCalls()
}

function trySeedTemplates() {
  return
}

function normalizeTemplateFlexatars() {
  if (state.flexatarList.length === 0) return
  let changed = false
  const fallbackId = state.flexatarList[0].id
  state.templates.forEach((template) => {
    const exists = template.flexatarId && state.flexatarList.find((item) => item.id === template.flexatarId)
    if (!exists) {
      template.flexatarId = fallbackId
      changed = true
    }
  })
  if (changed) {
    storeTemplates()
  }
}

function getFlexatarPreviewUrl(flexatarId) {
  if (!flexatarId) return null
  const item = state.flexatarList.find((entry) => entry.id === flexatarId)
  return item ? previewToUrl(item) : null
}

function applyTemplateToCallForm(templateId) {
  const template = state.templates.find((item) => item.id === templateId)
  if (!template) {
    clearCallTemplateFields()
    return
  }
  elements.callMyName.value = template.myName || ""
  elements.callInstructions.value = template.instructions || ""
  elements.callAbout.value = template.about || ""
  elements.callAgentLanguage.value = template.agentLanguage || "English"
  elements.callResponseLanguage.value = template.responseLanguage || "English"
  elements.callVoiceId.value = template.voiceId || "alloy"
  elements.callMaxTalk.value = template.maxTalkTime || ""
  const fallbackId = state.flexatarList[0] && state.flexatarList[0].id
  const validFlexatar = template.flexatarId && state.flexatarList.find((item) => item.id === template.flexatarId)
  state.selectedCallFlexatarId = validFlexatar ? template.flexatarId : (fallbackId || null)
  updateCallFlexatarSelection()
}

function clearCallTemplateFields() {
  elements.callTemplateName.value = ""
  elements.callMyName.value = ""
  elements.callInstructions.value = ""
  elements.callAbout.value = ""
  elements.callAgentLanguage.value = "English"
  elements.callResponseLanguage.value = "English"
  elements.callVoiceId.value = "alloy"
  elements.callMaxTalk.value = "5"
  state.selectedCallFlexatarId = state.defaultFlexatarId || (state.flexatarList[0] && state.flexatarList[0].id) || null
  updateCallFlexatarSelection()
}

function saveTemplateFromCall() {
  const flexatarId = state.selectedCallFlexatarId || state.defaultFlexatarId || (state.flexatarList[0] && state.flexatarList[0].id) || null
  const templateData = {
    name: elements.callTemplateName.value.trim(),
    myName: elements.callMyName.value.trim(),
    instructions: elements.callInstructions.value.trim(),
    about: elements.callAbout.value.trim(),
    agentLanguage: elements.callAgentLanguage.value,
    responseLanguage: elements.callResponseLanguage.value,
    voiceId: elements.callVoiceId.value,
    maxTalkTime: Number(elements.callMaxTalk.value),
    flexatarId,
  }
  const error = validateTemplateData(templateData)
  if (error) {
    setFormError(elements.callFormError, error)
    return
  }

  const template = {
    id: generateId("tpl"),
    name: templateData.name,
    myName: templateData.myName,
    instructions: templateData.instructions,
    about: templateData.about,
    agentLanguage: templateData.agentLanguage,
    responseLanguage: templateData.responseLanguage,
    voiceId: templateData.voiceId,
    maxTalkTime: templateData.maxTalkTime,
    flexatarId: templateData.flexatarId,
    createdAt: new Date().toISOString(),
  }

  state.templates.unshift(template)
  storeTemplates()
  renderTemplates()
  refreshTemplateSelect()
  elements.callTemplateId.value = template.id
  applyTemplateToCallForm(template.id)
  elements.callTemplateName.value = ""
  setFormError(elements.callFormError, "")
}

function initEvents() {
  elements.tabCalls.onclick = () => setActiveTab("calls")
  elements.tabTemplates.onclick = () => setActiveTab("templates")

  elements.createCallBtn.onclick = () => {
    resetCallForm()
    openForm(elements.callForm)
  }
  elements.cancelCallBtn.onclick = () => {
    resetCallForm()
    closeForm(elements.callForm)
  }
  elements.saveCallBtn.onclick = () => addCall()
  elements.callTemplateId.onchange = () => {
    applyTemplateToCallForm(elements.callTemplateId.value)
  }
  if (elements.saveTemplateFromCallBtn) {
    elements.saveTemplateFromCallBtn.onclick = () => saveTemplateFromCall()
  }

  elements.cancelTemplateBtn.onclick = () => {
    resetTemplateForm()
    closeForm(elements.templateForm)
  }
  elements.saveTemplateBtn.onclick = () => addTemplate()

  if (elements.linkModalClose) {
    elements.linkModalClose.onclick = () => hideLinkModal()
  }
  if (elements.linkModal) {
    elements.linkModal.onclick = (e) => {
      if (e.target === elements.linkModal) hideLinkModal()
    }
  }
  if (elements.linkModalCopy) {
    elements.linkModalCopy.onclick = () => copyLinkFromModal()
  }
}

function init() {
  setActiveTab("calls")
  renderFlexatarChooser()
  initEvents()
  renderTemplates()
  renderCalls()
  refreshTemplateSelect()
}

function showLinkModal(link) {
  if (!elements.linkModal || !elements.linkModalValue) return
  elements.linkModalValue.textContent = link || ""
  if (elements.linkModalStatus) {
    elements.linkModalStatus.textContent = ""
  }
  elements.linkModal.classList.remove("hidden")
}

function hideLinkModal() {
  if (!elements.linkModal) return
  elements.linkModal.classList.add("hidden")
}

async function copyLinkFromModal() {
  if (!elements.linkModalValue) return
  const link = elements.linkModalValue.textContent || ""
  if (!link) return
  try {
    await navigator.clipboard.writeText(link)
    if (elements.linkModalStatus) {
      elements.linkModalStatus.textContent = "Copied"
    }
  } catch (e) {
    const temp = document.createElement("textarea")
    temp.value = link
    document.body.appendChild(temp)
    temp.select()
    document.execCommand("copy")
    temp.remove()
    if (elements.linkModalStatus) {
      elements.linkModalStatus.textContent = "Copied"
    }
  }
}

init()
