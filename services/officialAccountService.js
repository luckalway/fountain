var url = require('url');

const base_url = 'https://api.weixin.qq.com/cgi-bin/';
const appid=APPID
const secret=APPSECRET

var tokenHolder = {};

exports.getAccessToken = function(){
  if(!expire){
    return tokenHolder.access_token
  }


  var url = path.join(base_url,'token');
  axios.get(url, {
    params: {
      grant_type: 'client_credential',
      appid:appid,
      secret:secret

    }
  })
  .then(function (response) {
    tokenHolder = response;
  })
  .catch(function (error) {
    console.log(error);
  });
}

exports.getNews = function(){
  var url = path.join(base_url,'/material/batchget_material');
  var access_token;
  axios.post(url, {
    params: {
      access_token: access_token
    }
  })
}
