<?php
    head($tag);
    
    $showPlacement = function() use ($tag) {
        echo divider();
        $tag->render();
        echo divider();
    };
    
    stdtmpl($tag, $showPlacement);
    