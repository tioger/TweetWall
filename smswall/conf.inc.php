<?php
/**
 * Configuration base de donnée
 */

$host="localhost";
$port="3306";

$root="root";
$root_password="marsien13";

$user='root';
$pass='marsien13';
$db="smswall";

/**
 * Twitter : http://dev.twitter.com
 * Remplacez les XXX par vos propres paramètres de connexion
 */

if(!defined('CONSUMER_KEY')){ define('CONSUMER_KEY', 'mqA9xKhV5qcLmeClVR4zH4XO2'); }
if(!defined('CONSUMER_SECRET')){ define('CONSUMER_SECRET', 'esR9HBFjN5iCWbzPDGeep1p1i59sAe7tWoQnxfuwuFd2UZ6HDR'); }
if(!defined('ACCESS_TOKEN')){ define('ACCESS_TOKEN', '3131561373-YywXnwjeyIxSYYCpEW9fAN1iwUUk8bz23h7ysp4'); }
if(!defined('ACCESS_TOKEN_SECRET')){ define('ACCESS_TOKEN_SECRET', '5iot421TenL1vXb9qX2jecr7yTuxWdwPC87mredh0C30Q'); }

/**
 * Pusher : http://pusher.com
 * Remplacez les XXX par vos propres paramètres de connexion
 */

if(!defined('PUSHER_APPID')){ define('PUSHER_APPID', '114554'); }
if(!defined('PUSHER_KEY')){ define('PUSHER_KEY', 'f3e2f781c554b205ecee'); }
if(!defined('PUSHER_SECRET')){ define('PUSHER_SECRET', '40fcb9dede7050fa64c8'); }

/**
 * Embed.ly : http://embed.ly
 * Remplacez les XXX par vos propres paramètres de connexion
 */

if(!defined('EMBEDLY_KEY')){ define('EMBEDLY_KEY', '2c60d6fb4a8a4a53859a223acc5c0160'); }

?>
