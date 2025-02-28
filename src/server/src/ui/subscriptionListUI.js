
import {createSubscriptionElement} from "./createSubscriptionElement.js"
import {subscriptionCache} from "./subscriptionCache.js"


    

export function subscriptionListUI(startLineNumber, authTypeWidth, userWidth, refreshSubscriptionListButtonId, subscriptionListHolderId, fetchSubscriptions, callbacks) {
    const cache = subscriptionCache();
    const subscriptionListHolder = document.getElementById(subscriptionListHolderId);
    const refreshButton = document.getElementById(refreshSubscriptionListButtonId);

    if (!subscriptionListHolder || !refreshButton) {
        return { initError: "Initialization failed: Required DOM elements not found.", addSubscriptionToList: () => {} };
    }

    async function populateSubscriptionList() {
        try {
          subscriptionListHolder.innerHTML = '';
            const subscriptions = await fetchSubscriptions();
            cache.setSubscriptions(subscriptions);
            
            subscriptions.forEach((sub, index) => {
                const { initializationError, container } = createSubscriptionElement(
                    startLineNumber + index,
                    sub.authtype,
                    sub.user,
                    authTypeWidth,
                    userWidth,
                    callbacks,
                    (authtype, user) => {
                        const updatedList = cache.getSubscriptions().filter(item => item.authtype !== authtype || item.user !== user);
                        cache.setSubscriptions(updatedList);
                    }
                );
                if (!initializationError) {
                    subscriptionListHolder.appendChild(container);
                }
            });
        } catch (error) {
            return { initError: "Failed to fetch subscriptions.", addSubscriptionToList: () => {} };
        }
    }

    refreshButton.addEventListener('click', populateSubscriptionList);

    async function init() {
        const cachedSubscriptions = cache.getSubscriptions();
        if (!cachedSubscriptions || cachedSubscriptions.length === 0) {
            await populateSubscriptionList();
        } else {
            cachedSubscriptions.forEach((sub, index) => {
                const { initializationError, container } = createSubscriptionElement(
                    startLineNumber + index,
                    sub.authtype,
                    sub.user,
                    authTypeWidth,
                    userWidth,
                    callbacks,
                    (authtype, user) => {
                        const updatedList = cache.getSubscriptions().filter(item => item.authtype !== authtype || item.user !== user);
                        cache.setSubscriptions(updatedList);
                    }
                );
                if (!initializationError) {
                    subscriptionListHolder.appendChild(container);
                }
            });
        }
    }

    function addSubscriptionToList(authtype, user) {
        const lineNumber = startLineNumber + subscriptionListHolder.children.length;
        const { initializationError, container } = createSubscriptionElement(
            lineNumber,
            authtype,
            user,
            authTypeWidth,
            userWidth,
            callbacks,
            (authtype, user) => {
                const updatedList = cache.getSubscriptions().filter(item => item.authtype !== authtype || item.user !== user);
                cache.setSubscriptions(updatedList);
            }
        );
        if (!initializationError) {
            subscriptionListHolder.appendChild(container);
            const updatedList = cache.getSubscriptions();
            updatedList.push({ authtype, user });
            cache.setSubscriptions(updatedList);
        }
    }

    init();

    return { initError: "", addSubscriptionToList };
}

    

