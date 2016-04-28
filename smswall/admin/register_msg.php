<?php
require_once('../smswall.inc.php');
include('../func.php');
require('../libs/Pusher.php');
include('../libs/ForceUTF8/Encoding.php');

$provider = 'WWW';
$author = $_POST['pseudo'];
$message = \ForceUTF8\Encoding::toUTF8($_POST['message']);
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
    echo "Erreur PDO : " . $e->errorInfo();
}

// Préparation du dict pour le trigger Pusher 'new_twut'
$arrayPush['id'] = $lastId;
$arrayPush['provider'] = $provider;

// $arrayPush['message'] = utf8_encode($message);
$arrayPush['message'] = $message;

$arrayPush['message_html'] = make_clickable( $arrayPush['message'] );
$arrayPush['internallink'] = ($arrayPush['message'] !== $arrayPush['message_html']) ? true : false;
$arrayPush['visible'] = $visible;
$arrayPush['author'] = $author;
$arrayPush['avatar'] = 'default_www.png';
$arrayPush['ctime'] = $ctime;
$arrayPush['links'] = "";
$arrayPush['medias'] = "";


$pusher = new Pusher( PUSHER_KEY, PUSHER_SECRET, PUSHER_APPID );
$pusher->trigger('Channel_' . $config['channel_id'], 'new_twut', $arrayPush);

?>