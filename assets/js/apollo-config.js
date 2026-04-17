const APOLLO_PROXY = 'https://navoiy-api-proxy.vercel.app/api/apollo';
var _apoPage = 1;
var _apoResults = [];
var _apoSelected = new Set();
function getApolloApiKey(){
  return (window._apiKeys && window._apiKeys.apollo) || '';
}
