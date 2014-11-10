<?php
    head($tag);
    
    $showPlacement = function() use ($tag) {
        $path = dirname($_SERVER['SCRIPT_NAME']);
        iframe("http://" . Config::$hostileDomain . $path . "/minimal-page-creative.php", ["tag" => $tag->id]);
    };
    
    stdtmpl($tag, $showPlacement);
    