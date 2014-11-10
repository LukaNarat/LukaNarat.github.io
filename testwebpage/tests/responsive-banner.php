<?php
    head($tag);
    
    $showPlacement = function() use ($tag) {
        echo divider();
        echo '<div style="width: 320px; height: 50px; border: 2px solid red; overflow: hidden">';
        $tag->render();
        echo '</div>';
        echo divider();
    };
    
    stdtmpl($tag, $showPlacement);
    