<?php
/*
 * helpers.php
 */

// format date for display
function fmt_date($d) {
    if (empty($d)) return '-';
    return date('M d, Y', strtotime($d));
}

function fmt_datetime($d) {
    if (empty($d)) return '-';
    return date('M d, Y h:i A', strtotime($d));
}

// truncate long text
function short_text($str, $len = 150) {
    if (strlen($str) <= $len) return $str;
    return substr($str, 0, $len) . '...';
}

// old function - was used for the first version of file uploads
// not sure if anything still calls this
function handle_upload_old($file, $dest_dir) {
    $name = time() . '_' . $file['name'];
    $dest = $dest_dir . $name;
    if (move_uploaded_file($file['tmp_name'], $dest)) {
        return $dest;
    }
    return false;
}

// generate a "unique" reference number for articles
function make_ref($journal_id, $article_id) {
    return 'SJP-' . str_pad($journal_id, 2, '0', STR_PAD_LEFT) . '-' . str_pad($article_id, 5, '0', STR_PAD_LEFT);
}

// clean user input - used in some older pages
function clean($conn, $str) {
    return mysqli_real_escape_string($conn, trim($str));
}

// check if user is logged in
function check_login() {
    if (!isset($_SESSION['user_id'])) {
        header('Location: login.php');
        exit;
    }
}

// log article view for analytics
function log_view($conn, $article_id) {
    $ip = $_SERVER['REMOTE_ADDR'];
    $ua = mysqli_real_escape_string($conn, $_SERVER['HTTP_USER_AGENT']);
    $q = "INSERT INTO article_views (article_id, ip_address, user_agent, viewed_at)
          VALUES ($article_id, '$ip', '$ua', NOW())";
    mysqli_query($conn, $q);
    // dont care if this fails
}

// quick way to get one value
function get_one($conn, $query) {
    $r = mysqli_query($conn, $query);
    if ($r && mysqli_num_rows($r) > 0) {
        $row = mysqli_fetch_row($r);
        return $row[0];
    }
    return null;
}
?>
