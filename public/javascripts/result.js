// Fetch generated HTML
var html = $('#source').html();

// Put it into iframe for preview
var $iframe = $('#iframe');
$iframe.ready(function() {
  $iframe.contents().find('body').append(html);
  $iframe.contents().find('#tree').on('load', function() {
    $iframe.attr('style', `height: ${$iframe[0].contentWindow.document.body.scrollHeight}px; width:100%`);
    $('.box.control').removeClass('is-loading');
  })
});

// Put it into textarea for copying
$('#target').val(html);
var clipboard = new Clipboard('#copyToClipboard');
clipboard.on('success', function(e) {
    $('#tooltip').show();
    setTimeout(function() {
      $('#tooltip').hide();
    }, 2000)
});