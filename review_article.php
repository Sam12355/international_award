<?php
/*
 * review_article.php
 * @author Lakshan
 */

session_start();
require_once 'db_connect.php';
require_once 'helpers.php';

// update status if form was submitted
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['article_id'])) {

    $article_id = intval($_POST['article_id']);
    $new_status = mysqli_real_escape_string($conn, $_POST['status']);
    $reviewer_notes = mysqli_real_escape_string($conn, $_POST['reviewer_notes']);

    // only allow valid statuses
    $valid_statuses = array('submitted', 'under_review', 'approved', 'rejected');
    if (!in_array($new_status, $valid_statuses)) {
        die('Invalid status value.');
    }

    $update = "UPDATE articles
               SET status = '$new_status',
                   reviewer_notes = '$reviewer_notes',
                   reviewed_at = NOW()
               WHERE id = $article_id";

    mysqli_query($conn, $update) or die('Update failed: ' . mysqli_error($conn));

    // if approved, set the publication date
    if ($new_status == 'approved') {
        $pub_query = "UPDATE articles SET published_at = NOW() WHERE id = $article_id";
        mysqli_query($conn, $pub_query) or die('Publish update failed: ' . mysqli_error($conn));
    }

    // notify author if rejected
    if ($new_status == 'rejected') {
        $a = mysqli_fetch_assoc(mysqli_query($conn_read, "SELECT author_email, author_name, title FROM articles WHERE id = $article_id"));
        if ($a) {
            $subj = 'Article Update - ' . $a['title'];
            $body = "Dear " . $a['author_name'] . ",\n\nYour article \"" . $a['title'] . "\" has been reviewed.\nStatus: Rejected\n\nReviewer notes:\n$reviewer_notes\n\nRegards,\nScientific Journal Platform";
            mail($a['author_email'], $subj, $body);
        }
    }

    header("Location: review_article.php?msg=updated");
    exit;
}

// read from slave
$status_filter = isset($_GET['status']) ? mysqli_real_escape_string($conn_read, $_GET['status']) : 'submitted';

$query = "SELECT a.id, a.title, a.author_name, a.author_email, a.abstract,
                 a.file_path, a.status, a.created_at, j.name as journal_name
          FROM articles a, journals j
          WHERE a.journal_id = j.id
            AND a.status = '$status_filter'
          ORDER BY a.created_at DESC";

$result = mysqli_query($conn_read, $query) or die('Query error: ' . mysqli_error($conn_read));

$count_query = "SELECT COUNT(*) as total FROM articles WHERE status = 'submitted'";
$count_result = mysqli_query($conn_read, $count_query);
$count_row = mysqli_fetch_assoc($count_result);
$pending_count = $count_row['total'];

?>
<html>
<head><title>Review Articles</title></head>
<body>

<h1>Article Review Panel</h1>

<?php if (isset($_GET['msg']) && $_GET['msg'] == 'updated'): ?>
    <p style="color: green;"><b>Article status updated successfully.</b></p>
<?php endif; ?>

<p>
    <a href="review_article.php?status=submitted">Submitted (<?php echo $pending_count; ?>)</a> |
    <a href="review_article.php?status=under_review">Under Review</a> |
    <a href="review_article.php?status=approved">Approved</a> |
    <a href="review_article.php?status=rejected">Rejected</a>
</p>

<hr>

<?php
if (mysqli_num_rows($result) == 0) {
    echo '<p>No articles found with status: ' . $status_filter . '</p>';
} else {
    while ($row = mysqli_fetch_assoc($result)) {
?>
    <div style="border:1px solid #ccc; padding:10px; margin-bottom:15px;">
        <h3><?php echo $row['title']; ?> <small>(#<?php echo $row['id']; ?>)</small></h3>
        <p><b>Author:</b> <?php echo $row['author_name']; ?> (<?php echo $row['author_email']; ?>)</p>
        <p><b>Submitted:</b> <?php echo fmt_datetime($row['created_at']); ?></p>
        <p><b>Journal:</b> <?php echo $row['journal_name']; ?></p>
        <p><b>Abstract:</b><br><?php echo short_text($row['abstract'], 300); ?></p>
        <p><a href="<?php echo $row['file_path']; ?>" target="_blank">Download Manuscript</a></p>

        <form method="POST" action="review_article.php">
            <input type="hidden" name="article_id" value="<?php echo $row['id']; ?>">

            <label>Status:</label>
            <select name="status">
                <option value="submitted">Submitted</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
            </select>
            <br><br>

            <label>Reviewer Notes:</label><br>
            <textarea name="reviewer_notes" rows="3" cols="50"></textarea>
            <br><br>

            <input type="submit" value="Update Status">
        </form>
    </div>
<?php
    }
}
?>

</body>
</html>
<?php
mysqli_close($conn);
mysqli_close($conn_read);
?>
