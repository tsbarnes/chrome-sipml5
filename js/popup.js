/**
 * 
 */

var port = chrome.runtime.connect({
  name: 'popup'
});

$('form').submit(function(event) {
  event.preventDefault();

  port.postMessage({
    type: 'call',
    toaddr: $('#toaddr').val()
  });
});

$('#hangup').click(function(event) {
  event.preventDefault();
  
  port.postMessage({
    type: 'hangup'
  });
});