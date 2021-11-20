var appBusy = true;

// alert
var alertEnabled = false;
function showAlert(message, messageType = "success") {
    if (alertEnabled) {
        $('#alert').css('visibility', 'hidden');
        alertEnabled = false;
    }
    alertEnabled = true;
    ++appBusy;
    $('#alert').removeClass('alert-success');
    $('#alert').removeClass('alert-danger');
    $('#alert').addClass('alert-' + messageType);
    $('#alert-text').text(message);
    $('#alert').css('visibility', 'visible');
    $('#alert').alert();
    setTimeout(function(){$('#alert').alert('dispose');
    $('#alert').css('visibility', 'hidden');
        alertEnabled = false;
    }, 5000);
    --appBusy;
}

function showAlert_more(message, messageType = "success") {
    if (alertEnabled) {
        $('#alert').css('visibility', 'hidden');
        alertEnabled = false;
    }
    alertEnabled = true;
    ++appBusy;
    $('#alert').removeClass('alert-success');
    $('#alert').removeClass('alert-danger');
    $('#alert').addClass('alert-' + messageType);
    $('#alert-text').text(message);
    $('#alert').css('visibility', 'visible');
    $('#alert').alert();
    setTimeout(function(){$('#alert').alert('dispose');
    $('#alert').css('visibility', 'hidden');
        alertEnabled = false;
    }, 10000);
    --appBusy;
}

function showAlertFixed(message, messageType = "success") {
    ++appBusy;
    $('#alert-fix-text').text(message);
    $('#loading').show();
    --appBusy;
}

showPopup('popup1');

function showPopup(id) {
    var popup = document.getElementById(id);
    popup.classList.add("show");
}

function closePopup(id) {
    var popup = document.getElementById(id);
    popup.classList.remove("show");
}

function hideAlertFixed() {
    $('#loading').hide();
}

// internal states
var graphDataNextGroup = 0;
var inPractice = false;
var withDictionary = false;
var designBriefPractice = "You are designing a minivan for a mom with three kids.  She wants to overwrite an uncool “soccer mom” image and show off her clever choice.";
var designBriefA = "Imagine a car for the megalopolis of tomorrow and consider four important aspects: environmental friendliness, social harmony, interactive mobility, and economic efficiency.";
var designBriefB = "Design a vehicle to improve mobility for low-income individuals with physical disabilities. Help the user move independently across difficult, uneven, narrow or inclined terrain.";
var designBrief = "";
var inTraining = true;
var urlHashString = window.location.hash.substr(1);
var numSetWords = 0;

var log = "";

if (urlHashString == "DA") {
    designBrief = designBriefA;
    withDictionary = true;
} else if (urlHashString == "DB") {
    designBrief = designBriefB;
    withDictionary = true;
} else if (urlHashString == "DP") {
    designBrief = designBriefPractice;
    withDictionary = true;
    inPractice = true;
} else if (urlHashString == "GA") {
    designBrief = designBriefA;
    withDictionary = false;
} else if (urlHashString == "GB") {
    designBrief = designBriefB;
    withDictionary = false;
} else if (urlHashString == "GP") {
    designBrief = designBriefPractice;
    withDictionary = false;
    inPractice = true;
}
if (inPractice) {
    $("#stopwatch-button").text("Start Practice");
}

// SE
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        ++appBusy;
        this.sound.cloneNode().play();
        --appBusy;
    };
    this.stop = function () {
        this.sound.pause();
    };
}

$.ajaxSetup({ async: true, timeout: 100000 });

// parameters
const wordRegexPattern = /^[a-z\-]+$/;
const controlPanelWidth = 576; //$("#control-panel").width();
const wrapperRightPadding = 0;
const navbarHeight = $("#navbar").innerHeight();
const chargeStrength = -50;
var soundEffect_started = new sound("../sound/golf0.mp3");
var soundEffect_wordSet = new sound("../sound/golf1.mp3");
const draggableWordWidth = 128;
const draggableWordHeight = 24;
const maxScaledDistance = 100.0;
const minScaledDistance = 0.0;

// global variables
var word1 = null; // The following four variables corresponds to the words in the Character Space a.k.a. Design Concept Map.
var word2 = null;
var word3 = null;
var word4 = null;
var debugMode = false;
var selectedNode = null;
var selectedWord = null;
var dragInitialX = 0;
var dragInitialY = 0;
var pageX = 0;
var pageY = 0;
var dragMoved = false;
var draggedWord = null;
var draggedWordElement = null;
var relatedWordsCache = {};
var isCacheBeingLoaded = false;
var newWords = [];
var timer_startTime = 0;
var timer_elapsedTime = 0;
var timer_interval;
var CosSimTh_low = -0.2;
var CosSimTh_high = 0.65;
var template = "My design concept is W1-W2.  It has a sense of W2 yet it is W1, not W3.  It is W1, but not W4.  In this design, W1 and W2 can go together."
var combinationW1W2 = {};
var adjectivesW1 = []

// D&D
const isDescendant = (e, parentID) => {
    var isChild = false;
    if (e.id === parentID) isChild = true;
    while (e == e.parentNode)
        if (e.id == parentID)
            isChild = true;
    return isChild;
};

var dialog = document.getElementById("dialog");
// var dialog_close = document.getElementById("dialog_close");
// dialog_close.onclick = function() {
//   dialog.style.display = "none";
// }
function openDialog() {
  dialog.style.display = "block";
}

// Graph
var numDimensions = 3; // 3 or 2
var graphData = {
    nodes: [],
    links: []
};
var graph = null; // An instance of <SVG />

function toggleDimentionSwitch() {
    $("#graph-3d-button").toggleClass("btn-outline-secondary");
    $("#graph-3d-button").toggleClass("btn-secondary");
    $("#graph-2d-button").toggleClass("btn-outline-secondary");
    $("#graph-2d-button").toggleClass("btn-secondary");
}

function toggleDimention() {
    graph.pauseAnimation();
    graph.cooldownTime(0);
    numDimensions = (numDimensions == 2) ? 3 : 2;
    graph.graphData({
        nodes: graphData.nodes.map(function (node) { return { id: node.id, group: node.group }; }),
        links: graphData.links.map(function (link) { return { source: link.source, target: link.target, distance: link.distance }; })
    });
    initializeGraph();
    toggleDimentionSwitch();
}

var width = window.innerWidth - controlPanelWidth - wrapperRightPadding;
var height = window.innerHeight - navbarHeight;

function setComponentSizes() {
    if (appBusy)
        return;
    ++appBusy;
    $("#body").width(window.innerWidth);
    $("#body").height(window.innerHeight);

    $("#wrapper").width(window.innerWidth - wrapperRightPadding);
    $("#wrapper").height(window.innerHeight);
    var navbarHeight = $("#navbar").innerHeight();

    width = window.innerWidth - controlPanelWidth - wrapperRightPadding;
    height = window.innerHeight - navbarHeight;
    // $("#graph").css("left", 0);
    $("#graph").css("top", navbarHeight + 52);
    // $("#graph").css("overflow", 'auto');
    $("#graph").width(width);
    $("#design-brief-container").width(width - 40);
    $("#graph").height(height);
    if (graph) {
        graph
            .width(width);
            // .height(height);
    }

    $("iframe").css("left", 0);
    $("iframe").css("top", navbarHeight);
    $("iframe").width(width);
    $("iframe").height(height);

    $("#control-panel").css("left", width);
    $("#control-panel").css("top", navbarHeight);
    $("#control-panel").width(controlPanelWidth);
    $("#control-panel").height(height);

    $("#explorer-header").css("left", 0);
    $("#explorer-header").css("top", navbarHeight);
    $("#explorer-header").outerWidth(width);
    $("#explorer-header").outerHeight($("#character-space-heading").outerHeight());

    $("#alert").css("left", 0);
    $("#alert").css("top", navbarHeight);
    $("#alert").outerWidth(width);
    $("#alert").outerHeight($("#character-space-heading").outerHeight());
    --appBusy;
}

function calculateDistanceFromCamera(c, x, y, z) {
    var dist = (c.x - x) * (c.x - x);
    dist += (c.y - y) * (c.y - y);
    dist += (c.z - z) * (c.z - z);
    dist = Math.sqrt(dist);
    dist = Math.max(dist, 300) - 300;
    dist = dist / 500;
    dist = 1 - dist;
    return dist;
}

// Create a DIV element and add it to $("#dragged-word-container").
function createDraggedWord(e, w) {
    ++appBusy;
    draggedWord = w;
    draggedWordElement = $("<div />", {
        id: "dragged-word",
        class: "draggable-word",
        text: draggedWord,
        css: {
            "color": "black",
            "background-color": "white",
            "position": "fixed",
            "left": "" - Math.floor((e.pageX - draggableWordWidth) / 2) + "px",
            "top": "" - Math.floor((e.pageY - draggableWordHeight) / 2) + "px"
        }
    });
    $("#dragged-word-container").append(draggedWordElement);
    --appBusy;
}

function focusOnNode(node) {
    if (!graph)
        return;
    ++appBusy;
    const distance = 160;
    const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
    if (numDimensions == 3) {
        graph.cameraPosition({
            x: node.x * distRatio,
            y: node.y * distRatio,
            z: node.z * distRatio
        }, // new position
            node, // lookAt ({ x, y, z })
            2000 // ms transition duration
        );
    }
    --appBusy;
}

function focusOnWord(word) {
    if (!graph)
        return;
    var node = graphData.nodes.find(element => element.id == word);
    if (!node)
        return;
    focusOnNode(node);
}

function generateExplorer(syns) {
    ++appBusy;
    // console.log(syns)
    adjectivesW1.push(syns);
    content = "<div class='col'>"
    syns.forEach((a, i) => {
        content += "<div class='text-center " + ((i == 0) ? "text-warning " : "") + "draggable-word mx-auto my-1 d-block'>" + a + "</div>"
    });
    content += "</div>"
    $("#explorer-panel").append(content);
    checkScrollBar();
    hideAlertFixed();
    --appBusy;
}

function generateExplorerW1W2(combs) {
    ++appBusy;
    $("#graph").empty();
    content = "<div class='d-flex' id='explorer-panel' style='overflow: auto;'>"
    Object.keys(combs).forEach(w1 => {
        content += "<div class='col'>"
        content += "<div class='text-center mx-auto my-1 d-block combination text-primary'>" + w1 + "<span id='delete-comb' onclick=\"deleteComb('" + w1 + "')\"></span></div>"
        combs[w1].forEach(comb => {
            content += "<div class='text-center draggable-word mx-auto my-1 d-block combination'>" + comb + "</div>"
        });
        content += "</div>"
    });
    content += "</div>"
    $("#graph").append(content);
    $("#explorer-panel").height(height - 52);
    checkScrollBar();
    hideAlertFixed();
    --appBusy;
}

function deleteComb(key) {
    delete combinationW1W2[key];
    generateExplorerW1W2(combinationW1W2)
}

function generateExplorerW1(adjs) {
    ++appBusy;
    adjectivesW1 = adjs;
    $("#graph").empty();
    content = "<div class='d-flex' id='explorer-panel' style='overflow: auto;'>"
    adjs.forEach(adj => {
        content += "<div class='col'>"
        adj.forEach((a, i) => {
            content += "<div class='text-center " + ((i == 0) ? "text-warning " : "") + "draggable-word mx-auto my-1 d-block'>" + a + "</div>"
        });
        content += "</div>"
    });
    content += "</div>"
    $("#graph").append(content);
    $("#explorer-panel").height(height - 52);
    checkScrollBar();
    hideAlertFixed();
    showPopup('popup2');
    --appBusy;
}

function processRelatedWords(keyword, result) {
    graphDataNextGroup += 1;
    $.each(result, function (i, edge) {
        var similarity = edge.distance;
        var relativeFrequency = edge['relative-frequency'];
        var isRelativeFrequencyInRange = (1 <= relativeFrequency && relativeFrequency <= 2000);
        var isSimilarityInRange = (numSetWords >= 1 && keyword == word1) ? (0.05 <= Math.abs(similarity) && Math.abs(similarity) <= 0.5) : true;
        var extendSearch = false;
        if ((numSetWords >= 2 && keyword == word1) || (numSetWords >= 3 && keyword == word2)) {
            isRelativeFrequencyInRange = isSimilarityInRange = true;
            // extendSearch = true;
        }

        if (isRelativeFrequencyInRange && isSimilarityInRange && edge.word.match(wordRegexPattern)) {
            var word = edge.word;
            var distance = 1 - edge.distance;
            distance = distance * (maxScaledDistance - minScaledDistance) + minScaledDistance;
            if (!graphData.nodes.find(element => element.id == word)) {
                graphData.nodes.push({
                    group: graphDataNextGroup,
                    id: word
                });
                if (extendSearch) searchConceptNet(word);
                else newWords.push(word);
            }
            if (!graphData.nodes.find(element => ((element.source == keyword && element.target == word) || (element.source == word && element.target == keyword)))) {
                graphData.links.push({
                    source: keyword,
                    target: word,
                    distance: distance
                });
            }
        }
    });
    graph.graphData(graphData);
    graph.refresh();
}

function searchConceptNet(keyword) {
    if (keyword.length == 0)
        return;

    generateExplorer(keyword)

    if (debugMode) {
        showAlert(keyword);
        showAlert(url);
    }

    if (soundEffect_started)
        soundEffect_started.play();
}

function timeToString(time) {
    var diffInHrs = time / 3600000;
    var hh = Math.floor(diffInHrs);

    var diffInMin = (diffInHrs - hh) * 60;
    var mm = Math.floor(diffInMin);

    var diffInSec = (diffInMin - mm) * 60;
    var ss = Math.floor(diffInSec);

    var diffInMs = (diffInSec - ss) * 100;
    var ms = Math.floor(diffInMs);

    var formattedMM = mm.toString().padStart(2, "0");
    var formattedSS = ss.toString().padStart(2, "0");
    var formattedMS = ms.toString().padStart(2, "0");

    return `${formattedMM}:${formattedSS}:${formattedMS}`;
}

function startStopwatch() {
    timer_startTime = Date.now() - timer_elapsedTime;
    timer_interval = setInterval(function printTime() {
        timer_elapsedTime = Date.now() - timer_startTime;
        document.getElementById("stopwatch-display").innerHTML = timeToString(timer_elapsedTime);
    }, 10);
    // $("#finish-button").css("visibility", "visible");
    $("#stopwatch-button").css("visibility", "hidden");
    $("#stopwatch-display").css("visibility", "hidden");
    $("#manual-search").css("visibility", "visible");
    $("#word3").css("visibility", "hidden");
    $("#word3-text").css("display", "block");
    $("#word4").css("visibility", "hidden");
    $("#word4-text").css("display", "block");
    $("#word-pool").empty()
}

function stopStopwatch() {
    clearInterval(timer_interval);
    timer_elapsedTime = 0;
    $("#finish-button").css("visibility", "hidden");
    $("#stopwatch-button").css("visibility", "visible");
    $("#stopwatch-display").css("visibility", "visible");
    $("#manual-search").css("visibility", "hidden");
    $('#search-w3w4-space-button').css('visibility', 'hidden');
    $('#search-w2-word-pool-button').css('visibility', 'hidden');

    log += "\n\n<Final Selection of Words> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    log += word1 + ", " + word2 + ", " + word3 + ", " + word4;
    $("#final_result").text('');
    $("#session_key").text('');
    result = template.replaceAll('W1', word1).replaceAll('W2', word2).replaceAll('W3', word3).replaceAll('W4', word4);
    $("#final_result").text(result);
    log += "\n\n<Final Result> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    log += result
    $.post( "https://yuriom.pythonanywhere.com/api/save_log", { log: log })
    .done(function( data ) {
        $("#session_key").text(data);
        openDialog();
    });
}

$("#copy_key").click(function () {
    var $temp = $("<textarea>");
    $("body").append($temp);
    $temp.val($('#final_result').text() + "\r\n" + $('#session_key').text()).select();
    document.execCommand("copy");
    $temp.remove();
});

$("#stopwatch-button").click(function () {
    if ($("#design-brief").val() == "") {
        showAlert("Design brief required");
        return;
    }
    designBrief = $("#design-brief").val();
    log = "";
    clearCharacterSpace();
    startStopwatch();
    showAlertFixed('Extracting words from Design Brief...')
    extractWordFromDesignFrief();
});


$("#finish-button").click(function () {
    stopStopwatch();
});

function extractWordFromDesignFrief() {
    $.getJSON("https://yuriom.pythonanywhere.com/api/get_noun_adj?text=" + designBrief,
        function (data) {
            if (data.noun.length > 0 || data.adj.length > 0 ) {
                log += "<Design brief> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
                log += designBrief;
                log += "\n\n<Result of word extract> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
                log += "Adjectives : " + data.adj.join(", ");
                log += "\nNouns : " + data.noun.join(", ");
                convertNounToAdj(data);
            } else {
                showAlert("Extracting failed.", "danger");
            }
        });
}

function convertNounToAdj(data) {
    showAlertFixed("Filtering none-convertable nouns...");
    result_word = [].concat(data.adj);
    log += "\n\n<Final result of extract words from design brief> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $.getJSON("https://yuriom.pythonanywhere.com/api/noun_adj_convertor?word=" + data.noun.join() + "&from=n&to=a",
        function (data) {
            if (data != '-1') {
                result_word = result_word.concat(data)
                log += result_word.join(", ");
                processingRelatedWords(result_word)
            }
        });
}


function processingRelatedWords(result_word) {
    showAlertFixed("Processing related adjectives...");
    log += "\n\n<Bunches of related words> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $.getJSON("https://yuriom.pythonanywhere.com/api/get_all_related_words_as_adj?word=" + result_word.join(),
        function (data) {
            data.forEach(bunch => {
                log += bunch[0] + " -> " + bunch.join(", ") + "\n\n";
            });
            generateExplorerW1(data);
        });
}

function updateCharacterSpace(step) {
    if (step == 0) {
        $("#word1-container").text("word1").css("color", "white");
        $("#word2-container").text("word2").css("color", "white");
        $("#word3-container").text("word3").css("color", "white");
        $("#word4-container").text("word4").css("color", "white");

        $("#design-concept-map-quadrant-internal-area1").css("background-color", "transparent");
        $("#design-concept-map-quadrant-internal-area2").css("background-color", "transparent");
        $("#design-concept-map-quadrant-internal-area3").css("background-color", "transparent");
        $("#design-concept-map-quadrant-internal-area4").css("background-color", "transparent");
    } else if (step == 1) {
        $("#word1-container").text(word1).css("color", "LightBlue");
        $("#word2-container").text(word2).css("color", "LightBlue");
        $("#word3-container").text("word3").css("color", "white");
        $("#word4-container").text("word4").css("color", "white");

        $("#design-concept-map-quadrant-internal-area1").text("\"" + word1 + " " + word2 + "\"").css("background-color", "LightBlue");
        $("#design-concept-map-quadrant-internal-area2").css("background-color", "transparent");
        $("#design-concept-map-quadrant-internal-area3").css("background-color", "transparent");
        $("#design-concept-map-quadrant-internal-area4").css("background-color", "transparent");
    } else if (step == 2) {
        $("#word1-container").text(word1).css("color", "LightBlue");
        $("#word2-container").text(word2).css("color", "LightBlue");
        $("#word3-container").text(word3).css("color", "LightPink");
        $("#word4-container").text(word4).css("color", "LightPink");

        $("#design-concept-map-quadrant-internal-area1").text("\"" + word1 + " " + word2 + "\"").css("background-color", "LightBlue");
        $("#design-concept-map-quadrant-internal-area2").text("\"" + word3 + " " + word2 + "\"").css("background-color", "LightPink");
        $("#design-concept-map-quadrant-internal-area3").text("\"" + word3 + " " + word4 + "\"").css("background-color", "LightPink");
        $("#design-concept-map-quadrant-internal-area4").text("\"" + word1 + " " + word4 + "\"").css("background-color", "LightPink");
    }
}

function clearCharacterSpace() {
    numSetWords = 0;
    word1 = word2 = word3 = word4 = null;
    updateCharacterSpace(0);
}

function setWordInCharacterSpace(searchWord) {
    if (numSetWords < 4) {
        if (numSetWords == 0) {
            word1 = searchWord;
        } else if (numSetWords == 1) {
            if (word1 == searchWord) return;
            word2 = searchWord;
        } else if (numSetWords == 2) {
            if (word1 == searchWord) return;
            if (word2 == searchWord) return;
            word3 = searchWord;
        } else if (numSetWords == 3) {
            if (word1 == searchWord) return;
            if (word2 == searchWord) return;
            if (word3 == searchWord) return;
            word4 = searchWord;
        }
        ++numSetWords;
        updateCharacterSpace();

        if (soundEffect_wordSet)
            soundEffect_wordSet.play();
        // addWordToWordPool(searchWord);

        setTimeout(function() {
            if (!withDictionary) {
                if (numSetWords == 1) {
                    showAlert("Word 1 is set to " + word1 + ".");
                } else if (numSetWords == 2) {
                    showAlert("Word 2 is set to " + word2 + ".");
                } else if (numSetWords == 3) {
                    showAlert("Word 3 is set to " + word3 + ".");
                } else if (numSetWords) {
                    showAlert("Word 4 is set to \"" + word4 + ".\" Congratulations!");
                }
            } else {
                if (numSetWords == 1) {
                    showAlert("Word 1 is set to \"" + word1 + ".\"");
                } else if (numSetWords == 2) {
                    showAlert("Word 2 is set to \"" + word2 + ".\"");
                } else if (numSetWords == 3) {
                    showAlert("Word 3 is set to \"" + word3 + ".\"");
                } else if (numSetWords) {
                    showAlert("Word 4 is set to \"" + word4 + ".\" Congratulations!");
                }
            }
        }, 1000);
    }
}

function undoSetWord() {
    if (numSetWords == 4) {
        $("#word" + numSetWords + "-container").css("color", "white").text("word4").removeClass("draggable-word");
        $("#design-concept-map-quadrant-internal-area3").css("background-color", "transparent").text("");
        $("#design-concept-map-quadrant-internal-area4").css("background-color", "transparent").text("");
    } else if (numSetWords == 3) {
        $("#word" + numSetWords + "-container").css("color", "white").text("word3").removeClass("draggable-word");
        $("#design-concept-map-quadrant-internal-area2").css("background-color", "transparent").text("");
    } else if (numSetWords == 2) {
        $("#word" + numSetWords + "-container").css("color", "white").text("word2").removeClass("draggable-word");
        $("#dsesign-concept-map-quadrant-internal-area1").css("background-color", "transparent").text("");
    } else if (numSetWords == 1) {
        $("#word" + numSetWords + "-container").css("color", "white").text("word1").removeClass("draggable-word");
    }
    --numSetWords;
}

function addWordToWordPool(word) {
    if (word.includes('-')) {
        comb = word.split('-');
        if (comb.length != 2) {
            showAlert("Please insert combination of Word1 and Word2", "danger");
            return;
        }
        word1 = comb[0];
        word2 = comb[1];
        word3 = '';
        word4 = '';
        updateCharacterSpace(1);
        $('#word3').css('visibility', 'hidden');
        $("#word3-text").css("display", "block");
        $('#word4').css('visibility', 'hidden');
        $("#word4-text").css("display", "block");
        $('#search-w3w4-space-button').css('visibility', 'visible');
        return;
    }
    if ($("#word-pool").has(".pooled-word--" + word).length)
        return;
    var devareButton = $("<span />", {
        text: "x",
        css: {
            "color": "red",
            "background-color": "transparent"
        }
    }).click(function () {
        $(this).parent().remove();
        checkSearchW2ButtonVisibility();
        return false;
    });
    var draggableWord = $("<span />", {
        class: "draggable-word pooled-word--" + word,
        text: word,
        css: {
            "color": "white",
            "background-color": "transparent"
        }
    });
    var newEntry = $("<span />").append(draggableWord).append(devareButton);
    $("#word-pool").append(newEntry);
    checkSearchW2ButtonVisibility();
}

function checkSearchW2ButtonVisibility() {
    if ($('#word-pool').children().length == 5)
        $('#search-w2-word-pool-button').css('visibility', 'visible');
    else
        $('#search-w2-word-pool-button').css('visibility', 'hidden');
}

function isWordAlreadyInCharacterSpace(word) {
    return (numSetWords >= 1 && word == word1) || (numSetWords >= 2 && word == word2) || (numSetWords >= 3 && word == word3) || (numSetWords >= 4 && word == word4);
}

function checkScrollBar(){
    var graph = $('#graph')[0];
    var panel = $('#explorer-panel')[0];

    if (panel.scrollWidth > graph.scrollWidth) {
        $('#scroll_tip').css('visibility', 'visible');
    } else {
        $('#scroll_tip').css('visibility', 'hidden');
    }
};

function lookUpWordInDictionary(word) {
    if (!withDictionary)
        return;
    $("#graph").empty();
    $("#graph").append($("<iframe />", {
        id: "online-dictionary-content",
        width: width,
        height: height,
        src: "https://www.merriam-webster.com/thesaurus/" + word,
        css: {
            "border": "0px"
        }
    }));
    addWordToWordPool(word);
}

function wordFilter(word) {
    return word.match(wordRegexPattern);
}

function adjectiveChecker(word, onSuccess)
{
    var key = "9aaa17a6-3628-4683-9454-e651c1472cd5"
    $.getJSON("https://www.dictionaryapi.com/api/v3/references/thesaurus/json/" + word + "?key=" + key,
        function (data) {
            if (data[0] && data[0].meta) {
                var result = [].concat.apply([word], data[0].meta.syns);
                onSuccess(result);
            } else {
                showAlert("Please enter an adjective.", "danger");
            }
        });
}

function defineTextBoxWithButton(textBoxSelector, buttonSelector, filter, handler)
{
    $(textBoxSelector).on("keypress", function (e) {
        var word = $(textBoxSelector).val().trim();
        const key = e.keyCode || e.charCode || 0;
        if (key == 13 && filter(word)) {
            e.preventDefault();
            handler(word);
            // $(textBoxSelector).val("");
        }
    });

    $(buttonSelector).on("click", function (e) {
        var word = $(textBoxSelector).val().trim();
        if (filter(word)) {
            handler(word);
            // $(textBoxSelector).val("");
        }
    });
}

function searchW2() {
    words1 = []
    if ($('#word-pool').children().length != 5)
        showAlert("Please select 5 candidates of Word1.", "danger");
    else {
        log += "<Candidates of Word1> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
        $('#word-pool')[0].querySelectorAll('span[class*=pooled-word--]').forEach(ele => words1.push(ele.className.replace('draggable-word pooled-word--','')))
        log += words1.join(", ");
        getAllRelatedNouns(words1);
    }
};

function getAllRelatedNouns(words1) {
    showAlertFixed("Generating combination with candidates of Word1 and its related nouns...");
    log += "\n\n<Result of combinations of word1 and its related nouns> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $.getJSON("https://yuriom.pythonanywhere.com/api/get_all_combinations_w1_w2?word=" + words1.join() + "&low=-0.2&high=0.65",
        function (data) {
            Object.keys(data).forEach(w1 => {
                log += w1 + " -> " + data[w1].join(", ") + "\n\n";
            });
            combinationW1W2 = data;
            generateExplorerW1W2(data);
            showPopup('popup3');
        });
}

function generateCandidatesW3W4() {
    log += "<Selected " + word1 + " - " + word2 + " combination as Word1 and Word2> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $.getJSON("https://yuriom.pythonanywhere.com/api/get_antonyms_w1_w2?word1=" + word1 + "&word2=" + word2,
        function (data) {
            log += word1 + " antonyms (Word3) -> " + data[word1].join(", ") + "\n\n";
            log += word2 + " antonyms (Word4) -> " + data[word2].join(", ") + "\n\n";
            generateW3W4Selector(data);
            showPopup('popup4');
        });
}

function generateW3W4Selector(data) {
    ++appBusy;
    $("#word3").empty();
    content3 = "<select id='word3_select' class='p-1'>"
    data[word1].forEach(ant => {
        content3 += "<option value='" + ant + "'>" + ant + "</option>"
    });
    content3 += "</select>"
    $("#word3").append(content3);

    $("#word4").empty();
    content4 = "<select id='word4_select' class='p-1'>"
    data[word2].forEach(ant => {
        content4 += "<option value='" + ant + "'>" + ant + "</option>"
    });
    content4 += "</select>"
    $("#word4").append(content4);

    if (data[word1].length == 0 && data[word2].length == 0) {
        showAlert_more("There was no antonyms for '" + word1 + "' and '" + word2 + "'.  Please put a word for word 3 and word 4 that is contrasting to the word 1 and word 2, alternatively, you can drag & drop other combinations of word1-word2", "danger");
        generateInput(3);
        generateInput(4);
    } else {
        if (data[word1].length == 0) {
            showAlert_more("There was no antonyms for '" + word1 + "'.  Please put a word for word 3 that is contrasting to the word 1, alternatively, you can drag & drop other combinations of word1-word2", "danger");
            generateInput(3);
        }
        if (data[word2].length == 0) {
            showAlert_more("There was no antonyms for '" + word2 + "'.  Please put a word for word 4 that is contrasting to the word 2, alternatively, you can drag & drop other combinations of word1-word2", "danger");
            generateInput(4);
        }
    }

    $("#word3_select").on("change", function (e) {
        selectedWord3(e.target.value);
    });
    $("#word4_select").on("change", function (e) {
        selectedWord4(e.target.value);
    });

    if (data[word1].length != 0)
        selectedWord3(data[word1][0]);
    if (data[word2].length != 0)
        selectedWord4(data[word2][0]);

    $('#word3').css('visibility', 'visible');
    $("#word3-text").css("display", "none");
    $('#word4').css('visibility', 'visible');
    $("#word4-text").css("display", "none");
    --appBusy;
    hideAlertFixed();
}

function generateInput(target) {
    if (target == 3) {
        $("#word3").empty();
        content3 = "<input id='word3_input' value='' style='width: 100px;'>"
        $("#word3").append(content3);
    }
    if (target == 4) {
        $("#word4").empty();
        content4 = "<input id='word4_input' value='' style='width: 100px;'>"
        $("#word4").append(content4);
    }

    $("#word3_input").on("change", function (e) {
        selectedWord3(e.target.value);
    });
    $("#word4_input").on("change", function (e) {
        selectedWord4(e.target.value);
    });
}

function selectedWord3(w3) {
    word3 = w3;
    log += "\n\n<Selected " + word3 + " as Word3> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $("#word3-container").text(word3).css("color", "LightPink");
    $("#design-concept-map-quadrant-internal-area2").text("\"" + word3 + " " + word2 + "\"").css("background-color", "LightPink");
    if (word4 != '')
        $("#design-concept-map-quadrant-internal-area3").text("\"" + word3 + " " + word4 + "\"").css("background-color", "LightPink");
    else
        $("#design-concept-map-quadrant-internal-area3").css("background-color", "transparent");
    checkFinishButtonVisibility();
}

function selectedWord4(w4) {
    word4 = w4;
    log += "\n\n<Selected " + word4 + " as Word4> " + $("#stopwatch-display")[0].innerHTML + "\n\n";
    $("#word4-container").text(word4).css("color", "LightPink");
    $("#design-concept-map-quadrant-internal-area4").text("\"" + word1 + " " + word4 + "\"").css("background-color", "LightPink");
    if (word3 != '')
        $("#design-concept-map-quadrant-internal-area3").text("\"" + word3 + " " + word4 + "\"").css("background-color", "LightPink");
    else
        $("#design-concept-map-quadrant-internal-area3").css("background-color", "transparent");
    checkFinishButtonVisibility();
}

function checkFinishButtonVisibility() {
    if (word1 != '' && word1 != null && word2 != '' && word2 != null && word3 != '' && word3 != null && word4 != '' && word4 != null)
        $("#finish-button").css("visibility", "visible");
    else
        $("#finish-button").css("visibility", "hidden");
}

function searchW3W4() {
    showAlertFixed("Generating candidates of Word3 and Word4...");
    generateCandidatesW3W4();
}

function init() {

    defineTextBoxWithButton("#character-space-box", "#set-word-in-character-space-button", wordFilter, setWordInCharacterSpace);

    var pointerDownHandler = (e) => {
        if (!e.isTrusted)
            return;
        pageX = e.pageX;
        pageY = e.pageY;
        var leftMouseButtonOnlyDown = e.buttons === undefined ? e.which === 1 : e.buttons === 1;
        if (leftMouseButtonOnlyDown && !draggedWord && (($("#graph").has($(e.target)).length && selectedWord) || $(e.target).hasClass("draggable-word")) && !draggedWordElement) {
            if ($(e.target).hasClass("draggable-word")) {
                draggedWord = $(e.target).text();
                createDraggedWord(e, draggedWord);
            } else {
                draggedWord = selectedWord;
            }
            e.stopPropagation();
            dragMoved = false;
            dragInitialX = e.pageX;
            dragInitialY = e.pageY;
            if (!$("#graph").has($(e.target)).length) {
                focusOnWord(draggedWord);
                lookUpWordInDictionary(draggedWord);
            }
        } else {
            draggedWord = null;
        }
    };
    var pointerMoveHandler = (e) => {
        pageX = e.pageX;
        pageY = e.pageY;
        if (draggedWord) {
            e.stopPropagation();
            if (!draggedWordElement) {
                createDraggedWord(e, draggedWord);
            }
            if (e.pageX != dragInitialX || e.pageY != dragInitialY)
                dragMoved = true;
            draggedWordElement.css("left", "" + (e.pageX - Math.floor(draggableWordWidth / 2)) + "px");
            draggedWordElement.css("top", "" + (e.pageY - Math.floor(draggableWordHeight / 2)) + "px");
        }
    };
    var pointerUpHandler = (e) => {
        pageX = e.pageX;
        pageY = e.pageY;
        if (draggedWord) {
            var word = draggedWord;
            $("#dragged-word-container").empty();
            draggedWord = null;
            draggedWordElement = null;
            var el = document.elementFromPoint(e.pageX, e.pageY);
            // console.log(el);
            // drop
            if ($("#graph").has($(el)).length) {
                if (graph)
                    focusOnWord(word);
                // searchConceptNet(word);

            } else if ($("#design-concept-map").has($(el)).length) {
                comb = word.split('-');
                if (comb.length != 2) {
                    showAlert("Please insert combination of Word1 and Word2", "danger");
                    return;
                }
                word1 = comb[0];
                word2 = comb[1];
                word3 = '';
                word4 = '';
                updateCharacterSpace(1);
                $('#word3').css('visibility', 'hidden');
                $("#word3-text").css("display", "block");
                $('#word4').css('visibility', 'hidden');
                $("#word4-text").css("display", "block");
                $('#search-w3w4-space-button').css('visibility', 'visible');
            } else if ($(".heading").has($(el)).length) {
            } else if ($("#control-panel").has($(el)).length) {
                addWordToWordPool(word);
            } else if ($("#lower-pane").has($(el)).length) {
                addWordToWordPool(word);
            }
        }
    };
    var options = { capture: true };
    document.addEventListener("pointerdown", pointerDownHandler, options);
    document.addEventListener("pointermove", pointerMoveHandler, options);
    document.addEventListener("pointerup", pointerUpHandler, options);

    $("#undo-set-word-button").on("click", function (e) {
        undoSetWord();
    });


    if (withDictionary) {
        $("#clear-button").on("click", function () {
            $("#graph").empty();
        });

        defineTextBoxWithButton("#search-box", "#search-button", wordFilter, function(word) {
           adjectiveChecker(word, lookUpWordInDictionary);
        });
    } else {
        setComponentSizes();
        // initializeGraph();

        $("#graph-2d-button").on("click", function () {
            if (numDimensions == 3) {
                toggleDimention();
            }
        });

        $("#graph-3d-button").on("click", function () {
            if (numDimensions == 2) {
                toggleDimention();
            }
        });

        $("#zoom-to-fit-button").on("click", function () {
            // console.log(graphData);
            if (graph)
                graph.zoomToFit(2000, 10, () => true);
        });

        $("#debug-button").on("click", function () {
            $("#debug-button").toggleClass("btn-outline-secondary");
            $("#debug-button").toggleClass("btn-secondary");
            debugMode = !debugMode;
        });

        $("#clear-button").on("click", function () {
            $("#graph").empty();
        });

        defineTextBoxWithButton("#search-box", "#search-button", wordFilter, function(word) {
           adjectiveChecker(word, searchConceptNet);
        });

        setInterval(function () {
            if (appBusy)
                return;
            if (!isCacheBeingLoaded && newWords.length > 0) {
                isCacheBeingLoaded = true;
                var word = newWords.pop();
                $.getJSON("https://yuriom.pythonanywhere.com/api/list-related-adjectives?word=" + word,
                    function (data) {
                        (relatedWordsCache[word]) = data;
                        isCacheBeingLoaded = false;
                    });
            }
        }, 100);
    }

    window.onhashchange = function () {
        window.location.reload();
    };

    $("body").css("visibility", "visible");
    $("body").css("pointer-events", "auto");

    setInterval(function () {
        setComponentSizes();
    }, 100);

    --appBusy;
}

$(document).ready(init);
