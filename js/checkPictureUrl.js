// 有些網址即使不是圖片副檔名作結尾, 但依然能在網頁上顯示出圖片, 故為了不讓這些資料因為無圖片副檔名而成為遺珠, 故僅判斷網址的開頭是否包含http文字(不區分大小寫); 特例資料:景點主題資料"龍南天然漆博物館-徐玉明"它無PictureUrl1, 但有PictureUrl2和PictureUrl3的狀況, 故在此針對PictureUrl1~3進行判斷, 一旦有抓到http網址就return
let picUrl = '';

function includeSpecialUrl(url){
  // 以下這些近期活動的網址無法顯示出圖片但又包含http開頭, 故在此特別列出並且一旦遇到這些網域開頭的圖片網址, 就將其設為預設無圖片
  const substringsToCheck = [
    "https://www.eastcoast-nsa.gov.tw/zh-tw/",
    "https://drive.google.com/",
    "https://www.facebook.com/",
    "http://cloud.culture.tw/",
    "http://www.northguan-nsa.gov.tw/",
    "https://2022.art-taipei.com/",
    "https://www.taiwantourbus.com.tw/",
    "https://2021.art-taipei.com/taipei/tw/",
    "https://2020.art-taipei.com/taipei/tw/",
    "https://www.pingtungsichongxi2023.com/",
    "https://www.amazing-pingtung.com/",
  ];
  for(let i=0; i < substringsToCheck.length; i++){
    if (url.includes(substringsToCheck[i])){
      return true;
    }
  }
}

function checkPictureUrl(data, image_type) {

  // 若資料內的Picture裡的屬性數量不為0(代表有圖片資料), 則使用正規表達式(/^(http)/i)及其方法test來進行判斷, 正規表達式的前後必有一個/號, ^號代表著"匹配開頭", ?號代表著"前方一個文字是具有可選擇性, 也就是前方的文字為s, 則"s?"代表著可匹配0個或1個前方文字為s的字串, 表示可以匹配"http"或"https"(因彰化縣的餐廳圖片近期已改採https), 而i代表不分英文字母的大小寫; 若資料的Picture裡的屬性數量為0(代表無圖片資料), 或是第一筆圖片資料內的網址內容並不包含http開頭文字, 則預設為無圖片的路徑
  if (Object.keys(data.Picture).length !== 0) {
    // hasOwnProperty內的屬性名稱請記得加上''號
    if(data.Picture.hasOwnProperty('PictureUrl1') && /^https?/i.test(data.Picture.PictureUrl1) && includeSpecialUrl(data.Picture.PictureUrl1) !== true) {
      picUrl = data.Picture.PictureUrl1;
    } else if (data.Picture.hasOwnProperty('PictureUrl2') &&/^https?/i.test(data.Picture.PictureUrl2) && includeSpecialUrl(data.Picture.PictureUrl2) !== true) {
      picUrl = data.Picture.PictureUrl2;
    } else if (data.Picture.hasOwnProperty('PictureUrl3') &&/^https?/i.test(data.Picture.PictureUrl3) && includeSpecialUrl(data.Picture.PictureUrl3) !== true) {
      picUrl = data.Picture.PictureUrl3;
    } else  {
      if(image_type === 'thumbnail'){
        picUrl = './images/sharedImages/none_picture.png';
      }else{
        picUrl = './images/sharedImages/none_banner.png';
      }
    }
  }
   else {
    if(image_type === 'thumbnail'){
      picUrl = './images/sharedImages/none_picture.png';
    }else{
      picUrl = './images/sharedImages/none_banner.png';
    }
  }
  return picUrl;
}

// 用正規表達式判斷是否包含圖片副檔名的方式
// function checkPictureUrl(data) {
//   let picUrl = '';
//   // 因為API裡有些資料的Picture裡的屬性數量為0(代表無圖片資料), 或是第一筆圖片資料內的網址內容並不包含各種圖片副檔名結尾, 則設為預設無圖片的路徑; 使用正規表達式(/\.(png|jpg|jpeg|webp)$/i)及其方法test來進行判斷, 正規表達式的前後必有一個/號, 而\.代表是跳脫字元(\)及一個任意字元(.), 且$號代表著"匹配結尾", 即代表是以png|jpg|jpeg|webp為結尾的字串, 而i代表著不分英文字母的大小寫
//   if (Object.keys(data.Picture).length === 0 || (!/\.(png|jpg|jpeg|webp)$/i.test(data.Picture.PictureUrl1))) {
//     picUrl = './images/sharedImages/none_picture.png';
//   } else {
//     picUrl = data.Picture.PictureUrl1;
//   }
//   return picUrl;
// }

export { checkPictureUrl , includeSpecialUrl};
