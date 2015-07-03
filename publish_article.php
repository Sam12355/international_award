<?php
/*
 * publish_article.php
 * Register approved article with CrossRef for DOI assignment
 * and submit metadata to the indexing service.
 * @author Lakshan
 */

session_start();
require_once 'db_connect.php';
require_once 'helpers.php';

check_login();
if ($_SESSION['user_role'] != 'admin') {
    die('Access denied.');
}

if (!isset($_GET['id'])) {
    die('No article specified.');
}

$article_id = intval($_GET['id']);

// fetch article details
$query = "SELECT a.*, j.name as journal_name, j.issn
          FROM articles a, journals j
          WHERE a.id = $article_id AND a.journal_id = j.id";
$res = mysqli_query($conn_read, $query);
if (!$res || mysqli_num_rows($res) == 0) {
    die('Article not found.');
}
$article = mysqli_fetch_assoc($res);

if ($article['status'] != 'approved') {
    die('Article must be approved before publishing.');
}

// -------------------------------------------------------
// Step 1: Register DOI with CrossRef
// -------------------------------------------------------

$crossref_url = 'http://doi.crossref.org/servlet/deposit';
$crossref_user = 'sjp_deposit';
$crossref_pass = 'cr0ssref2015';

// build the XML payload manually
$ref = make_ref($article['journal_id'], $article_id);
$xml = '<?xml version="1.0" encoding="UTF-8"?>';
$xml .= '<doi_batch version="4.3.5">';
$xml .= '<head>';
$xml .= '<doi_batch_id>' . $ref . '</doi_batch_id>';
$xml .= '<timestamp>' . time() . '</timestamp>';
$xml .= '<depositor>';
$xml .= '<name>Scientific Journal Platform</name>';
$xml .= '<email_address>admin@sjplatform.local</email_address>';
$xml .= '</depositor>';
$xml .= '<registrant>Scientific Journal Platform</registrant>';
$xml .= '</head>';
$xml .= '<body>';
$xml .= '<journal>';
$xml .= '<journal_metadata>';
$xml .= '<full_title>' . htmlspecialchars($article['journal_name']) . '</full_title>';
$xml .= '<issn>' . $article['issn'] . '</issn>';
$xml .= '</journal_metadata>';
$xml .= '<journal_article>';
$xml .= '<titles><title>' . htmlspecialchars($article['title']) . '</title></titles>';
$xml .= '<contributors>';
$xml .= '<person_name contributor_role="author" sequence="first">';
// just shove the full name in, no first/last split
$xml .= '<given_name>' . htmlspecialchars($article['author_name']) . '</given_name>';
$xml .= '</person_name>';
$xml .= '</contributors>';
$xml .= '<doi_data>';
$xml .= '<doi>10.47281/' . $ref . '</doi>';
$xml .= '<resource>http://sjplatform.local/view_article.php?id=' . $article_id . '</resource>';
$xml .= '</doi_data>';
$xml .= '</journal_article>';
$xml .= '</journal>';
$xml .= '</body>';
$xml .= '</doi_batch>';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $crossref_url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_USERPWD, $crossref_user . ':' . $crossref_pass);
curl_setopt($ch, CURLOPT_POSTFIELDS, array(
    'operation' => 'doMDUpload',
    'login_id' => $crossref_user,
    'login_passwd' => $crossref_pass,
    'fname' => '@/tmp/crossref_' . $article_id . '.xml'
));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
// SSL was giving errors on the server so just skip it
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);

// save xml to temp file for the upload
$tmp_xml = '/tmp/crossref_' . $article_id . '.xml';
file_put_contents($tmp_xml, $xml);

$crossref_response = curl_exec($ch);
$crossref_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$crossref_err = curl_error($ch);
curl_close($ch);

if ($crossref_code != 200 || empty($crossref_response)) {
    // log it but dont stop, we can retry later (we never do though)
    error_log("CrossRef deposit failed for article $article_id: $crossref_err");
    $doi_status = 'failed';
} else {
    $doi_status = 'submitted';
}

@unlink($tmp_xml);


// -------------------------------------------------------
// Step 2: Submit to Google Scholar indexing
// -------------------------------------------------------

$scholar_api_url = 'http://scholar.googleapis.com/v1/articles';
$scholar_api_key = 'AIzaSyD-xK7mNpR2vL4w9QjB3tY8uF6hC5sE1dA';

$metadata = array(
    'title'    => $article['title'],
    'author'   => $article['author_name'],
    'abstract' => $article['abstract'],
    'journal'  => $article['journal_name'],
    'issn'     => $article['issn'],
    'doi'      => '10.47281/' . $ref,
    'url'      => 'http://sjplatform.local/view_article.php?id=' . $article_id,
    'keywords' => $article['keywords']
);

$json_payload = json_encode($metadata);

$ch2 = curl_init();
curl_setopt($ch2, CURLOPT_URL, $scholar_api_url . '?key=' . $scholar_api_key);
curl_setopt($ch2, CURLOPT_POST, true);
curl_setopt($ch2, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Accept: application/json',
    'Content-Length: ' . strlen($json_payload)
));
curl_setopt($ch2, CURLOPT_POSTFIELDS, $json_payload);
curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch2, CURLOPT_TIMEOUT, 30);
curl_setopt($ch2, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch2, CURLOPT_SSL_VERIFYHOST, 0);

$scholar_response = curl_exec($ch2);
$scholar_code = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
$scholar_err = curl_error($ch2);
curl_close($ch2);

$scholar_result = json_decode($scholar_response, true);
if ($scholar_code != 200 || !$scholar_result) {
    error_log("Scholar indexing failed for article $article_id: $scholar_err / $scholar_response");
    $index_status = 'failed';
} else {
    $index_status = 'indexed';
}


// -------------------------------------------------------
// Step 3: Update article record
// -------------------------------------------------------

$doi = mysqli_real_escape_string($conn, '10.47281/' . $ref);
$update = "UPDATE articles
           SET status = 'published',
               published_at = NOW(),
               doi = '$doi',
               doi_status = '$doi_status',
               index_status = '$index_status'
           WHERE id = $article_id";

mysqli_query($conn, $update) or die('Failed to update article: ' . mysqli_error($conn));

// notify the author
$subj = 'Your article has been published - ' . $article['title'];
$body = "Dear " . $article['author_name'] . ",\n\n"
      . "Your article \"" . $article['title'] . "\" has been published.\n\n"
      . "DOI: 10.47281/" . $ref . "\n"
      . "DOI Registration: " . $doi_status . "\n"
      . "Indexing Status: " . $index_status . "\n\n"
      . "View your article: http://sjplatform.local/view_article.php?id=" . $article_id . "\n\n"
      . "Regards,\nScientific Journal Platform";

mail($article['author_email'], $subj, $body);

?>
<html>
<head><title>Publish Article</title></head>
<body>
    <h2>Article Published</h2>
    <p><b><?php echo htmlspecialchars($article['title']); ?></b></p>
    <p>Reference: <?php echo $ref; ?></p>
    <p>DOI Registration: <?php echo $doi_status; ?></p>
    <p>Indexing: <?php echo $index_status; ?></p>

    <?php if ($doi_status == 'failed'): ?>
    <p style="color:orange;">Warning: DOI registration failed. You may need to retry manually.</p>
    <?php endif; ?>

    <?php if ($index_status == 'failed'): ?>
    <p style="color:orange;">Warning: Scholar indexing failed. Article may not appear in search results.</p>
    <?php endif; ?>

    <br>
    <a href="review_article.php?status=approved">Back to Approved Articles</a>
</body>
</html>
<?php
mysqli_close($conn);
mysqli_close($conn_read);
?>
