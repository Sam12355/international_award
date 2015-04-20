<?php
/*
 * db_connect.php
 * shared database connection
 */

$db_host_write = 'localhost';
$db_host_read  = 'localhost';  // same box for now, was supposed to be a slave
$db_user = 'root';
$db_pass = 'secret';
$db_name = 'award_journals';

// write connection (master)
$conn = mysqli_connect($db_host_write, $db_user, $db_pass, $db_name)
    or die('DB connection failed: ' . mysqli_error($conn));

// read connection (slave) - just points to master for now
// TODO: setup actual replication, keeps timing out on the slave
$conn_read = mysqli_connect($db_host_read, $db_user, $db_pass, $db_name)
    or die('DB read connection failed: ' . mysqli_error($conn_read));

// set charset
mysqli_set_charset($conn, 'utf8');
mysqli_set_charset($conn_read, 'utf8');
?>
