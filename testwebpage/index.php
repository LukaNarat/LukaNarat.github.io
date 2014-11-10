<?php
    error_reporting(E_ALL);
    ini_set('display_errors', 'stdout');
    
    require_once './lib/helpers.php';

    if (isset($_GET['tag'])) {
        $tag = Tag::fromId($_GET['tag']);
    }
    else {
        $tag = new Tag();
    }
    
    if (!$tag->testName)
        $tag->testName = 'inline';
    
    if ($tag->testName) {
        $testFilename = __DIR__ . '/tests/' . $tag->testName . '.php';
    }
    
    if (!$tag->placementPosition)
        $tag->placementPosition = 'top';
    
    if ($testFilename && file_exists($testFilename) && dirname($testFilename) === __DIR__ . '/tests') {
        include $testFilename;
    }
    
    tail();
