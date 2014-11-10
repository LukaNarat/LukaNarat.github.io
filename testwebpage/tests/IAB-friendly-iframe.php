<?php
    head($tag);
    
    $showPlacement = function() use ($tag) {
        iframe("minimal-page-creative.php", ["tag" => $tag->id, 'iabfif' => 1]);
    };
    
    stdtmpl($tag, $showPlacement);
    