// 手機「加入主畫面」的圖示需要 PNG：把 SVG 圖示即時轉成 180x180 PNG
// （由 index.html 內嵌腳本抽出成獨立檔案，以便 CSP 禁止 inline script）
(function () {
  try {
    var img = new Image();
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = 180;
      c.height = 180;
      c.getContext('2d').drawImage(img, 0, 0, 180, 180);
      var link = document.querySelector('link[rel="apple-touch-icon"]');
      if (link) link.href = c.toDataURL('image/png');
    };
    img.src = '/favicon.svg';
  } catch (e) {}
})();
