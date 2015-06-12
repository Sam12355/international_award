<?php
/*
 * upload_article.php
 * @author Lakshan
 */

require_once 'db_connect.php';
require_once 'helpers.php';

// bump memory for large files - keeps crashing on the server
@ini_set('memory_limit', '128M');
@ini_set('upload_max_filesize', '10M');
@ini_set('post_max_size', '12M');
@ini_set('max_execution_time', '120');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    // check required fields
    if (empty($_POST['title']) || empty($_POST['author_name']) || empty($_POST['author_email'])) {
        die('Error: Please fill in all required fields.');
    }

    $title       = mysqli_real_escape_string($conn, $_POST['title']);
    $author_name = mysqli_real_escape_string($conn, $_POST['author_name']);
    $author_email = mysqli_real_escape_string($conn, $_POST['author_email']);
    $abstract    = mysqli_real_escape_string($conn, $_POST['abstract']);
    $keywords    = mysqli_real_escape_string($conn, $_POST['keywords']);
    $journal_id  = intval($_POST['journal_id']);

    // file upload
    $upload_dir = '/var/www/html/uploads/articles/';

    if (isset($_FILES['manuscript']) && $_FILES['manuscript']['error'] == 0) {

        $tmp_name  = $_FILES['manuscript']['tmp_name'];
        $file_name = $_FILES['manuscript']['name'];
        $file_size = $_FILES['manuscript']['size'];
        $file_ext  = pathinfo($file_name, PATHINFO_EXTENSION);

        // only allow pdf and word files
        $allowed = array('pdf', 'doc', 'docx');
        if (!in_array(strtolower($file_ext), $allowed)) {
            die('Error: Only PDF and Word documents are allowed.');
        }

        if ($file_size > 10 * 1024 * 1024) {
            die('Error: File size exceeds 10MB limit.');
        }

        $new_name = time() . '_' . $file_name;
        $dest     = $upload_dir . $new_name;

        // copy to a temp location first because move_uploaded_file
        // sometimes fails when /tmp fills up on the shared hosting
        $tmp_dest = $upload_dir . 'tmp_' . $new_name;
        if (is_uploaded_file($tmp_name)) {
            if (!@copy($tmp_name, $tmp_dest)) {
                // fallback to move
                if (!@move_uploaded_file($tmp_name, $dest)) {
                    die('Error: Could not move uploaded file. Disk might be full.');
                }
            } else {
                rename($tmp_dest, $dest);
            }
        } else {
            die('Error: Upload verification failed.');
        }

    } else {
        die('Error: No manuscript file received.');
    }

    // save to db
    $query = "INSERT INTO articles
                (title, author_name, author_email, abstract, keywords,
                 journal_id, file_path, file_size, status, created_at)
              VALUES
                ('$title', '$author_name', '$author_email', '$abstract',
                 '$keywords', '$journal_id', '$dest', '$file_size',
                 'submitted', NOW())";

    $result = mysqli_query($conn, $query)
        or die('Query failed: ' . mysqli_error($conn));

    $article_id = mysqli_insert_id($conn);
    $ref = make_ref($journal_id, $article_id);

    $to      = $author_email;
    $subject = 'Article Submission Received - ID #' . $article_id;
    $body    = "Dear $author_name,\n\n"
             . "Your article \"$title\" has been received.\n"
             . "Submission ID: $article_id\n"
             . "Status: submitted\n\n"
             . "You will be notified once a reviewer is assigned.\n\n"
             . "Regards,\nScientific Journal Platform";

    mail($to, $subject, $body);

    echo "<h2>Upload Successful</h2>";
    echo "<p>Article <strong>#$article_id</strong> ($ref) has been submitted.</p>";
    echo "<p>File saved as: $new_name (" . round($file_size / 1024, 2) . " KB)</p>";
    echo "<p>A confirmation e-mail has been sent to $author_email.</p>";
    echo "<br><a href='dashboard.php'>Back to Dashboard</a>";

} else {
    echo '
    <html>
    <head><title>Submit Article</title></head>
    <body>
        <h1>Submit New Article</h1>
        <form method="POST" enctype="multipart/form-data" action="upload_article.php">
            <label>Title:</label><br>
            <input type="text" name="title" size="60"><br><br>

            <label>Author Name:</label><br>
            <input type="text" name="author_name" size="40"><br><br>

            <label>Author E-mail:</label><br>
            <input type="text" name="author_email" size="40"><br><br>

            <label>Abstract:</label><br>
            <textarea name="abstract" rows="6" cols="60"></textarea><br><br>

            <label>Keywords (comma-separated):</label><br>
            <input type="text" name="keywords" size="60"><br><br>

            <label>Journal:</label><br>
            <select name="journal_id">
                <option value="1">Journal of Agricultural Sciences</option>
                <option value="2">Journal of Sustainable Farming</option>
                <option value="3">Journal of Food & Biosystems Engineering</option>
            </select><br><br>

            <label>Manuscript (PDF / Word):</label><br>
            <input type="file" name="manuscript"><br><br>

            <input type="submit" value="Submit Article">
        </form>
    </body>
    </html>';
}

mysqli_close($conn);
mysqli_close($conn_read);
?>
