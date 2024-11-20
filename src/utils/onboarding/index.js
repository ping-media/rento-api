function getPermissionsForUserType(userType) {
    switch (userType) {
      case 'SUPER_ADMIN':
        return ['ACCOUNT_SETTINGS', 'BRAND_SETTINGS', 'TEAM', 'BILLING'];
      case 'GUEST':
        return ['ACCOUNT_SETTINGS'];
      case 'BRAND_OWNER':
        return ['ACCOUNT_SETTINGS', 'BRAND_SETTINGS'];
      case 'EDITOR':
        return ['ACCOUNT_SETTINGS'];
      case 'MODERATOR':
        return ['ACCOUNT_SETTINGS'];
      default:
        return [];
    }
  }

  
function getBaseUrl(req) {
  if (req.hostname == "localhost") {
    return req.protocol + '://' + req.hostname +`:${process.env.PORT}`
  } else  {
    return req.protocol+'s' + '://' + 'api.socialxperia.ai'
  }
  // http://localhost:8080
} 



  module.exports = {
    getPermissionsForUserType, getBaseUrl
  }