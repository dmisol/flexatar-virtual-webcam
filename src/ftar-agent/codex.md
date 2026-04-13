# Instructions for codex

We are going to create a page that lets users generate and manage links used to talk with an AI assistant.

An example of how this page can be built is in `src/ftar-lens`. Use the same styling and common UI.

There must be two tabs on the page: **Templates** and **Calls**. The **Calls** tab is open by default.

Empty states are required. If a list is empty, show a simple message like: "No records yet."

### UI/Styling Notes
- Buttons use minimal rounded corners (generally square corners).
- Create buttons are round `+` icon buttons.
- Left/right page padding is minimal; the container spans full width.
- Flexatar lists are simple image lists (no padding, no rounded corners).

## Templates tab
The Templates tab shows the list of created templates and a **Create Template** button.


An assistant template has the following fields:
1. Instructions - user must enter via text area
2. Flexatar Id - provided by flexatar chooser. It is vertical scrolling line with images. In /src/ftar-effect there is an example how it can be created
3. Voice Id - hardcoded dropdown list (values in HTML for now)
4. Max talk time - digital input (minutes)
5. About me - user must enter via text area
6. Template Id - internal field, id must be generated randomly
7. Template Name - user must enter in text field
8. My name (which will be shown to the recipient) - user must enter in text field

When the Create button is pressed, a form should appear for the user to fill in.

When the user presses the button to add the template, it must appear in the template list.

There must also be an option to delete a template.
There must also be an option to edit a template. Editing should open the form with data prefilled and replace the existing entry on save.

### Validation (Templates)
- Instructions: required, max 2000 chars
- Flexatar Id: required
- Voice Id: required
- Max talk time: required integer, 1–180 minutes
- About me: optional, max 1000 chars
- Template Name: required, max 100 chars
- My name: required, max 100 chars

### Local storage (Templates)
Templates are stored locally using the popup/manager port and the common handler:
- Store: send `storeJsonWithKey` with `keyPrefix: "_assistant_templates_"`, `keyModifier: ""`, and `json: templatesArray`.
- Retrieve: send `retriveJsonWithKey` with `keyPrefix: "_assistant_templates_"`, `keyModifier: ""`.
- If nothing is stored, the UI should treat it as an empty list.

### Default behavior (Templates)
- If there are no templates stored, preinstall three templates:
  - Apartment Rent
  - Buying a Car
  - Service Questionnaire
- These templates have all fields prefilled (name, instructions, about, voice, max talk time).
- The flexatar for preinstalled templates should default to the first flexatar in the list.
- If a template’s flexatar id is missing or not found, it should be replaced by the first flexatar in the list.
- Template list cards show a flexatar image thumbnail instead of flexatar id.

## Calls tab
There must be a list of created calls with an option to delete a call.

There must be a button for creating a new call.

When it is pressed, the user must fill in the following form. The call form must include template fields and a flexatar chooser, like in the template form.
Template fields must be grouped in a frame together with the template selector.

1. Template Id - selector from existing template list
2. Template fields (auto-filled on template selection):
   - My name
   - Instructions
   - About me
   - Voice Id
   - Max talk time (minutes)
   - Flexatar chooser
3. Additional instructions - user must enter in text area
4. Response list - the list of responses obtained after the agent has spoken with the recipient; must be downloaded from the backend
5. Link name (shown to the user) - user must enter in text area; this name will appear in the call list

Contact Info field is not required and should not be present.
When a template is selected from the dropdown, the template fields must be auto-filled.

Also, for each call there must be buttons for **Get link** and **Refresh responses**.
There must also be an option to edit a call. Editing should open the form with data prefilled and replace the existing entry on save.

### Validation (Calls)
- Template Id: required (must reference an existing template)
- Additional instructions: optional, max 2000 chars
- Link name: required, max 100 chars

### Local storage (Calls)
Calls are stored locally using the popup/manager port and the common handler:
- Store: send `storeJsonWithKey` with `keyPrefix: "_assistant_calls_"`, `keyModifier: ""`, and `json: callsArray`.
- Retrieve: send `retriveJsonWithKey` with `keyPrefix: "_assistant_calls_"`, `keyModifier: ""`.
- If nothing is stored, the UI should treat it as an empty list.

### Backend: Get link
Get link is handled via backend.
- Endpoint: `https://vgen.flexatar-sdk.com/pageapi/get-agent-call-link`
- Method: POST
- Body: JSON with the call parameters gathered in the form (call fields + template fields + flexatar id)
```json
{
  "templateId": "tpl_xxx",
  "additionalInstructions": "Optional",
  "linkName": "Call for John",
  "myName": "Alice",
  "instructions": "Ask about schedule",
  "about": "Optional background",
  "agentLanguage": "English",
  "responseLanguage": "English",
  "voiceId": "alloy",
  "maxTalkTime": 5,
  "flexatarId": "ftar_xxx"
}
```
- Response: `{ dateKey, callId, callLink }`
- The response values must be stored locally in the call entry.
- If a link already exists locally, clicking Get link should return the stored value without calling backend.
- When link is obtained, the Edit button for that entry must be disabled.
- After a link is obtained, show a popup with the link, Copy button, and Close button. When copied, show "Copied" status.

### Backend: Refresh responses
Refresh responses is handled via backend. Define a separate section for the API details here. We will fill it later.
Show a loading indicator while refreshing.

## ManagerClient usage
Use `ManagerClient` to talk to the manager layer (storage, backend actions, ports).

### Create client and listen to messages
1. Create a client with an `incomingMessageHandler`:

```js
import { ManagerClient } from "../../flexatar-package/src/ftar-manager/default-manager-client.js"

const managerClient = new ManagerClient({
  incomingMessageHandler: (msg) => {
    // handle responses here
  },
  onReady: () => {
    // send initial requests here
  }
})
```

2. Send messages with `managerClient.sendMessage(payload, [transferablePorts])`.

### Receiving stored JSON (retriveJsonWithKey)
When you request JSON via `retriveJsonWithKey`, the manager responds on the same channel:

```js
// Request
managerClient.sendMessage({
  retriveJsonWithKey: {
    keyPrefix: "_assistant_templates_",
    keyModifier: ""
  }
})

// Response (inside incomingMessageHandler)
incomingMessageHandler: (msg) => {
  if (msg.retriveJsonWithKey) {
    const { keyPrefix, keyModifier, value } = msg.retriveJsonWithKey
    // value is the parsed JSON or null
  }
}
```

If `value` is `null` or `undefined`, treat it as an empty list in the UI.
