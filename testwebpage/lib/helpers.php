<?php
    require_once __DIR__ . '/../config.php';
    
    class Tag {
        public $id;
        public $testName;
        public $placementPosition;
        public $code;
        
        public static function storePath() {
            return __DIR__ . '/../' . Config::$tagstoreDir . '/';
        }
        
        public static function fromParams($params) {
            $tag = new Tag();
            $tag->testName = $params['testName'];
            $tag->placementPosition = $params['placementPosition'];
            $tag->code = $params['code'];
            $tag->id = md5(json_encode(array('testName' => $tag->testName, 'placementPosition' => $tag->placementPosition, 'code' => $tag->code)));
            return $tag;
        }
        
        public static function fromId($id) {
            $tagFilename = Tag::storePath() . $id;
            if (!file_exists($tagFilename)) {
                exit("Can't load a tag from $tagFilename");
            }
            
            $tag = new Tag();
            $tag->id = $id;
            
            $params = json_decode(file_get_contents($tagFilename));
            
            $tag->testName = $params->testName;
            $tag->placementPosition = $params->placementPosition;
            $tag->code = $params->code;
            
            return $tag;
        }
        
        function save() {
            $storePath = Tag::storePath();
            if (!file_exists($storePath) && !mkdir($storePath)) {
                exit("Can't create dir $storePath");
            }
            
            if (file_put_contents($storePath . $this->id, json_encode($this)) === false) {
                exit("Can't write to dir $storePath");
            }
        }
        
        function render() {
            echo $this->code;
        }
    }
    
    function head($tag) {
        include __DIR__ . '/head.php';
    }
    
    function paragraphs($n = 1) {
        $paragraphs = array(
            "Kitsch meh cred wayfarers pug. Bespoke put a bird on it readymade ethnic, quinoa you probably haven't heard of them tattooed sustainable narwhal ennui kitsch umami pork belly. Letterpress blog bicycle rights scenester YOLO. American Apparel pork belly Etsy, you probably haven't heard of them Thundercats meh butcher forage sartorial pop-up raw denim 8-bit. Odd Future gastropub street art sriracha, swag next level farm-to-table Helvetica before they sold out 90's McSweeney's roof party typewriter distillery.",
            "Mumblecore cred crucifix cillum, adipisicing duis Marfa magna cardigan Intelligentsia placeat flexitarian iPhone flannel. Veniam pickled bicycle rights accusamus trust fund quinoa semiotics. High Life officia shabby chic trust fund sustainable. Odd Future sint brunch, readymade swag dolor 3 wolf moon tattooed shabby chic distillery. Trust fund delectus salvia, sunt in officia sint Brooklyn. Salvia mustache enim biodiesel. Ethnic aliqua squid, chillwave PBR leggings ennui Blue Bottle Tonx bicycle rights photo.",
            "Pitchfork Thundercats Godard, 3 wolf moon fixie Echo Park four loko 8-bit plaid lo-fi hashtag pug vinyl meh. Fanny pack American Apparel shabby chic Thundercats, cray biodiesel dreamcatcher sriracha Wes Anderson four loko flexitarian leggings. Marfa mumblecore sriracha, disrupt cray street art jean shorts skateboard American Apparel cliche VHS. Messenger bag skateboard DIY cornhole pork belly trust fund deep v. Vice YOLO Shoreditch, polaroid Pinterest umami banjo disrupt vinyl biodiesel Intelligentsia literally.",
            "Intelligentsia ethical banjo quinoa swag. Master cleanse pop-up Carles, blog put a bird on it Marfa artisan you probably haven't heard of them bitters skateboard beard before they sold out salvia swag. Pitchfork Marfa artisan, actually retro lo-fi Brooklyn vinyl viral craft beer Etsy pickled. PBR sriracha narwhal single-origin coffee, literally artisan kitsch chia slow-carb church-key. Twee typewriter 8-bit food truck, direct trade banh mi quinoa authentic. Intelligentsia Austin raw denim Bushwick plaid.",
            "Sint enim ullamco, VHS excepteur ut paleo Banksy exercitation High Life gentrify cornhole deep v. Quinoa +1 ad, id exercitation incididunt semiotics before they sold out irony iPhone. Pour-over non nihil, drinking vinegar American Apparel squid veniam deserunt Truffaut craft beer 90's four loko. Cardigan salvia Shoreditch slow-carb disrupt. Drinking vinegar 8-bit Austin DIY brunch. Put a bird on it culpa Portland, nisi delectus 90's single-origin coffee trust fund tattooed lo-fi Vice vegan High Life ullamco.",
            "Intelligentsia mustache vinyl, Portland pug cred Odd Future Neutra flannel Kickstarter. Beard normcore asymmetrical roof party, meh four loko fixie bespoke literally art party. Swag art party literally kale chips authentic. Meggings flexitarian ethnic single-origin coffee letterpress bitters raw denim DIY, meh 90's scenester. Truffaut Vice Austin pour-over, narwhal tousled selvage. Tousled cardigan DIY, farm-to-table pour-over kale chips seitan single-origin coffee hella. Etsy craft beer skateboard brunch."
        );
        
        for ($i = 0; $i < $n; $i++) {
            echo '<p>' . $paragraphs[rand(0, count($paragraphs) - 1)] . '</p>' . "\n\n";
        }
    }
    
    function stdtmpl($tag, $showPlacementFunc) {
        if ($tag->placementPosition === 'top') $showPlacementFunc();
        paragraphs(4);
        if ($tag->placementPosition === 'bottom') $showPlacementFunc();
    }
    
    function divider() {
        return "\n<br/>" . '<div style="height: 30px; background: yellow"></div>' . "<br />\n";
    }
    
    function iframe($src, $params, $useDividers = true) {
        $params['_r'] = rand();
        if ($useDividers) echo divider();
        echo '<iframe width="95%" height="200px" src="' . $src . '?' . http_build_query($params) . '"></iframe>';
        if ($useDividers) echo divider();
    }
    
    function tail() {
        include __DIR__ . '/tail.php';
    }
    