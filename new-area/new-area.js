/*
    Script for the Dark Souls New Area Generator (https://sibert-aerts.github.io/new-area/)
    Made by Sibert Aerts (Rezuaq), documented as well as I could.
    If you have any questions/remarks about what's going on in this script, feel free to ask.
*/
/*      Sound Stuff     */
// Make a new MultiAudio object, made to be able to play multiple instances
// of the same Audio simultaneously (i.e. overlapping).
class MultiAudio {
    constructor(audioUrl, maxSounds = 10) {
        this.soundArray = new Array(maxSounds);
        for (let i = 0; i < maxSounds; i++)
            this.soundArray[i] = new Audio(audioUrl);
        this.index = 0;
    }
    // Play the next sound in line.
    play() {
        playSound(this.soundArray[this.index]);
        this.index = (this.index + 1) % this.soundArray.length;
    }
    // Pauses all sounds
    pause() {
        for (let i in this.soundArray)
            this.soundArray[i].pause();
    }
}

// Reset and play the given sound unless muted.
function playSound(a){
    if(muted) return;
    a.currentTime = 0;
    a.play();
}

// Toggles whether sounds are allowed to play.
function mute(){
    newAreaSound.pause();
    muted = !muted;
    $("#muteButton").html(muted? "🔇&#xFE0F;" : "🔊&#xFE0F;");
}


var muted = false;
var newAreaSound = new MultiAudio("https://puu.sh/k1OGY.mp3", 50);
var itemGetSound = new Audio("ITEMGET.mp3");

// List of backgrounds that's cycled through randomly
var backgrounds = [
    "https://i.imgur.com/cURcsam.jpg",
    "https://i.imgur.com/uNuqPte.jpg",
    "https://i.imgur.com/d8thQaE.jpg",
    "https://i.imgur.com/ic9I2Uu.jpg",
    "https://i.imgur.com/hjPuO8N.jpg",
    "https://i.imgur.com/9gX5pBB.jpg",
    "https://i.imgur.com/qEk3cZa.jpg",
    "https://i.imgur.com/7qzGveQ.jpg",
    "https://i.imgur.com/ej8kxIW.jpg",
    "https://i.imgur.com/baIPonl.jpg",
    "https://i.imgur.com/kfTzoWv.jpg",
];

async function randomBackground(fade=true) {
    if(fade){
        $("#background-layer").css("background-image", $("body").css("background-image"));
        $("#background-layer").removeClass("faded");
        await sleep(100);
        $("#background-layer").addClass("faded");
    }
    $("body").css("background-image", `url(${choose(backgrounds)})`);
}

// Incredibly dumb: updating the area name actually just sets the anchor, this triggers window.onhashchange, calling parseAnchor
// which then reads & decodes the anchor from the URI, and updates the webpage.
var setAreaName = (text) => { window.location.hash = text };

function parseAnchor(){
    let split = document.URL.split('#');
    if (split.length == 1) return;
    let anchor = split.slice(1).join('#');
    $("#name-underline-wrapper").removeClass("faded-out");
    $("#name").text(decodeURIComponent(anchor));
    smartFadeOut();
}

// Called when the page is loaded.
$(document).ready(function () {
    // Put up a random background
    randomBackground(false);

    // Bind the enter-key event to the custom-text input field
    $("#custom-text").keyup(e => { if (e.keyCode == 13) customGenerate() });

    // DO ANCHOR THINGS
    window.onhashchange = parseAnchor
    parseAnchor();
    
    // Bind the two checkboxes to hide/unhide parts of the page when clicked.
    $("input[target=custom]").on("click", function(){ setHidden("#custom-input", !this.checked) });
    $("input[target=streamer-features]").on("click", function(){ setHidden(".streamer-feature", !this.checked) });

});

// Custom pool
var Custom = {};
Custom.locations = [];
Custom.suffixes = [];
Custom.prefixes = [];

// All the pools together
var allPools = {Dark1, Dark2, Dark3, Demons, Blood, Sekiro, Custom};
var allAreas = Object.keys(allPools).reduce((tot, key) => tot.concat(allPools[key].areas), []);

// Selected pools
var selected = [];

// chroma key background flag
var chroma = false;

function chromaToggle(){
    chroma = !chroma;
    if(chroma)
        $("#main").addClass("chroma");
    else
        $("#main").removeClass("chroma");
    $("#chromaButton").text(chroma? "no chroma" : "chroma")
}

var transp = false;

function transpToggle(){
    transp ^= true;
    if(transp) $('#main').addClass('transp')
    else $("#main").removeClass('transp')
    $("#transpButton").html(transp? '👁&#xFE0F;' : '👓&#xFE0F;');
}

/*      Utility functions     */

// Has a p out of (outof) chance of returning true.
var chance = (p, outof=1) => Math.random() * outof <= p;

// Get a random element from the given list.
var choose = list => list[Math.floor(Math.random() * list.length)];

// Refresh bootstrap tooltips.
var refreshTooltips = () => $('[data-toggle="tooltip"]').tooltip();

// Await this to sleep a given number of milliseconds.
var sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Set an element's hidden state.
var setHidden = (selector, hidden) => hidden? $(selector).addClass("hidden"): $(selector).removeClass("hidden");

// Convert a string to proper case.
function stringToProperCase(s) {
    return s.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

/*      Pools and stuff     */

function compileCustom(){
    Custom.locations = $("#custom-places").val().split(";").filter(x => x != '');
    Custom.prefixes = $("#custom-prefixes").val().split(";").filter(x => x != '');
    Custom.suffixes = $("#custom-suffixes").val().split(";").filter(x => x != '');
}

function isChecked(key){
    return $(`input[target=${key}]`).prop("checked")
}

function selectPools(){
    // clear selected
    selected = [];
    compileCustom();

    // Add all pools whose box is checked to the list of selected pools
    for( let key in allPools )
        if( isChecked(key) )
            selected.push(allPools[key]);
}

// Get a random prefix from the list of selected pools
function randomPrefix(){
    let prefix = choose(choose(selected).prefixes);
    // Add a space if the prefix doesn't end with the special | character
    if (prefix[prefix.length-1] == '|')
        return prefix.slice(0, prefix.length-1);
    return prefix + ' ';
}

var randomLocation = () => choose(choose(selected).locations);

function randomSuffix(){
    let suf = choose(choose(selected).suffixes)
    if (suf[0] == ',') return suf;
    return ' ' + suf;
}

/*      Easter eggs     */

function worldFunc(){
    $("#world-layer").css("background-image", $("body").css("background-image"));
    $("#world-layer").removeClass("faded");
    setTimeout(()=>$("#world-layer").addClass("faded"), 5000);
}

// List of easter egg words, the audio they should play, and optionally the function they should call.
var easterEggs = {
    "The Wall"  : {audio: new Audio("the_wall.mp3")},
    "The World" : {audio: new Audio("the_world.mp3"), func: worldFunc},
    "The Doors" : {audio: new Audio("the_doors.mp3")},
};

// Generate a random area name, and perform any easter eggs if needed.
function generateName(){
    let name = "";
    let allowThe = true;
    let hasPrefix = false;
    let hasSuffix = false;
    
    selectPools();
    
    // if no checkboxes are checked, tell the user to do so
    if( !Object.keys(allPools).reduce((total, key) => total || isChecked(key), false) )
        return "Tick one of the Checkboxes";
    
    // double choose because the parts are hidden in lists within lists
    
    // 3 in 4 chance of adding an area prefix, 1 in 4 chance of adding an additional prefix
    if( chance(3,4) ){
        hasPrefix = true;
        name += randomPrefix();
        if(name[name.length-1] == ' ' && chance(1,4))
            name += randomPrefix();
    }

    // if Dark Souls 2 is enabled, 1 in 30 chance of prepending "Shulva, "
    if( isChecked('Dark2') && chance (1, 30) && hasPrefix ){
        name = choose(shulva) + name;
        allowThe = false;
    }

    // 100% chance of adding a main "location" piece
    name += randomLocation();

    // Fix the case so "BlightTown" turns into "Blighttown"
    name = stringToProperCase(name);

    // 1 in 15 chance to add an area suffix if the name has a prefix
    // 1 in 5 chance to add an area suffix if the name has no prefix
    if( chance( 1, 15 ) || (chance(4,15) && !hasPrefix) ){
        hasSuffix = true;
        name += randomSuffix();
    }

    // Sekiro has no "The" before any area name, so if it's checked... half the chance of "The" being prepended
    allowThe &= isChecked('Sekiro') || chance(0.5);

    // 0% chance to prefix "The" if "Shulva, " is present
    // 1/6 chance if the name is longer than 10 characters
    // 5/6 chance if the name is shorter than 10 characters
    // 100% chance if no prefix or suffix is present yet.
    if( allowThe && (chance(1, 6) || (chance(4, 5) && name.length < 10) || (!hasPrefix && !hasSuffix)))
        name = "The " + name;

    // If it generated an existing name: reward the user with a star and a sound, at a slight delay
    if (allAreas.includes(name)) {
        let theName = name;
        setTimeout(
            function(){
                $("#stars").prepend( $("<span>", {class: "area", "data-toggle": "tooltip", title: theName}).text("★"));
                refreshTooltips();
                playSound(itemGetSound);
            }, 800);
    }

    // Check for easter eggs.
    for(var egg in easterEggs){
        if( egg == name ){
            // 50% chance to actually just generate a new name, since easter eggs are a bit too common otherwise
            if(chance(0.5))
                return generateName();

            newAreaSound.pause();
            $("#stars").prepend( $("<span>", {class: "easter-egg", "data-toggle": "tooltip", title: name}).text("★"));
            refreshTooltips();
            playSound(easterEggs[egg].audio);
            if (easterEggs[egg].func) easterEggs[egg].func();
        }
    }

    return name;
}

var fadeOutID = 0;

// Sets a delay for a fade-out.
// The fade-out only applies if no other fade-out has been called since it was 'queued', and if the box is checked.
// So you're free to call this function whenever you feel like
function smartFadeOut(){
    // grab the desired fadeOutTime
    fadeOutTime = parseFloat($("#fade-out-time").val());
    // default to 5 seconds if fadeOutTime could not be parsed or is negative
    fadeOutTime = fadeOutTime > 0 ? fadeOutTime * 1000 : 5000;
    // Increment the ID to cancel out any previous fade-outs
    let thisId = ++fadeOutID;
    setTimeout(
        () => { if (thisId == fadeOutID && $("#fade-out-check").prop("checked"))
            $("#name-underline-wrapper").addClass("faded-out") },
        fadeOutTime);
}

var count = 0;
var bgCooldown = 0;

// Called by the main "Travel somewhere else" button.
function generate(){
    newAreaSound.play();
    $("#name-underline-wrapper").removeClass("faded-out");
    setAreaName(generateName());

    count++;
    bgCooldown++;

    // Never swap bg within 10 clicks of last swap
    // Always swap bg after 30 clicks
    // 4% chance per click of swapping bg between 10 and 30 clicks
    if( bgCooldown > 10 && (bgCooldown >= 30 || chance(0.04))){
        bgCooldown = 0;
        randomBackground();
    }
}

// Called by the manual override button.
function customGenerate(){
    newAreaSound.play();
    $("#name-underline-wrapper").removeClass("faded-out");
    setAreaName($("#custom-text").val());
}
