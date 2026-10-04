<?php
$hash = password_hash('admin123', PASSWORD_DEFAULT);
echo $hash;
file_put_contents('hash.txt', $hash);
?>
