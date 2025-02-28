


    
export function subscriptionCache() {
  let cache = [];

  try {
    cache = JSON.parse(localStorage.getItem('subscriptions')) || [];
  } catch (e) {
    return {
      getSubscriptions: function () {
        return [];
      },
      setSubscriptions: function () {}
    };
  }

  return {
    getSubscriptions: function () {
      return cache;
    },
    setSubscriptions: function (subscriptions) {
      if (subscriptions) {
        cache = subscriptions;
        localStorage.setItem('subscriptions', JSON.stringify(cache));
      }
    }
  };
}
    

