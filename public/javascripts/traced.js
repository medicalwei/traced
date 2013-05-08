$(function(){
  var socket = io.connect();
  var counter = 0;
  socket.on('id', function () {
    socket.emit('set id', window.traced_id);
  });
  socket.on('trace', function(data){
    counter++;
    var r = $("<tr/>");
    $("<td/>").text(new Date(data.time).toLocaleString()).appendTo(r);
    if (data.dnt) {
      $("<td/>").attr("colspan", "2").text("Do Not Track is on").appendTo(r);
    } else {
      $("<td/>").text(data.ip).appendTo(r);
      $("<td/>").text(data.ua).appendTo(r);
    }
    $("#logs tbody").append(r);
    $("#title").text(counter + " access(es) to this url.");
    $("title").text("[" + counter + "] Trace log");
  });
});
