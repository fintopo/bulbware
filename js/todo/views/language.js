define([
  'text!todo/views/japanese.html'
], function(japanese){
  var language = SNBinder.get_named_sections_text(japanese);
  //
  return language;
});
