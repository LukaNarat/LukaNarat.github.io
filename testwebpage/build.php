<?php
    require 'lib/helpers.php';
    
    function getOrDefault($name, $default = '') {
        return isset($_POST[$name]) ? $_POST[$name] : $default;
    }
    
    $params = [
        'testName' => getOrDefault('testName', 'inline'),
        'placementPosition' => getOrDefault('placementPosition', 'top'),
        'code' => getOrDefault('code', '')
    ];
    
    $tag = Tag::fromParams($params);
    $tag->save();
    
    $nextUrl = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['SCRIPT_NAME']) . '/?tag=' . $tag->id;
    header("Location: {$nextUrl}");
    