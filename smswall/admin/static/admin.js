
// Enable pusher logging - don't include this in production
Pusher.log = function(message) {
    if (window.console && window.console.log) window.console.log(message);
};

// Flash fallback logging - don't include this in production
WEB_SOCKET_DEBUG = true;

var pusher = new Pusher(config.PUSHER_KEY);
var channel = pusher.subscribe('Channel_' + config.channel_id);
var privatechannel = pusher.subscribe('private-' + config.channel_id);

stack_cnt = 0;

// Canal de Présence Pusher
Pusher.channel_auth_endpoint = 'pusher-auth-presence.php';
var presenceChannel = pusher.subscribe('presence-' + config.channel_id);

presenceChannel.bind('pusher:subscription_succeeded', function() {
    $("#countmbr").html(presenceChannel.members.count);
});

presenceChannel.bind('pusher:subscription_error', function() {
    console.log("Pb avec presenceChannel");
});

presenceChannel.bind('pusher:member_added', function(member) {
    console.log("Nouveau membre");
    $("#countmbr").html(presenceChannel.members.count);
});

presenceChannel.bind('pusher:member_removed', function(member) {
    console.log("Membre parti");
    $("#countmbr").html(presenceChannel.members.count);
});


/**
 * Ajout d'un message dans la pile en asynchrone
 */

channel.bind('new_twut', function(data) {
    addTwut(data, 'new');
});

addTwut = function(data,age){

    var prefixPath = '../media/';
    if(data.provider == 'SMS' || data.provider == 'WWW') {
        data.avatar = prefixPath + data.avatar;
    }

    // Préparation du template du message
    var tpl = _.template($("#tpl_tweet").html());
    var tpl_message = tpl(data);

    // Nouveau message ou lecture en bdd ?
    if(age == 'new'){
        $('ul#containerMsg').prepend( tpl_message );
    }else{
        $('ul#containerMsg').append( tpl_message );
    }

    // BULLE
    $('.bulOff', '#t'+data.id).bind('click', function() { openBubble(data) } );
    // $('.bulOn', '#t'+data.id).bind('click', function() { closeBubble(data) } );

    $('.mediaicon', '#t'+data.id).bind('click', function(event) {
        event.preventDefault();
        openLink(this);
    } );

    $('[data-toggle=tooltip]', '#t'+data.id).tooltip();


    // gestion du scroll en live pour faciliter la modération
    // si le scroll est > 0, on stack les nouveaux tweets et on affiche
    // une alerte visuelle dans la barre de menu avec le nombre
    // de nouveaux messages en attente de lecture
    // si age == 'old', ancien message en bas de page

    var scr = $(window).scrollTop();
    if( (scr == 0 && stack_cnt == 0) || age == 'old' ){
        $('#t'+data.id).slideDown(100);
    }else{
        stack_cnt++;
        $('#t'+data.id).addClass('stacked');
        $("#stacker").html("messages non lus : " + stack_cnt).show();
    }

}

/**
 * ouverture d'un Media Twitter
 */
directLink = function(id,media_url){
    var idli = 'li#t'+id;
    $(idli).css('opacity','0.7').addClass('curSplash');
    $("#fresher").show();

    if(typeof media_url != "undefined"){
        var data = {
            type: "photo",
            url: media_url,
            thumbnail_url: media_url+":thumb"
        };
        render_viewer("photo", create_viewer(data), media_url);
        $("#fresher").hide();
    }else{
        console.log('undefined media');
    }
}

/**
 * ouverture d'un lien Embedly
 */
openLink = function(anchor){ // anchor: lien DOM complet

    $("#fresher").show();
    maxsize = Math.floor( $(window).width() / 2 );

    $(anchor).embedly({
        key: config.EMBEDLY_KEY,
        wmode: 'transparent',
        autoplay: 'true',
        query: {maxwidth: maxsize, autoplay: true},
        display: function(data){
            $("#fresher").hide();
            console.log(data);
            if(data != "None"){
                switch(data.type){
                    case 'link':
                        bulle_src = (typeof data.thumbnail_url != "undefined" && data.thumbnail_width > 100)
                            ? data.thumbnail_url
                            : '';
                        break;
                    case 'photo':
                        bulle_src = data.url;
                        break;
                    case 'video':
                    case 'rich':
                        bulle_src = data.html;
                        break;
                    default:
                        console.log("default");
                        break;
                }
                viewer_src = create_viewer(data);
                render_viewer(data.type, viewer_src, bulle_src);
                $("#fresher").hide();
            }else{
                console.log("Réponse vide, retentez plus tard");
                $("#fresher").hide();
            }
        }
    });
}

replace_icon = function(data_obj){
    ref_id = $(data_obj.elem).attr('data-id');
    var tpl_thumb = _.template($("#tpl_thumbnailer").html());
    thumb = tpl_thumb({'id': ref_id, 'url': src_image});
    $(thumb).insertBefore($(data_obj.elem));

    $(data_obj.elem).remove();
}

create_viewer = function(data_obj){
    var tpl = _.template($("#tpl_viewer").html());

    if( data_obj.type == "photo" ){
        src_image = data_obj.url;
        data_obj.image_html = load_image(src_image);

        // Chargement du thumbnail en preview dans la liste
        // si data_obj.elem existe, c'est du embedly sinon c'est du twitter
        // Remplacement du mediaicon par un thumbnail
        if(typeof data_obj.elem != 'undefined'){
            replace_icon(data_obj);
        }
    }

    // Link: on se sert du thumbnail
    if( typeof data_obj.thumbnail_url != "undefined" && data_obj.type == "link" ){
        src_image = data_obj.thumbnail_url;
        data_obj.image_html = load_image(src_image);

        // Chargement du thumbnail embedly en preview dans la liste
        //$(data_obj.elem).css({'background-image': 'url('+src_image+')', 'margin': 0}).removeClass('mediaicon').addClass('async_mediaicon');
        replace_icon(data_obj);
    }

    if(typeof data_obj.url == 'undefined' && typeof data_obj.original_url != 'undefined'){
        data_obj.url = data_obj.original_url;
    }

    var htmlembed = tpl(data_obj);
    return htmlembed;
}

load_image = function(url){
    var tpl = _.template($("#tpl_img_loader").html());
    var htmlembed = tpl();

    var img = new Image();
    $(img).load(function () {
        $(this).css('display','none');

        $("#imgCont").html(this);

        pos = $("#imgCont").position();
        spacer = pos.top * (7/2);

        if($(this).width() > $("#bulleViewer").width() || $(this).height() > $(window).height() - spacer){
            $("#imgCont").append('<div id="detailSplash">Taille réelle : ' + $(this).width() + 'px / ' + $(this).height() + 'px</div>');

            if($(this).width() > $(this).height() && $(this).height() < $(window).height() - spacer ) {
                $(this).css('width',$("#bulleViewer").width());
                $(this).css('height','auto');
            } else {
                $(this).css('max-height',$(window).height() - spacer);
                // $(this).css('height','auto');
                $(this).css('width','auto');
            }
        }

        $(this).fadeIn('slow');

    }).attr('src', url);

    return htmlembed;
}

render_viewer = function(type, htmlembed, viewSrc){

    $("#bulleOptions").hide();
    $("#bulleViewer").show();
    $(".label-success", $(this)).hide();

    $("#bulleViewer .contentembed").empty().append(htmlembed);

    $("#overlay").height($(document).height()).fadeIn("fast");

    $(".splasheron").bind('click', function(){
        $("#closerSplash").show();
        privatechannel.trigger('client-open-splash', { 'type': type, 'html': viewSrc });
    });

    $(".splasheroff").bind('click', function(){
        $("#closerSplash").hide();
        privatechannel.trigger('client-close-splash', { 'truc': 'machin' });
    });

    $("#closerViewer").click(function(){
        $("#overlay").fadeOut("fast");
        $(".contentembed").empty();
        $(".curSplash").animate({
            'opacity': 1
        }, 200, function() {
            // Fin de l'anim
            $(this).removeClass('curSplash');
        });
    });
}

var bubbleTime;
var previousData;

openBubble = function(data){

    if(typeof bubbleTime == "number") {
        window.clearTimeout(bubbleTime);
        delete bubbleTime;
    }

    data.dureeBulle = parseInt(config.bulle);
    // ajout d'une seconde :
    // prise en compte des effets côté wall public
    // fadeIn 500ms + fadeOut 500ms
    var dureeEffect = ( data.dureeBulle + 1 ) * 1000;

    $(".bulOff").removeClass('bulOn');

    $(".bulOff", "#t"+data.id).addClass('bulOn');
    $(".bulOff", "#t"+data.id).unbind("click");
    $('.bulOff', '#t'+data.id).bind('click', function() { closeBubble(data) } );

    if(data.dureeBulle > 0){
        bubbleTime = setTimeout(function(){
            closeBubble(data)
        }, dureeEffect );
    }

    privatechannel.trigger('client-open-bubble', data);
}

closeBubble = function(data){
    // $(".bulOff", "#t"+data.id).show();
    // $(".bulOn", "#t"+data.id).hide();
    $(".bulOff", "#t"+data.id).unbind("click");
    $(".bulOff", "#t"+data.id).removeClass('bulOn');
    $('.bulOff', '#t'+data.id).bind('click', function() { openBubble(data) } );
    privatechannel.trigger('client-close-bubble', data);
}

hide = function(id){ $.post("update_vis.php", { id: id, oldvis: 1 }); }

show = function(id){ $.post("update_vis.php", { id: id, oldvis: 0 }); }


channel.bind('hide_twut', function(data){
    $("#t"+data.id).removeClass('msgOK').addClass('msgNO');
});

channel.bind('show_twut', function(data){
    $("#t"+data.id).removeClass('msgNO').addClass('msgOK');
});

/*
channel.bind('show_bubble', function(data){
    $("#closerSplash").html('Fermer la bulle');
    $("#closerSplash").fadeIn(500).delay(4000).fadeOut(500);
});
*/

$("#closerSplash").bind('click', function(){
    $(this).hide();
    privatechannel.trigger('client-close-splash', { 'truc': 'machin' });
});


$(document).ready(function() {

    var offset = 0;
    var limit = 30;

    // Première lecture
    // Affichage de messages stockés en bdd
    $("#morer").click(function(){
        $.post("../get_messages.php",
            { offset: offset*limit, limit: limit },
            function(data){
                $.each(data, function(){
                    addTwut(this, 'old');
                });
            }, "json"
        );
        offset++;
    });
    $("#morer").trigger('click');

    /* tooltip global */
    $("[data-toggle=tooltip]").tooltip();


    /* Stacker: bouton de notif de la pile de messages en attente d'affichage (bloqué par le scroll) */
    $("#stacker").click(function(){
        $.scrollTo(0, 100, function(){
            stack_cnt = 0;
            $(".stacked").fadeIn('slow').removeClass('stacked');
            $("#stacker").html('').hide();
        });

    });

    /*
     * Messagerie pour l'animateur
     */

    affichMessage = function(){
        $.scrollTo( {top:'0', left:'0'}, 200, function(){
            $("#messageModo").slideToggle(200);
        } );

    }

    $("#posterModo").submit(function(){
        $.post("register_msg.php",
            { pseudo: $("#pseudoM").val(), message: $("#messageM").val() },
            function(data){
                $("#messageModo").slideToggle("slow");
                $("#messageM").val("");
            }
         );
        return false;
    });

    /*
     * Modification du hashtag dans le header menu
     */

    $("#hashtag_btn").click(function(){
        $("#hashtag_btn, #hashtag_input").toggle();
        $("input", "#hashtag_input").focus();
    });

    $(".cancel", "#hashFormMenu").click(function(){
        $("#hashtag_btn, #hashtag_input").toggle();
    });

    displayHash = function(hash){
        var iscroped = (hash.length > 20) ? "..." : "";
        var shorttag = hash.substring(0,20) + iscroped;
        icon = $("<i>").addClass('icon-search icon-white');
        $("#hashtag_btn").empty().append($(icon));
        $("#hashtag_btn").append(" " + shorttag);
        $("#hashtag_btn").attr("data-original-title", hash);
        $("#hashMenuInput").val(hash);
        $("#hashtagForm").val(hash);
    }

    $("#hashFormMenu").submit(function(){
        // quasi doublon avec le form de la modale
        $.post("update_config.php",
            { hashtag: $("#hashMenuInput").val(), channel: $("#channelForm").val() },
            function(data){
                displayHash(data.hashtag);
                $("#hashtag_btn, #hashtag_input").toggle();
            }, "json"
        );
        return false;
    });

    /*
     * Modale Options
     */

    affichOptions = function(){
        $.scrollTo( {top:'0', left:'0'}, 200 );
        $("#overlay").height($(document).height());
        $("#overlay").fadeIn("fast");
        $("#bulleOptions").show();
        $("#bulleViewer").hide();
        $("#hashtagForm").val($("#hashMenuInput").val());
    }

    $("#closerOptions").click(function(){
        $("#overlay").fadeOut("fast");
        $(".label-success", $("#bulleOptions")).hide();
        $("#bulleOptions").hide();
    });

    // Type de stream :
    //  - search via l'API Twitter sur hashtag, mots clés
    //  - wall du compte utilisé pour la connection à l'API Twitter
    $("button", $("#userstream")).click(function(){
        $.post("update_config.php",
            { userstream: $(this).val(), channel: $("#channelForm").val() },
            function(data){
                if(data.userstream == 'user'){
                    $("[value=user]").addClass('active btn-success');
                    $("[value=tag]").removeClass('active btn-success');
                    $("#hashtag_bloc").slideUp();
                    $("#userstream_choice").show();
                    $("#hashtag_btn").hide();
                }else{
                    $("[value=user]").removeClass('active btn-success');
                    $("[value=tag]").addClass('active btn-success');
                    $("#hashtag_bloc").slideDown();
                    $("#userstream_choice").hide();
                    $("#hashtag_btn").show();
                }
            }, "json"
        );
        return false;
    });

    // Hashtags, mots clés
    $("#hashForm").submit(function(){
        $(".label-success", $(this)).hide();
        $.post("update_config.php",
            { hashtag: $("#hashtagForm").val(), channel: $("#channelForm").val() },
            function(data){
                displayHash(data.hashtag);
                $(".label-success", $("#hashForm")).show();
            }, "json"
        );
        return false;
    });

    // Type de modération : à priori vs à posteriori
    $("button", $("#modo")).click(function(){
        //$(".label-success", $(this)).hide();
        $.post("update_config.php",
            { modo_type: $(this).val(), channel: $("#channelForm").val() },
            function(data){
                //$(".label-success", $("#modoForm")).show();
                if(data.modo_type == 'pri'){
                    $("[value=pri]").addClass('active btn-danger');
                    $("[value=pos]").removeClass('active btn-success');
                }else{
                    $("[value=pri]").removeClass('active btn-danger');
                    $("[value=pos]").addClass('active btn-success');
                }
            }, "json"
        );
        return false;
    });

    // Retweets : Masquage optionnel des retweets
    $("button", $("#retweet")).click(function(){
        //$(".label-success", $(this)).hide();
        $.post("update_config.php",
            { retweet: $(this).val(), channel: config.channel_id },
            function(data){
                //$(".label-success", $("#modoForm")).show();
                if(data.retweet == 'hide'){
                    $("[value=hide]", "#retweet").addClass('active btn-danger');
                    $("[value=show]", "#retweet").removeClass('active btn-success');
                }else{
                    $("[value=hide]", "#retweet").removeClass('active btn-danger');
                    $("[value=show]", "#retweet").addClass('active btn-success');
                }
            }, "json"
        );
        return false;
    });

    // Avatar : Masquage optionnel des avatars
    $("button", $("#avatar")).click(function(){
        //$(".label-success", $(this)).hide();
        $.post("update_config.php",
            { avatar: $(this).val(), channel: config.channel_id },
            function(data){
                //$(".label-success", $("#modoForm")).show();
                if(data.avatar == 'hide'){
                    $("[value=hide]", "#avatar").addClass('active btn-danger');
                    $("[value=show]", "#avatar").removeClass('active btn-success');
                }else{
                    $("[value=hide]", "#avatar").removeClass('active btn-danger');
                    $("[value=show]", "#avatar").addClass('active btn-success');
                }
            }, "json"
        );
        return false;
    });

    // Bulle : Durée d'affichage des bulles
    $("#dureeBulleForm").change(function(){
        $(".label-success", $("#bulleForm")).hide();
        $.post("update_config.php",
            { bulle: $("#dureeBulleForm").val(), channel: $("#channelForm").val() },
            function(data){
                config.bulle = (data.bulle == "infini") ? 0 : data.bulle;
                $(".label-success", $("#bulleForm")).show();
            }, "json"
         );
        return false;
    });


    // Thème : Thème graphique du wall public
    $("#theme").change(function(){
        $(".label-success", $("#themeForm")).hide();
        $.post("update_config.php",
            { theme: $("#theme").val(), channel: $("#channelForm").val() },
            function(data){
                $(".label-success", $("#themeForm")).show();
            }
         );
        return false;
    });

    // SMS : Numéro de téléphone pour la réception des SMS et l'affichage dans le thème graphique
    $("#phoneForm").submit(function(){
        $.post("update_config.php",
            { phone: $("#numberForm").val(), channel: $("#channelForm").val() },
            function(data){
                $(".label-success", $("#phoneForm")).show();
            }, "json"
         );
        return false;
    });


});

