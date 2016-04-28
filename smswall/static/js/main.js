
// Enable pusher logging - don't include this in production
Pusher.log = function(message) {
    if (window.console && window.console.log) window.console.log(message);
};

// Flash fallback logging - don't include this in production
WEB_SOCKET_DEBUG = true;

Pusher.channel_auth_endpoint = 'pusher-auth-presence.php';

var pusher = new Pusher(config.PUSHER_KEY);
var channel = pusher.subscribe('Channel_' + config.channel_id);
var privatechannel = pusher.subscribe('private-' + config.channel_id);
var presenceChannel = pusher.subscribe('presence-' + config.channel_id);

presenceChannel.bind('pusher:subscription_succeeded', function() {
    var count = presenceChannel.members.count;
    console.log("Connected members" + count);
});

presenceChannel.bind('pusher:subscription_error', function() {
    console.log("Pb avec presenceChannel");
});

channel.bind('new_twut', function(data) {
    addTwut(data, 'new');
});

channel.bind('hide_twut', function(data){
    $("#t"+data.id).slideUp(300);
});

channel.bind('show_twut', function(data){
    $("#t"+data.id).slideDown();
});

channel.bind('update_theme', function(data){
    window.location.href = window.location.href;
});

channel.bind('update_avatar', function(data){
    window.location.href = window.location.href;
});

channel.bind('update_phone', function(data){
    $("#phone").html(data.phone);
});

channel.bind('update_hashtag', function(data){
    $("#hashtag").html(data.hashtag);
});

addTwut = function(data,age){
    // Chemin des avatars par défaut personnalisables
    var prefixPath = 'themes/'+config.theme+'/media/';
    if(data.provider == 'SMS' || data.provider == 'WWW') {
        data.avatar = prefixPath + data.avatar;
    }

    // Préparation du template du message
    var tpl = _.template($("#tpl_tweet").html());
    var tpl_message = tpl(data);

    $('ul#containerMsg').prepend(tpl_message);

    // Masquage des messages modérés
    if(data.visible == true){
        $('#t'+data.id).slideDown(100);
    }
    return false;
}

var bubbleTime;

privatechannel.bind('client-open-bubble', function(data){
    $("#overlayMedia").fadeOut(1000, function(){
        $("#bulleMedia").empty().removeAttr('style');
    });

    if(typeof bubbleTime == "number") {
        window.clearTimeout(bubbleTime);
        delete bubbleTime;
        $("#overlayMsg").hide();
        $("#bulleMsg").empty().removeAttr('style');
    }

    // passage en hidden pour pouvoir récupérer les hauteurs en pixels
    $("#overlayMsg").css({'visibility':'hidden','display':'block'});
    $("#bulleMsg").show();

    prefixPath = 'themes/'+config.theme+'/media/';
    if(data.provider == 'SMS' || data.provider == 'WWW') {
        data.avatar = prefixPath + data.avatar;
    }

    // Préparation du template de la bulle
    var tpl = _.template($("#tpl_bulle").html());
    var tpl_message = tpl(data);
    $("#bulleMsg").html(tpl_message);

    // centrage de la bulle
    posX = ( $(window).width() - $("#bulleMsg").outerWidth() ) / 2;
    posY = ($(window).height() / 2 ) - ( $("#bulleMsg").outerHeight() / 2);
    $("#bulleMsg").css({'left': posX, 'top': posY});

    $("#overlayMsg").css({'visibility':'visible','display':'none'});

    // Durée d'affichage de la bulle:
    // 0 = illimité, fermeture manuelle
    $("#overlayMsg").fadeIn(500,function(){
        $("#splash").slideDown(400);
    });

    if(data.dureeBulle > 0){
        var duree = data.dureeBulle * 1000;
        bubbleTime = setTimeout(function(){
            close_bubble();
        }, duree );
    }
});

privatechannel.bind('client-close-bubble', function(data){
    close_bubble();
});

close_bubble = function(){
    $("#overlayMsg").fadeOut(500,function(){
        $("#bulleMsg").empty().removeAttr('style');
    });
}

privatechannel.bind('client-open-splash', function(data){
    $("#bulleMsg").hide();
    if( $("#bulleMedia").html() ) {
        $("#overlayMedia").fadeOut(100, function(){
            $("#bulleMedia").empty().removeAttr('style');
            create_splash(data);
        });
    }else{
        create_splash(data);
    }
});

create_splash = function(data){
    if(data.type == "photo" || data.type == "link"){

        var img = new Image();

        $(img).load(function () {
            $("#overlayMedia").fadeIn(500);
            $("#bulleMedia").show();

            $(this).attr('id','viewer');
            $("#bulleMedia").html(this);

            var spacer = 50;

            if($(this).width() > $(window).width() || $(this).height() > $(window).height() - spacer){
                if($(this).width() > $(this).height() && $(this).height() < $(window).height() - spacer) {
                    $(this).css('width',$(window).width() - (spacer * 2) );
                    $(this).css('height','auto');
                } else {
                    $(this).css('height',$(window).height() - (spacer * 2) );
                    $(this).css('width','auto');
                }

            }

            posX = ( $(window).width() - $("#bulleMedia").outerWidth() ) / 2;
            posY = ( $(window).height() - $("#bulleMedia").outerHeight() ) / 2;

            $("#bulleMedia").css({'top': posY, 'left': posX });

            // $(this).fadeIn('slow',function(){
                // Fin de l'anim
                $("#bulleMedia").fadeIn('slow');
            // });

        }).attr('src', data.html);

    }else{
        $("#bulleMedia").html('<div id="viewer">' + data.html + '</div>');
        var outerx = $("#bulleMedia").outerWidth() + $("#viewer").outerWidth();
        var outery = $("#bulleMedia").outerHeight() + $("#viewer").outerHeight();

        posX = ( $(window).width() - $("iframe", "#bulleMedia").outerWidth() - outerx ) / 2;
        posY = ( $(window).height() - $("iframe", "#bulleMedia").outerHeight() - outery ) / 2;

        $("#bulleMedia").css({'top': posY, 'left': posX });

        $("#overlayMedia").fadeIn(500,function(){
            $("#viewer").show();
        });

    }
}

privatechannel.bind('client-close-splash', function(data){
    $("#overlayMedia").fadeOut(1000, function(){
        $("#bulleMedia").empty().removeAttr('style');
    });
});


$(document).ready(function(){

    // Affichage des derniers messages en bdd
    $.post("get_messages.php",
        { offset: 0, limit: 30 },
        function(data){
            data_reversed = data.reverse();
            $.each(data_reversed, function(){
                addTwut(this, 'old');
            });
        }, "json"
    );


    function launchTimer() {
        $(".time").each(function(index){
            $(this).html( moment( $(this).attr('data-time') ).fromNow() );
        });
        timer = setTimeout(launchTimer, 20000);
    }
    var timer = setTimeout(launchTimer, 20000);

});