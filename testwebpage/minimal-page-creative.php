<?php
    require_once 'config.php';
    require_once 'lib/helpers.php';
?>
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Creative</title>
</head>
<body>
    <br />
    <?php if (@$_GET['iabfif'] == 1): ?>
    <script>
        var inDapIF = true;
    </script>
    <?php endif; ?>
    <?php
        $tag = Tag::fromId($_GET['tag']);
        $tag->render();
    ?>
</body>
</html>