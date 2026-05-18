$(document).ready(function() {
  // Config
  var itemsPerPage = 10;
  var currentPage = 1;

  // Retrieve all elements with the class 'onsale-item'
  var $items = $('.onsale-item');
  var totalItems = $items.length;
  var totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Function to show items for a specific page and update UI controls
  function showPage(page) {
    // Determine slice boundaries
    var startIndex = (page - 1) * itemsPerPage;
    var endIndex = startIndex + itemsPerPage;

    // Hide all items, then reveal the target subset
    $items.hide().slice(startIndex, endIndex).show();

    // Update text indicator
    $('#page-indicator').text('Page ' + page + ' of ' + totalPages);

    // Disable/Enable Previous Button
    if (page <= 1) {
      $('#prev-btn').prop('disabled', true).css('opacity', '0.5');
    } else {
      $('#prev-btn').prop('disabled', false).css('opacity', '1');
    }

    // Disable/Enable Next Button
    if (page >= totalPages) {
      $('#next-btn').prop('disabled', true).css('opacity', '0.5');
    } else {
      $('#next-btn').prop('disabled', false).css('opacity', '1');
    }
  }

  // Next Button Click Event
  $('#next-btn').click(function() {
    if (currentPage < totalPages) {
      currentPage++;
      showPage(currentPage);
      // Optional: scroll back to top of product list
      $('html, body').animate({ scrollTop: $('#product-list').offset().top - 50 }, 200);
    }
  });

  // Previous Button Click Event
  $('#prev-btn').click(function() {
    if (currentPage > 1) {
      currentPage--;
      showPage(currentPage);
      // Optional: scroll back to top of product list
      $('html, body').animate({ scrollTop: $('#product-list').offset().top - 50 }, 200);
    }
  });

  // Initial load
  if (totalItems > 0) {
    showPage(currentPage);
  }
});