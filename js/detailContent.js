import { checkAPIToken } from './getAPIToken.js';
import { getRandomNumber } from './randomNumber.js';
import { keywordsToExclude } from './keywordsToExclude.js';
import { getRegionOfAddress } from './getRegionOfAddress.js';
import { checkPictureUrl, includeSpecialUrl } from './checkPictureUrl.js';
import { getDate } from './getDate.js';
import { callCategoryDataAPI } from './callCategoryDataAPI.js';
import { proxyOfURL } from './proxyOfURL.js';

let getAPIToken = '';
const category = ['ScenicSpot', 'Activity', 'Restaurant', 'Hotel'];
let resData = [];
let sameCityData = [];
let regionName = '';
let categoryChineseName = '';
let randomNumArr = [];
const today = getDate();
const content = document.querySelector('.content');
const description = document.querySelector('.description');
const topicTitleDiv = document.querySelector('.topic-title');
const infoMapDiv = document.querySelector('.information-map');

const categoryContrast = {
  ScenicSpot: '探索景點',
  Activity: '近期活動',
  Restaurant: '品嚐美食',
  Hotel: '安心住宿'
};

const ScenicSpotInfoContrast = {
  OpenTime: '開放時間',
  Phone: '服務電話',
  Address: '景點地址',
  TicketInfo: '票價資訊',
  WebsiteUrl: '官方網站',
  ParkingInfo: '停車資訊',
  TravelInfo: '交通指引',
  Remarks: '注意事項'
};

const ActivityInfoContrast = {
  StartTime: '起始時間',
  EndTime: '結束時間',
  City: '縣市名稱',
  Organizer: '主辦單位',
  Phone: '服務電話',
  Location: '活動地點',
  Address: '詳細地址',
  WebsiteUrl: '官方網站',
  ParkingInfo: '停車資訊',
  TravelInfo: '交通指引',
  Remarks: '注意事項'
};

const RestaurantInfoContrast = {
  City: '縣市名稱',
  OpenTime: '開放時間',
  Phone: '商家電話',
  Address: '詳細地址',
  ParkingInfo: '停車資訊',
  WebsiteUrl: '官方網站',
};

const HotelInfoContrast = {
  City: '縣市名稱',
  Address: '詳細地址',
  Phone: '商家電話',
  Fax: '傳真號碼',
  Grade: '旅館星級',
  Spec: '房間價位',
  ParkingInfo: '停車資訊',
  ServiceInfo: '相關服務',
  WebsiteUrl: '官方網站'
};
// 引用套件--Swiper圖片輪播
const swiper = new Swiper(".mySwiper", {
  spaceBetween: 30,
  centeredSlides: true,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    prevEl: ".left-narrow",
    nextEl: ".right-narrow",
  },
});
// 透過使用屬性名稱來取得URL裡參數的值
const selectedCategory = proxyOfURL.Category;
const id = proxyOfURL.ID;
// console.log('selectedCategory=', selectedCategory);
// console.log('ID=', id);

async function getAPIData() {
  getAPIToken = await checkAPIToken();
  let queryStatement = '';

  if (selectedCategory === category[0]) {
    // 組合出查詢語句(ScenicSpot主題適用)
    queryStatement = `$select=ScenicSpotID,ScenicSpotName,Picture,Class1,Class2,Class3,DescriptionDetail,Position,OpenTime,Phone,City,Address,TicketInfo,WebsiteUrl,ParkingInfo,TravelInfo,Remarks&$filter=contains(${selectedCategory}ID, '${id}')&$format=JSON`;
  } else if (selectedCategory === category[1]) {
    // 組合出查詢語句(Activity主題適用)
    queryStatement = `$select=ActivityID,ActivityName,Picture,Class1,Class2,Description,Position,StartTime,EndTime,City,Address,Location,Organizer,Phone,WebsiteUrl,ParkingInfo,TravelInfo,Remarks&$filter=contains(${selectedCategory}ID, '${id}')&$format=JSON`;
  } else if (selectedCategory === category[2]) {
    // 組合出查詢語句(Restaurant主題適用)
    queryStatement = `$select=RestaurantID,RestaurantName,Picture,Class,Description,Position,City,Address,OpenTime,Phone,ParkingInfo,WebsiteUrl&$filter=contains(${selectedCategory}ID, '${id}')&$format=JSON`;
  } else
    // 組合出查詢語句(Hotel主題適用)
    queryStatement = `$select=HotelID,HotelName,Picture,Class,Description,Position,City,Address,Phone,Fax,Grade,Spec,ServiceInfo,ParkingInfo,WebsiteUrl&$filter=contains(${selectedCategory}ID, '${id}')&$format=JSON`;

  let res = await callCategoryDataAPI(getAPIToken, selectedCategory, queryStatement);
  return res;
}

function renderDataToWeb() {
  renderBreadcrumb();
  renderBanner();
  renderTitle();
  renderBadge();
  renderIntroTitle();
  renderDetailIntro();
  // 動態產生資訊欄(景點/活動/餐廳/旅宿的項目各有不同)
  renderInformation();
  // 動態更新Google map座標
  renderMap();
  // 動態更新更多同縣市的資訊之標題與超連結
  renderMoreThings();
};

// 渲染麵包屑內容
function renderBreadcrumb() {
  // 取得<ul>元素內的各筆a元素
  const breadcrumbList = document.querySelectorAll('.breadcrumb a');

  // 更新麵包屑的內容
  Object.keys(categoryContrast).forEach((key) => {
    if (key === selectedCategory) {
      // 將麵包屑的主題名稱顯示為該筆資料所屬的主題
      breadcrumbList[1].textContent = categoryContrast[key];
      breadcrumbList[1].href = `./${key}.html`;
      categoryChineseName = categoryContrast[key];

      // 通常各類資料以City為主即可, 但近期活動特有Location屬性, 故一併納入判斷, 藉此提高解析出縣市名稱的成功率
      if (resData[0].hasOwnProperty('City') || resData[0].hasOwnProperty('Address') || resData[0].hasOwnProperty('Location')) {
        // 將該筆資料完整的倒入getRegionOfAddress()內, 解析其縣市名稱
        const addressSlice = getRegionOfAddress(resData[0]);
        breadcrumbList[2].textContent = addressSlice;
        breadcrumbList[2].href = `./searchResult.html?Category=${selectedCategory}&City=${addressSlice}&SelectedDate=${today}`;
      } else {
        breadcrumbList[2].textContent = '詳情如內';
        breadcrumbList[2].href = `./${key}.html`;
      }
      regionName = breadcrumbList[2].textContent;
      // 麵包屑的資料名稱顯示為該筆資料名稱
      breadcrumbList[3].textContent = resData[0][`${key}Name`];
      breadcrumbList[3].style.color = `Black`;
    }
  });
}

// 渲染Banner圖片(此Banner必須將該筆資料內所有圖片網址都撈出來, 而首頁Banner是一個景點僅抓一筆圖片網址不同)
function renderBanner() {
  const slideContainer = document.querySelector('.swiper-wrapper');
  const pictureUrlArr = [];
  const pictureDescArr = [];

  // 檢查該筆資料是否擁有Picture屬性
  if (resData[0].hasOwnProperty('Picture')) {
    // 檢查該筆資料內是否具有圖片資料
    if (Object.keys(resData[0].Picture).length !== 0) {
      // 檢查該筆資料內, 每一筆圖片資料是否包含網址或圖片描述
      Object.keys(resData[0].Picture).forEach((item) => {
        // 因為已確定具有圖片資料(圖片網址或圖片描述), 故若是圖片網址則走if敘述(用函式檢查圖片網址是否以http作為開頭), 否則就是圖片描述, 故走false敘述
        if (item.includes('PictureUrl')) {
          // 檢查看看圖片網址的網域是否為特定的幾個網域開頭, 若是則因為那些網域無法呈現出圖片, 故直接改成預設無圖片的banner圖片
          if (includeSpecialUrl(resData[0].Picture[item])) {
            pictureUrlArr.push('./images/sharedImages/none_banner.png');
          } else {
            pictureUrlArr.push(resData[0].Picture[item]);
          }
        } else {
          pictureDescArr.push(resData[0].Picture[item]);
        }
      });
    } else {
      pictureUrlArr.push('./images/sharedImages/none_banner.png');
      pictureDescArr.push('因此筆資料沒有提供圖片, 故顯示預設空的圖片');
    }


    // 檢查是否有提供圖片網址且圖片網址是否包含http(/https)
    // if (Object.keys(resData[0].Picture).length === 0 || !resData[0].Picture.PictureUrl1.includes('http')) {
    //   pictureUrlArr.push('./images/sharedImages/none_banner.png');
    // } else {
    //   // 將資料內所有的圖片網址及圖片描述分別取出來
    //   Object.keys(resData[0].Picture).forEach((key) => {
    //     if (key.includes('PictureUrl')) {
    //       pictureUrlArr.push(resData[0].Picture[key]);
    //     }
    //     if (key.includes('PictureDescription')) {
    //       pictureDescArr.push(resData[0].Picture[key]);
    //     }
    //   });
    // }
  } else {
    pictureUrlArr.push('./images/sharedImages/none_banner.png');
    pictureDescArr.push('因此筆資料沒有提供圖片, 故顯示預設空的圖片');
  }

  // 動態產生banner的圖片元素
  pictureUrlArr.forEach((item, index) => {
    const img = document.createElement('img');
    img.className = 'banner-img';
    img.src = item;
    img.width = 1110;
    img.height = 400;
    // 如果沒有圖片描述, 則使用圖片資料的名稱作為替代
    if (pictureDescArr[index] !== undefined) {
      img.alt = pictureDescArr[index];
    } else {
      img.alt = resData[0][`${selectedCategory}Name`];
    }

    // 動態產生banner元素的容器, 並且將圖片元素加入其中
    const swiperSlide = document.createElement('swiper-slide');
    swiperSlide.className = 'swiper-slide banner';
    swiperSlide.appendChild(img);
    // 記得要把建構好的元素加入既有的slideContainer元素內, 才能顯示在畫面上
    slideContainer.appendChild(swiperSlide);
  });
}

// 渲染資料標題(例如: 阿里山神木群)
function renderTitle() {
  const h2 = document.createElement('h2');
  h2.className = 'title';
  h2.textContent = resData[0][`${selectedCategory}Name`];
  // 記得要把建構好的元素加入既有的content元素內, 才能顯示在畫面上
  content.appendChild(h2);
}

// 渲染分類標籤(badge)
function renderBadge() {
  const h3 = document.createElement('h3');
  h3.className = 'badge';

  // 將資料內所有的Class(分類名稱)取出來, 景點類Class1~3, 活動類有Class1~2, 餐廳及旅宿只有Class
  Object.keys(resData[0]).forEach((key) => {
    let badgeContent = '';
    let classLevel = '';

    if (key === 'Class' && resData[0].Class.trim() !== '') {
      badgeContent = resData[0].Class;
      classLevel = 'Class';
    } else if (key === 'Class1' && resData[0].Class1.trim() !== '') {
      badgeContent = resData[0].Class1;
      classLevel = 'Class1';
    } else if (key === 'Class2' && (resData[0].Class2 !== resData[0].Class1)) {
      badgeContent = resData[0].Class2;
      classLevel = 'Class2';
    } else if (key === 'Class3' && (resData[0].Class3 !== resData[0].Class2)) {
      badgeContent = resData[0].Class3;
      classLevel = 'Class3';
    } else {
      // 無須執行任何動作
    }
    if (classLevel !== '') {
      const a = document.createElement('a');
      a.className = 'badge-class';
      a.href = `./searchResult.html?Category=${selectedCategory}&City=${regionName}&${classLevel}=${badgeContent}&SelectedDate=${today}`;
      a.textContent = `# ${badgeContent}`;
      a.setAttribute('aria-label', `前往標籤與${badgeContent}有關的資料畫面`);
      h3.appendChild(a);
      // 記得要把建構好的元素加入既有的content元素內, 才能顯示在畫面上
      content.appendChild(h3);
    }
  });
}

// 渲染資料介紹的標題(景點介紹將可動態改成活動/餐廳/旅宿介紹)
function renderIntroTitle() {
  const divTitle = document.createElement('div');
  divTitle.className = 'title';
  divTitle.textContent = `${categoryChineseName.slice(2, 4)}介紹：`;
  description.appendChild(divTitle);
  // 記得要把.description加入.content內
  content.appendChild(description);
}

// 渲染詳細介紹的內容
function renderDetailIntro() {
  const p = document.createElement('p');
  let descName = '';
  if (selectedCategory === category[0]) {
    //ScenicSpot主題適用
    descName = 'DescriptionDetail';
  } else {
    //Activity, Restaurant及Hotel主題適用
    descName = 'Description';
  }
  p.textContent = resData[0][`${descName}`];
  description.appendChild(p);
}

// 渲染資訊欄內容
function renderInformation() {
  const infoList = document.createElement('ul');
  infoList.className = 'information';
  let infoContract = {};

  if (selectedCategory === category[0]) {
    infoContract = ScenicSpotInfoContrast;
  } else if (selectedCategory === category[1]) {
    infoContract = ActivityInfoContrast;
  } else if (selectedCategory === category[2]) {
    infoContract = RestaurantInfoContrast;
  } else {
    infoContract = HotelInfoContrast;
  }

  // 以分類主題所想要呈現的幾個重點項目為主, 若是從API撈回來的該筆資料內的該項目有值, 則將其顯示於畫面上
  Object.keys(infoContract).forEach((key) => {
    if (resData[0][key] !== undefined) {
      const li = document.createElement('li');
      const span = document.createElement('span');
      const a = document.createElement('a');

      if (key === 'Phone') {
        a.href = 'tel:' + resData[0][key];
        a.setAttribute('aria-label', '撥打這隻電話號碼');
        a.textContent = resData[0][key];
        span.class = 'phone';
        span.appendChild(a);
      } else if (key === 'Address') {
        a.href = `https://maps.google.com?q=${resData[0][key]}`;
        a.target = '_blank';
        a.setAttribute('aria-label', '所在地址');
        a.textContent = resData[0][key];
        span.className = 'address';
        span.appendChild(a);
      } else if (key === 'WebsiteUrl') {
        a.href = resData[0][key];
        a.target = '_blank';
        a.setAttribute('aria-label', '官方網站網址');
        a.textContent = resData[0][key];
        span.className = 'website-url';
        span.appendChild(a);
      } else if (key === 'StartTime') {
        let timeArr = [];
        let startTime = '';
        timeArr = resData[0][key].split('T');
        startTime = timeArr[0] + ' ' + timeArr[1].substring(0, 8);
        span.textContent = startTime;
      } else if (key === 'EndTime') {
        let timeArr = [];
        let endTime = '';
        timeArr = resData[0][key].split('T');
        endTime = timeArr[0] + ' ' + timeArr[1].substring(0, 8);
        span.textContent = endTime;
      } else {
        span.textContent = resData[0][key];
      }
      // li.textContent = ScenicSpotInfoContrast[key] + '：';
      li.textContent = infoContract[key] + '：';
      li.appendChild(span);
      infoList.appendChild(li);
    }
  });

  infoMapDiv.appendChild(infoList);
  content.appendChild(infoMapDiv);
}

// 渲染地圖
function renderMap() {
  const iframe = document.createElement('iframe');
  iframe.className = 'map';
  iframe.width = 535;
  iframe.height = 450;
  iframe.setAttribute('frameborder', 0);
  iframe.style.border = 0;
  iframe.src = `https://www.google.com/maps/embed/v1/place?key=AIzaSyCAQktK7D_aagWOuUPpo4pbDJi3r6i8C0U&q='${resData[0][`${selectedCategory}Name`]}'&center=${resData[0].Position.PositionLat},${resData[0].Position.PositionLon}&zoom=15`
  infoMapDiv.appendChild(iframe);
}

// 渲染標題"還有這些不能錯過的景點/活動/餐廳/住宿"及縣市名稱超連結
function renderMoreThings() {
  // 還有這些不能錯過的"景點/活動/餐廳/住宿"(標題)
  const h4 = document.createElement('h4');
  h4.textContent = '還有這些不能錯過的' + categoryChineseName.slice(2, 4);
  topicTitleDiv.appendChild(h4);

  const a = document.createElement('a');
  a.href = `./searchResult.html?Category=${selectedCategory}&City=${regionName}&SelectedDate=${today}`;
  a.setAttribute('aria-label', '取得更多此縣市的資訊');
  a.textContent = `更多${regionName}${categoryChineseName.slice(2, 4)} >`;
  topicTitleDiv.appendChild(a);
}

async function getSameCityData() {
  const keywordsExcludeStatement = keywordsToExclude(selectedCategory);
  let queryStatement = '';

  queryStatement = `$select=${selectedCategory}ID,${selectedCategory}Name,City,Address,Picture&$filter=contains(City, '${regionName}') and not contains(${selectedCategory}ID,'${resData[0][`${selectedCategory}ID`]}') ${keywordsExcludeStatement}&$format=JSON`;

  // 若是"近期活動"主題, 則活動結束日期必須大於今日日期(使用TDX提供的OData搜尋語法指令'gt'超過...)
  if (selectedCategory === category[1]) {
    queryStatement = `$select=${selectedCategory}ID,${selectedCategory}Name,City,Address,Picture&$filter=contains(City, '${regionName}') and not contains(${selectedCategory}ID,'${resData[0][`${selectedCategory}ID`]}') and date(EndTime) gt ${today} ${keywordsExcludeStatement}&$format=JSON`;
  }

  let res = await callCategoryDataAPI(getAPIToken, selectedCategory, queryStatement);
  return res;
}

// 渲染與本頁資料同一縣市的景點/活動/餐廳/旅宿資料到畫面上
function renderSameCityData(randomNumArr) {
  const ulList = document.querySelector('.list');

  // 把取回來的資料渲染到元素中
  randomNumArr.forEach((item) => {
    let picUrl = '';
    let addressSlice = '';

    addressSlice = getRegionOfAddress(sameCityData[item]);

    // 檢查圖片網址是否存在, 且網址是否以為http作為開頭
    picUrl = checkPictureUrl(sameCityData[item], 'thumbnail');

    const li = document.createElement('li');
    li.className = 'card';

    const a = document.createElement('a');
    a.href = `./detailContent.html?Category=${selectedCategory}&ID=${sameCityData[item][`${selectedCategory}ID`]}`;
    a.setAttribute('aria-label', '查看更多有關此資料的詳細內容');

    const photoDiv = document.createElement('div');
    photoDiv.className = 'photo';

    const img = document.createElement('img');
    img.src = picUrl;
    img.width = 255;
    img.height = 200;
    img.alt = sameCityData[item][`${selectedCategory}Name`];

    photoDiv.appendChild(img);
    a.appendChild(photoDiv);
    li.appendChild(a);

    const span = document.createElement('span');
    span.className = 'name';
    span.textContent = sameCityData[item][`${selectedCategory}Name`];
    li.appendChild(span);

    const locationDiv = document.createElement('div');
    locationDiv.className = 'location';

    const i = document.createElement('i');
    i.className = 'fa-solid fa-location-dot location-icon';

    const locationNameDiv = document.createElement('div');
    locationNameDiv.className = 'location-name';
    locationNameDiv.textContent = addressSlice;

    i.appendChild(locationNameDiv);
    locationDiv.appendChild(i);

    li.appendChild(locationDiv);

    ulList.appendChild(li);
  });
}

async function getDataAndRender() {

  resData = await getAPIData();
  renderDataToWeb();
  sameCityData = await getSameCityData();

  // 假如相同縣市的資料(不包含當前這個)大於4個, 則上限是列出4筆隨機資料
  if (sameCityData.length !== 0 && sameCityData.length >= 4) {
    randomNumArr = getRandomNumber(sameCityData.length, 4);
    renderSameCityData(randomNumArr);
  }
  // 假如相同縣市的資料(不包含當前這個)小於4個, 則上限是列出相同縣市的最高筆數(1/2/3筆)的隨機資料
  else if (sameCityData.length !== 0 && sameCityData.length < 4) {
    randomNumArr = getRandomNumber(sameCityData.length, sameCityData.length);
    renderSameCityData(randomNumArr);
  }
  // 假如相同縣市的資料(不包含當前這個)為0個, 則不印出資料
  else {
    const noneSameCityData = document.querySelector('.hot-spots');
    noneSameCityData.style.display = 'none';
    // console.log('無相同縣市資料');
  }
}

getDataAndRender();