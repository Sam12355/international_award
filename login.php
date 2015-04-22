<?php
/*
 * login.php
 * @author Lakshan
 */

session_start();
require_once 'db_connect.php';

// already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {

    $username = mysqli_real_escape_string($conn_read, trim($_POST['username']));
    $password = $_POST['password'];

    if (empty($username) || empty($password)) {
        $error = 'Please enter username and password.';
    } else {
        $query = "SELECT id, username, password, full_name, email, role
                  FROM users
                  WHERE username = '$username'
                  LIMIT 1";

        $result = mysqli_query($conn_read, $query);

        if ($result && mysqli_num_rows($result) == 1) {
            $user = mysqli_fetch_assoc($result);

            // passwords stored as md5 hash (that's what we had from the start)
            if (md5($password) == $user['password']) {

                $_SESSION['user_id']   = $user['id'];
                $_SESSION['username']  = $user['username'];
                $_SESSION['full_name'] = $user['full_name'];
                $_SESSION['user_role'] = $user['role'];

                // update last login
                $now = date('Y-m-d H:i:s');
                mysqli_query($conn, "UPDATE users SET last_login = '$now' WHERE id = " . $user['id']);

                header('Location: dashboard.php');
                exit;

            } else {
                $error = 'Invalid password.';
            }
        } else {
            $error = 'User not found.';
        }
    }
}

?>
<html>
<head><title>Login - Scientific Journal Platform</title></head>
<body>
    <h1>Scientific Journal Platform</h1>
    <h3>Login</h3>

    <?php if (!empty($error)): ?>
        <p style="color:red;"><?php echo $error; ?></p>
    <?php endif; ?>

    <form method="POST" action="login.php">
        <label>Username:</label><br>
        <input type="text" name="username" size="30"
               value="<?php echo isset($_POST['username']) ? htmlspecialchars($_POST['username']) : ''; ?>"><br><br>

        <label>Password:</label><br>
        <input type="password" name="password" size="30"><br><br>

        <input type="submit" value="Login">
    </form>
</body>
</html>
<?php
mysqli_close($conn);
mysqli_close($conn_read);
?>
