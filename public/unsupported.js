(function(){
  if( navigator.userAgent.toLowerCase().indexOf('googlebot') !== -1 ) {
    return;
  }

  var disclaimer = document.createElement('div');
  var app = document.getElementById('app');
  app.appendChild(disclaimer);
  addEventListener('load', function() {
    setTimeout(function() {
      if( app.contains(disclaimer) ) {
        app.innerHTML =
          '<p>Sorry, <strong>AVIF to JPEG "Offline" Batch Converter</strong> is not working properly.</p>'+
          '<p>If you can still see this text even after reloading, perhaps this page does not support your web browser.</p>'+
          '<p>Please consider using the latest version of the modern web browser.</p>'+
          '<p><button onclick="location.reload()">Reload</button></p>'
      }
      disclaimer = null;
      app = null;
    }, 3000);
  });
})();
