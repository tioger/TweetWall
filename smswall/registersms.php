<?php
require_once('smswall.inc.php');
include('func.php');
require('libs/Pusher.php');
include('libs/ForceUTF8/Encoding.php');

date_default_timezone_set('Europe/Paris');

$author = "SMS";
// POST : SMS Enabler
// GET  : Android Tasker
// Décommenter les //authors pour afficher n° de téléphone
if(!empty($_POST['text'])){
    $content = $_POST['text'];
    //$author = $_POST['sender'];
}else if(!empty($_GET['text'])){
    $content = urldecode($_GET['text']);
    //$author = $_GET['sender'];
}

$provider = 'SMS';
// $message = strip_tags(utf8_decode($content));
$message = \ForceUTF8\Encoding::toUTF8(strip_tags($content));
$ctime = date('Y-m-d H:i:s', time());
$ctime_db = date('Y-m-d H:i:s', time() - date("Z"));
$visible = $config['modo_type'];

try{
    $db->beginTransaction();
    $q = $db->prepare('INSERT INTO messages (provider,author,message,ctime,visible) VALUES(?,?,?,?,?)');
    $q->execute(array($provider,$author,$message,$ctime_db,$visible));
    $lastId = $db->lastInsertId();
    $db->commit();
}catch(PDOException $e){
    echo "Erreur : " . $e->errorInfo();
}

// Préparation du dict pour le trigger Pusher 'new_twut'

$arrayPush['id'] = $lastId;
$arrayPush['message'] = $message;
$arrayPush['message_html'] = $message;
$arrayPush['visible'] = $visible;
$arrayPush['author'] = $author;
$arrayPush['avatar'] = 'default_sms.png';
$arrayPush['ctime'] = $ctime;
$arrayPush['provider'] = $provider;
$arrayPush['links'] = "";
$arrayPush['medias'] = "";

$pusher = new Pusher( PUSHER_KEY, PUSHER_SECRET, PUSHER_APPID );
$pusher->trigger('Channel_' . $config['channel_id'], 'new_twut', $arrayPush);

?>