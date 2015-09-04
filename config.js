exports.selector = '.sidenav';

exports.selectorParent = 'body';

exports.selectorRename = '.sidenav li.sidenav-rename';

exports.selectorCopy = '.sidenav li.sidenav-copy';

exports.commands = {
  load: '.sidenav-load',
  edit: '.sidenav-edit',
  save: '.sidenav-save',
  cancel: '.sidenav-cancel',
  copy: '.sidenav-copy',
  rename: '.sidenav-rename',
  'delete': '.sidenav-delete'
}

exports.symbols = {
  menu: ["«", "&#171;"],
  load: ["⟳", "&#10227;"],
  edit: ["✎", "&#9998;"],
  save: ["✔", "&#10004;"],
  cancel: ["✗", "&#10007;"]
}
