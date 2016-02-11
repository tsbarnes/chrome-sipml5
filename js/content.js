/**
 * Click-to-call
 */

/**
 * Vars
 */

var numberRegex = /^(\+\d\d)?(\s?\(00?\)\s?)?(\d(\s|-|\(|\))?){6,13}/;
var nodeRegex = /(SCRIPT|STYLE|INPUT|SELECT|TEXTAREA|SIPML-CALL)/;
var spaceRegex = /\s/g;

/**
 * Search dom for phone numbers
 */

var search = function (node) {
  if (node.nodeName.match(nodeRegex))
    return;

  var children = node.childNodes;
  for (var i = 0, len = children.length; i < len; i++) {
    var child = children[i];

    // Recurse
    if (child.childNodes.length) {
      search(child);
      continue;
    }

    // Empty?
    var val = child.nodeValue;
    var content = val && val.replace(spaceRegex, '');
    if (!content)
      continue;


    // Search for numbers
    var position = parsePhoneNumber(val);
    if (position) {
      // Replace
      replaceNumber(position, child);

      // Restart search on parent
      return search(node.parentNode);
    }
  }
};

var parsePhoneNumber = function (val) {

  var last = val.length - 1;
  var pos = 0;

  // Loop through block
  while (pos <= last) {
    var subject = val.slice(pos);

    // Skip over non numbers
    if (subject[0] !== '+' && subject[0].match(/\D/)) {
      pos++;
      continue;
    }

    // Match number
    var result = subject.match(numberRegex);
    if (result) {
      var len = result[0].length;
      var start = pos;

      // Bump pos
      pos += len;

      // Extract number
      var number = extractPosition(result, start);

      // Must be at least 9 digits
      if (number.number.length > 8)
        return number;
    }

    pos++;
  }
};

var extractPosition = function (result, pos) {
  var val = result[0];
  var removed = 0;

  // Remove preceeding 00
  var prefix = val.match(/^00/);
  if (prefix) {
    val = val.replace(/^00/, '');
    removed += 2;
  }

  // Remove 0 from +44 0 if present
  prefix = val.match(/^\+(\d\d)0/);
  if (prefix) {
    val = val.replace(prefix[0], prefix[1]);
    removed += 2;
  }

  // Remove (0) if present
  if (result[2]) {
    val = val.replace(result[2], '');
    removed += result[2].length;
  }

  // Find last digit
  var i = val.length;
  while (i--) {
    if (val[i].match(/\d/)) {
      var number = val.slice(0, i + 1).replace(/\D/g, '');

      return {
        start: pos,
        end: pos + removed + i + 1,
        number: number,
      };
    }
  }
};

/**
 * Replace
 */

var replaceNumber = function (position, node) {

  var range = document.createRange();
  range.setStart(node, position.start);
  range.setEnd(node, position.end);

  var frag = range.extractContents();

  // How do we end up here?
  if (!range.startContainer.splitText)
    return;

  var before = range.startContainer.splitText(range.startOffset);

  var wrapper = createWrapper(position.number);
  wrapper.appendChild(frag);

  before.parentNode.insertBefore(wrapper, before);
};

/**
 * Replace tel
 */

var replaceSpecial = function (node) {
  var rawNumber = node.getAttribute('href').split(':').slice(1).join('');
  var number = extractPosition([ rawNumber ]);
  if (!number)
    return;

  var wrapper = createWrapper(number.number);
  wrapper.innerHTML = node.innerHTML;

  node.innerHTML = '';
  node.appendChild(wrapper);
};

/**
 * Telux Number wrapper
 */

var createWrapper = function (number) {
  var wrapper = document.createElement('sipml-call');
  wrapper.style.borderBottomColor = 'green';
  wrapper.style.borderBottomWidth = '2px';
  wrapper.style.borderBottomStyle = 'solid';
  wrapper.style.cursor = 'pointer';
  wrapper.setAttribute('number', number);

  wrapper.addEventListener('click', function (e) {
    e.preventDefault();

    var num = wrapper.getAttribute('number');
    console.log('Calling', num);
    chrome.extension.sendMessage({
      type: 'call',
      toaddr: num
    }, function () {
      // DONE
    });

    e.preventDefault();
  }, false);

  return wrapper;
};

var parse = function () {
  // Replace "tel" / "callto"
  var specials = document.querySelectorAll('a[href^=tel], a[href^=callto]');
  for (var i = 0, len = specials.length; i < len; i++) {
    replaceSpecial(specials[i]);
  }

  // Fuzzy search from root
  search(document.body);
};

parse();

// // Watch the DOM
// var observer = new MutationObserver(function (mutations, observer) {
//   if (mutations[0].addedNodes || mutations[0].removedNodes.length) {
//     buffer.add();
//     parse();
//   }
// });

// observer.observe(document, {
//   childList: true,
//   subtree: true
// });
