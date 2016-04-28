<!DOCTYPE html>
<html>
    <head>
            <meta charset="utf-8"/>
            <title></title>
            <link rel="shortcut icon" type="image/x-icon" href="">
            <link rel="stylesheet" type="text/css" href="">
    </head> 
    <body>
    	<div id="fond"></div>
    	<div id="contenu">
    		<div id="header">
    			<div id="ctr">
    				<div id="logo">
    					<img src="themes/default/media/logo.png"/>
    				</div>
    				<div id="titre">
    					<h1>Twitter Wall</h1>
    					<h4>After Work de SimplonMars</h4>
    				</div>
                    <ul id="infos">
                        <li><div class="highlight">Envoyer un message sur le mur :</div></li>
                        <li><div class="line">avec le tag <span id="hashtag"><?php echo $config['hashtag']; ?></span></div></li>
                    </ul>
    			</div>
    		</div>		
			<div id="wrapper">
    			<ul id="containerMsg"></ul>
			</div>

			<div id="overlayMsg" class="overlay" style="display: none;">
    			<div id="bulleMsg"></div>
			</div>

			<div id="overlayMedia" class="overlay" style="display: none;">
    			<div id="bulleMedia"></div>
			</div>

			<div id="footer"></div>
		</div>
    </body>
</html>


