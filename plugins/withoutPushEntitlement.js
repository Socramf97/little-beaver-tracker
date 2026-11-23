const { withEntitlementsPlist } = require("expo/config-plugins");

// We only use LOCAL notifications, so remove the push entitlement
// that expo-notifications adds automatically.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
