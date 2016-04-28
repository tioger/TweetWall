

<script id="tpl_tweet" type="text/template">
<li class="<%= parseInt(visible) ? 'msgOK' : 'msgNO' %>" id="t<%= id %>" style="display: none;">
    
    <img src="<%= avatar %>" class="avatar" />
    <div class="twut-text">
        <span class="author"><a href="http://twitter.com/<%= author %>" target="_blank"><%= author %></a> : </span>
        <span class="textMsg"><%= message_html ? (message_html) : message %> - </span>
        <span class="time" data-time="<%= ctime %>"><%= moment(ctime).fromNow() %></span>
    </div>
    <div class="modo_menu">

        <% if(!_.isNull(links) && typeof(links) != 'undefined' && links.length){
            links = eval(links);
            if(typeof(links) != "undefined") {
                _.each(links, function(link){ %>

                    <a href="<%= link.expanded_url %>" class="mediaicon" data-id="<%= id %>">&nbsp;</a>

                <% });
            }
        }

        if(!_.isNull(medias) && typeof(medias) != 'undefined' && medias.length) {
            medias = eval(medias);
            if(typeof(medias) != "undefined") {
                _.each(medias, function(media){ %>
                    <div class="thumbnail2">
                    <a href="javascript://" class="thumbnail" onclick="directLink(<%= id %>,'<%= media.media_url %>');">
                        <img src="<%= media.media_url %>" style="" />
                    </a>
                    </div>
                <% });
            }
        } %>
    </div>
    <div style="clear: both;"></div>
</li>
</script>