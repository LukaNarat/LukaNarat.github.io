<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Celtra test pages</title>
    <meta name="viewport" content="initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no" />
</head>

<body>

<form action="build.php" name="params" method="post">

<h2>Test page</h2>

Code: <textarea name="code"><?php echo htmlspecialchars($tag->code); ?></textarea>

testName=<select name="testName">
    <option value="">-</option>
<?php
    $testFiles = [];
    foreach (new DirectoryIterator(__DIR__ . '/../tests/') as $file) {
        if (preg_match("/^[a-z].+\.php$/i", $file->getFilename())) {
            $testFiles[] = $file->getFilename();
        }
    }
    
    sort($testFiles);
    
    foreach ($testFiles as $filename) {
        $filename = str_replace(".php", "", $filename);
        
        if ($filename === $tag->testName) {
            $selected = 'selected="selected"';
        }
        else
            $selected = "";
        
        $label = $filename;
        $label = str_replace("test-", "", $label);
        $label = str_replace("-", " ", $label);
        
        echo "<option {$selected} value=" . htmlspecialchars($filename) . ">" .htmlspecialchars($label) . "</option>\n";
    }
?>
</select>

placementPosition=<select name="placementPosition">
    <option value="">-</option>
<?php
    $placementPositions = ['top', 'bottom'];
    foreach ($placementPositions as $ppos) {
        if ($ppos === $tag->placementPosition)
            $selected = 'selected="selected"';
        else
            $selected = '';
        echo "<option {$selected}>{$ppos}</option>\n";
    }
?>
</select>

<input type="submit" value="go &gt;&gt;" />
<input type="button" value="clear" />

<script>
    document.querySelector('input[type=button][value=clear]').addEventListener('click', function() {
        var form = document.querySelector('form[name=params]');
        form.reset();
        form.submit();
    });
    
</script>

</form>
